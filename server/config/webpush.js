const webpush = require('web-push');

const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BPMK_TJlMpofilJazUA6KzT5SuE6pOTTpWboY_UmCf622mH9y1gBwfW0h460k90T66ZVFaK2ZrUmF59-7apj1zU';

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'sjiKEmGuUJFY4gUcBmgB-2oARQEFokmz7Yb1_NCfb-w';

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:support@zenithapp.com';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('✅ WebPush VAPID configured successfully');
} catch (err) {
  console.error('❌ Failed to configure WebPush VAPID:', err.message);
}

module.exports = {
  webpush,
  VAPID_PUBLIC_KEY
};
