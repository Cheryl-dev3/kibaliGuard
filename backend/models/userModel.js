const mongoose = require('mongoose');

if (mongoose.models.User) {
  module.exports = mongoose.model('User');
} else {
  const userSchema = new mongoose.Schema({
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      sparse: true
    },
    phone: {
      type: String,
      trim: true,
      default: null,
      sparse: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['customer', 'staff', 'admin'],
      default: 'customer'
    },
    applicantId: {
      type: String,
      default: null
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null
    },
    department: {
      type: String,
      default: null
    },
    resetOtp: {
      type: String,
      default: null
    },
    resetOtpExpiry: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }, { timestamps: true });

  module.exports = mongoose.model('User', userSchema);
}
