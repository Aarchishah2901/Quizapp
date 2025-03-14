const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

exports.register = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstname, lastname, phone_no, email, password, gender, role_id } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      firstname,
      lastname,
      phone_no,
      email,
      password: hashedPassword,
      gender,
      role_id
    });

    await newUser.save();
    res.status(201).json({ user_id : newUser._id.toString() });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).populate('role_id');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT Token
    const token = jwt.sign(
        {
          id: user._id.toString(),
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          gender: user.gender,
          phone_no: user.phone_no,
          role_id: user.role_id // Include role_id
        },
        process.env.JWT_SECRET,
        { expiresIn: '10h' }
      );
  
      res.status(200).json({ token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

// exports.getUser = async (req, res) => {
//   try {
//     res.status(200).json({
//       firstname: req.user.firstname,
//       lastname: req.user.lastname,
//       email: req.user.email,
//       gender: req.user.gender,
//       role: req.user.role_id.name
//     });
//   } catch (error) {
//     console.error("User data fetch error:", error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

exports.getUser = async (req, res) => {
  try {
      const userId = req.user.id;  // Extracted from token

      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const user = await User.findById(userId).populate('role_id');
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({
          id: user._id.toString(), // Convert to string
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          gender: user.gender,
          phone_no: user.phone_no,
          role: user.role_id.name
      });
  } catch (error) {
      console.error("User data fetch error:", error);
      res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Fetch all users except passwords
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;  // ID extracted from middleware (string)

      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $set: req.body },
          { new: true, runValidators: true }
      );

      if (!updatedUser) {
          return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
      const userId = req.user.id;  // Extracted from token

      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const user = await User.findByIdAndDelete(userId);
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ error: 'Internal server error' });
  }
};