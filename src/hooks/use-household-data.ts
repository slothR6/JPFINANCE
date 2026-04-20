"use client";

import { useHouseholdDataContext } from "@/components/providers/household-data-provider";

export function useHouseholdData() {
  return useHouseholdDataContext();
}

