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
    { label: t('abort'), action: onAbort, danger: true },
  ];

  return (
    <div className="sticky bottom-0 z-20 border-t border-slate-800 bg-[#04060a]/97 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <div className="grid grid-cols-3 gap-2">
        {actions.map(({ label, action, primary, danger }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className={`btn min-h-11 px-2 text-[11px] ${primary ? 'btn-primary' : ''} ${danger ? 'btn-danger col-span-3' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
