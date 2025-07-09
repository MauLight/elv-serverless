import mongoose from 'mongoose'
import Likes from '../model/likes'

const mongoDB = process.env.MONGOURI
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
}

let connection = null
async function connectToDB() {
    if (!connection) {
        connection = mongoose.connect(mongoDB)
        await connection
    }
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
        await connectToDB()

        if (event.httpMethod === 'GET') {
            const id = event.queryStringParameters.postId

            const likes = await Likes.find({ postId: id });
            if (likes) {
                return {
                    statusCode: 200,
                    body: JSON.stringify(likes),
                }
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: "Resource does not exist in the database." })
                }
            }
        }

        if (event.httpMethod === 'POST') {
            const { postId } = JSON.parse(event.body)
            const currLike = await Likes.findOneAndUpdate({ postId }, { $inc: { count: 1 } }, { new: true })

            if (currLike) {
                return {
                    statusCode: 200,
                    body: JSON.stringify(currLike),
                }
            } else {

                const newLike = await Likes.create({
                    postId,
                    count: 1
                })

                return {
                    statusCode: 201,
                    body: JSON.stringify(newLike)
                }
            }
        }

        if (event.httpMethod === 'PUT') {
            const { postId } = JSON.parse(event.body)
            const currLike = await Likes.findOneAndUpdate({ postId, count: { $gt: 0 } }, { $inc: { count: -1 } }, { new: true })

            return {
                statusCode: 200,
                body: JSON.stringify(currLike),
            }
        }


    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message)
        } else {
            console.error(error)
        }
    }

}