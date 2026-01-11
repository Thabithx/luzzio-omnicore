const nodemailer = require('nodemailer');

/**
 * Universal SMTP Dispatcher for Restricted Environments.
 * Cycles through hosts and ports likely to be open in cloud containers.
 */
const sendEmail = async (options) => {
   const message = {
      from: `"${process.env.FROM_NAME || 'LUZZIO'}" <${process.env.SMTP_USER?.trim()}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
   };

   // Strategic Link Matrix
   const configs = [
      { host: 'smtp.googlemail.com', port: 465, secure: true },
      { host: 'smtp.gmail.com', port: 465, secure: true },
      { host: 'smtp.gmail.com', port: 587, secure: false },
      { host: 'smtp.gmail.com', port: 2525, secure: false }, // Cloud-friendly alternative
      { host: 'smtp-relay.gmail.com', port: 587, secure: false }
   ];

   for (const config of configs) {
      try {
         console.log(`[SMTP PROBE] Link: ${config.host}:${config.port} | Secure: ${config.secure}`);
         const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
               user: process.env.SMTP_USER?.trim(),
               pass: process.env.SMTP_PASS?.trim(),
            },
            connectionTimeout: 8000, // Faster failure to move through matrix
            greetingTimeout: 8000,
            socketTimeout: 10000,
            family: 4, // Force IPv4 to avoid Railway IPv6 resolving issues
            tls: { rejectUnauthorized: false }
         });

         const info = await transporter.sendMail(message);
         console.log(`[SMTP SUCCESS] Protocol Handshake Verified via ${config.host}:${config.port}`);
         return info;
      } catch (err) {
         console.warn(`[SMTP BLOCKED] ${config.host}:${config.port} -> ${err.message}`);
      }
   }

   console.error('[SMTP CRITICAL] All strategic links exhausted. Egress firewall or auth failure.');
   throw new Error('Email service currently unavailable due to network restrictions.');
};

module.exports = sendEmail;
