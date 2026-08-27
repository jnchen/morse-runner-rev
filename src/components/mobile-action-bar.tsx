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

  const actions = [
    { label: t('sendCq'), action: onCq, primary: true },
    { label: t('sendExchange'), action: onExchange, primary: true },
    { label: t('sendTuAndSave'), action: onTuAndSave, primary: true },
    { label: t('sendHisCall'), action: onHisCall },
    { label: 'NIL', action: onNil },
    { label: 'AGN', action: onAgn },
    { label: t('abort'), action: onAbort },
  ];

  return (
    <div className="sticky bottom-0 z-10 border-t border-slate-800 bg-slate-950/95 p-2 backdrop-blur lg:hidden">
      <div className="grid grid-cols-4 gap-2">
        {actions.map(({ label, action, primary }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className={`rounded px-2 py-3 text-sm font-medium ${primary ? 'bg-emerald-600 hover:bg-emerald-500' : 'border border-slate-700 bg-slate-900 hover:bg-slate-800'} ${label === t('abort') ? 'col-span-4' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
