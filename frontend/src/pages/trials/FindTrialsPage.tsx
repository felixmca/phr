import { usePromopApi } from "@/hooks/useApi";
import FindTrialsFallback from "./FindTrialsFallback";

export default function FindTrialsPage() {
  const promopApi = usePromopApi();
  return (
    <div className="federated-content rounded-lg bg-background p-6">
      <FindTrialsFallback promopApi={promopApi} />
    </div>
  );
}
