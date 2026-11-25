import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FileBarChart2 } from 'lucide-react';
import { useApix } from '../../context/ApixContext';
import {
  aggregateTrendSeries,
  calculatePriceIndex,
  classifyFarePeriod,
  computeFareStats,
  formatINR,
} from '../../utils/apixAnalytics';
import { EmptyState, FareBandTag, KpiCard } from '../../components/ui/CommonUI';

export function PriceAnalyticsPage() {
  const {
    routes,
    fareRecords,
    thresholds,
    selectedAnalyticsRouteId,
    setSelectedAnalyticsRouteId,
    setActivePage,
  } = useApix();

  const [granularity, setGranularity] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const selectedRoute =
    routes.find((r) => r.id === selectedAnalyticsRouteId) ?? routes[0];

  const trendSeries = useMemo(
    () =>
      aggregateTrendSeries(
        fareRecords,
        selectedRoute,
        granularity,
        thresholds,
        granularity === 'yearly' ? 'all' : '2026'
      ),
    [fareRecords, selectedRoute, granularity, thresholds]
  );

  const summary = useMemo(() => {
    if (trendSeries.length === 0) return null;
    const allAvgs = trendSeries.map((t) => t.avgFare);
    const stats = computeFareStats(allAvgs);
    const overallMin = Math.min(...trendSeries.map((t) => t.minFare));
    const overallMax = Math.max(...trendSeries.map((t) => t.maxFare));
    const latest = trendSeries[trendSeries.length - 1];
    const compositeIndex = calculatePriceIndex(
      stats.avg,
      selectedRoute?.baselineFare ?? 5000
    );
    const lowCount = trendSeries.filter((t) => t.band === 'Low').length;
    const moderateCount = trendSeries.filter((t) => t.band === 'Moderate').length;
    const highCount = trendSeries.filter((t) => t.band === 'High').length;

    return {
      avgFare: stats.avg,
      minFare: overallMin,
      maxFare: overallMax,
      latestIndex: latest.priceIndex,
      latestBand: latest.band,
      compositeIndex,
      compositeBand: classifyFarePeriod(compositeIndex, thresholds),
      lowCount,
      moderateCount,
      highCount,
    };
  }, [trendSeries, selectedRoute, thresholds]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Price Trend & Airfare Index Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical fare trajectories and base-100 index classification (Low ≤{' '}
            {thresholds.lowMax} · Moderate · High ≥ {thresholds.highMin}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Select route for analytics"
            value={selectedRoute?.id ?? ''}
            onChange={(e) => setSelectedAnalyticsRouteId(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
          >
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.sourceCode} → {r.destinationCode} ({r.sourceCity} - {r.destinationCity})
              </option>
            ))}
          </select>

          {/* Timeframe Segmented Control */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'monthly', label: 'Monthly (2026)' },
                { id: 'quarterly', label: 'Quarterly' },
                { id: 'yearly', label: 'Yearly (2022–26)' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGranularity(opt.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  granularity === opt.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setActivePage('reports')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <FileBarChart2 className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </section>

      {trendSeries.length === 0 || !summary ? (
        <EmptyState
          title="No historical records for this selection"
          description="There are no simulated historical fare records for the selected route and timeframe. Select another corridor or add fare records in the Admin Console."
        />
      ) : (
        <>
          {/* Summary KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="Average Route Fare"
              value={formatINR(summary.avgFare)}
              subtext={`Baseline benchmark: ${formatINR(selectedRoute?.baselineFare ?? 5000)}`}
            />
            <KpiCard
              label="Minimum Historical Fare"
              value={formatINR(summary.minFare)}
              subtext={`${summary.lowCount} Low-band periods in view`}
              accent="emerald"
            />
            <KpiCard
              label="Maximum Historical Fare"
              value={formatINR(summary.maxFare)}
              subtext={`${summary.highCount} High-band peak periods`}
              accent="rose"
            />
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500">Airfare Price Index</p>
                <FareBandTag band={summary.compositeBand} />
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums text-blue-700 tracking-tight">
                {summary.compositeIndex}
              </p>
              <p className="text-xs text-slate-500">
                Latest period: <span className="font-mono font-semibold text-slate-700">{summary.latestIndex}</span> ({summary.latestBand})
              </p>
            </div>
          </section>

          {/* Charts Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Historical Fare Line Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-900">
                  Historical Airfare Trajectory (INR)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Average, lowest, and peak fares for {selectedRoute?.sourceCode} →{' '}
                  {selectedRoute?.destinationCode}
                </p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendSeries}
                    margin={{ top: 8, right: 16, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
                      width={54}
                    />
                    <Tooltip
                      formatter={(val, name) => [formatINR(Number(val ?? 0)), String(name ?? '')]}
                      contentStyle={{
                        borderRadius: '10px',
                        borderColor: '#E2E8F0',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Line
                      type="monotone"
                      dataKey="maxFare"
                      name="Peak Fare"
                      stroke="#E11D48"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgFare"
                      name="Average Fare"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      dot={{ r: 3.5 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="minFare"
                      name="Lowest Fare"
                      stroke="#16A34A"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Airfare Price Index Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-900">
                  Airfare Price Index (Base = 100)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Values above {thresholds.highMin} indicate High fare seasons; below{' '}
                  {thresholds.lowMax} indicate Low fare deals
                </p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendSeries}
                    margin={{ top: 8, right: 16, left: 4, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient id="apixIndexGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[
                        (dataMin: number) => Math.floor((dataMin - 10) / 10) * 10,
                        (dataMax: number) => Math.ceil((dataMax + 10) / 10) * 10,
                      ]}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                      width={42}
                    />
                    <Tooltip
                      formatter={(val) => [`${Number(val ?? 0)} pts`, 'Price Index']}
                      contentStyle={{
                        borderRadius: '10px',
                        borderColor: '#E2E8F0',
                        fontSize: '12px',
                      }}
                    />
                    <ReferenceLine
                      y={100}
                      stroke="#64748B"
                      strokeDasharray="4 4"
                      label={{ value: 'Base 100', position: 'insideTopRight', fontSize: 11, fill: '#64748B' }}
                    />
                    <ReferenceLine
                      y={thresholds.highMin}
                      stroke="#DC2626"
                      strokeDasharray="3 3"
                    />
                    <Area
                      type="monotone"
                      dataKey="priceIndex"
                      name="Price Index"
                      stroke="#4F46E5"
                      strokeWidth={2.5}
                      fill="url(#apixIndexGrad)"
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Period Classification Table */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Period-wise Index & Fare Classification
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Low: {summary.lowCount} · Moderate: {summary.moderateCount} · High:{' '}
                  {summary.highCount} periods
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="py-3 px-6">Period</th>
                    <th className="py-3 px-4 text-right">Records</th>
                    <th className="py-3 px-4 text-right">Min Fare</th>
                    <th className="py-3 px-4 text-right">Average Fare</th>
                    <th className="py-3 px-4 text-right">Max Fare</th>
                    <th className="py-3 px-4 text-right">APIX Index</th>
                    <th className="py-3 px-4 text-right">vs Base 100</th>
                    <th className="py-3 px-6">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {trendSeries.map((pt) => {
                    const delta = Math.round((pt.priceIndex - 100) * 10) / 10;
                    return (
                      <tr key={pt.period} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-6 font-semibold text-slate-900">
                          {pt.label}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                          {pt.recordCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">
                          {formatINR(pt.minFare)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {formatINR(pt.avgFare)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {formatINR(pt.maxFare)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-blue-700">
                          {pt.priceIndex}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono tabular-nums text-xs font-semibold ${
                            delta > 0
                              ? 'text-rose-600'
                              : delta < 0
                              ? 'text-emerald-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {delta > 0 ? `+${delta}%` : `${delta}%`}
                        </td>
                        <td className="py-3 px-6">
                          <FareBandTag band={pt.band} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
