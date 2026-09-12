import { useEffect, useState } from "react";
import type { AxiosInstance } from "axios";

const EXACT_UI = "https://phrame-exact-ui.vercel.app";

export default function FindTrialsFallback({ promopApi }: { promopApi: AxiosInstance }) {
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [personId, setPersonId] = useState<number | null>(null);
  const [detail, setDetail] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await promopApi.get("/patient-info/me/");
        if (cancelled) return;
        const id = (res.data as { patient_info?: { person_id?: number } })?.patient_info?.person_id;
        if (id == null) {
          setStatus("empty");
          setDetail("PRomop has not provisioned a person for this phr login yet. Open Health Profile first.");
          return;
        }
        setPersonId(id);
        setStatus("ready");
      } catch (err: unknown) {
        if (cancelled) return;
        const statusCode =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;
        setStatus("error");
        setDetail(
          statusCode === 401
            ? "PRomop rejected this phr token. Sign out and back in, then try again."
            : "Could not resolve this account’s PRomop person_id.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [promopApi]);

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Loading trials…</p>;
  }

  if (status === "error" || status === "empty") {
    return <p className="text-sm text-muted-foreground">{detail}</p>;
  }

  const src = `${EXACT_UI}/?personId=${personId}`;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Trials from the EXACT database for PRomop person_id={personId}. Matching uses that
        patient’s record, not a hardcoded list.
      </p>
      <iframe
        title="Find Trials"
        src={src}
        className="h-[min(80vh,900px)] w-full rounded-md border border-border bg-background"
      />
    </div>
  );
}
