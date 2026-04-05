export default function HybridSlider({ alpha, beta, onChange }) {
  return (
    <div id="hybrid-slider" className="rounded-2xl p-6 border border-[#2d3a5e] bg-slate-900/40 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-slate-100 font-bold text-sm flex items-center gap-2">
          <span className="text-indigo-400 text-lg">⚖️</span> Hybrid Weight Control
        </h3>
        <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">α + β = 1.0</span>
      </div>

      <div className="space-y-4">
        {/* Alpha (Content) */}
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-indigo-300 font-semibold uppercase tracking-tight">🎭 Genres Similarity (α)</span>
            <span className="text-white font-mono bg-indigo-500/20 px-2 rounded">{alpha.toFixed(1)}</span>
          </div>
          <input
            id="alpha-slider"
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={alpha}
            onChange={(e) => {
              const a = parseFloat(e.target.value)
              onChange(a, parseFloat((1 - a).toFixed(1)))
            }}
            className="w-full h-2 appearance-none bg-cinema-black rounded-full cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                       [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-lg"
            style={{
              background: `linear-gradient(to right, #6366f1 ${alpha * 100}%, #1e293b ${alpha * 100}%)`
            }}
          />
        </div>

        {/* Beta (Collaborative) */}
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-emerald-300 font-semibold uppercase tracking-tight">👥 Member Ratings (β)</span>
            <span className="text-white font-mono bg-emerald-500/20 px-2 rounded">{beta.toFixed(1)}</span>
          </div>
          <div
            className="w-full h-2 rounded-full"
            style={{
              background: `linear-gradient(to right, #10b981 ${beta * 100}%, #1e293b ${beta * 100}%)`
            }}
          />
        </div>

        {/* Visual fusion bar */}
        <div className="h-3 rounded-full overflow-hidden flex">
          <div
            className="bg-blue-500 transition-all duration-300"
            style={{ width: `${alpha * 100}%` }}
          />
          <div
            className="bg-emerald-500 transition-all duration-300"
            style={{ width: `${beta * 100}%` }}
          />
        </div>

        <p className="text-slate-500 text-[11px] leading-relaxed italic border-t border-slate-800/50 pt-4">
          {alpha === 1.0
            ? '🔵 Pure Content Mode — using only genre and theme similarity'
            : beta === 1.0
            ? '🟢 Pure Collaborative — using only data-driven user behaviour'
            : `🔀 Hybrid Mode: ${(alpha * 100).toFixed(0)}% genre matching + ${(beta * 100).toFixed(0)}% community ratings`}
        </p>
      </div>
    </div>
  )
}
