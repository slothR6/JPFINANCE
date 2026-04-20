"use client";

import { startTransition, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addMonths } from "date-fns";
import { getCurrentMonthKey, getMonthDate } from "@/lib/dates";

export function useMonthParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const monthKey = searchParams.get("mes") || getCurrentMonthKey();
  const selectedMonthDate = getMonthDate(monthKey);

  useEffect(() => {
    if (!searchParams.get("mes")) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("mes", monthKey);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [monthKey, pathname, router, searchParams]);

  function setMonth(nextMonthKey: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mes", nextMonthKey);

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  function shiftMonth(step: number) {
    setMonth(formatMonthKey(addMonths(getMonthDate(monthKey), step)));
  }

  return {
    monthKey,
    selectedMonthDate,
    setMonth,
    goToPreviousMonth: () => shiftMonth(-1),
    goToNextMonth: () => shiftMonth(1),
  };
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
