import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useApix } from '../../context/ApixContext';
import { INDIAN_AIRPORTS } from '../../data/mockData';
import { Airline } from '../../types/apix';
import { validateAirlineInput } from '../../utils/apixAnalytics';
import { ConfirmDialog, EmptyState, Modal } from '../../components/ui/CommonUI';

const COLOR_PRESETS = [
  '#2563EB',
  '#DC2626',
  '#6D28D9',
  '#EA580C',
  '#E11D48',
  '#0D9488',
  '#0284C7',
  '#4F46E5',
];

const EMPTY_FORM: Omit<Airline, 'id'> = {
  code: '',
  name: '',
  carrierType: 'Low-Cost',
  hub: 'DEL',
  onTimePercent: 84,
  baggageKg: 15,
  status: 'Active',
  brandColor: '#2563EB',
};

export function AirlineManagementPage() {
  const { airlines, fareRecords, addAirline, updateAirline, deleteAirline } = useApix();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAirline, setEditingAirline] = useState<Airline | null>(null);
  const [form, setForm] = useState<Omit<Airline, 'id'>>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Airline | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return airlines.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (!q) return true;
      return `${a.name} ${a.code} ${a.hub} ${a.carrierType}`.toLowerCase().includes(q);
    });
  }, [airlines, query, statusFilter]);

  const recordCountByAirline = useMemo(() => {
    const map = new Map<string, number>();
    fareRecords.forEach((f) => map.set(f.airlineId, (map.get(f.airlineId) ?? 0) + 1));
    return map;
  }, [fareRecords]);

  const openAdd = () => {
    setEditingAirline(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (airline: Airline) => {
    setEditingAirline(airline);
    setForm({
      code: airline.code,
      name: airline.name,
      carrierType: airline.carrierType,
      hub: airline.hub,
      onTimePercent: airline.onTimePercent,
      baggageKg: airline.baggageKg,
      status: airline.status,
      brandColor: airline.brandColor,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateAirlineInput(form, airlines, editingAirline?.id);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (editingAirline) {
      updateAirline(editingAirline.id, form);
    } else {
      addAirline(form);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Airline Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, update, or remove domestic carriers in the APIX catalog ({airlines.length} total).
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Airline</span>
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
            placeholder="Search by airline name, IATA code, or hub..."
            aria-label="Search airlines"
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
          />
        </div>

        <div className="inline-flex p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          {(['all', 'Active', 'Inactive'] as const).map((st) => (
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
              {st === 'all' ? 'All Status' : st}
            </button>
          ))}
        </div>
      </section>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No airlines match your filter"
          description="Try clearing the search query or add a new domestic airline."
          actionLabel="Add Airline"
          onAction={openAdd}
        />
      ) : (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-6">Carrier</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Primary Hub</th>
                  <th className="py-3 px-4 text-right">On-Time</th>
                  <th className="py-3 px-4 text-right">Baggage</th>
                  <th className="py-3 px-4 text-right">Fare Records</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((airline) => (
                  <tr key={airline.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-8 h-8 rounded-md text-white font-mono text-xs font-bold flex items-center justify-center shrink-0"
                          style={{ backgroundColor: airline.brandColor }}
                        >
                          {airline.code}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{airline.name}</p>
                          <p className="text-xs text-slate-500 font-mono">
                            IATA: {airline.code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {airline.carrierType}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                      {airline.hub}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {airline.onTimePercent}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      {airline.baggageKg} kg
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {recordCountByAirline.get(airline.id) ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold">
                      <span
                        className={
                          airline.status === 'Active'
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                        }
                      >
                        {airline.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(airline)}
                          aria-label={`Edit airline ${airline.name}`}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(airline)}
                          aria-label={`Delete airline ${airline.name}`}
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

      {/* Add / Edit Airline Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAirline ? `Edit ${editingAirline.name}` : 'Add New Airline'}
        description="Carrier details immediately sync with traveler flight search and comparison tools."
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="al-code" className="block text-xs font-semibold text-slate-700 mb-1">
                IATA Code
              </label>
              <input
                id="al-code"
                type="text"
                maxLength={2}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g., S5"
                className="w-full px-3 py-2 text-sm font-mono uppercase bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              {errors.code && <p className="text-xs text-rose-600 mt-1">{errors.code}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="al-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Airline Name
              </label>
              <input
                id="al-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Star Air"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="al-type" className="block text-xs font-semibold text-slate-700 mb-1">
                Carrier Type
              </label>
              <select
                id="al-type"
                value={form.carrierType}
                onChange={(e) =>
                  setForm({ ...form, carrierType: e.target.value as Airline['carrierType'] })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="Low-Cost">Low-Cost</option>
                <option value="Full-Service">Full-Service</option>
                <option value="Regional">Regional</option>
              </select>
            </div>

            <div>
              <label htmlFor="al-hub" className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Hub Airport
              </label>
              <select
                id="al-hub"
                value={form.hub}
                onChange={(e) => setForm({ ...form, hub: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                {INDIAN_AIRPORTS.map((ap) => (
                  <option key={ap.code} value={ap.code}>
                    {ap.code} — {ap.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="al-otp" className="block text-xs font-semibold text-slate-700 mb-1">
                On-Time (%)
              </label>
              <input
                id="al-otp"
                type="number"
                value={form.onTimePercent}
                onChange={(e) => setForm({ ...form, onTimePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              {errors.onTimePercent && (
                <p className="text-xs text-rose-600 mt-1">{errors.onTimePercent}</p>
              )}
            </div>

            <div>
              <label htmlFor="al-bag" className="block text-xs font-semibold text-slate-700 mb-1">
                Baggage (kg)
              </label>
              <input
                id="al-bag"
                type="number"
                value={form.baggageKg}
                onChange={(e) => setForm({ ...form, baggageKg: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              {errors.baggageKg && (
                <p className="text-xs text-rose-600 mt-1">{errors.baggageKg}</p>
              )}
            </div>

            <div>
              <label htmlFor="al-status" className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                id="al-status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as Airline['status'] })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Chart Accent Color
            </span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setForm({ ...form, brandColor: hex })}
                  aria-label={`Select color ${hex}`}
                  className={`w-7 h-7 rounded-md transition-transform ${
                    form.brandColor === hex ? 'ring-2 ring-offset-2 ring-slate-900 scale-105' : ''
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
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
              {editingAirline ? 'Save Changes' : 'Create Airline'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteAirline(deleteTarget.id);
        }}
        title="Delete Airline Record"
        message={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.name} (${deleteTarget.code})? Any associated simulated fare records for this carrier will also be removed.`
            : ''
        }
        confirmLabel="Delete Airline"
      />
    </div>
  );
}
