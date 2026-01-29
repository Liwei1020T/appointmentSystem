/**
 * SMS Sender (Twilio via REST API)
 *
 * Purpose:
 * - Send OTP codes for phone-based authentication.
 * - Works in production with Twilio, and falls back to console log in dev if not configured.
 *
 * Environment variables (see docs/SMS_QUICK_START.md):
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_FROM_NUMBER
 */

export type SmsSendResult =
  | { success: true; provider: 'twilio'; messageId: string }
  | { success: true; provider: 'dev' }
  | { success: false; provider: 'twilio' | 'dev'; error: string };

/**
 * Send an SMS message.
 *
 * @param to - E.164 phone number, e.g. "+601131609008"
 * @param body - message text content
 */
export async function sendSms(to: string, body: string): Promise<SmsSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  // Dev fallback: no external dependency; avoids blocking local development.
  if (!accountSid || !authToken || !fromNumber) {
    console.info('[SMS DEV] To:', to);
    console.info('[SMS DEV] Body:', body);
    return { success: true, provider: 'dev' };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const payload = new URLSearchParams({
      To: to,
      From: fromNumber,
      Body: body,
    });

    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, provider: 'twilio', error: text || 'Failed to send SMS' };
    }

    const json: any = await res.json();
    return { success: true, provider: 'twilio', messageId: String(json.sid || '') };
  } catch (error: any) {
    return { success: false, provider: 'twilio', error: error?.message || 'Failed to send SMS' };
  }
}

