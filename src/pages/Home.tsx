
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Link } from 'react-router-dom';
import { ConcursoFilter } from '@/types/concursos';
import { fetchConcursos } from '@/services/concursoService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<ConcursoFilter>({});
  const [concursos, setConcursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    const loadConcursos = async () => {
      setLoading(true);
      const concursosData = await fetchConcursos(filter);
      setConcursos(concursosData);
      setLoading(false);
    };

    loadConcursos();
  }, [filter]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleOrgaoFilter = (orgao: string) => {
    setFilter(prev => ({
      ...prev,
      orgao: [orgao]
    }));
  };

  const handleBancaFilter = (banca: string) => {
    setFilter(prev => ({
      ...prev,
      banca: [banca]
    }));
  };

  const handleCargoFilter = (cargo: string) => {
    setFilter(prev => ({
      ...prev,
      cargo: [cargo]
    }));
  };

  const setStatusFilter = (status: string) => {
    setFilter(prev => ({
      ...prev,
      status: [status] // Usando array para corresponder ao tipo esperado
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'dd/MM/yyyy', { locale: ptBR });
      toast({
        title: "Data selecionada",
        description: `Você selecionou a data: ${formattedDate}.`,
      })
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Concursos Abertos</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Input
          type="text"
          placeholder="Pesquisar concurso..."
          value={searchTerm}
          onChange={handleSearch}
          className="flex-grow"
        />

        <Select onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Aberto">Aberto</SelectItem>
            <SelectItem value="Previsto">Previsto</SelectItem>
            <SelectItem value="Autorizado">Autorizado</SelectItem>
            <SelectItem value="Publicado">Publicado</SelectItem>
            <SelectItem value="Nomeado">Nomeado</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !filter.status && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filter.status ? (
                Array.isArray(filter.status) ? 
                  format(new Date(filter.status[0]), "PPP", { locale: ptBR }) :
                  format(new Date(filter.status), "PPP", { locale: ptBR })
              ) : (
                <span>Selecionar Data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center" side="bottom">
            <Calendar
              mode="single"
              onSelect={handleDateChange}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {concursos.map((concurso: any) => (
          <Link key={concurso.id} to={`/resultados/${concurso.id}`}>
            <Card className="bg-white shadow-md rounded-md overflow-hidden">
              <CardHeader className="p-4">
                <CardTitle className="text-lg font-semibold text-gray-800">{concurso.titulo}</CardTitle>
                <CardDescription className="text-sm text-gray-500">{concurso.orgao} - {concurso.banca}</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <Badge variant="secondary" className="mr-2">{concurso.status}</Badge>
                  <span className="text-xs text-gray-600">Publicado em: {concurso.data_publicacao}</span>
                </div>
                <p className="text-gray-700">Vagas: {concurso.vagas}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
