import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';

export function PwaUpdatePrompt() {
  const { t } = useTranslation();
  const {
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
  const [dismissed, setDismissed] = useState(false);

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] z-50 rounded-lg border border-emerald-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur sm:left-auto sm:right-3 sm:w-96">
      <p className="text-sm text-slate-200">{t('pwaUpdateReady')}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => void updateServiceWorker(true)} className="min-h-11 flex-1 rounded bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500">{t('pwaReload')}</button>
        <button type="button" onClick={() => setDismissed(true)} className="min-h-11 rounded border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">{t('pwaLater')}</button>
      </div>
    </div>
  );
}
