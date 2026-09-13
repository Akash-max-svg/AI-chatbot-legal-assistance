import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target, Zap, FileSearch, Globe, Mic, Brain, Shield,
  TrendingUp, TrendingDown, Activity, BarChart3, ArrowLeft,
  ChevronUp, ChevronDown, Cpu,
} from 'lucide-react';

/* ─── Static metric data ────────────────────────────────────────────── */

interface Metric {
  id: string;
  label: string;
  icon: React.ElementType;
  value: number;
  unit: string;
  trend: number;
  trendLabel: string;
  color: string;
  ring: string;
  bg: string;
  category: 'accuracy' | 'performance' | 'ai';
  description: string;
}

const metrics: Metric[] = [
  {
    id: 'accuracy',
    label: 'Accuracy',
    icon: Target,
    value: 94.2,
    unit: '%',
    trend: 2.1,
    trendLabel: 'vs last month',
    color: 'text-emerald-400',
    ring: 'stroke-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    category: 'accuracy',
    description: 'Overall correctness of AI legal responses against ground-truth annotations.',
  },
  {
    id: 'precision',
    label: 'Precision',
    icon: Target,
    value: 91.8,
    unit: '%',
    trend: 1.4,
    trendLabel: 'vs last month',
    color: 'text-blue-400',
    ring: 'stroke-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    category: 'accuracy',
    description: 'Ratio of true positive legal classifications to all positive predictions.',
  },
  {
    id: 'recall',
    label: 'Recall',
    icon: Brain,
    value: 89.5,
    unit: '%',
    trend: 0.7,
    trendLabel: 'vs last month',
    color: 'text-violet-400',
    ring: 'stroke-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    category: 'accuracy',
    description: 'Proportion of relevant legal cases correctly identified by the model.',
  },
  {
    id: 'f1',
    label: 'F1 Score',
    icon: Activity,
    value: 90.6,
    unit: '%',
    trend: 1.1,
    trendLabel: 'vs last month',
    color: 'text-cyan-400',
    ring: 'stroke-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    category: 'accuracy',
    description: 'Harmonic mean of precision and recall — balanced classification performance.',
  },
  {
    id: 'response_time',
    label: 'Response Time',
    icon: Zap,
    value: 1.8,
    unit: 's',
    trend: -0.3,
    trendLabel: 'improvement',
    color: 'text-amber-400',
    ring: 'stroke-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    category: 'performance',
    description: 'Average end-to-end latency from user query submission to full response delivery.',
  },
  {
    id: 'citation',
    label: 'Citation Accuracy',
    icon: FileSearch,
    value: 96.1,
    unit: '%',
    trend: 3.2,
    trendLabel: 'vs last month',
    color: 'text-gold-400',
    ring: 'stroke-gold-400',
    bg: 'bg-gold-500/10 border-gold-500/20',
    category: 'ai',
    description: 'Accuracy of legal act, section, and case law citations in AI-generated responses.',
  },
  {
    id: 'retrieval',
    label: 'Knowledge Retrieval',
    icon: Brain,
    value: 88.3,
    unit: '%',
    trend: 2.8,
    trendLabel: 'vs last month',
    color: 'text-teal-400',
    ring: 'stroke-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    category: 'ai',
    description: 'Relevance score of retrieved Knowledge Base documents relative to the user query.',
  },
  {
    id: 'semantic',
    label: 'Semantic Search',
    icon: FileSearch,
    value: 92.4,
    unit: '%',
    trend: 1.9,
    trendLabel: 'vs last month',
    color: 'text-indigo-400',
    ring: 'stroke-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    category: 'ai',
    description: 'Top-5 retrieval accuracy for semantic search over legal document embeddings.',
  },
  {
    id: 'translation',
    label: 'Translation Accuracy',
    icon: Globe,
    value: 93.7,
    unit: '%',
    trend: 0.5,
    trendLabel: 'vs last month',
    color: 'text-sky-400',
    ring: 'stroke-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
    category: 'performance',
    description: 'Quality score for legal content translated across Hindi, Tamil, Telugu, and 8 other regional languages.',
  },
  {
    id: 'voice',
    label: 'Voice Recognition',
    icon: Mic,
    value: 87.9,
    unit: '%',
    trend: 1.6,
    trendLabel: 'vs last month',
    color: 'text-orange-400',
    ring: 'stroke-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    category: 'performance',
    description: 'Word error rate (WER) complement for legal terminology in voice assistant queries.',
  },
  {
    id: 'hallucination',
    label: 'Hallucination Rate',
    icon: Shield,
    value: 3.4,
    unit: '%',
    trend: -1.2,
    trendLabel: 'improvement',
    color: 'text-red-400',
    ring: 'stroke-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    category: 'ai',
    description: 'Rate of factually incorrect or unsupported claims in AI legal responses — lower is better.',
  },
  {
    id: 'reliability',
    label: 'Legal Reliability',
    icon: Shield,
    value: 95.8,
    unit: '%',
    trend: 2.4,
    trendLabel: 'vs last month',
    color: 'text-green-400',
    ring: 'stroke-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    category: 'ai',
    description: 'Expert-validated reliability score measuring alignment with Indian statutory and case law.',
  },
];

const monthlyTrend = [
  { month: 'Mar', accuracy: 88.1, f1: 86.2, retrieval: 82.4 },
  { month: 'Apr', accuracy: 90.3, f1: 88.0, retrieval: 84.1 },
  { month: 'May', accuracy: 91.5, f1: 88.9, retrieval: 85.7 },
  { month: 'Jun', accuracy: 92.1, f1: 89.4, retrieval: 86.8 },
  { month: 'Jul', accuracy: 93.0, f1: 90.0, retrieval: 87.5 },
  { month: 'Aug', accuracy: 94.2, f1: 90.6, retrieval: 88.3 },
];

const categoryBreakdown = [
  { label: 'Criminal Law', value: 96.1, color: 'bg-red-500' },
  { label: 'Civil Law', value: 94.3, color: 'bg-blue-500' },
  { label: 'Constitutional', value: 93.8, color: 'bg-gold-500' },
  { label: 'Consumer Rights', value: 92.1, color: 'bg-emerald-500' },
  { label: 'Cyber Law', value: 90.5, color: 'bg-cyan-500' },
  { label: 'Labour Law', value: 91.7, color: 'bg-violet-500' },
  { label: 'Property Law', value: 89.9, color: 'bg-orange-500' },
  { label: 'Family Law', value: 93.2, color: 'bg-pink-500' },
];

/* ─── Circular Progress ─────────────────────────────────────────────── */

function CircularProgress({ value, max = 100, size = 88, stroke = 7, color }: {
  value: number; max?: number; size?: number; stroke?: number; color: string;
}) {
  const radius = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        className={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

/* ─── Animated counter ──────────────────────────────────────────────── */

function AnimatedValue({ target, unit }: { target: number; unit: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const steps = 50;
    const inc = target / steps;
    let cur = 0;
    const id = setInterval(() => {
      cur = Math.min(cur + inc, target);
      setVal(parseFloat(cur.toFixed(1)));
      if (cur >= target) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [target]);

  return <>{val}{unit}</>;
}

/* ─── Bar chart ─────────────────────────────────────────────────────── */

function BarChart() {
  const maxVal = Math.max(...categoryBreakdown.map((d) => d.value));
  return (
    <div className="space-y-3">
      {categoryBreakdown.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-28 flex-shrink-0 text-right">{d.label}</span>
          <div className="flex-1 h-5 bg-navy-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${d.color} transition-all duration-1000`}
              style={{ width: `${(d.value / maxVal) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-200 w-12 flex-shrink-0">{d.value}%</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Line Chart (SVG) ─────────────────────────────────────────────── */

function LineChart() {
  const W = 560;
  const H = 160;
  const pad = { t: 20, b: 32, l: 32, r: 16 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const minY = 80;
  const maxY = 100;

  const xScale = (i: number) => pad.l + (i / (monthlyTrend.length - 1)) * innerW;
  const yScale = (v: number) => pad.t + (1 - (v - minY) / (maxY - minY)) * innerH;

  const line = (key: 'accuracy' | 'f1' | 'retrieval') =>
    monthlyTrend.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d[key])}`).join(' ');

  const series = [
    { key: 'accuracy' as const, color: '#34d399', label: 'Accuracy' },
    { key: 'f1' as const, color: '#60a5fa', label: 'F1 Score' },
    { key: 'retrieval' as const, color: '#a78bfa', label: 'Retrieval' },
  ];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        {/* Grid lines */}
        {[80, 85, 90, 95, 100].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={yScale(v)} y2={yScale(v)}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={pad.l - 4} y={yScale(v) + 4} textAnchor="end" fontSize="9" fill="#6b7280">{v}</text>
          </g>
        ))}

        {/* X labels */}
        {monthlyTrend.map((d, i) => (
          <text key={d.month} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#6b7280">{d.month}</text>
        ))}

        {/* Lines */}
        {series.map((s) => (
          <path key={s.key} d={line(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* Dots */}
        {series.map((s) =>
          monthlyTrend.map((d, i) => (
            <circle key={`${s.key}-${i}`} cx={xScale(i)} cy={yScale(d[s.key])} r="3" fill={s.color} />
          ))
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2 justify-center">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full" style={{ background: s.color }} />
            <span className="text-xs text-gray-400">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────── */

export default function EvaluationMetricsPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'all' | 'accuracy' | 'performance' | 'ai'>('all');

  const filtered = activeCategory === 'all' ? metrics : metrics.filter((m) => m.category === activeCategory);

  const overallScore = (
    metrics.filter((m) => m.id !== 'hallucination').reduce((acc, m) => acc + m.value, 0) /
    metrics.filter((m) => m.id !== 'hallucination').length
  );

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-6xl mx-auto space-y-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-medium">
            <Activity size={12} />
            Evaluation Dashboard
          </div>
          <h1 className="section-heading text-3xl">Evaluation Metrics</h1>
          <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
            Real-time performance metrics for the AI Legal Assistant — accuracy, retrieval quality, response speed, and reliability across all legal domains.
          </p>
        </div>
        <button
          onClick={() => navigate('/architecture')}
          className="btn-secondary flex items-center gap-2 text-sm self-start"
        >
          <ArrowLeft size={15} />
          System Architecture
        </button>
      </div>

      {/* Overall score + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Overall score card */}
        <div className="lg:col-span-1 card bg-gradient-to-br from-navy-900 to-navy-800 flex flex-col items-center justify-center gap-3 py-8">
          <div className="relative flex items-center justify-center">
            <CircularProgress value={overallScore} size={110} stroke={8} color="stroke-gold-400" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gold-400">{overallScore.toFixed(1)}%</span>
              <span className="text-[10px] text-gray-500 mt-0.5">Overall</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-200">Platform Score</p>
            <p className="text-xs text-gray-500 mt-1">Composite across all metrics</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp size={12} />
            +1.8% this month
          </div>
        </div>

        {/* Quick stats */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Accuracy', value: '94.2%', icon: Target, color: 'bg-emerald-500/15 text-emerald-400', change: '+2.1%', up: true },
            { label: 'F1 Score', value: '90.6%', icon: Activity, color: 'bg-cyan-500/15 text-cyan-400', change: '+1.1%', up: true },
            { label: 'Response Time', value: '1.8s', icon: Zap, color: 'bg-amber-500/15 text-amber-400', change: '-0.3s', up: true },
            { label: 'Citation Accuracy', value: '96.1%', icon: FileSearch, color: 'bg-gold-500/15 text-gold-400', change: '+3.2%', up: true },
            { label: 'Hallucination Rate', value: '3.4%', icon: Shield, color: 'bg-red-500/15 text-red-400', change: '-1.2%', up: true },
            { label: 'Legal Reliability', value: '95.8%', icon: Cpu, color: 'bg-green-500/15 text-green-400', change: '+2.4%', up: true },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="card-gold py-4 px-4">
                <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
                  <Icon size={15} className="text-current" />
                </div>
                <p className="text-xl font-bold text-gray-100">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
                <div className={`flex items-center gap-0.5 text-xs mt-1 ${s.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.up ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  {s.change}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'accuracy', 'performance', 'ai'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
              activeCategory === cat
                ? 'bg-gold-500/20 border-gold-500/40 text-gold-400'
                : 'bg-navy-800/60 border-navy-700/50 text-gray-400 hover:text-gray-200 hover:border-navy-600'
            }`}
          >
            {cat === 'all' ? 'All Metrics' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((m) => {
          const Icon = m.icon;
          const isLower = m.id === 'hallucination';
          const trendUp = m.trend > 0;
          const trendGood = isLower ? !trendUp : trendUp;
          const displayMax = isLower ? 20 : 100;

          return (
            <div key={m.id} className={`card-gold border ${m.bg} group hover:-translate-y-1`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.bg}`}>
                    <Icon size={15} className={m.color} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-100">{m.label}</p>
                    <p className="text-[10px] text-gray-500 capitalize">{m.category}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${trendGood ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {trendGood ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {Math.abs(m.trend)}{m.unit === '%' ? '%' : m.unit}
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="relative flex items-center justify-center flex-shrink-0">
                  <CircularProgress value={m.value} max={displayMax} size={72} stroke={6} color={m.ring} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-sm font-bold ${m.color}`}>
                      <AnimatedValue target={m.value} unit={m.unit} />
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 leading-relaxed">{m.description}</p>
                  <p className="text-[10px] text-gray-600 mt-2">{m.trendLabel}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-1 bg-navy-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      m.id === 'hallucination' ? 'bg-red-400' :
                      m.value >= 93 ? 'bg-emerald-400' :
                      m.value >= 85 ? 'bg-amber-400' : 'bg-orange-400'
                    }`}
                    style={{ width: `${(m.value / displayMax) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-gray-600">0{m.unit}</span>
                  <span className="text-[9px] text-gray-600">{displayMax}{m.unit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Line chart */}
        <div className="card bg-gradient-to-br from-navy-900 to-navy-800">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-gold-500" />
            <h2 className="text-sm font-semibold text-gray-200">6-Month Trend</h2>
          </div>
          <LineChart />
        </div>

        {/* Bar chart */}
        <div className="card bg-gradient-to-br from-navy-900 to-navy-800">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-gold-500" />
            <h2 className="text-sm font-semibold text-gray-200">Accuracy by Legal Category</h2>
          </div>
          <BarChart />
        </div>
      </div>

      {/* Summary table */}
      <div className="card bg-gradient-to-br from-navy-900 to-navy-800 overflow-x-auto">
        <div className="flex items-center gap-2 mb-5">
          <Activity size={16} className="text-gold-500" />
          <h2 className="text-sm font-semibold text-gray-200">All Metrics Summary</h2>
        </div>
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-navy-700/50">
              <th className="text-left pb-3 font-medium">Metric</th>
              <th className="text-left pb-3 font-medium">Category</th>
              <th className="text-right pb-3 font-medium">Value</th>
              <th className="text-right pb-3 font-medium">Trend</th>
              <th className="text-right pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, i) => {
              const isLower = m.id === 'hallucination';
              const trendGood = isLower ? m.trend < 0 : m.trend > 0;
              const status = isLower
                ? m.value <= 5 ? 'Excellent' : m.value <= 10 ? 'Good' : 'Review'
                : m.value >= 93 ? 'Excellent' : m.value >= 85 ? 'Good' : 'Review';
              const statusColor = status === 'Excellent' ? 'text-emerald-400 bg-emerald-500/10' : status === 'Good' ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10';

              return (
                <tr key={m.id} className={`border-b border-navy-800/60 transition-colors hover:bg-navy-800/30 ${i % 2 === 0 ? '' : 'bg-navy-900/20'}`}>
                  <td className={`py-3 font-medium ${m.color}`}>{m.label}</td>
                  <td className="py-3 text-gray-500 capitalize text-xs">{m.category}</td>
                  <td className="py-3 text-right font-semibold text-gray-200">{m.value}{m.unit}</td>
                  <td className={`py-3 text-right text-xs font-medium ${trendGood ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span className="flex items-center justify-end gap-0.5">
                      {trendGood ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {m.trend > 0 ? '+' : ''}{m.trend}{m.unit}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
