import mongoose from "mongoose"

const LikesSchema = new mongoose.Schema({
    count: {
        type: Number,
        required: true
    },
    postId: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

LikesSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        return ret
    }
})

const Likes = mongoose.model('Likes', LikesSchema)
export default Likes