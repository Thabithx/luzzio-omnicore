const nodemailer = require('nodemailer');

// Protocol: Create transporter once at module level for maximum efficiency
const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
const smtpSecure = smtpPort === 465;

console.log(`[SMTP SYSTEM] Initializing with Port: ${smtpPort} | Secure: ${smtpSecure}`);

const transporter = nodemailer.createTransport({
   host: process.env.SMTP_HOST || 'smtp.gmail.com',
   port: smtpPort,
   secure: smtpSecure,
   auth: {
      user: process.env.SMTP_USER?.trim(),
      pass: process.env.SMTP_PASS?.trim(),
   },
   debug: true,
   logger: true,
   tls: {
      rejectUnauthorized: false
   }
});

// Perform a single startup verification
transporter.verify((error) => {
   if (error) {
      console.error('[SMTP SYSTEM ERROR] Startup handshake failed:', error.message);
   } else {
      console.log('[SMTP SYSTEM SUCCESS] Connection verified and ready.');
   }
});

/**
 * Reusable SMTP transport utility for the Luzzio platform.
 */
const sendEmail = async (options) => {
   const message = {
      from: `"${process.env.FROM_NAME || 'LUZZIO'}" <${process.env.SMTP_USER?.trim()}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
   };

   console.log(`[SMTP DISPATCH] To: ${options.email} | Subject: ${options.subject}`);

   try {
      const info = await transporter.sendMail(message);
      console.log('[SMTP SUCCESS] Message Delivered: %s', info.messageId);
      return info;
   } catch (sendErr) {
      console.error('[SMTP FAILURE] Dispatch Error:', sendErr.message);
      if (sendErr.code === 'EAUTH') {
         console.error('CRITICAL: SMTP Authentication Failed. Check credentials in .env');
      }
      throw sendErr;
   }
};

module.exports = sendEmail;
