import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from '../models/video.model.js'
import { User } from "../models/user.model.js";
import mongoose from "mongoose";


const uploadVideo = asyncHandler(async (req, res) => {

    // Destructuring the fields what i want from the req.body
    const { title, description, isPublished } = req.body;


    // Validating the fiels i got from the req.body exist or not
    if (!title && description) {
        throw new ApiError(400, "Given Fields are required for uploading the video")
    }

    // uploading the video and thumbnail file to cloudinary
    const videoFileLocalPath = req.files.videoFile[0]?.path;
    const thumbnailLocalPath = req.files.thumbnail[0]?.path;

    // Validate if the paths exist of videoFileLocalPath
    if (!videoFileLocalPath) {
        throw new ApiError(400, 'videoFile to upload is missing');
    }

    // Validate if the paths exist of thumbnailLocalPath
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail File is missing")
    }

    // upload the files on cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    const VideoFile = await uploadOnCloudinary(videoFileLocalPath);

    // console.log("videoFile Object", VideoFile)
    // console.log("thumbnail Object", thumbnail)

    // Accessing the duration of the video form the videoFile that is uploaded
    const videoDuration = await VideoFile.duration;

    // Validating if the videoDuration Exist
    if (!videoDuration) {
        throw new ApiError(400, "Unable to fetch video duration")
    }


    // Creating a new Video Document in the database and saving the video and thumbnail url form cloudinary
    const video = await Video.create(
        {
            title,
            description,
            isPublished: true,
            video: VideoFile?.secure_url,
            thumbnail: thumbnail?.secure_url,
            duration: videoDuration,
            views: 0,
            owner: new mongoose.Types.ObjectId(req.user?._id),
        }
    )

    // Returing the response after successfully uploading and creating the video in the database
    return res
        .status(200)
        .json(new ApiResponse(200, { video }))

})

// These videos are for everyone to access because all of these are published videos
const getAllPublishedVideos = asyncHandler(async (req, res) => {
    // Get all the videos from the database which are published
    const videos = await Video.find({ isPublished: true }).sort({ video: -1 })

    // Validatig if there are any videos
    if (!videos) {
        throw new ApiError(400, "No Published Videos found")
    }

    // return the response when videos are fetched
    return res
        .status(200)
        .json(new ApiResponse(200, { videos }))
})

// Fetch all the published and unPublished videos of the users channel
const getAllChannelVideos = asyncHandler(async (req, res) => {

    // Finding the user who is loggede in 
    const user = await User.findById(req.user?._id)

    // Accessing the users _id for further checking if it matches the owner id form the videos
    const ownerId = user?._id

    // Validating if the user is logged in or not
    if (!user) {
        throw new ApiError(400, "Unauthorized User : Login First")
    }

    // finding the video by checking the user._id is same as the owner id. Only those videos will get displayed whose owner has the same id as the user
    const userChannelVideos = await Video.aggregate([
        // Stage 1
        {
            $match: {
                owner: ownerId
            }
        },
        // Stage 2
        {
            $sort: {
                video: -1
            }
        }
    ])


    // validating if there are any videos in the users channel
    if (!userChannelVideos) {
        throw new ApiError(400, "User Has not posted any videos on his/her channel")
    }

    // returnig response with the videos of the logged in user's channel
    return res
        .status(200)
        .json(new ApiResponse(200, { videos: userChannelVideos }))

})

const updateUploadedVideo = asyncHandler(async (req, res) => {

    // Accessing the { findVideoByTitle, updateTitle, updateDescription } from the req.body to find and update a particular video
    const { findVideoByTitle, updateTitle, updateDescription } = req.body

    // Finding the particular logged in user
    const user = await User.findById(req.user?.id)

    // Only fetching/filtering those videos from the database that are uploaded by the logged in user 
    const video = await Video.aggregate(
        [
            {
                $match: {
                    title: findVideoByTitle,
                    owner: user._id,
                }
            }
        ]
    )

    // Accessing the id of the fetched/filtered video
    const videoId = video[0]?._id;

    //check if there are no videos in the array
    if (!video.length) {
        throw new ApiError(400, "There are no videos found to update")
    }

    // Setting the video file that is to be updated ->{it is done with the help of multer middleware}
    const updateVideoPath = req.file?.path

    // Validate if the update video file exist
    if (!updateVideoPath) {
        throw new ApiError(400, "Update Video File is missing")
    }

    // upload the new video file to cloudinary
    const updateVideo = await uploadOnCloudinary(updateVideoPath);

    // validate if the new video file is uploaded on cloudinary
    if (!updateVideo) {
        throw new ApiError(400, "Failed to upload the video on cloudinary")
    }

    // fetch the new video duration of the updated video
    const updateVideoDuration = await updateVideo.duration

    // update the video by finding it with its id
    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                title: updateTitle,
                description: updateDescription,
                video: updateVideo.secure_url,
                duration: updateVideoDuration,
            }
        },
        {
            new: true,
        }
    )

    // return response of the updated Video
    return res
        .status(200)
        .json(new ApiResponse(200, { updatedVideo: updatedVideo }))

})

const updateVideoThumbnail = asyncHandler(async (req, res) => {

    //Accessing findingTheVideoByTitle from req.body
    const { findVideoByTitle } = req.body;

    // Validate if the title to find the video exist or not
    if (!findVideoByTitle) {
        throw new ApiError(400, "Please enter a valid title to find the video")
    }

    // Find the logged in user by its id
    const user = await User.findById(req.user?._id);

    // validate if the user is logged in or not
    if (!user) {
        throw new ApiError(400, "Unauthorized Access login first");

    }

    // Fetch the user._id To find if there are any videos of the logged in user 
    const videoOwnerId = user._id;


    // Finding/Filtering the video by title and logged in user
    const video = await Video.aggregate(
        [
            {
                $match: {
                    title: findVideoByTitle,
                    owner: videoOwnerId
                }
            }
        ]
    )

    // validating if there are any videos to update the thumbnail
    if (!video.length) {
        throw new ApiError(400, "No Videos found to update the thumbnail");

    }

    // Accessing the video id from the array of the videos got from the finding and filtering using pipelines
    const videoId = video[0]?._id;

    // new thumbnial file 
    const updateThumbnailPath = req.file?.path;

    // Validate of the new thumbnail file exist
    if (!updateThumbnailPath) {
        throw new ApiError(400, "thumbnail file is missing")
    }

    // upload the new thumbnail file on cloudinary
    const newThumbnail = await uploadOnCloudinary(updateThumbnailPath);

    // validate if the new thumbnail file is uploaded on cloudinary
    if (!newThumbnail) {
        throw new ApiError(400, "Failed to upload the video on cloudinary")
    }

    // find the video by videoId --> {extracted from the pipeline above} and update the old thumbnail with new thumbnail and save in the database
    const updatedThumbnail = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                thumbnail: newThumbnail.secure_url,
            }
        },
        {
            new: true
        }
    )

    // validate if the thumbnail is updated and saved in the database
    if (!updatedThumbnail) {
        throw new ApiError(400, "Failed to update the video with new thumbnail")
    }

    // return response of the updated thumbnail
    return res
        .status(200)
        .json(new ApiResponse(200, { updatedThumbnail }))

})

const deleteVideo = asyncHandler(async (req, res) => {

    // Extract the findVideoByTitle from the req.body
    const { findVideoByTitle } = req.body

    // find the user from the database who is logged in 
    const user = await User.findById(req.user?._id)

    // Validate if the user is logged in or not
    if (!user) {
        throw new ApiError(400, "Unauthorized user : Please login in first")
    }

    // extracting the user._id from the logged in user to find only the users videos
    const ownerId = user?._id;

    // Find videos from the database which matches the findVideoByTitle based on logged in user
    const video = await Video.aggregate(
        [
            // Stage 1
            {
                $match: {
                    title: findVideoByTitle,
                    owner: ownerId
                }
            }
        ]
    )

    // Validate if video exist in the array
    if (!video.length) {
        throw new ApiError(400, "There is no video with the specific title to delete")
    }

    // Extracting the videoId form the video got from the aggregation pipeline above
    const videoId = video[0]?._id;

    // delete the video from the database by its id
    const deletedVideo = await Video.findByIdAndDelete(videoId)

    // validate if the video is deleted or not from the database
    if (!deletedVideo) {
        throw new ApiError(400, "Failed to delete the video")
    }

    // Return the response when the video is deleted
    return res
        .status(200)
        .json(new ApiResponse(200, "Video Deleted Successfully"))

})


export {
    getAllPublishedVideos, uploadVideo, getAllChannelVideos, updateUploadedVideo, updateVideoThumbnail, deleteVideo
}