
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useNavigate } from 'react-router-dom';

export const AuthContainer: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading, isLocked, lockoutEnd, handleLogin, handleSignup } = useSecureAuth();

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Convoca Aí</CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm
                onSubmit={handleLogin}
                isLoading={isLoading}
                isLocked={isLocked}
                lockoutEnd={lockoutEnd}
              />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignupForm
                onSubmit={handleSignup}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Ao criar uma conta, você concorda com nossos termos de serviço e política de privacidade.
          </div>
          <Button variant="outline" className="w-full" onClick={handleReturnHome}>
            Voltar para a página inicial
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
