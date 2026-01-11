const nodemailer = require('nodemailer');

/**
 * Reusable SMTP transport utility for the Luzzio platform.
 * Ensures all corporate communications adhere to secure protocols.
 */
const sendEmail = async (options) => {
   const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Protocol: SSL/TLS
      auth: {
         user: process.env.SMTP_USER?.trim(),
         pass: process.env.SMTP_PASS?.trim(),
      },
      debug: true, // Protocol: Detailed debug output
      logger: true // Protocol: Log information in console
   });

   // Protocol Verification Handshake
   if (process.env.SMTP_VERIFY === 'true') {
      try {
         await transporter.verify();
      } catch (verifyErr) {
         console.error('SMTP Verification Failure:', verifyErr.message);
         // Don't throw here, let sendMail try anyway as verify can be flaky
      }
   }

   const message = {
      from: `"${process.env.FROM_NAME || 'LUZZIO'}" <${process.env.SMTP_USER}>`,
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
