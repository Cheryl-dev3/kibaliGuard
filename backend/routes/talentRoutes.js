const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const TalentPool = require('../models/talentPoolModel');

router.post('/join', protect, async (req, res) => {
  try {
    const { skillCategories } = req.body;
    if (!skillCategories || skillCategories.length === 0) {
      return res.status(400).json({ message: 'Please select at least one skill category' });
    }

    const consentExpiry = new Date();
    consentExpiry.setMonth(consentExpiry.getMonth() + 6);

    const existing = await TalentPool.findOne({ customer: req.user._id });

    if (existing) {
      existing.skillCategories = skillCategories;
      existing.status = 'active';
      existing.consentExpiry = consentExpiry;
      await existing.save();
      return res.json({ message: 'Talent pool profile updated', talent: existing });
    }

    const talent = await TalentPool.create({
      customer: req.user._id,
      skillCategories,
      consentExpiry
    });

    res.status(201).json({ message: 'Joined talent pool successfully', talent });
  } catch (error) {
    console.error('Join talent pool error:', error);
    res.status(500).json({ message: 'Server error joining talent pool' });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const talent = await TalentPool.findOne({ customer: req.user._id });
    res.json(talent);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching talent pool status' });
  }
});

router.put('/withdraw', protect, async (req, res) => {
  try {
    const talent = await TalentPool.findOne({ customer: req.user._id });
    if (!talent) return res.status(404).json({ message: 'Talent pool profile not found' });

    talent.status = 'withdrawn';
    await talent.save();

    res.json({ message: 'Withdrawn from talent pool successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error withdrawing from talent pool' });
  }
});

module.exports = router;
