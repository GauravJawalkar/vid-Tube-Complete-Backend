import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { getAllTweets, getYourTweets, postTweet, updateTweet, deleteTweet } from "../controllers/tweet.controller.js";

const router = Router()

router.route('/getAllTweets').get(getAllTweets)

// Secure Routes
router.route('/postTweet').post(verifyJWT, postTweet)
router.route('/getYourTweets').get(verifyJWT, getYourTweets)
router.route('/updateTweet').post(verifyJWT, updateTweet)
router.route('/deleteTweet').delete(verifyJWT, deleteTweet)

export default router;