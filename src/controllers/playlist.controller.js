import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js"
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description, videoId } = req.body;

    if ([name, description, videoId].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400, 'Unauthorized User : Please Login')
    }

    const playlistOwnerId = user._id

    const createdPlaylist = await Playlist.create(
        {
            name: name,
            description: description,
            videos: [videoId],
            owner: playlistOwnerId
        }
    )

    if (!createPlaylist) {
        throw new ApiError(400, "Failed to create the playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { createdPlaylist }))
})

const getAllPlaylist = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please Login")
    }

    const playlistOwnerId = user._id;

    const checkPlaylist = await Playlist.aggregate(
        [
            // Stage 1
            {
                $match: {
                    owner: playlistOwnerId
                }
            }
        ]
    )

    if (!checkPlaylist) {
        throw new ApiError(400, "There Are No Playlist. Please Create One")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { checkPlaylist }))
})

const addVideosToPlaylist = asyncHandler(async (req, res) => {
    const { newVideoId, playlistId } = req.body

    if (!(newVideoId && playlistId)) {
        throw new ApiError(400, "New Video Id is required to add it in playlist")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please Login")
    }

    const playlistOwnerId = user._id;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    let updatedPlaylist;

    if (playlistOwnerId.equals(playlist.owner)) {
        updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
            {
                $push: {
                    videos: newVideoId
                }
            },
            {
                new: true
            }
        )
    }

    if (!updatedPlaylist) {
        throw new ApiError(400, "Failed to add video to the playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { updatedPlaylist }))

})

const updatePlaylist = asyncHandler(async (req, res) => {

    const { playlistId, name, description } = req.body;

    if ([playlistId, name, description].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All the fields are required")
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please Login")
    }

    const loggedUserId = user._id;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    const playlistOwner = playlist.owner;

    let updatedPlaylist;
    if (playlistOwner.equals(loggedUserId)) {
        updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
            {
                $set: {
                    name: name,
                    description: description
                }
            }
        )
    }

    if (!updatedPlaylist) {
        throw new ApiError(400, "Failed to update the playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { updatedPlaylist }))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.body;

    if (!playlistId) {
        throw new ApiError(400, "playlist id is required to delete the playlist")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please Login")
    }

    const loggedUser = user._id;

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist with given id not found")
    }

    const playlistOwnerId = playlist.owner;

    let deletePlaylist;
    if (playlistOwnerId.equals(loggedUser)) {
        deletePlaylist = await Playlist.findByIdAndDelete(playlistId)
    }

    if (!deletePlaylist) {
        throw new ApiError(400, "Failed to delete the playlist")
    }

    return res
        .status(200)
        .json(new ApiRes(200, "Playlist deletd SuccessFully"))

})

export { createPlaylist, getAllPlaylist, addVideosToPlaylist, updatePlaylist, deletePlaylist }