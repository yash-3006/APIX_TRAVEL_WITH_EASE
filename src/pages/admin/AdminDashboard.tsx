import React, { useMemo } from 'react';
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
import { ArrowRight, Plus } from 'lucide-react';
import { useApix } from '../../context/ApixContext';
import {
  aggregateTrendSeries,
  formatINR,
} from '../../utils/apixAnalytics';
import { KpiCard } from '../../components/ui/CommonUI';

export function AdminDashboard() {
  const {
    airlines,
    routes,
    fareRecords,
    users,
    activityLogs,
    thresholds,
    setActivePage,
  } = useApix();

  const overallTrend2026 = useMemo(
    () => aggregateTrendSeries(fareRecords, undefined, 'monthly', thresholds, '2026'),
    [fareRecords, thresholds]
  );

  const recordsByAirline = useMemo(() => {
    const counts = new Map<string, number>();
    fareRecords.forEach((f) => {
      counts.set(f.airlineId, (counts.get(f.airlineId) ?? 0) + 1);
    });
    return airlines
      .map((a) => ({
        name: a.name,
        code: a.code,
        count: counts.get(a.id) ?? 0,
        color: a.brandColor,
      }))
      .sort((a, b) => b.count - a.count);
  }, [airlines, fareRecords]);

  const activeAirlinesCount = airlines.filter((a) => a.status === 'Active').length;
  const activeUsersCount = users.filter((u) => u.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Administrator Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor carrier catalog coverage, domestic routes, historical fare records, and platform activity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActivePage('admin-fares')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Fare Records</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage('admin-reports')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Open Reports</span>
          </button>
        </div>
      </section>

      {/* 4 Overview KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Airlines"
          value={`${airlines.length}`}
          subtext={`${activeAirlinesCount} active domestic carriers`}
          accent="blue"
        />
        <KpiCard
          label="Managed Routes"
          value={`${routes.length}`}
          subtext="Indian airport corridors indexed"
          accent="indigo"
        />
        <KpiCard
          label="Historical Fare Records"
          value={fareRecords.length.toLocaleString('en-IN')}
          subtext="Simulated multi-year dataset (2022–2026)"
          accent="emerald"
        />
        <KpiCard
          label="Registered Users"
          value={`${users.length}`}
          subtext={`${activeUsersCount} active · ${users.filter((u) => u.role === 'admin').length} admins`}
        />
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Network-Wide Fare Data Trend (2026)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly mean INR fare across all managed domestic routes
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('admin-fares')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>Inspect Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overallTrend2026}>
                <defs>
                  <linearGradient id="adminTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.22} />
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
                  formatter={(v) => [formatINR(Number(v ?? 0)), 'Network Avg Fare']}
                  contentStyle={{ borderRadius: '10px', borderColor: '#E2E8F0', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="avgFare"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fill="url(#adminTrendFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Fare Records by Airline
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution of stored historical entries per carrier
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('admin-airlines')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Airlines
            </button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={recordsByAirline}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#334155' }}
                  axisLine={false}
                  tickLine={false}
                  width={122}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v ?? 0)} records`, 'Fare Entries']}
                  contentStyle={{ borderRadius: '10px', borderColor: '#E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20} isAnimationActive={false}>
                  {recordsByAirline.map((row) => (
                    <Cell key={row.code} fill={row.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Recent Activity Log */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent System Activity</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit trail of airline, route, fare record, and report actions
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-3 px-6">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {activityLogs.slice(0, 8).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-6 font-semibold text-slate-900 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                    {log.entity}
                  </td>
                  <td className="py-3 px-4 text-slate-700">{log.details}</td>
                  <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                    {log.actor}
                  </td>
                  <td className="py-3 px-6 text-right font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
