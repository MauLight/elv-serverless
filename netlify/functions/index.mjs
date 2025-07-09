import mongoose from 'mongoose'
import Likes from '../model/likes'

const mongoDB = process.env.MONGOURI
console.log(mongoDB)

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, PUT, OPTIONS"
}

const cached = global.mongoose || { conn: null, promise: null }

async function dbConnect() {
    if (cached.conn) {
        return cached.conn
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(mongoDB, {
            bufferCommands: false,
        }).then(m => m)
    }
    cached.conn = await cached.promise
    return cached.conn
}

export const handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: 'OK'
        }
    }

    try {
        await dbConnect()
        console.log('Connected')

        if (event.httpMethod === 'GET') {
            const id = event.queryStringParameters.postId
            const likes = await Likes.find({ postId: id })

            return {
                statusCode: likes ? 200 : 404,
                headers: corsHeaders,
                body: JSON.stringify(
                    likes || { error: "Resource does not exist in the database." }
                )
            }
        }

        if (event.httpMethod === 'POST') {
            const { postId } = JSON.parse(event.body)
            const currLike = await Likes.findOneAndUpdate(
                { postId },
                { $inc: { count: 1 } },
                { new: true }
            )

            if (currLike) {
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify(currLike)
                }
            }

            const newLike = await Likes.create({ postId, count: 1 })

            return {
                statusCode: 201,
                headers: corsHeaders,
                body: JSON.stringify(newLike)
            }
        }

        if (event.httpMethod === 'PUT') {
            const { postId } = JSON.parse(event.body)
            const currLike = await Likes.findOneAndUpdate(
                { postId, count: { $gt: 0 } },
                { $inc: { count: -1 } },
                { new: true }
            )

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(currLike)
            }
        }

        // 🚫 Unsupported HTTP method
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        }

    } catch (error) {
        console.error('Function error:', error)

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: error instanceof Error ? error.message : 'Internal Server Error'
            })
        }
    }
}