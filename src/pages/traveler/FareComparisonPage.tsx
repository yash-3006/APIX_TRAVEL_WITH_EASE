import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpDown, TrendingUp } from 'lucide-react';
import { useApix } from '../../context/ApixContext';
import {
  aggregateAirlineComparison,
  formatINR,
} from '../../utils/apixAnalytics';
import { EmptyState, FareBandTag, KpiCard } from '../../components/ui/CommonUI';

type SortField = 'avgFare' | 'minFare' | 'maxFare' | 'onTimePercent';

export function FareComparisonPage() {
  const {
    routes,
    airlines,
    fareRecords,
    thresholds,
    compareState,
    setCompareState,
    setSelectedAnalyticsRouteId,
    setActivePage,
  } = useApix();

  const [sortField, setSortField] = useState<SortField>('avgFare');
  const [sortAsc, setSortAsc] = useState(true);

  const selectedRoute =
    routes.find((r) => r.id === compareState.routeId) ?? routes[0];
  const activeAirlines = useMemo(
    () => airlines.filter((a) => a.status === 'Active'),
    [airlines]
  );

  const comparisonRows = useMemo(() => {
    const raw = aggregateAirlineComparison(
      fareRecords,
      airlines,
      selectedRoute,
      compareState.selectedAirlineIds,
      thresholds
    );
    return [...raw].sort((a, b) => {
      const diff = a[sortField] - b[sortField];
      return sortAsc ? diff : -diff;
    });
  }, [
    fareRecords,
    airlines,
    selectedRoute,
    compareState.selectedAirlineIds,
    thresholds,
    sortField,
    sortAsc,
  ]);

  const summary = useMemo(() => {
    if (comparisonRows.length === 0) return null;
    const lowestRow = [...comparisonRows].sort((a, b) => a.minFare - b.minFare)[0];
    const highestRow = [...comparisonRows].sort((a, b) => b.maxFare - a.maxFare)[0];
    const avgOfAvgs = Math.round(
      comparisonRows.reduce((acc, r) => acc + r.avgFare, 0) / comparisonRows.length
    );
    const spread = Math.max(0, highestRow.avgFare - lowestRow.avgFare);
    return { lowestRow, highestRow, avgOfAvgs, spread };
  }, [comparisonRows]);

  const toggleAirline = (airlineId: string) => {
    setCompareState((prev) => {
      const exists = prev.selectedAirlineIds.includes(airlineId);
      const nextIds = exists
        ? prev.selectedAirlineIds.filter((id) => id !== airlineId)
        : [...prev.selectedAirlineIds, airlineId];
      return { ...prev, selectedAirlineIds: nextIds };
    });
  };

  const selectAllAirlines = () => {
    setCompareState((prev) => ({
      ...prev,
      selectedAirlineIds: activeAirlines.map((a) => a.id),
    }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(field !== 'onTimePercent');
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Airline Fare Comparison</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare minimum, average, and peak fares across selected carriers on the same domestic route.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="cmp-route" className="text-xs font-semibold text-slate-600">
              Route
            </label>
            <select
              id="cmp-route"
              value={selectedRoute?.id ?? ''}
              onChange={(e) =>
                setCompareState((prev) => ({ ...prev, routeId: e.target.value }))
              }
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.sourceCode} → {r.destinationCode} ({r.sourceCity} to {r.destinationCity})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                if (selectedRoute) setSelectedAnalyticsRouteId(selectedRoute.id);
                setActivePage('analytics');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>View Route Trend</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-700">
              Select Airlines to Compare ({compareState.selectedAirlineIds.length} active)
            </span>
            <button
              type="button"
              onClick={selectAllAirlines}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Select All Carriers
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeAirlines.map((airline) => {
              const selected = compareState.selectedAirlineIds.includes(airline.id);
              return (
                <button
                  key={airline.id}
                  type="button"
                  onClick={() => toggleAirline(airline.id)}
                  aria-pressed={selected}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                    selected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {airline.name} ({airline.code})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {comparisonRows.length === 0 || !summary ? (
        <EmptyState
          title="No airlines selected for comparison"
          description="Select at least one carrier with historical fare records on this route to generate the comparison matrix and chart."
          actionLabel="Select All Active Airlines"
          onAction={selectAllAirlines}
        />
      ) : (
        <>
          {/* Highlight KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="Lowest Carrier Fare"
              value={formatINR(summary.lowestRow.minFare)}
              subtext={`Offered by ${summary.lowestRow.airlineName} (${summary.lowestRow.airlineCode})`}
              accent="emerald"
            />
            <KpiCard
              label="Route Average Fare"
              value={formatINR(summary.avgOfAvgs)}
              subtext={`Across ${comparisonRows.length} selected airlines`}
              accent="blue"
            />
            <KpiCard
              label="Highest Recorded Fare"
              value={formatINR(summary.highestRow.maxFare)}
              subtext={`Peak rate on ${summary.highestRow.airlineName} (${summary.highestRow.airlineCode})`}
              accent="rose"
            />
            <KpiCard
              label="Average Fare Spread"
              value={formatINR(summary.spread)}
              subtext="Potential savings between highest & lowest avg"
              accent="indigo"
            />
          </section>

          {/* Grouped Bar Chart */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900">
                Min, Average & Max Fare Comparison — {selectedRoute?.sourceCode} →{' '}
                {selectedRoute?.destinationCode}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Historical INR fare range across selected carriers · Baseline{' '}
                {formatINR(selectedRoute?.baselineFare ?? 5000)}
              </p>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonRows}
                  margin={{ top: 8, right: 16, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="airlineName"
                    tick={{ fontSize: 12, fill: '#334155' }}
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
                    formatter={(value, name) => [formatINR(Number(value ?? 0)), String(name ?? '')]}
                    contentStyle={{
                      borderRadius: '10px',
                      borderColor: '#E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="minFare" name="Lowest Fare" fill="#16A34A" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="avgFare" name="Average Fare" fill="#2563EB" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="maxFare" name="Highest Fare" fill="#6366F1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Detailed Comparison Table */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                Carrier Breakdown Matrix
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="py-3 px-6">Airline</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('minFare')}
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                      >
                        Lowest <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('avgFare')}
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                      >
                        Average <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('maxFare')}
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                      >
                        Highest <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-right">Index</th>
                    <th className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('onTimePercent')}
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                      >
                        On-Time <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-right">Baggage</th>
                    <th className="py-3 px-6">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {comparisonRows.map((row) => {
                    const isLowest = row.airlineId === summary.lowestRow.airlineId;
                    const isHighest = row.airlineId === summary.highestRow.airlineId;
                    return (
                      <tr key={row.airlineId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-8 h-8 rounded-md text-white font-mono text-xs font-bold flex items-center justify-center shrink-0"
                              style={{ backgroundColor: row.brandColor }}
                            >
                              {row.airlineCode}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {row.airlineName}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {row.flightCount} fare records
                                {isLowest ? ' · Lowest minimum' : ''}
                                {isHighest && !isLowest ? ' · Highest peak' : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {row.carrierType}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                          {formatINR(row.minFare)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900 font-bold">
                          {formatINR(row.avgFare)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                          {formatINR(row.maxFare)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-blue-700 font-semibold">
                          {row.priceIndex}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                          {row.onTimePercent}%
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                          {row.baggageKg} kg
                        </td>
                        <td className="py-3.5 px-6">
                          <FareBandTag band={row.band} />
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
