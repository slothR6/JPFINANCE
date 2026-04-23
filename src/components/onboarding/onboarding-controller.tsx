"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { savePreferences } from "@/services/repository";
import { OnboardingModal } from "./onboarding-modal";

interface OnboardingContextValue {
  openOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  openOnboarding: () => {},
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}

export function OnboardingController({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { preferences } = useData();
  const [open, setOpen] = useState(false);
  const autoChecked = useRef(false);

  // Auto-show once when preferences load and onboarding hasn't been completed
  useEffect(() => {
    if (autoChecked.current) return;
    if (preferences === null) return;

    autoChecked.current = true;
    if (!preferences.hasCompletedOnboarding) {
      setOpen(true);
    }
  }, [preferences]);

  const markDone = useCallback(async () => {
    setOpen(false);
    if (!user || !preferences) return;
    try {
      await savePreferences(user.uid, {
        ...preferences,
        hasCompletedOnboarding: true,
      });
    } catch {
      // non-critical: user can just dismiss again next visit
    }
  }, [user, preferences]);

  const openOnboarding = useCallback(() => setOpen(true), []);

  return (
    <OnboardingContext.Provider value={{ openOnboarding }}>
      {children}
      <OnboardingModal open={open} onFinish={markDone} onSkip={markDone} />
    </OnboardingContext.Provider>
  );
}
