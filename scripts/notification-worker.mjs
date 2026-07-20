const appUrl = process.env.INTERNAL_APP_URL || process.env.APP_URL || "http://web:3000";
const secret = process.env.CRON_SECRET;
const interval = Math.max(15, Number(process.env.NOTIFICATION_INTERVAL_SECONDS || 30)) * 1000;
if (!secret) {
  console.error("CRON_SECRET is required for the notification worker.");
  process.exit(1);
}
async function run() {
  try {
    const response = await fetch(`${appUrl}/api/jobs/notifications`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!response.ok) console.error(`Notification worker received ${response.status}: ${await response.text()}`);
  } catch (error) {
    console.error("Notification worker could not reach MaliktBoard:", error instanceof Error ? error.message : error);
  }
}
await run();
setInterval(run, interval);
