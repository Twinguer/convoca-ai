import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '@/integrations/supabase/toast-utils';
import { PasswordValidator } from '@/utils/passwordValidator';
import { RateLimiters } from '@/utils/rateLimiter';
import { logError, logSecurity } from '@/utils/secureLogger';
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

  // Robust password validation using security requirements
  const isPasswordValid = useCallback((password: string): boolean => {
    const validation = PasswordValidator.validate(password);
    return validation.isValid;
  }, []);

  // Get password validation details for UI feedback
  const getPasswordValidation = useCallback((password: string) => {
    return PasswordValidator.validate(password);
  }, []);

  // Check for rate limiting using advanced rate limiter
  const checkRateLimit = useCallback((email: string): boolean => {
    // Check both local storage and rate limiter
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

    // Check rate limiter
    const rateLimitResult = RateLimiters.auth.check(email, false);
    if (!rateLimitResult.allowed) {
      const lockoutTime = Date.now() + (rateLimitResult.retryAfter || 900) * 1000;
      localStorage.setItem('auth_lockout_end', lockoutTime.toString());
      setIsLocked(true);
      setLockoutEnd(lockoutTime);
      return false;
    }

    return true;
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    if (!checkRateLimit(email)) {
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
      navigate('/');
    } catch (error: any) {
      logError('Login failed', { error: error.message }, 'AUTH');
      logSecurity('Login attempt failed', { email: sanitizedEmail }, 'AUTH');
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
      showErrorToast('Senha inválida', 'A senha deve ter entre 8 e 72 caracteres.');
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
          emailRedirectTo: `${window.location.origin}/auth/confirmacao-sucesso#`
        }
      });

      if (error) {
        // Tratar erro específico de usuário já existente
        if (error.message?.includes('User already registered') || error.message?.includes('already registered')) {
          showErrorToast('Email já cadastrado', 'Este email já está registrado. Verifique sua caixa de entrada ou tente fazer login.');
          return;
        }
        throw error;
      }

      if (data.user) {
        // Criar perfil manualmente (temporário até o trigger funcionar)
        try {
          const { error: profileError } = await supabase
            .from('users_profiles')
            .insert({
              id: data.user.id,
              email: sanitizedEmail,
              name: sanitizedName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            // Se já existe, não é erro
            if (!profileError.message?.includes('duplicate key') && !profileError.message?.includes('unique constraint')) {
              console.warn('Erro ao criar perfil:', profileError.message);
            }
          }
        } catch (profileErr) {
          console.warn('Erro ao criar perfil:', profileErr);
        }

        if (data.user.email_confirmed_at) {
          showSuccessToast('Cadastro realizado com sucesso!', 'Sua conta foi criada e confirmada automaticamente.');
        } else {
          showSuccessToast('Cadastro realizado com sucesso!', 'Verifique seu email para confirmar o cadastro. Caso não receba o email, verifique a caixa de spam.');
        }
      }
    } catch (error: any) {
      logError('Signup failed', { error: error.message }, 'AUTH');
      logSecurity('Signup attempt failed', { email: sanitizedEmail }, 'AUTH');
      
      // Mensagem específica baseada no tipo de erro
      let errorMessage = 'Não foi possível criar sua conta. Tente novamente.';
      
      if (error.message?.includes('Invalid email')) {
        errorMessage = 'Email inválido. Verifique o formato do email.';
      } else if (error.message?.includes('Password')) {
        errorMessage = 'A senha não atende aos critérios de segurança.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      showErrorToast('Erro ao criar conta', errorMessage);
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