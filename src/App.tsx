import { FormEvent, useMemo, useState } from 'react';
import {
  Activity, ArrowLeft, ArrowUpRight, Bell, Bot, Check, ChevronRight, CircleHelp, Clock3,
  Droplets, Heart, LayoutDashboard, Menu, MoreHorizontal, Send, Settings, SlidersHorizontal,
  Sparkles, Watch, X, Zap,
} from 'lucide-react';

type View = 'lookup' | 'dashboard' | 'empty';
type Range = '1h' | '1d' | '1m';
type Message = { from: 'ai' | 'user'; text: string };

type HealthRecord = {
  id: number;
  hardwareId: string;
  cadence?: number | null;
  spo2?: number | null;
  instantHeartbeat?: number | null;
  totalSteps?: number | null;
  recordedAt: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const ranges: Range[] = ['1h', '1d', '1m'];

function App() {
  const [view, setView] = useState<View>('lookup');
  const [hardwareId, setHardwareId] = useState('');
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [range, setRange] = useState<Range>('1h');
  const [tableView, setTableView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

  const findDevice = async (event?: FormEvent) => {
    event?.preventDefault();
    const requestedId = hardwareId.trim();
    if (!requestedId) return;
    setLoading(true);
    setLookupError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/health-records?hardwareId=${encodeURIComponent(requestedId)}`);
      if (!response.ok) throw new Error(`Health records request failed with status ${response.status}`);
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error('The health records response was not a list.');
      const nextRecords = data as HealthRecord[];
      setRecords(nextRecords);
      setView(nextRecords.length > 0 ? 'dashboard' : 'empty');
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : 'Unable to connect to the health service.');
      setView('lookup');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'lookup' || view === 'empty') return <LookupScreen hardwareId={hardwareId} setHardwareId={setHardwareId} onSubmit={findDevice} loading={loading} error={lookupError} empty={view === 'empty'} />;
  return <Dashboard records={records} range={range} setRange={setRange} tableView={tableView} setTableView={setTableView} hardwareId={hardwareId.trim()} onReset={() => setView('lookup')} mobileNav={mobileNav} setMobileNav={setMobileNav} />;
}

function LookupScreen({ hardwareId, setHardwareId, onSubmit, loading, error, empty }: { hardwareId: string; setHardwareId: (value: string) => void; onSubmit: (event: FormEvent) => void; loading: boolean; error: string; empty: boolean }) {
  return <div className="app-shell landing-shell"><div className="ambient ambient-one" /><div className="ambient ambient-two" /><header className="landing-header"><Brand /><div className="landing-header-note"><span className="live-dot" /> Connected health insights</div></header><main className="lookup-main"><div className="lookup-copy"><div className="eyebrow"><span className="eyebrow-mark"><Activity size={15} /></span> Your health, in one clear view</div><h1>Feel more in tune<br />with <em>yourself.</em></h1><p>Connect your PulseLink device to see thoughtful insights from your everyday health data.</p><form className="device-form" onSubmit={onSubmit}><label htmlFor="hardware-id">Enter your hardware ID</label><div className="input-wrap"><Watch size={19} /><input id="hardware-id" value={hardwareId} onChange={(event) => setHardwareId(event.target.value)} placeholder="e.g. ESP-0427" /><button type="submit" disabled={loading}>{loading ? <span className="button-spinner" /> : <ArrowUpRight size={20} />}</button></div><small>Usually found on the back of your PulseLink device</small></form>{empty && <div className="lookup-error"><CircleHelp size={18} /><span>We couldn't find records for <strong>{hardwareId}</strong>. Check the ID and try again.</span></div>}{error && <div className="lookup-error"><CircleHelp size={18} /><span>{error} Make sure your Spring Boot service is running.</span></div>}</div><div className="lookup-art" aria-label="Illustration of a connected health device"><div className="sun-shape" /><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="heart-bubble"><Heart size={27} fill="currentColor" /></div><div className="device-illustration"><div className="device-screen"><span>••</span><small>READY</small><svg viewBox="0 0 100 35"><polyline points="0,22 18,20 28,26 43,8 55,19 67,15 78,21 100,4" /></svg></div><div className="device-button" /></div><div className="float-pill pill-one"><Droplets size={17} /><span><b>SpO2</b> from your device</span></div><div className="float-pill pill-two"><Watch size={17} /><span><b>Live data</b> connected</span></div></div></main><footer className="landing-footer"><span>PulseLink care platform</span><span>Connected to your Spring Boot health service</span></footer></div>;
}

function Brand() { return <div className="brand"><div className="brand-icon"><Heart size={21} fill="currentColor" /></div><span>Pulse<span>Link</span></span></div>; }

function Dashboard({ records, range, setRange, tableView, setTableView, hardwareId, onReset, mobileNav, setMobileNav }: { records: HealthRecord[]; range: Range; setRange: (value: Range) => void; tableView: boolean; setTableView: (value: boolean) => void; hardwareId: string; onReset: () => void; mobileNav: boolean; setMobileNav: (value: boolean) => void }) {
  const filteredRecords = useMemo(() => filterRecords(records, range), [records, range]);
  const latest = filteredRecords[0] ?? records[0];
  const heart = latest?.instantHeartbeat;
  const oxygen = latest?.spo2;
  const steps = latest?.totalSteps;
  const cadence = latest?.cadence;
  const lastSynced = latest ? formatDate(latest.recordedAt) : 'No timestamp';
  return <div className="app-shell dashboard-shell"><header className="topbar"><Brand /><nav className={mobileNav ? 'nav open' : 'nav'}><button className="nav-item active"><LayoutDashboard size={17} /> Overview</button><button className="nav-item"><Activity size={17} /> Reports</button><button className="nav-item"><Watch size={17} /> Devices</button><button className="nav-item"><Settings size={17} /> Settings</button></nav><div className="topbar-actions"><div className="device-status"><span className="status-pulse" /> {hardwareId} <b>Connected</b></div><button className="icon-btn"><Bell size={19} /><i /></button><div className="profile"><div className="avatar">SL</div><span><b>Health profile</b><small>Online</small></span></div></div><button className="menu-btn" onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X /> : <Menu />}</button></header><main className="dashboard-main"><div className="dashboard-heading"><div><div className="eyebrow muted"><span className="eyebrow-mark"><Sparkles size={14} /></span> Device {hardwareId}</div><h1>Here is your<br /><em>health today.</em></h1></div><div className="heading-actions"><div className="range-switcher">{ranges.map((item) => <button key={item} className={range === item ? 'selected' : ''} onClick={() => setRange(item)}>{item}</button>)}</div><div className="view-switcher"><button className={!tableView ? 'selected' : ''} onClick={() => setTableView(false)}><Activity size={16} /> Graph</button><button className={tableView ? 'selected' : ''} onClick={() => setTableView(true)}><MoreHorizontal size={16} /> Table</button></div><button className="ai-button" onClick={() => setTableView(false)}><Bot size={19} /> Talk to your AI <ArrowUpRight size={17} /></button></div></div><div className="summary-strip"><span className="summary-check"><Check size={15} /></span><span>{filteredRecords.length} reading{filteredRecords.length === 1 ? '' : 's'} in this range.</span><span className="summary-divider" /><span className="summary-detail">Last synced {lastSynced}</span><button><SlidersHorizontal size={16} /> Filters</button></div>{tableView ? <RecordsTable records={filteredRecords} hardwareId={hardwareId} /> : <div className="metric-grid"><MetricCard title="Heart rate" value={formatNumber(heart)} unit="bpm" subtitle={heart === null || heart === undefined ? 'No reading' : 'Latest reading'} note="instantHeartbeat" icon={<Heart size={20} fill="currentColor" />} color="coral" records={filteredRecords} field="instantHeartbeat" /><MetricCard title="SpO2 oxygen" value={formatNumber(oxygen)} unit="%" subtitle={oxygen === null || oxygen === undefined ? 'No reading' : 'Latest reading'} note="spo2" icon={<Droplets size={20} fill="currentColor" />} color="apricot" records={filteredRecords} field="spo2" /><MetricCard title="Cadence" value={formatNumber(cadence)} unit="rpm" subtitle={cadence === null || cadence === undefined ? 'No reading' : 'Latest reading'} note="cadence" icon={<Activity size={20} />} color="lavender" records={filteredRecords} field="cadence" /><MetricCard title="Total steps" value={formatNumber(steps)} unit="steps" subtitle={steps === null || steps === undefined ? 'No reading' : 'Latest total'} note="totalSteps" icon={<Watch size={20} />} color="steps" records={filteredRecords} field="totalSteps" /></div>}<div className="bottom-note"><div className="note-icon"><Zap size={16} /></div><span><strong>Data comes directly from your device.</strong> Ask the AI about these readings for a clearer explanation.</span><ChevronRight size={18} /></div><div className="dashboard-footer-actions"><button onClick={() => setTableView(true)}>View all records <ArrowUpRight size={15} /></button><button onClick={onReset}>Check another device <ArrowLeft size={15} /></button></div></main><ChatButton hardwareId={hardwareId} records={filteredRecords} /></div>;
}

function ChatButton({ hardwareId, records }: { hardwareId: string; records: HealthRecord[] }) { const [open, setOpen] = useState(false); return open ? <ChatScreen onBack={() => setOpen(false)} hardwareId={hardwareId} records={records} /> : <button className="floating-ai" onClick={() => setOpen(true)}><Bot size={19} /> Talk to your AI</button>; }

function MetricCard({ title, value, unit, subtitle, note, icon, color, records, field }: { title: string; value: string; unit: string; subtitle: string; note: string; icon: React.ReactNode; color: string; records: HealthRecord[]; field: 'instantHeartbeat' | 'spo2' | 'cadence' | 'totalSteps' }) {
  const points = makeChartPoints(records, field);
  return <article className={`metric-card ${color}`}><div className="card-top"><div className="metric-label"><span className="metric-icon">{icon}</span><span>{title}</span></div><button className="card-menu"><MoreHorizontal size={18} /></button></div><div className="line-chart"><svg viewBox="0 0 330 105" preserveAspectRatio="none"><defs><linearGradient id={`${color}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".28" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs><polygon points={`${points} 330,105 0,105`} fill={`url(#${color}-fill)`} /><polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg><div className="chart-labels"><span>{records.length} readings</span><span>{records.length ? formatShortDate(records[records.length - 1].recordedAt) : 'No data'}</span></div></div><div className="metric-value"><strong>{value}</strong><span>{unit}</span></div><div className="metric-footer"><span>{subtitle}</span><small>{note}</small></div></article>;
}

function RecordsTable({ records, hardwareId }: { records: HealthRecord[]; hardwareId: string }) { return <div className="records-table-wrap"><div className="table-header"><div><h2>All readings</h2><p>Latest health data from {hardwareId}</p></div></div><div className="table-scroll"><table><thead><tr><th>Date & time</th><th><Heart size={14} /> Heart rate</th><th><Droplets size={14} /> SpO2</th><th><Activity size={14} /> Cadence</th><th><Watch size={14} /> Total steps</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><Clock3 size={15} />{formatDate(record.recordedAt)}</td><td><strong>{formatNumber(record.instantHeartbeat)}</strong> bpm</td><td><strong>{formatNumber(record.spo2)}</strong>%</td><td><strong>{formatNumber(record.cadence)}</strong> rpm</td><td><strong>{formatNumber(record.totalSteps)}</strong></td></tr>)}</tbody></table>{records.length === 0 && <div className="table-empty">No readings were recorded in this time range.</div>}</div></div>; }

function ChatScreen({ onBack, hardwareId, records }: { onBack: () => void; hardwareId: string; records: HealthRecord[] }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ from: 'ai', text: 'Hi, I can explain the health readings from your connected device. Ask me about a trend, a metric, or what a reading means.' }]);
  const suggestions = ['How is my heart rate?', 'Explain my oxygen reading', 'What does my cadence mean?'];
  const sendMessage = async (text: string) => { const question = text.trim(); if (!question || sending) return; setMessages((current) => [...current, { from: 'user', text: question }]); setMessage(''); setSending(true); try { const response = await fetch(`${API_BASE_URL}/api/health-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId: `pulselink-${hardwareId}`, hardwareId, question }) }); if (!response.ok) throw new Error(`Chat request failed with status ${response.status}`); const answer = await response.text(); setMessages((current) => [...current, { from: 'ai', text: answer || 'The AI returned an empty response.' }]); } catch (error) { setMessages((current) => [...current, { from: 'ai', text: error instanceof Error ? `I couldn't reach the health assistant. ${error.message}` : 'I could not reach the health assistant.' }]); } finally { setSending(false); } };
  return <div className="chat-overlay"><div className="chat-panel"><div className="chat-panel-head"><div><strong>PulseLink AI</strong><span><i /> Uses {records.length} current device readings</span></div><button onClick={onBack}><X size={19} /></button></div><div className="messages">{messages.map((item, index) => <div className={`message-row ${item.from}`} key={`${item.text}-${index}`}>{item.from === 'ai' && <div className="message-avatar"><Bot size={16} /></div>}<div className="message-bubble">{item.text}</div>{item.from === 'user' && <div className="message-avatar user-avatar">You</div>}</div>)}{messages.length === 1 && <div className="suggestions">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => sendMessage(suggestion)}>{suggestion}<ArrowUpRight size={15} /></button>)}</div>}{sending && <div className="typing-indicator">PulseLink AI is thinking...</div>}</div><form className="chat-input" onSubmit={(event) => { event.preventDefault(); void sendMessage(message); }}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask about your health data..." /><button type="submit" disabled={sending}><Send size={18} /></button></form><div className="chat-disclaimer"><CircleHelp size={15} /> Wellness insights only, not a medical diagnosis.</div></div></div>;
}

function filterRecords(records: HealthRecord[], range: Range) { const now = Date.now(); const duration = range === '1h' ? 60 * 60 * 1000 : range === '1d' ? 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000; return records.filter((record) => { const time = Date.parse(record.recordedAt); return Number.isNaN(time) || now - time <= duration; }).sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt)); }
function formatNumber(value: number | null | undefined) { return value === null || value === undefined || Number.isNaN(value) ? '—' : Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1); }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }
function formatShortDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Timestamp unavailable' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function makeChartPoints(records: HealthRecord[], field: keyof HealthRecord) { const values = records.map((record) => Number(record[field])).filter((value) => Number.isFinite(value)); if (!values.length) return '0,75 55,75 110,75 165,75 220,75 275,75 330,75'; const min = Math.min(...values); const max = Math.max(...values); return values.slice().reverse().map((value, index) => { const x = values.length === 1 ? 165 : (index / (values.length - 1)) * 330; const y = max === min ? 52 : 88 - ((value - min) / (max - min)) * 68; return `${x},${y}`; }).join(' '); }

export default App;
