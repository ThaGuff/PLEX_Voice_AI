const twilio = require('twilio');
const nodemailer = require('nodemailer');

async function sendSMSNotification(org, toPhone, message) {
  if (!org.twilio_account_sid || !org.twilio_auth_token || !org.twilio_phone_number) {
    console.log('[SMS skipped] Twilio not configured for org:', org.id);
    return;
  }
  try {
    const client = twilio(org.twilio_account_sid, org.twilio_auth_token);
    await client.messages.create({
      body: message,
      from: org.twilio_phone_number,
      to: toPhone,
    });
    console.log(`[SMS sent] to ${toPhone}`);
  } catch (err) {
    console.error('[SMS error]', err.message);
  }
}

async function sendTeamSMS(org, message) {
  if (!org.notification_sms) return;
  const numbers = org.notification_sms.split(',').map(n => n.trim());
  for (const num of numbers) {
    await sendSMSNotification(org, num, message);
  }
}

async function sendEmailNotification(org, subject, html) {
  if (!process.env.SMTP_HOST || !org.notification_email) return;
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"ARIA Platform" <${process.env.SMTP_FROM || 'noreply@ariaplatform.io'}>`,
      to: org.notification_email,
      subject,
      html,
    });
    console.log(`[Email sent] ${subject}`);
  } catch (err) {
    console.error('[Email error]', err.message);
  }
}

module.exports = { sendSMSNotification, sendTeamSMS, sendEmailNotification };
