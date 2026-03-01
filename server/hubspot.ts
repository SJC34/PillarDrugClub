import { Client } from '@hubspot/api-client';
import type { User } from '@shared/schema';

let connectionSettings: any;

async function getAccessToken() {
  if (
    connectionSettings &&
    connectionSettings.settings.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=hubspot',
    {
      headers: {
        Accept: 'application/json',
        'X-Replit-Token': xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('HubSpot not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client — tokens expire.
async function getUncachableHubSpotClient() {
  const accessToken = await getAccessToken();
  return new Client({ accessToken });
}

export interface HubSpotContactData {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  lifecyclestage?: 'lead' | 'customer';
  subscription_status?: 'free' | 'active' | 'canceled';
}

/**
 * Upserts a HubSpot contact by email.
 * Uses search-then-create-or-update pattern.
 * All errors are caught and logged — never throws, so it never breaks the caller.
 */
export async function createOrUpdateHubSpotContact(data: HubSpotContactData): Promise<void> {
  try {
    const client = await getUncachableHubSpotClient();

    const properties: Record<string, string> = {};
    if (data.firstname) properties.firstname = data.firstname;
    if (data.lastname) properties.lastname = data.lastname;
    if (data.phone) properties.phone = data.phone;
    if (data.lifecyclestage) properties.lifecyclestage = data.lifecyclestage;
    if (data.subscription_status) properties.subscription_status = data.subscription_status;

    // Search for existing contact by email
    const searchResponse = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'EQ' as any,
              value: data.email,
            },
          ],
        },
      ],
      properties: ['email'],
      limit: 1,
      after: 0,
      sorts: [],
    });

    if (searchResponse.results && searchResponse.results.length > 0) {
      // Contact exists — update it
      const contactId = searchResponse.results[0].id;
      await client.crm.contacts.basicApi.update(contactId, { properties });
      console.log(`HubSpot: updated contact ${contactId} for ${data.email}`);
    } else {
      // Contact doesn't exist — create it
      await client.crm.contacts.basicApi.create({
        properties: { email: data.email, ...properties },
      });
      console.log(`HubSpot: created contact for ${data.email}`);
    }
  } catch (err: any) {
    console.error(`HubSpot sync failed for ${data.email}:`, err?.message || err);
  }
}

/**
 * Convenience wrapper that maps a User object to HubSpot contact data.
 */
export async function syncUserToHubSpot(
  user: Pick<User, 'email' | 'firstName' | 'lastName' | 'phoneNumber'>,
  overrides: Partial<HubSpotContactData> = {}
): Promise<void> {
  if (!user.email) return;
  await createOrUpdateHubSpotContact({
    email: user.email,
    firstname: user.firstName ?? undefined,
    lastname: user.lastName ?? undefined,
    phone: user.phoneNumber ?? undefined,
    ...overrides,
  });
}
