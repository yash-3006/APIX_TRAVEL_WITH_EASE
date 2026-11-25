import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useApix } from '../../context/ApixContext';
import { INDIAN_AIRPORTS } from '../../data/mockData';
import { RouteRecord } from '../../types/apix';
import {
  formatDuration,
  formatINR,
  validateRouteInput,
} from '../../utils/apixAnalytics';
import { ConfirmDialog, EmptyState, Modal } from '../../components/ui/CommonUI';

const EMPTY_FORM: Omit<RouteRecord, 'id'> = {
  sourceCode: 'DEL',
  sourceCity: 'New Delhi',
  destinationCode: 'AMD',
  destinationCity: 'Ahmedabad',
  distanceKm: 775,
  avgDurationMin: 95,
  baselineFare: 4200,
  status: 'Active',
};

export function RouteManagementPage() {
  const { routes, fareRecords, addRoute, updateRoute, deleteRoute } = useApix();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Seasonal'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteRecord | null>(null);
  const [form, setForm] = useState<Omit<RouteRecord, 'id'>>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<RouteRecord | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return routes.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return `${r.sourceCode} ${r.destinationCode} ${r.sourceCity} ${r.destinationCity}`
        .toLowerCase()
        .includes(q);
    });
  }, [routes, query, statusFilter]);

  const recordCountByRoute = useMemo(() => {
    const map = new Map<string, number>();
    fareRecords.forEach((f) => map.set(f.routeId, (map.get(f.routeId) ?? 0) + 1));
    return map;
  }, [fareRecords]);

  const openAdd = () => {
    setEditingRoute(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (route: RouteRecord) => {
    setEditingRoute(route);
    setForm({
      sourceCode: route.sourceCode,
      sourceCity: route.sourceCity,
      destinationCode: route.destinationCode,
      destinationCity: route.destinationCity,
      distanceKm: route.distanceKm,
      avgDurationMin: route.avgDurationMin,
      baselineFare: route.baselineFare,
      status: route.status,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleAirportChange = (field: 'source' | 'destination', code: string) => {
    const ap = INDIAN_AIRPORTS.find((a) => a.code === code);
    if (field === 'source') {
      setForm({ ...form, sourceCode: code, sourceCity: ap?.city ?? code });
    } else {
      setForm({ ...form, destinationCode: code, destinationCity: ap?.city ?? code });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateRouteInput(form, routes, editingRoute?.id);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (editingRoute) {
      updateRoute(editingRoute.id, form);
    } else {
      addRoute(form);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Route Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain source and destination Indian airport corridors and base-100 index fare benchmarks ({routes.length} routes).
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Route</span>
        </button>
      </section>

      {/* Filters */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by IATA code or city name..."
            aria-label="Search routes"
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
          />
        </div>

        <div className="inline-flex p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          {(['all', 'Active', 'Seasonal'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? 'All Routes' : st}
            </button>
          ))}
        </div>
      </section>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No routes match your search"
          description="Clear the filter or create a new Indian domestic flight corridor."
          actionLabel="Add Route"
          onAction={openAdd}
        />
      ) : (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-6">Corridor</th>
                  <th className="py-3 px-4">Origin → Destination</th>
                  <th className="py-3 px-4 text-right">Distance</th>
                  <th className="py-3 px-4 text-right">Avg Duration</th>
                  <th className="py-3 px-4 text-right">Baseline Fare (100)</th>
                  <th className="py-3 px-4 text-right">Records</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((route) => (
                  <tr key={route.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {route.sourceCode} → {route.destinationCode}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {route.sourceCity} to {route.destinationCity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      {route.distanceKm.toLocaleString('en-IN')} km
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      {formatDuration(route.avgDurationMin)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatINR(route.baselineFare)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      {recordCountByRoute.get(route.id) ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold">
                      <span
                        className={
                          route.status === 'Active' ? 'text-emerald-700' : 'text-amber-700'
                        }
                      >
                        {route.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(route)}
                          aria-label={`Edit route ${route.sourceCode} to ${route.destinationCode}`}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(route)}
                          aria-label={`Delete route ${route.sourceCode} to ${route.destinationCode}`}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Add / Edit Route Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingRoute
            ? `Edit Route ${editingRoute.sourceCode} → ${editingRoute.destinationCode}`
            : 'Add New Route Corridor'
        }
        description="The baseline fare sets Index = 100 for historical price analytics."
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rt-src" className="block text-xs font-semibold text-slate-700 mb-1">
                Source Airport
              </label>
              <select
                id="rt-src"
                value={form.sourceCode}
                onChange={(e) => handleAirportChange('source', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                {INDIAN_AIRPORTS.map((ap) => (
                  <option key={ap.code} value={ap.code}>
                    {ap.code} — {ap.city}
                  </option>
                ))}
              </select>
              {errors.sourceCode && (
                <p className="text-xs text-rose-600 mt-1">{errors.sourceCode}</p>
              )}
            </div>

            <div>
              <label htmlFor="rt-dst" className="block text-xs font-semibold text-slate-700 mb-1">
                Destination Airport
              </label>
              <select
                id="rt-dst"
                value={form.destinationCode}
                onChange={(e) => handleAirportChange('destination', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                {INDIAN_AIRPORTS.map((ap) => (
                  <option key={ap.code} value={ap.code}>
                    {ap.code} — {ap.city}
                  </option>
                ))}
              </select>
              {errors.destinationCode && (
                <p className="text-xs text-rose-600 mt-1">{errors.destinationCode}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="rt-dist" className="block text-xs font-semibold text-slate-700 mb-1">
                Distance (km)
              </label>
              <input
                id="rt-dist"
                type="number"
                value={form.distanceKm}
                onChange={(e) => setForm({ ...form, distanceKm: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              {errors.distanceKm && (
                <p className="text-xs text-rose-600 mt-1">{errors.distanceKm}</p>
              )}
            </div>

            <div>
              <label htmlFor="rt-dur" className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (min)
              </label>
              <input
                id="rt-dur"
                type="number"
                value={form.avgDurationMin}
                onChange={(e) => setForm({ ...form, avgDurationMin: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              {errors.avgDurationMin && (
                <p className="text-xs text-rose-600 mt-1">{errors.avgDurationMin}</p>
              )}
            </div>

            <div>
              <label htmlFor="rt-base" className="block text-xs font-semibold text-slate-700 mb-1">
                Baseline Fare (₹)
              </label>
              <input
                id="rt-base"
                type="number"
                value={form.baselineFare}
                onChange={(e) => setForm({ ...form, baselineFare: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              {errors.baselineFare && (
                <p className="text-xs text-rose-600 mt-1">{errors.baselineFare}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="rt-status" className="block text-xs font-semibold text-slate-700 mb-1">
              Corridor Status
            </label>
            <select
              id="rt-status"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as RouteRecord['status'] })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            >
              <option value="Active">Active</option>
              <option value="Seasonal">Seasonal</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              {editingRoute ? 'Save Changes' : 'Create Route'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteRoute(deleteTarget.id);
        }}
        title="Delete Route Corridor"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.sourceCode} → ${deleteTarget.destinationCode} (${deleteTarget.sourceCity} to ${deleteTarget.destinationCity})? Historical fare records belonging to this route will also be deleted.`
            : ''
        }
        confirmLabel="Delete Route"
      />
    </div>
  );
}
