require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const year = new Date().getFullYear();
  let count = await User.countDocuments({ role: 'customer', applicantId: { $ne: null } });

  const customers = await User.find({ role: 'customer', applicantId: null });

  for (const c of customers) {
    count++;
    c.applicantId = `KBG-${year}-${String(count).padStart(4, '0')}`;
    await c.save();
    console.log(c.fullName, '->', c.applicantId);
  }

  console.log('Done. Updated', customers.length, 'accounts.');
  process.exit(0);
};

run();
