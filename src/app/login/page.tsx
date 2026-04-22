import { Suspense } from "react";
import { LoginScreen } from "@/components/auth/login-screen";
import { FullPageSpinner } from "@/components/ui/loading";

export const metadata = {
  title: "Entrar — JPFINANCE",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <LoginScreen />
    </Suspense>
  );
}
