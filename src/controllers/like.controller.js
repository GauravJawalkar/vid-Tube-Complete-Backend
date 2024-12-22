import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { Like } from "../models/like.model.js";


const likeVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.body;

    if (!videoId) {
        throw new ApiError(400, "videoId is required to like the video")
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(400, "unauthorized user : please login")
    }

    const loggedUser = user._id

    const likedAlreadyCheck = await Like.find(
        {
            video: videoId,
            likedBy: loggedUser
        }
    )

    let likedVideo;

    if (likedAlreadyCheck.length == 0) {
        likedVideo = await Like.create(
            {
                video: videoId,
                likedBy: loggedUser,
            }
        )
    } else {
        throw new ApiError(400, "You Have Already Liked this video")
    }


    if (!likedVideo) {
        throw new ApiResponse(400, "Failed to like the video")
    }

    likedVideo.likedBy

    return res
        .status(200)
        .json(new ApiResponse(200, { likedVideo }))


})

const getAllLikedVideos = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please Login")
    }

    const loggedUserId = user._id

    const likedVideos = await Like.find(
        {
            likedBy: loggedUserId
        }
    )

    if (!likedVideos) {
        throw new ApiError(400, "No Liked Videos Found")
    }

    const totalLikedVideos = likedVideos.length
    console.log(totalLikedVideos)
    return res
        .status(200)
        .json(new ApiResponse(200, { likedVideos }))

})

const countTotalLikes = asyncHandler(async (req, res) => {

    const { videoId } = req.body;

    if (!videoId) {
        throw new ApiError(400, "videoId is required");

    }

    const totalLikes = await Like.find(
        {
            video: videoId
        }
    )

    if (!totalLikes) {
        throw new ApiError(400, "0 Likes For this video")
    }

    const finalLikeCount = totalLikes.length

    return res
        .status(200)
        .json(new ApiResponse(200, { "totalLikes:": finalLikeCount }))

})

const removeLikeVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.body

    if (!videoId) {
        throw new ApiError(400, "VideoId field is required")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please Login")
    }

    const loggedUser = user._id;

    const checkIfUserHasLikedBefore = await Like.find(
        {
            video: videoId,
            likedBy: loggedUser
        }
    )

    if (checkIfUserHasLikedBefore.length == 0) {
        throw new ApiError(400, "You never Liked this video before")
    }

    const LikeId = checkIfUserHasLikedBefore[0]._id

    if (!LikeId) {
        throw new ApiError(400, "You never Liked this video ")
    }

    let disLike;

    if (checkIfUserHasLikedBefore.length > 0) {
        disLike = await Like.findByIdAndDelete(LikeId)
    }

    return res.status(200)
        .json(new ApiResponse(200, { disLikeVideo: disLike }))




})
export { likeVideo, getAllLikedVideos, countTotalLikes, removeLikeVideo }