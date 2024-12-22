import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Tweet } from "../models/tweet.model.js"


const postTweet = asyncHandler(async (req, res) => {
    const { tweetContent } = req.body;

    if (!tweetContent) {
        throw new ApiError(400, "Please enter something to tweet")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please Login")
    }

    const tweetOwnerId = user._id;

    const tweet = await Tweet.create(
        {
            content: tweetContent,
            owner: tweetOwnerId,
            posted: true
        }
    )

    if (!tweet) {
        throw new ApiError(400, "Failed to post the tweet")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { tweet }))

})

const getAllTweets = asyncHandler(async (req, res) => {

    const fetchAllTweets = await Tweet.find(
        {
            posted: true
        }
    )

    if (!fetchAllTweets) {
        throw new ApiError(400, "No tweets found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { fetchAllTweets }))

})

const getYourTweets = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please Login")
    }

    const tweetOwnerId = user._id;

    const tweet = await Tweet.aggregate(
        [
            {
                $match: {
                    owner: tweetOwnerId
                }
            },
            {
                $sort: {
                    tweet: -1
                }
            }
        ]
    )

    if (!tweet) {
        throw new ApiResponse(400, "You haven't posted anything yet")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { tweet }))

})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId, newTweetContent } = req.body;

    if (!tweetId) {
        throw new ApiError(400, "Tweet id is required")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please Login")
    }

    const loggedUserId = user._id;

    let updatedTweet;

    const tweet = await Tweet.findById(tweetId)

    const tweetOwnerId = tweet?.owner

    if (loggedUserId.equals(tweetOwnerId)) {
        updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
            {
                $set: {
                    content: newTweetContent,
                }
            },
            {
                new: true
            }
        )
    } else {
        throw new ApiError(400, "You can only update the tweet of your own account");
    }



    if (!updatedTweet) {
        throw new ApiError(400, "No Tweets Found To update")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { updatedTweet }))


})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.body;

    if (!tweetId) {
        throw new ApiError(400, "Tweet id is required")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please Login")
    }

    const loggedUserId = user._id;

    let deletedTweet;

    const tweet = await Tweet.findById(tweetId)

    const tweetOwnerId = tweet?.owner

    if (loggedUserId.equals(tweetOwnerId)) {
        deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    } else {
        throw new ApiError(400, "You can only delete the tweet of your account");
    }

    if (!deletedTweet) {
        throw new ApiError(400, "Failed to delete the tweet")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Tweet deleted Successfully"))


})

export { postTweet, getAllTweets, getYourTweets, updateTweet, deleteTweet }