const nodemailer = require('nodemailer');

/**
 * Creates a transporter for a specific port/config.
 */
const createPoolTransporter = (port) => {
   const secure = port === 465;
   return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: secure,
      auth: {
         user: process.env.SMTP_USER?.trim(),
         pass: process.env.SMTP_PASS?.trim(),
      },
      connectionTimeout: 20000, // 20s
      greetingTimeout: 20000,
      socketTimeout: 30000,
      dnsTimeout: 10000,
      tls: {
         rejectUnauthorized: false
      }
   });
};

/**
 * Robust SMTP fallback utility.
 * Tries 587, then 465, then 2525.
 */
const sendEmail = async (options) => {
   const ports = [587, 465, 2525];
   let lastError = null;

   for (const port of ports) {
      try {
         console.log(`[SMTP PROTOCOL] Attempting port ${port} | To: ${options.email}`);
         const transporter = createPoolTransporter(port);

         const message = {
            from: `"${process.env.FROM_NAME || 'LUZZIO'}" <${process.env.SMTP_USER?.trim()}>`,
            to: options.email,
            subject: options.subject,
            html: options.html,
         };

         const info = await transporter.sendMail(message);
         console.log(`[SMTP SUCCESS] Delivered via port ${port}: %s`, info.messageId);
         return info;
      } catch (err) {
         console.error(`[SMTP ERROR] Port ${port} failed: ${err.message}`);
         lastError = err;
         // Continue to next port
      }
   }

   console.error('[SMTP CRITICAL] All ports exhausted. Message deferred.');
   throw lastError;
};

module.exports = sendEmail;
