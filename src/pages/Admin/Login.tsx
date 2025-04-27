
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LockKeyhole, User, Shield } from 'lucide-react';
import DOMPurify from 'dompurify';
import { showErrorToast, showSuccessToast } from '@/integrations/supabase/toast-utils';

// Form validation schema
const formSchema = z.object({
  username: z.string().min(1, 'O nome de usuário é obrigatório'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

type FormValues = z.infer<typeof formSchema>;

// Maximum failed login attempts before showing CAPTCHA
const MAX_LOGIN_ATTEMPTS = 3;

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showSecurityCheck, setShowSecurityCheck] = useState(false);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Check if admin is already logged in
  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    const adminAuthExpiry = localStorage.getItem('adminAuthExpiry');
    
    if (adminAuth && adminAuthExpiry) {
      const expiryTime = parseInt(adminAuthExpiry);
      
      // If still valid, redirect to admin dashboard
      if (Date.now() < expiryTime) {
        navigate('/project/admin/man/dashboard');
      }
    }
    
    // Get stored login attempts
    const storedAttempts = localStorage.getItem('adminLoginAttempts');
    if (storedAttempts) {
      const attempts = parseInt(storedAttempts);
      setLoginAttempts(attempts);
      
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        generateSecurityQuestion();
        setShowSecurityCheck(true);
      }
    }
  }, [navigate]);
  
  // Generate a simple security question to act as a CAPTCHA
  const generateSecurityQuestion = () => {
    const questions = [
      { q: 'Quanto é 7 + 5?', a: '12' },
      { q: 'Quanto é 8 × 2?', a: '16' },
      { q: 'Quanto é 20 - 7?', a: '13' },
      { q: 'Quanto é 6 × 3?', a: '18' },
      { q: 'Quanto é 9 + 8?', a: '17' }
    ];
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setSecurityQuestion(randomQuestion.q);
    // In a real app, you'd store the answer hash, not the plain answer
    localStorage.setItem('securityAnswer', randomQuestion.a);
  };
  
  const validateSecurityCheck = (): boolean => {
    const correctAnswer = localStorage.getItem('securityAnswer');
    return securityAnswer === correctAnswer;
  };

  const onSubmit = (values: FormValues) => {
    // If security check is required but not passed
    if (showSecurityCheck) {
      if (!validateSecurityCheck()) {
        showErrorToast(
          'Verificação de segurança falhou',
          'Por favor, responda corretamente à pergunta de segurança.'
        );
        generateSecurityQuestion(); // Generate a new question
        return;
      }
    }
    
    // Sanitize inputs
    const sanitizedUsername = DOMPurify.sanitize(values.username);
    
    setIsLoading(true);
    
    // Use a delayed login to prevent timing attacks and slow down brute force attempts
    setTimeout(() => {
      // Check for the admin credentials with simple string comparison
      if (
        sanitizedUsername === 'RlimaAdmin' && 
        values.password === '#Tijolo14@'
      ) {
        // Reset login attempts
        setLoginAttempts(0);
        localStorage.removeItem('adminLoginAttempts');
        localStorage.removeItem('securityAnswer');
        setShowSecurityCheck(false);
        
        // Generate a secure random token
        const randomBytes = new Uint8Array(32);
        window.crypto.getRandomValues(randomBytes);
        const token = Array.from(randomBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        // Store auth status in localStorage with short expiration
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminAuthExpiry', (Date.now() + 3600000).toString()); // 1 hour
        localStorage.setItem('adminAuthToken', token);
        
        showSuccessToast(
          'Login bem-sucedido',
          'Bem-vindo ao painel administrativo'
        );
        
        navigate('/project/admin/man/dashboard');
      } else {
        // Increment failed login attempts
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem('adminLoginAttempts', newAttempts.toString());
        
        // Show security check after MAX_LOGIN_ATTEMPTS failed attempts
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          generateSecurityQuestion();
          setShowSecurityCheck(true);
        }
        
        showErrorToast(
          'Falha no login',
          'Usuário ou senha inválidos'
        );
      }
      setIsLoading(false);
    }, 1000); // Consistent delay to prevent timing attacks
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
                          autoComplete="username"
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
                          autoComplete="current-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {showSecurityCheck && (
                <div className="p-3 border rounded-md bg-yellow-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-medium text-yellow-700">Verificação de Segurança</h3>
                  </div>
                  <p className="text-sm text-yellow-700 mb-2">{securityQuestion}</p>
                  <Input
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="Sua resposta"
                    className="bg-white"
                  />
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-gray-500">
            Painel administrativo exclusivo para gerenciamento de concursos
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;
