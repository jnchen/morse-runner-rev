import { useTranslation } from 'react-i18next';

interface MobileActionBarProps {
  onCq: () => void;
  onExchange: () => void;
  onTuAndSave: () => void;
  onHisCall: () => void;
  onNil: () => void;
  onAgn: () => void;
  onAbort: () => void;
}

export function MobileActionBar({
  onCq, onExchange, onTuAndSave, onHisCall, onNil, onAgn, onAbort,
}: MobileActionBarProps) {
  const { t } = useTranslation();

  const primaryActions = [
    { label: t('sendCq'), action: onCq },
    { label: t('sendExchange'), action: onExchange },
    { label: t('sendTuAndSave'), action: onTuAndSave },
  ];
  const secondaryActions = [
    { label: t('sendHisCall'), action: onHisCall },
    { label: 'NIL', action: onNil },
    { label: 'AGN', action: onAgn },
    { label: t('abort'), action: onAbort },
  ];

  return (
    <nav
      aria-label={t('messages')}
      className="shrink-0 border-t border-slate-800 bg-slate-950/95 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto max-w-3xl space-y-2 px-2 pt-2">
        <div className="grid grid-cols-3 gap-2">
          {primaryActions.map(({ label, action }) => (
            <button
              key={label}
              type="button"
              onPointerDown={(event) => event.preventDefault()}
              onClick={action}
              className="min-h-11 rounded bg-emerald-600 px-2 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-500 active:bg-emerald-400"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {secondaryActions.map(({ label, action }) => (
            <button
              key={label}
              type="button"
              onPointerDown={(event) => event.preventDefault()}
              onClick={action}
              className="min-h-11 rounded border border-slate-700 bg-slate-900 px-1 py-2 text-sm font-medium transition hover:bg-slate-800 active:bg-slate-800"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
