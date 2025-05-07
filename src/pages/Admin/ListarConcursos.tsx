
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConcursos, deleteConcurso } from '@/services/concursoService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/components/ui/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  status: z.string().optional(),
})

const ListarConcursos = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: undefined,
    },
  })

  const { data: concursos, isLoading, isError } = useQuery({
    queryKey: ['concursos', search, form.watch().status],
    queryFn: () => fetchConcursos({ searchTerm: search, status: form.watch().status }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteConcurso(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['concursos', search, form.watch().status]
      });
      toast({
        title: "Concurso excluído",
        description: "O concurso foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir concurso",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) return <div>Carregando concursos...</div>;
  if (isError) return <div>Erro ao carregar concursos.</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-4">
        <Input
          type="search"
          placeholder="Buscar concurso..."
          value={search}
          onChange={handleSearch}
          className="max-w-md"
        />
        <Button onClick={() => navigate('/admin/criar-concurso')}><Plus className="mr-2" /> Criar Concurso</Button>
      </div>

      <Form {...form}>
        <form className="flex items-center space-x-4 mb-4" onSubmit={(e) => e.preventDefault()}>
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="publicado">Publicado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3">Título</TableHead>
              <TableHead className="px-6 py-3">Órgão</TableHead>
              <TableHead className="px-6 py-3">Status</TableHead>
              <TableHead className="px-6 py-3">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {concursos?.map((concurso) => (
              <TableRow key={concurso.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <TableCell className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  <Link to={`/concurso/${concurso.id}`} className="hover:underline">{concurso.titulo}</Link>
                </TableCell>
                <TableCell className="px-6 py-4">{concurso.orgao}</TableCell>
                <TableCell className="px-6 py-4">{concurso.status}</TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex space-x-2">
                    <Button size="icon" onClick={() => navigate(`/admin/editar-concurso/${concurso.id}`)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação é irreversível. Tem certeza de que deseja excluir este concurso?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(concurso.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ListarConcursos;
