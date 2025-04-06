import sgMail from '@sendgrid/mail';

// Initialize SendGrid with the API key
if (!process.env.SENDGRID_API_KEY) {
  console.error("SENDGRID_API_KEY environment variable is not set");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html: string;
  from: string;
}

/**
 * Sends an email using SendGrid
 * @param params Email parameters including to, subject, text, html, and from
 * @returns Promise that resolves to true if email was sent successfully, false otherwise
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Sends a waitlist confirmation email to a new subscriber
 * @param fullName Subscriber's full name
 * @param email Subscriber's email address
 * @returns Promise that resolves to true if email was sent successfully, false otherwise
 */
export async function sendWaitlistConfirmation(fullName: string, email: string): Promise<boolean> {
  const from = 'noreply@yourcompany.com'; // Replace with your verified sender
  const subject = 'Welcome to Our Waitlist!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4338ca;">Thank You for Joining Our Waitlist!</h2>
      <p>Hello ${fullName},</p>
      <p>We're excited to confirm that you've been added to our waitlist. You'll be among the first to know when we launch.</p>
      <p>Here's what happens next:</p>
      <ul>
        <li>We'll keep you updated on our progress</li>
        <li>You'll receive early access to our platform</li>
        <li>We may occasionally ask for your feedback</li>
      </ul>
      <p>If you have any questions, feel free to reply to this email.</p>
      <p>Thank you for your interest and support!</p>
      <p>Best regards,<br>The Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    from,
    subject,
    html,
  });
}