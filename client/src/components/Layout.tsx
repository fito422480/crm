import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  LogOut, Sun, Moon, Wifi, WifiOff,
} from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';
import { useTheme } from './ThemeProvider';

export function Layout() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [togglingAv, setTogglingAv] = useState(false);

  const handleToggleAvailability = async () => {
    if (!user || togglingAv) return;
    setTogglingAv(true);
    try {
      const updated = await api.users.toggleAvailability(user.id);
      updateUser(updated);
    } catch {}
    setTogglingAv(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-end px-4 gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleToggleAvailability}
            disabled={togglingAv}
          >
            {user?.disponible !== false
              ? <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              : <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
            }
            <span className="hidden sm:inline">{user?.disponible !== false ? 'Disponible' : 'No disponible'}</span>
          </Button>

          <div className="flex items-center gap-2 ml-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-sm leading-tight">
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role === 'ADMIN' ? 'Admin' : 'Vendedor'}</p>
            </div>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
