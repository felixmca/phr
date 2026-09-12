import { useEffect, useState } from "react";
import type { AxiosInstance } from "axios";

type ProfilePayload = {
  patient_name?: string;
  patient_info?: {
    person_id?: number;
    disease?: string | null;
    email?: string | null;
    date_of_birth?: string | null;
    patient_age?: number | null;
    gender?: string | null;
  };
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export default function HealthProfileFallback({ apiClient }: { apiClient: AxiosInstance }) {
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [detail, setDetail] = useState("");
  const [profile, setProfile] = useState<ProfilePayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get("/patient-info/me/");
        if (cancelled) return;
        const data = res.data as ProfilePayload;
        const info = data?.patient_info;
        if (!info || info.person_id == null) {
          setStatus("empty");
          setDetail("PRomop has no patient record for this phr login yet.");
          return;
        }
        setProfile(data);
        setStatus("ready");
      } catch (err: unknown) {
        if (cancelled) return;
        const statusCode =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { status?: number; data?: { detail?: string } } }).response?.status
            : undefined;
        const message =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : undefined;
        if (statusCode === 404) {
          setStatus("empty");
          setDetail(
            "This phr account is not a PRomop patient. Clinical rows live on PRomop (dump admin on demo-org). Health Profile is a PRomop API view, not data stored in the phr database.",
          );
          return;
        }
        if (statusCode === 401) {
          setStatus("error");
          setDetail(
            "PRomop rejected this phr login token. Sign out and back in so the browser stores a JWT with aud=promop-api.",
          );
          return;
        }
        setStatus("error");
        setDetail(message || "Could not load Health Profile from PRomop.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiClient]);

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Loading health profile…</p>;
  }

  if (status !== "ready" || !profile?.patient_info) {
    return (
      <div className="rounded-lg border border-border bg-background p-6">
        <h2 className="text-base font-semibold text-foreground">Health Profile</h2>
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          phr identity is separate from PRomop. A PRomop account is PRomop-only.
          Use the documented phr dump admin, or open PRomop to see the 11 synthetic patients.
        </p>
      </div>
    );
  }

  const info = profile.patient_info;
  const rows = [
    ["Name", profile.patient_name || "—"],
    ["Person ID", info.person_id != null ? String(info.person_id) : "—"],
    ["Disease", info.disease?.trim() || "Not recorded"],
    ["Email", info.email?.trim() || "—"],
    ["Date of birth", info.date_of_birth || "—"],
    ["Age", info.patient_age != null ? String(info.patient_age) : "—"],
    ["Gender", info.gender || "—"],
  ] as const;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Health Profile</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Loaded from PRomop <code>/patient-info/me/</code> (clinical source of truth). Not a
          Module Federation remote.
        </p>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <Field key={label} label={label} value={value} />
        ))}
      </dl>
    </div>
  );
}
