export default function StocksLoading() {
  return (
    <div className="min-h-screen bg-transparent -mx-4 sm:-mx-6 lg:-mx-8 -mt-10 animate-pulse">
      {/* Ticker bar skeleton */}
      <div className="h-9 bg-gray-900/80 border-b border-gray-700/50" />

      <div className="flex">
        {/* Left sidebar skeleton */}
        <aside className="hidden xl:block w-52 shrink-0 border-r border-gray-700/30 p-3 space-y-3">
          <div className="h-3 bg-gray-700 rounded w-20 mb-3" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-800 rounded" />
          ))}
        </aside>

        {/* Main content skeleton */}
        <main className="flex-1 min-w-0 p-4 space-y-4">
          {/* Search bar */}
          <div className="h-10 bg-gray-800/80 rounded-lg" />

          {/* Quick picks */}
          <div className="flex gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 w-20 bg-gray-800 rounded-full" />
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-700 rounded-full" />
            <div className="space-y-1.5">
              <div className="h-5 bg-gray-700 rounded w-48" />
              <div className="h-3 bg-gray-700 rounded w-32" />
            </div>
          </div>

          {/* Chart + sidebar */}
          <div className="flex gap-4">
            <div className="flex-1 h-[470px] bg-gray-800/30 border border-gray-700/50 rounded-xl" />
            <div className="hidden lg:block w-72 h-[470px] bg-gray-800/30 border border-gray-700/50 rounded-xl" />
          </div>

          {/* Bottom cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-800/30 border border-gray-700/50 rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
