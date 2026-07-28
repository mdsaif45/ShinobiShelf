import { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useInstallCapability } from '../../pwa/usePwa';

const DISMISS_KEY = 'circle.installDismissed';

/**
 * Install affordance.
 *
 * Renders nothing when the app is already installed or the browser cannot
 * install it, so it never advertises something that will not work. On iOS,
 * where no programmatic prompt exists, it explains the manual Share ->
 * "Add to Home Screen" path instead of offering a button that cannot fire.
 */
export function InstallPrompt() {
  const { capability, install } = useInstallCapability();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === '1'
  );
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (dismissed) return null;
  if (capability.kind === 'installed' || capability.kind === 'unsupported') return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-lg sm:left-auto sm:right-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#4B5320]/10 p-2 text-[#4B5320]">
          <Download className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-serif text-sm font-semibold text-[#2C2C2C]">Install Circle</p>

          {capability.kind === 'prompt' && (
            <>
              <p className="mt-0.5 text-xs text-[#8C867E]">
                Add it to your home screen for quicker access.
              </p>
              <button
                type="button"
                onClick={() => void install()}
                className="mt-3 rounded-xl bg-[#4B5320] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#3D441A]"
              >
                Install
              </button>
            </>
          )}

          {capability.kind === 'ios-manual' && (
            <>
              <p className="mt-0.5 text-xs text-[#8C867E]">
                Add it to your home screen from the Share menu.
              </p>
              {showIosHelp ? (
                <ol className="mt-2 space-y-1 text-xs text-[#8C867E]">
                  <li className="flex items-center gap-1.5">
                    <Share className="h-3.5 w-3.5 text-[#4B5320]" />
                    <span>1. Tap Share in the toolbar</span>
                  </li>
                  <li>2. Choose &ldquo;Add to Home Screen&rdquo;</li>
                  <li>3. Tap Add</li>
                </ol>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowIosHelp(true)}
                  className="mt-3 rounded-xl bg-[#4B5320] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#3D441A]"
                >
                  Show me how
                </button>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="rounded-full p-1.5 text-[#8C867E] transition-colors hover:bg-[#F5F2ED] hover:text-[#2C2C2C]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
