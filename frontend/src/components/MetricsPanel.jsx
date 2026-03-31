import { motion } from 'framer-motion'

function Stat({ label, value, sub }) {
  return (
    <div className="flex flex-col items-center text-center p-4 bg-cinema-black/40 rounded-xl border border-cinema-border/50">
      <span className="text-2xl font-bold font-display text-gradient-gold">{value}</span>
      <span className="text-cinema-text text-sm font-medium mt-0.5">{label}</span>
      {sub && <span className="text-cinema-muted text-xs mt-0.5">{sub}</span>}
    </div>
  )
}

export default function MetricsPanel({ metrics }) {
  if (!metrics) return null

  return (
    <motion.div
      id="metrics-panel"
      className="card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">📊</span>
        <div>
          <h2 className="text-cinema-text font-semibold font-display text-lg">System Metrics</h2>
          <p className="text-cinema-muted text-xs">{metrics.dataset}</p>
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
      <div className="bg-cinema-black/30 rounded-xl p-4 border border-cinema-border/30">
        <p className="text-cinema-muted text-xs leading-relaxed">
          <span className="text-cinema-gold font-semibold">Hybrid Score Formula: </span>
          <code className="text-cinema-text font-mono">
            Score = (α × Content_Score) + (β × Collaborative_Score)
          </code>
          <br />
          <span className="text-cinema-muted">
            Cold Start: when a user has fewer than 5 ratings, α=1.0 (pure content-based filtering).
          </span>
        </p>
      </div>
    </motion.div>
  )
}
