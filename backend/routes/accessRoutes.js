const express = require('express');
const router = express.Router();
const { protect, staffOnly } = require('../middleware/authMiddleware');
const Application = require('../models/applicationModel');
const AccessLog = require('../models/accessLogModel');
const User = require('../models/userModel');

// GET /api/access/customers
router.get('/customers', protect, staffOnly, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('fullName email phone applicantId')
      .sort({ fullName: 1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching customers' });
  }
});

// POST /api/access/request
router.post('/request', protect, staffOnly, async (req, res) => {
  try {
    const { customerId, purpose, dataCategories } = req.body;

    if (!customerId || !purpose || !dataCategories || dataCategories.length === 0) {
      return res.status(400).json({ message: 'Please provide customer ID, purpose and at least one data category' });
    }

    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const now = new Date();

    // ── Look inside applications consentRules not the Consent collection ──
    const applications = await Application.find({
      applicant: customerId
    });

    if (!applications || applications.length === 0) {
      await AccessLog.create({
        customer: customerId,
        accessedBy: req.user._id,
        role: req.user.role,
        purpose,
        dataCategories,
        accessGranted: false,
        denialReason: 'This applicant has not submitted any applications',
        ipAddress: req.ip
      });

      return res.status(403).json({
        accessGranted: false,
        message: 'Access denied. This applicant has not submitted any applications.'
      });
    }

    // Check each requested document against all applications
    const grantedDocuments = [];
    const deniedDocuments = [];

    for (const category of dataCategories) {
      let found = false;

      for (const app of applications) {
        const matchingRule = app.consentRules?.find(rule => {
          const roleMatch    = rule.allowedRole === req.user.role;
          const docMatch     = rule.documentName === category;
          const statusActive = rule.status === 'active';
          const notExpired   = new Date(rule.expiresAt) > now;
          const purposeMatch = rule.purpose?.toLowerCase().trim() === purpose?.toLowerCase().trim();
          return roleMatch && docMatch && statusActive && notExpired && purposeMatch;
        });

        if (matchingRule) {
          grantedDocuments.push({
            documentName: category,
            purpose: matchingRule.purpose,
            expiresAt: matchingRule.expiresAt,
            applicationId: app._id
          });
          found = true;
          break;
        }
      }

      if (!found) {
        // Find out why it was denied
        let reason = 'No consent rule exists for this document';
        for (const app of applications) {
          const anyRule = app.consentRules?.find(r => r.documentName === category);
          if (anyRule) {
            if (anyRule.status !== 'active')
              reason = 'Consent has been withdrawn by the applicant';
            else if (new Date(anyRule.expiresAt) <= now)
              reason = 'Consent period has expired';
            else if (anyRule.allowedRole !== req.user.role)
              reason = `Consent is restricted to ${anyRule.allowedRole} role only`;
            else if (anyRule.purpose?.toLowerCase().trim() !== purpose?.toLowerCase().trim())
              reason = `Purpose does not match. Expected: "${anyRule.purpose}"`;
            break;
          }
        }
        deniedDocuments.push({ documentName: category, reason });
      }
    }

    const accessGranted = grantedDocuments.length > 0;

    // Log the attempt
    await AccessLog.create({
      customer: customerId,
      accessedBy: req.user._id,
      role: req.user.role,
      purpose,
      dataCategories,
      accessGranted,
      denialReason: accessGranted ? null : deniedDocuments[0]?.reason || 'No valid consent found',
      ipAddress: req.ip
    });

    if (accessGranted) {
      return res.json({
        accessGranted: true,
        message: `Access granted for ${grantedDocuments.length} document(s).`,
        grantedDocuments,
        deniedDocuments,
        summary: `${grantedDocuments.length} granted, ${deniedDocuments.length} denied`
      });
    } else {
      return res.status(403).json({
        accessGranted: false,
        message: `Access denied. ${deniedDocuments[0]?.reason || 'No valid consent found.'}`,
        deniedDocuments
      });
    }

  } catch (error) {
    console.error('Access request error:', error);
    res.status(500).json({ message: 'Server error processing access request' });
  }
});

// GET /api/access/my-logs — customer sees their own logs
router.get('/my-logs', protect, async (req, res) => {
  try {
    const logs = await AccessLog.find({ customer: req.user._id })
      .populate('accessedBy', 'fullName role')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching access logs' });
  }
});

// GET /api/access/staff-logs — staff sees their own request history
router.get('/staff-logs', protect, staffOnly, async (req, res) => {
  try {
    const logs = await AccessLog.find({ accessedBy: req.user._id })
      .populate('customer', 'fullName email phone applicantId')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching staff logs' });
  }
});

module.exports = router;