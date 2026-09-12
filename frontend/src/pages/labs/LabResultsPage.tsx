import { usePromopApi } from "@/hooks/useApi";
import LabResultsFallback from "./LabResultsFallback";

export default function LabResultsPage() {
  const apiClient = usePromopApi();
  return (
    <div className="federated-content rounded-lg bg-background p-6">
      <LabResultsFallback apiClient={apiClient} />
    </div>
  );
}
