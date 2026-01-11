const nodemailer = require('nodemailer');

/**
 * Robust Multi-Protocol Dispatcher.
 * Prioritizes 465 (SSL) over 587 (STARTTLS) due to cloud-specific protocol filtering.
 */
const sendEmail = async (options) => {
   const message = {
      from: `"${process.env.FROM_NAME || 'LUZZIO'}" <${process.env.SMTP_USER?.trim()}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
   };

   // Link Strategy Loop
   const configs = [
      { host: 'smtp.gmail.com', port: 465, secure: true },
      { host: 'smtp.gmail.com', port: 587, secure: false },
      { host: 'smtp-relay.gmail.com', port: 587, secure: false }
   ];

   for (const config of configs) {
      try {
         console.log(`[SMTP LINK] Probing ${config.host}:${config.port} (Secure: ${config.secure})`);
         const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
               user: process.env.SMTP_USER?.trim(),
               pass: process.env.SMTP_PASS?.trim(),
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
            tls: { rejectUnauthorized: false }
         });

         const info = await transporter.sendMail(message);
         console.log(`[SMTP SUCCESS] Protocol Handshake Verified via Port ${config.port}`);
         return info;
      } catch (err) {
         console.warn(`[SMTP BLOCKED] Port ${config.port} failed: ${err.message}`);
         // Next config
      }
   }

   console.error('[SMTP CRITICAL] All strategic ports blocked. Potential egress firewall active.');
   throw new Error('All SMTP connection attempts timed out. Verify Railway Egress rules.');
};

module.exports = sendEmail;
