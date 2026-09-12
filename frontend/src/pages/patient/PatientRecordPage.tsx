import { usePromopApi } from "@/hooks/useApi";
import HealthProfileFallback from "./HealthProfileFallback";

export default function PatientRecordPage() {
  const apiClient = usePromopApi();

  return (
    <div className="federated-content rounded-lg bg-background p-6">
      <HealthProfileFallback apiClient={apiClient} />
    </div>
  );
}
