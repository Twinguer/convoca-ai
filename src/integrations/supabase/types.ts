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
      coach_access_logs: {
        Row: {
          accessed_data_category: string | null
          action_type: string
          coach_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          student_id: string
          user_agent: string | null
        }
        Insert: {
          accessed_data_category?: string | null
          action_type: string
          coach_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          student_id: string
          user_agent?: string | null
        }
        Update: {
          accessed_data_category?: string | null
          action_type?: string
          coach_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          student_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      coach_invitations_history: {
        Row: {
          coach_id: string
          consent_data: Json | null
          created_at: string | null
          expires_at: string
          id: string
          invitation_message: string | null
          invited_at: string | null
          relationship_id: string | null
          responded_at: string | null
          status: string
          student_email: string
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          consent_data?: Json | null
          created_at?: string | null
          expires_at: string
          id?: string
          invitation_message?: string | null
          invited_at?: string | null
          relationship_id?: string | null
          responded_at?: string | null
          status: string
          student_email: string
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          consent_data?: Json | null
          created_at?: string | null
          expires_at?: string
          id?: string
          invitation_message?: string | null
          invited_at?: string | null
          relationship_id?: string | null
          responded_at?: string | null
          status?: string
          student_email?: string
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_profiles: {
        Row: {
          alerts: Json
          coach_id: string
          coach_settings: Json
          coach_tasks: Json
          created_at: string | null
          id: string
          last_activity_date: string | null
          pending_invitations: Json
          student_relationships: Json
          team_statistics: Json
          updated_at: string | null
        }
        Insert: {
          alerts?: Json
          coach_id: string
          coach_settings?: Json
          coach_tasks?: Json
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          pending_invitations?: Json
          student_relationships?: Json
          team_statistics?: Json
          updated_at?: string | null
        }
        Update: {
          alerts?: Json
          coach_id?: string
          coach_settings?: Json
          coach_tasks?: Json
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          pending_invitations?: Json
          student_relationships?: Json
          team_statistics?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_subscriptions: {
        Row: {
          coach_id: string
          created_at: string | null
          current_students: number | null
          expires_at: string | null
          id: string
          max_students: number
          plan_type: string
          price: number
          status: string
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          current_students?: number | null
          expires_at?: string | null
          id?: string
          max_students: number
          plan_type: string
          price: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          current_students?: number | null
          expires_at?: string | null
          id?: string
          max_students?: number
          plan_type?: string
          price?: number
          status?: string
          updated_at?: string | null
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
          watermark_image_url: string | null
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
          watermark_image_url?: string | null
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
          watermark_image_url?: string | null
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
      payment_preferences: {
        Row: {
          amount: number
          created_at: string
          external_reference: string
          id: string
          mercado_pago_payment_data: Json | null
          payment_id: string | null
          plan_id: string
          preference_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          external_reference: string
          id?: string
          mercado_pago_payment_data?: Json | null
          payment_id?: string | null
          plan_id: string
          preference_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          external_reference?: string
          id?: string
          mercado_pago_payment_data?: Json | null
          payment_id?: string | null
          plan_id?: string
          preference_id?: string
          status?: string
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
      study_group_members: {
        Row: {
          group_id: string
          id: string
          invited_by: string | null
          joined_at: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          archived: boolean | null
          coach_id: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string
          current_members: number | null
          description: string | null
          focus_area: string | null
          group_settings: Json | null
          id: string
          max_members: number | null
          name: string
          post_retention_days: number | null
          posts_data: Json | null
          privacy_level: string
          target_concurso_id: string | null
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          coach_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by: string
          current_members?: number | null
          description?: string | null
          focus_area?: string | null
          group_settings?: Json | null
          id?: string
          max_members?: number | null
          name: string
          post_retention_days?: number | null
          posts_data?: Json | null
          privacy_level?: string
          target_concurso_id?: string | null
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          coach_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string
          current_members?: number | null
          description?: string | null
          focus_area?: string | null
          group_settings?: Json | null
          id?: string
          max_members?: number | null
          name?: string
          post_retention_days?: number | null
          posts_data?: Json | null
          privacy_level?: string
          target_concurso_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_groups_target_concurso_id_fkey"
            columns: ["target_concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "public_profiles"
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
          nickname: string
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
          nickname: string
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
          nickname?: string
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
          cooldown_hours: number | null
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string | null
          discount_value: number | null
          duration_months: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          max_uses_per_user: number | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at: string
          usage_limit_per_ip: number | null
          uses_count: number
          valid_from: string | null
          voucher_type: string
        }
        Insert: {
          code: string
          cooldown_hours?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          duration_months?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          max_uses_per_user?: number | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          usage_limit_per_ip?: number | null
          uses_count?: number
          valid_from?: string | null
          voucher_type?: string
        }
        Update: {
          code?: string
          cooldown_hours?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          duration_months?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          max_uses_per_user?: number | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          usage_limit_per_ip?: number | null
          uses_count?: number
          valid_from?: string | null
          voucher_type?: string
        }
        Relationships: []
      }
      vouchers_applied: {
        Row: {
          applied_at: string
          created_at: string
          discount_applied: number | null
          duration_months: number | null
          id: string
          ip_address: string | null
          plan: string
          user_agent: string | null
          user_id: string
          voucher_id: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          discount_applied?: number | null
          duration_months?: number | null
          id?: string
          ip_address?: string | null
          plan: string
          user_agent?: string | null
          user_id: string
          voucher_id: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          discount_applied?: number | null
          duration_months?: number | null
          id?: string
          ip_address?: string | null
          plan?: string
          user_agent?: string | null
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_applied_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard_rankings: {
        Row: {
          avatar_url: string | null
          banca: string | null
          concurso_id: string | null
          concurso_title: string | null
          orgao: string | null
          position: number | null
          ranking_key: string | null
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
            referencedRelation: "public_profiles"
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
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_rankings: {
        Row: {
          avatar_url: string | null
          banca: string | null
          concurso_id: string | null
          concurso_title: string | null
          created_at: string | null
          last_updated: string | null
          orgao: string | null
          ranking_key: string | null
          reservation_type: string | null
          score: number | null
          status: string | null
          subject_scores_tot: number | null
          subjective_scores: number | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_rankings_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
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
            referencedRelation: "public_profiles"
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
      vouchers_applied_with_users: {
        Row: {
          applied_at: string | null
          auth_email: string | null
          duration_months: number | null
          subscription_active: boolean | null
          subscription_expires_at: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          user_plan: Database["public"]["Enums"]["subscription_plan"] | null
          voucher_code: string | null
          voucher_created_at: string | null
          voucher_description: string | null
          voucher_expires_at: string | null
          voucher_plan: Database["public"]["Enums"]["subscription_plan"] | null
          voucher_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_coach_invitation: {
        Args: { p_consent_data?: Json; p_invitation_id: string }
        Returns: Json
      }
      add_completed_study_session: {
        Args: { session_data: Json; user_uuid: string }
        Returns: Json
      }
      add_group_post: {
        Args: {
          p_attachments?: Json
          p_author_id: string
          p_content: string
          p_group_id: string
        }
        Returns: Json
      }
      add_post_comment: {
        Args: {
          p_author_id: string
          p_content: string
          p_group_id: string
          p_parent_comment_id?: string
          p_post_id: string
        }
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
      add_student_to_coach: {
        Args: {
          p_coach_id: string
          p_consent_data?: Json
          p_student_id: string
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
      apply_subscription_voucher: {
        Args: { voucher_code: string }
        Returns: Json
      }
      apply_voucher: { Args: { voucher_code_param: string }; Returns: Json }
      calculate_post_expires_at: {
        Args: { p_group_id: string }
        Returns: string
      }
      calculate_ranking_positions: {
        Args: { p_concurso_id: string }
        Returns: Json
      }
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
      calculate_user_score_realtime: {
        Args: {
          p_concurso_id: string
          p_ranking_id: string
          p_selected_booklet: string
          p_user_id: string
        }
        Returns: number
      }
      calculate_weighted_scores: {
        Args: { p_concurso_id: string; p_scores: Json; p_user_id?: string }
        Returns: Json
      }
      cancel_coach_invitation: {
        Args: { p_coach_id: string; p_invitation_id: string }
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
      check_can_edit_answers:
        | {
            Args: { p_ranking_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.check_can_edit_answers(p_ranking_id => text), public.check_can_edit_answers(p_ranking_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { p_ranking_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.check_can_edit_answers(p_ranking_id => text), public.check_can_edit_answers(p_ranking_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      check_can_participate_ranking: {
        Args: { p_concurso_id: string }
        Returns: Json
      }
      check_if_can_invite_student: {
        Args: { p_coach_id: string }
        Returns: Json
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
      cleanup_old_audit_logs:
        | { Args: { p_retention_days?: number }; Returns: number }
        | { Args: never; Returns: number }
      cleanup_old_logs:
        | { Args: { days_to_keep?: number }; Returns: Json }
        | { Args: never; Returns: undefined }
      cleanup_old_score_logs: { Args: never; Returns: number }
      collect_performance_metrics: { Args: never; Returns: undefined }
      count_concurso_participants: {
        Args: { concurso_id: string }
        Returns: number
      }
      count_unread_notifications: {
        Args: { p_user_id: string }
        Returns: number
      }
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
      delete_group_post: {
        Args: { p_group_id: string; p_post_id: string }
        Returns: Json
      }
      delete_study_group: { Args: { p_group_id: string }; Returns: Json }
      delete_user_profile: { Args: { user_id_param: string }; Returns: boolean }
      extract_sessions_to_schedule: {
        Args: never
        Returns: {
          errors_count: number
          total_sessions_extracted: number
          users_migrated: number
        }[]
      }
      generate_unique_nickname: { Args: { base_name: string }; Returns: string }
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
      get_group_feed: {
        Args: { p_group_id: string; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_group_members: {
        Args: { p_group_id: string }
        Returns: {
          avatar_url: string
          id: string
          joined_at: string
          name: string
          role: string
          status: string
          user_id: string
        }[]
      }
      get_group_pending_requests: {
        Args: { p_group_id: string }
        Returns: {
          avatar_url: string
          id: string
          name: string
          requested_at: string
          user_id: string
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
      get_rankings_for_concurso: {
        Args: {
          p_concurso_id: string
          p_limit?: number
          p_offset?: number
          p_reservation_type?: string
        }
        Returns: {
          consolidated_data: Json
          user_id: string
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
      get_user_edit_limit: { Args: { p_user_id: string }; Returns: number }
      get_user_group_status: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: {
          has_requested: boolean
          is_invited: boolean
          is_member: boolean
          role: string
          status: string
        }[]
      }
      get_user_groups: {
        Args: { p_user_id: string }
        Returns: {
          coach_id: string
          cover_image_url: string
          created_at: string
          current_members: number
          description: string
          focus_area: string
          id: string
          joined_at: string
          max_members: number
          name: string
          posts_data: Json
          privacy_level: string
          role: string
        }[]
      }
      get_user_ranking_by_concurso: {
        Args: { p_concurso_id: string; p_user_id: string }
        Returns: Json
      }
      get_user_study_data: { Args: { user_uuid: string }; Returns: Json }
      get_user_subscription_plan: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["subscription_plan"]
      }
      has_active_subscription: { Args: { p_user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invite_user_to_group: {
        Args: { p_group_id: string; p_inviter_id: string; p_user_id: string }
        Returns: Json
      }
      is_candidate_classified: {
        Args: { p_concurso_id: string; p_ranking_id: string }
        Returns: boolean
      }
      is_group_admin: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_user_coach: { Args: { p_user_id: string }; Returns: boolean }
      is_user_pro: { Args: { p_user_id: string }; Returns: boolean }
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
      log_sensitive_action: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_resource_id: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: undefined
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
      recalc_concurso_scores_public: {
        Args: { p_concurso_id: string }
        Returns: Json
      }
      recalculate_all_scores: {
        Args: { p_concurso_id: string }
        Returns: undefined
      }
      recalculate_all_scores_improved: {
        Args: { p_concurso_id: string }
        Returns: Json
      }
      recalculate_all_scores_with_weights: {
        Args: { p_concurso_id: string }
        Returns: Json
      }
      recalculate_all_users_scores_realtime: {
        Args: { p_concurso_id: string }
        Returns: Json
      }
      recalculate_concurso_scores: {
        Args: { p_concurso_id: string }
        Returns: number
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
      remove_group_member: {
        Args: { p_admin_id: string; p_group_id: string; p_member_id: string }
        Returns: Json
      }
      remove_student_from_coach: {
        Args: { p_coach_id: string; p_student_id: string }
        Returns: undefined
      }
      remove_study_cycle: {
        Args: { cycle_id: string; user_uuid: string }
        Returns: Json
      }
      reorganize_answers_by_blocks_disciplines: {
        Args: { p_ranking_id: string }
        Returns: Json
      }
      request_to_join_group: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: Json
      }
      resolve_performance_alert: {
        Args: { alert_uuid: string }
        Returns: boolean
      }
      respond_to_join_request: {
        Args: {
          p_accept: boolean
          p_admin_id: string
          p_group_id: string
          p_member_id: string
        }
        Returns: Json
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
      save_user_answers_with_booklet: {
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
      send_coach_invitation: {
        Args: {
          p_coach_id: string
          p_invitation_message?: string
          p_student_nickname: string
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
      update_consolidated_data_and_recalculate: {
        Args: {
          p_concurso_id: string
          p_ranking_id: string
          p_updated_data: Json
          p_user_id: string
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
      user_is_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      user_participates_in_concurso: {
        Args: { p_concurso_id: string; p_user_id: string }
        Returns: boolean
      }
      validate_discount_voucher: {
        Args: { voucher_code_param: string }
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
