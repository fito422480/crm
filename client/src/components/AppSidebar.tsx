import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { useAuth } from '@/store/auth';
import {
  LayoutDashboard, Users, Building2, Wifi, WifiOff,
} from 'lucide-react';
import { motion } from 'framer-motion';

const LOGO_URL = 'https://inmo.com.py/wp-content/uploads/2024/05/inmoLogo2.000a43bf-1.png';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Chats', icon: Users, badge: 'live' },
  { href: '/properties', label: 'Propiedades', icon: Building2 },
];

interface AppSidebarProps {
  collapsed?: boolean;
}

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const { pathname } = useLocation();
  const { user, updateUser } = useAuth();
  const [toggling, setToggling] = useState(false);

  const handleToggleAvailability = async () => {
    if (!user || toggling) return;
    setToggling(true);
    try {
      const updated = await api.users.toggleAvailability(user.id);
      updateUser(updated);
    } catch {}
    setToggling(false);
  };

  return (
    <aside className={cn(
      'hidden md:flex flex-col border-r bg-sidebar transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className={cn('p-5', collapsed && 'p-4')}>
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          className={cn('flex items-center gap-2', collapsed && 'justify-center')}
        >
          <img
            src={LOGO_URL}
            alt="Inmo Loteamiento"
            className={cn('shrink-0', collapsed ? 'h-7 w-7' : 'h-8')}
          />
        </motion.div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative group',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span>{item.label}</span>
                  {item.badge === 'live' && (
                    <span className="ml-auto flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {user && (
        <div className={cn('p-3 border-t', collapsed && 'flex justify-center')}>
          <button
            onClick={handleToggleAvailability}
            disabled={toggling}
            className={cn(
              'flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors',
              user.disponible !== false
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
              collapsed && 'justify-center px-2',
            )}
          >
            {user.disponible !== false ? (
              <Wifi className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 shrink-0" />
            )}
            {!collapsed && (
              <span>{user.disponible !== false ? 'Disponible' : 'No disponible'}</span>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
