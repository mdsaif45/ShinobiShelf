/**
 * React adapters over the framework-agnostic PWA modules.
 *
 * The modules in this folder deliberately know nothing about React; these
 * hooks are the only place the two worlds meet.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  getCapability,
  onCapabilityChange,
  promptInstall,
  type InstallCapability,
} from './install';
import { applyUpdate, onUpdateReady } from './serviceWorker';

/**
 * Whether this app can be installed, and how.
 * `capability.kind` drives which affordance the UI should show.
 */
export function useInstallCapability() {
  const [capability, setCapability] = useState<InstallCapability>(() => getCapability());

  useEffect(() => onCapabilityChange(setCapability), []);

  const install = useCallback(async () => {
    const outcome = await promptInstall();
    setCapability(getCapability());
    return outcome;
  }, []);

  return { capability, install };
}

/** True once a new service worker version is installed and waiting. */
export function useUpdateAvailable() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => onUpdateReady(() => setUpdateReady(true)), []);

  return { updateReady, applyUpdate };
}
