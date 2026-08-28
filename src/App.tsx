import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExchangeInput } from './components/exchange-input';
import { QsoLog } from './components/qso-log';
import { TrainingHistory } from './components/training-history';
import { CallDataPanels } from './components/call-data-panels';
import { ContestDefinitionPanel } from './components/contest-definition-panel';
import { MobileActionBar } from './components/mobile-action-bar';
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

  const schedulerRef = useRef<AudioScheduler | null>(null);
  const engineRef = useRef<ContestEngine | null>(null);
  const callSent = useRef(false);
  const nrSent = useRef(false);
  const callRef = useRef<HTMLInputElement>(null);
  const exch1Ref = useRef<HTMLInputElement>(null);
  const exch2Ref = useRef<HTMLInputElement>(null);

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

  const focusExchange = useCallback(() => {
    const active = document.activeElement;
    if (active === callRef.current) {
      exch1Ref.current?.focus();
    } else if (active === exch1Ref.current) {
      exch2Ref.current?.focus();
    } else if (active === exch2Ref.current || !callRef.current?.value) {
      callRef.current?.focus();
    } else exch1Ref.current?.focus();
  }, [setExchange]);

  const sendCq = useCallback(() => { callSent.current = false; nrSent.current = false; engine.send('cq'); }, [engine]);
  const sendHisCall = useCallback(() => {
    const current = useGameStore.getState().call.toUpperCase();
    if (current) engine.me.hisCall = current;
    callSent.current = true;
    engine.send('hisCall');
  }, [engine]);
  const sendNr = useCallback(() => { nrSent.current = true; engine.send('nr'); }, [engine]);
  const sendTu = useCallback(() => engine.send('tu'), [engine]);

  const saveQso = useCallback(() => {
    const state = useGameStore.getState();
    const saved = engine.saveQso({
      call: state.call.toUpperCase(),
      exch1: state.exch1 || engine.myExchange().exch1,
      exch2: state.exch2 || engine.myExchange().exch2,
    });
    if (!saved) {
      callRef.current?.focus();
      return;
    }
    callSent.current = false;
    nrSent.current = false;
    setExchange({ call: '', exch1: '', exch2: '' });
    callRef.current?.focus();
  }, [engine, setExchange]);

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

    const contestDefinition = CONTESTS[settings.contest];

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
    <div className="min-h-screen text-slate-100" onKeyDown={onFormKeyDown}>
      <header className="sticky top-0 z-30 border-b border-[#172232]/90 bg-[#04060a]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-md border border-emerald-400/35 bg-emerald-950/60 font-mono text-lg font-bold text-emerald-300 shadow-[0_0_22px_rgba(67,242,165,0.16)]">M</span>
            <div className="min-w-0">
              <h1 className="truncate text-[13px] font-bold tracking-[0.015em] text-slate-100 sm:text-sm">{t('title')}</h1>
              <p className="truncate text-[10px] uppercase tracking-[0.08em] text-slate-500">{t('subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`status-pill ${running ? 'status-pill-live' : ''}`}>
              <span className={`size-1.5 rounded-full ${running ? 'bg-emerald-400 shadow-[0_0_8px_#43f2a5]' : 'bg-slate-600'}`} />
              {running ? t(engine.runMode) : t('idle')}
            </span>
            <select aria-label={t('language')} value={i18n.language.slice(0, 2)} onChange={(e) => { const language = e.target.value; void i18n.changeLanguage(language); setSettings({ language }); }} className="control-input h-[1.7rem] w-auto px-2 text-xs">
              <option value="en">EN</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-3 p-3 pb-24 sm:p-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:pb-4">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2" data-testid="run-mode-bar">
            <div className="segmented min-w-full flex-1 sm:min-w-0">
              {MODES.map((mode) => (
                <button key={mode} disabled={running} onClick={() => void startRun(mode)} className={`segment-button ${engine.runMode === mode ? 'segment-active' : ''}`}>
                  {t(mode)}
                </button>
              ))}
            </div>
            {running && <button onClick={stopRun} className="btn btn-danger min-h-9 px-4 text-xs">{t('stop')}</button>}
          </div>

          <div className="operator-console p-3">
            <div className="stat-strip mb-3">
              <div className="stat-cell">
                <span className="stat-label">{t('time')}</span>
                <span className="stat-value stat-value-primary">{new Date(elapsed * 1000).toISOString().substring(11, 19)}</span>
              </div>
              <div className="stat-cell">
                <span className="stat-label">{t('qsoCount')}</span>
                <span className="stat-value">{qsoList.length}</span>
              </div>
              <div className="stat-cell">
                <span className="stat-label">{t('pileupCount')}</span>
                <span className="stat-value">{pileup}</span>
              </div>
              <div className="stat-cell">
                <span className="stat-label">{t('score')}</span>
                <span className="stat-value">{stats.score}{engine.runMode !== 'hst' && <small className="ml-1 text-[10px] text-slate-500">{`(${stats.points}×${stats.multipliers})`}</small>}</span>
              </div>
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

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] leading-relaxed text-slate-500">{running ? t('keyboardHint') : t('startHint')}</p>
              <TrainingResults contest={contestDefinition} settings={settings} qsos={qsoList} startedAt={startedAtRef.current} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[['F1', 'CQ', sendCq], ['F2', 'NR', sendNr], ['F3', 'TU', sendTu], ['F5', 'HIS', sendHisCall], ['F8', 'NIL', () => engine.send('nil')], ['F9', 'AGN', () => engine.send('agn')]].map(([key, label, action]) => (
              <button key={key as string} onClick={action as () => void} className="btn message-key">
                <small>{key as string}</small>
                <strong>{label as string}</strong>
              </button>
            ))}
          </div>

          <QsoLog contestDefinition={contestDefinition} qsos={qsoList} />

        </section>

        <aside className="space-y-3">
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
