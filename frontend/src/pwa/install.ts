/**
 * Install prompt handling.
 *
 * Platforms differ in ways that cannot be abstracted away:
 *
 *   Chrome / Edge / Android  fire `beforeinstallprompt`, which can be captured
 *                            and replayed later from a button.
 *   iOS Safari               never fires it. Installing is a manual
 *                            Share -> "Add to Home Screen", and there is no
 *                            API to trigger or detect the sheet. The only
 *                            honest option is to show instructions.
 *
 * So this module reports a *capability*, and the UI decides what to render.
 */

export type InstallCapability =
  | { kind: 'unsupported' }
  | { kind: 'installed' }
  | { kind: 'prompt' }
  | { kind: 'ios-manual' };

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(capability: InstallCapability) => void>();

/** True when already running as an installed app rather than a browser tab. */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari's non-standard flag, still the only signal on iOS.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as a Mac; touch points disambiguate it.
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
}

export function getCapability(): InstallCapability {
  if (isStandalone()) return { kind: 'installed' };
  if (deferredPrompt) return { kind: 'prompt' };
  if (isIos()) return { kind: 'ios-manual' };
  return { kind: 'unsupported' };
}

function emit() {
  const capability = getCapability();
  listeners.forEach((listener) => listener(capability));
}

export function initInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Suppressing the browser's own mini-infobar lets the app choose a moment
    // that is not the user's first second on the page.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    emit();
  });
}

export function onCapabilityChange(
  listener: (capability: InstallCapability) => void
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Show the native install dialog. Resolves to the user's choice.
 * The captured event is single-use: the browser will fire a fresh one if the
 * app remains installable after a dismissal.
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';

  const event = deferredPrompt;
  deferredPrompt = null;

  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    emit();
    return outcome;
  } catch {
    emit();
    return 'unavailable';
  }
}
