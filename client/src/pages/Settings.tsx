import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Plus, Pencil, Trash2, Shield, UserCog, User as UserIcon,
  Wifi, WifiOff, Search,
} from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@/types';

const roleConfig = {
  ADMIN: { label: 'Admin', icon: Shield, color: 'text-rose-600 dark:text-rose-400' },
  VENDEDOR: { label: 'Vendedor', icon: UserCog, color: 'text-blue-600 dark:text-blue-400' },
  AGENTE: { label: 'Agente', icon: UserIcon, color: 'text-emerald-600 dark:text-emerald-400' },
};

export function SettingsPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'VENDEDOR' as string,
    zone: '',
    phone: '',
    disponible: true,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.users.list();
      setUsers(data);
    } catch (err) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'VENDEDOR', zone: '', phone: '', disponible: true });
    setDialogOpen(true);
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, zone: u.zone || '', phone: u.phone || '', disponible: u.disponible !== false });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editUser) {
        const payload: any = { name: form.name, zone: form.zone || null, phone: form.phone || null, disponible: form.disponible };
        if (form.password) payload.password = form.password;
        await api.users.update(editUser.id, payload);
        toast.success('Usuario actualizado');
      } else {
        await api.users.create({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          zone: form.zone || null,
          phone: form.phone || null,
          disponible: form.disponible,
        });
        toast.success('Usuario creado');
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await api.users.remove(id);
      toast.success('Usuario eliminado');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Configuración</h1>
        <p className="text-muted-foreground">Solo los administradores pueden acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo usuario
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar usuarios..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Disponible</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">Cargando...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">Sin usuarios</TableCell>
              </TableRow>
            ) : filtered.map((u) => {
              const RoleIcon = roleConfig[u.role as keyof typeof roleConfig]?.icon || UserIcon;
              const roleLabel = roleConfig[u.role as keyof typeof roleConfig]?.label || u.role;
              const roleColor = roleConfig[u.role as keyof typeof roleConfig]?.color || '';
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`gap-1 ${roleColor}`}>
                      <RoleIcon className="h-3 w-3" />
                      {roleLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.phone || '-'}</TableCell>
                  <TableCell>{u.zone || '-'}</TableCell>
                  <TableCell>
                    {u.disponible !== false
                      ? <Wifi className="h-4 w-4 text-emerald-500" />
                      : <WifiOff className="h-4 w-4 text-muted-foreground" />
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {u.id !== currentUser?.id && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(u.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editUser ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@ejemplo.com" disabled={!!editUser} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña {editUser ? '(dejar vacío para mantener)' : ''}</label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editUser ? '••••••••' : 'Mín. 6 caracteres'} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol</label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                    <SelectItem value="AGENTE">Agente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Zona</label>
                <Input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="Ej: CENTRAL" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Ej: 595981000000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Disponible</label>
                <Select value={form.disponible ? 'true' : 'false'} onValueChange={(v) => setForm({ ...form, disponible: v === 'true' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sí</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : editUser ? 'Actualizar' : 'Crear usuario'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}