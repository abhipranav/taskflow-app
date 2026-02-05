// Email service for sending notifications
// To enable email, install Resend: npm install resend
// Then set RESEND_API_KEY in your environment

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.log("📧 [Email] RESEND_API_KEY not set, skipping email:", options.subject);
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "TaskFlow <notifications@taskflow.app>",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("📧 [Email] Failed to send:", error);
      return false;
    }

    console.log("📧 [Email] Sent successfully:", options.subject);
    return true;
  } catch (error) {
    console.error("📧 [Email] Error sending:", error);
    return false;
  }
}

// Email templates

export function getDueSoonEmailHtml(taskTitle: string, dueIn: string, boardName: string, actionUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Due Soon</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Task Due Soon</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;">Hey there!</p>
    <p style="font-size: 16px;">Just a heads up — you have a task due soon:</p>
    
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1f2937;">${taskTitle}</h2>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">📁 ${boardName}</p>
      <p style="margin: 10px 0 0 0; color: #f59e0b; font-weight: 600;">Due in ${dueIn}</p>
    </div>
    
    <a href="${actionUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 10px;">View Task →</a>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      You can manage your notification preferences in <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #667eea;">Settings</a>.
    </p>
  </div>
</body>
</html>
  `.trim();
}

export function getOverdueEmailHtml(taskTitle: string, daysOverdue: number, boardName: string, actionUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Overdue</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Task Overdue</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;">Hey!</p>
    <p style="font-size: 16px;">This task is past its due date:</p>
    
    <div style="background: white; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1f2937;">${taskTitle}</h2>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">📁 ${boardName}</p>
      <p style="margin: 10px 0 0 0; color: #ef4444; font-weight: 600;">${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue</p>
    </div>
    
    <a href="${actionUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 10px;">Handle This →</a>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Need to reschedule? Just update the due date or move it to a different column.
    </p>
  </div>
</body>
</html>
  `.trim();
}

export function getDailyDigestEmailHtml(
  userName: string,
  todayTasks: { title: string; boardName: string; dueTime?: string }[],
  overdueTasks: { title: string; boardName: string; daysOverdue: number }[],
  upcomingTasks: { title: string; boardName: string; dueDate: string }[]
): string {
  const today = new Date().toLocaleDateString("en-US", { 
    weekday: "long", 
    month: "long", 
    day: "numeric" 
  });

  const todaySection = todayTasks.length > 0 ? `
    <div style="margin-bottom: 24px;">
      <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 12px 0;">📅 Due Today (${todayTasks.length})</h3>
      ${todayTasks.map(t => `
        <div style="background: white; border: 1px solid #e5e7eb; border-left: 4px solid #667eea; border-radius: 4px; padding: 12px; margin-bottom: 8px;">
          <div style="font-weight: 500; color: #1f2937;">${t.title}</div>
          <div style="font-size: 12px; color: #6b7280;">${t.boardName}${t.dueTime ? ` • ${t.dueTime}` : ""}</div>
        </div>
      `).join("")}
    </div>
  ` : "";

  const overdueSection = overdueTasks.length > 0 ? `
    <div style="margin-bottom: 24px;">
      <h3 style="color: #ef4444; font-size: 16px; margin: 0 0 12px 0;">🚨 Overdue (${overdueTasks.length})</h3>
      ${overdueTasks.map(t => `
        <div style="background: white; border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 4px; padding: 12px; margin-bottom: 8px;">
          <div style="font-weight: 500; color: #1f2937;">${t.title}</div>
          <div style="font-size: 12px; color: #ef4444;">${t.boardName} • ${t.daysOverdue} day${t.daysOverdue !== 1 ? "s" : ""} overdue</div>
        </div>
      `).join("")}
    </div>
  ` : "";

  const upcomingSection = upcomingTasks.length > 0 ? `
    <div style="margin-bottom: 24px;">
      <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 12px 0;">📆 Coming Up (${upcomingTasks.length})</h3>
      ${upcomingTasks.map(t => `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px; margin-bottom: 8px;">
          <div style="font-weight: 500; color: #1f2937;">${t.title}</div>
          <div style="font-size: 12px; color: #6b7280;">${t.boardName} • Due ${t.dueDate}</div>
        </div>
      `).join("")}
    </div>
  ` : "";

  const isEmpty = todayTasks.length === 0 && overdueTasks.length === 0 && upcomingTasks.length === 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Daily Digest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">☀️ Daily Digest</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${today}</p>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;">Good morning, ${userName}!</p>
    
    ${isEmpty ? `
      <div style="text-align: center; padding: 40px 0;">
        <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
        <p style="color: #6b7280; margin: 0;">You're all caught up! No tasks need attention today.</p>
      </div>
    ` : `
      <p style="font-size: 16px; color: #6b7280;">Here's what needs your attention:</p>
      ${overdueSection}
      ${todaySection}
      ${upcomingSection}
    `}
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 10px;">Open TaskFlow →</a>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
      You're receiving this because you enabled daily digests. <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #667eea;">Manage preferences</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}
