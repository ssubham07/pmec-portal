/**
 * SMS Gateway Dispatcher for PMEC Portal
 * Sends OTP and transactional alerts to student mobile numbers.
 */
require('dotenv').config();

async function sendSMS({ to, message }) {
  if (!to) return;
  const cleanPhone = String(to).replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+${cleanPhone}`;

  console.log(`[SMS GATEWAY] Sent to ${formattedPhone}: "${message}"`);

  // Optional: Integration with SMS provider if API key exists in .env
  if (process.env.FAST2SMS_API_KEY) {
    try {
      await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'v3',
          sender_id: 'TXTIND',
          message,
          language: 'english',
          flash: 0,
          numbers: cleanPhone.slice(-10),
        }),
      });
    } catch (err) {
      console.error(`[SMS GATEWAY] Failed to dispatch via Fast2SMS to ${formattedPhone}:`, err.message);
    }
  }
}

module.exports = { sendSMS };
