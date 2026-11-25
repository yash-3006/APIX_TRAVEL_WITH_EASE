import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_ACTIVITY_LOGS,
  INITIAL_AIRLINES,
  INITIAL_FARE_RECORDS,
  INITIAL_NOTIFICATIONS,
  INITIAL_RECENT_SEARCHES,
  INITIAL_ROUTES,
  INITIAL_USERS,
} from '../data/mockData';
import {
  ActivityLog,
  Airline,
  AppPage,
  FareRecord,
  IndexThresholds,
  NotificationItem,
  RecentSearch,
  RouteRecord,
  ToastMessage,
  UserAccount,
  UserRole,
} from '../types/apix';
import { DEFAULT_THRESHOLDS } from '../utils/apixAnalytics';

const STORAGE_KEY = 'apix_state_v1';

interface PersistedState {
  airlines: Airline[];
  routes: RouteRecord[];
  fareRecords: FareRecord[];
  users: UserAccount[];
  recentSearches: RecentSearch[];
  activityLogs: ActivityLog[];
  notifications: NotificationItem[];
  thresholds: IndexThresholds;
  currentUserId: string | null;
}

function loadInitialState(): PersistedState {
  const defaults: PersistedState = {
    airlines: INITIAL_AIRLINES,
    routes: INITIAL_ROUTES,
    fareRecords: INITIAL_FARE_RECORDS,
    users: INITIAL_USERS,
    recentSearches: INITIAL_RECENT_SEARCHES,
    activityLogs: INITIAL_ACTIVITY_LOGS,
    notifications: INITIAL_NOTIFICATIONS,
    thresholds: DEFAULT_THRESHOLDS,
    currentUserId: null,
  };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      airlines: Array.isArray(parsed.airlines) && parsed.airlines.length > 0 ? parsed.airlines : defaults.airlines,
      routes: Array.isArray(parsed.routes) && parsed.routes.length > 0 ? parsed.routes : defaults.routes,
      fareRecords: Array.isArray(parsed.fareRecords) && parsed.fareRecords.length > 0 ? parsed.fareRecords : defaults.fareRecords,
      users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : defaults.users,
      recentSearches: Array.isArray(parsed.recentSearches) ? parsed.recentSearches : defaults.recentSearches,
      activityLogs: Array.isArray(parsed.activityLogs) ? parsed.activityLogs : defaults.activityLogs,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : defaults.notifications,
      thresholds: parsed.thresholds && typeof parsed.thresholds.lowMax === 'number' ? parsed.thresholds : defaults.thresholds,
      currentUserId: typeof parsed.currentUserId === 'string' ? parsed.currentUserId : null,
    };
  } catch {
    return defaults;
  }
}

export interface SearchPrefill {
  sourceCode: string;
  destinationCode: string;
  travelDate: string;
  passengers: number;
}

export interface CompareContextState {
  routeId: string;
  selectedAirlineIds: string[];
}

interface ApixContextValue {
  // Auth & Navigation
  currentUser: UserAccount | null;
  activePage: AppPage;
  setActivePage: (page: AppPage) => void;
  login: (email: string, password: string, expectedRole?: UserRole) => { ok: boolean; error?: string };
  register: (payload: { name: string; email: string; password: string; role: UserRole }) => { ok: boolean; error?: string };
  logout: () => void;
  updateCurrentUserProfile: (updates: { name: string; homeAirport: string }) => void;
  toggleTrackedRoute: (routeId: string) => void;

  // Data Collections
  airlines: Airline[];
  routes: RouteRecord[];
  fareRecords: FareRecord[];
  users: UserAccount[];
  recentSearches: RecentSearch[];
  activityLogs: ActivityLog[];
  notifications: NotificationItem[];
  thresholds: IndexThresholds;

  // Cross-page navigation state
  searchPrefill: SearchPrefill;
  setSearchPrefill: (prefill: SearchPrefill) => void;
  navigateToSearch: (prefill: SearchPrefill) => void;
  compareState: CompareContextState;
  setCompareState: React.Dispatch<React.SetStateAction<CompareContextState>>;
  navigateToCompare: (routeId: string, airlineIds?: string[]) => void;
  selectedAnalyticsRouteId: string;
  setSelectedAnalyticsRouteId: (routeId: string) => void;

  // Recent searches & Notifications
  recordSearch: (prefill: SearchPrefill) => void;
  clearRecentSearches: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Admin CRUD
  addAirline: (airline: Omit<Airline, 'id'>) => void;
  updateAirline: (id: string, updates: Omit<Airline, 'id'>) => void;
  deleteAirline: (id: string) => void;

  addRoute: (route: Omit<RouteRecord, 'id'>) => void;
  updateRoute: (id: string, updates: Omit<RouteRecord, 'id'>) => void;
  deleteRoute: (id: string) => void;

  addFareRecord: (record: Omit<FareRecord, 'id'>) => void;
  updateFareRecord: (id: string, updates: Omit<FareRecord, 'id'>) => void;
  deleteFareRecord: (id: string) => void;

  toggleUserStatus: (userId: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  updateThresholds: (thresholds: IndexThresholds) => void;
  logActivity: (action: string, entity: ActivityLog['entity'], details: string) => void;
  resetDemoDataset: () => void;

  // Toasts
  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ApixContext = createContext<ApixContextValue | null>(null);

function nowStamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function ApixProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => {
    const initial = loadInitialState();
    // Support ?autostart=1 | ?autostart=traveler | ?autostart=admin for deterministic testing
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart');
    if (autostart === 'admin') {
      const adminUser = initial.users.find((u) => u.role === 'admin');
      if (adminUser) return { ...initial, currentUserId: adminUser.id };
    } else if (autostart === '1' || autostart === 'traveler') {
      const travelerUser = initial.users.find((u) => u.role === 'traveler');
      if (travelerUser) return { ...initial, currentUserId: travelerUser.id };
    }
    return initial;
  });

  const currentUser =
    state.users.find((u) => u.id === state.currentUserId) ?? null;

  const [activePage, setActivePage] = useState<AppPage>(() => {
    if (currentUser?.role === 'admin') return 'admin-dashboard';
    return 'dashboard';
  });

  const [searchPrefill, setSearchPrefill] = useState<SearchPrefill>({
    sourceCode: 'DEL',
    destinationCode: 'BOM',
    travelDate: '2026-11-24',
    passengers: 1,
  });

  const [compareState, setCompareState] = useState<CompareContextState>({
    routeId: 'rt-del-bom',
    selectedAirlineIds: ['al-indigo', 'al-airindia', 'al-vistara', 'al-akasa', 'al-spicejet'],
  });

  const [selectedAnalyticsRouteId, setSelectedAnalyticsRouteId] = useState<string>('rt-del-bom');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors in restricted sandboxes
    }
  }, [state]);

  const pushToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-1), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const appendLog = (
    prev: PersistedState,
    action: string,
    entity: ActivityLog['entity'],
    details: string,
    actorOverride?: string
  ): ActivityLog[] => {
    const actor = actorOverride ?? currentUser?.name ?? 'System';
    const entry: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      actor,
      action,
      entity,
      details,
      timestamp: nowStamp(),
    };
    return [entry, ...prev.activityLogs].slice(0, 40);
  };

  const logActivity = (action: string, entity: ActivityLog['entity'], details: string) => {
    setState((prev) => ({
      ...prev,
      activityLogs: appendLog(prev, action, entity, details),
    }));
  };

  const login = (email: string, password: string, expectedRole?: UserRole) => {
    const cleanEmail = email.trim().toLowerCase();
    const matched = state.users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );
    if (!matched) {
      return {
        ok: false,
        error: 'Invalid email address or password. Try a demo account or register a new profile.',
      };
    }
    if (matched.status === 'Suspended') {
      return {
        ok: false,
        error: 'This account is currently suspended. Please contact an administrator.',
      };
    }
    if (expectedRole && matched.role !== expectedRole) {
      return {
        ok: false,
        error: `This email is registered as ${matched.role === 'admin' ? 'Administrator' : 'Traveler'}. Switch the role selector to sign in.`,
      };
    }

    setState((prev) => ({ ...prev, currentUserId: matched.id }));
    setActivePage(matched.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    pushToast({
      type: 'success',
      title: `Welcome back, ${matched.name}`,
      description: `Signed in to the ${matched.role === 'admin' ? 'Administrator' : 'Traveler'} workspace.`,
    });
    return { ok: true };
  };

  const register = (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => {
    const cleanEmail = payload.email.trim().toLowerCase();
    if (state.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return {
        ok: false,
        error: 'An account with this email already exists. Please sign in instead.',
      };
    }
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: payload.name.trim(),
      email: cleanEmail,
      password: payload.password,
      role: payload.role,
      status: 'Active',
      joinedDate: new Date().toISOString().slice(0, 10),
      homeAirport: 'DEL',
      trackedRouteIds: ['rt-del-bom', 'rt-del-blr'],
    };

    setState((prev) => ({
      ...prev,
      users: [newUser, ...prev.users],
      currentUserId: newUser.id,
      activityLogs: appendLog(
        prev,
        'Registered',
        'User',
        `Created new ${newUser.role} account (${newUser.email})`,
        newUser.name
      ),
    }));
    setActivePage(newUser.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    pushToast({
      type: 'success',
      title: 'Account created successfully',
      description: `Signed in as ${newUser.name}.`,
    });
    return { ok: true };
  };

  const logout = () => {
    setState((prev) => ({ ...prev, currentUserId: null }));
    setActivePage('dashboard');
    pushToast({
      type: 'info',
      title: 'Signed out',
      description: 'Your session has ended.',
    });
  };

  const updateCurrentUserProfile = (updates: { name: string; homeAirport: string }) => {
    if (!currentUser) return;
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === currentUser.id
          ? { ...u, name: updates.name.trim(), homeAirport: updates.homeAirport }
          : u
      ),
    }));
    pushToast({
      type: 'success',
      title: 'Profile updated',
      description: 'Saved your display name and preferred departure hub.',
    });
  };

  const toggleTrackedRoute = (routeId: string) => {
    if (!currentUser) return;
    const isTracked = currentUser.trackedRouteIds.includes(routeId);
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              trackedRouteIds: isTracked
                ? u.trackedRouteIds.filter((id) => id !== routeId)
                : [...u.trackedRouteIds, routeId],
            }
          : u
      ),
    }));
    pushToast({
      type: 'info',
      title: isTracked ? 'Route removed from watchlist' : 'Route added to watchlist',
    });
  };

  const recordSearch = (prefill: SearchPrefill) => {
    const entry: RecentSearch = {
      id: `rs-${Date.now()}`,
      ...prefill,
      timestamp: 'Just now',
    };
    setState((prev) => {
      const deduped = prev.recentSearches.filter(
        (item) =>
          !(
            item.sourceCode === prefill.sourceCode &&
            item.destinationCode === prefill.destinationCode &&
            item.travelDate === prefill.travelDate
          )
      );
      return {
        ...prev,
        recentSearches: [entry, ...deduped].slice(0, 6),
      };
    });
  };

  const clearRecentSearches = () => {
    setState((prev) => ({ ...prev, recentSearches: [] }));
    pushToast({ type: 'info', title: 'Recent search history cleared' });
  };

  const navigateToSearch = (prefill: SearchPrefill) => {
    setSearchPrefill(prefill);
    recordSearch(prefill);
    setActivePage('search');
  };

  const navigateToCompare = (routeId: string, airlineIds?: string[]) => {
    setCompareState((prev) => ({
      routeId,
      selectedAirlineIds:
        airlineIds && airlineIds.length > 0
          ? airlineIds
          : state.airlines.filter((a) => a.status === 'Active').slice(0, 5).map((a) => a.id),
    }));
    setActivePage('compare');
  };

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  // Admin CRUD: Airlines
  const addAirline = (airline: Omit<Airline, 'id'>) => {
    const newAirline: Airline = {
      ...airline,
      id: `al-${Date.now()}`,
      code: airline.code.trim().toUpperCase(),
      name: airline.name.trim(),
    };
    setState((prev) => ({
      ...prev,
      airlines: [newAirline, ...prev.airlines],
      activityLogs: appendLog(
        prev,
        'Added',
        'Airline',
        `Added ${newAirline.name} (${newAirline.code}) based at ${newAirline.hub}`
      ),
    }));
    pushToast({
      type: 'success',
      title: 'Airline added',
      description: `${newAirline.name} (${newAirline.code}) is now stored in the catalog.`,
    });
  };

  const updateAirline = (id: string, updates: Omit<Airline, 'id'>) => {
    setState((prev) => ({
      ...prev,
      airlines: prev.airlines.map((a) =>
        a.id === id ? { ...updates, id, code: updates.code.trim().toUpperCase() } : a
      ),
      activityLogs: appendLog(
        prev,
        'Updated',
        'Airline',
        `Updated carrier profile for ${updates.name} (${updates.code.toUpperCase()})`
      ),
    }));
    pushToast({
      type: 'success',
      title: 'Airline updated',
      description: `Changes saved for ${updates.name}.`,
    });
  };

  const deleteAirline = (id: string) => {
    const target = state.airlines.find((a) => a.id === id);
    if (!target) return;
    setState((prev) => ({
      ...prev,
      airlines: prev.airlines.filter((a) => a.id !== id),
      fareRecords: prev.fareRecords.filter((f) => f.airlineId !== id),
      activityLogs: appendLog(
        prev,
        'Deleted',
        'Airline',
        `Removed ${target.name} (${target.code}) and associated fare entries`
      ),
    }));
    pushToast({
      type: 'success',
      title: 'Airline removed',
      description: `${target.name} has been deleted.`,
    });
  };

  // Admin CRUD: Routes
  const addRoute = (route: Omit<RouteRecord, 'id'>) => {
    const newRoute: RouteRecord = {
      ...route,
      id: `rt-${route.sourceCode.toLowerCase()}-${route.destinationCode.toLowerCase()}-${Date.now().toString().slice(-3)}`,
      sourceCode: route.sourceCode.toUpperCase(),
      destinationCode: route.destinationCode.toUpperCase(),
    };
    setState((prev) => ({
      ...prev,
      routes: [newRoute, ...prev.routes],
      activityLogs: appendLog(
        prev,
        'Added',
        'Route',
        `Added corridor ${newRoute.sourceCode} → ${newRoute.destinationCode} (baseline ₹${newRoute.baselineFare.toLocaleString('en-IN')})`
      ),
    }));
    pushToast({
      type: 'success',
      title: 'Route created',
      description: `${newRoute.sourceCode} → ${newRoute.destinationCode} is now active.`,
    });
  };

  const updateRoute = (id: string, updates: Omit<RouteRecord, 'id'>) => {
    setState((prev) => ({
      ...prev,
      routes: prev.routes.map((r) => (r.id === id ? { ...updates, id } : r)),
      activityLogs: appendLog(
        prev,
        'Updated',
        'Route',
        `Updated route ${updates.sourceCode} → ${updates.destinationCode} (baseline ₹${updates.baselineFare.toLocaleString('en-IN')})`
      ),
    }));
    pushToast({
      type: 'success',
      title: 'Route updated',
      description: `Saved changes to ${updates.sourceCode} → ${updates.destinationCode}.`,
    });
  };

  const deleteRoute = (id: string) => {
    const target = state.routes.find((r) => r.id === id);
    if (!target) return;
    setState((prev) => ({
      ...prev,
      routes: prev.routes.filter((r) => r.id !== id),
      fareRecords: prev.fareRecords.filter((f) => f.routeId !== id),
      activityLogs: appendLog(
        prev,
        'Deleted',
        'Route',
        `Removed route ${target.sourceCode} → ${target.destinationCode}`
      ),
    }));
    pushToast({
      type: 'success',
      title: 'Route deleted',
      description: `${target.sourceCode} → ${target.destinationCode} was removed.`,
    });
  };

  // Admin CRUD: Fare Records
  const addFareRecord = (record: Omit<FareRecord, 'id'>) => {
    const newRecord: FareRecord = {
      ...record,
      id: `fr-${Date.now()}`,
      flightNumber: record.flightNumber.trim().toUpperCase(),
    };
    const route = state.routes.find((r) => r.id === newRecord.routeId);
    const airline = state.airlines.find((a) => a.id === newRecord.airlineId);
    setState((prev) => ({
      ...prev,
      fareRecords: [newRecord, ...prev.fareRecords],
      activityLogs: appendLog(
        prev,
        'Added',
        'Fare Record',
        `Recorded ₹${newRecord.fare.toLocaleString('en-IN')} on ${route ? `${route.sourceCode}→${route.destinationCode}` : newRecord.routeId} (${airline?.name ?? 'Carrier'}, ${newRecord.date})`
      ),
    }));
    pushToast({
      type: 'success',
      title: 'Fare record saved',
      description: `${newRecord.flightNumber} recorded at ₹${newRecord.fare.toLocaleString('en-IN')}.`,
    });
  };

  const updateFareRecord = (id: string, updates: Omit<FareRecord, 'id'>) => {
    setState((prev) => ({
      ...prev,
      fareRecords: prev.fareRecords.map((f) =>
        f.id === id
          ? { ...updates, id, flightNumber: updates.flightNumber.trim().toUpperCase() }
          : f
      ),
      activityLogs: appendLog(
        prev,
        'Updated',
        'Fare Record',
        `Updated ${updates.flightNumber.toUpperCase()} (${updates.date}) to ₹${updates.fare.toLocaleString('en-IN')}`
      ),
    }));
    pushToast({
      type: 'success',
      title: 'Fare record updated',
      description: `Fare updated to ₹${updates.fare.toLocaleString('en-IN')}.`,
    });
  };

  const deleteFareRecord = (id: string) => {
    const target = state.fareRecords.find((f) => f.id === id);
    if (!target) return;
    setState((prev) => ({
      ...prev,
      fareRecords: prev.fareRecords.filter((f) => f.id !== id),
      activityLogs: appendLog(
        prev,
        'Deleted',
        'Fare Record',
        `Deleted fare record ${target.flightNumber} (${target.date})`
      ),
    }));
    pushToast({
      type: 'success',
      title: 'Fare record deleted',
      description: `Removed ${target.flightNumber} (${target.date}).`,
    });
  };

  // Users & Settings
  const toggleUserStatus = (userId: string) => {
    const target = state.users.find((u) => u.id === userId);
    if (!target) return;
    if (target.id === currentUser?.id) {
      pushToast({
        type: 'error',
        title: 'Cannot suspend active session',
        description: 'You cannot suspend your own administrator account.',
      });
      return;
    }
    const nextStatus = target.status === 'Active' ? 'Suspended' : 'Active';
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u)),
      activityLogs: appendLog(
        prev,
        'Updated',
        'User',
        `Changed status of ${target.name} to ${nextStatus}`
      ),
    }));
    pushToast({
      type: 'success',
      title: `User ${nextStatus.toLowerCase()}`,
      description: `${target.name} is now ${nextStatus}.`,
    });
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    const target = state.users.find((u) => u.id === userId);
    if (!target) return;
    if (target.id === currentUser?.id) {
      pushToast({
        type: 'error',
        title: 'Cannot modify own role',
        description: 'Sign in with another admin account to change this role.',
      });
      return;
    }
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, role } : u)),
      activityLogs: appendLog(
        prev,
        'Updated',
        'User',
        `Updated role for ${target.name} to ${role === 'admin' ? 'Administrator' : 'Traveler'}`
      ),
    }));
    pushToast({
      type: 'success',
      title: 'Role updated',
      description: `${target.name} is now assigned the ${role === 'admin' ? 'Administrator' : 'Traveler'} role.`,
    });
  };

  const updateThresholds = (thresholds: IndexThresholds) => {
    setState((prev) => ({
      ...prev,
      thresholds,
      activityLogs: appendLog(
        prev,
        'Updated',
        'Settings',
        `Set index bands: Low ≤ ${thresholds.lowMax}, High ≥ ${thresholds.highMin}`
      ),
    }));
    pushToast({
      type: 'success',
      title: 'Index thresholds saved',
      description: `Low ≤ ${thresholds.lowMax} · High ≥ ${thresholds.highMin}`,
    });
  };

  const resetDemoDataset = () => {
    setState((prev) => ({
      airlines: INITIAL_AIRLINES,
      routes: INITIAL_ROUTES,
      fareRecords: INITIAL_FARE_RECORDS,
      users: INITIAL_USERS,
      recentSearches: INITIAL_RECENT_SEARCHES,
      activityLogs: INITIAL_ACTIVITY_LOGS,
      notifications: INITIAL_NOTIFICATIONS,
      thresholds: DEFAULT_THRESHOLDS,
      currentUserId: prev.currentUserId,
    }));
    pushToast({
      type: 'info',
      title: 'Demo dataset restored',
      description: 'All airlines, routes, and historical fare records were reset to defaults.',
    });
  };

  return (
    <ApixContext.Provider
      value={{
        currentUser,
        activePage,
        setActivePage,
        login,
        register,
        logout,
        updateCurrentUserProfile,
        toggleTrackedRoute,
        airlines: state.airlines,
        routes: state.routes,
        fareRecords: state.fareRecords,
        users: state.users,
        recentSearches: state.recentSearches,
        activityLogs: state.activityLogs,
        notifications: state.notifications,
        thresholds: state.thresholds,
        searchPrefill,
        setSearchPrefill,
        navigateToSearch,
        compareState,
        setCompareState,
        navigateToCompare,
        selectedAnalyticsRouteId,
        setSelectedAnalyticsRouteId,
        recordSearch,
        clearRecentSearches,
        markNotificationRead,
        markAllNotificationsRead,
        addAirline,
        updateAirline,
        deleteAirline,
        addRoute,
        updateRoute,
        deleteRoute,
        addFareRecord,
        updateFareRecord,
        deleteFareRecord,
        toggleUserStatus,
        updateUserRole,
        updateThresholds,
        logActivity,
        resetDemoDataset,
        toasts,
        pushToast,
        dismissToast,
      }}
    >
      {children}
    </ApixContext.Provider>
  );
}

export function useApix() {
  const ctx = useContext(ApixContext);
  if (!ctx) {
    throw new Error('useApix must be used within ApixProvider');
  }
  return ctx;
}
