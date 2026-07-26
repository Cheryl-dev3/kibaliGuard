const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Consent = require('../models/consentModel');
const AccessLog = require('../models/accessLogModel');
const Application = require('../models/applicationModel');
const Notification = require('../models/notificationModel');
const Job = require('../models/jobModel');

const statusLabels = {
  received: 'received and being processed',
  under_review: 'under review by the hiring team',
  shortlisted: 'shortlisted — they are very interested in you',
  hired: 'accepted — you got the job!',
  rejected: 'not selected this time, but keep going'
};

const buildKibaReply = async (message, data) => {
  const q = message.toLowerCase();
  const { applications, activeConsents, expiredConsents, todayLogs, thisWeekLogs, logs, fullName } = data;
  const firstName = fullName.split(' ')[0];

  // ── GREETINGS ──
  if (q.match(/^(hi|hello|hey|habari|mambo|sasa|niaje|hujambo|jambo|sup|what'?s up)/)) {
    return `Habari ${firstName}! I am Kiba, your personal data assistant here at KibaliGuard. I am here 24/7 to help you with anything — from checking who saw your CV today to writing you a cover letter. What would you like to know?`;
  }

  // ── WHAT IS KIBALIGUARD ──
  if (q.includes('what is kibaliguard') || q.includes('what does kibaliguard do') || q.includes('about kibaliguard') || q.includes('tell me about')) {
    return `KibaliGuard is a digital recruitment and data protection platform built specifically for Kenyan job seekers. Here is what makes us different from other job sites:\n\n🛡️ When you apply for a job on KibaliGuard, YOU decide who can access your documents, why they can access them, and for how long. When that time is up, the company automatically loses access — no manual action needed from you.\n\n📋 Every single access attempt on your documents is logged permanently so you can see exactly who tried to view your CV, when they tried, what reason they gave, and whether they were allowed or denied.\n\n🤖 I am Kiba, your personal AI assistant. You can ask me anything about your applications, your data, or how the system works and I will answer using your real live data.\n\nKibaliGuard is fully compliant with the Kenya Data Protection Act 2019.`;
  }

  // ── WHAT JOBS ARE AVAILABLE ──
  if (q.includes('job') && (q.includes('available') || q.includes('open') || q.includes('vacancies') || q.includes('vacancy') || q.includes('list') || q.includes('show') || q.includes('what job'))) {
    try {
      const jobs = await Job.find({ isActive: true }).populate('company', 'name').sort({ createdAt: -1 }).limit(8);
      if (jobs.length === 0) {
        return `There are no open positions right now, ${firstName}. But do not worry — new jobs are posted regularly. Join the Talent Pool so you get notified the moment a job matching your skills appears!`;
      }
      const list = jobs.map(j => `• ${j.title} at ${j.company?.name || 'a company'} — ${j.location} (${j.jobType?.replace('_', ' ')}), deadline ${new Date(j.deadline).toLocaleDateString()}`).join('\n');
      return `Here are the currently open positions, ${firstName}:\n\n${list}\n\nTo apply for any of these, go to the home page and click Apply Now on the job you want. I will help you write a cover letter if you need one!`;
    } catch (e) {
      return `I could not load the job listings right now, ${firstName}. Please check the home page directly to see all open positions.`;
    }
  }

  // ── HOW DO I APPLY ──
  if ((q.includes('how') && q.includes('apply')) || q.includes('application process') || q.includes('how to apply')) {
    return `Applying on KibaliGuard is simple, ${firstName}. Here are the three steps:\n\n📤 Step 1 — Browse jobs on the home page and click "Apply Now" on the one you want.\n\n🔐 Step 2 — Upload your required documents (CV, National ID, certificates, etc.) and set your consent rules. For each document you choose who can access it, what reason they must give, and for how many days they can keep it.\n\n✅ Step 3 — Review everything and submit. You will get an instant notification confirming your application and Kiba will keep you updated on every status change.\n\nWould you like me to help you write a cover letter for your application?`;
  }

  // ── HOW DOES CONSENT WORK ──
  if (q.includes('consent') && (q.includes('how') || q.includes('work') || q.includes('what') || q.includes('explain'))) {
    return `Great question, ${firstName}! Consent is the heart of how KibaliGuard protects you.\n\nWhen you apply for a job and upload your CV or National ID, you also set a consent rule for each document. You specify:\n\n🎯 Who can access it — for example only the HR Officer, not anyone else\n📝 The exact purpose — for example "Job application review". If HR says any other reason, access is automatically denied\n⏱️ How long — for example 7 days. After that, they automatically lose access\n\nWhen an HR officer tries to view your document, the system checks all three conditions. If anything does not match, access is DENIED and you are notified immediately.\n\nYou can withdraw consent at any time from your dashboard — the company loses access the second you click it.`;
  }

  // ── HOW DO I UPDATE MY CV ──
  if ((q.includes('update') || q.includes('change') || q.includes('edit')) && (q.includes('cv') || q.includes('resume') || q.includes('document'))) {
    return `You can update your documents anytime, ${firstName}! Here is how:\n\n1. Go to your Dashboard\n2. Open the Applications tab\n3. Find the application you want to update\n4. You can withdraw consent on the old document and resubmit with the new version\n\nAlternatively, when you apply for a new job you can upload your latest CV fresh. The HR officers who have access through consent will see whatever version you have currently shared with them.\n\nProTip: Always keep your CV updated — companies can request access to it at any time while your consent is active, so you want them to see your best and most current version!`;
  }

  // ── HOW TO WITHDRAW CONSENT / STOP SHARING ──
  if (q.includes('withdraw') || q.includes('stop sharing') || q.includes('remove') || q.includes('revoke') || q.includes('cancel') || (q.includes('deny') && q.includes('access'))) {
    if (activeConsents.length === 0) {
      return `You do not have any active consents right now, ${firstName}. Once you apply for a job and set consent rules, you can withdraw them at any time.\n\nTo withdraw consent: go to your Dashboard → click the Consents tab (or the "My Sharing Rules" section) → click "Stop Sharing" next to any consent you want to remove.\n\nThe moment you click it, that company immediately loses access to your documents. No delay, no questions asked.`;
    }
    return `To stop sharing your documents with a company, ${firstName}:\n\n1. Go to your Dashboard\n2. Click the Consents tab\n3. Find the consent you want to withdraw\n4. Click "Stop Sharing"\n\nThe company loses access immediately — not after a waiting period, not after 24 hours, immediately.\n\nYou currently have ${activeConsents.length} active consent${activeConsents.length !== 1 ? 's' : ''}. Would you like me to tell you what they are and when they expire?`;
  }

  // ── TALENT POOL ──
  if (q.includes('talent pool') || (q.includes('talent') && q.includes('pool')) || q.includes('how does talent') || q.includes('6 month') || q.includes('six month')) {
    const inPool = data.inTalentPool;
    if (inPool) {
      return `You are currently in the Talent Pool, ${firstName}! Here is what that means:\n\n✅ Companies can see your profile when they search for people with your skills\n🔔 You will get a notification from me whenever a matching job is posted\n⏱️ Your consent to be in the pool lasts 6 months from when you joined\n\nIf you get a job elsewhere and are no longer looking, go to the Talent Pool page and click "Leave Talent Pool". Companies will immediately lose access to your profile.`;
    }
    return `The Talent Pool is a feature where you make yourself visible to companies without actively applying to jobs, ${firstName}.\n\nHere is how it works:\n\n🎯 You select your skill categories (Security, IT, Cooking, Teaching, etc.)\n👀 Companies can see your profile when they search for those skills\n🔔 I notify you automatically when a matching job is posted\n⏱️ Your consent lasts 6 months — after that it expires automatically\n🚫 Got a job elsewhere? Click "Leave Talent Pool" and companies immediately lose access to your profile\n\nYou can join from the Talent Pool page in the top menu. It takes 30 seconds!`;
  }

  // ── WHO ACCESSED MY DATA TODAY ──
  if ((q.includes('who') || q.includes('accessed') || q.includes('viewed') || q.includes('saw')) && !q.includes('week')) {
    if (todayLogs.length === 0) {
      return `Good news, ${firstName}! Nobody has tried to access your documents today. Everything is quiet and your data is safe.\n\nYou can check your full access history at any time on the "Who Saw My Documents" page in your navigation menu.`;
    }
    const lines = todayLogs.map(l => {
      const name = l.accessedBy?.fullName || 'Someone';
      const time = new Date(l.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
      const result = l.accessGranted ? '✅ was GRANTED access' : '❌ was DENIED access';
      return `${name} tried to access your documents at ${time} for the purpose of "${l.purpose}" and ${result}`;
    });
    return `Here is today's activity on your documents, ${firstName}:\n\n${lines.join('\n\n')}\n\nAll attempts are permanently logged. Go to "Who Saw My Documents" for the full history with every detail.`;
  }

  // ── WHO ACCESSED THIS WEEK ──
  if (q.includes('week') && (q.includes('who') || q.includes('access') || q.includes('viewed') || q.includes('saw'))) {
    if (thisWeekLogs.length === 0) {
      return `Nobody has tried to access your documents this week, ${firstName}. Your data is completely private right now.`;
    }
    const granted = thisWeekLogs.filter(l => l.accessGranted).length;
    const denied = thisWeekLogs.filter(l => !l.accessGranted).length;
    const lines = thisWeekLogs.map(l => {
      const name = l.accessedBy?.fullName || 'Someone';
      const date = new Date(l.createdAt).toLocaleDateString('en-KE');
      return `${name} on ${date} for "${l.purpose}" — ${l.accessGranted ? '✅ GRANTED' : '❌ DENIED'}`;
    });
    return `Here is your data access summary for this week, ${firstName}:\n\n${lines.join('\n')}\n\nThis week total: ${thisWeekLogs.length} attempt${thisWeekLogs.length !== 1 ? 's' : ''} — ${granted} granted, ${denied} denied.`;
  }

  // ── APPLICATION STATUS ──
  if (q.includes('application') || q.includes('status') || q.includes('applied') || (q.includes('my') && q.includes('job'))) {
    if (applications.length === 0) {
      return `You have not submitted any applications yet, ${firstName}. Browse the open positions on the home page and apply when you are ready!\n\nTip: Before applying, make sure your CV is up to date. Would you like me to help you write a cover letter once you find a job you like?`;
    }
    const lines = applications.map(a => {
      const title = a.job?.title || 'a position';
      const company = a.company?.name || 'a company';
      const status = statusLabels[a.status] || a.status;
      const date = new Date(a.createdAt).toLocaleDateString('en-KE');
      return `📋 ${title} at ${company} — ${status} (applied ${date})`;
    });
    return `Here is where your applications stand, ${firstName}:\n\n${lines.join('\n\n')}\n\nI will notify you immediately whenever any of these statuses change. Would you like help with anything specific about any of these applications?`;
  }

  // ── IS MY DATA SAFE ──
  if (q.includes('safe') || q.includes('secure') || q.includes('protected') || q.includes('private') || q.includes('trust')) {
    const total = logs.length;
    const granted = logs.filter(l => l.accessGranted).length;
    const denied = logs.filter(l => !l.accessGranted).length;
    if (total === 0) {
      return `Yes, your data is completely safe, ${firstName}! No one has attempted to access your documents yet.\n\nKibaliGuard enforces strict consent rules. Even if an HR officer has your CV, they can only access it if:\n✅ Their role matches what you allowed\n✅ Their stated purpose matches exactly what you approved\n✅ Your consent has not expired or been withdrawn\n\nIf any of those three conditions fail, access is automatically denied and logged. You are protected.`;
    }
    return `Your data is safe, ${firstName}. Here is your all-time security summary:\n\n🔐 Total access attempts: ${total}\n✅ Access granted: ${granted}\n❌ Access blocked: ${denied}\n\nEvery granted access means you had given valid consent for that exact purpose. Every blocked attempt means KibaliGuard enforced your rules and protected your data automatically. You are in control.`;
  }

  // ── CONSENT EXPIRY ──
  if (q.includes('expire') || q.includes('expiry') || q.includes('how long') || (q.includes('consent') && q.includes('when'))) {
    if (activeConsents.length === 0) {
      return `You currently have no active consents, ${firstName}. When you apply for a job and set consent rules, I will track exactly when each one expires and warn you in advance.`;
    }
    const lines = activeConsents.map(c => {
      const expires = new Date(c.expiresAt);
      const now = new Date();
      const daysLeft = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
      const urgency = daysLeft <= 1 ? '⚠️ EXPIRING TODAY' : daysLeft <= 3 ? '⚠️ Expiring soon' : '✅';
      return `${urgency} Consent for "${c.purpose}" (${c.allowedRole}) — expires ${expires.toLocaleString('en-KE')} (${daysLeft} day${daysLeft !== 1 ? 's' : ''} left)`;
    });
    return `Here are your active consents, ${firstName}:\n\n${lines.join('\n\n')}\n\nYou can withdraw any of these from your Dashboard at any time. Want me to explain what any of these consents mean?`;
  }

  // ── COVER LETTER ──
  if (q.includes('cover letter') || q.includes('write') || (q.includes('help') && q.includes('letter'))) {
    const latest = applications[0];
    if (!latest) {
      return `I would love to help you write a cover letter, ${firstName}! Apply for a job first, then come back and ask me. I will write a professional cover letter using the actual job title and company name from your application.\n\nGo to the home page to browse open positions!`;
    }
    const jobTitle = latest.job?.title || 'the advertised position';
    const company = latest.company?.name || 'your organisation';
    return `Here is a professional cover letter for your ${jobTitle} application at ${company}:\n\n---\n\nDear Hiring Manager,\n\nMy name is ${fullName} and I am writing to express my strong interest in the ${jobTitle} position at ${company}. I am a dedicated and reliable professional with a genuine commitment to excellence and a proven ability to deliver results in fast-paced environments.\n\nI have submitted all my required documents through KibaliGuard, which means you have transparent, consent-based access to everything you need to evaluate my application. I believe this reflects the kind of professionalism and integrity I would bring to your team every single day.\n\nI am eager to discuss how my background, skills and enthusiasm can contribute meaningfully to ${company}. I am available at your earliest convenience and look forward to the opportunity.\n\nThank you sincerely for considering my application.\n\nYours faithfully,\n${fullName}\n---\n\nFeel free to customise this! Would you like me to make it more specific to your skills or experience?`;
  }

  // ── HOW TO USE KIBALIGUARD ──
  if (q.includes('how') && (q.includes('use') || q.includes('start') || q.includes('begin') || q.includes('work'))) {
    return `Here is how to get the most out of KibaliGuard, ${firstName}:\n\n1️⃣ Browse jobs on the home page and apply for any that match your skills\n\n2️⃣ When applying, upload your documents and set consent rules — choose who can see each document, why, and for how long\n\n3️⃣ Check your Dashboard regularly — it shows all your applications, their statuses, and any recent activity on your documents\n\n4️⃣ Use "Who Saw My Documents" to see a full log of every access attempt\n\n5️⃣ Join the Talent Pool so companies can find you even when you are not actively applying\n\n6️⃣ Ask me (Kiba) anything — I can check your status, help write cover letters, and explain what is happening with your data in plain language\n\nWhat would you like to do first?`;
  }

  // ── WHAT CAN KIBA DO ──
  if ((q.includes('what') && (q.includes('can you do') || q.includes('can kiba') || q.includes('do you do'))) || q.includes('help me with') || q.includes('what do you know')) {
    return `Great question, ${firstName}! Here is everything I can help you with:\n\n📋 Check your application status — ask "What is my application status?"\n👁️ See who accessed your data — ask "Who saw my documents today?"\n⏱️ Check your consent expiry — ask "When does my consent expire?"\n🛡️ Verify your data safety — ask "Is my data safe?"\n✍️ Write a cover letter — ask "Help me write a cover letter"\n🏊 Explain the Talent Pool — ask "How does the Talent Pool work?"\n💼 Show available jobs — ask "What jobs are available?"\n📖 Explain how consent works — ask "How does consent work?"\n🔄 Guide you on updating documents — ask "How do I update my CV?"\n❌ Guide you on withdrawing consent — ask "How do I stop sharing my data?"\n\nI read your live data directly so all my answers are real and accurate. Ask me anything!`;
  }

  // ── HR / STAFF RELATED ──
  if (q.includes('hr') || q.includes('recruiter') || q.includes('company') && (q.includes('access') || q.includes('see') || q.includes('view'))) {
    return `Here is exactly how HR officers and companies can access your data on KibaliGuard, ${firstName}:\n\n🔐 An HR officer can only access your documents if:\n   1. You gave them consent for their specific role\n   2. The purpose they state matches exactly what you approved\n   3. Your consent has not expired and you have not withdrawn it\n\nIf ANY of those three conditions fail, the system automatically blocks access and logs the attempt. You are notified every time.\n\n📋 What HR officers can do:\n   • Request access to your documents\n   • Review your application\n   • Update your application status (shortlisted, hired, etc.)\n\n🚫 What HR officers CANNOT do:\n   • Access your documents without your consent\n   • Keep your data after your consent expires\n   • Share your documents with third parties without a separate approval from you\n\nYou are always in control. Does that answer your question?`;
  }

  // ── THANK YOU ──
  if (q.includes('thank') || q.includes('asante') || q.includes('great') || q.includes('perfect') || q.includes('awesome') || q.includes('wonderful') || q.includes('helpful')) {
    return `Karibu sana, ${firstName}! It is my pleasure. I am here whenever you need me — day or night. Your data is safe and you are in control. Is there anything else I can help you with?`;
  }

  // ── DEFAULT ──
  return `Hello ${firstName}! I am Kiba and I am here to help you. Here are some things you can ask me:\n\n• "What jobs are available right now?"\n• "Who accessed my data today?"\n• "What is my application status?"\n• "How does consent work?"\n• "Help me write a cover letter"\n• "How do I stop sharing my data with a company?"\n• "Is my data safe?"\n• "How does the Talent Pool work?"\n\nWhat would you like to know?`;
};

router.post('/', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Please enter a message' });

    const [consents, logs, applications, notifications] = await Promise.all([
      Consent.find({ customer: req.user._id }).sort({ createdAt: -1 }),
      AccessLog.find({ customer: req.user._id }).populate('accessedBy', 'fullName role').sort({ createdAt: -1 }).limit(50),
      Application.find({ applicant: req.user._id }).populate('job', 'title location').populate('company', 'name').sort({ createdAt: -1 }),
      Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(10)
    ]);

    const activeConsents = consents.filter(c => c.status === 'active');
    const expiredConsents = consents.filter(c => c.status === 'expired');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = logs.filter(l => new Date(l.createdAt) >= today);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekLogs = logs.filter(l => new Date(l.createdAt) >= weekAgo);

    const reply = await buildKibaReply(message, {
      applications,
      activeConsents,
      expiredConsents,
      todayLogs,
      thisWeekLogs,
      logs,
      notifications,
      fullName: req.user.fullName,
      inTalentPool: false
    });

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Kiba is having a little trouble right now. Please try again in a moment.' });
  }
});

module.exports = router;