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
   });

   // Protocol Verification Handshake
   try {
      await transporter.verify();
   } catch (verifyErr) {
      console.error('SMTP Verification Failure:', verifyErr.message);
      throw verifyErr;
   }

   const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
   };

   const info = await transporter.sendMail(message);
   console.log('Order Protocol Dispatched: %s', info.messageId);
};

module.exports = sendEmail;
