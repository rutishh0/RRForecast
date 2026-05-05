// V5/src/pages/admin/SettingsPage.tsx
//
// Admin-only settings surface for ForeSight's AI provider/model/limits.
// Backend response shape (`settings: AdminSettings`) is intentionally
// open-ended — we let unknown fields round-trip untouched on save so the
// backend can extend without a frontend redeploy.
//
// The route guard (RequireAdmin) is the A2 agent's responsibility; this page
// also renders a fallback message if the response is unauthorized.

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { foresightAPI, type AdminSettings } from "@/src/services/foresight-api";

type Provider = "google" | "jarvis" | "openrouter";

const PROVIDER_LABELS: Record<Provider, string> = {
  google: "Google AI Studio (default)",
  jarvis: "Jarvis (self-hosted)",
  openrouter: "OpenRouter (last-resort)",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [primary, setPrimary] = useState<Provider>("google");
  const [model, setModel] = useState<string>("");
  const [dailyLimit, setDailyLimit] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    foresightAPI
      .getSettings()
      .then((r) => {
        if (cancelled) return;
        const s = r.settings ?? {};
        setSettings(s);
        if (s.primaryProvider) setPrimary(s.primaryProvider);
        if (typeof s.model === "string") setModel(s.model);
        if (typeof s.dailyLimit === "number") setDailyLimit(String(s.dailyLimit));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setFeedback({ kind: "err", text: e instanceof Error ? e.message : "Failed to load" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setFeedback(null);
    try {
      const next: AdminSettings = {
        ...(settings ?? {}),
        primaryProvider: primary,
      };
      if (model.trim()) next.model = model.trim();
      if (dailyLimit.trim()) {
        const parsed = Number(dailyLimit);
        if (!Number.isFinite(parsed) || parsed < 0) {
          setFeedback({ kind: "err", text: "Daily limit must be a non-negative number" });
          setSaving(false);
          return;
        }
        next.dailyLimit = parsed;
      }
      await foresightAPI.updateSettings(next);
      const fresh = await foresightAPI.getSettings();
      setSettings(fresh.settings);
      setFeedback({ kind: "ok", text: "Settings saved" });
    } catch (e: unknown) {
      setFeedback({ kind: "err", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-rr-text-dim">
        <Loader2 size={14} className="animate-spin" /> Loading…
      </div>
    );
  }

  const updatedAt = typeof settings?.updatedAt === "string" ? settings.updatedAt : null;
  const updatedBy = typeof settings?.updatedBy === "number" ? settings.updatedBy : null;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-lg font-bold text-rr-text mb-1">AI Settings</h1>
      <p className="text-sm text-rr-text-dim mb-6">
        Configure ForeSight's AI provider, default model, and daily request budget. Changes apply
        within ~60 seconds.
      </p>

      <div className="rounded-lg border border-rr-border bg-rr-card p-5 space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-rr-gold font-semibold mb-2">
            Primary provider
          </label>
          <select
            value={primary}
            onChange={(e) => setPrimary(e.target.value as Provider)}
            className="w-full px-3 py-2 rounded-md bg-rr-navy-50 border border-rr-border text-rr-text focus:outline-none focus:border-rr-gold/50"
          >
            {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-rr-gold font-semibold mb-2">
            Model (optional)
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. gemini-2.5-pro"
            className="w-full px-3 py-2 rounded-md bg-rr-navy-50 border border-rr-border text-rr-text placeholder:text-rr-text-muted focus:outline-none focus:border-rr-gold/50"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-rr-gold font-semibold mb-2">
            Daily request limit (optional)
          </label>
          <input
            type="number"
            min={0}
            value={dailyLimit}
            onChange={(e) => setDailyLimit(e.target.value)}
            placeholder="e.g. 1500"
            className="w-full px-3 py-2 rounded-md bg-rr-navy-50 border border-rr-border text-rr-text placeholder:text-rr-text-muted focus:outline-none focus:border-rr-gold/50"
          />
        </div>

        {updatedAt && (
          <p className="text-xs text-rr-text-muted">
            Last changed {new Date(updatedAt).toLocaleString()}
            {updatedBy != null ? ` by user #${updatedBy}` : ""}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-rr-gold text-rr-bg-secondary
              disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm
              hover:bg-rr-gold-bright transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {feedback?.kind === "ok" && (
            <span className="text-xs text-rr-success flex items-center gap-1">
              <CheckCircle2 size={12} /> {feedback.text}
            </span>
          )}
          {feedback?.kind === "err" && (
            <span className="text-xs text-rr-danger flex items-center gap-1">
              <AlertTriangle size={12} /> {feedback.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
