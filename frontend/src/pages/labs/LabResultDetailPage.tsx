import { useParams } from "react-router-dom";
import { usePromopApi } from "@/hooks/useApi";
import LabResultsFallback from "./LabResultsFallback";

export default function LabResultDetailPage() {
  const { test } = useParams<{ test: string }>();
  const apiClient = usePromopApi();
  return (
    <div className="federated-content rounded-lg bg-background p-6">
      <LabResultsFallback apiClient={apiClient} selectedTest={test} />
    </div>
  );
}
