import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Building2, MapPin } from 'lucide-react';
import type { Property } from '@/types';

export function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const data = await api.properties.list(params);
      setProperties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProperties, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Propiedades</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, ciudad, departamento..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((prop) => (
          <Link key={prop.id} to={`/properties/${prop.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {prop.name}
                  </CardTitle>
                  <Badge variant={prop.lotesDisponibles > 0 ? 'default' : 'secondary'}>
                    {prop.lotesDisponibles > 0 ? `${prop.lotesDisponibles} disp.` : 'Sin stock'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {prop.ciudad && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {prop.ciudad}{prop.departamento ? `, ${prop.departamento}` : ''}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">{prop._count?.lots || 0} lotes</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!loading && properties.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">No se encontraron propiedades</div>
        )}
      </div>
    </div>
  );
}
