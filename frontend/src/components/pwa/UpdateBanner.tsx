import { RefreshCw } from 'lucide-react';
import { useUpdateAvailable } from '../../pwa/usePwa';

/**
 * Shown when a new version has been installed but the page is still running
 * the old one.
 *
 * The reload is user-initiated on purpose: a service worker could swap versions
 * silently, but doing so mid-task can discard unsaved form state, so the choice
 * of moment stays with the user.
 */
export function UpdateBanner() {
  const { updateReady, applyUpdate } = useUpdateAvailable();

  if (!updateReady) return null;

  return (
    <div
      role="status"
      className="fixed left-4 right-4 top-4 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-[#E5E0D8] bg-white p-3 shadow-lg"
    >
      <div className="rounded-xl bg-[#4B5320]/10 p-2 text-[#4B5320]">
        <RefreshCw className="h-4 w-4" />
      </div>
      <p className="min-w-0 flex-1 text-xs text-[#2C2C2C]">
        A new version of Circle is ready.
      </p>
      <button
        type="button"
        onClick={applyUpdate}
        className="shrink-0 rounded-xl bg-[#4B5320] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#3D441A]"
      >
        Refresh
      </button>
    </div>
  );
}
