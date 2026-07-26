const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const Company = require('../models/companyModel');
const User = require('../models/userModel');

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, industry, location, email, phone, website, description } = req.body;

    if (!name || !industry || !location || !email) {
      return res.status(400).json({ message: 'Please fill in all required company fields' });
    }

    const company = await Company.create({
      name, industry, location, email, phone, website, description
    });

    res.status(201).json({ message: 'Company created successfully', company });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ message: 'Server error creating company' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching companies' });
  }
});

router.put('/assign-staff/:userId', protect, adminOnly, async (req, res) => {
  try {
    const { companyId } = req.body;

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'staff') return res.status(400).json({ message: 'Only staff accounts can be assigned to a company' });

    user.company = companyId;
    await user.save();

    res.json({ message: 'Staff member assigned to company successfully', user });
  } catch (error) {
    console.error('Assign staff error:', error);
    res.status(500).json({ message: 'Server error assigning staff to company' });
  }
});

module.exports = router;
