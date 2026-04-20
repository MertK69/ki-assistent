'use client';
import { clearHistory } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function ClearHistoryButton() {
  const router = useRouter();

  const handleClear = async () => {
    if (!confirm('Gesamten Verlauf löschen? Das kann nicht rückgängig gemacht werden.')) return;
    await clearHistory();
    router.refresh();
  };

  return (
    <button
      onClick={handleClear}
      className="text-xs text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg"
    >
      Verlauf löschen
    </button>
  );
}
