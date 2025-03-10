const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  phone_no: { type: Number, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  role_id: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: false }
}, { collection: 'users' });

module.exports = mongoose.model('User', UserSchema);