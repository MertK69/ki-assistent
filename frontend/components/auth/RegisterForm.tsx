"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL ?? "http://localhost:8000";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    setError(null);
    setInfo(null);
    setPending(true);
    try {
      const res = await fetch(`${FASTAPI_URL}/api/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? "Registrierung fehlgeschlagen.");
        return;
      }
      if (data.needs_email_confirmation) {
        setInfo(data.message);
        return;
      }
      router.push(data.redirect_to ?? "/onboarding");
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-sm">
      <h2 className="mb-1 text-xl font-semibold">Konto anlegen</h2>
      <p className="mb-6 text-sm text-muted-foreground">Starte deine Lernreise mit CodeMentor.</p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">E-Mail</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Passwort</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {info ? <p className="rounded-xl border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">{info}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Wird registriert…" : "Registrieren"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Bereits ein Konto?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Anmelden
        </Link>
      </p>
    </div>
  );
}
