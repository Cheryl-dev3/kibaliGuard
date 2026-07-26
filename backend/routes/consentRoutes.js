const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Consent = require('../models/consentModel');

router.post('/', protect, async (req, res) => {
  try {
    const { allowedRole, purpose, dataCategories, duration, durationUnit } = req.body;

    if (!allowedRole || !purpose || !dataCategories || dataCategories.length === 0 || !duration) {
      return res.status(400).json({ message: 'Please fill in all consent fields' });
    }

    const durationMs = {
      hours: duration * 60 * 60 * 1000,
      days: duration * 24 * 60 * 60 * 1000,
      weeks: duration * 7 * 24 * 60 * 60 * 1000
    };

    const expiresAt = new Date(Date.now() + durationMs[durationUnit || 'days']);

    const consent = await Consent.create({
      customer: req.user._id,
      allowedRole,
      purpose,
      dataCategories,
      duration,
      durationUnit: durationUnit || 'days',
      expiresAt
    });

    res.status(201).json({ message: 'Consent created successfully', consent });
  } catch (error) {
    console.error('Create consent error:', error);
    res.status(500).json({ message: 'Server error creating consent' });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const consents = await Consent.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.json(consents);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching consents' });
  }
});

router.get('/expiring', protect, async (req, res) => {
  try {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const expiring = await Consent.find({
      customer: req.user._id,
      status: 'active',
      expiresAt: { $gte: now, $lte: next24h }
    });
    res.json(expiring);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching expiring consents' });
  }
});

router.put('/withdraw/:id', protect, async (req, res) => {
  try {
    const consent = await Consent.findOne({ _id: req.params.id, customer: req.user._id });
    if (!consent) {
      return res.status(404).json({ message: 'Consent not found' });
    }
    consent.status = 'withdrawn';
    await consent.save();
    res.json({ message: 'Consent withdrawn successfully', consent });
  } catch (error) {
    res.status(500).json({ message: 'Server error withdrawing consent' });
  }
});

module.exports = router;
