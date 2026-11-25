import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  GitCompareArrows,
  Plane,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useApix } from '../../context/ApixContext';
import { INDIAN_AIRPORTS } from '../../data/mockData';
import { FlightSearchCriteria } from '../../types/apix';
import {
  buildSearchResults,
  formatDuration,
  formatINR,
} from '../../utils/apixAnalytics';
import { EmptyState, FareBandTag } from '../../components/ui/CommonUI';

export function FlightSearchPage() {
  const {
    routes,
    airlines,
    fareRecords,
    thresholds,
    searchPrefill,
    setSearchPrefill,
    recordSearch,
    navigateToCompare,
    currentUser,
    toggleTrackedRoute,
    pushToast,
  } = useApix();

  const [sourceCode, setSourceCode] = useState(searchPrefill.sourceCode);
  const [destinationCode, setDestinationCode] = useState(searchPrefill.destinationCode);
  const [travelDate, setTravelDate] = useState(searchPrefill.travelDate);
  const [passengers, setPassengers] = useState(searchPrefill.passengers);

  // Active applied query state
  const [appliedQuery, setAppliedQuery] = useState({
    sourceCode: searchPrefill.sourceCode,
    destinationCode: searchPrefill.destinationCode,
    travelDate: searchPrefill.travelDate,
    passengers: searchPrefill.passengers,
  });

  // Filters
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [maxFare, setMaxFare] = useState<number>(15000);
  const [stops, setStops] = useState<FlightSearchCriteria['stops']>('all');
  const [sortBy, setSortBy] = useState<FlightSearchCriteria['sortBy']>('fare-asc');
  const [isSearching, setIsSearching] = useState(false);
  const [compareAirlineIds, setCompareAirlineIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync if user jumped from Dashboard quick search or top search bar
  useEffect(() => {
    setSourceCode(searchPrefill.sourceCode);
    setDestinationCode(searchPrefill.destinationCode);
    setTravelDate(searchPrefill.travelDate);
    setPassengers(searchPrefill.passengers);
    setAppliedQuery(searchPrefill);
    setCompareAirlineIds([]);
  }, [searchPrefill]);

  const activeAirlines = useMemo(
    () => airlines.filter((a) => a.status === 'Active'),
    [airlines]
  );

  const matchedRoute = useMemo(
    () =>
      routes.find(
        (r) =>
          r.sourceCode === appliedQuery.sourceCode &&
          r.destinationCode === appliedQuery.destinationCode
      ),
    [routes, appliedQuery]
  );

  const results = useMemo(
    () =>
      buildSearchResults(
        fareRecords,
        routes,
        airlines,
        {
          ...appliedQuery,
          airlineIds: selectedAirlines,
          maxFare,
          stops,
          sortBy,
        },
        thresholds
      ),
    [fareRecords, routes, airlines, appliedQuery, selectedAirlines, maxFare, stops, sortBy, thresholds]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceCode === destinationCode) {
      setFormError('Source and destination airports must be different.');
      return;
    }
    setFormError(null);
    setIsSearching(true);
    const nextPrefill = { sourceCode, destinationCode, travelDate, passengers };
    window.setTimeout(() => {
      setAppliedQuery(nextPrefill);
      setSearchPrefill(nextPrefill);
      recordSearch(nextPrefill);
      setCompareAirlineIds([]);
      setIsSearching(false);
    }, 240);
  };

  const handleSwap = () => {
    setSourceCode(destinationCode);
    setDestinationCode(sourceCode);
    setFormError(null);
  };

  const toggleAirlineFilter = (id: string) => {
    setSelectedAirlines((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleCompareCarrier = (airlineId: string, airlineName: string) => {
    const exists = compareAirlineIds.includes(airlineId);
    if (exists) {
      setCompareAirlineIds((prev) => prev.filter((id) => id !== airlineId));
    } else {
      setCompareAirlineIds((prev) => [...prev, airlineId]);
      pushToast({
        type: 'info',
        title: `Added ${airlineName} to comparison`,
      });
    }
  };

  const resetFilters = () => {
    setSelectedAirlines([]);
    setMaxFare(15000);
    setStops('all');
    setSortBy('fare-asc');
  };

  const isRouteTracked = matchedRoute
    ? currentUser?.trackedRouteIds.includes(matchedRoute.id)
    : false;

  return (
    <div className="space-y-6">
      {/* Search Bar Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Search Domestic Flights</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare simulated historical and seasonal fares across Indian airlines in INR (₹).
            </p>
          </div>
          {matchedRoute && (
            <button
              type="button"
              onClick={() => toggleTrackedRoute(matchedRoute.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                isRouteTracked
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isRouteTracked ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>Tracking {matchedRoute.sourceCode} → {matchedRoute.destinationCode}</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Track Route</span>
                </>
              )}
            </button>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-3">
            <label htmlFor="fs-source" className="block text-xs font-semibold text-slate-600 mb-1">
              Origin
            </label>
            <select
              id="fs-source"
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
              aria-label="Swap origin and destination"
              className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="fs-dest" className="block text-xs font-semibold text-slate-600 mb-1">
              Destination
            </label>
            <select
              id="fs-dest"
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
            <label htmlFor="fs-date" className="block text-xs font-semibold text-slate-600 mb-1">
              Travel Date
            </label>
            <input
              id="fs-date"
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <div className="lg:col-span-1">
            <label htmlFor="fs-pax" className="block text-xs font-semibold text-slate-600 mb-1">
              Pax
            </label>
            <select
              id="fs-pax"
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              className="w-full px-2.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </form>

        {formError && (
          <p role="alert" className="text-xs font-medium text-rose-600 mt-3">
            {formError}
          </p>
        )}

        {/* Quick popular route shortcuts */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3.5 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">Available corridors:</span>
          {routes.slice(0, 6).map((r) => {
            const isCurrent =
              r.sourceCode === appliedQuery.sourceCode &&
              r.destinationCode === appliedQuery.destinationCode;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  const next = {
                    sourceCode: r.sourceCode,
                    destinationCode: r.destinationCode,
                    travelDate,
                    passengers,
                  };
                  setSourceCode(r.sourceCode);
                  setDestinationCode(r.destinationCode);
                  setAppliedQuery(next);
                  setSearchPrefill(next);
                  recordSearch(next);
                  setCompareAirlineIds([]);
                }}
                className={`px-2.5 py-1 rounded-md font-mono transition-colors ${
                  isCurrent
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {r.sourceCode}→{r.destinationCode}
              </button>
            );
          })}
        </div>
      </section>

      {/* Filters + Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Filter Sidebar */}
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Filter Flights</h2>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Reset
            </button>
          </div>

          {/* Max Fare Range */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <label htmlFor="fare-range" className="font-semibold text-slate-700">
                Max Fare (per pax)
              </label>
              <span className="font-mono tabular-nums font-semibold text-blue-700">
                {formatINR(maxFare)}
              </span>
            </div>
            <input
              id="fare-range"
              type="range"
              min={3000}
              max={15000}
              step={250}
              value={maxFare}
              onChange={(e) => setMaxFare(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
              <span>₹3,000</span>
              <span>₹15,000</span>
            </div>
          </div>

          {/* Stops Segmented Control */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-700 mb-2">Stops</p>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'all', label: 'Any' },
                  { id: 'nonstop', label: 'Non-stop' },
                  { id: '1stop', label: '1 Stop' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStops(opt.id)}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                    stops === opt.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Airlines Checkbox Filter */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-700 mb-2.5">Airlines</p>
            <div className="space-y-2">
              {activeAirlines.map((airline) => {
                const checked = selectedAirlines.includes(airline.id);
                return (
                  <label
                    key={airline.id}
                    className="flex items-center justify-between gap-2 text-sm text-slate-700 cursor-pointer hover:text-slate-900"
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAirlineFilter(airline.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium">{airline.name}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {airline.code}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Results Column */}
        <div className="lg:col-span-9 space-y-4">
          {/* Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900 font-mono">
                {appliedQuery.sourceCode} → {appliedQuery.destinationCode}
              </span>
              <span className="mx-2 text-slate-300">·</span>
              <span className="text-xs text-slate-500">
                {results.length} {results.length === 1 ? 'flight' : 'flights'} for{' '}
                {appliedQuery.travelDate} · {appliedQuery.passengers} pax
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="fs-sort" className="text-xs font-medium text-slate-500">
                Sort by
              </label>
              <select
                id="fs-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as FlightSearchCriteria['sortBy'])}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="fare-asc">Lowest Fare</option>
                <option value="fare-desc">Highest Fare</option>
                <option value="departure">Earliest Departure</option>
                <option value="duration">Shortest Duration</option>
              </select>
            </div>
          </div>

          {/* Active Comparison Tray */}
          {compareAirlineIds.length > 0 && matchedRoute && (
            <div className="bg-slate-900 text-white rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm">
                <GitCompareArrows className="w-4 h-4 text-blue-400" />
                <span>
                  <strong>{compareAirlineIds.length}</strong>{' '}
                  {compareAirlineIds.length === 1 ? 'airline' : 'airlines'} selected for{' '}
                  <span className="font-mono">
                    {matchedRoute.sourceCode} → {matchedRoute.destinationCode}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setCompareAirlineIds([])}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => navigateToCompare(matchedRoute.id, compareAirlineIds)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Open Fare Comparison
                </button>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {isSearching ? (
            <div className="space-y-3" aria-busy="true">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse flex items-center justify-between gap-4"
                >
                  <div className="space-y-2 w-1/3">
                    <div className="h-4 bg-slate-200 rounded w-32" />
                    <div className="h-3 bg-slate-100 rounded w-24" />
                  </div>
                  <div className="h-6 bg-slate-100 rounded w-1/4" />
                  <div className="h-8 bg-slate-200 rounded w-24" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              title="No matching flights found"
              description={
                matchedRoute
                  ? 'No flights match your current airline, stop, or maximum fare filters. Try loosening the filters.'
                  : `No simulated corridor exists yet for ${appliedQuery.sourceCode} → ${appliedQuery.destinationCode}. Choose one of the available domestic corridors above.`
              }
              actionLabel={matchedRoute ? 'Reset Filters' : 'Search DEL → BOM'}
              onAction={() => {
                if (matchedRoute) {
                  resetFilters();
                } else {
                  const fallback = {
                    sourceCode: 'DEL',
                    destinationCode: 'BOM',
                    travelDate,
                    passengers,
                  };
                  setSourceCode('DEL');
                  setDestinationCode('BOM');
                  setAppliedQuery(fallback);
                  setSearchPrefill(fallback);
                }
              }}
            />
          ) : (
            <div className="space-y-3">
              {results.map((flight) => {
                const isCompared = compareAirlineIds.includes(flight.airlineId);
                return (
                  <article
                    key={flight.id}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    {/* Airline info */}
                    <div className="flex items-center gap-3.5 md:w-48 shrink-0">
                      <span
                        className="w-10 h-10 rounded-lg text-white font-mono font-bold text-xs flex items-center justify-center shrink-0"
                        style={{ backgroundColor: flight.airlineColor }}
                      >
                        {flight.airlineCode}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {flight.airlineName}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {flight.flightNumber} · {flight.cabinClass}
                        </p>
                      </div>
                    </div>

                    {/* Schedule timeline */}
                    <div className="flex items-center gap-4 flex-1 justify-between sm:justify-center max-w-md">
                      <div className="text-left">
                        <p className="text-lg font-bold font-mono tabular-nums text-slate-900">
                          {flight.departureTime}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {flight.sourceCode}
                        </p>
                      </div>

                      <div className="flex-1 flex flex-col items-center px-2 min-w-[100px]">
                        <span className="text-[11px] font-medium text-slate-500">
                          {formatDuration(flight.durationMin)}
                        </span>
                        <div className="w-full flex items-center gap-1 my-1">
                          <div className="h-[1px] bg-slate-300 flex-1" />
                          <Plane className="w-3.5 h-3.5 text-slate-400" />
                          <div className="h-[1px] bg-slate-300 flex-1" />
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {flight.stops === 0 ? 'Non-stop' : '1 Stop'} · {flight.baggageKg}kg
                        </span>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold font-mono tabular-nums text-slate-900">
                          {flight.arrivalTime}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {flight.destinationCode}
                        </p>
                      </div>
                    </div>

                    {/* Price & Compare action */}
                    <div className="flex sm:flex-row md:flex-col items-center md:items-end justify-between gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 md:w-52 shrink-0">
                      <div className="md:text-right">
                        <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
                          {formatINR(flight.farePerPassenger)}
                        </p>
                        {appliedQuery.passengers > 1 ? (
                          <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                            Total {formatINR(flight.totalFare)} ({appliedQuery.passengers} pax)
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                            Index {flight.priceIndex} · OTP {flight.onTimePercent}%
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <FareBandTag band={flight.band} />
                        <button
                          type="button"
                          onClick={() =>
                            toggleCompareCarrier(flight.airlineId, flight.airlineName)
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 whitespace-nowrap ${
                            isCompared
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isCompared && <Check className="w-3.5 h-3.5" />}
                          <span>{isCompared ? 'Selected' : 'Compare'}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
