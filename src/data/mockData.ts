import {
  ActivityLog,
  Airline,
  Airport,
  FareRecord,
  NotificationItem,
  RecentSearch,
  RouteRecord,
  UserAccount,
} from '../types/apix';

export const INDIAN_AIRPORTS: Airport[] = [
  { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi International Airport', state: 'Delhi' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport', state: 'Maharashtra' },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International Airport', state: 'Karnataka' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International Airport', state: 'Telangana' },
  { code: 'MAA', city: 'Chennai', name: 'Chennai International Airport', state: 'Tamil Nadu' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhas Chandra Bose International Airport', state: 'West Bengal' },
  { code: 'GOI', city: 'Goa', name: 'Goa International Airport (Dabolim)', state: 'Goa' },
  { code: 'PNQ', city: 'Pune', name: 'Pune International Airport', state: 'Maharashtra' },
  { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel International Airport', state: 'Gujarat' },
  { code: 'COK', city: 'Kochi', name: 'Cochin International Airport', state: 'Kerala' },
  { code: 'JAI', city: 'Jaipur', name: 'Jaipur International Airport', state: 'Rajasthan' },
];

export const INITIAL_AIRLINES: Airline[] = [
  {
    id: 'al-indigo',
    code: '6E',
    name: 'IndiGo',
    carrierType: 'Low-Cost',
    hub: 'DEL',
    onTimePercent: 87,
    baggageKg: 15,
    status: 'Active',
    brandColor: '#2563EB',
  },
  {
    id: 'al-airindia',
    code: 'AI',
    name: 'Air India',
    carrierType: 'Full-Service',
    hub: 'DEL',
    onTimePercent: 81,
    baggageKg: 25,
    status: 'Active',
    brandColor: '#DC2626',
  },
  {
    id: 'al-vistara',
    code: 'UK',
    name: 'Vistara',
    carrierType: 'Full-Service',
    hub: 'DEL',
    onTimePercent: 89,
    baggageKg: 20,
    status: 'Active',
    brandColor: '#6D28D9',
  },
  {
    id: 'al-akasa',
    code: 'QP',
    name: 'Akasa Air',
    carrierType: 'Low-Cost',
    hub: 'BOM',
    onTimePercent: 88,
    baggageKg: 15,
    status: 'Active',
    brandColor: '#EA580C',
  },
  {
    id: 'al-spicejet',
    code: 'SG',
    name: 'SpiceJet',
    carrierType: 'Low-Cost',
    hub: 'DEL',
    onTimePercent: 76,
    baggageKg: 15,
    status: 'Active',
    brandColor: '#E11D48',
  },
  {
    id: 'al-aix',
    code: 'IX',
    name: 'Air India Express',
    carrierType: 'Low-Cost',
    hub: 'COK',
    onTimePercent: 83,
    baggageKg: 15,
    status: 'Active',
    brandColor: '#0D9488',
  },
];

export const INITIAL_ROUTES: RouteRecord[] = [
  {
    id: 'rt-del-bom',
    sourceCode: 'DEL',
    sourceCity: 'New Delhi',
    destinationCode: 'BOM',
    destinationCity: 'Mumbai',
    distanceKm: 1148,
    avgDurationMin: 130,
    baselineFare: 5200,
    status: 'Active',
  },
  {
    id: 'rt-bom-del',
    sourceCode: 'BOM',
    sourceCity: 'Mumbai',
    destinationCode: 'DEL',
    destinationCity: 'New Delhi',
    distanceKm: 1148,
    avgDurationMin: 135,
    baselineFare: 5300,
    status: 'Active',
  },
  {
    id: 'rt-del-blr',
    sourceCode: 'DEL',
    sourceCity: 'New Delhi',
    destinationCode: 'BLR',
    destinationCity: 'Bengaluru',
    distanceKm: 1740,
    avgDurationMin: 165,
    baselineFare: 6400,
    status: 'Active',
  },
  {
    id: 'rt-bom-blr',
    sourceCode: 'BOM',
    sourceCity: 'Mumbai',
    destinationCode: 'BLR',
    destinationCity: 'Bengaluru',
    distanceKm: 842,
    avgDurationMin: 105,
    baselineFare: 4400,
    status: 'Active',
  },
  {
    id: 'rt-blr-hyd',
    sourceCode: 'BLR',
    sourceCity: 'Bengaluru',
    destinationCode: 'HYD',
    destinationCity: 'Hyderabad',
    distanceKm: 500,
    avgDurationMin: 75,
    baselineFare: 3600,
    status: 'Active',
  },
  {
    id: 'rt-del-goi',
    sourceCode: 'DEL',
    sourceCity: 'New Delhi',
    destinationCode: 'GOI',
    destinationCity: 'Goa',
    distanceKm: 1515,
    avgDurationMin: 155,
    baselineFare: 5900,
    status: 'Seasonal',
  },
  {
    id: 'rt-bom-goi',
    sourceCode: 'BOM',
    sourceCity: 'Mumbai',
    destinationCode: 'GOI',
    destinationCity: 'Goa',
    distanceKm: 435,
    avgDurationMin: 70,
    baselineFare: 3400,
    status: 'Active',
  },
  {
    id: 'rt-del-ccu',
    sourceCode: 'DEL',
    sourceCity: 'New Delhi',
    destinationCode: 'CCU',
    destinationCity: 'Kolkata',
    distanceKm: 1305,
    avgDurationMin: 135,
    baselineFare: 5400,
    status: 'Active',
  },
  {
    id: 'rt-hyd-maa',
    sourceCode: 'HYD',
    sourceCity: 'Hyderabad',
    destinationCode: 'MAA',
    destinationCity: 'Chennai',
    distanceKm: 515,
    avgDurationMin: 75,
    baselineFare: 3700,
    status: 'Active',
  },
  {
    id: 'rt-pnq-del',
    sourceCode: 'PNQ',
    sourceCity: 'Pune',
    destinationCode: 'DEL',
    destinationCity: 'New Delhi',
    distanceKm: 1173,
    avgDurationMin: 130,
    baselineFare: 5100,
    status: 'Active',
  },
];

// Deterministic seasonal pattern across 12 months (index multipliers relative to baseline)
const MONTHLY_SEASONALITY = [
  1.04, // Jan - New Year / Winter
  0.91, // Feb - Off-peak
  0.95, // Mar - Spring
  1.02, // Apr - Holiday start
  1.16, // May - Summer peak
  1.08, // Jun - Early monsoon
  0.93, // Jul - Monsoon dip
  0.89, // Aug - Low season
  0.92, // Sep - Pre-festive
  1.14, // Oct - Navratri / Dussehra
  1.22, // Nov - Diwali peak
  1.26, // Dec - Year-end peak
];

const CARRIER_MULTIPLIERS: Record<string, { factor: number; depTimes: string[]; flightPrefix: number; stopsBias: 0 | 1 }> = {
  'al-indigo': { factor: 0.94, depTimes: ['06:15', '13:40', '19:20'], flightPrefix: 210, stopsBias: 0 },
  'al-airindia': { factor: 1.09, depTimes: ['07:30', '15:10', '20:45'], flightPrefix: 604, stopsBias: 0 },
  'al-vistara': { factor: 1.15, depTimes: ['08:45', '17:05'], flightPrefix: 932, stopsBias: 0 },
  'al-akasa': { factor: 0.91, depTimes: ['09:50', '18:15'], flightPrefix: 1140, stopsBias: 0 },
  'al-spicejet': { factor: 0.96, depTimes: ['11:20', '21:10'], flightPrefix: 814, stopsBias: 1 },
  'al-aix': { factor: 0.93, depTimes: ['12:35'], flightPrefix: 442, stopsBias: 0 },
};

function addMinutesToTime(hhmm: string, addMin: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (h * 60 + m + addMin) % (24 * 60);
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function generateDeterministicHistoricalFares(): FareRecord[] {
  const records: FareRecord[] = [];
  let seq = 1;

  // 1. Generate complete 12-month 2026 dataset for all 10 routes across carriers
  INITIAL_ROUTES.forEach((route, rIdx) => {
    for (let month = 1; month <= 12; month++) {
      const seasonFactor = MONTHLY_SEASONALITY[month - 1];
      const monthStr = String(month).padStart(2, '0');

      INITIAL_AIRLINES.forEach((airline, aIdx) => {
        // Assign 5 carriers per route, all 6 for major trunk routes
        if (rIdx > 3 && aIdx === 5) return;

        const carrierCfg = CARRIER_MULTIPLIERS[airline.id];
        const depTime = carrierCfg.depTimes[(rIdx + month) % carrierCfg.depTimes.length];
        const stops: 0 | 1 = airline.id === 'al-spicejet' && (rIdx + month) % 2 === 0 ? 1 : 0;
        const duration = route.avgDurationMin + (stops === 1 ? 75 : 0);
        const arrTime = addMinutesToTime(depTime, duration);

        // Deterministic micro-variance so curves look authentic and repeatable
        const wave = ((rIdx * 7 + aIdx * 13 + month * 5) % 11) - 5; // -5..+5
        const rawFare = route.baselineFare * seasonFactor * carrierCfg.factor * (1 + wave * 0.008);
        const fare = Math.round(rawFare / 10) * 10;

        const day = String(10 + ((rIdx + aIdx * 3) % 15)).padStart(2, '0');
        records.push({
          id: `fr-${seq++}`,
          routeId: route.id,
          airlineId: airline.id,
          date: `2026-${monthStr}-${day}`,
          fare,
          cabinClass: 'Economy',
          stops,
          departureTime: depTime,
          arrivalTime: arrTime,
          flightNumber: `${airline.code}-${carrierCfg.flightPrefix + rIdx * 11 + aIdx}`,
        });
      });
    }

    // Add a second afternoon/evening flight option in Nov 2026 for IndiGo & Air India on trunk routes
    if (rIdx < 5) {
      const extraCarriers = [INITIAL_AIRLINES[0], INITIAL_AIRLINES[1]];
      extraCarriers.forEach((airline, idx) => {
        const depTime = idx === 0 ? '16:25' : '21:15';
        const stops: 0 | 1 = idx === 1 ? 1 : 0;
        const duration = route.avgDurationMin + (stops === 1 ? 75 : 0);
        const fare = Math.round((route.baselineFare * (idx === 0 ? 1.18 : 1.05)) / 10) * 10;
        records.push({
          id: `fr-${seq++}`,
          routeId: route.id,
          airlineId: airline.id,
          date: '2026-11-24',
          fare,
          cabinClass: idx === 1 ? 'Premium Economy' : 'Economy',
          stops,
          departureTime: depTime,
          arrivalTime: addMinutesToTime(depTime, duration),
          flightNumber: `${airline.code}-${700 + rIdx * 15 + idx}`,
        });
      });
    }

    // 2. Multi-year historical records (2022–2025) for yearly trend analysis
    const yearGrowth: Array<{ year: number; factor: number }> = [
      { year: 2022, factor: 0.84 },
      { year: 2023, factor: 0.91 },
      { year: 2024, factor: 0.96 },
      { year: 2025, factor: 1.01 },
    ];
    yearGrowth.forEach(({ year, factor }) => {
      [2, 5, 8, 11].forEach((month) => {
        const airline = INITIAL_AIRLINES[(rIdx + month) % 4];
        const carrierCfg = CARRIER_MULTIPLIERS[airline.id];
        const fare =
          Math.round(
            (route.baselineFare * factor * MONTHLY_SEASONALITY[month - 1] * carrierCfg.factor) / 10
          ) * 10;
        records.push({
          id: `fr-${seq++}`,
          routeId: route.id,
          airlineId: airline.id,
          date: `${year}-${String(month).padStart(2, '0')}-15`,
          fare,
          cabinClass: 'Economy',
          stops: 0,
          departureTime: carrierCfg.depTimes[0],
          arrivalTime: addMinutesToTime(carrierCfg.depTimes[0], route.avgDurationMin),
          flightNumber: `${airline.code}-${carrierCfg.flightPrefix + rIdx * 11}`,
        });
      });
    });
  });

  return records;
}

export const INITIAL_FARE_RECORDS: FareRecord[] = generateDeterministicHistoricalFares();

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-traveler-1',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@apix.in',
    password: 'traveler123',
    role: 'traveler',
    status: 'Active',
    joinedDate: '2026-01-12',
    homeAirport: 'DEL',
    trackedRouteIds: ['rt-del-bom', 'rt-del-blr', 'rt-del-goi', 'rt-bom-blr'],
  },
  {
    id: 'usr-admin-1',
    name: 'Yash Shukla',
    email: 'admin@apix.in',
    password: 'admin123',
    role: 'admin',
    status: 'Active',
    joinedDate: '2025-11-04',
    homeAirport: 'DEL',
    trackedRouteIds: ['rt-del-bom', 'rt-del-blr'],
  },
  {
    id: 'usr-traveler-2',
    name: 'Yasha Jain',
    email: 'yasha.jain@apix.in',
    password: 'traveler123',
    role: 'traveler',
    status: 'Active',
    joinedDate: '2026-02-18',
    homeAirport: 'BOM',
    trackedRouteIds: ['rt-bom-del', 'rt-bom-goi', 'rt-bom-blr'],
  },
  {
    id: 'usr-admin-2',
    name: 'Yash Yadav',
    email: 'yash.yadav@apix.in',
    password: 'admin123',
    role: 'admin',
    status: 'Active',
    joinedDate: '2026-01-08',
    homeAirport: 'BLR',
    trackedRouteIds: ['rt-del-blr', 'rt-blr-hyd'],
  },
  {
    id: 'usr-traveler-3',
    name: 'Priya Nair',
    email: 'priya.nair@apix.in',
    password: 'traveler123',
    role: 'traveler',
    status: 'Active',
    joinedDate: '2026-04-22',
    homeAirport: 'COK',
    trackedRouteIds: ['rt-blr-hyd', 'rt-hyd-maa'],
  },
  {
    id: 'usr-traveler-4',
    name: 'Rohan Kulkarni',
    email: 'rohan.k@apix.in',
    password: 'traveler123',
    role: 'traveler',
    status: 'Suspended',
    joinedDate: '2026-06-15',
    homeAirport: 'PNQ',
    trackedRouteIds: ['rt-pnq-del'],
  },
];

export const INITIAL_RECENT_SEARCHES: RecentSearch[] = [
  {
    id: 'rs-1',
    sourceCode: 'DEL',
    destinationCode: 'BOM',
    travelDate: '2026-11-24',
    passengers: 1,
    timestamp: 'Today, 10:15 AM',
  },
  {
    id: 'rs-2',
    sourceCode: 'DEL',
    destinationCode: 'BLR',
    travelDate: '2026-12-05',
    passengers: 2,
    timestamp: 'Yesterday, 06:40 PM',
  },
  {
    id: 'rs-3',
    sourceCode: 'BOM',
    destinationCode: 'GOI',
    travelDate: '2026-12-18',
    passengers: 2,
    timestamp: 'Nov 16, 02:20 PM',
  },
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act-1',
    actor: 'Yash Shukla',
    action: 'Updated',
    entity: 'Fare Record',
    details: 'Refreshed November 2026 festive fare index records for DEL → BOM',
    timestamp: '2026-11-19 09:42',
  },
  {
    id: 'act-2',
    actor: 'Yash Yadav',
    action: 'Verified',
    entity: 'Route',
    details: 'Validated baseline fare benchmarks for 10 domestic corridors',
    timestamp: '2026-11-18 16:15',
  },
  {
    id: 'act-3',
    actor: 'Yash Shukla',
    action: 'Added',
    entity: 'Airline',
    details: 'Configured Air India Express (IX) regional hub metrics',
    timestamp: '2026-11-17 11:30',
  },
  {
    id: 'act-4',
    actor: 'Yash Yadav',
    action: 'Generated',
    entity: 'Report',
    details: 'Exported Q4 2026 Domestic Airfare Index Audit PDF',
    timestamp: '2026-11-15 14:05',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'ntf-1',
    title: 'Diwali Peak Index Alert',
    message: 'DEL → BOM index reached 122.4 (High band) for late November departures.',
    time: '18m ago',
    read: false,
    role: 'traveler',
  },
  {
    id: 'ntf-2',
    title: 'Low-Season Window Identified',
    message: 'Historical February fares on DEL → BLR average 9% below baseline (Index 91.0).',
    time: '2h ago',
    read: false,
    role: 'traveler',
  },
  {
    id: 'ntf-3',
    title: 'Dataset Validation Complete',
    message: 'All 700+ simulated historical fare records passed schema checks.',
    time: '45m ago',
    read: false,
    role: 'admin',
  },
  {
    id: 'ntf-4',
    title: 'New Route Benchmark Requested',
    message: 'Traveler demand increased on PNQ → DEL corridor this quarter.',
    time: '3h ago',
    read: true,
    role: 'admin',
  },
];
