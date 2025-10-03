import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const VouchersManager = () => {
  const [code, setCode] = useState('');
  const [plan, setPlan] = useState<'free' | 'pro'>('pro');
  const [durationMonths, setDurationMonths] = useState('1');
  const [maxUses, setMaxUses] = useState('1');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { data: vouchers, isLoading, refetch } = useQuery({
    queryKey: ['vouchers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(code);
  };

  const handleCreate = async () => {
    if (!code) {
      toast({
        title: 'Erro',
        description: 'O código do voucher é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from('vouchers').insert({
        code,
        plan,
        duration_months: parseInt(durationMonths),
        max_uses: parseInt(maxUses),
        description,
        expires_at: expiresAt || null,
      });

      if (error) throw error;

      toast({
        title: 'Voucher criado',
        description: 'O voucher foi criado com sucesso',
      });

      setCode('');
      setDescription('');
      setExpiresAt('');
      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar voucher',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleVoucherStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('vouchers')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `Voucher ${!currentStatus ? 'ativado' : 'desativado'}`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteVoucher = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este voucher?')) return;

    try {
      const { error } = await supabase.from('vouchers').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Voucher excluído',
        description: 'O voucher foi excluído com sucesso',
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gerenciar Vouchers</h1>

      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Voucher</CardTitle>
          <CardDescription>
            Crie vouchers para oferecer benefícios aos usuários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="code">Código do Voucher</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX"
                />
                <Button onClick={generateRandomCode} variant="outline">
                  Gerar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plano</Label>
              <Select value={plan} onValueChange={(v: 'free' | 'pro') => setPlan(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratuito</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração (meses)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUses">Máximo de Usos</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">Data de Expiração</Label>
              <Input
                id="expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do voucher (opcional)"
              rows={3}
            />
          </div>

          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Criar Voucher
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vouchers Criados</CardTitle>
          <CardDescription>Gerencie os vouchers existentes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : !vouchers || vouchers.length === 0 ? (
            <p className="text-center text-muted-foreground p-8">
              Nenhum voucher criado ainda
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-mono">{voucher.code}</TableCell>
                      <TableCell>
                        <Badge variant={voucher.plan === 'pro' ? 'default' : 'secondary'}>
                          {voucher.plan === 'pro' ? 'Pro' : 'Gratuito'}
                        </Badge>
                      </TableCell>
                      <TableCell>{voucher.duration_months} meses</TableCell>
                      <TableCell>
                        {voucher.current_uses} / {voucher.max_uses}
                      </TableCell>
                      <TableCell>
                        {voucher.expires_at
                          ? new Date(voucher.expires_at).toLocaleDateString()
                          : 'Sem expiração'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={voucher.is_active}
                          onCheckedChange={() =>
                            toggleVoucherStatus(voucher.id, voucher.is_active)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteVoucher(voucher.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VouchersManager;
