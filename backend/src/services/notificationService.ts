import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { pool } from '../database/pool';

export interface AlertEmailPayload {
  facilityId: string;
  alertType: string;
  severity: string;
  message: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export async function notifyAlertEmail(alert: AlertEmailPayload) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || 'alerts@oenivault.ai';

  const admins = await pool.query<{ email: string; full_name: string | null; user_id: string }>(
    `SELECT u.id AS user_id, u.email, u.full_name
     FROM users u
     LEFT JOIN notification_preferences p ON p.user_id = u.id
     WHERE u.role = 'admin'
       AND (u.facility_id = $1 OR u.facility_id IS NULL)
       AND COALESCE(p.email_alerts, TRUE) = TRUE`,
    [alert.facilityId]
  );

  const recipients = admins.rows.map((r) => r.email);
  if (recipients.length === 0) {
    logger.warn('No admin recipients for climate alert email');
    return;
  }

  const subject = `[OeniVault] ${alert.severity.toUpperCase()}: ${alert.alertType}`;
  const text = `${alert.message}\n\nFacility: ${alert.facilityId}\nSeverity: ${alert.severity}`;

  if (!transporter) {
    logger.info('SMTP not configured — logging alert email', { subject, recipients, text });
    return;
  }

  try {
    await transporter.sendMail({ from, to: recipients.join(','), subject, text });
    logger.info('Alert email sent', { recipients, alertType: alert.alertType });
  } catch (err) {
    logger.error('Failed to send alert email', err instanceof Error ? err.message : err);
  }
}
