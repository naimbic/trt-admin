import nodemailer from 'nodemailer'

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_TO } = process.env

const isConfigured = SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_TO

let transporter = null
if (isConfigured) {
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
}

/**
 * Send an email (fire-and-forget). Silently skips if SMTP is not configured.
 * @param {string} subject
 * @param {string} html - HTML body
 * @param {string} [to] - defaults to SMTP_TO env var
 */
export async function sendMail(subject, html, to) {
    if (!isConfigured || !transporter) return
    try {
        await transporter.sendMail({
            from: `"TRT Admin" <${SMTP_USER}>`,
            to: to || SMTP_TO,
            subject,
            html,
        })
    } catch (err) {
        console.error('sendMail error:', err.message)
    }
}

/**
 * Build a styled HTML email for a new form submission
 */
export function buildSubmissionEmail(data) {
    const rows = [
        ['Form', data.form],
        ['Name', data.name],
        ['Email', data.email],
        ['Phone', data.phone],
        ['Company', data.company],
        ['Website', data.website],
        ['Needs', data.needs],
        ['Budget', data.budget],
        ['Deadline', data.deadline],
        ['Message', data.message],
    ]
        .filter(([, v]) => v)
        .map(([k, v]) => `<tr><td style="padding:8px 12px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">${k}</td><td style="padding:8px 12px;color:#111827;border-bottom:1px solid #e5e7eb">${v}</td></tr>`)
        .join('')

    return `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#2563eb">New Submission: ${data.form}</h2>
            <table style="width:100%;border-collapse:collapse;margin-top:16px">${rows}</table>
            <p style="margin-top:24px;font-size:13px;color:#6b7280">Sent from TRT Admin Dashboard</p>
        </div>
    `
}
