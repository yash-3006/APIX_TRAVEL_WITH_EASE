import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  Database,
  FileBarChart2,
  GitCompareArrows,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Plane,
  Search,
  Settings,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';
import { useApix } from '../../context/ApixContext';
import { AppPage } from '../../types/apix';

interface NavItem {
  id: AppPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TRAVELER_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'search', label: 'Search Flights', icon: Search },
  { id: 'compare', label: 'Fare Comparison', icon: GitCompareArrows },
  { id: 'analytics', label: 'Price Analytics', icon: TrendingUp },
  { id: 'reports', label: 'Reports', icon: FileBarChart2 },
  { id: 'profile', label: 'Profile', icon: User },
];

const ADMIN_NAV: NavItem[] = [
  { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'admin-airlines', label: 'Airlines', icon: Building2 },
  { id: 'admin-routes', label: 'Routes', icon: Map },
  { id: 'admin-fares', label: 'Fare Records', icon: Database },
  { id: 'admin-users', label: 'Users', icon: Users },
  { id: 'admin-reports', label: 'Reports', icon: BarChart3 },
  { id: 'admin-settings', label: 'Settings', icon: Settings },
];

const PAGE_TITLES: Record<AppPage, string> = {
  dashboard: 'Traveler Dashboard',
  search: 'Flight Search',
  compare: 'Fare Comparison',
  analytics: 'Price Trend & Analytics',
  reports: 'Airfare Reports',
  profile: 'Traveler Profile',
  'admin-dashboard': 'Admin Dashboard',
  'admin-airlines': 'Airline Management',
  'admin-routes': 'Route Management',
  'admin-fares': 'Fare Data Management',
  'admin-users': 'User Management',
  'admin-reports': 'Analytical Reports',
  'admin-settings': 'System Settings',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    currentUser,
    activePage,
    setActivePage,
    logout,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    routes,
    airlines,
    navigateToSearch,
    setSelectedAnalyticsRouteId,
  } = useApix();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const navItems = isAdmin ? ADMIN_NAV : TRAVELER_NAV;

  const roleNotifications = notifications.filter(
    (n) => n.role === 'all' || n.role === currentUser.role
  );
  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  const quickResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return [];
    const matchedRoutes = routes
      .filter(
        (r) =>
          `${r.sourceCode} ${r.destinationCode} ${r.sourceCity} ${r.destinationCity}`
            .toLowerCase()
            .includes(q)
      )
      .slice(0, 4)
      .map((r) => ({
        id: r.id,
        label: `${r.sourceCode} → ${r.destinationCode}`,
        sub: `${r.sourceCity} to ${r.destinationCity}`,
        type: 'Route' as const,
        onClick: () => {
          if (isAdmin) {
            setActivePage('admin-routes');
          } else {
            navigateToSearch({
              sourceCode: r.sourceCode,
              destinationCode: r.destinationCode,
              travelDate: '2026-11-24',
              passengers: 1,
            });
          }
          setGlobalQuery('');
          setSearchFocused(false);
        },
      }));

    const matchedPages = navItems
      .filter((item) => item.label.toLowerCase().includes(q))
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        label: item.label,
        sub: isAdmin ? 'Admin Console' : 'Traveler Workspace',
        type: 'Page' as const,
        onClick: () => {
          setActivePage(item.id);
          setGlobalQuery('');
          setSearchFocused(false);
        },
      }));

    const matchedAirlines = airlines
      .filter((a) => `${a.name} ${a.code}`.toLowerCase().includes(q))
      .slice(0, 2)
      .map((a) => ({
        id: a.id,
        label: `${a.name} (${a.code})`,
        sub: `${a.carrierType} · Hub ${a.hub}`,
        type: 'Airline' as const,
        onClick: () => {
          if (isAdmin) {
            setActivePage('admin-airlines');
          } else {
            setSelectedAnalyticsRouteId(routes[0]?.id ?? 'rt-del-bom');
            setActivePage('compare');
          }
          setGlobalQuery('');
          setSearchFocused(false);
        },
      }));

    return [...matchedRoutes, ...matchedAirlines, ...matchedPages].slice(0, 6);
  }, [globalQuery, routes, airlines, navItems, isAdmin]);

  const initials = currentUser.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => {
            setActivePage(isAdmin ? 'admin-dashboard' : 'dashboard');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
            <Plane className="w-4 h-4" />
          </span>
          <span className="font-bold text-lg tracking-tight text-slate-900 whitespace-nowrap">
            APIX
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 pt-5 pb-2">
        <p className="px-2.5 text-xs font-medium text-slate-400">
          {isAdmin ? 'Administrator Console' : 'Traveler Analytics'}
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActivePage(item.id);
                setMobileMenuOpen(false);
              }}
              aria-current={active ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  active ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3 shrink-0">
        <div className="px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-700">Simulated Index Dataset</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Indian domestic routes · INR (₹)
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[82vw] bg-white h-full shadow-xl z-10">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="hidden sm:inline">
                  {isAdmin ? 'Admin' : 'Traveler'}
                </span>
                <span className="hidden sm:inline" aria-hidden="true">
                  /
                </span>
                <span className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                  {PAGE_TITLES[activePage]}
                </span>
              </div>
            </div>
          </div>

          {/* Global Quick Search */}
          <div ref={searchRef} className="relative hidden md:block flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={globalQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder="Jump to route (DEL, BOM), airline, or view..."
              aria-label="Global quick search"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
            />
            {searchFocused && globalQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40">
                {quickResults.length === 0 ? (
                  <p className="px-3.5 py-2.5 text-xs text-slate-500">
                    No matching routes, airlines, or pages found.
                  </p>
                ) : (
                  quickResults.map((res) => (
                    <button
                      key={`${res.type}-${res.id}`}
                      type="button"
                      onClick={res.onClick}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {res.label}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{res.sub}</p>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 shrink-0">
                        {res.type}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Utilities: Notifications & Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  setProfileOpen(false);
                }}
                aria-label={`Notifications (${unreadCount} unread)`}
                aria-expanded={notifOpen}
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-40">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {roleNotifications.length === 0 ? (
                      <p className="px-4 py-6 text-xs text-slate-500 text-center">
                        No notifications at the moment.
                      </p>
                    ) : (
                      roleNotifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => markNotificationRead(item.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                            item.read ? 'bg-white' : 'bg-blue-50/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900">
                              {item.title}
                            </p>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {item.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {item.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((prev) => !prev);
                  setNotifOpen(false);
                }}
                aria-expanded={profileOpen}
                aria-label="Account menu"
                className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                  {initials}
                </span>
                <span className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-xs font-semibold text-slate-900 leading-tight whitespace-nowrap">
                    {currentUser.name}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight whitespace-nowrap">
                    {isAdmin ? 'Administrator' : 'Traveler'}
                  </span>
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePage(isAdmin ? 'admin-settings' : 'profile');
                      setProfileOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    {isAdmin ? (
                      <>
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>System Settings</span>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Traveler Profile</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full px-3.5 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
