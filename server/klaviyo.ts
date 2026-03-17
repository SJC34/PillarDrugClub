import type { User } from '@shared/schema';

const KLAVIYO_BASE = 'https://a.klaviyo.com/api';
const REVISION = '2024-02-15';

function getApiKey(): string {
  const key = process.env.KLAVIYO_API_KEY;
  if (!key) throw new Error('KLAVIYO_API_KEY environment variable is not set');
  return key;
}

function headers(): Record<string, string> {
  return {
    'Authorization': `Klaviyo-API-Key ${getApiKey()}`,
    'revision': REVISION,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

async function upsertProfile(attributes: Record<string, any>): Promise<void> {
  const body = {
    data: {
      type: 'profile',
      attributes,
    },
  };

  const createRes = await fetch(`${KLAVIYO_BASE}/profiles/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (createRes.status === 201) {
    return;
  }

  if (createRes.status === 409) {
    const errorBody = await createRes.json();
    const duplicateId = errorBody?.errors?.[0]?.meta?.duplicate_profile_id;
    if (!duplicateId) {
      console.error('Klaviyo: 409 conflict but no duplicate_profile_id found', errorBody);
      return;
    }

    const patchRes = await fetch(`${KLAVIYO_BASE}/profiles/${duplicateId}/`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({
        data: {
          type: 'profile',
          id: duplicateId,
          attributes,
        },
      }),
    });

    if (!patchRes.ok) {
      const patchError = await patchRes.text();
      throw new Error(`Klaviyo profile update failed (${patchRes.status}): ${patchError}`);
    }
    return;
  }

  const errorText = await createRes.text();
  throw new Error(`Klaviyo profile create failed (${createRes.status}): ${errorText}`);
}

async function trackEvent(
  email: string,
  eventName: string,
  properties: Record<string, any> = {}
): Promise<void> {
  const body = {
    data: {
      type: 'event',
      attributes: {
        properties,
        metric: {
          data: {
            type: 'metric',
            attributes: { name: eventName },
          },
        },
        profile: {
          data: {
            type: 'profile',
            attributes: { email },
          },
        },
      },
    },
  };

  const res = await fetch(`${KLAVIYO_BASE}/events/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Klaviyo event "${eventName}" failed (${res.status}): ${errorText}`);
  }
}

export type KlaviyoOverrides = {
  subscription_status?: 'free' | 'active' | 'canceled';
  lifecycle_stage?: 'lead' | 'customer';
};

/**
 * Upserts a Klaviyo profile for the given user and optionally tracks a lifecycle event.
 * All errors are caught and logged — never throws, so it never breaks the caller.
 */
export async function syncUserToKlaviyo(
  user: Pick<User, 'email' | 'firstName' | 'lastName' | 'phoneNumber' | 'smsConsent'>,
  overrides: KlaviyoOverrides = {},
  event?: 'Registered' | 'Subscribed' | 'Subscription Cancelled'
): Promise<void> {
  if (!user.email) return;

  const attributes: Record<string, any> = {
    email: user.email,
  };

  if (user.firstName) attributes.first_name = user.firstName;
  if (user.lastName) attributes.last_name = user.lastName;
  if (user.phoneNumber && user.smsConsent === 'true') {
    attributes.phone_number = user.phoneNumber;
  }

  if (overrides.subscription_status || overrides.lifecycle_stage) {
    attributes.properties = {};
    if (overrides.subscription_status) {
      attributes.properties.subscription_status = overrides.subscription_status;
    }
    if (overrides.lifecycle_stage) {
      attributes.properties.lifecycle_stage = overrides.lifecycle_stage;
    }
  }

  try {
    await upsertProfile(attributes);
    if (event && user.email) {
      await trackEvent(user.email, event, {
        subscription_status: overrides.subscription_status,
        lifecycle_stage: overrides.lifecycle_stage,
      });
    }
    console.log(`✅ Klaviyo: synced profile for ${user.email}${event ? ` + tracked "${event}"` : ''}`);
  } catch (err: any) {
    console.error(`Klaviyo sync failed for ${user.email}:`, err?.message || err);
  }
}
