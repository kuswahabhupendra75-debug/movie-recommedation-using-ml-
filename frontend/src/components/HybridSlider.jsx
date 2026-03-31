export default function HybridSlider({ alpha, beta, onChange }) {
  return (
    <div id="hybrid-slider" className="bg-cinema-card border border-cinema-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-cinema-text font-semibold text-sm">⚖️ Hybrid Weight Control</h3>
        <span className="text-cinema-muted text-xs">α + β = 1.0</span>
      </div>

      <div className="space-y-4">
        {/* Alpha (Content) */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-blue-400 font-medium">🎭 Content-Based (α)</span>
            <span className="text-cinema-text font-mono">{alpha.toFixed(1)}</span>
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
              background: `linear-gradient(to right, #60a5fa ${alpha * 100}%, #1e1e2e ${alpha * 100}%)`
            }}
          />
        </div>

        {/* Beta (Collaborative) */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-emerald-400 font-medium">👥 Collaborative (β)</span>
            <span className="text-cinema-text font-mono">{beta.toFixed(1)}</span>
          </div>
          <div
            className="w-full h-2 rounded-full"
            style={{
              background: `linear-gradient(to right, #34d399 ${beta * 100}%, #1e1e2e ${beta * 100}%)`
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

        <p className="text-cinema-muted text-xs">
          {alpha === 1.0
            ? '🔵 Pure Content-Based — using only genre similarity'
            : beta === 1.0
            ? '🟢 Pure Collaborative — using only user behaviour'
            : `🔀 Hybrid: ${(alpha * 100).toFixed(0)}% genre similarity + ${(beta * 100).toFixed(0)}% user behaviour`}
        </p>
      </div>
    </div>
  )
}
