import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { WorkspaceGate } from "@/components/layout/WorkspaceGate";
import { getProfile, getCurrentUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;

  if (!token) {
    redirect("/login");
  }

  // Fetch user + profile in parallel — if either fails, continue gracefully
  const [user, profile] = await Promise.all([
    getCurrentUser(token),
    getProfile(token),
  ]);

  // Only redirect if we're certain there's no valid session
  // (middleware already blocks unauthenticated requests)
  if (!user) {
    redirect("/login");
  }

  const onboardingCompleted = (profile as any)?.onboarding_completed ?? false;

  return (
    <WorkspaceGate onboardingCompleted={onboardingCompleted}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,theme(colors.slate.50),theme(colors.background)_55%)]">
        <div className="mx-auto flex min-h-screen max-w-[1600px]">
          <SidebarNav email={user.email} />
          <div className="flex min-h-screen flex-1 flex-col">{children}</div>
        </div>
      </div>
    </WorkspaceGate>
  );
}
