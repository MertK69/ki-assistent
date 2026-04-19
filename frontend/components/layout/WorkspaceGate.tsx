"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function WorkspaceGate({
  onboardingCompleted,
  children,
}: {
  onboardingCompleted: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!onboardingCompleted && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
    if (onboardingCompleted && pathname === "/onboarding") {
      router.replace("/workspace");
    }
  }, [onboardingCompleted, pathname, router]);

  return <>{children}</>;
}
