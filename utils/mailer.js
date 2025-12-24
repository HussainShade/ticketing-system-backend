const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Verification Failed:', error);
  } else {
    console.log('✅ SMTP is ready to send emails');
  }
});

const DEFAULT_HEADERS = {
  'X-Mailer': 'SupportDesk System',
  'X-Priority': '3 (Normal)',
  'Return-Path': process.env.EMAIL_USER
};

const DEFAULT_OPTIONS = {
  from: `"Technical Support" <${process.env.EMAIL_USER}>`,
  replyTo: process.env.EMAIL_USER,
  headers: DEFAULT_HEADERS
};

// Generic Send Function
const sendMail = (options) =>
  transporter.sendMail({
    ...DEFAULT_OPTIONS,
    ...options
  });

// Templates

const createEmailTemplate = ({ greeting, intro, details, signature }) => `
  <div style="font-family: 'Segoe UI', Tahoma, sans-serif; font-size:15px; color:#222; line-height:1.6;">
    <p>${greeting}</p>
    <p>${intro}</p>
    <div style="background:#f9f9f9; padding:12px 16px; border-left:4px solid #0d6efd; margin:15px 0;">
      ${details}
    </div>
    <p>${signature}</p>
    <p style="font-size:13px; color:#888; border-top:1px solid #ddd; padding-top:10px;">
      Technical Support Team<br>
      This is an automated notification from the SupportDesk system.
    </p>
  </div>
`;

// 1. Ticket Resolved
const sendTicketResolvedMail = (to, ticketId, resolutionSummary) =>
  sendMail({
    to,
    subject: `Ticket #${ticketId} Resolved`,
    text: `Your ticket #${ticketId} has been resolved. Resolution Summary: ${resolutionSummary}`,
    html: createEmailTemplate({
      greeting: 'Dear Customer,',
      intro: `We are writing to inform you that your support ticket <strong>#${ticketId}</strong> has been resolved.`,
      details: `<strong>Resolution Summary:</strong><br>${resolutionSummary}`,
      signature: 'Thank you for contacting our support team.'
    })
  });

// 2. Ticket Created
const sendTicketCreationMail = (to, ticketId, issue_category, issue_description) =>
  sendMail({
    to,
    subject: `Ticket #${ticketId} Created – ${issue_category}`,
    text: `Your ticket #${ticketId} in category ${issue_category} has been created. Description: ${issue_description}`,
    html: createEmailTemplate({
      greeting: 'Dear Customer,',
      intro: `Your support request has been received and a ticket <strong>#${ticketId}</strong> has been created under the category <strong>${issue_category}</strong>.`,
      details: `<strong>Issue Description:</strong><br>${issue_description}`,
      signature: 'Our support team will contact you shortly.'
    })
  });

// 3. Engineer Assignment
const sendEngineerAssignmentMail = (to, ticketId, customerName, issue_category, issue_description) =>
  sendMail({
    to,
    subject: `Ticket #${ticketId} Assigned`,
    text: `Ticket #${ticketId} has been assigned to you. Customer: ${customerName}, Category: ${issue_category}, Description: ${issue_description}`,
    html: createEmailTemplate({
      greeting: 'Dear Engineer,',
      intro: `You have been assigned ticket <strong>#${ticketId}</strong> submitted by <strong>${customerName}</strong>.`,
      details: `<strong>Category:</strong> ${issue_category}<br><strong>Description:</strong> ${issue_description}`,
      signature: 'Please begin investigation and resolution at your earliest convenience.'
    })
  });

// 4. Welcome Email
const sendWelcomeMail = (to, plainPassword) =>
  sendMail({
    to,
    subject: `Welcome to SupportDesk`,
    text: `Welcome to SupportDesk!\n\nYour account has been successfully registered.\n\nUser ID: ${to}\nPassword: ${plainPassword}\n\nThank you for choosing our service.`,
    html: createEmailTemplate({
      greeting: 'Dear Customer,',
      intro: 'Welcome to <strong>SupportDesk</strong>! Your account has been successfully registered.',
      details: `
        <strong>User ID:</strong> ${to}<br>
        <strong>Password:</strong> ${plainPassword}<br>
      `,
      signature: 'We\'re glad to have you onboard.'
    })
  });

  const sendTechnicianWelcomeMail = (to, technicianId, plainPassword) =>
  sendMail({
    to,
    subject: `Your SupportDesk Technician Credentials`,
    text: `Welcome to SupportDesk!\n\nYour technician account has been created.\n\nTechnician ID: ${technicianId}\nPassword: ${plainPassword}\n\nPlease login to access your dashboard.`,
    html: createEmailTemplate({
      greeting: 'Dear Technician,',
      intro: 'Welcome to <strong>SupportDesk</strong>. Your technician account has been successfully created.',
      details: `
        <strong>Technician ID:</strong> ${technicianId}<br>
        <strong>Password:</strong> ${plainPassword}
      `,
      signature: 'You may now log in and start managing assigned tickets. Thank you.'
    })
  });



module.exports = {
  sendTicketResolvedMail,
  sendTicketCreationMail,
  sendEngineerAssignmentMail,
  sendWelcomeMail,
  sendTechnicianWelcomeMail
};
