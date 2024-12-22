import { countTotalLikes, removeLikeVideo, getAllLikedVideos, likeVideo } from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { Router } from "express"

const router = Router();


// secure routes
router.route('/video').post(verifyJWT, likeVideo)
router.route('/getLikedVideos').get(verifyJWT, getAllLikedVideos)
router.route('/totalLikes').post(countTotalLikes)
router.route('/removeLikedVideo').delete(verifyJWT, removeLikeVideo)


export default router