'use server';

import nodemailer from 'nodemailer';

// Configure email transport with improved Gmail settings
const emailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  logger: true, // Enable logging
  debug: true, // Include even more logs
});

// Verify SMTP connection on startup
(async function verifyEmailConnection() {
  try {
    console.log('Verifying email configuration...');
    
    // Log the credentials being used (but mask the password)
    const maskedPassword = process.env.EMAIL_PASSWORD 
      ? '*'.repeat(Math.min(process.env.EMAIL_PASSWORD.length, 8)) 
      : 'not set';
      
    console.log(`Email config: service=${process.env.EMAIL_SERVICE}, user=${process.env.EMAIL_USER}, password=${maskedPassword}`);
    
    // Verify connection
    const verification = await emailTransport.verify();
    console.log('✅ Email transport verification successful:', verification);
    return true;
  } catch (error) {
    console.error('❌ Email transport verification failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return false;
  }
})();

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
  console.log('Email config:', {
    service: process.env.EMAIL_SERVICE,
    user: process.env.EMAIL_USER,
    from: process.env.EMAIL_FROM,
  });

  try {
    const { subject, emailBody } = templates[template];
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Hearing Hope <hearinghopenotifications@gmail.com>',
      to: email,
      subject: subject,
      html: emailBody(templateData),
    };

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await emailTransport.sendMail(mailOptions);
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