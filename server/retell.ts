const RETELL_BASE = "https://api.retellai.com";

// One-time startup warning — emit once per process start
let startupWarningEmitted = false;
function emitStartupWarningOnce() {
  if (startupWarningEmitted) return;
  startupWarningEmitted = true;
  const apiKey = process.env.RETELL_AI_API_KEY;
  const phoneNumber = process.env.RETELL_AI_PHONE_NUMBER;
  if (!apiKey && !phoneNumber) {
    console.warn("⚠️  RETELL_AI_API_KEY and RETELL_AI_PHONE_NUMBER are not set — Retell AI features unavailable");
  } else if (!apiKey) {
    console.warn("⚠️  RETELL_AI_API_KEY is not set — Retell AI features unavailable");
  } else if (!phoneNumber) {
    console.warn("⚠️  RETELL_AI_PHONE_NUMBER is not set — Retell AI phone status checks unavailable");
  }
}

// Emit warning at module load time (startup guard)
emitStartupWarningOnce();

function getConfig() {
  const apiKey = process.env.RETELL_AI_API_KEY;
  const phoneNumber = process.env.RETELL_AI_PHONE_NUMBER;
  return {
    apiKey,
    phoneNumber,
    configured: !!(apiKey && phoneNumber),
    missingVars: [
      ...(!apiKey ? ["RETELL_AI_API_KEY"] : []),
      ...(!phoneNumber ? ["RETELL_AI_PHONE_NUMBER"] : []),
    ],
  };
}

function headers(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export function isRetellConfigured(): boolean {
  return getConfig().configured;
}

export function getRetellMissingVars(): string[] {
  return getConfig().missingVars;
}

/**
 * Health check: verifies the API key is valid AND the configured phone number
 * is active on the Retell account.
 */
export async function pingRetell(): Promise<{ ok: boolean; error?: string }> {
  const { apiKey, phoneNumber, configured, missingVars } = getConfig();
  if (!configured || !apiKey) {
    return { ok: false, error: `Missing: ${missingVars.join(", ")}` };
  }

  // Step 1: Verify API key is valid by listing phone numbers
  try {
    const r = await fetch(`${RETELL_BASE}/list-phone-numbers`, {
      method: "GET",
      headers: headers(apiKey),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return { ok: false, error: `API auth failed (${r.status}): ${text.slice(0, 120)}` };
    }

    // Step 2: Verify configured phone number is in the account's active numbers
    const data: any = await r.json();
    const numbers: any[] = Array.isArray(data) ? data : (data?.phone_numbers ?? data?.data ?? []);

    const normalizedTarget = phoneNumber!.replace(/\s+/g, "").replace(/^\+/, "");
    const found = numbers.some((n: any) => {
      const num: string = (n.phone_number || n.number || "").replace(/\s+/g, "").replace(/^\+/, "");
      return num === normalizedTarget || num.endsWith(normalizedTarget) || normalizedTarget.endsWith(num);
    });

    if (!found) {
      return {
        ok: false,
        error: `Phone number ${phoneNumber} not found in Retell account (${numbers.length} numbers listed)`,
      };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Network error" };
  }
}

export interface RetellCallStats {
  callVolume: number;
  avgHandleTimeMinutes: number;
  missedCalls: number;
}

export async function getRetellCallStats(
  fromDate: Date,
  toDate: Date
): Promise<RetellCallStats | null> {
  const { apiKey, configured } = getConfig();
  if (!configured || !apiKey) return null;

  try {
    const body: Record<string, any> = {
      limit: 1000,
      filter_criteria: [
        { field: "start_timestamp", operator: ">=", value: fromDate.getTime() },
        { field: "start_timestamp", operator: "<", value: toDate.getTime() },
      ],
    };

    const r = await fetch(`${RETELL_BASE}/list-calls`, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      console.error(`Retell list-calls failed (${r.status}): ${errText.slice(0, 200)}`);
      return null;
    }

    const data: any = await r.json();
    const calls: any[] = Array.isArray(data) ? data : (data?.calls ?? data?.data ?? []);

    let totalDurationMs = 0;
    let answeredCount = 0;
    let missedCount = 0;

    for (const call of calls) {
      const status: string = (call.call_status || call.status || "").toLowerCase();
      const isMissed =
        status === "missed" ||
        status === "no-answer" ||
        status === "no_answer" ||
        status === "voicemail";

      if (isMissed) {
        missedCount++;
      } else {
        const durationMs =
          typeof call.duration_ms === "number"
            ? call.duration_ms
            : typeof call.end_timestamp === "number" && typeof call.start_timestamp === "number"
            ? call.end_timestamp - call.start_timestamp
            : 0;
        totalDurationMs += durationMs;
        answeredCount++;
      }
    }

    const avgHandleTimeMinutes =
      answeredCount > 0 ? totalDurationMs / answeredCount / 60_000 : 0;

    return {
      callVolume: calls.length,
      avgHandleTimeMinutes: Math.round(avgHandleTimeMinutes * 10) / 10,
      missedCalls: missedCount,
    };
  } catch (err: any) {
    console.error("Retell getCallStats error:", err?.message || err);
    return null;
  }
}
