import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Building2, Settings } from 'lucide-react';
import { useAuth } from '@/store/auth';

export function MobileNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const items = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/leads', label: 'Chats', icon: Users },
    { href: '/properties', label: 'Props', icon: Building2 },
    ...(user?.role === 'ADMIN' ? [{ href: '/settings', label: 'Config', icon: Settings }] : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50 safe-area-inset-bottom">
      <div className="flex">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => cn(
                'flex-1 flex flex-col items-center py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
