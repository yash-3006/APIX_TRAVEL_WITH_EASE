import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useApix } from '../../context/ApixContext';
import { FareBand, FareRecord } from '../../types/apix';
import {
  calculatePriceIndex,
  classifyFarePeriod,
  formatINR,
  validateFareInput,
} from '../../utils/apixAnalytics';
import { ConfirmDialog, EmptyState, FareBandTag, Modal } from '../../components/ui/CommonUI';

const PAGE_SIZE = 15;

export function FareDataManagementPage() {
  const {
    fareRecords,
    routes,
    airlines,
    thresholds,
    addFareRecord,
    updateFareRecord,
    deleteFareRecord,
  } = useApix();

  const [searchQuery, setSearchQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState('all');
  const [airlineFilter, setAirlineFilter] = useState('all');
  const [bandFilter, setBandFilter] = useState<'all' | FareBand>('all');
  const [sortBy, setSortBy] = useState<'date' | 'fare'>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FareRecord | null>(null);
  const [form, setForm] = useState<Omit<FareRecord, 'id'>>({
    routeId: routes[0]?.id ?? '',
    airlineId: airlines[0]?.id ?? '',
    date: '2026-11-24',
    fare: 5400,
    cabinClass: 'Economy',
    stops: 0,
    departureTime: '08:15',
    arrivalTime: '10:25',
    flightNumber: '6E-309',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<FareRecord | null>(null);

  const routeMap = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes]);
  const airlineMap = useMemo(() => new Map(airlines.map((a) => [a.id, a])), [airlines]);

  const enriched = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return fareRecords
      .map((rec) => {
        const route = routeMap.get(rec.routeId);
        const airline = airlineMap.get(rec.airlineId);
        const priceIndex = calculatePriceIndex(rec.fare, route?.baselineFare ?? 5000);
        const band = classifyFarePeriod(priceIndex, thresholds);
        return { rec, route, airline, priceIndex, band };
      })
      .filter(({ rec, route, airline, band }) => {
        if (routeFilter !== 'all' && rec.routeId !== routeFilter) return false;
        if (airlineFilter !== 'all' && rec.airlineId !== airlineFilter) return false;
        if (bandFilter !== 'all' && band !== bandFilter) return false;
        if (!q) return true;
        const text = `${rec.flightNumber} ${rec.date} ${route?.sourceCode ?? ''} ${
          route?.destinationCode ?? ''
        } ${airline?.name ?? ''}`.toLowerCase();
        return text.includes(q);
      })
      .sort((a, b) => {
        if (sortBy === 'fare') {
          return sortDesc ? b.rec.fare - a.rec.fare : a.rec.fare - b.rec.fare;
        }
        return sortDesc
          ? b.rec.date.localeCompare(a.rec.date)
          : a.rec.date.localeCompare(b.rec.date);
      });
  }, [
    fareRecords,
    routeMap,
    airlineMap,
    thresholds,
    searchQuery,
    routeFilter,
    airlineFilter,
    bandFilter,
    sortBy,
    sortDesc,
  ]);

  const totalPages = Math.max(1, Math.ceil(enriched.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = enriched.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openAdd = () => {
    setEditingRecord(null);
    setForm({
      routeId: routes[0]?.id ?? '',
      airlineId: airlines[0]?.id ?? '',
      date: '2026-11-24',
      fare: 5400,
      cabinClass: 'Economy',
      stops: 0,
      departureTime: '08:15',
      arrivalTime: '10:25',
      flightNumber: `${airlines[0]?.code ?? '6E'}-412`,
    });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (rec: FareRecord) => {
    setEditingRecord(rec);
    setForm({
      routeId: rec.routeId,
      airlineId: rec.airlineId,
      date: rec.date,
      fare: rec.fare,
      cabinClass: rec.cabinClass,
      stops: rec.stops,
      departureTime: rec.departureTime,
      arrivalTime: rec.arrivalTime,
      flightNumber: rec.flightNumber,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateFareInput(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (editingRecord) {
      updateFareRecord(editingRecord.id, form);
    } else {
      addFareRecord(form);
    }
    setModalOpen(false);
    setPage(1);
  };

  const toggleSort = (col: 'date' | 'fare') => {
    if (sortBy === col) {
      setSortDesc((prev) => !prev);
    } else {
      setSortBy(col);
      setSortDesc(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fare Data Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View, validate, add, update, and delete historical INR airfare records ({fareRecords.length.toLocaleString('en-IN')} total records).
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Fare Record</span>
        </button>
      </section>

      {/* Filter Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search flight #, date (2026-11), or code..."
            aria-label="Search fare records"
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
          />
        </div>

        <div className="lg:col-span-3">
          <select
            aria-label="Filter by route"
            value={routeFilter}
            onChange={(e) => {
              setRouteFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
          >
            <option value="all">All Routes</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.sourceCode} → {r.destinationCode}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <select
            aria-label="Filter by airline"
            value={airlineFilter}
            onChange={(e) => {
              setAirlineFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
          >
            <option value="all">All Airlines</option>
            {airlines.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.code})
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            aria-label="Filter by fare classification band"
            value={bandFilter}
            onChange={(e) => {
              setBandFilter(e.target.value as 'all' | FareBand);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
          >
            <option value="all">All Bands</option>
            <option value="Low">Low Fare</option>
            <option value="Moderate">Moderate Fare</option>
            <option value="High">High Fare</option>
          </select>
        </div>
      </section>

      {/* Records Table */}
      {pageItems.length === 0 ? (
        <EmptyState
          title="No fare records match your filters"
          description="Adjust the route, carrier, or band filters, or add a new historical fare record."
          actionLabel="Add Fare Record"
          onAction={openAdd}
        />
      ) : (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-6">
                    <button
                      type="button"
                      onClick={() => toggleSort('date')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Date <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Airline & Flight</th>
                  <th className="py-3 px-4">Cabin / Stops</th>
                  <th className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('fare')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Fare (INR) <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">Index</th>
                  <th className="py-3 px-4">Band</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pageItems.map(({ rec, route, airline, priceIndex, band }) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-6 font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap">
                      {rec.date}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-xs text-slate-900 whitespace-nowrap">
                      {route ? `${route.sourceCode} → ${route.destinationCode}` : rec.routeId}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {airline?.name ?? 'Unknown'}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">
                        {rec.flightNumber} · {rec.departureTime}–{rec.arrivalTime}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {rec.cabinClass} · {rec.stops === 0 ? 'Non-stop' : '1 Stop'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatINR(rec.fare)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-blue-700 font-semibold">
                      {priceIndex}
                    </td>
                    <td className="py-3 px-4">
                      <FareBandTag band={band} />
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(rec)}
                          aria-label={`Edit fare record ${rec.flightNumber} on ${rec.date}`}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(rec)}
                          aria-label={`Delete fare record ${rec.flightNumber} on ${rec.date}`}
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

          {/* Pagination */}
          <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, enriched.length)} of{' '}
              {enriched.length.toLocaleString('en-IN')} matching records
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono font-semibold text-slate-700">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Add / Edit Fare Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRecord ? 'Edit Historical Fare Record' : 'Add Historical Fare Record'}
        description="Validated fare records immediately recalculate price index trends and comparisons."
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fr-route" className="block text-xs font-semibold text-slate-700 mb-1">
                Route
              </label>
              <select
                id="fr-route"
                value={form.routeId}
                onChange={(e) => setForm({ ...form, routeId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.sourceCode} → {r.destinationCode} ({r.sourceCity} - {r.destinationCity})
                  </option>
                ))}
              </select>
              {errors.routeId && <p className="text-xs text-rose-600 mt-1">{errors.routeId}</p>}
            </div>

            <div>
              <label htmlFor="fr-airline" className="block text-xs font-semibold text-slate-700 mb-1">
                Airline
              </label>
              <select
                id="fr-airline"
                value={form.airlineId}
                onChange={(e) => setForm({ ...form, airlineId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                {airlines.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
              {errors.airlineId && <p className="text-xs text-rose-600 mt-1">{errors.airlineId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="fr-date" className="block text-xs font-semibold text-slate-700 mb-1">
                Date
              </label>
              <input
                id="fr-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              {errors.date && <p className="text-xs text-rose-600 mt-1">{errors.date}</p>}
            </div>

            <div>
              <label htmlFor="fr-fare" className="block text-xs font-semibold text-slate-700 mb-1">
                Fare (INR ₹)
              </label>
              <input
                id="fr-fare"
                type="number"
                value={form.fare}
                onChange={(e) => setForm({ ...form, fare: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              {errors.fare && <p className="text-xs text-rose-600 mt-1">{errors.fare}</p>}
            </div>

            <div>
              <label htmlFor="fr-flight" className="block text-xs font-semibold text-slate-700 mb-1">
                Flight Number
              </label>
              <input
                id="fr-flight"
                type="text"
                value={form.flightNumber}
                onChange={(e) => setForm({ ...form, flightNumber: e.target.value })}
                placeholder="e.g., 6E-204"
                className="w-full px-3 py-2 text-sm font-mono uppercase bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              {errors.flightNumber && (
                <p className="text-xs text-rose-600 mt-1">{errors.flightNumber}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="fr-cabin" className="block text-xs font-semibold text-slate-700 mb-1">
                Cabin
              </label>
              <select
                id="fr-cabin"
                value={form.cabinClass}
                onChange={(e) =>
                  setForm({ ...form, cabinClass: e.target.value as FareRecord['cabinClass'] })
                }
                className="w-full px-2.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="Economy">Economy</option>
                <option value="Premium Economy">Premium Economy</option>
                <option value="Business">Business</option>
              </select>
            </div>

            <div>
              <label htmlFor="fr-stops" className="block text-xs font-semibold text-slate-700 mb-1">
                Stops
              </label>
              <select
                id="fr-stops"
                value={form.stops}
                onChange={(e) => setForm({ ...form, stops: Number(e.target.value) as 0 | 1 })}
                className="w-full px-2.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value={0}>Non-stop</option>
                <option value={1}>1 Stop</option>
              </select>
            </div>

            <div>
              <label htmlFor="fr-dep" className="block text-xs font-semibold text-slate-700 mb-1">
                Departure
              </label>
              <input
                id="fr-dep"
                type="time"
                value={form.departureTime}
                onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                className="w-full px-2.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="fr-arr" className="block text-xs font-semibold text-slate-700 mb-1">
                Arrival
              </label>
              <input
                id="fr-arr"
                type="time"
                value={form.arrivalTime}
                onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
                className="w-full px-2.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
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
              {editingRecord ? 'Update Record' : 'Save Fare Record'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteFareRecord(deleteTarget.id);
        }}
        title="Confirm Fare Record Deletion"
        message={
          deleteTarget
            ? `Permanently delete historical fare record ${deleteTarget.flightNumber} dated ${deleteTarget.date} (${formatINR(
                deleteTarget.fare
              )})? This action updates all trend charts immediately.`
            : ''
        }
        confirmLabel="Delete Fare Record"
      />
    </div>
  );
}
