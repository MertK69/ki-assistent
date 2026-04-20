'use client';

import { useEffect, useState } from "react";
import { getLlmProviderStatus, updateLlmProvider } from "@/lib/api";

export function LlmProviderToggle({
  initialProvider,
  initialOllamaOnline,
}: {
  initialProvider: 'openai' | 'ollama';
  initialOllamaOnline: boolean;
}) {
  const [provider, setProvider] = useState<'openai' | 'ollama'>(initialProvider);
  const [ollamaOnline, setOllamaOnline] = useState(initialOllamaOnline);
  const [isChecking, setIsChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<'macos' | 'windows'>('macos');

  const checkOllama = async () => {
    setIsChecking(true);
    const status = await getLlmProviderStatus();
    setOllamaOnline(status.ollama_online);
    setIsChecking(false);
  };

  useEffect(() => {
    if (initialProvider === 'ollama') checkOllama();
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold">KI-Anbieter</h3>
        <p className="text-xs text-gray-500 mt-1">
          Lokale KI schützt deine Daten – kein Code verlässt deinen Rechner.
        </p>
      </div>

      <div className="flex gap-3">
        <div
          onClick={async () => {
            setProvider('openai');
            await updateLlmProvider('openai');
          }}
          className={
            provider === 'openai'
              ? "flex-1 cursor-pointer rounded-xl border-2 border-blue-500 bg-blue-50 p-4"
              : "flex-1 cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-4 hover:border-blue-300"
          }
        >
          <div className="text-2xl mb-2">☁️</div>
          <p className="text-sm font-medium">Cloud KI</p>
          <p className="text-xs text-gray-500">OpenAI GPT-4o-mini</p>
          {provider === 'openai' && (
            <span className="mt-2 inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Aktiv</span>
          )}
          <p className="text-xs text-orange-500 mt-2">
            ⚠️ Code wird an OpenAI gesendet
          </p>
        </div>

        <div
          onClick={async () => {
            setProvider('ollama');
            await updateLlmProvider('ollama');
            await checkOllama();
          }}
          className={
            provider === 'ollama'
              ? "flex-1 cursor-pointer rounded-xl border-2 border-green-500 bg-green-50 p-4"
              : "flex-1 cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-4 hover:border-green-300"
          }
        >
          <div className="text-2xl mb-2">🔒</div>
          <p className="text-sm font-medium">Lokale KI</p>
          <p className="text-xs text-gray-500">Ollama · gemma3:4b</p>
          {provider === 'ollama' && (
            <span className="mt-2 inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Aktiv</span>
          )}
          <p className="text-xs text-green-600 mt-2">
            ✓ Daten bleiben auf deinem Rechner
          </p>
        </div>
      </div>

      {provider === 'ollama' && (
        <div className="mt-3">
          {isChecking && <p className="text-xs text-gray-400">⏳ Prüfe Verbindung...</p>}
          {!isChecking && ollamaOnline && <p className="text-xs text-green-600">✓ Ollama läuft</p>}
          {!isChecking && !ollamaOnline && (
            <p className="text-xs text-red-500">
              ✗ Ollama nicht gefunden
              <button onClick={checkOllama} className="ml-2 text-xs underline text-red-500">Erneut prüfen</button>
            </p>
          )}
        </div>
      )}

      {provider === 'ollama' && !ollamaOnline && (
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-semibold text-orange-800 mb-3">🚀 Ollama einrichten</p>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('macos')}
              className={
                activeTab === 'macos'
                  ? "px-3 py-1 text-xs rounded bg-orange-200 text-orange-900 font-medium"
                  : "px-3 py-1 text-xs rounded border border-orange-300 text-orange-700"
              }
            >
              macOS
            </button>
            <button
              onClick={() => setActiveTab('windows')}
              className={
                activeTab === 'windows'
                  ? "px-3 py-1 text-xs rounded bg-orange-200 text-orange-900 font-medium"
                  : "px-3 py-1 text-xs rounded border border-orange-300 text-orange-700"
              }
            >
              Windows
            </button>
          </div>

          {activeTab === 'macos' ? (
            <div>
              <p className="text-xs font-medium text-orange-800">
                1. Ollama installieren
              </p>
              <code className="block bg-orange-100 rounded p-2 text-xs font-mono mt-1">brew install ollama</code>
              <p className="text-xs text-orange-600 mt-1">
                Homebrew nötig? → brew.sh
              </p>

              <p className="text-xs font-medium text-orange-800 mt-3">
                2. Ollama starten
              </p>
              <code className="block bg-orange-100 rounded p-2 text-xs font-mono mt-1">ollama serve</code>
              <p className="text-xs text-orange-600 mt-1">
                Terminal offen lassen während du die App nutzt.
              </p>

              <p className="text-xs font-medium text-orange-800 mt-3">
                3. Modell laden (einmalig ~3 GB)
              </p>
              <code className="block bg-orange-100 rounded p-2 text-xs font-mono mt-1">ollama pull gemma3:4b</code>

              <p className="text-xs font-medium text-orange-800 mt-3">
                4. Verbindung prüfen
              </p>
              <button onClick={checkOllama} className="mt-1 text-xs bg-orange-200 hover:bg-orange-300 text-orange-900 px-3 py-1 rounded">
                Verbindung prüfen
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs font-medium text-orange-800">
                1. Installer herunterladen
              </p>
              <a href="https://ollama.com/download/windows" target="_blank" className="text-xs text-blue-600 underline mt-1 block">
                ollama.com/download/windows
              </a>

              <p className="text-xs font-medium text-orange-800 mt-3">
                2. Ollama startet automatisch
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Läuft nach Installation als Dienst im Hintergrund.
              </p>

              <p className="text-xs font-medium text-orange-800 mt-3">
                3. Modell laden – PowerShell öffnen
              </p>
              <code className="block bg-orange-100 rounded p-2 text-xs font-mono mt-1">ollama pull gemma3:4b</code>

              <p className="text-xs font-medium text-orange-800 mt-3">
                4. Verbindung prüfen
              </p>
              <button onClick={checkOllama} className="mt-1 text-xs bg-orange-200 hover:bg-orange-300 text-orange-900 px-3 py-1 rounded">
                Verbindung prüfen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
