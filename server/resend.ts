import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  // Try connector API first
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (xReplitToken && hostname) {
      connectionSettings = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      ).then(res => res.json()).then(data => data.items?.[0]);

      if (connectionSettings?.settings?.api_key) {
        return {
          apiKey: connectionSettings.settings.api_key, 
          fromEmail: connectionSettings.settings.from_email
        };
      }
    }
  } catch (connectorError) {
    console.log('Connector API not available, falling back to environment variables');
  }

  // Fallback to environment variables
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    console.log('✅ Using Resend credentials from environment variables');
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL
    };
  }

  throw new Error('Resend credentials not found. Please configure RESEND_API_KEY and RESEND_FROM_EMAIL');
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    console.log(`📧 Sending email from: ${fromEmail} to: ${to}`);
    
    const result = await client.emails.send({
      from: fromEmail,
      to: to,
      subject: subject,
      html: html
    });
    
    console.log(`✅ Email sent to ${to}`, JSON.stringify(result));
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendEmailWithAttachment(
  to: string, 
  subject: string, 
  html: string, 
  attachment: { filename: string; content: Buffer }
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    await client.emails.send({
      from: fromEmail,
      to: to,
      subject: subject,
      html: html,
      attachments: [{
        filename: attachment.filename,
        content: attachment.content.toString('base64')
      }]
    });
    
    console.log(`✅ Email with attachment sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email with attachment:', error);
    return false;
  }
}
