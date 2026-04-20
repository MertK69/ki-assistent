'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function HistoryPagination({ total, pageSize = 20 }: { total: number; pageSize?: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentOffset = Number(searchParams.get('offset') ?? '0');

  const goTo = (offset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (offset <= 0) {
      params.delete('offset');
    } else {
      params.set('offset', String(offset));
    }
    const query = params.toString();
    router.push(`/history${query ? `?${query}` : ''}`);
  };

  const hasPrev = currentOffset > 0;
  const hasNext = currentOffset + pageSize < total;

  return (
    <div className="mt-6 flex items-center justify-end gap-2">
      <button
        onClick={() => goTo(Math.max(0, currentOffset - pageSize))}
        disabled={!hasPrev}
        className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg disabled:opacity-40"
      >
        Prev
      </button>
      <button
        onClick={() => goTo(currentOffset + pageSize)}
        disabled={!hasNext}
        className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
