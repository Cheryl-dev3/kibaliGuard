const mongoose = require('mongoose');

if (mongoose.models.Application) {
  module.exports = mongoose.model('Application');
} else {
  const thirdPartyRequestSchema = new mongoose.Schema({
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    thirdPartyName: { type: String, required: true },
    thirdPartyPurpose: { type: String, required: true },
    documents: [{ type: String }],
    duration: { type: Number, default: 7 },
    durationUnit: { type: String, enum: ['hours', 'days', 'weeks'], default: 'days' },
    status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
    secureLink: { type: String, default: null },
    linkExpiresAt: { type: Date, default: null }
  }, { timestamps: true });

  const applicationSchema = new mongoose.Schema({
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    applicantId: {
      type: String,
      default: null
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    documents: [{
      documentName: { type: String, required: true },
      fileName: { type: String },
      fileUrl: { type: String },
      publicId: { type: String },
      fileType: { type: String }
    }],
    consentRules: [{
      documentName: { type: String, required: true },
      allowedRole: { type: String, enum: ['staff', 'admin'], default: 'staff' },
      purpose: { type: String, required: true },
      duration: { type: Number, default: 7 },
      durationUnit: { type: String, enum: ['hours', 'days', 'weeks'], default: 'days' },
      expiresAt: { type: Date },
      status: { type: String, enum: ['active', 'expired', 'withdrawn'], default: 'active' }
    }],
    coverLetter: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['received', 'under_review', 'shortlisted', 'rejected', 'hired'],
      default: 'received'
    },
    statusMessage: {
      type: String,
      default: null
    },
    thirdPartyRequests: [thirdPartyRequestSchema]
  }, { timestamps: true });

  module.exports = mongoose.model('Application', applicationSchema);
}
