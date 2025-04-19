import { NextRequest, NextResponse } from 'next/server';
import { sendEmailNotification } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  // Get parameters from query
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');
  const template = searchParams.get('template') || 'statusChange';

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter is required' },
      { status: 400 }
    );
  }

  try {
    console.log(`Testing email functionality by sending to: ${email} using template: ${template}`);
    
    // Log environment variable values (with masked password)
    const maskedPassword = process.env.EMAIL_PASSWORD 
      ? '*'.repeat(Math.min(process.env.EMAIL_PASSWORD.length, 8)) 
      : 'not set';
      
    console.log(`Using email config: service=${process.env.EMAIL_SERVICE}, user=${process.env.EMAIL_USER}, from=${process.env.EMAIL_FROM}, password=${maskedPassword}`);
    
    // Create appropriate template data based on the requested template
    let templateData = {};
    
    switch (template) {
      case 'statusChange':
        templateData = {
          repairId: 'TEST-12345',
          customerName: 'Test Customer',
          oldStatus: 'Received',
          newStatus: 'Sent to Manufacturer',
          productName: 'Test Device'
        };
        break;
      case 'repairComplete':
        templateData = {
          repairId: 'TEST-12345',
          customerName: 'Test Customer',
          productName: 'Test Device'
        };
        break;
      case 'estimateReady':
        templateData = {
          repairId: 'TEST-12345',
          customerName: 'Test Customer',
          estimate: 1500,
          productName: 'Test Device'
        };
        break;
      default:
        templateData = {
          repairId: 'TEST-12345',
          customerName: 'Test Customer',
          oldStatus: 'Received',
          newStatus: 'Sent to Manufacturer',
          productName: 'Test Device'
        };
    }
    
    const result = await sendEmailNotification(
      email,
      template as any,
      templateData
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${email}`,
        details: result
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send test email',
        details: result
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    
    // Provide detailed error information
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack } 
      : 'Unknown error';
      
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: errorDetails
      },
      { status: 500 }
    );
  }
} 