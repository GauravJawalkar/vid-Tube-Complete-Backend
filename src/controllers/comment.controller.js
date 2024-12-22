import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";


const postComment = asyncHandler(async (req, res) => {

    const { videoId, commentContent } = req.body;

    if (!videoId) {
        throw new ApiError(400, "VideoId is missing")
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please log in again")
    }

    const commentOwnerId = user?._id

    const postedComment = await Comment.create(
        {
            content: commentContent,
            video: videoId,
            owner: commentOwnerId
        }
    )

    if (!postedComment) {
        throw new ApiError(400, `Failed to post the comment on the video of id ${videoId}`)
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { postedComment: postedComment }))

})

const getCommentForSpecificVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.body;

    if (!videoId) {
        throw new ApiError(400, 'videoId is required')
    }

    const Comments = await Comment.find({ video: videoId })

    const totalComments = await Comment.countDocuments({ video: videoId });

    console.log(`Total Comments For this video : ${totalComments}`);

    if (!Comments) {
        throw new ApiError(400, "No Comments found for this video");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { commentsForVideo: Comments }))

})

const updateComment = asyncHandler(async (req, res) => {

    const { videoId, newComment, commentId } = req.body;

    if ([videoId, newComment, commentId].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All the fields are required")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400, "Unauthorized user: please login")
    }

    const loggedUserId = user._id

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(400, "Comment not found")
    }

    const commentOwnerId = comment.owner

    let updatedComment;

    if (commentOwnerId.equals(loggedUserId)) {
        updatedComment = await Comment.findByIdAndUpdate(commentId,
            {
                $set: {
                    content: newComment,
                }
            },
            {
                new: true
            }
        )
    } else {
        throw new ApiError(400, "You can only update the comments that you have posted")
    }


    if (!updatedComment) {
        throw new ApiError(400, `Failed To update the comment with comment id ${commentId}`)
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { updateComment: updatedComment }))


})

const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.body;

    if (!commentId) {
        throw new ApiError(400, "Comment id is required");
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400, "Unauthorized User : Please Login")
    }

    const loggedInUserId = user._id

    const commentOwner = await Comment.findById(commentId)

    const commentOwnerId = commentOwner.owner;

    let deleteComment;

    if (loggedInUserId.equals(commentOwnerId)) {
        deleteComment = await Comment.findByIdAndDelete(commentId);
    }

    if (!deleteComment) {
        throw new ApiError(400, "Failed to delete the comment")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Comment deleted Successfully"))
})

export { postComment, getCommentForSpecificVideo, updateComment, deleteComment }