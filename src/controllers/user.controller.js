import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import mongoose from "mongoose"

// Helper function to create Tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        // Finding the user in the database by it's userId
        const user = await User.findById(userId);

        // Check if the user exist or not in the database
        if (!user) {
            throw new ApiError(404, "Not able to find the user in the database")
        }

        // Generate the accessToken and refreshToken for the user that is in the database
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Assigning the refreshToken created here to the refreshToken of the user in the database 
        user.refreshToken = refreshToken;

        // save the changes to the database
        await user.save({ validateBeforeSave: false })

        // Returning the accessToken and refreshToken when the function gets executed
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, `Something went wrong while generating access and refresh token:`, error)
    }

}

const registerUser = asyncHandler(async (req, res) => {

    // Destructuring fullname,email,username,password from the req.body
    const { fullname, email, username, password } = req.body

    // Validating if all fields are not empty
    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields Are required")
    }

    // Queirng the database to find if there is any user with the same username and email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    // If the user already exist in the database throwing error
    if (existedUser) {
        throw new ApiError(409, "User Already Exist with the username & email in the database")
    }

    // Getting the path of avatar and coverImage Files-->{multer gives access to "files"}
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverLocalPath = req.files?.coverImage[0]?.path

    // Checking if the avatarLocalPath is available or not
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    // Uploading the images on cloudnary using the uploadOnCloudinary() function
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    // Checking the coverLocalPath if it exists then uploading it on cloudinary else it is empty string
    let coverImage = "";
    if (coverLocalPath) {
        coverImage = await uploadOnCloudinary(coverLocalPath)
    }

    // Creating a new User in the database
    const user = await User.create(
        {
            fullname,
            username: username.toLowerCase(),
            email,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url,
        }
    )

    // Checking if the user is created in the database by verifing its id-->{removing the password and refreshToken field from the response of the database}
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    // Throwing an error if the user is not created or registered in the database
    if (!createdUser) {
        throw new ApiError(500, "User not created in the database");
    }

    // Returning a response when the user is successfully registered in the database
    return res
        .status(201)
        .json(new ApiResponse(201, "User registerd successfully"))
})

const loginUser = asyncHandler(async (req, res) => {

    // Destructure the email,username and password form the req.body-->{raw body parser}
    const { email, password, username } = req.body

    // Checking if the email,password are there or not
    if ([email, username, password].some(field => field?.trim() === "")) {
        throw new ApiError(409, "Email,username and password is required")
    }

    // Find the user in the database either by email or username
    const user = await User.findOne({ $or: [{ email }, { username }] })

    // console.log(`user logged in the database :`, user);

    // Check if the user dont exist
    if (!user) {
        throw new ApiError(404, "User with this username || email does'nt exist in the database")
    }

    // validate password using  the isPasswordCorrect function we created in the model by passing the password that we destructured from the body above
    const isPasswordValid = await user.isPasswordCorrect(password)


    // Check if the password is not valid
    if (!isPasswordValid) {
        throw new ApiError(400, "Password is not valid");
    }

    // passing the user._id of the user from the database to the generateAccessAndRefreshToken() so that it can generate the accessToken,refreshToken which is further destructured from the generateAccessAndRefreshToken()-->{it return the accessToken,refreshToken in its function} function.
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Quering the database to fing the User by its id and remove the password and refreshToken from the user object here
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // check 
    if (!loggedInUser) {
        throw new ApiError(400, "Cannot find the logged in user")
    }

    // setting up the options object
    const options = {
        httpOnly: true,
        secure: true,
    }

    // return response setting up cookies for access&refershToken
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User Logged In Successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    // accessing the refreshToken from the cookies and assigning it to the variable
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    // check if the incomingRefreshToken is not present
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh Token is required")
    }


    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access token refreshed successfuly"
                )
            )
    } catch (error) {
        throw new ApiError(400, "Something went wrong while creating the refreshToken")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    // *NOTE--> changing current password means the user is already logged in and want to change the password

    // Destructuring oldPassword, newPassword from the req.body
    const { oldPassword, newPassword } = req.body;

    // finding the user from the database by its id
    const user = await User.findById(req.user?._id);


    // checking the password by passing it to the pre-hook of the user model where it checks if the password entered is same or not 
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    // Check of password validation
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid Old Password");
    }

    // assigning the new password to the users initial password
    user.password = newPassword;

    await user.save({ validateBeforeSave: true })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(
    async (req, res) => {

        // We get this req.user from the verifyJWT middleware we have made which holds up the current user
        return res
            .status(200)
            .json(new ApiResponse(200, {
                user: req.user
            }, "current user fetched successfully"))
    }
)

const updateAccountDetails = asyncHandler(async (req, res) => {

    // Extract username, email, fullname from the req.body
    const { newUsername, newEmail, newFullname } = req.body;

    if ([newUsername, newEmail].some((field) => field?.trim() === "")) {
        throw new ApiError(402, "Please enter a valid new username or email")
    }

    // Finding the user 
    const user = await User.findById(req.user?._id).select("-password -refreshToken");

    // Check to verify if the user exist in the database
    if (!user) {
        throw new ApiError(401, "User not found in the database")
    }

    // Assigning the new Username,email,fullname to the user object in the database
    user.username = newUsername;
    user.email = newEmail;
    user.fullname = newFullname;

    // save the updated data in the database
    await user.save({ validateBeforeSave: true })

    return res
        .status(200)
        .json(new ApiResponse(200, {
            updatedDetails: user
        },
            "User Account details updated successfully"
        ))

})

const updateUserAvatar = asyncHandler(async (req, res) => {

    // Find the user
    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    // Get path of the avatar file which will be uploaded on cloudinary-->{We get this access from the req.files that comes from the multer middleware}
    const updateAvatarLocalPath = req.file?.path;

    // Check if the file really exist or not
    if (!updateAvatarLocalPath) {
        throw new ApiError(401, "Avatar file is missing")
    }

    // uploding the file we got from the user to cloudinary
    const updatedAvatar = await uploadOnCloudinary(updateAvatarLocalPath);

    // Check if the updatedAvatar file is uploded on cloudinary
    if (!updatedAvatar) {
        throw new ApiError(401, "Failed to upload the avatar on cloudinary")
    }

    // Extracting the avatar field from the user object and assingnig the updatedAvatar.url field to it
    user.avatar = updatedAvatar.url;

    // saving the changes in the user object in the database
    await user.save({ validateBeforeSave: true })

    return res
        .status(200)
        .json(new ApiResponse(200, {
            avatar: updatedAvatar.url,
        }))

})

const updateUserCoverImage = asyncHandler(async (req, res) => {

    // Accessing the file which we get from the multer middleware and saving its path
    const updatedCoverImageLocalPath = req.file?.path;

    // Check for update Local Path Exists or not
    if (!updatedCoverImageLocalPath) {
        throw new ApiError(401, "Cover Image file is missing");
    }

    // upploading the image to cloudinary
    const updatedCoverImage = await uploadOnCloudinary(updatedCoverImageLocalPath);

    // Check if the file is not uploaded on cloudinary
    if (!updatedCoverImage) {
        throw new ApiError(402, "Failed to upload coverImage on cloudinary")
    }

    // Finding the user in the database by its id and updating the coverImage
    await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: updatedCoverImage.url
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, {
            coverImage: updatedCoverImage.url
        }))

})

// Aggregation Pipelines used in the below method

const getUserChannelProfile = asyncHandler(async (req, res) => {




    // for getting channel details accessing the username from the params of the request
    const { username } = req.params;


    // Validating if the username that came from the params exist or not
    if (!username?.trim()) {
        throw new ApiError(400, "Username is required")
    }

    // getting the channel stats of subscribers and subscribed to using the aggregation pipeline
    const channel = await User.aggregate(
        [
            // Stage 1
            {
                // matching the username in the database with the username that came from the params
                $match: {
                    username: username?.toLowerCase()
                }
            },
            // Stage 2
            {
                $lookup: {
                    from: "subscription",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            // Stage 3
            {
                $lookup: {
                    from: "subscription",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            // Stage 4
            {
                $addFields: {
                    "subscribersCount": {
                        $size: "$subscribers"
                    },
                    "channelsSubscribedToCount": {
                        $size: "$subscribedTo"
                    },
                    isSubscribed: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            },
            // Stage 5
            {
                // Projecting only the information we want to display gathered form the above pipelines
                $project: {
                    username: 1,
                    fullname: 1,
                    email: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1
                }
            }
        ]
    )

    // validating if the channel exist
    if (!channel?.length) {
        throw new ApiError(400, "Channle with the username not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel Profile fetched successfully"))


})

const getUserWatchHistory = asyncHandler(async (req, res) => {
    // Found the user in the database by matching its _id with the req.user._id and then passed it to the next stages in the aggregation pipeline
    const user = await User.aggregate(
        [
            // Stage 1
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user?._id)
                    // Cannot directly inject the req.user._id here need to use the mongoose to tell the database what the id id
                }
            },
            // Stage 2
            {
                $lookup: {
                    from: 'video',
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        // SubStage 1
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "Owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullname: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        // SubStage 2
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ]
    )

    // validating if the user exist
    if (!user) {
        throw new ApiError(400, "WatchHistory not found");
    }

})

export { registerUser, loginUser, refreshAccessToken, logoutUser, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getUserWatchHistory }