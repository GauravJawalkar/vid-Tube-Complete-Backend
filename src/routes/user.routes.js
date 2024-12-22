import { Router } from "express";
import { registerUser, loginUser, logoutUser, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, refreshAccessToken, getUserChannelProfile } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
    // Middleware for uploading the avatar and coverImage files
    upload.fields(
        [
            {
                name: "avatar",
                maxCount: 1
            },
            {
                name: "coverImage",
                maxCount: 1
            }
        ]
    ),
    registerUser)

router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)

// Secured Routes not everyone should be able to access it
// verifyJWT token that comes from auth middleware is inserted so that it can check only logged in user gets access to the routes below
router.route('/logout').post(verifyJWT, logoutUser)
router.route("/changePassword").post(verifyJWT, changeCurrentPassword)
router.route("/getUser").get(verifyJWT, getCurrentUser)
router.route("/updateAccountDetails").post(verifyJWT, updateAccountDetails)
router.route("/updateAvatar").post(upload.single('updatedAvatar'), verifyJWT, updateUserAvatar)
router.route("/updateCoverImage").post(upload.single('updatedCoverImage'), verifyJWT, updateUserCoverImage)
router.route("/getChannelProfile").get(verifyJWT, getUserChannelProfile)

export default router