import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideosToPlaylist, createPlaylist, deletePlaylist, getAllPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router();


// secure routes

router.route('/getPlaylists').get(verifyJWT, getAllPlaylist)
router.route('/createPlaylist').post(verifyJWT, createPlaylist)
router.route('/addToPlaylist').post(verifyJWT, addVideosToPlaylist)
router.route('/updatePlaylist').post(verifyJWT, updatePlaylist)
router.route('/deletePlaylist').delete(verifyJWT, deletePlaylist)


export default router