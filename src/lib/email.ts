import { Resend } from 'resend';
import { STORE_INFO } from '@/lib/data';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Default from address
const FROM_EMAIL = process.env.FROM_EMAIL || `${STORE_INFO.name} <noreply@sosinamart.com>`;

// Email templates base styles
const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #333;
  line-height: 1.6;
`;

const buttonStyle = `
  display: inline-block;
  padding: 12px 24px;
  background-color: #2d5a3d;
  color: white !important;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
`;

const headerStyle = `
  background-color: #2d5a3d;
  color: white;
  padding: 20px;
  text-align: center;
`;

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  shippingAddress: string;
}

interface ShippingEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

interface WelcomeEmailData {
  firstName: string;
  email: string;
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
  if (!resend) {
    console.log('Email service not configured. Would send order confirmation to:', data.customerEmail);
    return true;
  }

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${baseStyles}">
      <div style="max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="${headerStyle}">
          <h1 style="margin: 0; font-size: 24px;">${STORE_INFO.name}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Order Confirmation</p>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #2d5a3d; margin-top: 0;">Thank you for your order!</h2>

          <p>Hi ${data.customerName},</p>

          <p>We've received your order and are getting it ready. Here's what you ordered:</p>

          <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: 600;">Order #${data.orderNumber}</p>

            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #eee;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 10px; font-weight: 600;">Total</td>
                  <td style="padding: 10px; text-align: right; font-weight: 600; color: #2d5a3d;">$${data.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <h3 style="color: #2d5a3d;">Shipping Address</h3>
          <p style="background: #f9f9f9; padding: 15px; border-radius: 8px; white-space: pre-line;">${data.shippingAddress}</p>

          <p>We'll send you another email when your order ships.</p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${STORE_INFO.website}" style="${buttonStyle}">Visit Our Store</a>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

          <p style="font-size: 14px; color: #666;">
            Questions about your order? Contact us at <a href="mailto:${STORE_INFO.email}" style="color: #2d5a3d;">${STORE_INFO.email}</a>
            or call <a href="tel:${STORE_INFO.phone}" style="color: #2d5a3d;">${STORE_INFO.phone}</a>
          </p>
        </div>

        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">${STORE_INFO.name}</p>
          <p style="margin: 5px 0 0 0;">${STORE_INFO.address}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderNumber}`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotification(data: ShippingEmailData): Promise<boolean> {
  if (!resend) {
    console.log('Email service not configured. Would send shipping notification to:', data.customerEmail);
    return true;
  }

  const trackingHtml = data.trackingNumber ? `
    <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; font-weight: 600;">Tracking Number</p>
      <p style="margin: 0; font-size: 18px; font-family: monospace;">${data.trackingNumber}</p>
      ${data.carrier ? `<p style="margin: 10px 0 0 0; color: #666;">Carrier: ${data.carrier}</p>` : ''}
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${baseStyles}">
      <div style="max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="${headerStyle}">
          <h1 style="margin: 0; font-size: 24px;">${STORE_INFO.name}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Shipping Update</p>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #2d5a3d; margin-top: 0;">Your order is on its way!</h2>

          <p>Hi ${data.customerName},</p>

          <p>Great news! Your order <strong>#${data.orderNumber}</strong> has been shipped.</p>

          ${trackingHtml}

          ${data.estimatedDelivery ? `
            <p style="text-align: center; color: #666;">
              Estimated delivery: <strong>${data.estimatedDelivery}</strong>
            </p>
          ` : ''}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${STORE_INFO.website}" style="${buttonStyle}">Track Your Order</a>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

          <p style="font-size: 14px; color: #666;">
            Questions? Contact us at <a href="mailto:${STORE_INFO.email}" style="color: #2d5a3d;">${STORE_INFO.email}</a>
          </p>
        </div>

        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">${STORE_INFO.name}</p>
          <p style="margin: 5px 0 0 0;">${STORE_INFO.address}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Your Order Has Shipped - ${data.orderNumber}`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send shipping notification email:', error);
    return false;
  }
}

/**
 * Send welcome email to new customers
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  if (!resend) {
    console.log('Email service not configured. Would send welcome email to:', data.email);
    return true;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${baseStyles}">
      <div style="max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="${headerStyle}">
          <h1 style="margin: 0; font-size: 24px;">${STORE_INFO.name}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to Our Family</p>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #2d5a3d; margin-top: 0;">Welcome, ${data.firstName}!</h2>

          <p>Thank you for creating an account with ${STORE_INFO.name}. We're thrilled to have you join our community of Ethiopian culture enthusiasts!</p>

          <h3 style="color: #2d5a3d;">What We Offer</h3>

          <ul style="padding-left: 20px;">
            <li><strong>Authentic Ethiopian Foods</strong> - Traditional spices, coffee, and ingredients</li>
            <li><strong>Traditional Kitchenware</strong> - Jebena coffee pots, mitad griddles, and more</li>
            <li><strong>Cultural Artifacts</strong> - Handcrafted crosses, jewelry, and decor</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${STORE_INFO.website}" style="${buttonStyle}">Start Shopping</a>
          </div>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <h4 style="margin-top: 0; color: #2d5a3d;">Visit Our Store</h4>
            <p style="margin: 0;">
              <strong>${STORE_INFO.address}</strong><br>
              <a href="tel:${STORE_INFO.phone}" style="color: #2d5a3d;">${STORE_INFO.phone}</a><br>
              <a href="mailto:${STORE_INFO.email}" style="color: #2d5a3d;">${STORE_INFO.email}</a>
            </p>
          </div>

          <p style="margin-top: 20px;">We look forward to serving you!</p>

          <p>Best regards,<br>The ${STORE_INFO.name} Team</p>
        </div>

        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">Follow us on social media for updates and Ethiopian culture insights!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Welcome to ${STORE_INFO.name}!`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

/**
 * Send email verification link
 */
export async function sendVerificationEmail(
  email: string,
  firstName: string,
  verificationToken: string
): Promise<boolean> {
  if (!resend) {
    console.log('Email service not configured. Verification token:', verificationToken);
    return true;
  }

  const verifyUrl = `${STORE_INFO.website}/verify-email?token=${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${baseStyles}">
      <div style="max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="${headerStyle}">
          <h1 style="margin: 0; font-size: 24px;">${STORE_INFO.name}</h1>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #2d5a3d; margin-top: 0;">Verify Your Email</h2>

          <p>Hi ${firstName},</p>

          <p>Thanks for signing up! Please click the button below to verify your email address:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="${buttonStyle}">Verify Email Address</a>
          </div>

          <p style="font-size: 14px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verifyUrl}" style="color: #2d5a3d; word-break: break-all;">${verifyUrl}</a>
          </p>

          <p style="font-size: 14px; color: #666;">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>

        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">${STORE_INFO.name}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Verify your email - ${STORE_INFO.name}`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetToken: string
): Promise<boolean> {
  if (!resend) {
    console.log('Email service not configured. Reset token:', resetToken);
    return true;
  }

  const resetUrl = `${STORE_INFO.website}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${baseStyles}">
      <div style="max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="${headerStyle}">
          <h1 style="margin: 0; font-size: 24px;">${STORE_INFO.name}</h1>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #2d5a3d; margin-top: 0;">Reset Your Password</h2>

          <p>Hi ${firstName},</p>

          <p>We received a request to reset your password. Click the button below to create a new password:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="${buttonStyle}">Reset Password</a>
          </div>

          <p style="font-size: 14px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #2d5a3d; word-break: break-all;">${resetUrl}</a>
          </p>

          <p style="font-size: 14px; color: #666;">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>

        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">${STORE_INFO.name}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Password Reset - ${STORE_INFO.name}`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

export const email = {
  sendOrderConfirmation,
  sendShippingNotification,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
