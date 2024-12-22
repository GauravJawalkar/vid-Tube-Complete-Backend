import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { channel, totalSubscribers, getMySubscribedChannels } from "../controllers/subscription.controller.js";


const router = Router()


// Secured Routes

// Subscribe a channel
router.route('/channel').post(verifyJWT, channel)
router.route('/channelSubscribers').post(verifyJWT, totalSubscribers)
router.route('/getMyChannels').get(verifyJWT, getMySubscribedChannels)

export default router