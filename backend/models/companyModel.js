const mongoose = require('mongoose');

if (mongoose.models.Company) {
  module.exports = mongoose.model('Company');
} else {
  const companySchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    industry: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      default: null
    },
    website: {
      type: String,
      default: null
    },
    description: {
      type: String,
      default: null
    },
    logo: {
      type: String,
      default: null
    }
  }, { timestamps: true });

  module.exports = mongoose.model('Company', companySchema);
}
