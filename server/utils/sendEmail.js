const axios = require('axios');

/**
 * Modern HTTP-based Email Dispatcher.
 * Bypasses all cloud firewalls by using Port 443 (Standard Web Traffic).
 */
const sendEmail = async (options) => {
   const resendApiKey = process.env.RESEND_API_KEY;

   // Protocol: Use custom FROM if domain is verified, else fallback to onboarding domain
   const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
   const fromName = process.env.FROM_NAME || 'LUZZIO';

   // Primary delivery via Resend API (Firewall-Proof)
   if (resendApiKey) {
      console.log(`[EMAIL API] Dispatching via Resend to: ${options.email} | From: ${fromEmail}`);
      try {
         const response = await axios.post('https://api.resend.com/emails', {
            from: `${fromName} <${fromEmail}>`,
            to: options.email,
            subject: options.subject,
            html: options.html,
         }, {
            headers: {
               'Authorization': `Bearer ${resendApiKey}`,
               'Content-Type': 'application/json'
            }
         });
         console.log(`[EMAIL SUCCESS] Delivered via API: ${response.data.id}`);
         return response.data;
      } catch (err) {
         const errorMsg = err.response?.data?.message || err.message;
         console.error(`[EMAIL API FAILURE] Resend rejected request: ${errorMsg}`);

         if (errorMsg.includes('onboarding@resend.dev') || errorMsg.includes('verify')) {
            console.warn('[EMAIL SHIELD] ACTION REQUIRED: Your domain is likely unverified in Resend. Admin emails and external customers will be rejected until domain verification is complete.');
         }
      }
   } else {
      console.warn('[EMAIL WARNING] No RESEND_API_KEY found. Falling back to local console log.');
   }

   // Fallback: Console Dispatch (Ensures production orders don't hang)
   console.log('-------------------------------------------');
   console.log(`[MOCK EMAIL] TO: ${options.email}`);
   console.log(`[MOCK EMAIL] SUBJECT: ${options.subject}`);
   console.log('-------------------------------------------');

   return { mock: true, messageId: 'mock-id' };
};

module.exports = sendEmail;
