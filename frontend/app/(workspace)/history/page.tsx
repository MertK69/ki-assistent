import { ClearHistoryButton } from "@/components/history/ClearHistoryButton";
import { DeleteEntryButton } from "@/components/history/DeleteEntryButton";
import { HistoryPagination } from "@/components/history/HistoryPagination";
import { getHistory } from "@/lib/api";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>;
}) {
  const { offset: offsetParam } = await searchParams;
  const offset = Number(offsetParam ?? "0");
  const history = (await getHistory(20, Number.isNaN(offset) ? 0 : offset)) as {
    entries: Array<{
      id: string;
      language: string;
      code_snippet: string;
      provider: string;
      created_at: string;
      analysis_result?: Record<string, unknown>;
    }>;
    total: number;
  };

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Verlauf</h1>
            <p className="text-sm text-gray-500 mt-1">
              Deine letzten Code-Analysen
            </p>
          </div>
          {history.total > 0 && <ClearHistoryButton />}
        </div>

        {history.total === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">Noch keine Analysen. Analysiere Code im Workspace um den Verlauf zu füllen.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.entries.map((entry) => (
              <div key={entry.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">{entry.language}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{entry.provider}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {new Date(entry.created_at).toLocaleString('de-DE')}
                    </span>
                    <DeleteEntryButton entryId={entry.id} />
                  </div>
                </div>

                <pre className="text-xs bg-gray-50 rounded p-3 overflow-hidden max-h-32 font-mono mb-3">
                  {entry.code_snippet}
                </pre>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {(entry.analysis_result?.diagnosis as string) ||
                   (entry.analysis_result?.feedback as string) ||
                   (entry.analysis_result?.detectedIssue as string) ||
                   "Analyse gespeichert"}
                </p>
              </div>
            ))}
          </div>
        )}

        {history.total > 20 ? <HistoryPagination total={history.total} /> : null}
    </div>
  );
}
