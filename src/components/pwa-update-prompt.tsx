import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';

export function PwaUpdatePrompt() {
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

  return (
    <div className="panel fixed inset-x-3 bottom-3 z-50 p-3 sm:left-auto sm:right-3 sm:w-96">
      <p className="text-sm text-slate-200">{showUpdateFirst ? t('pwaUpdateReady') : t('pwaOfflineReady')}</p>
      {showUpdate ? (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => void updateServiceWorker(true)} className="btn btn-primary flex-1 px-3 py-2 text-xs">{t('pwaReload')}</button>
          <button type="button" onClick={() => setDismissedUpdate(true)} className="btn px-3 py-2 text-xs">{t('pwaLater')}</button>
        </div>
      ) : (
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={() => setDismissedOffline(true)} className="btn px-3 py-2 text-xs">{t('pwaClose')}</button>
        </div>
      )}
    </div>
  );
}
