export type UserRole = 'traveler' | 'admin';

export type FareBand = 'Low' | 'Moderate' | 'High';

export type TravelerPage =
  | 'dashboard'
  | 'search'
  | 'compare'
  | 'analytics'
  | 'reports'
  | 'profile';

export type AdminPage =
  | 'admin-dashboard'
  | 'admin-airlines'
  | 'admin-routes'
  | 'admin-fares'
  | 'admin-users'
  | 'admin-reports'
  | 'admin-settings';

export type AppPage = TravelerPage | AdminPage;

export interface Airport {
  code: string;
  city: string;
  name: string;
  state: string;
}

export interface Airline {
  id: string;
  code: string;
  name: string;
  carrierType: 'Full-Service' | 'Low-Cost' | 'Regional';
  hub: string;
  onTimePercent: number;
  baggageKg: number;
  status: 'Active' | 'Inactive';
  brandColor: string;
}

export interface RouteRecord {
  id: string;
  sourceCode: string;
  sourceCity: string;
  destinationCode: string;
  destinationCity: string;
  distanceKm: number;
  avgDurationMin: number;
  baselineFare: number;
  status: 'Active' | 'Seasonal';
}

export interface FareRecord {
  id: string;
  routeId: string;
  airlineId: string;
  date: string; // YYYY-MM-DD
  fare: number; // INR
  cabinClass: 'Economy' | 'Premium Economy' | 'Business';
  stops: 0 | 1;
  departureTime: string; // HH:mm
  arrivalTime: string; // HH:mm
  flightNumber: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string; // Frontend demo prototype only
  role: UserRole;
  status: 'Active' | 'Suspended';
  joinedDate: string;
  homeAirport: string;
  trackedRouteIds: string[];
}

export interface RecentSearch {
  id: string;
  sourceCode: string;
  destinationCode: string;
  travelDate: string;
  passengers: number;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  entity: 'Airline' | 'Route' | 'Fare Record' | 'User' | 'Settings' | 'Report';
  details: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  role: UserRole | 'all';
}

export interface IndexThresholds {
  lowMax: number; // Index <= lowMax is Low (default 95)
  highMin: number; // Index >= highMin is High (default 110)
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

export interface FlightSearchCriteria {
  sourceCode: string;
  destinationCode: string;
  travelDate: string;
  passengers: number;
  airlineIds: string[];
  maxFare: number;
  stops: 'all' | 'nonstop' | '1stop';
  sortBy: 'fare-asc' | 'fare-desc' | 'departure' | 'duration';
}

export interface FlightResultItem {
  id: string;
  routeId: string;
  airlineId: string;
  airlineName: string;
  airlineCode: string;
  airlineColor: string;
  flightNumber: string;
  sourceCode: string;
  sourceCity: string;
  destinationCode: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  durationMin: number;
  stops: 0 | 1;
  cabinClass: 'Economy' | 'Premium Economy' | 'Business';
  farePerPassenger: number;
  totalFare: number;
  priceIndex: number;
  band: FareBand;
  onTimePercent: number;
  baggageKg: number;
  date: string;
}

export interface TrendPoint {
  period: string;
  label: string;
  avgFare: number;
  minFare: number;
  maxFare: number;
  priceIndex: number;
  band: FareBand;
  recordCount: number;
}

export interface AirlineComparisonRow {
  airlineId: string;
  airlineCode: string;
  airlineName: string;
  brandColor: string;
  carrierType: Airline['carrierType'];
  minFare: number;
  avgFare: number;
  maxFare: number;
  priceIndex: number;
  band: FareBand;
  onTimePercent: number;
  baggageKg: number;
  flightCount: number;
}
