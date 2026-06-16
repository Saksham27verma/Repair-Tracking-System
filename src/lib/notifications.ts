import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

function getEmailCredentials() {
  const user = process.env.EMAIL_USER?.trim();
  // Gmail app passwords are often shown with spaces; strip them for SMTP auth.
  const pass = process.env.EMAIL_PASSWORD?.replace(/\s+/g, '') || undefined;
  return { user, pass };
}

function createEmailTransport(): Transporter {
  const { user, pass } = getEmailCredentials();
  return nodemailer.createTransport({
    service: 'gmail',
    auth: user && pass ? { user, pass } : undefined,
  });
}

let emailTransport: Transporter | null = null;

function getEmailTransport(): Transporter {
  if (!emailTransport) {
    emailTransport = createEmailTransport();
  }
  return emailTransport;
}

function assertEmailConfigured(): { user: string; pass: string } {
  const { user, pass } = getEmailCredentials();
  if (!user || !pass) {
    throw new Error(
      'Email is not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env.local, then restart the dev server.'
    );
  }
  return { user, pass };
}

// Templates for various notification types
const templates = {
  statusChange: {
    subject: 'Your Repair Status Has Been Updated',
    emailBody: (data: { 
      repairId: string; 
      customerName: string; 
      oldStatus: string; 
      newStatus: string; 
      productName: string;
      currentLocation?: string;
      pickupCenter?: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="background-color: #0056b3; color: white; padding: 15px; border-radius: 5px 5px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Repair Status Update</h1>
        </div>
        <div style="padding: 20px;">
          <p>Dear ${data.customerName},</p>
          
          <p>We're writing to inform you that the status of your repair has been updated.</p>
          
          <div style="background-color: #f5f5f5; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p><strong>Repair ID:</strong> ${data.repairId}</p>
            <p><strong>Product:</strong> ${data.productName}</p>
            <p><strong>Previous Status:</strong> ${data.oldStatus}</p>
            <p><strong>New Status:</strong> <span style="color: #0056b3; font-weight: bold;">${data.newStatus}</span></p>
            ${data.currentLocation ? `<p><strong>Current Location:</strong> ${data.currentLocation}</p>` : ''}
            ${data.pickupCenter ? `<p><strong>Pickup Center:</strong> ${data.pickupCenter}</p>` : ''}
          </div>
          
          <p>You can track your repair online at any time by visiting our website and entering your repair ID.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>Hearing Hope Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 5px 5px; text-align: center; font-size: 12px; color: #666;">
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `,
  },
  estimateApprovalRequest: {
    subject: 'Action Required: Approve Your Repair Estimate — Hearing Hope',
    emailBody: (data: {
      repairId: string;
      customerName: string;
      estimate: number;
      productName: string;
      approvalUrl: string;
    }) => `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #EE6417 0%, #ff8545 100%); color: white; padding: 28px 24px; text-align: center;">
          <p style="margin: 0 0 4px; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.9;">Hearing Hope</p>
          <h1 style="margin: 0; font-size: 26px; font-weight: 700;">Repair Estimate Approval</h1>
        </div>
        <div style="padding: 28px 24px;">
          <p style="margin: 0 0 16px; font-size: 16px; color: #1f2937;">Dear ${data.customerName},</p>
          <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #4b5563;">
            Your device is with the manufacturer and we have a repair estimate ready for your review.
            Please approve or decline so we know whether to proceed with the repair.
          </p>
          <div style="background-color: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #92400e; font-weight: 600;">REPAIR DETAILS</p>
            <p style="margin: 0 0 6px; font-size: 15px; color: #1f2937;"><strong>Repair ID:</strong> ${data.repairId}</p>
            <p style="margin: 0 0 6px; font-size: 15px; color: #1f2937;"><strong>Device:</strong> ${data.productName}</p>
            <p style="margin: 16px 0 0; font-size: 13px; color: #92400e;">Estimated repair cost (incl. 18% GST)</p>
            <p style="margin: 4px 0 0; font-size: 32px; font-weight: 800; color: #EE6417;">₹${data.estimate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.approvalUrl}" style="display: inline-block; background-color: #EE6417; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 8px;">
              Review &amp; Approve Estimate
            </a>
          </div>
          <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #4b5563;">
            <strong>If you approve:</strong> we will proceed with the repair at the manufacturer.
          </p>
          <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #4b5563;">
            <strong>If you decline:</strong> your device will be returned without repair.
          </p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #4b5563;">Questions? Contact Hearing Hope:</p>
          <p style="margin: 0; font-size: 14px; color: #4b5563;">
            Phone: <a href="tel:+919811168046" style="color: #EE6417;">+91 98111 68046</a> &nbsp;|&nbsp;
            Email: <a href="mailto:hearinghope@gmail.com" style="color: #EE6417;">hearinghope@gmail.com</a>
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0;">This is an automated message from Hearing Hope. Please do not reply directly to this email.</p>
          <p style="margin: 8px 0 0;"><a href="${data.approvalUrl}" style="color: #9ca3af;">${data.approvalUrl}</a></p>
        </div>
      </div>
    `,
  },
  estimateReady: {
    subject: 'Your Repair Estimate is Ready',
    emailBody: (data: { 
      repairId: string; 
      customerName: string; 
      estimate: number; 
      productName: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="background-color: #0056b3; color: white; padding: 15px; border-radius: 5px 5px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Repair Estimate Ready</h1>
        </div>
        <div style="padding: 20px;">
          <p>Dear ${data.customerName},</p>
          
          <p>We've completed the assessment of your repair and have an estimate ready for your approval.</p>
          
          <div style="background-color: #f5f5f5; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p><strong>Repair ID:</strong> ${data.repairId}</p>
            <p><strong>Product:</strong> ${data.productName}</p>
            <p><strong>Estimated Cost:</strong> ₹${data.estimate.toFixed(2)}</p>
          </div>
          
          <p>Please visit our website to approve or decline this estimate. We'll proceed with the repair once we receive your approval.</p>
          
          <p>If you have any questions about the estimate, please contact our service department.</p>
          
          <p>Best regards,<br>Hearing Hope Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 5px 5px; text-align: center; font-size: 12px; color: #666;">
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `,
  },
  repairComplete: {
    subject: 'Your Repair is Complete',
    emailBody: (data: { 
      repairId: string; 
      customerName: string; 
      productName: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="background-color: #0056b3; color: white; padding: 15px; border-radius: 5px 5px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Your Repair is Complete</h1>
        </div>
        <div style="padding: 20px;">
          <p>Dear ${data.customerName},</p>
          
          <p>Great news! Your repair is now complete and ready for pickup.</p>
          
          <div style="background-color: #f5f5f5; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p><strong>Repair ID:</strong> ${data.repairId}</p>
            <p><strong>Product:</strong> ${data.productName}</p>
            <p><strong>Status:</strong> <span style="color: #00a651; font-weight: bold;">Ready for Pickup</span></p>
          </div>
          
          <p>You can pick up your repaired product at our service center during our business hours. Please bring your repair ID or a valid ID for verification.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>Hearing Hope Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 5px 5px; text-align: center; font-size: 12px; color: #666;">
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `,
  }
};

/**
 * Send an email notification to the customer
 */
export async function sendEmailNotification(
  email: string,
  template: keyof typeof templates,
  templateData: any
) {
  if (!email) {
    console.log('No email address provided, skipping email notification');
    return { success: false, message: 'No email address provided' };
  }

  console.log(`Attempting to send ${template} email to ${email}...`);

  try {
    const { user } = assertEmailConfigured();
    const { subject, emailBody } = templates[template];
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || `Hearing Hope <${user}>`,
      to: email,
      subject: subject,
      html: emailBody(templateData),
    };

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await getEmailTransport().sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email notification:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Notify a user about their repair based on their notification preferences
 */
export async function notifyUser(
  userData: { email?: string; name: string; notificationPreference?: string },
  template: keyof typeof templates,
  templateData: any
) {
  const { email, notificationPreference, name } = userData;
  
  // Skip notification if preference is set to none
  if (notificationPreference === 'none') {
    console.log(`User ${name} has opted out of notifications`);
    return { success: true, message: 'User opted out of notifications' };
  }

  // Send email notification if we have an email and preference is email
  if (email && notificationPreference === 'email') {
    return await sendEmailNotification(email, template, { ...templateData, customerName: name });
  }

  console.log('No notifications sent due to missing contact information or preferences');
  return { success: false, message: 'No valid notification methods available' };
} 