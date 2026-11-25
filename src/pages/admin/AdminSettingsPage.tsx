import React, { useState } from 'react';
import { Download, RotateCcw, Save } from 'lucide-react';
import { useApix } from '../../context/ApixContext';
import { ConfirmDialog } from '../../components/ui/CommonUI';

export function AdminSettingsPage() {
  const {
    thresholds,
    updateThresholds,
    resetDemoDataset,
    airlines,
    routes,
    fareRecords,
    pushToast,
  } = useApix();

  const [lowMax, setLowMax] = useState(thresholds.lowMax);
  const [highMin, setHighMin] = useState(thresholds.highMin);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    if (lowMax < 70 || lowMax > 105) {
      setError('Low fare upper threshold must be between 70 and 105.');
      return;
    }
    if (highMin <= lowMax + 5 || highMin > 140) {
      setError('High fare threshold must be at least 5 points above Low threshold (max 140).');
      return;
    }
    setError(null);
    updateThresholds({ lowMax, highMin });
  };

  const handleExportSnapshot = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      thresholds,
      airlinesCount: airlines.length,
      routesCount: routes.length,
      fareRecordsCount: fareRecords.length,
      airlines,
      routes,
      fareRecords,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `apix-dataset-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    pushToast({
      type: 'success',
      title: 'Dataset backup downloaded',
      description: 'Exported airlines, routes, and historical fare records as JSON.',
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Index Classification Settings */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="pb-4 border-b border-slate-100 mb-5">
          <h1 className="text-xl font-bold text-slate-900">System Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Airfare Price Index classification bands and manage the simulated local dataset.
          </p>
        </div>

        <form onSubmit={handleSaveThresholds} className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Fare Period Classification Thresholds (Base Index = 100)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="set-low" className="block text-xs font-semibold text-slate-700 mb-1">
                Low Fare Threshold (Index ≤)
              </label>
              <input
                id="set-low"
                type="number"
                value={lowMax}
                onChange={(e) => setLowMax(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Periods with index ≤ {lowMax} are labeled Low Fare.
              </p>
            </div>

            <div>
              <label htmlFor="set-high" className="block text-xs font-semibold text-slate-700 mb-1">
                High Fare Threshold (Index ≥)
              </label>
              <input
                id="set-high"
                type="number"
                value={highMin}
                onChange={(e) => setHighMin(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Periods with index ≥ {highMin} are labeled High Fare.
              </p>
            </div>
          </div>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Index Thresholds</span>
            </button>
          </div>
        </form>
      </section>

      {/* Dataset Backup & Reset */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Local Dataset Snapshot & Recovery
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All changes are stored locally in your browser via localStorage. Export a JSON snapshot or restore the original Indian domestic dataset.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportSnapshot}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Simulated Dataset</span>
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetDemoDataset}
        title="Reset Simulated Dataset"
        message="This will restore all airlines, routes, historical fare records, and thresholds back to the default APIX seed data."
        confirmLabel="Restore Defaults"
      />
    </div>
  );
}
