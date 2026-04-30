//Signup a new user

import { generateToken } from "../lib/utils.js"
import User from "../model/user.js"
import bcyptjs from 'bcryptjs'

import cloudinary from "../lib/cloudinary.js"

export const Signup = async (req, res) => {
    const { fullName, email, password, bio, phoneNumber } = req.body

    try {
        if (!fullName || !email || !password || !bio || !phoneNumber) {
            return res.json({ success: false, message: "Missing Details" })
        }
        const user = await User.findOne({ email })
        //if user already exit   
        if (user) {
            return res.json({ success: false, message: "Account already exists" })

        }
        //password hashing
        const salt = await bcyptjs.genSalt(10)
        const hashPassword = await bcyptjs.hash(password, salt)

        //new user
        const newUser = await User.create({
            fullName,
            email,
            password: hashPassword,
            bio,
            phoneNumber
        })


        //token
        const token = generateToken(newUser._id)
        res.json({ success: true, userData: newUser, token, message: "Account created successfully" })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}


//controller to user login

export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        const userData = await User.findOne({ email })

        const isPasswordCorrect = await bcyptjs.compare(password, userData.password)

        if (!isPasswordCorrect) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const token = generateToken(userData._id)
        res.json({ success: true, userData, token, message: "Login successful" })


    } catch (error) {
        console.log(error.message);

        res.json({ success: false, message: error.message })

    }
}

//controller to check is user is authenticated
export const checkAuth = (req, res) => {
    res.json({ success: true, user: req.user })
}


//controller to update user profile details
export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName, wallpaper, status, settings } = req.body

        const userId = req.user._id
        const updateData = {}
        if (bio !== undefined) updateData.bio = bio
        if (fullName !== undefined) updateData.fullName = fullName
        if (wallpaper !== undefined) updateData.wallpaper = wallpaper
        if (status !== undefined) updateData.status = status
        if (settings !== undefined) updateData.settings = settings

        if (profilePic) {
            const upload = await cloudinary.uploader.upload(profilePic)
            updateData.profilePic = upload.secure_url
        }
        
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true })
        res.json({ success: true, user: updatedUser })
    } catch (error) {
        res.json({ success: false, message: error.message })

    }
}

// search user by phone
export const searchUserByPhone = async (req, res) => {
    try {
        const { phoneNumber } = req.query
        const user = await User.findOne({ phoneNumber }).select("-password")
        if (!user) return res.json({ success: false, message: "User not found" })
        res.json({ success: true, user })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// add friend
export const addFriend = async (req, res) => {
    try {
        const { friendId } = req.body
        const userId = req.user._id

        if (userId.toString() === friendId) {
            return res.json({ success: false, message: "You cannot add yourself" })
        }

        // Add to current user's friends
        await User.findByIdAndUpdate(userId, { $addToSet: { friends: friendId } })
        // Add current user to friend's friends
        await User.findByIdAndUpdate(friendId, { $addToSet: { friends: userId } })

        res.json({ success: true, message: "Friend added successfully" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//delete account
export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id
        const user = await User.findById(userId)
        
        if (user.profilePic) {
            try {
                const publicId = user.profilePic.split('/').pop().split('.')[0]
                await cloudinary.uploader.destroy(publicId)
            } catch (err) {}
        }

        await User.findByIdAndDelete(userId)
        // Also delete their messages or keep them as 'Deleted User'
        // For now just delete user
        res.json({ success: true, message: "Account deleted" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}