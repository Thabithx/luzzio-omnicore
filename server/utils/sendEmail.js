const nodemailer = require('nodemailer');

/**
 * Creates a transporter for a specific host and port.
 */
const createTransporter = (host, port) => {
   const secure = port === 465;
   return nodemailer.createTransport({
      host: host,
      port: port,
      secure: secure,
      auth: {
         user: process.env.SMTP_USER?.trim(),
         pass: process.env.SMTP_PASS?.trim(),
      },
      connectionTimeout: 10000, // 10s timeout to next fallback
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
         rejectUnauthorized: false
      }
   });
};

/**
 * High-Availability SMTP Strategy.
 * Tries variants of Gmail SMTP to bypass cloud-provider port blocking.
 */
const sendEmail = async (options) => {
   const configs = [
      { host: 'smtp.gmail.com', port: 587 },
      { host: 'smtp.gmail.com', port: 465 },
      { host: 'smtp-relay.gmail.com', port: 587 },
      { host: 'smtp.googlemail.com', port: 465 }
   ];

   let lastError = null;

   for (const config of configs) {
      try {
         console.log(`[SMTP STRATEGY] Attempting Link: ${config.host}:${config.port}`);
         const transporter = createTransporter(config.host, config.port);

         const message = {
            from: `"${process.env.FROM_NAME || 'LUZZIO'}" <${process.env.SMTP_USER?.trim()}>`,
            to: options.email,
            subject: options.subject,
            html: options.html,
         };

         const info = await transporter.sendMail(message);
         console.log(`[SMTP REACHED] Verified via ${config.host}:${config.port} | ID: ${info.messageId}`);
         return info;
      } catch (err) {
         console.warn(`[SMTP BYPASS] Link ${config.host}:${config.port} blocked: ${err.message}`);
         lastError = err;
      }
   }

   console.error('[SMTP CRITICAL] All strategic links exhausted. Protocol failure.');
   throw lastError;
};

module.exports = sendEmail;
