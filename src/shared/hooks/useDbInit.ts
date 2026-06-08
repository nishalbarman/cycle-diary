import { useEffect } from "react";
import { usePeriodStore } from "@/shared/store/periodStore";

export function useDbInit() {
  const hydrated = usePeriodStore((s) => s.hydrated);
  const hydrate = usePeriodStore((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated, hydrate]);
}
