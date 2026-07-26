const mongoose = require('mongoose');

if (mongoose.models.TalentPool) {
  module.exports = mongoose.model('TalentPool');
} else {
  const talentPoolSchema = new mongoose.Schema({
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    skillCategories: [{
      type: String
    }],
    status: {
      type: String,
      enum: ['active', 'withdrawn'],
      default: 'active'
    },
    consentExpiry: {
      type: Date,
      required: true
    }
  }, { timestamps: true });

  module.exports = mongoose.model('TalentPool', talentPoolSchema);
}
