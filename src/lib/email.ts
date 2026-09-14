import { Resend } from "resend"

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "LoqMart <onboarding@resend.dev>"

let client: Resend | null = null
function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!client) client = new Resend(process.env.RESEND_API_KEY)
  return client
}

/**
 * Sends a transactional email via Resend. Silently no-ops (logs and
 * returns) if RESEND_API_KEY isn't configured, so every call site stays
 * safe to call unconditionally rather than needing its own env-var guard —
 * mirrors how Razorpay/Shiprocket calls in this codebase already degrade
 * gracefully when their credentials aren't set.
 */
export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  const resend = getClient()
  if (!resend) {
    console.warn(`RESEND_API_KEY not configured — skipping email "${params.subject}" to ${params.to}`)
    return
  }
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
  } catch (error) {
    // Email failures must never break the request they're attached to
    // (order confirmation, seller approval, etc.) — log and move on.
    console.error(`Failed to send email "${params.subject}" to ${params.to}:`, error)
  }
}

function emailShell(bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1c1c;">
      <div style="font-weight: 900; font-size: 20px; letter-spacing: -0.02em; margin-bottom: 24px;">
        <span style="background: #fcd020; padding: 4px 10px; border-radius: 4px;">LoqMart</span>
      </div>
      ${bodyHtml}
      <p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
        LoqMart — India's Multi-Vendor Marketplace
      </p>
    </div>
  `
}

export async function sendDiscountCodeEmail(to: string, code: string, description: string) {
  await sendEmail({
    to,
    subject: `Your LoqMart discount code: ${code}`,
    html: emailShell(`
      <p style="font-size: 15px;">Here's your discount code:</p>
      <div style="background: #f8f5f0; border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0;">
        <p style="font-size: 24px; font-weight: 900; color: #725c00; letter-spacing: 0.05em; margin: 0;">${code}</p>
        <p style="font-size: 13px; color: #666; margin: 8px 0 0;">${description}</p>
      </div>
      <p style="font-size: 13px; color: #666;">Apply it at checkout on your next LoqMart order.</p>
    `),
  })
}

export async function sendSellerApprovalEmail(to: string, businessName: string, approved: boolean, reason?: string) {
  await sendEmail({
    to,
    subject: approved ? "Your LoqMart seller account is approved!" : "Update on your LoqMart seller application",
    html: emailShell(
      approved
        ? `
          <p style="font-size: 15px;">Congratulations — <strong>${businessName}</strong> has been approved as a LoqMart seller.</p>
          <p style="font-size: 13px; color: #666;">You can now sign in and start listing products from your seller dashboard.</p>
        `
        : `
          <p style="font-size: 15px;">Your seller application for <strong>${businessName}</strong> was not approved this time.</p>
          ${reason ? `<p style="font-size: 13px; color: #666;">Reason: ${reason}</p>` : ""}
          <p style="font-size: 13px; color: #666;">You're welcome to update your details and re-apply.</p>
        `
    ),
  })
}
