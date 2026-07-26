const mongoose = require('mongoose');

if (mongoose.models.Notification) {
  module.exports = mongoose.model('Notification');
} else {
  const notificationSchema = new mongoose.Schema({
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: [
        'application_received',
        'application_under_review',
        'application_shortlisted',
        'application_hired',
        'application_rejected',
        'consent_expiring',
        'consent_expired',
        'document_accessed',
        'third_party_request',
        'talent_pool_match',
        'job_closing_soon',
        'weekly_summary',
        'new_application',
        'new_registration'
      ],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    pose: { type: Number, default: 1 },
    isRead: { type: Boolean, default: false },
    relatedJob: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
    relatedApplication: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },
    relatedCompany: { type: String, default: null },
    actionUrl: { type: String, default: null }
  }, { timestamps: true });

  module.exports = mongoose.model('Notification', notificationSchema);
}
