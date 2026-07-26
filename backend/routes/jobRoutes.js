const express = require('express');
const router = express.Router();
const { protect, staffOnly } = require('../middleware/authMiddleware');
const Job = require('../models/jobModel');
const User = require('../models/userModel');
const TalentPool = require('../models/talentPoolModel');
const { createNotification } = require('../config/notificationHelper');

router.post('/', protect, staffOnly, async (req, res) => {
  try {
    const staffUser = await User.findById(req.user._id);
    if (!staffUser.company) {
      return res.status(400).json({ message: 'Your account is not linked to a company. Please ask an administrator to assign you to a company before posting jobs.' });
    }

    const {
      title, location, description, requirements, skillCategories,
      salaryRange, jobType, positions, deadline, requiredDocuments
    } = req.body;

    if (!title || !location || !description || !deadline) {
      return res.status(400).json({ message: 'Please fill in all required job fields' });
    }

    const job = await Job.create({
      title,
      company: staffUser.company,
      postedBy: req.user._id,
      location,
      description,
      requirements: requirements || [],
      skillCategories: skillCategories || [],
      salaryRange: salaryRange || null,
      jobType: jobType || 'full_time',
      positions: positions || 1,
      deadline,
      requiredDocuments: requiredDocuments || []
    });

    // notify talent pool members whose skills match
    try {
      if (skillCategories && skillCategories.length > 0) {
        const matches = await TalentPool.find({ status: 'active', skillCategories: { $in: skillCategories } });
        const populatedJob = await Job.findById(job._id).populate('company', 'name');
        for (const match of matches) {
          await createNotification(
            match.customer,
            'talent_pool_match',
            populatedJob.title,
            populatedJob.company?.name || 'A company',
            { jobId: job._id, actionUrl: `/jobs/${job._id}` }
          );
        }
      }
    } catch (notifyErr) {
      console.error('Talent pool notify error:', notifyErr);
    }

    res.status(201).json({ message: 'Job posted successfully', job });
  } catch (error) {
    console.error('Post job error:', error);
    res.status(500).json({ message: 'Server error posting job' });
  }
});

router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true })
      .populate('company', 'name logo')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching jobs' });
  }
});

router.get('/staff/my-jobs', protect, staffOnly, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id })
      .populate('company', 'name')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching your jobs' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('company', 'name logo industry location');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching job' });
  }
});

// Update a job (staff who posted it, or admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const isOwner = job.postedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only edit jobs you posted yourself' });
    }

    const {
      title, location, description, requirements, skillCategories,
      salaryRange, jobType, positions, deadline, requiredDocuments,
      isActive, companyId
    } = req.body;

    if (title !== undefined) job.title = title;
    if (location !== undefined) job.location = location;
    if (description !== undefined) job.description = description;
    if (requirements !== undefined) job.requirements = requirements;
    if (skillCategories !== undefined) job.skillCategories = skillCategories;
    if (salaryRange !== undefined) job.salaryRange = salaryRange;
    if (jobType !== undefined) job.jobType = jobType;
    if (positions !== undefined) job.positions = positions;
    if (deadline !== undefined) job.deadline = deadline;
    if (requiredDocuments !== undefined) job.requiredDocuments = requiredDocuments;
    if (isActive !== undefined) job.isActive = isActive;

    if (companyId !== undefined && isAdmin) {
      job.company = companyId;
    }

    await job.save();
    const updated = await Job.findById(job._id).populate('company', 'name logo industry location');
    res.json({ message: 'Job updated successfully', job: updated });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error updating job' });
  }
});

// Delete a job (staff who posted it, or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const isOwner = job.postedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete jobs you posted yourself' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error deleting job' });
  }
});

module.exports = router;