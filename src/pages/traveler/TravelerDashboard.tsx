import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, ArrowRightLeft, Clock, Search, TrendingUp } from 'lucide-react';
import { useApix } from '../../context/ApixContext';
import { INDIAN_AIRPORTS } from '../../data/mockData';
import {
  aggregateAirlineComparison,
  aggregateTrendSeries,
  calculatePriceIndex,
  classifyFarePeriod,
  computeFareStats,
  formatINR,
} from '../../utils/apixAnalytics';
import { FareBandTag, KpiCard } from '../../components/ui/CommonUI';

export function TravelerDashboard() {
  const {
    currentUser,
    routes,
    airlines,
    fareRecords,
    recentSearches,
    thresholds,
    navigateToSearch,
    navigateToCompare,
    setSelectedAnalyticsRouteId,
    setActivePage,
  } = useApix();

  const [sourceCode, setSourceCode] = useState(currentUser?.homeAirport || 'DEL');
  const [destinationCode, setDestinationCode] = useState(
    currentUser?.homeAirport === 'BOM' ? 'DEL' : 'BOM'
  );
  const [travelDate, setTravelDate] = useState('2026-11-24');
  const [chartRouteId, setChartRouteId] = useState(routes[0]?.id ?? 'rt-del-bom');

  const selectedRoute = routes.find((r) => r.id === chartRouteId) ?? routes[0];

  const stats2026 = useMemo(() => {
    const records2026 = fareRecords.filter((f) => f.date.startsWith('2026'));
    const stats = computeFareStats(records2026.map((f) => f.fare));
    const avgBaseline =
      routes.length > 0
        ? routes.reduce((acc, r) => acc + r.baselineFare, 0) / routes.length
        : 5000;
    const overallIndex = calculatePriceIndex(stats.avg, avgBaseline);
    return {
      ...stats,
      overallIndex,
      overallBand: classifyFarePeriod(overallIndex, thresholds),
    };
  }, [fareRecords, routes, thresholds]);

  const trendSeries = useMemo(
    () => aggregateTrendSeries(fareRecords, selectedRoute, 'monthly', thresholds, '2026'),
    [fareRecords, selectedRoute, thresholds]
  );

  const airlineOverview = useMemo(
    () => aggregateAirlineComparison(fareRecords, airlines, selectedRoute, [], thresholds),
    [fareRecords, airlines, selectedRoute, thresholds]
  );

  const popularRouteRows = useMemo(() => {
    return routes.slice(0, 6).map((route) => {
      const routeFares = fareRecords
        .filter((f) => f.routeId === route.id && f.date.startsWith('2026'))
        .map((f) => f.fare);
      const stats = computeFareStats(routeFares);
      const priceIndex = calculatePriceIndex(stats.avg, route.baselineFare);
      return {
        route,
        avgFare: stats.avg,
        minFare: stats.min,
        priceIndex,
        band: classifyFarePeriod(priceIndex, thresholds),
      };
    });
  }, [routes, fareRecords, thresholds]);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceCode === destinationCode) return;
    navigateToSearch({
      sourceCode,
      destinationCode,
      travelDate,
      passengers: 1,
    });
  };

  const handleSwap = () => {
    setSourceCode(destinationCode);
    setDestinationCode(sourceCode);
  };

  const trackedCount = currentUser?.trackedRouteIds.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Welcome + Quick Search Panel */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {currentUser?.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitor Indian domestic fare benchmarks, compare airlines, and spot low-index booking windows.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (selectedRoute) setSelectedAnalyticsRouteId(selectedRoute.id);
              setActivePage('analytics');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0"
          >
            <span>Explore Full Price Analytics</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleQuickSearch}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end pt-4 border-t border-slate-100"
        >
          <div className="lg:col-span-4">
            <label htmlFor="qs-source" className="block text-xs font-semibold text-slate-600 mb-1">
              From Airport
            </label>
            <select
              id="qs-source"
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
            >
              {INDIAN_AIRPORTS.map((ap) => (
                <option key={ap.code} value={ap.code}>
                  {ap.code} — {ap.city}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap source and destination airports"
              className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="qs-dest" className="block text-xs font-semibold text-slate-600 mb-1">
              To Airport
            </label>
            <select
              id="qs-dest"
              value={destinationCode}
              onChange={(e) => setDestinationCode(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
            >
              {INDIAN_AIRPORTS.map((ap) => (
                <option key={ap.code} value={ap.code}>
                  {ap.code} — {ap.city}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="qs-date" className="block text-xs font-semibold text-slate-600 mb-1">
              Travel Date
            </label>
            <input
              id="qs-date"
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={sourceCode === destinationCode}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span>Search Flights</span>
            </button>
          </div>
        </form>
      </section>

      {/* 4 Summary KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Average Domestic Fare (2026)"
          value={formatINR(stats2026.avg)}
          subtext={`Across ${stats2026.count} simulated fare points`}
        />
        <KpiCard
          label="Lowest Recorded Fare"
          value={formatINR(stats2026.min)}
          subtext="Best off-peak domestic economy rate"
          accent="emerald"
        />
        <KpiCard
          label="Composite Airfare Price Index"
          value={`${stats2026.overallIndex}`}
          subtext={`Base 100 · Classification: ${stats2026.overallBand}`}
          accent="blue"
        />
        <KpiCard
          label="Tracked Routes"
          value={`${trackedCount}`}
          subtext={`${routes.length} active Indian corridors monitored`}
          accent="indigo"
        />
      </section>

      {/* Charts Row: Airfare Trend + Airline Comparison Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Airfare Trend — {selectedRoute?.sourceCode} → {selectedRoute?.destinationCode}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly average economy fare (INR) in 2026 · Baseline {formatINR(selectedRoute?.baselineFare ?? 5000)}
              </p>
            </div>
            <select
              aria-label="Select route for trend chart"
              value={chartRouteId}
              onChange={(e) => setChartRouteId(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.sourceCode} → {r.destinationCode} ({r.sourceCity} - {r.destinationCity})
                </option>
              ))}
            </select>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="apixTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
                  width={54}
                />
                <Tooltip
                  formatter={(value) => [formatINR(Number(value ?? 0)), 'Average Fare']}
                  contentStyle={{
                    borderRadius: '10px',
                    borderColor: '#E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avgFare"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fill="url(#apixTrendFill)"
                  activeDot={{ r: 5, fill: '#1D4ED8' }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Airline Comparison Overview
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Average fare by carrier on {selectedRoute?.sourceCode} → {selectedRoute?.destinationCode}
              </p>
            </div>
            <button
              type="button"
              onClick={() => selectedRoute && navigateToCompare(selectedRoute.id)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
            >
              Compare All
            </button>
          </div>

          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={airlineOverview}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="airlineName"
                  tick={{ fontSize: 12, fill: '#334155', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  width={118}
                />
                <Tooltip
                  formatter={(value) => [formatINR(Number(value ?? 0)), 'Average Fare']}
                  contentStyle={{
                    borderRadius: '10px',
                    borderColor: '#E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="avgFare" radius={[0, 6, 6, 0]} barSize={22} isAnimationActive={false}>
                  {airlineOverview.map((row) => (
                    <Cell key={row.airlineId} fill={row.brandColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Bottom Row: Popular Routes Table + Recent Searches */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Popular Domestic Routes</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                2026 simulated average fare and current APIX band
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('search')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Search All Routes
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-6">Corridor</th>
                  <th className="py-3 px-4 text-right">Lowest</th>
                  <th className="py-3 px-4 text-right">Average</th>
                  <th className="py-3 px-4 text-right">Index</th>
                  <th className="py-3 px-4">Band</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {popularRouteRows.map(({ route, avgFare, minFare, priceIndex, band }) => (
                  <tr key={route.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6">
                      <p className="font-semibold text-slate-900 font-mono text-xs sm:text-sm">
                        {route.sourceCode} → {route.destinationCode}
                      </p>
                      <p className="text-xs text-slate-500">
                        {route.sourceCity} to {route.destinationCity}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                      {formatINR(minFare)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900 font-semibold">
                      {formatINR(avgFare)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {priceIndex}
                    </td>
                    <td className="py-3.5 px-4">
                      <FareBandTag band={band} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => navigateToCompare(route.id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
                      >
                        Compare
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Searches</h2>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          {recentSearches.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm font-medium text-slate-700">No recent searches yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Use the quick search above to explore flights.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 flex-1">
              {recentSearches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    navigateToSearch({
                      sourceCode: item.sourceCode,
                      destinationCode: item.destinationCode,
                      travelDate: item.travelDate,
                      passengers: item.passengers,
                    })
                  }
                  className="w-full text-left p-3.5 rounded-lg border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/30 transition-colors flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 font-mono">
                      {item.sourceCode} → {item.destinationCode}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.travelDate} · {item.passengers}{' '}
                      {item.passengers === 1 ? 'Passenger' : 'Passengers'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block">
                      {item.timestamp}
                    </span>
                    <span className="text-xs font-semibold text-blue-600 inline-flex items-center gap-0.5 mt-0.5">
                      Run <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Base Index = 100
            </span>
            <button
              type="button"
              onClick={() => setActivePage('reports')}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Download Report
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
