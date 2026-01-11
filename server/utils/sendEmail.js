const nodemailer = require('nodemailer');

/**
 * High-Level Gmail Transport.
 * Uses Nodemailer "service" shorthand to handle host/port/SSL defaults.
 */
const sendEmail = async (options) => {
   const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
         user: process.env.SMTP_USER?.trim(),
         pass: process.env.SMTP_PASS?.trim(), // Ensure this is an "App Password"
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      tls: {
         rejectUnauthorized: false
      }
   });

   const message = {
      from: `"${process.env.FROM_NAME || 'LUZZIO'}" <${process.env.SMTP_USER?.trim()}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
   };

   console.log(`[SMTP SERVICE] Initiating dispatch to: ${options.email}`);

   try {
      const info = await transporter.sendMail(message);
      console.log(`[SMTP SUCCESS] Delivered via Gmail Service: %s`, info.messageId);
      return info;
   } catch (err) {
      console.error(`[SMTP FAILURE] Service Dispatch Error: ${err.message}`);

      // Secondary Hail Mary: Try Port 2525 explicitly if service shorthand fails
      if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
         console.log('[SMTP FALLBACK] Attempting Port 2525...');
         const fallbackTransporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 2525,
            secure: false,
            auth: {
               user: process.env.SMTP_USER?.trim(),
               pass: process.env.SMTP_PASS?.trim(),
            },
            tls: { rejectUnauthorized: false }
         });

         try {
            const fallbackInfo = await fallbackTransporter.sendMail(message);
            console.log('[SMTP SUCCESS] Delivered via Fallback Port 2525');
            return fallbackInfo;
         } catch (fErr) {
            console.error('[SMTP CRITICAL] All transport methods exhausted.');
            throw fErr;
         }
      }
      throw err;
   }
};

module.exports = sendEmail;
