
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '@/integrations/supabase/toast-utils';
import DOMPurify from 'dompurify';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export const useSecureAuth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null);

  // Sanitize user input
  const sanitizeInput = useCallback((input: string): string => {
    return DOMPurify.sanitize(input.trim());
  }, []);

  // Enhanced email validation
  const isEmailValid = useCallback((email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  }, []);

  // Enhanced password validation
  const isPasswordValid = useCallback((password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])?[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password) && password.length <= 72; // bcrypt limit
  }, []);

  // Check for rate limiting
  const checkRateLimit = useCallback((): boolean => {
    const storedLockoutEnd = localStorage.getItem('auth_lockout_end');
    if (storedLockoutEnd) {
      const lockoutEndTime = parseInt(storedLockoutEnd, 10);
      if (lockoutEndTime > Date.now()) {
        setIsLocked(true);
        setLockoutEnd(lockoutEndTime);
        return false;
      } else {
        localStorage.removeItem('auth_lockout_end');
        setIsLocked(false);
        setLockoutEnd(null);
        setLoginAttempts(0);
      }
    }
    return true;
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    if (!checkRateLimit()) {
      const remainingTime = Math.ceil((lockoutEnd! - Date.now()) / 60000);
      showErrorToast('Conta temporariamente bloqueada', `Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.`);
      return;
    }

    const sanitizedEmail = sanitizeInput(email);
    
    if (!isEmailValid(sanitizedEmail)) {
      showErrorToast('Email inválido', 'Por favor, forneça um email válido.');
      return;
    }

    if (!password || password.length < 6) {
      showErrorToast('Senha inválida', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: password
      });

      if (error) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const lockEndTime = Date.now() + LOCKOUT_TIME;
          setIsLocked(true);
          setLockoutEnd(lockEndTime);
          localStorage.setItem('auth_lockout_end', lockEndTime.toString());
          showErrorToast('Conta temporariamente bloqueada', 'Muitas tentativas de login. Tente novamente em 15 minutos.');
        } else {
          showErrorToast('Erro ao fazer login', 'Credenciais inválidas. Por favor, tente novamente.');
        }
        return;
      }

      // Reset attempts on successful login
      setLoginAttempts(0);
      localStorage.removeItem('auth_lockout_end');
      showSuccessToast('Login realizado com sucesso!', 'Você foi logado no sistema.');
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      showErrorToast('Erro interno', 'Ocorreu um erro interno. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [sanitizeInput, isEmailValid, checkRateLimit, lockoutEnd, loginAttempts, navigate]);

  const handleSignup = useCallback(async (email: string, password: string, name: string) => {
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedName = sanitizeInput(name);

    if (!isEmailValid(sanitizedEmail)) {
      showErrorToast('Email inválido', 'Por favor, forneça um email válido.');
      return;
    }

    if (!sanitizedName || sanitizedName.length < 2) {
      showErrorToast('Nome inválido', 'O nome deve ter pelo menos 2 caracteres.');
      return;
    }

    if (!isPasswordValid(password)) {
      showErrorToast('Senha inválida', 'A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: password,
        options: {
          data: {
            name: sanitizedName
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      if (data.user) {
        showSuccessToast('Cadastro realizado com sucesso!', 'Sua conta foi criada. Verifique seu email para confirmar o cadastro.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      showErrorToast('Erro ao criar conta', error.message || 'Não foi possível criar sua conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [sanitizeInput, isEmailValid, isPasswordValid]);

  return {
    isLoading,
    isLocked,
    lockoutEnd,
    handleLogin,
    handleSignup,
    checkRateLimit
  };
};
