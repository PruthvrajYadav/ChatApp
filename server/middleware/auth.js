//middleware to protect route

import User from "../model/user.js";
import jwt from 'jsonwebtoken'

export const protectRoute = async (req, res, next) => {
    try {
        let token = req.headers.authorization?.split(" ")[1] || req.headers.token;

        if (!token) return res.json({ success: false, message: "Unauthorized - No Token Provided" })

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.userId).select('-password')

        if (!user) return res.json({ success: false, message: "User Not found" })

        req.user = user;
        next()
    } catch (error) {
        console.log(error.message);

        res.json({ success: false, message: error.message })
    }

}