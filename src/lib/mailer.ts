import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null; // not configured yet
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587 (STARTTLS)
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined,
  });
  return transporter;
}

export interface BookingMail {
  carTitle: string;
  carId: number;
  name: string;
  phone: string;
  email: string;
  startDate?: string | null;
  endDate?: string | null;
  message?: string | null;
}

function esc(s: string): string {
  return s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));
}

/**
 * Send the booking notification to the business inbox.
 * Reply-To is set to the customer's email, so replying from the inbox reaches them.
 * Best-effort: returns false (and logs) on failure without throwing.
 */
export async function sendBookingEmail(b: BookingMail): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.warn('[mail] SMTP_HOST not set — skipping booking email');
    return false;
  }

  const to = process.env.MAIL_TO || process.env.SMTP_USER || '';
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';
  if (!to || !from) {
    console.warn('[mail] MAIL_TO / SMTP_FROM missing — skipping booking email');
    return false;
  }

  const dates =
    b.startDate || b.endDate ? `${b.startDate || '—'} → ${b.endDate || '—'}` : 'Sin especificar';
  const subject = `Nueva solicitud de reserva — ${b.carTitle}`;

  const lines = [
    `Coche: ${b.carTitle} (#${b.carId})`,
    `Nombre: ${b.name}`,
    `Teléfono: ${b.phone}`,
    `Email: ${b.email}`,
    `Fechas: ${dates}`,
    b.message ? `Mensaje: ${b.message}` : null,
  ].filter(Boolean) as string[];

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111;line-height:1.6">
      <h2 style="margin:0 0 12px">Nueva solicitud de reserva</h2>
      <table style="border-collapse:collapse">
        <tr><td style="padding:2px 12px 2px 0;color:#666">Coche</td><td><b>${esc(b.carTitle)}</b> (#${b.carId})</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#666">Nombre</td><td>${esc(b.name)}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#666">Teléfono</td><td><a href="tel:${esc(b.phone)}">${esc(b.phone)}</a></td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#666">Email</td><td><a href="mailto:${esc(b.email)}">${esc(b.email)}</a></td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#666">Fechas</td><td>${esc(dates)}</td></tr>
        ${b.message ? `<tr><td style="padding:2px 12px 2px 0;color:#666;vertical-align:top">Mensaje</td><td>${esc(b.message)}</td></tr>` : ''}
      </table>
      <p style="margin-top:16px;color:#888;font-size:13px">Responde a este correo para contestar directamente al cliente.</p>
    </div>`;

  try {
    await t.sendMail({
      from,
      to,
      replyTo: `${b.name} <${b.email}>`,
      subject,
      text: lines.join('\n'),
      html,
    });
    return true;
  } catch (err) {
    console.error('[mail] booking email failed:', err);
    return false;
  }
}
