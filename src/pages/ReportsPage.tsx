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
import { Download, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';
import { useApix } from '../context/ApixContext';
import {
  aggregateAirlineComparison,
  aggregateTrendSeries,
  calculatePriceIndex,
  classifyFarePeriod,
  computeFareStats,
  formatINR,
} from '../utils/apixAnalytics';
import {
  downloadAirfareCsvReport,
  downloadAirfarePdfReport,
} from '../utils/pdfReport';
import { FareBandTag, KpiCard } from '../components/ui/CommonUI';

type DatePeriod = 'last-3m' | 'last-6m' | 'full-2026' | 'multi-year';

const PERIOD_LABELS: Record<DatePeriod, string> = {
  'last-3m': 'Last 3 Months (Sep–Nov 2026)',
  'last-6m': 'Last 6 Months (Jul–Dec 2026)',
  'full-2026': 'Full Year 2026 (Jan–Dec)',
  'multi-year': 'Multi-Year Historical (2022–2026)',
};

export function ReportsPage() {
  const {
    currentUser,
    routes,
    airlines,
    fareRecords,
    thresholds,
    pushToast,
    logActivity,
  } = useApix();

  const [routeId, setRouteId] = useState(routes[0]?.id ?? 'rt-del-bom');
  const [period, setPeriod] = useState<DatePeriod>('full-2026');
  const [reportType, setReportType] = useState(
    'Route-Wise Airfare Index Summary'
  );
  const [generating, setGenerating] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string>(
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );

  const selectedRoute = routes.find((r) => r.id === routeId) ?? routes[0];

  const reportData = useMemo(() => {
    if (!selectedRoute) return null;

    const granularity = period === 'multi-year' ? 'yearly' : 'monthly';
    const rawTrend = aggregateTrendSeries(
      fareRecords,
      selectedRoute,
      granularity,
      thresholds,
      period === 'multi-year' ? 'all' : '2026'
    );

    const trendPoints =
      period === 'last-3m'
        ? rawTrend.filter((pt) =>
            ['2026-09', '2026-10', '2026-11'].includes(pt.period)
          )
        : period === 'last-6m'
        ? rawTrend.slice(-6)
        : rawTrend;

    const airlineRows = aggregateAirlineComparison(
      fareRecords,
      airlines,
      selectedRoute,
      [],
      thresholds
    );

    const stats = computeFareStats(trendPoints.map((t) => t.avgFare));
    const minFare =
      trendPoints.length > 0
        ? Math.min(...trendPoints.map((t) => t.minFare))
        : 0;
    const maxFare =
      trendPoints.length > 0
        ? Math.max(...trendPoints.map((t) => t.maxFare))
        : 0;
    const priceIndex = calculatePriceIndex(stats.avg, selectedRoute.baselineFare);
    const band = classifyFarePeriod(priceIndex, thresholds);

    return {
      route: selectedRoute,
      periodLabel: PERIOD_LABELS[period],
      reportType,
      generatedBy: currentUser?.name ?? 'APIX User',
      avgFare: stats.avg,
      minFare,
      maxFare,
      priceIndex,
      band,
      trendPoints,
      airlineRows,
    };
  }, [selectedRoute, period, reportType, fareRecords, airlines, thresholds, currentUser]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    window.setTimeout(() => {
      setGenerating(false);
      setGeneratedAt(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      if (selectedRoute) {
        logActivity(
          'Generated',
          'Report',
          `${reportType} for ${selectedRoute.sourceCode}→${selectedRoute.destinationCode} (${PERIOD_LABELS[period]})`
        );
      }
      pushToast({
        type: 'success',
        title: 'Analytical report refreshed',
        description: `Compiled summary for ${selectedRoute?.sourceCode} → ${selectedRoute?.destinationCode}.`,
      });
    }, 300);
  };

  const handleDownloadPdf = () => {
    if (!reportData) return;
    try {
      const fileName = downloadAirfarePdfReport(reportData);
      logActivity(
        'Exported',
        'Report',
        `Downloaded PDF report ${fileName}`
      );
      pushToast({
        type: 'success',
        title: 'PDF report downloaded',
        description: fileName,
      });
    } catch {
      pushToast({
        type: 'error',
        title: 'PDF export failed',
        description: 'Could not generate PDF in this browser session.',
      });
    }
  };

  const handleDownloadCsv = () => {
    if (!reportData) return;
    const fileName = downloadAirfareCsvReport(reportData);
    pushToast({
      type: 'success',
      title: 'CSV dataset exported',
      description: fileName,
    });
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Route-Wise Airfare Reports
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure a corridor and timeframe to inspect graphical summaries and export formatted PDF or CSV reports.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={!reportData || generating}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!reportData || generating}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Report</span>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleGenerate}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end pt-4 border-t border-slate-100"
        >
          <div className="lg:col-span-4">
            <label htmlFor="rep-route" className="block text-xs font-semibold text-slate-600 mb-1">
              Flight Corridor
            </label>
            <select
              id="rep-route"
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.sourceCode} → {r.destinationCode} ({r.sourceCity} to {r.destinationCity})
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="rep-period" className="block text-xs font-semibold text-slate-600 mb-1">
              Date Period
            </label>
            <select
              id="rep-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as DatePeriod)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
            >
              <option value="last-3m">Last 3 Months (Sep–Nov 2026)</option>
              <option value="last-6m">Last 6 Months (Jul–Dec 2026)</option>
              <option value="full-2026">Full Year 2026</option>
              <option value="multi-year">Multi-Year (2022–2026)</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="rep-type" className="block text-xs font-semibold text-slate-600 mb-1">
              Report Template
            </label>
            <select
              id="rep-type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
            >
              <option value="Route-Wise Airfare Index Summary">Route-Wise Index Summary</option>
              <option value="Carrier Competitive Fare Audit">Carrier Competitive Audit</option>
              <option value="Seasonal Booking Window Brief">Seasonal Booking Brief</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Building...' : 'Generate'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Report Preview Canvas */}
      {reportData && (
        <div className="space-y-6">
          {/* Report Banner */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {reportData.reportType}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {reportData.route.sourceCode} ({reportData.route.sourceCity}) →{' '}
                    {reportData.route.destinationCode} ({reportData.route.destinationCity}) ·{' '}
                    {reportData.periodLabel} · Refreshed {generatedAt}
                  </p>
                </div>
              </div>
              <FareBandTag band={reportData.band} />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              <KpiCard
                label="Period Average Fare"
                value={formatINR(reportData.avgFare)}
                subtext={`Baseline: ${formatINR(reportData.route.baselineFare)}`}
              />
              <KpiCard
                label="Lowest Fare Observed"
                value={formatINR(reportData.minFare)}
                subtext="Best economy rate in period"
                accent="emerald"
              />
              <KpiCard
                label="Highest Fare Observed"
                value={formatINR(reportData.maxFare)}
                subtext="Peak demand rate in period"
                accent="rose"
              />
              <KpiCard
                label="Route Price Index"
                value={`${reportData.priceIndex}`}
                subtext={`Classification: ${reportData.band} Fare`}
                accent="blue"
              />
            </div>
          </div>

          {/* Graphical Summaries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                Average Fare Trend ({reportData.periodLabel})
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Historical curve included in the exported PDF table
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData.trendPoints}>
                    <defs>
                      <linearGradient id="reportAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
                      width={52}
                    />
                    <Tooltip
                      formatter={(val) => [formatINR(Number(val ?? 0)), 'Avg Fare']}
                      contentStyle={{ borderRadius: '10px', borderColor: '#E2E8F0', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgFare"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      fill="url(#reportAreaFill)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                Carrier Average Fare Breakdown
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Average economy rate per airline on {reportData.route.sourceCode} →{' '}
                {reportData.route.destinationCode}
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.airlineRows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="airlineCode" tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
                      width={52}
                    />
                    <Tooltip
                      formatter={(val) => [formatINR(Number(val ?? 0)), 'Avg Fare']}
                      contentStyle={{ borderRadius: '10px', borderColor: '#E2E8F0', fontSize: '12px' }}
                    />
                    <Bar dataKey="avgFare" radius={[6, 6, 0, 0]} barSize={34} isAnimationActive={false}>
                      {reportData.airlineRows.map((row) => (
                        <Cell key={row.airlineId} fill={row.brandColor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Summary Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Report Data Table ({reportData.trendPoints.length} periods)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="py-3 px-6">Period</th>
                    <th className="py-3 px-4 text-right">Min Fare</th>
                    <th className="py-3 px-4 text-right">Average Fare</th>
                    <th className="py-3 px-4 text-right">Max Fare</th>
                    <th className="py-3 px-4 text-right">Price Index</th>
                    <th className="py-3 px-6">Band</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {reportData.trendPoints.map((pt) => (
                    <tr key={pt.period} className="hover:bg-slate-50/70">
                      <td className="py-3 px-6 font-medium text-slate-900">{pt.label}</td>
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
                      <td className="py-3 px-6">
                        <FareBandTag band={pt.band} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
