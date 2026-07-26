const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const Consent = require('../models/consentModel');
const AccessLog = require('../models/accessLogModel');
const Application = require('../models/applicationModel');
const Job = require('../models/jobModel');
const Company = require('../models/companyModel');

// ── GET ALL USERS ──
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('company', 'name').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// ── GET ALL CONSENTS ──
router.get('/consents', protect, adminOnly, async (req, res) => {
  try {
    const consents = await Consent.find()
      .populate('customer', 'fullName email phone applicantId')
      .sort({ createdAt: -1 });
    res.json(consents);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching consents' });
  }
});

// ── GET ALL ACCESS LOGS ──
router.get('/logs', protect, adminOnly, async (req, res) => {
  try {
    const logs = await AccessLog.find()
      .populate('customer', 'fullName email phone applicantId')
      .populate('accessedBy', 'fullName role')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching logs' });
  }
});

// ── GET ALL APPLICATIONS ──
router.get('/applications', protect, adminOnly, async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('applicant', 'fullName email phone applicantId')
      .populate('job', 'title location jobType deadline')
      .populate('company', 'name')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching applications' });
  }
});

// ── GET ALL JOBS ──
router.get('/jobs', protect, adminOnly, async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('company', 'name')
      .populate('postedBy', 'fullName')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching jobs' });
  }
});

// ── GET PLATFORM STATS ──
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [
      totalUsers,
      totalConsents,
      activeConsents,
      totalAccess,
      grantedAccess,
      deniedAccess,
      totalApplications,
      totalJobs,
      hired,
      shortlisted
    ] = await Promise.all([
      User.countDocuments(),
      Consent.countDocuments(),
      Consent.countDocuments({ status: 'active' }),
      AccessLog.countDocuments(),
      AccessLog.countDocuments({ accessGranted: true }),
      AccessLog.countDocuments({ accessGranted: false }),
      Application.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Application.countDocuments({ status: 'hired' }),
      Application.countDocuments({ status: 'shortlisted' })
    ]);

    res.json({
      totalUsers,
      totalConsents,
      activeConsents,
      totalAccess,
      grantedAccess,
      deniedAccess,
      totalApplications,
      totalJobs,
      hired,
      shortlisted
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// ── BACKFILL CONSENTS — fixes all old applications that missed consent creation ──
// Call this ONCE: POST /api/admin/backfill-consents
router.post('/backfill-consents', protect, adminOnly, async (req, res) => {
  try {
    const applications = await Application.find({ consentRules: { $exists: true, $ne: [] } });
    let created = 0;
    let skipped = 0;

    for (const app of applications) {
      for (const rule of app.consentRules) {
        // Check if consent already exists for this application + document
        const existing = await Consent.findOne({
          customer: app.applicant,
          purpose: rule.purpose,
          dataCategories: { $in: [rule.documentName] },
          applicationId: app._id
        });

        if (existing) {
          skipped++;
          continue;
        }

        const durationMs =
          rule.durationUnit === 'hours' ? rule.duration * 60 * 60 * 1000
          : rule.durationUnit === 'weeks' ? rule.duration * 7 * 24 * 60 * 60 * 1000
          : (rule.duration || 7) * 24 * 60 * 60 * 1000;

        const expiresAt = rule.expiresAt
          ? new Date(rule.expiresAt)
          : new Date(Date.now() + durationMs);

        const status = expiresAt < new Date() ? 'expired'
          : rule.status === 'withdrawn' ? 'withdrawn'
          : 'active';

        try {
          await Consent.create({
            customer: app.applicant,
            allowedRole: rule.allowedRole || 'staff',
            purpose: rule.purpose || 'Job application review',
            dataCategories: [rule.documentName || 'CV or Resume'],
            duration: rule.duration || 7,
            durationUnit: rule.durationUnit || 'days',
            expiresAt,
            status,
            applicationId: app._id,
            jobId: app.job,
            companyId: app.company
          });
          created++;
        } catch (e) {
          console.error('Consent create error:', e.message);
        }
      }
    }

    res.json({
      message: `Backfill complete. Created: ${created} consent records. Skipped (already existed): ${skipped}.`,
      created,
      skipped,
      totalApplications: applications.length
    });
  } catch (error) {
    console.error('Backfill error:', error);
    res.status(500).json({ message: 'Backfill failed: ' + error.message });
  }
});

// ── ASSIGN STAFF TO COMPANY ──
router.put('/assign-staff', protect, adminOnly, async (req, res) => {
  try {
    const { userId, companyId } = req.body;
    if (!userId || !companyId) {
      return res.status(400).json({ message: 'userId and companyId are required' });
    }
    await User.findByIdAndUpdate(userId, { company: companyId });
    await Company.findByIdAndUpdate(companyId, { $addToSet: { staff: userId } });
    const updatedUser = await User.findById(userId).select('-password').populate('company', 'name');
    res.json({ message: 'Staff assigned to company successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error assigning staff' });
  }
});

// ── DELETE USER ──
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

module.exports = router;