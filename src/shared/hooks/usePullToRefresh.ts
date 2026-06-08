import { useCallback, useState } from "react";
import { usePeriodStore } from "@/shared/store/periodStore";

export function usePullToRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const hydrate = usePeriodStore((s) => s.hydrate);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await hydrate();
    } catch {
      // Errors are already surfaced via the store's `error` field.
    } finally {
      setRefreshing(false);
    }
  }, [hydrate]);

  return { refreshing, onRefresh };
}
