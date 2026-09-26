/**
 * Luzzio OmniCore — Server-side Validation Utility
 * Centralised helpers used across all controllers.
 * Keeps controller code clean and ensures consistent error messages.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\+\-\(\)]{7,20}$/;

/**
 * Returns the first validation error message, or null if all pass.
 * Rules are an array of { condition: boolean, message: string }.
 * @param {Array<{condition: boolean, message: string}>} rules
 * @returns {string|null}
 */
const firstError = (rules) => {
   for (const rule of rules) {
      if (rule.condition) return rule.message;
   }
   return null;
};

/** Shorthand: send 400 with a message string */
const fail = (res, message) => res.status(400).json({ success: false, message });

/** True if value is blank / undefined / null */
const blank = (v) => v === undefined || v === null || String(v).trim() === '';

/** True if value is a finite number >= 0 */
const nonNeg = (v) => {
   const n = Number(v);
   return !isNaN(n) && isFinite(n) && n >= 0;
};

/** True if value is a finite number > 0 */
const positive = (v) => {
   const n = Number(v);
   return !isNaN(n) && isFinite(n) && n > 0;
};

/** True if value is a finite integer >= min */
const int = (v, min = 0) => {
   const n = Number(v);
   return !isNaN(n) && Number.isInteger(n) && n >= min;
};

/** True if email string is valid */
const validEmail = (v) => typeof v === 'string' && EMAIL_REGEX.test(v.trim());

/** True if phone string is valid */
const validPhone = (v) => typeof v === 'string' && PHONE_REGEX.test(v.trim());

module.exports = { firstError, fail, blank, nonNeg, positive, int, validEmail, validPhone };
