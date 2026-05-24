# Render Free Tier Keep-Alive Setup

The backend is deployed on Render's free tier, which **spins down services after 15 minutes of inactivity**. When the service sleeps, the internal `node-cron` scheduler stops running — meaning recurring LinkedIn posts won't be generated or published until the next HTTP request wakes the server up.

To work around this without paying for Render's $7/month plan, set up a free external cron job that pings the backend every 10 minutes.

## Setup with cron-job.org (recommended, free)

1. Sign up at [cron-job.org](https://cron-job.org) (free account, no card required).
2. Click **CREATE CRONJOB**.
3. Fill in:
   - **Title**: `Melo Backend Keep-Alive`
   - **URL**: `https://ai-powered-social-media-marketing-manager.onrender.com/api/health`
   - **Schedule**: Every 10 minutes
   - **Request method**: GET
4. Save. The dashboard will show successful 200 responses every 10 minutes.

That's it. The `/api/health` endpoint already exists in `backend/src/index.ts` and returns a simple JSON status. Each ping resets Render's idle timer.

## Why every 10 minutes?

- Render spins down after **15 minutes** of inactivity.
- Pinging every 10 minutes leaves a 5-minute safety margin.
- The internal cron job runs every 5 minutes (`*/5 * * * *`), so as long as the service is awake, scheduled posts are processed on time.

## What this enables

| Feature | Depends on keep-alive? |
|---------|------------------------|
| Manual login / API requests | No (any HTTP request wakes the server) |
| `checkAndPublishScheduledItems` (publish scheduled CalendarItems to LinkedIn) | **Yes** |
| `processRecurringSchedules` (generate new posts from RecurringSchedule) | **Yes** |

Without keep-alive, scheduled posts would only fire when a user happens to use the app — defeating the purpose of automation.

## Alternative: GitHub Actions

If you don't want to use cron-job.org, you can use GitHub Actions to ping the health endpoint:

```yaml
# .github/workflows/keep-alive.yml
name: Keep Render Awake
on:
  schedule:
    - cron: "*/10 * * * *"
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS https://ai-powered-social-media-marketing-manager.onrender.com/api/health
```

Note: GitHub Actions cron is best-effort and may delay 5–15 minutes during off-peak times.

## Alternative: Upgrade to Render Starter ($7/mo)

Eliminates the sleep behavior entirely. Simplest but costs money.
