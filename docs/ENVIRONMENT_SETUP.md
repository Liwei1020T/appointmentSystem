# Notification System - Environment Variables Setup Guide

## Required Environment Variables

The notification system requires the following environment variables to be configured in your Supabase project:

### SMS (Twilio) Configuration

```bash
# Get these from https://www.twilio.com/console
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Setup Steps:**
1. Create a Twilio account at https://www.twilio.com/try-twilio
2. Get a phone number from Twilio Console
3. Copy Account SID and Auth Token from Console Dashboard
4. Set environment variables in Supabase:

```bash
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token_here
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
```

### Push Notifications (Firebase Cloud Messaging) Configuration

```bash
# Get these from Firebase Console > Project Settings > Service Accounts
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

**Setup Steps:**
1. Create a Firebase project at https://console.firebase.google.com/
2. Go to Project Settings > Service Accounts
3. Click "Generate New Private Key" to download JSON file
4. Extract the values from the JSON file:
   - `project_id` → FIREBASE_PROJECT_ID
   - `private_key` → FIREBASE_PRIVATE_KEY (keep the \n newlines)
   - `client_email` → FIREBASE_CLIENT_EMAIL

5. Set environment variables in Supabase:

```bash
supabase secrets set FIREBASE_PROJECT_ID=your-project-id
supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"
supabase secrets set FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

### Payment Webhook Configuration

```bash
# Secret key for webhook signature verification
PAYMENT_WEBHOOK_SECRET=your_random_secret_key_here
```

**Setup:**
```bash
supabase secrets set PAYMENT_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

## Verifying Environment Variables

After setting the environment variables, verify they are configured correctly:

```bash
# List all secrets (values are hidden)
supabase secrets list

# Test the send-notification function
curl -X POST https://your-project.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-id",
    "event_type": "payment_success",
    "variables": {
      "amount": "50.00",
      "order_id": "123"
    }
  }'
```

## Dependencies

The notification system uses standard Deno APIs and does not require additional npm packages. All integrations (Twilio, FCM) are done via HTTP fetch:

- **Twilio SMS**: Direct API calls via fetch()
- **Firebase FCM**: OAuth2 + HTTP v1 API via fetch()

No changes to `import_map.json` are required.

## Testing Without Real Credentials

For local testing or development without SMS/Push capabilities:

1. The system will gracefully skip SMS/Push sending if credentials are not configured
2. Notifications will still be logged in the database
3. Console warnings will indicate missing credentials

**Development Mode:**
```bash
# Skip credential checks (Edge Functions will log warnings)
# Just ensure database migration is applied
psql -U postgres -d your_database -f sql/migrations/009_notifications.sql
```

## Production Deployment Checklist

- [ ] Twilio account created and verified
- [ ] Twilio phone number purchased
- [ ] Firebase project created
- [ ] Firebase service account key generated
- [ ] All environment variables set in Supabase
- [ ] Edge Function deployed: `supabase functions deploy send-notification`
- [ ] Database migration applied: `009_notifications.sql`
- [ ] Test notification sent successfully
- [ ] Webhook secret configured
- [ ] Payment webhook updated and deployed

## Troubleshooting

**SMS not sending:**
- Check TWILIO_* environment variables are set correctly
- Verify Twilio account is not in trial mode (trial accounts can only send to verified numbers)
- Check Edge Function logs: `supabase functions logs send-notification`

**Push not sending:**
- Verify FIREBASE_* environment variables are set
- Check FIREBASE_PRIVATE_KEY has proper \n newlines
- Ensure Firebase project has FCM enabled
- Verify user devices are registered in `user_devices` table
- Check device tokens are valid and not expired

**Notifications not triggering:**
- Ensure Edge Function is deployed: `supabase functions deploy send-notification`
- Check payment-webhook is calling sendNotification() correctly
- Verify notification templates are active in database
- Check Edge Function logs for errors

**Database errors:**
- Ensure migration 009_notifications.sql is applied
- Verify RLS policies are not blocking inserts
- Check user_id references are valid UUIDs
