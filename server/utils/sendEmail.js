const axios = require('axios');

/**
 * Modern HTTP-based Email Dispatcher.
 * Bypasses all cloud firewalls by using Port 443 (Standard Web Traffic).
 */
const sendEmail = async (options) => {
   const resendApiKey = process.env.RESEND_API_KEY;

   // Protocol: Primary delivery via Resend API (Firewall-Proof)
   if (resendApiKey) {
      console.log(`[EMAIL API] Dispatching via Resend to: ${options.email}`);
      try {
         const response = await axios.post('https://api.resend.com/emails', {
            from: `${process.env.FROM_NAME || 'LUZZIO'} <onboarding@resend.dev>`, // Note: Domain must be verified in Resend for custom FROM
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
         console.error(`[EMAIL API FAILURE] Resend rejected request: ${err.response?.data?.message || err.message}`);
         // Fall through to console log to prevent server crash
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
