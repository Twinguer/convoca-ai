import { supabase } from '@/integrations/supabase/client';

export class SessionManager {
  private static sessionToken: string | null = null;
  private static expiresAt: Date | null = null;
  private static contextType: string | null = null;

  /**
   * Criar sessão de visualização de ranking
   */
  static async createViewSession(concursoId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('create-ranking-session', {
        body: {
          action: 'view',
          concurso_id: concursoId
        }
      });

      if (error || !data?.session_token) {
        console.error('[SessionManager] Failed to create view session:', error);
        return null;
      }

      this.sessionToken = data.session_token;
      this.expiresAt = new Date(data.expires_at);
      this.contextType = 'view_ranking';

      return data.session_token;
    } catch (error) {
      console.error('[SessionManager] Error creating view session:', error);
      return null;
    }
  }

  /**
   * Criar sessão de participação em ranking
   */
  static async createParticipateSession(concursoId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('create-ranking-session', {
        body: {
          action: 'participate',
          concurso_id: concursoId
        }
      });

      if (error || !data?.session_token) {
        console.error('[SessionManager] Failed to create participate session:', error);
        return null;
      }

      this.sessionToken = data.session_token;
      this.expiresAt = new Date(data.expires_at);
      this.contextType = 'participate_ranking';

      return data.session_token;
    } catch (error) {
      console.error('[SessionManager] Error creating participate session:', error);
      return null;
    }
  }

  /**
   * Criar sessão de edição de ranking
   */
  static async createEditSession(concursoId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('create-ranking-session', {
        body: {
          action: 'edit',
          concurso_id: concursoId
        }
      });

      if (error || !data?.session_token) {
        console.error('[SessionManager] Failed to create edit session:', error);
        return null;
      }

      this.sessionToken = data.session_token;
      this.expiresAt = new Date(data.expires_at);
      this.contextType = 'edit_ranking';

      return data.session_token;
    } catch (error) {
      console.error('[SessionManager] Error creating edit session:', error);
      return null;
    }
  }

  /**
   * Criar sessão para listagem de rankings
   */
  static async createListSession(): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('create-ranking-session', {
        body: {
          action: 'list'
        }
      });

      if (error || !data?.session_token) {
        console.error('[SessionManager] Failed to create list session:', error);
        return null;
      }

      this.sessionToken = data.session_token;
      this.expiresAt = new Date(data.expires_at);
      this.contextType = 'list_rankings';

      return data.session_token;
    } catch (error) {
      console.error('[SessionManager] Error creating list session:', error);
      return null;
    }
  }

  /**
   * Criar sessão para criação de ranking
   */
  static async createCreateSession(): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('create-ranking-session', {
        body: {
          action: 'create'
        }
      });

      if (error || !data?.session_token) {
        console.error('[SessionManager] Failed to create create session:', error);
        return null;
      }

      this.sessionToken = data.session_token;
      this.expiresAt = new Date(data.expires_at);
      this.contextType = 'create_ranking';

      return data.session_token;
    } catch (error) {
      console.error('[SessionManager] Error creating create session:', error);
      return null;
    }
  }

  /**
   * Obter token da sessão atual
   */
  static getSessionToken(): string | null {
    if (!this.sessionToken || !this.expiresAt) {
      return null;
    }

    if (new Date() >= this.expiresAt) {
      this.clearSession();
      return null;
    }

    return this.sessionToken;
  }

  /**
   * Obter contexto da sessão atual
   */
  static getContextType(): string | null {
    return this.contextType;
  }

  /**
   * Limpar sessão
   */
  static clearSession(): void {
    this.sessionToken = null;
    this.expiresAt = null;
    this.contextType = null;
  }

  /**
   * Verificar se sessão está ativa
   */
  static isSessionActive(): boolean {
    return this.getSessionToken() !== null;
  }

  /**
   * Obter tempo restante da sessão em minutos
   */
  static getTimeRemaining(): number {
    if (!this.expiresAt) return 0;
    
    const now = new Date();
    const remaining = this.expiresAt.getTime() - now.getTime();
    
    return Math.max(0, Math.floor(remaining / 1000 / 60));
  }
}
