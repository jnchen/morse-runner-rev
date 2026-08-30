import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExchangeInput } from './components/exchange-input';
import { QsoLog } from './components/qso-log';
import { TrainingHistory } from './components/training-history';
import { CallDataPanels } from './components/call-data-panels';
import { ContestDefinitionPanel } from './components/contest-definition-panel';
import { MobileActionBar } from './components/mobile-action-bar';
import { useMobileVisualViewport } from './hooks/use-mobile-visual-viewport';
import { TrainingResults } from './components/training-results';
import { ContestSettingsPanel, StationPanel } from './components/settings-panels';
import { AudioScheduler } from './engine/audio-scheduler';
import { ContestEngine, contestStats } from './engine/contest';
import { useGameStore } from './stores/game-store';
import { clearCallHistory, clearMasterDta, loadCallHistory, loadMasterDta, saveCallHistory, saveMasterDta } from './stores/call-list-store';
import { clearTrainingResults, listTrainingResults, saveTrainingResult, type TrainingResult } from './stores/training-results-store';
import { CONTESTS, type ContestId } from './engine/contest-defs';
import type { RunMode } from './types';

const MODES: RunMode[] = ['pileup', 'single', 'wpx', 'hst'];

export default function App() {
  useMobileVisualViewport();
  const { t, i18n } = useTranslation();
  const settings = useGameStore((s) => s.settings);
  const setSettings = useGameStore((s) => s.setSettings);
  const call = useGameStore((s) => s.call);
  const exch1 = useGameStore((s) => s.exch1);
  const exch2 = useGameStore((s) => s.exch2);
  const setExchange = useGameStore((s) => s.setExchange);
  const addQso = useGameStore((s) => s.addQso);
  const replaceQsoList = useGameStore((s) => s.replaceQsoList);

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [pileup, setPileup] = useState(0);
  const [qsoList, setQsoList] = useState(() => useGameStore.getState().qsoList);
  const [volume, setVolume] = useState(0.35);
  const [callCount, setCallCount] = useState(12000);
  const [historyCount, setHistoryCount] = useState(0);
  const startedAtRef = useRef(new Date());
  const [history, setHistory] = useState<TrainingResult[]>([]);
  const [mobilePanel, setMobilePanel] = useState<'log' | 'settings'>('log');

  const schedulerRef = useRef<AudioScheduler | null>(null);
  const engineRef = useRef<ContestEngine | null>(null);
  const callSent = useRef(false);
  const nrSent = useRef(false);
  const callRef = useRef<HTMLInputElement>(null);
  const exch1Ref = useRef<HTMLInputElement>(null);
  const exch2Ref = useRef<HTMLInputElement>(null);

  const contestDefinition = CONTESTS[settings.contest];
  const firstExchangeIsRst = contestDefinition.fields[0]?.type === 'rst';
  const engine = useMemo(() => new ContestEngine(useGameStore.getState().settings, {
    stateChanged: () => {
      const e = engineRef.current;
      setElapsed(e?.seconds ?? 0);
      setPileup(e?.dxCount ?? 0);
    },
    qsoCompleted: (qso) => {
      setQsoList((old) => [...old, qso]);
      addQso(qso);
    },
    finished: () => stopRun(),
  }), [addQso]);

  useEffect(() => { engineRef.current = engine; }, [engine]);
  useEffect(() => {
    const scheduler = new AudioScheduler();
    schedulerRef.current = scheduler;
    return () => scheduler.stop();
  }, []);

  const fillDefaultRst = useCallback(() => {
    if (firstExchangeIsRst && !useGameStore.getState().exch1) {
      setExchange({ exch1: '599' });
    }
  }, [firstExchangeIsRst, setExchange]);

  // MorseRunner skips an empty RST field, fills 599, and advances to the next field.
  const focusExchange = useCallback(() => {
    const active = document.activeElement;
    if (active === callRef.current) {
      if (firstExchangeIsRst) {
        fillDefaultRst();
        exch2Ref.current?.focus();
      } else {
        exch1Ref.current?.focus();
      }
    } else if (active === exch1Ref.current) {
      exch2Ref.current?.focus();
    } else if (active === exch2Ref.current || !callRef.current?.value) {
      callRef.current?.focus();
    } else if (firstExchangeIsRst) {
      callRef.current?.focus();
    } else {
      exch1Ref.current?.focus();
    }
  }, [fillDefaultRst, firstExchangeIsRst]);

  const sendCq = useCallback(() => { callSent.current = false; nrSent.current = false; engine.send('cq'); }, [engine]);
  const sendHisCall = useCallback(() => {
    fillDefaultRst();
    const current = useGameStore.getState().call.toUpperCase();
    if (current) engine.me.hisCall = current;
    callSent.current = true;
    engine.send('hisCall');
  }, [engine, fillDefaultRst]);
  const sendNr = useCallback(() => {
    fillDefaultRst();
    nrSent.current = true;
    engine.send('nr');
  }, [engine, fillDefaultRst]);
  const sendTu = useCallback(() => engine.send('tu'), [engine]);

  const saveQso = useCallback(() => {
    const myExchange = engine.myExchange();
    const state = useGameStore.getState();
    const saved = engine.saveQso({
      call: state.call.toUpperCase(),
      exch1: state.exch1 || (firstExchangeIsRst ? '599' : myExchange.exch1),
      exch2: state.exch2 || myExchange.exch2,
    });
    if (!saved) {
      callRef.current?.focus();
      return;
    }
    callSent.current = false;
    nrSent.current = false;
    setExchange({ call: '', exch1: '', exch2: '' });
    callRef.current?.focus();
  }, [engine, firstExchangeIsRst, setExchange]);

  const processEnter = useCallback(() => {
    if (eventModifiers()) { saveQso(); return; }
    const state = useGameStore.getState();
    if (!state.call) { sendCq(); return; }
    const c = callSent.current;
    const n = nrSent.current;
    const r = !!state.exch2 || !engine.contestDefinition.fields.some((field) => field.key === 'exch2');
    if (!c || (!n && !r)) sendHisCall();
    if (!n) sendNr();
    if (n && !r) engine.send('qm');
    if (r && (c || n)) {
      sendTu();
      saveQso();
    }
  }, [engine, saveQso, sendCq, sendHisCall, sendNr, sendTu]);

  const startRun = useCallback(async (mode: RunMode) => {
    if (!schedulerRef.current) return;
    engine.updateSettings(useGameStore.getState().settings);
    engine.start(mode);
    callSent.current = false;
    nrSent.current = false;
    setExchange({ call: '', exch1: '', exch2: '' });
    startedAtRef.current = new Date();
    setElapsed(0);
    setPileup(0);
    setQsoList([]);
    await schedulerRef.current.start(engine, volume);
    setRunning(true);
    callRef.current?.focus();
  }, [engine, setExchange, volume]);

  const stopRun = useCallback(() => {
    schedulerRef.current?.stop();
    engine.stop();
    setRunning(false);

    const qsos = [...qsoList];
    if (!qsos.length) return;
    const resultStats = contestStats(qsos, settings.contest, engine.runMode);
    void saveTrainingResult({
      id: crypto.randomUUID(),
      startedAt: startedAtRef.current.toISOString(),
      durationSeconds: Math.round(elapsed),
      mode: engine.runMode,
      contest: settings.contest,
      score: resultStats.score,
      points: resultStats.points,
      multipliers: resultStats.multipliers,
      qsoCount: qsos.length,
      settings,
      qsos,
    })
      .then(() => listTrainingResults())
      .then(setHistory)
      .catch(() => undefined);
  }, [elapsed, engine, qsoList, settings]);

  useEffect(() => { schedulerRef.current?.setVolume(volume); }, [volume]);

  const stats = useMemo(
    () => contestStats(qsoList, settings.contest, engine.runMode),
    [engine.runMode, qsoList, settings.contest],
  );

  const onFormKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey && e.key.toLowerCase() === 'w') {
      e.preventDefault();
      setExchange({ call: '', exch1: '', exch2: '' });
      callSent.current = nrSent.current = false;
      return;
    }

    switch (e.key) {
      case 'Enter':
        e.preventDefault(); processEnter(); return;
      case ' ':
        e.preventDefault(); focusExchange(); return;
      case 'Escape':
        e.preventDefault();
        if (engine.me.messages.has('hisCall')) callSent.current = false;
        if (engine.me.messages.has('nr')) nrSent.current = false;
        engine.me.abort(); return;
      case 'Insert':
        e.preventDefault(); sendHisCall(); sendNr(); return;
      case ';':
        e.preventDefault(); sendHisCall(); sendNr(); return;
      case '.':
      case '+':
      case '[':
      case ',':
        e.preventDefault(); if (!callSent.current) sendHisCall(); sendTu(); saveQso(); return;
      case '\\':
        e.preventDefault(); sendCq(); return;
      case 'F1': e.preventDefault(); sendCq(); return;
      case 'F2': e.preventDefault(); sendNr(); return;
      case 'F3': e.preventDefault(); sendTu(); return;
      case 'F4': e.preventDefault(); engine.send('myCall'); return;
      case 'F5': e.preventDefault(); sendHisCall(); return;
      case 'F6': e.preventDefault(); engine.send('b4'); return;
      case 'F7': e.preventDefault(); engine.send('qm'); return;
      case 'F8': e.preventDefault(); engine.send('nil'); return;
      case 'F9': e.preventDefault(); engine.send('agn'); return;
      default: return;
    }
  }, [engine, focusExchange, processEnter, saveQso, sendCq, sendHisCall, sendNr, sendTu, setExchange]);

  const importCallList = useCallback(async (file: File | undefined) => {
    if (!file) return;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      await engine.callList.loadMasterDta(bytes);
      await saveMasterDta(bytes);
      setCallCount(engine.callList.size);
    } catch { alert(t('invalidMaster')); }
  }, [engine, t]);

  const resetCallList = useCallback(async () => {
    engine.callList.reset();
    await clearMasterDta().catch(() => undefined);
    setCallCount(engine.callList.size);
  }, [engine]);

  const importCallHistory = useCallback(async (file: File | undefined) => {
    if (!file) return;
    const contest = settings.contest;
    try {
      const text = await file.text();
      engine.callHistory.load(contest, text);
      await saveCallHistory(contest, text);
      setHistoryCount(engine.callHistory.count);
    } catch { alert(t('invalidHistory')); }
  }, [engine, settings.contest, t]);

  const resetCallHistory = useCallback(async () => {
    engine.callHistory.clear(settings.contest);
    await clearCallHistory(settings.contest).catch(() => undefined);
    setHistoryCount(0);
  }, [engine, settings.contest]);

  const restoreTrainingResult = useCallback((result: TrainingResult) => {
    schedulerRef.current?.stop();
    engine.stop();
    engine.runMode = result.mode;
    startedAtRef.current = new Date(result.startedAt);
    setSettings(result.settings);
    setQsoList(result.qsos);
    replaceQsoList(result.qsos);
    setElapsed(result.durationSeconds);
    setRunning(false);
  }, [engine, replaceQsoList]);

  const clearTrainingHistory = useCallback(() => {
    void clearTrainingResults()
      .then(() => setHistory([]))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listTrainingResults()
      .then((results) => { if (!cancelled) setHistory(results); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadMasterDta()
      .then((bytes) => (cancelled || !bytes ? undefined : engine.callList.loadMasterDta(bytes)))
      .then(() => { if (!cancelled) setCallCount(engine.callList.size); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [engine]);

  useEffect(() => {
    let cancelled = false;
    void loadCallHistory(settings.contest)
      .then((text) => (cancelled || !text ? undefined : engine.callHistory.load(settings.contest, text)))
      .then(() => { if (!cancelled) setHistoryCount(engine.callHistory.count); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [engine, settings.contest]);

  const changeContest = (contest: ContestId) => {
    const definition = CONTESTS[contest];
    setSettings({
      contest,
      exchange1: definition.fields[0]?.default ?? '',
      exchange2: definition.fields[1]?.default ?? '',
    });
    setExchange({ exch1: '', exch2: '' });
  };

  const saveAndFinishMobile = () => {
    if (!callSent.current) sendHisCall();
    sendTu();
    saveQso();
  };


  return (
    <div className="fixed inset-x-0 top-0 flex h-[var(--app-visible-height,100dvh)] flex-col overflow-hidden bg-slate-950 text-slate-100 lg:static lg:block lg:min-h-[100dvh] lg:h-auto lg:overflow-visible" onKeyDown={onFormKeyDown}>
      <header className="shrink-0 border-b border-slate-800 bg-slate-950/95 px-3 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] backdrop-blur sm:px-6 lg:sticky lg:top-0 lg:z-30">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold sm:text-xl">{t('title')}</h1>
            <p className="text-xs text-slate-400 sm:text-sm">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded px-2 py-1 text-xs ${running ? 'bg-emerald-600' : 'bg-slate-800 text-slate-400'}`}>
              {running ? `${t(engine.runMode)} · ${pileup}` : t('idle')}
            </span>
            <select aria-label={t('language')} value={i18n.language.slice(0, 2)} onChange={(e) => { const language = e.target.value; void i18n.changeLanguage(language); setSettings({ language }); }} className="min-h-11 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 overflow-y-auto p-3 pb-4 sm:p-4 sm:pb-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-visible lg:p-6 lg:pb-6">
        <section className="flex shrink-0 flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {MODES.map((mode) => (
              <button key={mode} disabled={running} onClick={() => void startRun(mode)} className="min-h-11 rounded bg-emerald-600 px-3 py-2 text-sm font-medium transition hover:bg-emerald-500 active:bg-emerald-500 disabled:opacity-40">
                {t(mode)}
              </button>
            ))}
            {running && <button onClick={stopRun} className="min-h-11 rounded bg-red-600 px-3 py-2 text-sm font-medium hover:bg-red-500 active:bg-red-400 sm:col-auto">{t('stop')}</button>}
          </div>


          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 shadow sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
              <span className="font-mono">{new Date(elapsed * 1000).toISOString().substring(11, 19)}</span>
              <TrainingResults contest={contestDefinition} settings={settings} qsos={qsoList} startedAt={startedAtRef.current} />
              <span>{t('score')}: <b className="text-slate-100">{stats.score}</b>{engine.runMode !== 'hst' && ` (${stats.points} × ${stats.multipliers})`}</span>
            </div>
            <ExchangeInput
              contestDefinition={contestDefinition}
              call={call}
              exch1={exch1}
              exch2={exch2}
              callRef={callRef}
              exch1Ref={exch1Ref}
              exch2Ref={exch2Ref}
              onCallChange={(value) => {
                setExchange({ call: value });
                if (!value) nrSent.current = false;
                engine.me.updateCallInMessage(value);
              }}
              onExch1Change={(value) => setExchange({ exch1: value })}
              onExch2Change={(value) => setExchange({ exch2: value })}
              onSave={saveQso}
              onClear={() => {
                setExchange({ call: '', exch1: '', exch2: '' });
                callSent.current = nrSent.current = false;
              }}
            />
          </div>

          <div className="hidden gap-2 lg:grid lg:grid-cols-4">
            {[['F1 · CQ', sendCq], ['F2 · NR', sendNr], ['F3 · TU', sendTu], ['F5 · HIS', sendHisCall], ['F8 · NIL', () => engine.send('nil')], ['F9 · AGN', () => engine.send('agn')]].map(([label, action]) => (
              <button key={label as string} onClick={action as () => void} className="rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800">{label as string}</button>
            ))}
          </div>

          <div className={mobilePanel === 'settings' ? 'hidden lg:block' : ''}>
            <QsoLog contestDefinition={contestDefinition} qsos={qsoList} reviewWpm={settings.wpm} reviewFrequency={settings.pitch} reviewVolume={volume} />
          </div>
        </section>

        <div className="grid shrink-0 grid-cols-2 gap-2 rounded-lg border border-slate-800 bg-slate-900 p-1 lg:hidden">
          <button
            type="button"
            aria-pressed={mobilePanel === 'log'}
            onClick={() => setMobilePanel('log')}
            className={`min-h-11 rounded px-3 py-2 text-sm font-medium transition ${mobilePanel === 'log' ? 'bg-emerald-600 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            {t('log')}
          </button>
          <button
            type="button"
            aria-pressed={mobilePanel === 'settings'}
            onClick={() => setMobilePanel('settings')}
            className={`min-h-11 rounded px-3 py-2 text-sm font-medium transition ${mobilePanel === 'settings' ? 'bg-emerald-600 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            {t('settings')}
          </button>
        </div>

        <aside className={`min-w-0 shrink-0 space-y-4 ${mobilePanel === 'settings' ? '' : 'hidden lg:block'}`}>
          <StationPanel settings={settings} volume={volume} onSettingsChange={setSettings} onVolumeChange={setVolume} />
          <ContestSettingsPanel
            settings={settings}
            contest={settings.contest}
            onSettingsChange={setSettings}
            onContestChange={changeContest}
          />
          <ContestDefinitionPanel contest={contestDefinition} settings={settings} onSettingsChange={setSettings} />
          <CallDataPanels
            contest={contestDefinition}
            callCount={callCount}
            historyCount={historyCount}
            onImportCallList={importCallList}
            onResetCallList={() => void resetCallList()}
            onImportCallHistory={importCallHistory}
            onResetCallHistory={() => void resetCallHistory()}
          />
          <TrainingHistory results={history} onRestore={restoreTrainingResult} onClear={clearTrainingHistory} />
        </aside>
            </main>
      <MobileActionBar
        onCq={sendCq}
        onExchange={() => { if (!callSent.current) sendHisCall(); sendNr(); }}
        onTuAndSave={saveAndFinishMobile}
        onHisCall={sendHisCall}
        onNil={() => engine.send('nil')}
        onAgn={() => engine.send('agn')}
        onAbort={engine.me.abort}
      />
    </div>
  );
}


function eventModifiers() {
  if (typeof window === 'undefined') return false;
  const event = window.event as MouseEvent | undefined;
  return !!event?.ctrlKey || !!event?.shiftKey || !!event?.altKey;
}

