const RETELL_BASE = "https://api.retellai.com";

function getConfig() {
  const apiKey = process.env.RETELL_AI_API_KEY;
  const phoneNumber = process.env.RETELL_AI_PHONE_NUMBER;
  if (!apiKey) {
    console.warn("⚠️  RETELL_AI_API_KEY is not set — Retell AI features unavailable");
  }
  return { apiKey, phoneNumber, configured: !!apiKey };
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

export async function pingRetell(): Promise<{ ok: boolean; error?: string }> {
  const { apiKey, configured } = getConfig();
  if (!configured || !apiKey) {
    return { ok: false, error: "RETELL_AI_API_KEY not set" };
  }
  try {
    const r = await fetch(`${RETELL_BASE}/list-calls`, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify({ limit: 1 }),
    });
    if (r.ok || r.status === 200 || r.status === 400) {
      return { ok: true };
    }
    const text = await r.text().catch(() => "");
    return { ok: false, error: `HTTP ${r.status}: ${text.slice(0, 120)}` };
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
