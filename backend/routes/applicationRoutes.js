const express = require('express');
const router = express.Router();
const { protect, staffOnly } = require('../middleware/authMiddleware');
const Application = require('../models/applicationModel');
const Job = require('../models/jobModel');
const User = require('../models/userModel');
const AccessLog = require('../models/accessLogModel');
const { createNotification } = require('../config/notificationHelper');
const { v4: uuidv4 } = require('uuid');

// ── Helper: generate applicant ID ─────────────────────────────────────────────
const generateApplicantId = async () => {
  const year = new Date().getFullYear();
  const count = await User.countDocuments({ role: 'customer' });
  const padded = String(count + 1).padStart(4, '0');
  return `KBG-${year}-${padded}`;
};

// ── Helper: calculate expiry from duration ────────────────────────────────────
const calcExpiry = (duration, unit) => {
  const ms = {
    hours: duration * 60 * 60 * 1000,
    days:  duration * 24 * 60 * 60 * 1000,
    weeks: duration * 7 * 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + (ms[unit] || ms.days));
};

// ── POST /api/applications/apply ─────────────────────────────────────────────
router.post('/apply', protect, async (req, res) => {
  try {
    const { jobId, coverLetter, documents, consentRules } = req.body;

    // Validate job exists
    const job = await Job.findById(jobId).populate('company', 'name');
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Check for duplicate application
    const existing = await Application.findOne({ applicant: req.user._id, job: jobId });
    if (existing) return res.status(400).json({ message: 'You have already applied for this job' });

    // Assign or reuse applicant ID
    let applicantId = req.user.applicantId;
    if (!applicantId) {
      applicantId = await generateApplicantId();
      await User.findByIdAndUpdate(req.user._id, { applicantId });
    }

    // ── FIX: Process and validate consent rules properly ──────────────────────
    if (!consentRules || !Array.isArray(consentRules) || consentRules.length === 0) {
      return res.status(400).json({ message: 'You must set consent rules for at least one document before applying.' });
    }

    const processedConsent = consentRules.map(rule => {
      if (!rule.documentName || !rule.allowedRole || !rule.purpose || !rule.duration || !rule.durationUnit) {
        throw new Error(`Incomplete consent rule for document: ${rule.documentName || 'unknown'}`);
      }
      return {
        documentName:  rule.documentName,
        allowedRole:   rule.allowedRole,
        purpose:       rule.purpose,
        duration:      rule.duration,
        durationUnit:  rule.durationUnit,
        status:        'active',
        grantedAt:     new Date(),
        expiresAt:     calcExpiry(rule.duration, rule.durationUnit),
      };
    });

    // ── FIX: Validate documents array ─────────────────────────────────────────
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ message: 'You must attach at least one document to your application.' });
    }

    // Create application
    const application = await Application.create({
      applicant:    req.user._id,
      applicantId,
      job:          jobId,
      company:      job.company._id,
      documents:    documents,
      consentRules: processedConsent,
      coverLetter:  coverLetter || null,
      status:       'received',
    });

    // Increment job applicant count
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

    // Notify applicant
    await createNotification(
      req.user._id,
      'application_received',
      job.title,
      job.company?.name || 'the company',
      { jobId: job._id, applicationId: application._id, actionUrl: '/dashboard' }
    );

    // Notify all staff at this company
    try {
      const staffMembers = await User.find({ role: 'staff', company: job.company._id });
      for (const staff of staffMembers) {
        await createNotification(
          staff._id,
          'new_application',
          job.title,
          job.company?.name || 'the company',
          {
            applicantName:  req.user.fullName,
            jobId:          job._id,
            applicationId:  application._id,
            actionUrl:      '/staff',
          }
        );
      }
    } catch (notifyErr) {
      console.error('Staff notify error:', notifyErr.message);
    }

    res.status(201).json({
      message:       'Application submitted successfully',
      application,
      applicantId,
    });

  } catch (err) {
    console.error('Apply error:', err.message);
    if (err.message.includes('Incomplete consent rule')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error submitting application. Please try again.' });
  }
});

// ── GET /api/applications/my ──────────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate('job',     'title deadline location jobType')
      .populate('company', 'name logo')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    console.error('Fetch my applications error:', err.message);
    res.status(500).json({ message: 'Server error fetching your applications' });
  }
});

// ── GET /api/applications/job/:jobId — staff only ─────────────────────────────
router.get('/job/:jobId', protect, staffOnly, async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant', 'fullName email phone applicantId')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    console.error('Fetch job applications error:', err.message);
    res.status(500).json({ message: 'Server error fetching applications' });
  }
});

// ── GET /api/applications/view/:applicationId — staff only ────────────────────
// This is where access granted / denied logic lives
router.get('/view/:applicationId', protect, staffOnly, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate('applicant', 'fullName email phone applicantId')
      .populate('job',       'title requiredDocuments')
      .populate('company',   'name');

    if (!application) return res.status(404).json({ message: 'Application not found' });

    const now = new Date();
    const accessibleDocuments = [];
    const blockedDocuments    = [];
    const denialReasons       = [];

    // ── FIX: Check consent for each document properly ─────────────────────────
    for (const doc of application.documents) {
      const matchingConsent = application.consentRules.find(rule => {
        const roleMatch    = rule.allowedRole === req.user.role;
        const docMatch     = rule.documentName === doc.documentName;
        const statusActive = rule.status === 'active';
        const notExpired   = new Date(rule.expiresAt) > now;
        return roleMatch && docMatch && statusActive && notExpired;
      });

      if (matchingConsent) {
        accessibleDocuments.push({
          ...doc.toObject(),
          accessGranted: true,
          purpose:       matchingConsent.purpose,
          expiresAt:     matchingConsent.expiresAt,
        });
      } else {
        // Find out why access was denied for better error messages
        const anyConsent = application.consentRules.find(r => r.documentName === doc.documentName);
        let reason = 'No consent rule exists for this document';
        if (anyConsent) {
          if (anyConsent.status !== 'active')         reason = 'Consent has been withdrawn by the applicant';
          else if (new Date(anyConsent.expiresAt) <= now) reason = 'Consent period has expired';
          else if (anyConsent.allowedRole !== req.user.role) reason = `Consent is limited to ${anyConsent.allowedRole} only`;
        }
        blockedDocuments.push({
          documentName:  doc.documentName,
          accessGranted: false,
          reason,
        });
        denialReasons.push(reason);
      }
    }

    const overallGranted = accessibleDocuments.length > 0;

    // ── Log this access attempt either way ────────────────────────────────────
    await AccessLog.create({
      customer:       application.applicant._id,
      accessedBy:     req.user._id,
      role:           req.user.role,
      purpose:        'Job application review',
      dataCategories: application.documents.map(d => d.documentName),
      accessGranted:  overallGranted,
      denialReason:   overallGranted ? null : denialReasons[0] || 'No valid consent',
      ipAddress:      req.ip,
    });

    // ── Notify applicant of access attempt ────────────────────────────────────
    if (overallGranted) {
      await createNotification(
        application.applicant._id,
        'document_accessed',
        application.job?.title || 'your job application',
        application.company?.name || 'a company',
        {
          accessorName:   req.user.fullName,
          documentName:   accessibleDocuments.map(d => d.documentName).join(', '),
          purpose:        'job application review',
          applicationId:  application._id,
          actionUrl:      '/access-logs',
        }
      );
    } else {
      // Notify applicant that someone tried and was denied
      await createNotification(
        application.applicant._id,
        'access_denied_attempt',
        application.job?.title || 'your job application',
        application.company?.name || 'a company',
        {
          accessorName:   req.user.fullName,
          reason:         denialReasons[0] || 'No valid consent found',
          applicationId:  application._id,
          actionUrl:      '/access-logs',
        }
      );
    }

    res.json({
      application: {
        _id:           application._id,
        applicant:     application.applicant,
        job:           application.job,
        company:       application.company,
        status:        application.status,
        statusMessage: application.statusMessage,
        coverLetter:   application.coverLetter,
        createdAt:     application.createdAt,
      },
      accessibleDocuments,
      blockedDocuments,
      summary: {
        totalDocuments:     application.documents.length,
        accessGrantedCount: accessibleDocuments.length,
        accessDeniedCount:  blockedDocuments.length,
        overallAccess:      overallGranted ? 'GRANTED' : 'DENIED',
      },
    });

  } catch (err) {
    console.error('View application error:', err.message);
    res.status(500).json({ message: 'Server error viewing application' });
  }
});

// ── PUT /api/applications/status/:applicationId — staff only ──────────────────
router.put('/status/:applicationId', protect, staffOnly, async (req, res) => {
  try {
    const { status, statusMessage } = req.body;
    const validStatuses = ['received', 'under_review', 'shortlisted', 'rejected', 'hired'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const application = await Application.findById(req.params.applicationId)
      .populate('job',     'title')
      .populate('company', 'name');

    if (!application) return res.status(404).json({ message: 'Application not found' });

    application.status        = status;
    application.statusMessage = statusMessage || null;
    await application.save();

    // Map status to notification type
    const notifType = {
      under_review: 'application_under_review',
      shortlisted:  'application_shortlisted',
      hired:        'application_hired',
      rejected:     'application_rejected',
    }[status];

    if (notifType) {
      await createNotification(
        application.applicant,
        notifType,
        application.job?.title    || 'the position',
        application.company?.name || 'the company',
        { applicationId: application._id, actionUrl: '/dashboard' }
      );
    }

    res.json({ message: 'Application status updated successfully', application });

  } catch (err) {
    console.error('Update status error:', err.message);
    res.status(500).json({ message: 'Server error updating application status' });
  }
});

// ── PUT /api/applications/withdraw-consent/:applicationId/:documentName ───────
router.put('/withdraw-consent/:applicationId/:documentName', protect, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id:       req.params.applicationId,
      applicant: req.user._id,
    });

    if (!application) return res.status(404).json({ message: 'Application not found' });

    const docName = req.params.documentName;
    const consentIndex = application.consentRules.findIndex(
      rule => rule.documentName === docName && rule.status === 'active'
    );

    if (consentIndex === -1) {
      return res.status(404).json({ message: `No active consent found for ${docName}` });
    }

    // ── FIX: Mark withdrawn and save properly ─────────────────────────────────
    application.consentRules[consentIndex].status      = 'withdrawn';
    application.consentRules[consentIndex].withdrawnAt = new Date();
    application.markModified('consentRules'); // Required for nested array changes in Mongoose
    await application.save();

    res.json({ message: `Consent withdrawn successfully for ${docName}` });

  } catch (err) {
    console.error('Withdraw consent error:', err.message);
    res.status(500).json({ message: 'Server error withdrawing consent' });
  }
});

// ── POST /api/applications/third-party-request/:applicationId — staff only ────
router.post('/third-party-request/:applicationId', protect, staffOnly, async (req, res) => {
  try {
    const { thirdPartyName, thirdPartyPurpose, documents, duration, durationUnit } = req.body;

    if (!thirdPartyName || !thirdPartyPurpose || !documents?.length) {
      return res.status(400).json({ message: 'Third party name, purpose and documents are required.' });
    }

    const application = await Application.findById(req.params.applicationId)
      .populate('job',     'title')
      .populate('company', 'name');

    if (!application) return res.status(404).json({ message: 'Application not found' });

    application.thirdPartyRequests.push({
      requestedBy:       req.user._id,
      thirdPartyName,
      thirdPartyPurpose,
      documents,
      duration:          duration || 7,
      durationUnit:      durationUnit || 'days',
      status:            'pending',
      requestedAt:       new Date(),
    });

    await application.save();

    // Notify applicant about the third party request
    await createNotification(
      application.applicant,
      'third_party_request',
      application.job?.title    || 'your application',
      application.company?.name || 'the company',
      {
        thirdPartyName,
        documentName:   documents?.join(', '),
        applicationId:  application._id,
        actionUrl:      '/dashboard',
      }
    );

    res.json({ message: 'Third party sharing request sent to applicant for approval' });

  } catch (err) {
    console.error('Third party request error:', err.message);
    res.status(500).json({ message: 'Server error sending third party request' });
  }
});

// ── PUT /api/applications/third-party-respond/:applicationId/:requestId ───────
router.put('/third-party-respond/:applicationId/:requestId', protect, async (req, res) => {
  try {
    const { decision } = req.body;

    if (!['approve', 'decline'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be approve or decline' });
    }

    const application = await Application.findOne({
      _id:       req.params.applicationId,
      applicant: req.user._id,
    });

    if (!application) return res.status(404).json({ message: 'Application not found' });

    const request = application.thirdPartyRequests.id(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Third party request not found' });

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been responded to' });
    }

    request.status      = decision === 'approve' ? 'approved' : 'declined';
    request.respondedAt = new Date();

    if (decision === 'approve') {
      const durationMs = {
        hours: request.duration * 60 * 60 * 1000,
        days:  request.duration * 24 * 60 * 60 * 1000,
        weeks: request.duration * 7 * 24 * 60 * 60 * 1000,
      };
      const uniqueToken   = uuidv4();
      request.secureLink  = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/third-party/${application._id}/${request._id}/${uniqueToken}`;
      request.linkExpiresAt = new Date(Date.now() + (durationMs[request.durationUnit || 'days']));
    }

    application.markModified('thirdPartyRequests');
    await application.save();

    res.json({
      message: `Third party request ${decision === 'approve' ? 'approved' : 'declined'} successfully`,
      request,
    });

  } catch (err) {
    console.error('Third party respond error:', err.message);
    res.status(500).json({ message: 'Server error responding to third party request' });
  }
});

// ── GET /api/applications/third-party/:applicationId/:requestId — public ──────
router.get('/third-party/:applicationId/:requestId', async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ message: 'This link is invalid or has expired.' });
    }

    const request = application.thirdPartyRequests.id(req.params.requestId);
    if (!request || request.status !== 'approved') {
      return res.status(403).json({ message: 'This link is invalid or access has been revoked.' });
    }

    if (new Date() > new Date(request.linkExpiresAt)) {
      return res.status(403).json({ message: 'This secure link has expired. Please request new access.' });
    }

    const documents = application.documents.filter(d =>
      request.documents.includes(d.documentName)
    );

    // Log this third-party access
    await AccessLog.create({
      customer:       application.applicant,
      accessedBy:     null,
      role:           'third_party',
      purpose:        request.thirdPartyPurpose,
      dataCategories: request.documents,
      accessGranted:  true,
      denialReason:   null,
      ipAddress:      req.ip,
    }).catch(e => console.error('Third party log error:', e.message));

    res.json({
      documents,
      expiresAt:    request.linkExpiresAt,
      purpose:      request.thirdPartyPurpose,
      thirdParty:   request.thirdPartyName,
    });

  } catch (err) {
    console.error('Third party view error:', err.message);
    res.status(500).json({ message: 'Server error loading secure document view' });
  }
});

module.exports = router;