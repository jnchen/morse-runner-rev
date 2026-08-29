import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const resources = {
  en: { translation: {
    title: 'Morse Runner Web',
    subtitle: 'Modern cross-platform CW contest trainer',
    start: 'Start', stop: 'Stop',
    pileup: 'Pile-up', single: 'Single Calls', wpx: 'WPX', hst: 'HST',
    station: 'Station', myCallsign: 'My callsign', band: 'Band', contest: 'Contest',
    callsign: 'Callsign', name: 'Name', speed: 'Speed (WPM)', pitch: 'Pitch (Hz)',
    bandwidth: 'Bandwidth (Hz)', qsk: 'QSK', activity: 'Activity',
    qrn: 'QRN', qrm: 'QRM', qsb: 'QSB', flutter: 'Flutter', lids: 'Lids',
    duration: 'Duration (min)', volume: 'Volume', contestType: 'Contest type', exchange: 'Exchange', class: 'Class', section: 'Section', state: 'State / province', power: 'Power', cqZone: 'CQ zone', zoneOrSociety: 'Zone / society', precedence: 'Precedence', checkSection: 'Check / section', callHistory: 'Call history', importHistory: 'Import history', resetHistory: 'Reset history', historyFallback: 'Using MASTER.DTA / generated list', usesMaster: 'Uses the main call list', invalidHistory: 'Invalid call-history file', callList: 'Call list', importMaster: 'Import MASTER.DTA', resetCalls: 'Reset', callsLoaded: '{{count}} calls loaded', callsFallback: 'Built-in generated list',
    call: 'Call', rst: 'RST', nr: 'NR', log: 'Log', score: 'Score',
    sendCq: 'CQ', sendNr: 'NR', sendTu: 'TU', sendMyCall: 'My call', sendHisCall: 'His call', agn: 'AGN',
    settings: 'Settings', language: 'Language', save: 'Save QSO (Enter)', clear: 'Clear',
    emptyLog: 'No QSO yet', exportLog: 'Export', exportAdif: 'ADIF', exportCabrillo: 'Cabrillo', trainingHistory: 'Training history', contestExchange: 'Contest exchange', sendExchange: 'EXCH', sendTuAndSave: 'TU+SAVE', abort: 'Abort', restore: 'Restore', noTrainingResults: 'No saved local results', messages: 'Messages', time: 'Time', rate: 'Rate', idle: 'Idle', keyboardHint: 'Enter: smart send/save · Space: next field · Esc: abort · F1-F9: messages', invalidMaster: 'Invalid MASTER.DTA file', pwaOfflineReady: 'Offline mode is ready', pwaUpdateReady: 'A new version is available', pwaReload: 'Reload', pwaLater: 'Later', pwaClose: 'Close',
  }},
  zh: { translation: {
    title: 'Morse Runner Web',
    subtitle: '现代跨平台 CW 竞赛训练器',
    start: '开始', stop: '停止',
    pileup: '呼叫堆积', single: '单个呼叫', wpx: 'WPX', hst: 'HST',
    station: '电台', myCallsign: '我的呼号', band: '频段', contest: '竞赛',
    callsign: '呼号', name: '姓名', speed: '速度 (WPM)', pitch: '音调 (Hz)',
    bandwidth: '带宽 (Hz)', qsk: 'QSK', activity: '活跃度',
    qrn: '天电 QRN', qrm: '干扰 QRM', qsb: '衰落 QSB', flutter: '抖动', lids: '不规范操作',
    duration: '时长 (分钟)', volume: '音量', contestType: '竞赛类型', exchange: '交换', class: '类别', section: '分区', state: '州 / 省', power: '功率', cqZone: 'CQ 分区', zoneOrSociety: '分区 / 协会', precedence: '优先码', checkSection: 'Check / 分区', callHistory: '呼号历史库', importHistory: '导入历史库', resetHistory: '重置历史库', historyFallback: '使用 MASTER.DTA / 生成列表', usesMaster: '使用主呼号列表', invalidHistory: '呼号历史库文件无效', callList: '呼号列表', importMaster: '导入 MASTER.DTA', resetCalls: '重置', callsLoaded: '已载入 {{count}} 个呼号', callsFallback: '内置生成列表',
    call: '呼号', rst: 'RST', nr: '序号', log: '日志', score: '得分',
    sendCq: 'CQ', sendNr: '序号', sendTu: 'TU', sendMyCall: '我的呼号', sendHisCall: '对方呼号', agn: 'AGN',
    settings: '设置', language: '语言', save: '保存 QSO (Enter)', clear: '清空',
    emptyLog: '暂无 QSO', exportLog: '导出', exportAdif: 'ADIF', exportCabrillo: 'Cabrillo', trainingHistory: '训练历史', contestExchange: '竞赛交换', sendExchange: '交换', sendTuAndSave: 'TU+保存', abort: '中止', restore: '恢复', noTrainingResults: '暂无本地结果', messages: '报文', time: '时间', rate: '速率', idle: '待机', keyboardHint: 'Enter：智能发送/保存 · Space：下一栏 · Esc：中止 · F1-F9：报文', invalidMaster: 'MASTER.DTA 文件无效', pwaOfflineReady: '离线模式已就绪', pwaUpdateReady: '新版本可用', pwaReload: '重新加载', pwaLater: '稍后', pwaClose: '关闭',
  }},
  ja: { translation: {
    title: 'Morse Runner Web', subtitle: 'モダンなクロスプラットフォームCWコンテストトレーナー',
    start: '開始', stop: '停止', pileup: 'パイルアップ', single: 'シングルコール', wpx: 'WPX', hst: 'HST',
    station: '局', myCallsign: '自分のコールサイン', band: 'バンド', contest: 'コンテスト', callsign: 'コールサイン', name: '名前',
    speed: '速度 (WPM)', pitch: 'ピッチ (Hz)', bandwidth: '帯域幅 (Hz)', qsk: 'QSK', activity: 'アクティビティ',
    duration: '時間 (分)', volume: '音量', qrn: 'QRN', qrm: 'QRM', qsb: 'QSB', flutter: 'フラッター', lids: 'LID', clear: 'クリア', contestType: 'コンテスト種別', exchange: '交換', class: 'クラス', section: 'セクション', state: '州 / 県', power: '出力', cqZone: 'CQゾーン', zoneOrSociety: 'ゾーン / 協会', precedence: 'プリセデンス', checkSection: 'チェック / セクション', callHistory: 'コールヒストリー', importHistory: 'ヒストリーを読み込む', resetHistory: 'ヒストリーをリセット', historyFallback: 'MASTER.DTA / 生成リストを使用', usesMaster: 'メインコールリストを使用', invalidHistory: 'コールヒストリーが無効です', callList: 'コールリスト', importMaster: 'MASTER.DTA を読み込む', resetCalls: 'リセット', callsLoaded: '{{count}} 件のコールを読み込み', callsFallback: '内蔵生成リスト', call: 'コール', rst: 'RST', nr: 'NR', log: 'ログ', score: 'スコア',
    settings: '設定', language: '言語', save: 'QSO保存 (Enter)', emptyLog: 'QSOなし', exportLog: 'エクスポート', exportAdif: 'ADIF', exportCabrillo: 'Cabrillo', trainingHistory: 'トレーニング履歴', contestExchange: 'コンテスト交換', sendExchange: '交換', sendTuAndSave: 'TU+保存', abort: '中止', restore: '復元', noTrainingResults: '保存されたローカル結果はありません', messages: 'メッセージ', invalidMaster: 'MASTER.DTA が無効です', pwaOfflineReady: 'オフラインモードの準備ができました', pwaUpdateReady: '新しいバージョンがあります', pwaReload: '再読み込み', pwaLater: '後で', pwaClose: '閉じる', time: '時間', rate: 'レート', sendCq: 'CQ', sendNr: 'NR', sendTu: 'TU', sendMyCall: '自分のコール', sendHisCall: '相手のコール', agn: 'AGN', keyboardHint: 'Enter：スマート送信/保存 · Space：次フィールド · Esc：中止 · F1-F9：メッセージ', idle: '待機中',
  }},
} as const;

void i18n.use(LanguageDetector).use(initReactI18next).init({
  resources,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;




