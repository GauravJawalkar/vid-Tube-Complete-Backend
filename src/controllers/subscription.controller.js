import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { Subscription } from '../models/subscription.model.js';
import { mySubscriptions } from "../models/mySubscriptions.model.js";


const channel = asyncHandler(async (req, res) => {

    const { channelId } = req.body;

    if (channelId.trim() === "") {
        throw new ApiError(400, "Please either enter channelId or channelName")
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please Login")
    }

    const loggedUser = user._id

    const checkIfChannelHasSubscribers = await Subscription.find(
        {
            channel: channelId
        }
    )

    const subscriptionId = checkIfChannelHasSubscribers?.[0]?._id;

    let subscribe;
    let subChannel;
    let checkIfAlreadySubscribed;

    const mySubscris = await mySubscriptions.find(
        {
            subscribedBy: loggedUser
        }
    )


    if (checkIfChannelHasSubscribers.length == 0) {
        subscribe = await Subscription.create(
            {
                subscriber: loggedUser,
                channel: channelId
            }
        )

        if (mySubscris.length == 0) {
            subChannel = await mySubscriptions.create(
                {
                    channels: channelId,
                    subscribedBy: loggedUser
                }
            )
        }

        if (mySubscris.length !== 0) {
            const mySubChannelsId = mySubscris[0]?._id

            subChannel = await mySubscriptions.findByIdAndUpdate(mySubChannelsId,
                {
                    $push: {
                        channels: channelId
                    }
                }
            )
        }

    } else {
        checkIfAlreadySubscribed = await checkIfChannelHasSubscribers[0].subscriber.includes(loggedUser)

        if (checkIfAlreadySubscribed) {
            throw new ApiError(400, "already subscribed to this channel")
        }

        subscribe = await Subscription.findByIdAndUpdate(subscriptionId,
            {
                $push: {
                    subscriber: loggedUser,
                }
            }
        )

        if (mySubscris.length == 0) {
            subChannel = await mySubscriptions.create(
                {
                    channels: channelId,
                    subscribedBy: loggedUser
                }
            )
        }

        if (mySubscris.length !== 0) {
            const mySubChannelsId = mySubscris[0]?._id

            subChannel = await mySubscriptions.findByIdAndUpdate(mySubChannelsId,
                {
                    $push: {
                        channels: channelId
                    }
                }
            )
        }
    }

    if (!subscribe) {
        throw new ApiError(400, "Failed to subscribe the channel")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { subChannel }))


})

const totalSubscribers = asyncHandler(async (req, res) => {

    const { channelId } = req.body

    if (!channelId.trim()) {
        throw new ApiError(400, "channelId is needed to find out the subscribers")
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please Login")
    }

    const subscriptions = await Subscription.find({
        channel: channelId
    });

    console.log(subscriptions)
    if (!subscriptions) {
        throw new ApiError(400, "This channel doesnt has any subscribers yet")
    }

    const totalSubscribers = subscriptions[0].subscriber.length;

    if (!totalSubscribers) {
        throw new ApiError(400, "Failed to fetch subscribers")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { totalSubscribers }))


})

const getMySubscribedChannels = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id)


    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please Login")
    }

    const loggedUser = user?._id;

    const subscribedChannels = await mySubscriptions.find(
        {
            subscribedBy: loggedUser
        }
    )

    if (subscribedChannels.length == 0) {
        throw new ApiError(400, "You havent subscribed to any channels yet")
    }

    const mySubscribedChannels = subscribedChannels[0]?.channels;

    return res
        .status(200)
        .json(new ApiResponse(200, { mySubscribedChannels }))

})

export { channel, totalSubscribers, getMySubscribedChannels }