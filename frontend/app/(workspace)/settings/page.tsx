import { cookies } from "next/headers";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { getProfile } from "@/lib/api";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value ?? "";
  const profile = token ? await getProfile(token) : null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Verstehen statt Kopieren</p>
        <h1 className="text-xl font-semibold tracking-tight">Einstellungen</h1>
        <p className="text-sm text-muted-foreground">Lernprofil anpassen und Präferenzen verwalten.</p>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <ProfileForm mode="settings" initial={profile as any} />
      </main>
    </div>
  );
}
