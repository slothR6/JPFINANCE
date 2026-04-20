import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { HouseholdDataProvider } from "@/components/providers/household-data-provider";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <HouseholdDataProvider>
        <AppShell>{children}</AppShell>
      </HouseholdDataProvider>
    </AuthGuard>
  );
}
