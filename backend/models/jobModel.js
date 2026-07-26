const mongoose = require('mongoose');

if (mongoose.models.Job) {
  module.exports = mongoose.model('Job');
} else {
  const jobSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    location: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    requirements: [{
      type: String
    }],
    skillCategories: [{
      type: String
    }],
    salaryRange: {
      type: String,
      default: null
    },
    jobType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'internship'],
      default: 'full_time'
    },
    positions: {
      type: Number,
      default: 1
    },
    deadline: {
      type: Date,
      required: true
    },
    requiredDocuments: [{
      name: { type: String, required: true },
      description: { type: String, default: null }
    }],
    applicantCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }, { timestamps: true });

  module.exports = mongoose.model('Job', jobSchema);
}
