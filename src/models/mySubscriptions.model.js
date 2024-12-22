import { mongoose, Schema } from "mongoose"

const mySubscriptionSchema = new Schema(
    {
        channels: [{
            type: mongoose.Types.ObjectId,
            ref: "User"
        }],
        subscribedBy: {
            type: mongoose.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

export const mySubscriptions = mongoose.model("MySubscriptions", mySubscriptionSchema)