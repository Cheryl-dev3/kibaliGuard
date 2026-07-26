const mongoose = require('mongoose');

if (mongoose.models.Consent) {
  module.exports = mongoose.model('Consent');
} else {
  const consentSchema = new mongoose.Schema({
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    allowedRole: {
      type: String,
      enum: ['staff', 'admin'],
      required: true
    },
    purpose: {
      type: String,
      required: true,
      trim: true
    },
    dataCategories: [{
      type: String
    }],
    duration: {
      type: Number,
      required: true
    },
    durationUnit: {
      type: String,
      enum: ['hours', 'days', 'weeks'],
      default: 'days'
    },
    expiresAt: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'withdrawn'],
      default: 'active'
    }
  }, { timestamps: true });

  module.exports = mongoose.model('Consent', consentSchema);
}
