/**
 * Generate VAPID Keys for Web Push
 * 
 * Run this script once to generate your VAPID keys:
 * node scripts/generate-vapid-keys.js
 * 
 * Then add the keys to your .env file
 */

const webpush = require('web-push');

console.log('\n🔑 Generating VAPID Keys for Web Push...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys Generated!\n');
console.log('Add these to your .env file:\n');
console.log('# Web Push (VAPID Keys)');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\nAlso add to Supabase Edge Function secrets:');
console.log(`supabase secrets set VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`supabase secrets set VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\n✨ Done!\n');
