import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, MapPin } from 'lucide-react';
import type { Property, Lot } from '@/types';

const statusLabels: Record<string, string> = {
  LIBRE: 'Libre',
  VENDIDO: 'Vendido',
  RESERVADO: 'Reservado',
};

const statusColors: Record<string, string> = {
  LIBRE: 'default',
  VENDIDO: 'destructive',
  RESERVADO: 'secondary',
};

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async () => {
    if (!id) return;
    try {
      const data = await api.properties.get(id);
      setProperty(data);
      setLots(data.lots || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const filteredLots = statusFilter ? lots.filter((l) => l.status === statusFilter) : lots;

  if (!property) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6 space-y-6">
      <Link to="/properties" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a propiedades
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{property.name}</h1>
        {property.ciudad && (
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" /> {property.ciudad}{property.departamento ? `, ${property.departamento}` : ''}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant={statusFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('')}>Todos</Button>
        <Button variant={statusFilter === 'LIBRE' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('LIBRE')}>Libres</Button>
        <Button variant={statusFilter === 'VENDIDO' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('VENDIDO')}>Vendidos</Button>
        <Button variant={statusFilter === 'RESERVADO' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('RESERVADO')}>Reservados</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Manzana</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Área</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLots.map((lot) => (
                <TableRow key={lot.id}>
                  <TableCell>{lot.manzana || '-'}</TableCell>
                  <TableCell>{lot.numero || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={(statusColors[lot.status] || 'outline') as any}>
                      {statusLabels[lot.status] || lot.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{lot.precio ? `Gs. ${Number(lot.precio).toLocaleString()}` : '-'}</TableCell>
                  <TableCell>{lot.area || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
