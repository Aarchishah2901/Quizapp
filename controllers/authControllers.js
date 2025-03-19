const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

exports.register = async (req, res) => {
  
  try
  {
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstname, lastname, phone_number, email, password, gender, role_id } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
    {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ firstname, lastname, phone_number, email, password: hashedPassword, gender, role_id });
    await newUser.save();

    res.status(201).json({ user_id: newUser._id.toString() });
  }
  catch (error)
  {
    console.error("Registration error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.login = async (req, res) => {

  try
  {
      console.log("Login attempt for:", req.body.password);

      const errors = validationResult(req);
      if (!errors.isEmpty())
      {
          console.log("Validation Errors:", errors.array());
          return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      console.log("Fetching user from database...");
      const userAggregation = await User.aggregate([
          { $match: { email } },
          { $project: { _id: 1, email: 1, password: 1, role: 1 } }
      ]);
    
      console.log("Aggregation rule", userAggregation);

      if (userAggregation.length === 0)
      {
        console.log("User not found in database");
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = userAggregation[0];
      console.log("User found:", user);

      console.log("Stored Password Hash:", user.password);

      console.log("Comparing passwords...");
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log("Password Match Result:", passwordMatch);

      if (!passwordMatch)
      {
          console.log("Password incorrect");
          return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!process.env.JWT_SECRET)
      {
          console.log("JWT_SECRET is missing in .env file!");
          return res.status(500).json({ error: "Server configuration error" });
      }

      console.log("Generating JWT token...");
      const token = jwt.sign(
          { id: user._id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '10h' }
      );

      console.log("Login successful. Token generated:", token);
      res.status(200).json({ token });

  } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getUser = async (req, res) => {
  
  try {
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId))
    {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup:
        {
          from: "roles",
          localField: "role_id",
          foreignField: "_id",
          as: "roleDetails",
        },
      },
      { $unwind: "$roleDetails" },
      {
        $project:
        {
          _id: 1,
          firstname: 1,
          lastname: 1,
          email: 1,
          gender: 1,
          phone_number: 1,
          role: "$roleDetails.role_type",
        },
      }
    ]);

    if (!user.length)
    {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user[0]);
  }
  catch (error)
  {
    console.error("User data fetch error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.aggregate([
//       {
//         $lookup:
//         {
//           from: "roles",
//           localField: "role_id",
//           foreignField: "_id",
//           as: "roleDetails",
//         },
//       },
//       { $unwind: "$roleDetails" },
//       {
//         $project:
//         {
//           _id: 1,
//           firstname: 1,
//           lastname: 1,
//           email: 1,
//           gender: 1,
//           phone_number: 1,
//           role: "$roleDetails.role_type",
//         },
//       }
//     ]);

//     res.status(200).json(users);
//   }
//   catch (error)
//   {
//     console.error("Error fetching users:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// exports.updateUser = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty())
//     {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const userId = req.user.id;

//     if (!mongoose.Types.ObjectId.isValid(userId))
//     {
//       return res.status(400).json({ error: 'Invalid user ID format' });
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { $set: req.body },
//       { new: true, runValidators: true }
//     );

//     if (!updatedUser)
//     {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.status(200).json({ message: 'User updated successfully', user: updatedUser });
//   }
//   catch (error)
//   {
//     console.error("Update error:", error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// exports.deleteUser = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     if (!mongoose.Types.ObjectId.isValid(userId))
//     {
//       return res.status(400).json({ error: 'Invalid user ID format' });
//     }

//     const user = await User.findByIdAndDelete(userId);
//     if (!user)
//     {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.status(200).json({ message: 'User deleted successfully' });
//   }
//   catch (error)
//   {
//     console.error("Delete error:", error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };