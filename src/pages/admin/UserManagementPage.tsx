import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useApix } from '../../context/ApixContext';
import { UserRole } from '../../types/apix';
import { EmptyState } from '../../components/ui/CommonUI';

export function UserManagementPage() {
  const { users, currentUser, toggleUserStatus, updateUserRole } = useApix();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return `${u.name} ${u.email} ${u.homeAirport}`.toLowerCase().includes(q);
    });
  }, [users, query, roleFilter]);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review registered travelers and administrators, manage role-based privileges, and control account status.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {users.filter((u) => u.role === 'traveler').length} Travelers ·{' '}
          {users.filter((u) => u.role === 'admin').length} Administrators
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by user name or email..."
            aria-label="Search users"
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
          />
        </div>

        <div className="inline-flex p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          {(
            [
              { id: 'all', label: 'All Roles' },
              { id: 'traveler', label: 'Travelers' },
              { id: 'admin', label: 'Administrators' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRoleFilter(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                roleFilter === item.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          title="No users found"
          description="No accounts match the current search or role filter."
        />
      ) : (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Home Hub</th>
                  <th className="py-3 px-4 text-right">Tracked Routes</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6">
                        <p className="font-semibold text-slate-900">
                          {user.name}
                          {isSelf && (
                            <span className="ml-2 text-[11px] font-medium text-blue-600">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          aria-label={`Change role for ${user.name}`}
                          value={user.role}
                          disabled={isSelf}
                          onChange={(e) =>
                            updateUserRole(user.id, e.target.value as UserRole)
                          }
                          className="px-2.5 py-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-800 disabled:opacity-60"
                        >
                          <option value="traveler">Traveler</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        {user.homeAirport}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                        {user.trackedRouteIds.length}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-500">
                        {user.joinedDate}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        <span
                          className={
                            user.status === 'Active' ? 'text-emerald-700' : 'text-rose-600'
                          }
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => toggleUserStatus(user.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-40 whitespace-nowrap ${
                            user.status === 'Active'
                              ? 'border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                              : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {user.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
