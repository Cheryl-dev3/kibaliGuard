const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const User = require('../models/userModel');
const { createNotification } = require('../config/notificationHelper');

const resend = new Resend(process.env.RESEND_API_KEY);

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isPhone = (value) => /^(07|01)\d{8}$/.test(value);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateApplicantId = async () => {
  const year = new Date().getFullYear();
  const count = await User.countDocuments({ role: 'customer' });
  const padded = String(count + 1).padStart(4, '0');
  return `KBG-${year}-${padded}`;
};

router.post('/register', async (req, res) => {
  try {
    const { fullName, identifier, password, role, department } = req.body;

    if (!fullName || !identifier || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const emailInput = isEmail(identifier) ? identifier.toLowerCase().trim() : null;
    const phoneInput = isPhone(identifier) ? identifier.trim() : null;

    if (!emailInput && !phoneInput) {
      return res.status(400).json({ message: 'Please enter a valid email address or Kenyan phone number starting with 07 or 01' });
    }

    let existingUser = null;

    if (emailInput) {
      existingUser = await User.findOne({ email: emailInput });
    } else if (phoneInput) {
      existingUser = await User.findOne({ phone: phoneInput });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'This email or phone number is already registered. Please login instead.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userData = {
      fullName: fullName.trim(),
      password: hashedPassword,
      role: role || 'customer',
      department: department || null
    };

    if (emailInput) userData.email = emailInput;
    if (phoneInput) userData.phone = phoneInput;

    if (userData.role === 'customer') {
      userData.applicantId = await generateApplicantId();
    }

    const user = await User.create(userData);
    const token = generateToken(user._id);

    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          'new_registration',
          '',
          'KibaliGuard',
          { userName: user.fullName, role: user.role, actionUrl: '/admin' }
        );
      }
    } catch (notifyErr) {
      console.error('Admin notify error:', notifyErr);
    }

    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        applicantId: user.applicantId
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This email or phone number is already registered. Please login instead.' });
    }
    res.status(500).json({ message: 'Server error during registration. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const emailInput = isEmail(identifier) ? identifier.toLowerCase().trim() : null;
    const phoneInput = isPhone(identifier) ? identifier.trim() : null;

    if (!emailInput && !phoneInput) {
      return res.status(400).json({ message: 'Please enter a valid email address or Kenyan phone number starting with 07 or 01' });
    }

    let user = null;

    if (emailInput) {
      user = await User.findOne({ email: emailInput });
    } else if (phoneInput) {
      user = await User.findOne({ phone: phoneInput });
    }

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email or number. Please register first.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect email or password. Please try again.' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        applicantId: user.applicantId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login. Please try again.' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please enter your email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    user.resetOtp = otp;
    user.resetOtpExpiry = expiry;
    await user.save();

    await resend.emails.send({
      from: 'KibaliGuard <onboarding@resend.dev>',
      to: email,
      subject: 'Your KibaliGuard Password Reset Code',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #F8FAFC; border-radius: 16px;">
          <h2 style="color: #1E3A5F; font-size: 24px; margin-bottom: 8px;">Password Reset Request</h2>
          <p style="color: #1E293B; font-size: 16px;">Hello ${user.fullName},</p>
          <p style="color: #1E293B;">Your one time password reset code is:</p>
          <div style="background: #1E3A5F; color: #0EA5E9; font-size: 36px; font-weight: bold; text-align: center; padding: 24px; border-radius: 12px; letter-spacing: 8px; margin: 24px 0;">
            ${otp}
          </div>
          <p style="color: #1E293B;">This code expires in 15 minutes. Do not share it with anyone.</p>
          <p style="color: #64748B; font-size: 14px; margin-top: 24px;">If you did not request this, please ignore this email.</p>
          <p style="color: #64748B; font-size: 12px; margin-top: 16px;">© Cheryl Kreativ Studio</p>
        </div>
      `
    });

    res.json({ message: 'Reset code sent to your email address' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error sending reset code. Please try again.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and reset code' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ message: 'Invalid reset code. Please check and try again.' });
    }

    if (new Date() > user.resetOtpExpiry) {
      return res.status(400).json({ message: 'This reset code has expired. Please request a new one.' });
    }

    res.json({ message: 'Code verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error verifying code. Please try again.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    if (user.resetOtp !== otp || new Date() > user.resetOtpExpiry) {
      return res.status(400).json({ message: 'Invalid or expired reset code. Please request a new one.' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error resetting password. Please try again.' });
  }
});

module.exports = router;
