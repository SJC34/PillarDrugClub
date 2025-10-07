import twilio from 'twilio';

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
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      ).then(res => res.json()).then(data => data.items?.[0]);

      if (connectionSettings?.settings?.account_sid && connectionSettings?.settings?.api_key && connectionSettings?.settings?.api_key_secret) {
        return {
          accountSid: connectionSettings.settings.account_sid,
          apiKey: connectionSettings.settings.api_key,
          apiKeySecret: connectionSettings.settings.api_key_secret,
          phoneNumber: connectionSettings.settings.phone_number
        };
      }
    }
  } catch (connectorError) {
    console.log('Connector API not available, falling back to environment variables');
  }

  // Fallback to environment variables
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    console.log('✅ Using Twilio credentials from environment variables');
    return {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      apiKey: process.env.TWILIO_AUTH_TOKEN,
      apiKeySecret: process.env.TWILIO_AUTH_TOKEN, // Auth token can be used as both
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    };
  }

  throw new Error('Twilio credentials not found. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER');
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  // Use Auth Token if apiKey is actually an auth token (starts with account SID gets used as username)
  // Twilio accepts either (AccountSID, AuthToken) or (APIKey, APIKeySecret)
  return twilio(accountSid, apiKey, {
    accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });
    
    console.log(`✅ SMS sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}
