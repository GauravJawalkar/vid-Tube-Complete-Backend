import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Middleware function to verify JSON Web Tokens (JWT)
export const verifyJWT = asyncHandler(async (req, res, next) => {

    // Extract token from cookies or Authorization header
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    // If no token is found, throw an unauthorized error
    if (!token) {
        throw new ApiError(401, "Unauthorized");
    }

    try {

        // Verify the token using the secret key from environment variables
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        // Find the user in the database using the token's _id, excluding sensitive fields
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        // If user doesn't exist, throw an unauthorized error
        if (!user) {
            throw new ApiError(401, "Unauthorized");
        }

        // Attach user details to the request object for further use
        req.user = user;

        // Pass control to the next middleware or route handler
        next()

    } catch (error) {
        // If there's an error (invalid token, etc.), throw a bad request error
        throw new ApiError(400, "Unauthorized access token");
    }


})