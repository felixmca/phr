import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AxiosInstance } from "axios";
import { useEnsurePromopPerson } from "@/hooks/useApi";

type LabValue = {
  measurement_id: number;
  value: number | null;
  value_string: string | null;
  unit: string | null;
  measured_at: string | null;
};

type LabCard = {
  concept_code: string;
  concept_name: string;
  category: string | null;
  values?: LabValue[];
};

function formatValue(card: LabCard): string {
  const latest = card.values?.[0];
  if (!latest) return "—";
  if (latest.value != null) {
    const unit = latest.unit ? ` ${latest.unit}` : "";
    return `${latest.value}${unit}`;
  }
  return latest.value_string || "—";
}

export default function LabResultsFallback({
  apiClient,
  selectedTest,
}: {
  apiClient: AxiosInstance;
  selectedTest?: string;
}) {
  const navigate = useNavigate();
  useEnsurePromopPerson(apiClient);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [detail, setDetail] = useState("");
  const [cards, setCards] = useState<LabCard[]>([]);
  const [values, setValues] = useState<LabValue[]>([]);
  const [testName, setTestName] = useState(selectedTest || "");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (selectedTest) {
          const res = await apiClient.get("/lab-results/values/", {
            params: { concept_code: selectedTest, page_size: 50 },
          });
          if (cancelled) return;
          const data = res.data as { results?: LabValue[]; concept_name?: string; original_name?: string };
          setValues(data.results || []);
          setTestName(data.original_name || data.concept_name || selectedTest);
          setStatus((data.results || []).length ? "ready" : "empty");
          return;
        }
        const res = await apiClient.get("/lab-results/summary/", { params: { page_size: 50 } });
        if (cancelled) return;
        const rows = ((res.data as { results?: LabCard[] }).results || []) as LabCard[];
        setCards(rows);
        setStatus(rows.length ? "ready" : "empty");
      } catch (err: unknown) {
        if (cancelled) return;
        const statusCode =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;
        setStatus("error");
        if (statusCode === 401) {
          setDetail("PRomop rejected this phr token. Sign out and back in, then try again.");
        } else {
          setDetail("Could not load lab results from PRomop.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiClient, selectedTest]);

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Loading lab results…</p>;
  }

  if (status === "error") {
    return <p className="text-sm text-destructive">{detail}</p>;
  }

  if (selectedTest) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/labs/results")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to results
        </button>
        <h2 className="text-lg font-medium">{testName}</h2>
        {status === "empty" ? (
          <p className="text-sm text-muted-foreground">No values for this test.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {values.map((v) => (
              <li key={v.measurement_id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{v.measured_at ? v.measured_at.slice(0, 10) : "—"}</span>
                <span>
                  {v.value != null ? v.value : v.value_string || "—"}
                  {v.unit ? ` ${v.unit}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-medium">Lab Results</h2>
        <p className="text-sm text-muted-foreground">
          No lab measurements for this phr account’s PRomop person. The dump patients
          (person_id 2–5 and 7–12) each have about 100 OMOP measurements — open{" "}
          <a className="underline" href="https://phrame-promop-ui.vercel.app">
            PRomop
          </a>{" "}
          as dump admin to browse those records.
        </p>
      </div>
    );
  }

  const groups = new Map<string, LabCard[]>();
  for (const card of cards) {
    const cat = card.category || "Other";
    const list = groups.get(cat) || [];
    list.push(card);
    groups.set(cat, list);
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">Loaded from PRomop /lab-results/summary/ (OMOP measurements).</p>
      {[...groups.entries()].map(([category, groupCards]) => (
        <div key={category}>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">{category}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {groupCards.map((card) => (
              <button
                key={card.concept_code}
                type="button"
                onClick={() => navigate(`/labs/results/${encodeURIComponent(card.concept_code)}`)}
                className="rounded-md border border-border bg-background p-3 text-left hover:bg-accent"
              >
                <div className="text-sm font-medium">{card.concept_name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{formatValue(card)}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
