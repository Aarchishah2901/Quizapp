const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log("Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer "))
    {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    console.log("Extracted Token:", token);

    try
    {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded User:", decoded);

        req.user = decoded;
        next();
    }
    catch (error)
    {
        console.error("Token Verification Error:", error);
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

const verifyToken = async (req, res, next) => {
    const token = req.header("Authorization")?.split(' ')[1];
    if (!token)
    {
        console.log("No token provided");
        return res.status(401).json({ error: "Access denied, no token provided" });
    }
    
    try
    {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded);

        const user = await User.findById(decoded.id);
        if (!user)
        {
            console.log("User not found");
            return res.status(403).json({ error: "User not found" });
        }

        req.user = user;
        next();
    }
    catch (error)
    {
        console.log("Token verification failed", error);
        return res.status(403).json({ error: "Invalid token" });
    }
};

const checkPermission = (requiredPermission) => async (req, res, next) => {
    try
    {
        if (!req.user || !req.user.id)
        {
            return res.status(401).json({ error: "Unauthorized: No user found in request" });
        }

        const user = await User.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.user.id) } },
            {
                $lookup:
                {
                    from: "roles",
                    localField: "role_id",
                    foreignField: "_id",
                    as: "roleDetails"
                }
            },
            { $unwind: "$roleDetails" },
            {
                $project:
                {
                    _id: 1,
                    firstname: 1,
                    lastname: 1,
                    email: 1,
                    role: "$roleDetails.role_type",
                    permissions: "$roleDetails.permissions"
                }
            }
        ]);

        if (!user.length)
        {
            return res.status(403).json({ error: "User not found or has no role assigned" });
        }

        const userData = user[0];

        if (!userData.permissions.includes(requiredPermission))
        {
            return res.status(403).json({ error: "Access denied: Insufficient permissions" });
        }

        req.user = userData;
        next();
    }
    catch (error)
    {
        console.error("Permission Check Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const checkRole = (allowedRoles) => async (req, res, next) => {
    try
    {
        if (!req.user || !req.user.id)
        {
            return res.status(401).json({ error: "Unauthorized: No user found in request" });
        }

        const user = await User.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.user.id) } },
            {
                $lookup:
                {
                    from: "roles",
                    localField: "role_id",
                    foreignField: "_id",
                    as: "roleDetails"
                }
            },
            { $unwind:
            {
                path: "$roleDetails",
                preserveNullAndEmptyArrays: true
            }
        },
            {
                $project:
                {
                    _id: 1,
                    firstname: 1,
                    lastname: 1,
                    email: 1,
                    role: "$roleDetails.role_type"
                }
            }
        ]);

        if (!user.length)
        {
            return res.status(403).json({ error: "User not found or has no role assigned yet" });
        }

        const userData = user[0];

        // if (!allowedRoles.includes(userData.role)) {
        //     return res.status(403).json({ error: "Access denied: Insufficient role" });
        // }

        req.user = userData;
        next();
    }
    catch (error)
    {
        console.error("Role Check Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const checkAdmin = async (req, res, next) => {
    if (!req.user.isAdmin)
    {
        return res.status(403).json({ message: "Access denied: Admins only" });
    }
    next();
};

module.exports = { authMiddleware, verifyToken, checkPermission, checkRole, checkAdmin };