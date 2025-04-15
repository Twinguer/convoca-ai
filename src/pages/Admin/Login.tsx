
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, LockKeyhole, User } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  username: z.string().min(1, 'O nome de usuário é obrigatório'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

type FormValues = z.infer<typeof formSchema>;

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    setIsLoading(true);
    
    // Check for the new admin credentials
    setTimeout(() => {
      if (values.username === 'RlimaAdmin' && values.password === '#Tijolo14@') {
        // Store auth status in localStorage
        localStorage.setItem('adminAuth', 'true');
        
        toast({
          title: 'Login bem-sucedido',
          description: 'Bem-vindo ao painel administrativo',
          variant: 'default',
        });
        
        navigate('/project/admin/man/dashboard');
      } else {
        toast({
          title: 'Falha no login',
          description: 'Usuário ou senha inválidos',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin ConvocAI</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais de administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-ring">
                        <div className="px-3 py-2 border-r">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <Input 
                          {...field} 
                          placeholder="Digite seu usuário" 
                          className="border-0 focus-visible:ring-0"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-ring">
                        <div className="px-3 py-2 border-r">
                          <LockKeyhole className="h-4 w-4 text-gray-500" />
                        </div>
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder="Digite sua senha" 
                          className="border-0 focus-visible:ring-0"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <p className="text-xs text-gray-500 text-center">
            Painel administrativo exclusivo para gerenciamento de concursos
          </p>
          <Button variant="ghost" size="sm" asChild className="w-full">
            <Link to="/auth">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para a página de login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;
