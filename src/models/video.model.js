import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        video: {
            type: String,  //cloudinary url string
            required: true
        },
        thumbnail: {
            type: String,  //cloudinary url string
            required: true
        },
        title: {
            type: String,
            tirm: true,
            required: true
        },
        description: {
            type: String,
            tirm: true,
            required: true
        },
        duration: {
            type: Number,
            required: true
        },
        liked: {
            type: Boolean,
            default: false
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: false
        },
    },
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema);