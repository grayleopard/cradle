import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Pipit <hello@joinpipit.com>';
const REPLY_TO = 'support@joinpipit.com';

// Email templates
const templates = {
  welcome: (name: string) => ({
    subject: 'Welcome to Pipit! 🐦',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'DM Sans', -apple-system, sans-serif; background-color: #FFFCF9; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 24px rgba(30,25,20,0.08);">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 48px;">🐦</span>
            <h1 style="font-family: 'Fraunces', Georgia, serif; color: #4A3F37; margin: 16px 0 8px; font-size: 28px;">Welcome to Pipit, ${name}!</h1>
          </div>

          <p style="color: #5C5C5C; line-height: 1.6; margin-bottom: 24px;">
            You've joined a community of parents who buy and sell pre-loved baby gear. We're so happy you're here! 💛
          </p>

          <div style="background: #F0FAF8; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="color: #2D9B8C; margin: 0 0 12px; font-size: 16px;">Here's what you can do:</h3>
            <ul style="color: #5C5C5C; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Browse quality baby gear from parents near you</li>
              <li>List items you no longer need</li>
              <li>Message sellers and negotiate prices</li>
              <li>Meet up safely and inspect before you buy</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="https://joinpipit.com" style="display: inline-block; background: #2D9B8C; color: white; text-decoration: none; padding: 14px 32px; border-radius: 100px; font-weight: 600;">Start Browsing</a>
          </div>

          <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 32px;">
            Questions? Reply to this email or reach us at support@joinpipit.com
          </p>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to Pipit, ${name}!\n\nYou've joined a community of parents who buy and sell pre-loved baby gear.\n\nHere's what you can do:\n- Browse quality baby gear from parents near you\n- List items you no longer need\n- Message sellers and negotiate prices\n- Meet up safely and inspect before you buy\n\nStart browsing at https://joinpipit.com\n\nQuestions? Email us at support@joinpipit.com`,
  }),

  purchaseConfirmation: (buyer: string, item: string, amount: number, seller: string, meetupDetails?: string) => ({
    subject: `Purchase Confirmed: ${item} ✅`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: 'DM Sans', -apple-system, sans-serif; background-color: #FFFCF9; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 24px rgba(30,25,20,0.08);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">🎉</span>
            <h1 style="font-family: 'Fraunces', Georgia, serif; color: #4A3F37; margin: 16px 0 8px;">Purchase Confirmed!</h1>
          </div>

          <p style="color: #5C5C5C; line-height: 1.6;">Hi ${buyer},</p>
          <p style="color: #5C5C5C; line-height: 1.6;">Great news! Your purchase of <strong>${item}</strong> for <strong>$${(amount / 100).toFixed(2)}</strong> has been confirmed.</p>

          <div style="background: #F5EDE6; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; color: #4A3F37;"><strong>Seller:</strong> ${seller}</p>
            ${meetupDetails ? `<p style="margin: 0; color: #4A3F37;"><strong>Meetup:</strong> ${meetupDetails}</p>` : ''}
          </div>

          <div style="background: #FEF3C7; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #92400E; font-size: 14px;">
              <strong>🔒 Your payment is held securely</strong> until you inspect and approve the item at meetup.
            </p>
          </div>

          <div style="text-align: center;">
            <a href="https://joinpipit.com/inbox" style="display: inline-block; background: #2D9B8C; color: white; text-decoration: none; padding: 14px 32px; border-radius: 100px; font-weight: 600;">Message Seller</a>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${buyer},\n\nYour purchase of ${item} for $${(amount / 100).toFixed(2)} has been confirmed!\n\nSeller: ${seller}\n${meetupDetails ? `Meetup: ${meetupDetails}\n` : ''}\nYour payment is held securely until you inspect and approve the item at meetup.\n\nMessage the seller at https://joinpipit.com/inbox`,
  }),

  saleNotification: (seller: string, item: string, amount: number, buyer: string) => ({
    subject: `You made a sale! 🎊 ${item}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: 'DM Sans', -apple-system, sans-serif; background-color: #FFFCF9; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 24px rgba(30,25,20,0.08);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">💰</span>
            <h1 style="font-family: 'Fraunces', Georgia, serif; color: #4A3F37; margin: 16px 0 8px;">You Made a Sale!</h1>
          </div>

          <p style="color: #5C5C5C; line-height: 1.6;">Hi ${seller},</p>
          <p style="color: #5C5C5C; line-height: 1.6;">${buyer} just purchased your <strong>${item}</strong> for <strong>$${(amount / 100).toFixed(2)}</strong>!</p>

          <div style="background: #F0FAF8; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #2D9B8C; margin: 0 0 12px; font-size: 16px;">What happens next?</h3>
            <ol style="color: #5C5C5C; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Coordinate a meetup time and place with ${buyer}</li>
              <li>Meet up and let them inspect the item</li>
              <li>Once approved, funds are released to you!</li>
            </ol>
          </div>

          <div style="text-align: center;">
            <a href="https://joinpipit.com/inbox" style="display: inline-block; background: #2D9B8C; color: white; text-decoration: none; padding: 14px 32px; border-radius: 100px; font-weight: 600;">Message Buyer</a>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${seller},\n\n${buyer} just purchased your ${item} for $${(amount / 100).toFixed(2)}!\n\nWhat happens next:\n1. Coordinate a meetup time and place\n2. Meet up and let them inspect the item\n3. Once approved, funds are released to you!\n\nMessage the buyer at https://joinpipit.com/inbox`,
  }),

  payoutConfirmation: (seller: string, amount: number, method: 'instant' | 'standard', arrivalDate: string) => ({
    subject: `Payout Sent: $${(amount / 100).toFixed(2)} 💸`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: 'DM Sans', -apple-system, sans-serif; background-color: #FFFCF9; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 24px rgba(30,25,20,0.08);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">💸</span>
            <h1 style="font-family: 'Fraunces', Georgia, serif; color: #4A3F37; margin: 16px 0 8px;">Payout Sent!</h1>
          </div>

          <p style="color: #5C5C5C; line-height: 1.6;">Hi ${seller},</p>
          <p style="color: #5C5C5C; line-height: 1.6;">We've sent <strong>$${(amount / 100).toFixed(2)}</strong> to your bank account.</p>

          <div style="background: #F5EDE6; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 4px; color: #9CA3AF; font-size: 12px;">PAYOUT METHOD</p>
            <p style="margin: 0 0 16px; color: #4A3F37; font-weight: 600;">${method === 'instant' ? 'Instant Payout' : 'Standard Payout'}</p>
            <p style="margin: 0 0 4px; color: #9CA3AF; font-size: 12px;">EXPECTED ARRIVAL</p>
            <p style="margin: 0; color: #4A3F37; font-weight: 600;">${arrivalDate}</p>
          </div>

          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            View your earnings at <a href="https://joinpipit.com/profile" style="color: #2D9B8C;">your profile</a>
          </p>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${seller},\n\nWe've sent $${(amount / 100).toFixed(2)} to your bank account.\n\nPayout Method: ${method === 'instant' ? 'Instant Payout' : 'Standard Payout'}\nExpected Arrival: ${arrivalDate}\n\nView your earnings at https://joinpipit.com/profile`,
  }),

  reviewRequest: (buyer: string, item: string, seller: string, transactionId: string) => ({
    subject: `How was your experience with ${item}?`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: 'DM Sans', -apple-system, sans-serif; background-color: #FFFCF9; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 24px rgba(30,25,20,0.08);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">⭐</span>
            <h1 style="font-family: 'Fraunces', Georgia, serif; color: #4A3F37; margin: 16px 0 8px;">How was your purchase?</h1>
          </div>

          <p style="color: #5C5C5C; line-height: 1.6;">Hi ${buyer},</p>
          <p style="color: #5C5C5C; line-height: 1.6;">You recently purchased <strong>${item}</strong> from ${seller}. We'd love to hear how it went!</p>

          <p style="color: #5C5C5C; line-height: 1.6;">Your review helps other parents make confident purchases and helps great sellers stand out.</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="https://joinpipit.com/transaction/${transactionId}/review" style="display: inline-block; background: #2D9B8C; color: white; text-decoration: none; padding: 14px 32px; border-radius: 100px; font-weight: 600;">Leave a Review</a>
          </div>

          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            It only takes 30 seconds!
          </p>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${buyer},\n\nYou recently purchased ${item} from ${seller}. We'd love to hear how it went!\n\nYour review helps other parents make confident purchases and helps great sellers stand out.\n\nLeave a review: https://joinpipit.com/transaction/${transactionId}/review`,
  }),
};

type EmailAction =
  | { action: 'welcome'; to: string; name: string }
  | { action: 'purchaseConfirmation'; to: string; buyer: string; item: string; amount: number; seller: string; meetupDetails?: string }
  | { action: 'saleNotification'; to: string; seller: string; item: string; amount: number; buyer: string }
  | { action: 'payoutConfirmation'; to: string; seller: string; amount: number; method: 'instant' | 'standard'; arrivalDate: string }
  | { action: 'reviewRequest'; to: string; buyer: string; item: string; seller: string; transactionId: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('[Email] RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const body = req.body as EmailAction;

  try {
    let emailContent: { subject: string; html: string; text: string };

    switch (body.action) {
      case 'welcome':
        emailContent = templates.welcome(body.name);
        break;
      case 'purchaseConfirmation':
        emailContent = templates.purchaseConfirmation(body.buyer, body.item, body.amount, body.seller, body.meetupDetails);
        break;
      case 'saleNotification':
        emailContent = templates.saleNotification(body.seller, body.item, body.amount, body.buyer);
        break;
      case 'payoutConfirmation':
        emailContent = templates.payoutConfirmation(body.seller, body.amount, body.method, body.arrivalDate);
        break;
      case 'reviewRequest':
        emailContent = templates.reviewRequest(body.buyer, body.item, body.seller, body.transactionId);
        break;
      default:
        return res.status(400).json({ error: 'Unknown email action' });
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: body.to,
      replyTo: REPLY_TO,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (error) {
      console.error('[Email] Send error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    console.log(`[Email] Sent ${body.action} to ${body.to}`);
    return res.status(200).json({ success: true, id: data?.id });
  } catch (error) {
    console.error('[Email] Error:', error);
    return res.status(500).json({ error: 'Email service error' });
  }
}
