const Notification = require('../models/notificationModel');

const createNotification = async (recipientId, type, jobTitle, companyName, extra = {}) => {
  try {
    const notifications = {
      application_received: {
        title: 'Application Received',
        message: `Your application for ${jobTitle} at ${companyName} has been received. Kiba is keeping your documents safe.`,
        pose: 8
      },
      application_under_review: {
        title: 'Application Under Review',
        message: `Good news! ${companyName} is reviewing your application for ${jobTitle}. Your documents were accessed with your consent.`,
        pose: 7
      },
      application_shortlisted: {
        title: 'You Have Been Shortlisted',
        message: `You have been shortlisted for ${jobTitle} at ${companyName}! They may contact you soon. Well done!`,
        pose: 8
      },
      application_hired: {
        title: 'Congratulations! You Got the Job',
        message: `Congratulations! ${companyName} has selected you for the ${jobTitle} position. You did it!`,
        pose: 2
      },
      application_rejected: {
        title: 'Application Update',
        message: `${companyName} has moved forward with other candidates for ${jobTitle}. Do not give up. New opportunities are waiting for you.`,
        pose: 3
      },
      consent_expiring: {
        title: 'Consent Expiring Soon',
        message: `Your consent for ${companyName} expires in 24 hours. Would you like to renew it or let it expire?`,
        pose: 6
      },
      consent_expired: {
        title: 'Consent Expired',
        message: `Your consent for ${companyName} has expired. ${companyName} can no longer access your documents.`,
        pose: 3
      },
      document_accessed: {
        title: 'Your Document Was Accessed',
        message: extra.accessorName
          ? `${extra.accessorName} from ${companyName} viewed your ${extra.documentName || 'document'} for ${extra.purpose || 'job verification'}.`
          : `Someone from ${companyName} accessed your documents.`,
        pose: 3
      },
      third_party_request: {
        title: 'Third Party Sharing Request',
        message: `${companyName} wants to share your ${extra.documentName || 'documents'} with ${extra.thirdPartyName || 'a third party'}. Do you approve?`,
        pose: 3
      },
      talent_pool_match: {
        title: 'New Job Matching Your Skills',
        message: `A new job matching your skills has been posted by ${companyName}. Would you like to apply?`,
        pose: 8
      },
      job_closing_soon: {
        title: 'Job Closing Soon',
        message: `The ${jobTitle} position at ${companyName} closes in 24 hours. Make sure your documents are complete.`,
        pose: 6
      },
      weekly_summary: {
        title: 'Your Weekly KibaliGuard Summary',
        message: extra.summaryMessage || `Here is your week at KibaliGuard. Stay on top of your applications and consents.`,
        pose: 8
      },
      new_application: {
        title: 'New Application Received',
        message: `${extra.applicantName || 'A new applicant'} has applied for ${jobTitle}. Review it in your Applications tab.`,
        pose: 8
      },
      new_registration: {
        title: 'New User Registered',
        message: `${extra.userName || 'Someone'} has just registered as a ${extra.role || 'user'}.`,
        pose: 8
      }
    };

    const notif = notifications[type];
    if (!notif) return;

    await Notification.create({
      recipient: recipientId,
      type,
      title: notif.title,
      message: notif.message,
      pose: notif.pose,
      relatedJob: extra.jobId || null,
      relatedApplication: extra.applicationId || null,
      relatedCompany: companyName || null,
      actionUrl: extra.actionUrl || null
    });
  } catch (err) {
    console.error('Notification creation error:', err);
  }
};

module.exports = { createNotification };
