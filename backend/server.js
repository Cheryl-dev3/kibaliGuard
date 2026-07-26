const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);


const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/consents', require('./routes/consentRoutes'));
app.use('/api/access', require('./routes/accessRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/talent', require('./routes/talentRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'KibaliGuard Digital Recruitment and Consent System is running' });
});

app.get('/ping', (req, res) => {
  res.json({ status: 'awake', message: 'KibaliGuard backend is alive', timestamp: new Date().toISOString() });
});

cron.schedule('0 * * * *', async () => {
  try {
    const Consent = require('./models/consentModel');
    const now = new Date();
    await Consent.updateMany(
      { expiresAt: { $lt: now }, status: 'active' },
      { $set: { status: 'expired' } }
    );
    console.log('Consent expiry check completed');
  } catch (error) {
    console.error('Cron job error:', error);
  }
});

cron.schedule('0 9 * * 0', async () => {
  try {
    const User = require('./models/userModel');
    const Application = require('./models/applicationModel');
    const AccessLog = require('./models/accessLogModel');
    const Consent = require('./models/consentModel');
    const { createNotification } = require('./config/notificationHelper');

    const customers = await User.find({ role: 'customer' });
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const customer of customers) {
      const [applications, weekLogs, expiringConsents] = await Promise.all([
        Application.find({ applicant: customer._id }),
        AccessLog.find({ customer: customer._id, createdAt: { $gte: weekAgo } }),
        Consent.find({ customer: customer._id, status: 'active', expiresAt: { $lte: nextWeek } })
      ]);

      const summaryMessage = `Here is your week at KibaliGuard. You have ${applications.length} active application${applications.length !== 1 ? 's' : ''}. Your documents were viewed ${weekLogs.length} time${weekLogs.length !== 1 ? 's' : ''} this week. ${expiringConsents.length} consent${expiringConsents.length !== 1 ? 's expire' : ' expires'} next week. Have a great week ahead!`;

      await createNotification(
        customer._id,
        'weekly_summary',
        '',
        'KibaliGuard',
        { summaryMessage, actionUrl: '/dashboard' }
      );
    }
    console.log('Weekly summary notifications sent');
  } catch (error) {
    console.error('Weekly summary cron error:', error);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`KibaliGuard server running on port ${PORT}`);
});
