import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadVideo, getAllPublishedVideos, getAllChannelVideos, updateUploadedVideo, updateVideoThumbnail, deleteVideo } from '../controllers/video.controller.js'

const router = Router();

router.route("/uploadVideo").post(verifyJWT,
    upload.fields([
        { name: 'videoFile', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
    ]), uploadVideo)


// Fetch all videos that are published
router.route('/getAllVideos').get(getAllPublishedVideos)

// Secure Routes
router.route('/getMyChannelVideos').get(verifyJWT, getAllChannelVideos)
router.route('/updateVideo').post(verifyJWT, upload.single('updatedVideo'), updateUploadedVideo)
router.route('/updateThumbnail').post(verifyJWT, upload.single('updatedThumbnail'), updateVideoThumbnail)
router.route('/deleteVideo').post(verifyJWT, deleteVideo)


export default router