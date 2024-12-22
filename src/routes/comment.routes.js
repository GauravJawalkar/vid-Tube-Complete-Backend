import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { postComment, getCommentForSpecificVideo, updateComment, deleteComment } from "../controllers/comment.controller.js";


const router = Router();

// only secure routes
router.route('/postComment').post(verifyJWT, postComment)
router.route('/getCommentForSpecificVideo').post(verifyJWT, getCommentForSpecificVideo)
router.route('/updateComment').post(verifyJWT, updateComment)
router.route('/deleteComment').delete(verifyJWT, deleteComment)

export default router