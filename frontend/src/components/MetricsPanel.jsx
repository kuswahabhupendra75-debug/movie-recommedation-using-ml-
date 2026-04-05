import { motion } from 'framer-motion'

function Stat({ label, value, sub }) {
  return (
    <div className="flex flex-col items-center text-center p-3 bg-slate-900/60 rounded-xl border border-slate-800/50 shadow-sm transition-transform hover:scale-[1.02]">
      <span className="text-xl font-black font-display text-indigo-400">{value}</span>
      <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-1">{label}</span>
      {sub && <span className="text-slate-500 text-[9px] mt-0.5">{sub}</span>}
    </div>
  )
}

export default function MetricsPanel({ metrics }) {
  if (!metrics) return null

  return (
    <motion.div
      id="metrics-panel"
      className="rounded-2xl p-6 border border-slate-700/50 bg-slate-800/30 backdrop-blur-md shadow-2xl h-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl shadow-inner">
          📊
        </div>
        <div>
          <h2 className="text-slate-100 font-bold text-base leading-none">System Metrics</h2>
          <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-wider">{metrics.dataset}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <Stat
          label="RMSE Score"
          value={metrics.rmse}
          sub="lower is better"
        />
        <Stat
          label="Accuracy"
          value={`${metrics.accuracy_pct}%`}
          sub="on test set"
        />
        <Stat
          label="Avg Rating"
          value={metrics.avg_rating}
          sub="out of 5.0"
        />
        <Stat
          label="Total Ratings"
          value={metrics.total_ratings?.toLocaleString()}
          sub="in dataset"
        />
        <Stat
          label="Users"
          value={metrics.unique_users?.toLocaleString()}
        />
        <Stat
          label="Movies"
          value={metrics.unique_movies?.toLocaleString()}
        />
      </div>

      {/* Algorithm explainer */}
      <div className="mt-4 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
        <p className="text-slate-500 text-[10px] leading-relaxed">
          <span className="text-indigo-400 font-bold uppercase tracking-tighter">Hybrid Formula: </span>
          <code className="text-slate-300 font-mono text-[11px]">
            (α × Content) + (β × Collaborative)
          </code>
          <br />
          <span className="text-slate-600 italic">
            Cold Start: when a user is new, we prioritize content-based matching.
          </span>
        </p>
      </div>
    </motion.div>
  )
}
