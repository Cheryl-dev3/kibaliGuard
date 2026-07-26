const mongoose = require('mongoose');

if (mongoose.models.AccessLog) {
  module.exports = mongoose.model('AccessLog');
} else {
  const accessLogSchema = new mongoose.Schema({
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    accessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      required: true
    },
    dataCategories: [{
      type: String
    }],
    accessGranted: {
      type: Boolean,
      required: true
    },
    denialReason: {
      type: String,
      default: null
    },
    consentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consent',
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    }
  }, { timestamps: true });

  module.exports = mongoose.model('AccessLog', accessLogSchema);
}
