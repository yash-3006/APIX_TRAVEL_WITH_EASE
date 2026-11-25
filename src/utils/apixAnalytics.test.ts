import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateAirlineComparison,
  aggregateTrendSeries,
  buildSearchResults,
  calculatePriceIndex,
  classifyFarePeriod,
  computeFareStats,
  formatDuration,
  formatINR,
  validateAirlineInput,
  validateEmail,
  validateFareInput,
  validateRouteInput,
} from './apixAnalytics';
import { Airline, FareRecord, RouteRecord } from '../types/apix';

const sampleAirlines: Airline[] = [
  {
    id: 'al-1',
    code: '6E',
    name: 'IndiGo',
    carrierType: 'Low-Cost',
    hub: 'DEL',
    onTimePercent: 86,
    baggageKg: 15,
    status: 'Active',
    brandColor: '#1d4ed8',
  },
  {
    id: 'al-2',
    code: 'UK',
    name: 'Vistara',
    carrierType: 'Full-Service',
    hub: 'DEL',
    onTimePercent: 89,
    baggageKg: 20,
    status: 'Active',
    brandColor: '#5b21b6',
  },
];

const sampleRoutes: RouteRecord[] = [
  {
    id: 'rt-1',
    sourceCode: 'DEL',
    sourceCity: 'New Delhi',
    destinationCode: 'BOM',
    destinationCity: 'Mumbai',
    distanceKm: 1148,
    avgDurationMin: 130,
    baselineFare: 5000,
    status: 'Active',
  },
];

const sampleRecords: FareRecord[] = [
  {
    id: 'f-1',
    routeId: 'rt-1',
    airlineId: 'al-1',
    date: '2026-01-15',
    fare: 4500,
    cabinClass: 'Economy',
    stops: 0,
    departureTime: '06:30',
    arrivalTime: '08:40',
    flightNumber: '6E-201',
  },
  {
    id: 'f-2',
    routeId: 'rt-1',
    airlineId: 'al-2',
    date: '2026-01-15',
    fare: 6000,
    cabinClass: 'Economy',
    stops: 0,
    departureTime: '09:15',
    arrivalTime: '11:25',
    flightNumber: 'UK-945',
  },
  {
    id: 'f-3',
    routeId: 'rt-1',
    airlineId: 'al-1',
    date: '2025-07-10',
    fare: 5000,
    cabinClass: 'Economy',
    stops: 1,
    departureTime: '14:00',
    arrivalTime: '17:25',
    flightNumber: '6E-512',
  },
];

test('calculatePriceIndex returns accurate base-100 index', () => {
  assert.equal(calculatePriceIndex(5000, 5000), 100);
  assert.equal(calculatePriceIndex(5750, 5000), 115);
  assert.equal(calculatePriceIndex(4500, 5000), 90);
  assert.equal(calculatePriceIndex(5000, 0), 100);
});

test('classifyFarePeriod classifies Low, Moderate, and High correctly', () => {
  assert.equal(classifyFarePeriod(92), 'Low');
  assert.equal(classifyFarePeriod(95), 'Low');
  assert.equal(classifyFarePeriod(102), 'Moderate');
  assert.equal(classifyFarePeriod(110), 'High');
  assert.equal(classifyFarePeriod(128), 'High');
  // Custom thresholds
  assert.equal(classifyFarePeriod(98, { lowMax: 100, highMin: 120 }), 'Low');
});

test('computeFareStats computes min, max, avg, and handles empty array', () => {
  assert.deepEqual(computeFareStats([]), { min: 0, max: 0, avg: 0, count: 0 });
  assert.deepEqual(computeFareStats([4500, 5000, 6000]), {
    min: 4500,
    max: 6000,
    avg: 5167,
    count: 3,
  });
});

test('buildSearchResults filters by route, airline, maxFare, stops and sorts', () => {
  const all = buildSearchResults(sampleRecords, sampleRoutes, sampleAirlines, {
    sourceCode: 'DEL',
    destinationCode: 'BOM',
    travelDate: '2026-01-15',
    passengers: 2,
    airlineIds: [],
    maxFare: 15000,
    stops: 'all',
    sortBy: 'fare-asc',
  });
  assert.equal(all.length, 2);
  assert.equal(all[0].airlineCode, '6E');
  assert.equal(all[0].totalFare, 9000);
  assert.equal(all[1].airlineCode, 'UK');

  const onlyVistara = buildSearchResults(sampleRecords, sampleRoutes, sampleAirlines, {
    sourceCode: 'DEL',
    destinationCode: 'BOM',
    travelDate: '2026-01-15',
    passengers: 1,
    airlineIds: ['al-2'],
    maxFare: 15000,
    stops: 'all',
    sortBy: 'fare-asc',
  });
  assert.equal(onlyVistara.length, 1);
  assert.equal(onlyVistara[0].airlineName, 'Vistara');
});

test('aggregateTrendSeries groups monthly and yearly periods', () => {
  const yearly = aggregateTrendSeries(sampleRecords, sampleRoutes[0], 'yearly');
  assert.equal(yearly.length, 2);
  assert.equal(yearly[0].period, '2025');
  assert.equal(yearly[0].avgFare, 5000);
  assert.equal(yearly[1].period, '2026');
  assert.equal(yearly[1].avgFare, 5250);
  assert.equal(yearly[1].priceIndex, 105);

  const monthly2026 = aggregateTrendSeries(sampleRecords, sampleRoutes[0], 'monthly', undefined, '2026');
  assert.equal(monthly2026.length, 1);
  assert.equal(monthly2026[0].label, 'Jan 26');
});

test('aggregateAirlineComparison summarizes selected carriers sorted by average fare', () => {
  const comparison = aggregateAirlineComparison(
    sampleRecords,
    sampleAirlines,
    sampleRoutes[0],
    ['al-1', 'al-2']
  );
  assert.equal(comparison.length, 2);
  assert.equal(comparison[0].airlineCode, '6E');
  assert.equal(comparison[0].avgFare, 4750);
  assert.equal(comparison[1].airlineCode, 'UK');
  assert.equal(comparison[1].avgFare, 6000);
});

test('formatters and validators enforce SRS input constraints', () => {
  assert.equal(formatINR(12500), '₹12,500');
  assert.equal(formatDuration(130), '2h 10m');
  assert.equal(validateEmail('arjun.mehta@apix.in'), true);
  assert.equal(validateEmail('not-an-email'), false);

  const fareErrs = validateFareInput({
    routeId: '',
    airlineId: 'al-1',
    date: 'bad-date',
    fare: 500,
    flightNumber: 'A',
  });
  assert.ok(fareErrs.routeId);
  assert.ok(fareErrs.date);
  assert.ok(fareErrs.fare);
  assert.ok(fareErrs.flightNumber);

  const airlineErrs = validateAirlineInput(
    { code: '6E', name: 'Duplicate', hub: 'DEL', onTimePercent: 85, baggageKg: 15 },
    sampleAirlines
  );
  assert.ok(airlineErrs.code);

  const routeErrs = validateRouteInput(
    { sourceCode: 'DEL', destinationCode: 'DEL', distanceKm: 50, avgDurationMin: 10, baselineFare: 500 },
    sampleRoutes
  );
  assert.ok(routeErrs.destinationCode);
  assert.ok(routeErrs.distanceKm);
  assert.ok(routeErrs.baselineFare);
});
