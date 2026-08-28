import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
interface PwaUpdatePromptProps {
  raised?: boolean;
}

export function PwaUpdatePrompt({ raised = false }: PwaUpdatePromptProps) {
  const { t } = useTranslation();
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url: string, registration: ServiceWorkerRegistration | undefined) {
      if (!registration) return;
      window.setInterval(() => {
        void registration.update().catch(() => undefined);
      }, 60 * 60 * 1000);
    },
  });
  const [dismissedOffline, setDismissedOffline] = useState(false);
  const [dismissedUpdate, setDismissedUpdate] = useState(false);
  const showOffline = offlineReady && !dismissedOffline;
  const showUpdate = needRefresh && !dismissedUpdate;
  if (!showOffline && !showUpdate) return null;
  const showUpdateFirst = showUpdate || showOffline;
  const position = raised
    ? 'bottom-[calc(env(safe-area-inset-bottom,0px)+9.75rem)] sm:bottom-[calc(env(safe-area-inset-bottom,0px)+3rem)]'
    : 'bottom-3';

  return (
    <div className={`fixed inset-x-3 z-50 rounded-lg border border-emerald-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur sm:left-auto sm:right-3 sm:w-96 ${position}`}>
      <p className="text-sm text-slate-200">{showUpdateFirst ? t('pwaUpdateReady') : t('pwaOfflineReady')}</p>
      {showUpdate ? (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => void updateServiceWorker(true)} className="min-h-11 flex-1 rounded bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500">{t('pwaReload')}</button>
          <button type="button" onClick={() => setDismissedUpdate(true)} className="min-h-11 rounded border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">{t('pwaLater')}</button>
        </div>
      ) : (
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={() => setDismissedOffline(true)} className="min-h-11 rounded border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">{t('pwaClose')}</button>
        </div>
      )}
    </div>
  );
}
