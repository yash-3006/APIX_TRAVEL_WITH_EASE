import {
  Airline,
  AirlineComparisonRow,
  FareBand,
  FareRecord,
  FlightResultItem,
  FlightSearchCriteria,
  IndexThresholds,
  RouteRecord,
  TrendPoint,
} from '../types/apix';

export const DEFAULT_THRESHOLDS: IndexThresholds = {
  lowMax: 95,
  highMin: 110,
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatINR(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₹${safeAmount.toLocaleString('en-IN')}`;
}

export function formatDuration(minutes: number): string {
  const safeMin = Math.max(0, Math.round(minutes));
  const hrs = Math.floor(safeMin / 60);
  const mins = safeMin % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export function calculatePriceIndex(fare: number, baselineFare: number): number {
  if (!Number.isFinite(fare) || !Number.isFinite(baselineFare) || baselineFare <= 0) {
    return 100;
  }
  return Math.round((fare / baselineFare) * 1000) / 10;
}

export function classifyFarePeriod(
  indexValue: number,
  thresholds: IndexThresholds = DEFAULT_THRESHOLDS
): FareBand {
  if (indexValue <= thresholds.lowMax) return 'Low';
  if (indexValue >= thresholds.highMin) return 'High';
  return 'Moderate';
}

export function computeFareStats(fares: number[]): {
  min: number;
  max: number;
  avg: number;
  count: number;
} {
  const valid = fares.filter((f) => Number.isFinite(f) && f > 0);
  if (valid.length === 0) {
    return { min: 0, max: 0, avg: 0, count: 0 };
  }
  let min = valid[0];
  let max = valid[0];
  let sum = 0;
  for (const fare of valid) {
    if (fare < min) min = fare;
    if (fare > max) max = fare;
    sum += fare;
  }
  return {
    min: Math.round(min),
    max: Math.round(max),
    avg: Math.round(sum / valid.length),
    count: valid.length,
  };
}

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

export function buildSearchResults(
  records: FareRecord[],
  routes: RouteRecord[],
  airlines: Airline[],
  criteria: FlightSearchCriteria,
  thresholds: IndexThresholds = DEFAULT_THRESHOLDS
): FlightResultItem[] {
  const routeMap = new Map(routes.map((r) => [r.id, r]));
  const airlineMap = new Map(airlines.map((a) => [a.id, a]));

  const matchingRoutes = routes.filter(
    (r) =>
      r.sourceCode === criteria.sourceCode &&
      r.destinationCode === criteria.destinationCode
  );
  if (matchingRoutes.length === 0) {
    return [];
  }
  const matchingRouteIds = new Set(matchingRoutes.map((r) => r.id));

  // Filter records matching the requested route
  const routeRecords = records.filter((rec) => matchingRouteIds.has(rec.routeId));
  if (routeRecords.length === 0) return [];

  // Derive date-based deterministic seasonal multiplier when the exact travelDate isn't in the historical table,
  // while still matching exact-month records first so date selection meaningfully affects returned fares.
  const requestedMonth = criteria.travelDate ? criteria.travelDate.slice(0, 7) : '';
  const requestedMonthNum = criteria.travelDate
    ? Number(criteria.travelDate.slice(5, 7))
    : 11;

  // Prefer records from the same month or latest year; deduplicate by airline + flightNumber to produce clean schedule rows
  const exactMonthRecords = routeRecords.filter(
    (rec) => requestedMonth && rec.date.startsWith(requestedMonth)
  );
  const candidatePool =
    exactMonthRecords.length >= 3
      ? exactMonthRecords
      : routeRecords.filter((rec) => rec.date.startsWith('2026'));

  const poolToUse = candidatePool.length > 0 ? candidatePool : routeRecords;

  // Keep unique flight numbers (most recent record per flightNumber)
  const latestByFlight = new Map<string, FareRecord>();
  for (const rec of poolToUse) {
    const key = `${rec.airlineId}-${rec.flightNumber}`;
    const existing = latestByFlight.get(key);
    if (!existing || rec.date > existing.date) {
      latestByFlight.set(key, rec);
    }
  }

  // Subtle deterministic day-of-week & seasonal factor if exact date differs
  const dayVal = criteria.travelDate
    ? new Date(`${criteria.travelDate}T00:00:00`).getDay()
    : 3;
  const weekendFactor = dayVal === 0 || dayVal === 5 || dayVal === 6 ? 1.07 : 0.98;
  const peakMonthFactor =
    requestedMonthNum === 10 || requestedMonthNum === 11 || requestedMonthNum === 12 || requestedMonthNum === 5
      ? 1.06
      : requestedMonthNum === 2 || requestedMonthNum === 8 || requestedMonthNum === 9
      ? 0.94
      : 1.0;

  const passengers = Math.max(1, criteria.passengers);

  const items: FlightResultItem[] = [];
  for (const rec of latestByFlight.values()) {
    const route = routeMap.get(rec.routeId);
    const airline = airlineMap.get(rec.airlineId);
    if (!route || !airline || airline.status !== 'Active') continue;

    if (
      criteria.airlineIds.length > 0 &&
      !criteria.airlineIds.includes(airline.id)
    ) {
      continue;
    }

    if (criteria.stops === 'nonstop' && rec.stops !== 0) continue;
    if (criteria.stops === '1stop' && rec.stops !== 1) continue;

    const isExactDate = criteria.travelDate === rec.date;
    const adjustedFare = isExactDate
      ? rec.fare
      : Math.round((rec.fare * weekendFactor * peakMonthFactor) / 10) * 10;

    if (adjustedFare > criteria.maxFare) continue;

    const durationMin = route.avgDurationMin + (rec.stops === 1 ? 75 : 0);
    const priceIndex = calculatePriceIndex(adjustedFare, route.baselineFare);
    const band = classifyFarePeriod(priceIndex, thresholds);

    items.push({
      id: `${rec.id}-${criteria.travelDate || rec.date}`,
      routeId: route.id,
      airlineId: airline.id,
      airlineName: airline.name,
      airlineCode: airline.code,
      airlineColor: airline.brandColor,
      flightNumber: rec.flightNumber,
      sourceCode: route.sourceCode,
      sourceCity: route.sourceCity,
      destinationCode: route.destinationCode,
      destinationCity: route.destinationCity,
      departureTime: rec.departureTime,
      arrivalTime: rec.arrivalTime,
      durationMin,
      stops: rec.stops,
      cabinClass: rec.cabinClass,
      farePerPassenger: adjustedFare,
      totalFare: adjustedFare * passengers,
      priceIndex,
      band,
      onTimePercent: airline.onTimePercent,
      baggageKg: airline.baggageKg,
      date: criteria.travelDate || rec.date,
    });
  }

  return items.sort((a, b) => {
    switch (criteria.sortBy) {
      case 'fare-desc':
        return b.farePerPassenger - a.farePerPassenger;
      case 'departure':
        return parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime);
      case 'duration':
        return a.durationMin - b.durationMin;
      case 'fare-asc':
      default:
        return a.farePerPassenger - b.farePerPassenger;
    }
  });
}

export function aggregateTrendSeries(
  records: FareRecord[],
  route: RouteRecord | undefined,
  granularity: 'monthly' | 'quarterly' | 'yearly',
  thresholds: IndexThresholds = DEFAULT_THRESHOLDS,
  yearFilter = '2026'
): TrendPoint[] {
  const filtered = route
    ? records.filter((r) => r.routeId === route.id)
    : records;

  const baselineFare = route ? route.baselineFare : 5500;
  const buckets = new Map<string, { label: string; fares: number[] }>();

  for (const rec of filtered) {
    const [year, monthStr] = rec.date.split('-');
    const monthIndex = Math.max(0, Math.min(11, Number(monthStr) - 1));

    if (granularity === 'monthly') {
      if (yearFilter !== 'all' && year !== yearFilter) continue;
      const key = `${year}-${monthStr}`;
      const label = `${MONTH_NAMES[monthIndex]} ${year.slice(2)}`;
      const entry = buckets.get(key) ?? { label, fares: [] };
      entry.fares.push(rec.fare);
      buckets.set(key, entry);
    } else if (granularity === 'quarterly') {
      if (yearFilter !== 'all' && year !== yearFilter) continue;
      const q = Math.floor(monthIndex / 3) + 1;
      const key = `${year}-Q${q}`;
      const label = `Q${q} ${year}`;
      const entry = buckets.get(key) ?? { label, fares: [] };
      entry.fares.push(rec.fare);
      buckets.set(key, entry);
    } else {
      const key = year;
      const label = year;
      const entry = buckets.get(key) ?? { label, fares: [] };
      entry.fares.push(rec.fare);
      buckets.set(key, entry);
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => {
      const stats = computeFareStats(data.fares);
      const priceIndex = calculatePriceIndex(stats.avg, baselineFare);
      return {
        period,
        label: data.label,
        avgFare: stats.avg,
        minFare: stats.min,
        maxFare: stats.max,
        priceIndex,
        band: classifyFarePeriod(priceIndex, thresholds),
        recordCount: stats.count,
      };
    });
}

export function aggregateAirlineComparison(
  records: FareRecord[],
  airlines: Airline[],
  route: RouteRecord | undefined,
  selectedAirlineIds: string[],
  thresholds: IndexThresholds = DEFAULT_THRESHOLDS
): AirlineComparisonRow[] {
  const baselineFare = route ? route.baselineFare : 5500;
  const targetAirlines =
    selectedAirlineIds.length > 0
      ? airlines.filter((a) => selectedAirlineIds.includes(a.id))
      : airlines.filter((a) => a.status === 'Active');

  const routeRecords = route
    ? records.filter((r) => r.routeId === route.id)
    : records;

  const rows: AirlineComparisonRow[] = [];
  for (const airline of targetAirlines) {
    const airlineFares = routeRecords
      .filter((r) => r.airlineId === airline.id)
      .map((r) => r.fare);
    if (airlineFares.length === 0) continue;

    const stats = computeFareStats(airlineFares);
    const priceIndex = calculatePriceIndex(stats.avg, baselineFare);
    rows.push({
      airlineId: airline.id,
      airlineCode: airline.code,
      airlineName: airline.name,
      brandColor: airline.brandColor,
      carrierType: airline.carrierType,
      minFare: stats.min,
      avgFare: stats.avg,
      maxFare: stats.max,
      priceIndex,
      band: classifyFarePeriod(priceIndex, thresholds),
      onTimePercent: airline.onTimePercent,
      baggageKg: airline.baggageKg,
      flightCount: stats.count,
    });
  }

  return rows.sort((a, b) => a.avgFare - b.avgFare);
}

// Validation helpers (SRS REQ-2, REQ-16, Quality Attributes: Robustness)

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function validateFareInput(input: {
  routeId: string;
  airlineId: string;
  date: string;
  fare: number;
  flightNumber: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.routeId) errors.routeId = 'Please select a route.';
  if (!input.airlineId) errors.airlineId = 'Please select an airline.';
  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.date = 'Enter a valid date (YYYY-MM-DD).';
  }
  if (!Number.isFinite(input.fare) || input.fare < 1000 || input.fare > 150000) {
    errors.fare = 'Fare must be between ₹1,000 and ₹1,50,000.';
  }
  if (!input.flightNumber.trim() || input.flightNumber.trim().length < 3) {
    errors.flightNumber = 'Flight number must be at least 3 characters (e.g., 6E-204).';
  }
  return errors;
}

export function validateAirlineInput(
  input: {
    code: string;
    name: string;
    hub: string;
    onTimePercent: number;
    baggageKg: number;
  },
  existingAirlines: Airline[],
  editingId?: string
): Record<string, string> {
  const errors: Record<string, string> = {};
  const cleanCode = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9]{2}$/.test(cleanCode)) {
    errors.code = 'IATA code must be exactly 2 alphanumeric characters (e.g., 6E).';
  } else if (
    existingAirlines.some(
      (a) => a.code.toUpperCase() === cleanCode && a.id !== editingId
    )
  ) {
    errors.code = `IATA code ${cleanCode} already exists.`;
  }
  if (!input.name.trim() || input.name.trim().length < 2) {
    errors.name = 'Airline name must be at least 2 characters.';
  }
  if (!input.hub.trim() || input.hub.trim().length < 3) {
    errors.hub = 'Primary hub is required.';
  }
  if (!Number.isFinite(input.onTimePercent) || input.onTimePercent < 40 || input.onTimePercent > 100) {
    errors.onTimePercent = 'On-time performance must be between 40% and 100%.';
  }
  if (!Number.isFinite(input.baggageKg) || input.baggageKg < 7 || input.baggageKg > 50) {
    errors.baggageKg = 'Baggage allowance must be between 7 kg and 50 kg.';
  }
  return errors;
}

export function validateRouteInput(
  input: {
    sourceCode: string;
    destinationCode: string;
    distanceKm: number;
    avgDurationMin: number;
    baselineFare: number;
  },
  existingRoutes: RouteRecord[],
  editingId?: string
): Record<string, string> {
  const errors: Record<string, string> = {};
  const src = input.sourceCode.trim().toUpperCase();
  const dst = input.destinationCode.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(src)) {
    errors.sourceCode = 'Source airport must be a 3-letter IATA code.';
  }
  if (!/^[A-Z]{3}$/.test(dst)) {
    errors.destinationCode = 'Destination airport must be a 3-letter IATA code.';
  }
  if (src && dst && src === dst) {
    errors.destinationCode = 'Destination airport must differ from source airport.';
  }
  if (
    src &&
    dst &&
    existingRoutes.some(
      (r) =>
        r.sourceCode === src &&
        r.destinationCode === dst &&
        r.id !== editingId
    )
  ) {
    errors.destinationCode = `Route ${src} → ${dst} already exists.`;
  }
  if (!Number.isFinite(input.distanceKm) || input.distanceKm < 100 || input.distanceKm > 5000) {
    errors.distanceKm = 'Distance must be between 100 km and 5,000 km.';
  }
  if (!Number.isFinite(input.avgDurationMin) || input.avgDurationMin < 30 || input.avgDurationMin > 480) {
    errors.avgDurationMin = 'Duration must be between 30 and 480 minutes.';
  }
  if (!Number.isFinite(input.baselineFare) || input.baselineFare < 1500 || input.baselineFare > 50000) {
    errors.baselineFare = 'Baseline fare must be between ₹1,500 and ₹50,000.';
  }
  return errors;
}
