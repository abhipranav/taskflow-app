# TaskFlow Notifications Setup Guide

This guide covers how to enable all notification features in TaskFlow.

---

## 📬 Email Notifications (via Resend)

Email notifications send reminders for due soon tasks, overdue tasks, and daily digest summaries.

### 1. Install Resend SDK

```bash
npm install resend
```

### 2. Get API Key

1. Go to [resend.com](https://resend.com) and create an account
2. Navigate to **API Keys** in the dashboard
3. Create a new API key

### 3. Add Environment Variable

Add to your `.env.local` file:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

### 4. (Optional) Verify Custom Domain

By default, emails are sent from `onboarding@resend.dev`. To use your own domain:

1. Go to **Domains** in Resend dashboard
2. Add your domain and follow DNS verification steps
3. Update the `from` address in `/src/lib/email.ts`

---

## 🔔 Push Notifications (via Web Push API)

Browser push notifications alert you even when TaskFlow isn't open.

### 1. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

This outputs:
```
Public Key: BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY
Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Add Environment Variables

Add to your `.env.local` file:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Note:** The public key must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### 3. Configure Push Service (Optional)

For sending push notifications from the server, install web-push:

```bash
npm install web-push
```

Then create a utility in `/src/lib/push.ts`:

```typescript
import webPush from 'web-push';

webPush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  subscription: webPush.PushSubscription,
  payload: { title: string; body: string; url?: string }
) {
  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error('Push notification failed:', error);
  }
}
```

---

## ⏰ Cron Jobs (via Vercel)

The reminder system runs on a schedule to check for due tasks and send notifications.

### For Vercel Deployment

The cron job is already configured in `vercel.json`. It runs every hour.

#### 1. Add Cron Secret

Generate a secure secret:

```bash
openssl rand -hex 32
```

Add to your Vercel environment variables (and `.env.local` for testing):

```env
CRON_SECRET=your-generated-secret-here
```

#### 2. How It Works

- Runs every hour at minute 0
- Checks for tasks due within user's configured lead time (default 24h)
- Checks for overdue tasks (once per day)
- Respects user's quiet hours settings
- Prevents duplicate notifications

### For Local Development

You can manually trigger the cron job:

```bash
curl -H "Authorization: Bearer your-cron-secret" http://localhost:3000/api/cron/reminders
```

Or use a local cron scheduler like `node-cron` for development.

---

## 🗄️ Database Setup

The notification tables should already be created. If not, run:

```bash
npm run db:push
```

This creates:
- `notifications` - Stores all notifications
- `notification_preferences` - User settings for notifications
- `scheduled_reminders` - Tracks sent reminders to prevent duplicates

---

## ⚙️ User Configuration

Users can configure their notification preferences at:

**Settings → Notifications** (`/settings/notifications`)

Options include:
- **In-App Notifications**: Enable/disable notification types
- **Email Notifications**: Toggle email alerts, set custom email, configure daily digest
- **Push Notifications**: Enable browser notifications (requires permission)
- **Reminder Timing**: Set lead time (1h to 1 week) and quiet hours

---

## 📋 Complete Environment Variables

Here's a complete `.env.local` template:

```env
# Database
DATABASE_URL=file:./dev.db

# Auth (NextAuth)
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
GITHUB_ID=your-github-oauth-id
GITHUB_SECRET=your-github-oauth-secret

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Push Notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cron Security
CRON_SECRET=your-secure-cron-secret

# AI Provider (optional)
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key
```

---

## 🧪 Testing Notifications

### Test In-App Notifications

1. Create a task with a due date within your reminder lead time
2. Wait for the cron job to run (or trigger manually)
3. Check the bell icon in the header

### Test Email Notifications

1. Enable email notifications in Settings → Notifications
2. Create a task due soon
3. Trigger the cron job manually:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders
   ```

### Test Push Notifications

1. Go to Settings → Notifications
2. Click "Enable Push Notifications" and allow browser permission
3. Push notifications will be sent when the cron job runs

---

## 🚀 Production Checklist

- [ ] Resend API key added to Vercel environment variables
- [ ] VAPID keys generated and added to Vercel
- [ ] CRON_SECRET added to Vercel
- [ ] Verified email domain in Resend (optional but recommended)
- [ ] Tested notification flow in production

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `/src/db/schema.ts` | Notification database tables |
| `/src/app/actions/notifications.ts` | Server actions for notifications |
| `/src/components/notification-bell.tsx` | Header notification dropdown |
| `/src/app/(app)/settings/notifications/page.tsx` | User settings page |
| `/src/app/api/cron/reminders/route.ts` | Scheduled reminder job |
| `/src/lib/email.ts` | Email templates and sending |
| `/vercel.json` | Cron job configuration |
