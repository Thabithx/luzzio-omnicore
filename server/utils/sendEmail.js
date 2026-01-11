const nodemailer = require('nodemailer');

/**
 * Reusable SMTP transport utility for the Luzzio platform.
 * Ensures all corporate communications adhere to secure protocols.
 */
const sendEmail = async (options) => {
   const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: parseInt(process.env.SMTP_PORT) === 465, // True if 465, false for others (like 587)
      auth: {
         user: process.env.SMTP_USER?.trim(),
         pass: process.env.SMTP_PASS?.trim(),
      },
      debug: true,
      logger: true
   });

   // Protocol Verification Handshake
   transporter.verify((error, success) => {
      if (error) {
         console.error('[SMTP CONNECTION ERROR] Failed to handshake:', error.message);
      } else {
         console.log('[SMTP CONNECTION SUCCESS] Ready to dispatch protocols.');
      }
   });
   const message = {
      from: `"${process.env.FROM_NAME || 'LUZZIO'}" <${process.env.SMTP_USER?.trim()}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
   };

   console.log(`[SMTP] Attempting dispatch to: ${options.email} | Subject: ${options.subject}`);
   console.log(`[SMTP] Using From: ${message.from}`);

   try {
      const info = await transporter.sendMail(message);
      console.log('Order Protocol Dispatched: %s', info.messageId);
      return info;
   } catch (sendErr) {
      console.error('Email Dispatch Failure:', sendErr.message);
      if (sendErr.code === 'EAUTH') {
         console.error('CRITICAL: SMTP Authentication Failed. Check SMTP_USER and SMTP_PASS.');
      }
      throw sendErr;
   }
};

module.exports = sendEmail;
