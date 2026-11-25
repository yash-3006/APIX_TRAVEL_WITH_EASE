import React, { useState } from 'react';
import { ArrowRight, BookmarkX, Save, Trash2 } from 'lucide-react';
import { useApix } from '../../context/ApixContext';
import { INDIAN_AIRPORTS } from '../../data/mockData';
import { formatINR } from '../../utils/apixAnalytics';

export function ProfilePage() {
  const {
    currentUser,
    routes,
    recentSearches,
    updateCurrentUserProfile,
    toggleTrackedRoute,
    clearRecentSearches,
    navigateToSearch,
    setSelectedAnalyticsRouteId,
    setActivePage,
  } = useApix();

  const [name, setName] = useState(currentUser?.name ?? '');
  const [homeAirport, setHomeAirport] = useState(currentUser?.homeAirport ?? 'DEL');
  const [nameError, setNameError] = useState<string | null>(null);

  if (!currentUser) return null;

  const trackedRoutes = routes.filter((r) =>
    currentUser.trackedRouteIds.includes(r.id)
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setNameError('Display name must be at least 2 characters.');
      return;
    }
    setNameError(null);
    updateCurrentUserProfile({ name, homeAirport });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile Details Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="pb-4 border-b border-slate-100 mb-5">
          <h1 className="text-xl font-bold text-slate-900">Traveler Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your account details, default departure airport, and tracked domestic corridors.
          </p>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="prof-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              id="prof-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            />
            {nameError && <p className="text-xs text-rose-600 mt-1">{nameError}</p>}
          </div>

          <div>
            <label htmlFor="prof-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              id="prof-email"
              type="email"
              value={currentUser.email}
              disabled
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="prof-hub" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Preferred Departure Airport
            </label>
            <select
              id="prof-hub"
              value={homeAirport}
              onChange={(e) => setHomeAirport(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            >
              {INDIAN_AIRPORTS.map((ap) => (
                <option key={ap.code} value={ap.code}>
                  {ap.code} — {ap.city} ({ap.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              Account Metadata
            </span>
            <div className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
              Role: Traveler · Joined {currentUser.joinedDate}
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </section>

      {/* Tracked Routes Watchlist */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Tracked Routes ({trackedRoutes.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quick access to corridors you monitor on your dashboard
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActivePage('search')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Add from Flight Search
          </button>
        </div>

        {trackedRoutes.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">
            You have no tracked routes yet. Open Flight Search and click "Track Route" on any corridor.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {trackedRoutes.map((route) => (
              <div
                key={route.id}
                className="border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-mono font-bold text-sm text-slate-900">
                    {route.sourceCode} → {route.destinationCode}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {route.sourceCity} to {route.destinationCity} · Base{' '}
                    {formatINR(route.baselineFare)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAnalyticsRouteId(route.id);
                      setActivePage('analytics');
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md"
                  >
                    Trends
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTrackedRoute(route.id)}
                    aria-label={`Untrack route ${route.sourceCode} to ${route.destinationCode}`}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                  >
                    <BookmarkX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Search History */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Recent Search History
          </h2>
          {recentSearches.length > 0 && (
            <button
              type="button"
              onClick={clearRecentSearches}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {recentSearches.length === 0 ? (
          <p className="text-sm text-slate-500">No saved searches.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentSearches.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3 text-sm"
              >
                <div>
                  <span className="font-mono font-semibold text-slate-900">
                    {item.sourceCode} → {item.destinationCode}
                  </span>
                  <span className="text-xs text-slate-500 ml-2.5">
                    {item.travelDate} · {item.passengers} pax · {item.timestamp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigateToSearch({
                      sourceCode: item.sourceCode,
                      destinationCode: item.destinationCode,
                      travelDate: item.travelDate,
                      passengers: item.passengers,
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <span>Search Again</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
