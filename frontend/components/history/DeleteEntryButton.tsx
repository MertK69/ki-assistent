'use client';
import { deleteHistoryEntry } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Diesen Eintrag löschen?')) return;
    await deleteHistoryEntry(entryId);
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-red-400 hover:text-red-600"
    >
      Löschen
    </button>
  );
}
