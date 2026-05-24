import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  History,
  Bookmark,
  User,
  Settings,
  Shield,
  Users,
  KeyRound,
  Activity,
  BarChart3,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const userLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/summarize', label: 'Summarize', icon: Sparkles },
  { to: '/history', label: 'History', icon: History },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const adminLinks = [
  { to: '/admin', label: 'Admin Home', icon: Shield, perm: null },
  { to: '/admin/users', label: 'Users', icon: Users, perm: 'admin.users.read' },
  { to: '/admin/roles', label: 'Roles', icon: KeyRound, perm: 'admin.roles.read' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: Activity, perm: 'admin.audit.read' },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, perm: 'admin.analytics.read' },
];

export default function Sidebar() {
  const { hasPermission, permissions } = useAuth();
  const showAdmin = ['admin.users.read', 'admin.roles.read', 'admin.audit.read', 'admin.analytics.read'].some((p) =>
    permissions.includes(p),
  );

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-background md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 px-5">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-base font-semibold">AI Summarizer</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {userLinks.map(({ to, label, icon: Icon }) => (
          <NavItem key={to} to={to} icon={Icon} label={label} />
        ))}
        {showAdmin && (
          <>
            <div className="my-3 px-2 text-xs uppercase tracking-wider text-muted-foreground">Admin</div>
            {adminLinks
              .filter((l) => !l.perm || hasPermission(l.perm))
              .map(({ to, label, icon: Icon }) => (
                <NavItem key={to} to={to} icon={Icon} label={label} />
              ))}
          </>
        )}
      </nav>
    </aside>
  );
}

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/admin'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}
