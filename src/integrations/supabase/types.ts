export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          resource_id: string | null
          resource_type: string
          severity: string
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type: string
          severity: string
          status: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type?: string
          severity?: string
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_trail: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          operation: string
          session_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          session_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          session_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      concursos: {
        Row: {
          alternatives_count: number | null
          banca: string
          created_at: string
          created_by_user_id: string | null
          custom_banca: string | null
          custom_job_title: string | null
          data_publicacao: string | null
          disciplines: Json | null
          etapa_atual: string | null
          exam_booklets: Json | null
          exam_type: string | null
          form_config: Json | null
          has_cota: Json | null
          has_minimum_score: boolean | null
          has_quota_minimum_score: boolean | null
          id: string
          inscritos: number | null
          is_admin_created: boolean | null
          is_admin_update: boolean | null
          knowledgeAreas: string[] | null
          link: string | null
          localidades: string[] | null
          metadata: Json | null
          official_answers: Json | null
          orgao: string
          predefined_job_title: string | null
          quota_minimum_score: number | null
          status: string
          subjects: Json | null
          temp_disciplines_data: Json | null
          titulo: string
          total_minimum_score: number | null
          total_participants: number | null
          updated_at: string
          vagas: number | null
        }
        Insert: {
          alternatives_count?: number | null
          banca?: string
          created_at?: string
          created_by_user_id?: string | null
          custom_banca?: string | null
          custom_job_title?: string | null
          data_publicacao?: string | null
          disciplines?: Json | null
          etapa_atual?: string | null
          exam_booklets?: Json | null
          exam_type?: string | null
          form_config?: Json | null
          has_cota?: Json | null
          has_minimum_score?: boolean | null
          has_quota_minimum_score?: boolean | null
          id?: string
          inscritos?: number | null
          is_admin_created?: boolean | null
          is_admin_update?: boolean | null
          knowledgeAreas?: string[] | null
          link?: string | null
          localidades?: string[] | null
          metadata?: Json | null
          official_answers?: Json | null
          orgao: string
          predefined_job_title?: string | null
          quota_minimum_score?: number | null
          status?: string
          subjects?: Json | null
          temp_disciplines_data?: Json | null
          titulo: string
          total_minimum_score?: number | null
          total_participants?: number | null
          updated_at?: string
          vagas?: number | null
        }
        Update: {
          alternatives_count?: number | null
          banca?: string
          created_at?: string
          created_by_user_id?: string | null
          custom_banca?: string | null
          custom_job_title?: string | null
          data_publicacao?: string | null
          disciplines?: Json | null
          etapa_atual?: string | null
          exam_booklets?: Json | null
          exam_type?: string | null
          form_config?: Json | null
          has_cota?: Json | null
          has_minimum_score?: boolean | null
          has_quota_minimum_score?: boolean | null
          id?: string
          inscritos?: number | null
          is_admin_created?: boolean | null
          is_admin_update?: boolean | null
          knowledgeAreas?: string[] | null
          link?: string | null
          localidades?: string[] | null
          metadata?: Json | null
          official_answers?: Json | null
          orgao?: string
          predefined_job_title?: string | null
          quota_minimum_score?: number | null
          status?: string
          subjects?: Json | null
          temp_disciplines_data?: Json | null
          titulo?: string
          total_minimum_score?: number | null
          total_participants?: number | null
          updated_at?: string
          vagas?: number | null
        }
        Relationships: []
      }
      concursos_backup: {
        Row: {
          alternatives_count: number | null
          banca: string | null
          basic_knowledge_minimum_score: number | null
          basic_knowledge_questions: number | null
          basic_knowledge_weight: number | null
          case_study_1_minimum_score: number | null
          case_study_1_weight: number | null
          case_study_2_minimum_score: number | null
          case_study_2_weight: number | null
          case_study_3_minimum_score: number | null
          case_study_3_weight: number | null
          created_at: string | null
          created_by_user_id: string | null
          custom_banca: string | null
          custom_job_title: string | null
          custom_knowledge_questions: number | null
          custom_knowledge_weight: number | null
          data_publicacao: string | null
          disciplines: Json | null
          discursive_minimum_score: number | null
          discursive_weight: number | null
          etapa_atual: string | null
          exam_type: string | null
          has_ampla_concorrencia: boolean | null
          has_basic_knowledge: boolean | null
          has_case_study_1: boolean | null
          has_case_study_2: boolean | null
          has_case_study_3: boolean | null
          has_custom_knowledge: boolean | null
          has_discursive: boolean | null
          has_hipossuficientes: boolean | null
          has_indigenas: boolean | null
          has_minimum_score: boolean | null
          has_pcd: boolean | null
          has_ppp: boolean | null
          has_quota_minimum_score: boolean | null
          has_specific_knowledge_1: boolean | null
          has_specific_knowledge_2: boolean | null
          has_specific_knowledge_3: boolean | null
          has_transsexuais: boolean | null
          id: string | null
          inscritos: number | null
          is_admin_created: boolean | null
          is_admin_update: boolean | null
          knowledgeAreas: string[] | null
          link: string | null
          localidades: string[] | null
          minimum_score_type: string | null
          minimum_score_unit_type: string | null
          orgao: string | null
          predefined_job_title: string | null
          quota_minimum_score: number | null
          quota_minimum_score_unit_type: string | null
          specific_knowledge_1_minimum_score: number | null
          specific_knowledge_1_questions: number | null
          specific_knowledge_1_weight: number | null
          specific_knowledge_2_minimum_score: number | null
          specific_knowledge_2_questions: number | null
          specific_knowledge_2_weight: number | null
          specific_knowledge_3_minimum_score: number | null
          specific_knowledge_3_questions: number | null
          specific_knowledge_3_weight: number | null
          status: string | null
          subjects: Json | null
          temp_disciplines_data: Json | null
          titulo: string | null
          total_minimum_score: number | null
          updated_at: string | null
          vagas: number | null
          wrong_answer_penalty: number | null
        }
        Insert: {
          alternatives_count?: number | null
          banca?: string | null
          basic_knowledge_minimum_score?: number | null
          basic_knowledge_questions?: number | null
          basic_knowledge_weight?: number | null
          case_study_1_minimum_score?: number | null
          case_study_1_weight?: number | null
          case_study_2_minimum_score?: number | null
          case_study_2_weight?: number | null
          case_study_3_minimum_score?: number | null
          case_study_3_weight?: number | null
          created_at?: string | null
          created_by_user_id?: string | null
          custom_banca?: string | null
          custom_job_title?: string | null
          custom_knowledge_questions?: number | null
          custom_knowledge_weight?: number | null
          data_publicacao?: string | null
          disciplines?: Json | null
          discursive_minimum_score?: number | null
          discursive_weight?: number | null
          etapa_atual?: string | null
          exam_type?: string | null
          has_ampla_concorrencia?: boolean | null
          has_basic_knowledge?: boolean | null
          has_case_study_1?: boolean | null
          has_case_study_2?: boolean | null
          has_case_study_3?: boolean | null
          has_custom_knowledge?: boolean | null
          has_discursive?: boolean | null
          has_hipossuficientes?: boolean | null
          has_indigenas?: boolean | null
          has_minimum_score?: boolean | null
          has_pcd?: boolean | null
          has_ppp?: boolean | null
          has_quota_minimum_score?: boolean | null
          has_specific_knowledge_1?: boolean | null
          has_specific_knowledge_2?: boolean | null
          has_specific_knowledge_3?: boolean | null
          has_transsexuais?: boolean | null
          id?: string | null
          inscritos?: number | null
          is_admin_created?: boolean | null
          is_admin_update?: boolean | null
          knowledgeAreas?: string[] | null
          link?: string | null
          localidades?: string[] | null
          minimum_score_type?: string | null
          minimum_score_unit_type?: string | null
          orgao?: string | null
          predefined_job_title?: string | null
          quota_minimum_score?: number | null
          quota_minimum_score_unit_type?: string | null
          specific_knowledge_1_minimum_score?: number | null
          specific_knowledge_1_questions?: number | null
          specific_knowledge_1_weight?: number | null
          specific_knowledge_2_minimum_score?: number | null
          specific_knowledge_2_questions?: number | null
          specific_knowledge_2_weight?: number | null
          specific_knowledge_3_minimum_score?: number | null
          specific_knowledge_3_questions?: number | null
          specific_knowledge_3_weight?: number | null
          status?: string | null
          subjects?: Json | null
          temp_disciplines_data?: Json | null
          titulo?: string | null
          total_minimum_score?: number | null
          updated_at?: string | null
          vagas?: number | null
          wrong_answer_penalty?: number | null
        }
        Update: {
          alternatives_count?: number | null
          banca?: string | null
          basic_knowledge_minimum_score?: number | null
          basic_knowledge_questions?: number | null
          basic_knowledge_weight?: number | null
          case_study_1_minimum_score?: number | null
          case_study_1_weight?: number | null
          case_study_2_minimum_score?: number | null
          case_study_2_weight?: number | null
          case_study_3_minimum_score?: number | null
          case_study_3_weight?: number | null
          created_at?: string | null
          created_by_user_id?: string | null
          custom_banca?: string | null
          custom_job_title?: string | null
          custom_knowledge_questions?: number | null
          custom_knowledge_weight?: number | null
          data_publicacao?: string | null
          disciplines?: Json | null
          discursive_minimum_score?: number | null
          discursive_weight?: number | null
          etapa_atual?: string | null
          exam_type?: string | null
          has_ampla_concorrencia?: boolean | null
          has_basic_knowledge?: boolean | null
          has_case_study_1?: boolean | null
          has_case_study_2?: boolean | null
          has_case_study_3?: boolean | null
          has_custom_knowledge?: boolean | null
          has_discursive?: boolean | null
          has_hipossuficientes?: boolean | null
          has_indigenas?: boolean | null
          has_minimum_score?: boolean | null
          has_pcd?: boolean | null
          has_ppp?: boolean | null
          has_quota_minimum_score?: boolean | null
          has_specific_knowledge_1?: boolean | null
          has_specific_knowledge_2?: boolean | null
          has_specific_knowledge_3?: boolean | null
          has_transsexuais?: boolean | null
          id?: string | null
          inscritos?: number | null
          is_admin_created?: boolean | null
          is_admin_update?: boolean | null
          knowledgeAreas?: string[] | null
          link?: string | null
          localidades?: string[] | null
          minimum_score_type?: string | null
          minimum_score_unit_type?: string | null
          orgao?: string | null
          predefined_job_title?: string | null
          quota_minimum_score?: number | null
          quota_minimum_score_unit_type?: string | null
          specific_knowledge_1_minimum_score?: number | null
          specific_knowledge_1_questions?: number | null
          specific_knowledge_1_weight?: number | null
          specific_knowledge_2_minimum_score?: number | null
          specific_knowledge_2_questions?: number | null
          specific_knowledge_2_weight?: number | null
          specific_knowledge_3_minimum_score?: number | null
          specific_knowledge_3_questions?: number | null
          specific_knowledge_3_weight?: number | null
          status?: string | null
          subjects?: Json | null
          temp_disciplines_data?: Json | null
          titulo?: string | null
          total_minimum_score?: number | null
          updated_at?: string | null
          vagas?: number | null
          wrong_answer_penalty?: number | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_message: string
          error_type: string
          id: string
          ip_address: unknown
          is_resolved: boolean | null
          metadata: Json | null
          query_text: string | null
          resolved_at: string | null
          session_id: string | null
          severity: string
          stack_trace: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message: string
          error_type: string
          id?: string
          ip_address?: unknown
          is_resolved?: boolean | null
          metadata?: Json | null
          query_text?: string | null
          resolved_at?: string | null
          session_id?: string | null
          severity: string
          stack_trace?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string
          error_type?: string
          id?: string
          ip_address?: unknown
          is_resolved?: boolean | null
          metadata?: Json | null
          query_text?: string | null
          resolved_at?: string | null
          session_id?: string | null
          severity?: string
          stack_trace?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      migration_config: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      migration_logs: {
        Row: {
          applied_at: string | null
          details: Json | null
          id: number
          migration_name: string
        }
        Insert: {
          applied_at?: string | null
          details?: Json | null
          id?: number
          migration_name: string
        }
        Update: {
          applied_at?: string | null
          details?: Json | null
          id?: number
          migration_name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          current_value: number | null
          id: string
          is_resolved: boolean | null
          message: string
          metadata: Json | null
          metric_name: string | null
          resolved_at: string | null
          severity: string
          threshold_value: number | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          current_value?: number | null
          id?: string
          is_resolved?: boolean | null
          message: string
          metadata?: Json | null
          metric_name?: string | null
          resolved_at?: string | null
          severity: string
          threshold_value?: number | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          current_value?: number | null
          id?: string
          is_resolved?: boolean | null
          message?: string
          metadata?: Json | null
          metric_name?: string | null
          resolved_at?: string | null
          severity?: string
          threshold_value?: number | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string | null
          id: string
          measurement_time: string | null
          metadata: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          measurement_time?: string | null
          metadata?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          measurement_time?: string | null
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
        }
        Relationships: []
      }
      query_performance_logs: {
        Row: {
          created_at: string | null
          execution_time_ms: number
          id: string
          ip_address: unknown
          metadata: Json | null
          query_text: string
          query_type: string | null
          rows_returned: number | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          execution_time_ms: number
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          query_text: string
          query_type?: string | null
          rows_returned?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          execution_time_ms?: number
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          query_text?: string
          query_type?: string | null
          rows_returned?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      score_calculation_logs: {
        Row: {
          calculation_details: Json | null
          calculation_type: string
          created_at: string | null
          id: string
          new_score: number | null
          previous_score: number | null
          user_ranking_id: string | null
        }
        Insert: {
          calculation_details?: Json | null
          calculation_type: string
          created_at?: string | null
          id?: string
          new_score?: number | null
          previous_score?: number | null
          user_ranking_id?: string | null
        }
        Update: {
          calculation_details?: Json | null
          calculation_type?: string
          created_at?: string | null
          id?: string
          new_score?: number | null
          previous_score?: number | null
          user_ranking_id?: string | null
        }
        Relationships: []
      }
      secure_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          last_used_at: string | null
          metadata: Json | null
          revoked_at: string | null
          token_hash: string
          token_type: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown
          last_used_at?: string | null
          metadata?: Json | null
          revoked_at?: string | null
          token_hash: string
          token_type: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          last_used_at?: string | null
          metadata?: Json | null
          revoked_at?: string | null
          token_hash?: string
          token_type?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_followers: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      user_rankings: {
        Row: {
          consolidated_data: Json | null
          user_id: string
        }
        Insert: {
          consolidated_data?: Json | null
          user_id: string
        }
        Update: {
          consolidated_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_rankings_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_rankings_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_study_v2: {
        Row: {
          created_at: string | null
          id: string
          last_activity_date: string | null
          study_cycles: Json | null
          study_metadata: Json | null
          study_schedule: Json | null
          study_sessions: Json | null
          study_statistics: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          study_cycles?: Json | null
          study_metadata?: Json | null
          study_schedule?: Json | null
          study_sessions?: Json | null
          study_statistics?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          study_cycles?: Json | null
          study_metadata?: Json | null
          study_schedule?: Json | null
          study_sessions?: Json | null
          study_statistics?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string
          updated_at: string
          user_id: string
          voucher_code: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          updated_at?: string
          user_id: string
          voucher_code?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          updated_at?: string
          user_id?: string
          voucher_code?: string | null
        }
        Relationships: []
      }
      users_profiles: {
        Row: {
          area_estudos: string | null
          avatar_url: string | null
          bio: string | null
          cargo_atual: string | null
          concursos_aprovados: string | null
          concursos_participando: string | null
          created_at: string
          curso_preparatorio: string | null
          email: string
          especialidade: string | null
          estado: string | null
          formacao: string | null
          id: string
          is_online: boolean | null
          is_studying: boolean | null
          name: string
          nickname: string | null
          privacy_settings: Json | null
          profile_text: string | null
          rotina_estudos: string | null
          status_concurseiro: string | null
          study_started_at: string | null
          updated_at: string
        }
        Insert: {
          area_estudos?: string | null
          avatar_url?: string | null
          bio?: string | null
          cargo_atual?: string | null
          concursos_aprovados?: string | null
          concursos_participando?: string | null
          created_at?: string
          curso_preparatorio?: string | null
          email: string
          especialidade?: string | null
          estado?: string | null
          formacao?: string | null
          id: string
          is_online?: boolean | null
          is_studying?: boolean | null
          name: string
          nickname?: string | null
          privacy_settings?: Json | null
          profile_text?: string | null
          rotina_estudos?: string | null
          status_concurseiro?: string | null
          study_started_at?: string | null
          updated_at?: string
        }
        Update: {
          area_estudos?: string | null
          avatar_url?: string | null
          bio?: string | null
          cargo_atual?: string | null
          concursos_aprovados?: string | null
          concursos_participando?: string | null
          created_at?: string
          curso_preparatorio?: string | null
          email?: string
          especialidade?: string | null
          estado?: string | null
          formacao?: string | null
          id?: string
          is_online?: boolean | null
          is_studying?: boolean | null
          name?: string
          nickname?: string | null
          privacy_settings?: Json | null
          profile_text?: string | null
          rotina_estudos?: string | null
          status_concurseiro?: string | null
          study_started_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          duration_months: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          duration_months?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          duration_months?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          id: string | null
          name: string | null
        }
        Relationships: []
      }
      public_user_profiles: {
        Row: {
          avatar_url: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          avatar_url?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      v_concurso_statistics: {
        Row: {
          average_score: number | null
          classified_count: number | null
          concurso_id: string | null
          eliminated_count: number | null
          max_score: number | null
          min_score: number | null
          total_participants: number | null
        }
        Relationships: []
      }
      v_user_rankings_with_profiles: {
        Row: {
          avatar_url: string | null
          concurso_id: string | null
          edit_count: number | null
          last_updated: string | null
          ranking_id: string | null
          reservation_type: string | null
          score: number | null
          status: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_rankings_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_rankings_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_completed_study_session: {
        Args: { session_data: Json; user_uuid: string }
        Returns: Json
      }
      add_schedule_session: {
        Args: {
          p_cycle_id: string
          p_day_of_week: number
          p_session_data: Json
        }
        Returns: Json
      }
      add_study_session: {
        Args: { session_data: Json; user_uuid: string }
        Returns: undefined
      }
      admin_delete_user_from_ranking: {
        Args: { ranking_id_param: string }
        Returns: boolean
      }
      admin_delete_user_profile: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      admin_send_notification: {
        Args: {
          p_message: string
          p_target_id: string
          p_target_type: string
          p_title: string
        }
        Returns: boolean
      }
      apply_voucher: { Args: { voucher_code_param: string }; Returns: Json }
      calculate_secure_score: {
        Args: {
          p_discipline_weight?: number
          p_exam_type?: string
          p_is_blank?: boolean
          p_is_correct?: boolean
          p_is_nullified?: boolean
          p_question_weight?: number
          p_wrong_answer_penalty?: number
        }
        Returns: Json
      }
      calculate_secure_score_with_validation: {
        Args: {
          p_concurso_id: string
          p_discipline_weight: number
          p_exam_type: string
          p_is_blank: boolean
          p_is_correct: boolean
          p_is_nullified: boolean
          p_question_weight: number
          p_user_id: string
          p_wrong_answer_penalty: number
        }
        Returns: Json
      }
      calculate_study_statistics: { Args: { user_uuid: string }; Returns: Json }
      calculate_study_statistics_from_sessions: {
        Args: { v_sessions: Json }
        Returns: Json
      }
      calculate_user_score_realtime:
        | {
            Args: {
              p_concurso_id: string
              p_ranking_id: string
              p_selected_booklet: string
              p_user_id: string
            }
            Returns: number
          }
        | { Args: { p_ranking_id: string }; Returns: number }
      calculate_weighted_scores: {
        Args: { p_concurso_id: string; p_scores: Json; p_user_id?: string }
        Returns: Json
      }
      check_advanced_performance_alerts: {
        Args: never
        Returns: {
          alert_id: string
          alert_type: string
          created_at: string
          current_value: number
          message: string
          metric_name: string
          severity: string
          threshold_value: number
        }[]
      }
      check_performance_alerts: { Args: never; Returns: undefined }
      check_rate_limit: {
        Args: {
          p_action: string
          p_max_requests?: number
          p_time_window_seconds?: number
          p_user_id: string
        }
        Returns: Json
      }
      check_resource_permission: {
        Args: {
          p_action: string
          p_resource_id: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      check_user_permission: {
        Args: { p_concurso_id: string; p_user_id: string }
        Returns: boolean
      }
      cleanup_expired_tokens: { Args: never; Returns: number }
      cleanup_old_alerts: { Args: never; Returns: number }
      cleanup_old_audit_logs: {
        Args: { p_retention_days?: number }
        Returns: number
      }
      cleanup_old_logs:
        | { Args: { days_to_keep?: number }; Returns: Json }
        | { Args: never; Returns: undefined }
      collect_performance_metrics: { Args: never; Returns: undefined }
      count_concurso_participants: {
        Args: { concurso_id: string }
        Returns: number
      }
      count_unread_notifications: {
        Args: { p_user_id: string }
        Returns: number
      }
      count_user_followers: { Args: { user_id: string }; Returns: number }
      count_user_posts: { Args: { user_id: string }; Returns: number }
      debug_save_user_answers_v3: {
        Args: {
          p_answers: Json
          p_booklet_id: string
          p_concurso_id: string
          p_current_edit_count?: number
          p_ranking_id: string
          p_subjective_scores?: Json
        }
        Returns: Json
      }
      delete_user_profile: { Args: { user_id_param: string }; Returns: boolean }
      extract_sessions_to_schedule: {
        Args: never
        Returns: {
          errors_count: number
          total_sessions_extracted: number
          users_migrated: number
        }[]
      }
      get_alert_statistics: {
        Args: never
        Returns: {
          alerts_last_24h: number
          critical_alerts: number
          high_alerts: number
          low_alerts: number
          medium_alerts: number
          most_common_alert_type: string
          total_alerts: number
          unresolved_alerts: number
        }[]
      }
      get_alert_summary: {
        Args: never
        Returns: {
          alert_type: string
          count: number
          latest_alert: string
          severity: string
          status: string
        }[]
      }
      get_audit_trail_stats: { Args: never; Returns: Json }
      get_booklet_answers: {
        Args: { p_booklet_id: string; p_ranking_id: string }
        Returns: Json
      }
      get_complete_dashboard: {
        Args: never
        Returns: {
          data: Json
          section: string
        }[]
      }
      get_concurso_rankings: {
        Args: { p_concurso_id: string }
        Returns: {
          ranking_data: Json
          ranking_id: string
          user_id: string
        }[]
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_followers_list: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          id: string
          name: string
        }[]
      }
      get_following_list: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          id: string
          name: string
        }[]
      }
      get_jsonb_analysis: {
        Args: never
        Returns: {
          avg_size_bytes: number
          column_name: string
          max_size_bytes: number
          min_size_bytes: number
          performance_rating: string
          total_records: number
          total_size_mb: number
        }[]
      }
      get_log_statistics: {
        Args: never
        Returns: {
          avg_execution_time_ms: number
          error_rate: number
          log_type: string
          logs_last_24h: number
          logs_last_7d: number
          total_logs: number
        }[]
      }
      get_performance_dashboard: {
        Args: never
        Returns: {
          current_value: number
          metric_category: string
          metric_name: string
          recommendation: string
          status: string
          trend: string
          unit: string
        }[]
      }
      get_performance_trends: {
        Args: { hours_back?: number }
        Returns: {
          measurement_time: string
          metric_name: string
          metric_value: number
          trend_percentage: number
          unit: string
        }[]
      }
      get_public_profiles: {
        Args: never
        Returns: {
          avatar_url: string
          id: string
          name: string
        }[]
      }
      get_ranking_classification: {
        Args: {
          p_concurso_id: string
          p_limit?: number
          p_offset?: number
          p_selected_booklet?: string
        }
        Returns: {
          accuracy: number
          basic_knowledge_score: number
          case_study_1_score: number
          case_study_2_score: number
          case_study_3_score: number
          correct_answers: number
          discursive_score: number
          ranking_position: number
          specific_knowledge_1_score: number
          specific_knowledge_2_score: number
          specific_knowledge_3_score: number
          total_questions: number
          total_score: number
          user_id: string
          user_name: string
        }[]
      }
      get_realtime_rankings: {
        Args: { p_concurso_id: string; p_reservation_type?: string }
        Returns: {
          avatar_url: string
          basic_knowledge_score: number
          case_study_1_score: number
          case_study_2_score: number
          case_study_3_score: number
          customDisciplineScores: Json
          discursive_score: number
          is_classified: boolean
          ranking_id: string
          reservation_type: string
          score: number
          specific_knowledge_1_score: number
          specific_knowledge_2_score: number
          specific_knowledge_3_score: number
          specific_knowledge_score: number
          user_id: string
          user_name: string
          weighted_basic_score: number
          weighted_case_study_1_score: number
          weighted_case_study_2_score: number
          weighted_case_study_3_score: number
          weighted_discursive_score: number
          weighted_specific_1_score: number
          weighted_specific_2_score: number
          weighted_specific_3_score: number
          weightedCustomDisciplineScores: Json
        }[]
      }
      get_system_overview: {
        Args: never
        Returns: {
          current_value: number
          last_updated: string
          metric_name: string
          status: string
          trend_direction: string
          unit: string
        }[]
      }
      get_user_activity_summary: {
        Args: never
        Returns: {
          description: string
          metric_name: string
          metric_value: number
          unit: string
        }[]
      }
      get_user_answers_consolidated: {
        Args: { p_ranking_id: string }
        Returns: Json
      }
      get_user_answers_for_booklet: {
        Args: {
          p_booklet_id: string
          p_concurso_id: string
          p_ranking_id: string
        }
        Returns: Json
      }
      get_user_answers_jsonb: {
        Args: { p_booklet_id?: string; p_ranking_id: string }
        Returns: Json
      }
      get_user_booklets_with_answers: {
        Args: { p_ranking_id: string }
        Returns: Json
      }
      get_user_consolidated_answers: {
        Args: { p_concurso_id?: string; p_ranking_id: string }
        Returns: Json
      }
      get_user_display_name: {
        Args: { user_name: string; user_nickname: string }
        Returns: string
      }
      get_user_ranking_by_concurso: {
        Args: { p_concurso_id: string; p_user_id: string }
        Returns: Json
      }
      get_user_study_data: { Args: { user_uuid: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_candidate_classified: {
        Args: { p_concurso_id: string; p_ranking_id: string }
        Returns: boolean
      }
      log_admin_operation: {
        Args: { operation_details?: Json; operation_type: string }
        Returns: undefined
      }
      log_audit_trail: {
        Args: {
          p_ip_address?: unknown
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_operation: string
          p_session_id?: string
          p_table_name: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      log_error: {
        Args: {
          p_error_message: string
          p_error_type: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_query_text?: string
          p_session_id?: string
          p_severity?: string
          p_stack_trace?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      log_query_performance: {
        Args: {
          p_execution_time_ms: number
          p_ip_address?: unknown
          p_metadata?: Json
          p_query_text: string
          p_query_type?: string
          p_rows_returned?: number
          p_session_id?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      manage_exam_booklets_v2: {
        Args: {
          p_booklet_id?: string
          p_booklets?: Json
          p_concurso_id?: string
          p_display_order?: number
          p_name?: string
          p_operation: string
        }
        Returns: Json
      }
      migrate_completed_sessions_to_study_sessions: {
        Args: never
        Returns: {
          cycles_count: number
          sessions_extracted: number
          user_id: string
        }[]
      }
      migrate_flat_subject_scores_to_consolidated: {
        Args: never
        Returns: Json
      }
      migrate_subjective_scores_to_consolidated: {
        Args: never
        Returns: undefined
      }
      migrate_to_consolidated_structure: { Args: never; Returns: Json }
      migrate_user_study_to_v2: { Args: never; Returns: undefined }
      monitor_database_performance: {
        Args: never
        Returns: {
          metric_name: string
          metric_unit: string
          metric_value: number
          recommendation: string
          status: string
        }[]
      }
      monitor_jsonb_performance: {
        Args: never
        Returns: {
          avg_jsonb_size: number
          column_name: string
          gin_index_size: number
          max_jsonb_size: number
          performance_status: string
          table_name: string
          total_records: number
        }[]
      }
      recalculate_all_scores: {
        Args: { p_concurso_id: string }
        Returns: undefined
      }
      recalculate_all_scores_improved: {
        Args: { p_concurso_id: string }
        Returns: Json
      }
      recalculate_all_scores_with_weights:
        | {
            Args: { p_concurso_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.recalculate_all_scores_with_weights(p_concurso_id => text), public.recalculate_all_scores_with_weights(p_concurso_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { p_concurso_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.recalculate_all_scores_with_weights(p_concurso_id => text), public.recalculate_all_scores_with_weights(p_concurso_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      recalculate_all_users_scores_realtime: {
        Args: { p_concurso_id: string }
        Returns: Json
      }
      recalculate_specific_users_scores: {
        Args: { p_concurso_id: string; p_user_ids: string[] }
        Returns: Json
      }
      record_completed_session: {
        Args: {
          p_cycle_id: string
          p_day_of_week: number
          p_session_details: Json
          p_session_id: string
        }
        Returns: Json
      }
      refresh_public_rankings_cache: { Args: never; Returns: undefined }
      remove_study_cycle: {
        Args: { cycle_id: string; user_uuid: string }
        Returns: Json
      }
      reorganize_answers_by_blocks_disciplines: {
        Args: { p_ranking_id: string }
        Returns: Json
      }
      resolve_performance_alert: {
        Args: { alert_uuid: string }
        Returns: boolean
      }
      restructure_user_answers_by_concurso: { Args: never; Returns: undefined }
      rollback_optimizations: { Args: never; Returns: string }
      safe_upsert_user_study_data: {
        Args: { study_data: Json; user_uuid: string }
        Returns: Json
      }
      save_consolidated_answer_key: {
        Args: { p_answers: Json; p_booklet_id: string; p_concurso_id: string }
        Returns: Json
      }
      save_scores_transaction: {
        Args: {
          p_ranking_id: string
          p_raw_scores: Json
          p_subjective_scores: Json
          p_weighted_scores: Json
        }
        Returns: Json
      }
      save_user_answers_and_calculate_scores: {
        Args: {
          p_answers: Json
          p_concurso_id: string
          p_ranking_id: string
          p_selected_booklet: string
          p_subjective_scores?: Json
          p_user_id: string
        }
        Returns: Json
      }
      save_user_answers_consolidated_by_concurso: {
        Args: {
          p_answers: Json
          p_booklet_id: string
          p_case_study_1_score?: number
          p_case_study_2_score?: number
          p_case_study_3_score?: number
          p_concurso_id: string
          p_current_edit_count?: number
          p_discursive_score?: number
          p_ranking_id: string
          p_subject_scores?: Json
        }
        Returns: Json
      }
      save_user_answers_simple: {
        Args: {
          p_answers: Json
          p_booklet_id: string
          p_concurso_id: string
          p_ranking_id: string
          p_subjective_scores?: Json
        }
        Returns: Json
      }
      save_user_answers_v2: {
        Args: {
          p_answers: Json
          p_case_study_1_score?: number
          p_case_study_2_score?: number
          p_case_study_3_score?: number
          p_discursive_score?: number
          p_edit_count?: number
          p_selected_booklet?: string
          p_user_ranking_id: string
        }
        Returns: Json
      }
      save_user_answers_v3: {
        Args: {
          p_answers: Json
          p_booklet_id: string
          p_concurso_id: string
          p_current_edit_count?: number
          p_ranking_id: string
          p_subjective_scores?: Json
        }
        Returns: Json
      }
      save_user_answers_v3_debug: {
        Args: {
          p_answers: Json
          p_booklet_id: string
          p_concurso_id: string
          p_current_edit_count?: number
          p_ranking_id: string
          p_subjective_scores?: Json
        }
        Returns: Json
      }
      save_user_answers_with_booklet:
        | {
            Args: {
              p_answers_data: Json
              p_concurso_id: string
              p_reservation_type?: string
              p_selected_booklet?: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_answers: Json
              p_booklet_id: string
              p_case_study_1_score?: number
              p_case_study_2_score?: number
              p_case_study_3_score?: number
              p_concurso_id: string
              p_current_edit_count?: number
              p_discursive_score?: number
              p_ranking_id: string
            }
            Returns: Json
          }
      start_continuous_monitoring: { Args: never; Returns: undefined }
      switch_user_booklet: {
        Args: { p_booklet_id: string; p_ranking_id: string }
        Returns: Json
      }
      sync_user_study_v2_data: {
        Args: {
          cycles_data?: Json
          metadata_data?: Json
          schedule_data?: Json
          sessions_data?: Json
          statistics_data?: Json
          user_uuid: string
        }
        Returns: Json
      }
      test_calculate_user_score_realtime: {
        Args: { p_ranking_id: string; p_user_id: string }
        Returns: number
      }
      test_disciplines_mapping: {
        Args: { p_concurso_id: string }
        Returns: Json
      }
      test_save_user_answers_v3: {
        Args: {
          p_answers: Json
          p_booklet_id: string
          p_concurso_id: string
          p_current_edit_count?: number
          p_ranking_id: string
          p_subjective_scores?: Json
        }
        Returns: Json
      }
      update_consolidated_data_with_reorganized_answers: {
        Args: { p_ranking_id: string }
        Returns: Json
      }
      update_study_statistics: {
        Args: { stats_data: Json; user_uuid: string }
        Returns: undefined
      }
      update_user_ranking: {
        Args: { p_ranking_data: Json; p_ranking_id: string; p_user_id: string }
        Returns: boolean
      }
      upsert_study_cycle: {
        Args: { cycle_data: Json; user_uuid: string }
        Returns: Json
      }
      upsert_user_study_data: {
        Args: { study_data: Json; user_uuid: string }
        Returns: Json
      }
      validate_input_security: {
        Args: { p_input: string; p_max_length?: number }
        Returns: Json
      }
      validate_ranking_data: {
        Args: { p_answers: Json; p_concurso_id: string; p_user_id: string }
        Returns: Json
      }
      validate_score_update_permission: {
        Args: { p_user_id: string; p_user_ranking_id: string }
        Returns: boolean
      }
      validate_scoring_input: {
        Args: {
          p_discipline_weight: number
          p_exam_type: string
          p_is_blank: boolean
          p_is_correct: boolean
          p_is_nullified: boolean
          p_question_weight: number
          p_wrong_answer_penalty: number
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      subscription_plan: "free" | "pro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      subscription_plan: ["free", "pro"],
    },
  },
} as const
