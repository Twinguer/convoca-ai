export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      answer_key: {
        Row: {
          concurso_id: string | null
          correct_answer: string | null
          id: number
          question_number: string | null
        }
        Insert: {
          concurso_id?: string | null
          correct_answer?: string | null
          id?: number
          question_number?: string | null
        }
        Update: {
          concurso_id?: string | null
          correct_answer?: string | null
          id?: number
          question_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answer_key_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      answer_key_access_log: {
        Row: {
          access_timestamp: string | null
          concurso_id: string | null
          id: number
          user_id: string | null
        }
        Insert: {
          access_timestamp?: string | null
          concurso_id?: string | null
          id?: number
          user_id?: string | null
        }
        Update: {
          access_timestamp?: string | null
          concurso_id?: string | null
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answer_key_access_log_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      concurso_subjects: {
        Row: {
          concurso_id: string
          created_at: string | null
          id: string
          knowledge_section: string
          minimum_score: number | null
          minimum_score_unit_type: string | null
          question_count: number
          subject_id: string
          updated_at: string | null
        }
        Insert: {
          concurso_id: string
          created_at?: string | null
          id?: string
          knowledge_section: string
          minimum_score?: number | null
          minimum_score_unit_type?: string | null
          question_count?: number
          subject_id: string
          updated_at?: string | null
        }
        Update: {
          concurso_id?: string
          created_at?: string | null
          id?: string
          knowledge_section?: string
          minimum_score?: number | null
          minimum_score_unit_type?: string | null
          question_count?: number
          subject_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concurso_subjects_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concurso_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      concursos: {
        Row: {
          alternatives_count: number | null
          banca: string
          basic_knowledge_minimum_score: number | null
          basic_knowledge_questions: number | null
          basic_knowledge_weight: number | null
          case_study_1_minimum_score: number | null
          case_study_1_weight: number | null
          case_study_2_minimum_score: number | null
          case_study_2_weight: number | null
          case_study_3_minimum_score: number | null
          case_study_3_weight: number | null
          created_at: string
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
          id: string
          inscritos: number | null
          is_admin_created: boolean | null
          is_admin_update: boolean | null
          knowledgeAreas: string[] | null
          link: string | null
          localidades: string[] | null
          minimum_score_type: string | null
          minimum_score_unit_type: string | null
          orgao: string
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
          status: string
          subjects: Json | null
          temp_disciplines_data: Json | null
          titulo: string
          total_minimum_score: number | null
          updated_at: string
          vagas: number | null
          wrong_answer_penalty: number | null
        }
        Insert: {
          alternatives_count?: number | null
          banca?: string
          basic_knowledge_minimum_score?: number | null
          basic_knowledge_questions?: number | null
          basic_knowledge_weight?: number | null
          case_study_1_minimum_score?: number | null
          case_study_1_weight?: number | null
          case_study_2_minimum_score?: number | null
          case_study_2_weight?: number | null
          case_study_3_minimum_score?: number | null
          case_study_3_weight?: number | null
          created_at?: string
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
          id?: string
          inscritos?: number | null
          is_admin_created?: boolean | null
          is_admin_update?: boolean | null
          knowledgeAreas?: string[] | null
          link?: string | null
          localidades?: string[] | null
          minimum_score_type?: string | null
          minimum_score_unit_type?: string | null
          orgao: string
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
          status?: string
          subjects?: Json | null
          temp_disciplines_data?: Json | null
          titulo: string
          total_minimum_score?: number | null
          updated_at?: string
          vagas?: number | null
          wrong_answer_penalty?: number | null
        }
        Update: {
          alternatives_count?: number | null
          banca?: string
          basic_knowledge_minimum_score?: number | null
          basic_knowledge_questions?: number | null
          basic_knowledge_weight?: number | null
          case_study_1_minimum_score?: number | null
          case_study_1_weight?: number | null
          case_study_2_minimum_score?: number | null
          case_study_2_weight?: number | null
          case_study_3_minimum_score?: number | null
          case_study_3_weight?: number | null
          created_at?: string
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
          id?: string
          inscritos?: number | null
          is_admin_created?: boolean | null
          is_admin_update?: boolean | null
          knowledgeAreas?: string[] | null
          link?: string | null
          localidades?: string[] | null
          minimum_score_type?: string | null
          minimum_score_unit_type?: string | null
          orgao?: string
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
          status?: string
          subjects?: Json | null
          temp_disciplines_data?: Json | null
          titulo?: string
          total_minimum_score?: number | null
          updated_at?: string
          vagas?: number | null
          wrong_answer_penalty?: number | null
        }
        Relationships: []
      }
      convocai: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      exam_booklets: {
        Row: {
          concurso_id: string
          created_at: string | null
          display_order: number
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          concurso_id: string
          created_at?: string | null
          display_order?: number
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          concurso_id?: string
          created_at?: string | null
          display_order?: number
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_booklets_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      job_titles: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
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
      official_answer_weights: {
        Row: {
          concurso_id: string
          consolidated_answer_data: Json | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          concurso_id: string
          consolidated_answer_data?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          concurso_id?: string
          consolidated_answer_data?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_answer_weights_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      question_blocks: {
        Row: {
          concurso_id: string
          created_at: string
          end_index: number
          id: string
          name: string
          start_index: number
          updated_at: string
          weight: number
        }
        Insert: {
          concurso_id: string
          created_at?: string
          end_index: number
          id?: string
          name: string
          start_index: number
          updated_at?: string
          weight?: number
        }
        Update: {
          concurso_id?: string
          created_at?: string
          end_index?: number
          id?: string
          name?: string
          start_index?: number
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_blocks_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "score_calculation_logs_user_ranking_id_fkey"
            columns: ["user_ranking_id"]
            isOneToOne: false
            referencedRelation: "user_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string | null
          id: string
          is_predefined: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_predefined?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_predefined?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_answers: {
        Row: {
          answer: string | null
          answer_format: string | null
          answers_data: Json | null
          booklet_id: string | null
          id: number
          is_basic_knowledge: boolean | null
          is_specific_1: boolean | null
          is_specific_2: boolean | null
          is_specific_3: boolean | null
          question_number: number | null
          section_type: string | null
          updated_at: string | null
          user_ranking_id: string | null
        }
        Insert: {
          answer?: string | null
          answer_format?: string | null
          answers_data?: Json | null
          booklet_id?: string | null
          id?: number
          is_basic_knowledge?: boolean | null
          is_specific_1?: boolean | null
          is_specific_2?: boolean | null
          is_specific_3?: boolean | null
          question_number?: number | null
          section_type?: string | null
          updated_at?: string | null
          user_ranking_id?: string | null
        }
        Update: {
          answer?: string | null
          answer_format?: string | null
          answers_data?: Json | null
          booklet_id?: string | null
          id?: number
          is_basic_knowledge?: boolean | null
          is_specific_1?: boolean | null
          is_specific_2?: boolean | null
          is_specific_3?: boolean | null
          question_number?: number | null
          section_type?: string | null
          updated_at?: string | null
          user_ranking_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_booklet_id_fkey"
            columns: ["booklet_id"]
            isOneToOne: false
            referencedRelation: "exam_booklets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_user_ranking_id_fkey"
            columns: ["user_ranking_id"]
            isOneToOne: false
            referencedRelation: "user_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_answers_backup: {
        Row: {
          answer: string | null
          id: number | null
          is_basic_knowledge: boolean | null
          is_specific_1: boolean | null
          is_specific_2: boolean | null
          is_specific_3: boolean | null
          question_number: string | null
          user_ranking_id: string | null
        }
        Insert: {
          answer?: string | null
          id?: number | null
          is_basic_knowledge?: boolean | null
          is_specific_1?: boolean | null
          is_specific_2?: boolean | null
          is_specific_3?: boolean | null
          question_number?: string | null
          user_ranking_id?: string | null
        }
        Update: {
          answer?: string | null
          id?: number | null
          is_basic_knowledge?: boolean | null
          is_specific_1?: boolean | null
          is_specific_2?: boolean | null
          is_specific_3?: boolean | null
          question_number?: string | null
          user_ranking_id?: string | null
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
          all_questions_answered: boolean | null
          basic_knowledge_score: number | null
          case_study_1_score: number | null
          case_study_2_score: number | null
          case_study_3_score: number | null
          concurso_id: string
          created_at: string
          customDisciplineScores: Json | null
          discursive_score: number | null
          edit_count: number | null
          edit_history: Json | null
          id: string
          is_score_recalculated: boolean | null
          reservation_type: string | null
          score: number | null
          selected_booklet: string | null
          specific_knowledge_1_score: number | null
          specific_knowledge_2_score: number | null
          specific_knowledge_3_score: number | null
          specific_knowledge_score: number | null
          subject_scores: Json | null
          updated_at: string
          user_id: string
          weighted_basic_score: number | null
          weighted_case_study_1_score: number | null
          weighted_case_study_2_score: number | null
          weighted_case_study_3_score: number | null
          weighted_discursive_score: number | null
          weighted_specific_1_score: number | null
          weighted_specific_2_score: number | null
          weighted_specific_3_score: number | null
          weightedCustomDisciplineScores: Json | null
        }
        Insert: {
          all_questions_answered?: boolean | null
          basic_knowledge_score?: number | null
          case_study_1_score?: number | null
          case_study_2_score?: number | null
          case_study_3_score?: number | null
          concurso_id: string
          created_at?: string
          customDisciplineScores?: Json | null
          discursive_score?: number | null
          edit_count?: number | null
          edit_history?: Json | null
          id?: string
          is_score_recalculated?: boolean | null
          reservation_type?: string | null
          score?: number | null
          selected_booklet?: string | null
          specific_knowledge_1_score?: number | null
          specific_knowledge_2_score?: number | null
          specific_knowledge_3_score?: number | null
          specific_knowledge_score?: number | null
          subject_scores?: Json | null
          updated_at?: string
          user_id: string
          weighted_basic_score?: number | null
          weighted_case_study_1_score?: number | null
          weighted_case_study_2_score?: number | null
          weighted_case_study_3_score?: number | null
          weighted_discursive_score?: number | null
          weighted_specific_1_score?: number | null
          weighted_specific_2_score?: number | null
          weighted_specific_3_score?: number | null
          weightedCustomDisciplineScores?: Json | null
        }
        Update: {
          all_questions_answered?: boolean | null
          basic_knowledge_score?: number | null
          case_study_1_score?: number | null
          case_study_2_score?: number | null
          case_study_3_score?: number | null
          concurso_id?: string
          created_at?: string
          customDisciplineScores?: Json | null
          discursive_score?: number | null
          edit_count?: number | null
          edit_history?: Json | null
          id?: string
          is_score_recalculated?: boolean | null
          reservation_type?: string | null
          score?: number | null
          selected_booklet?: string | null
          specific_knowledge_1_score?: number | null
          specific_knowledge_2_score?: number | null
          specific_knowledge_3_score?: number | null
          specific_knowledge_score?: number | null
          subject_scores?: Json | null
          updated_at?: string
          user_id?: string
          weighted_basic_score?: number | null
          weighted_case_study_1_score?: number | null
          weighted_case_study_2_score?: number | null
          weighted_case_study_3_score?: number | null
          weighted_discursive_score?: number | null
          weighted_specific_1_score?: number | null
          weighted_specific_2_score?: number | null
          weighted_specific_3_score?: number | null
          weightedCustomDisciplineScores?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_rankings_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_rankings_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_rankings_selected_booklet_fkey"
            columns: ["selected_booklet"]
            isOneToOne: false
            referencedRelation: "exam_booklets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_scores: {
        Row: {
          basic_knowledge_score: number | null
          created_at: string | null
          discursive_score: number | null
          id: string
          ranking_id: string
          specific_knowledge_score: number | null
          total_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          basic_knowledge_score?: number | null
          created_at?: string | null
          discursive_score?: number | null
          id?: string
          ranking_id: string
          specific_knowledge_score?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          basic_knowledge_score?: number | null
          created_at?: string | null
          discursive_score?: number | null
          id?: string
          ranking_id?: string
          specific_knowledge_score?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_scores_ranking_id_fkey"
            columns: ["ranking_id"]
            isOneToOne: false
            referencedRelation: "user_rankings"
            referencedColumns: ["id"]
          },
        ]
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
          name: string
          profile_text: string | null
          rotina_estudos: string | null
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
          name: string
          profile_text?: string | null
          rotina_estudos?: string | null
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
          name?: string
          profile_text?: string | null
          rotina_estudos?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_user_from_ranking: {
        Args: { ranking_id_param: string }
        Returns: boolean
      }
      admin_delete_user_profile: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      calculate_score_with_blocks: {
        Args: { p_user_ranking_id: string }
        Returns: number
      }
      calculate_user_score_by_booklet: {
        Args: {
          p_ranking_id: string
          p_concurso_id: string
          p_booklet_id: string
        }
        Returns: Json
      }
      calculate_user_score_realtime: {
        Args: { p_ranking_id: string }
        Returns: number
      }
      consolidate_official_answers: {
        Args: { p_concurso_id: string }
        Returns: Json
      }
      count_concurso_participants: {
        Args: { concurso_id: string }
        Returns: number
      }
      count_user_followers: {
        Args: { user_id: string }
        Returns: number
      }
      count_user_posts: {
        Args: { user_id: string }
        Returns: number
      }
      delete_user_profile: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      get_booklet_answers: {
        Args: { p_ranking_id: string; p_booklet_id: string }
        Returns: Json
      }
      get_candidate_subject_scores: {
        Args: { p_ranking_id: string }
        Returns: {
          subject_name: string
          score: number
          question_count: number
          minimum_required: number
          is_passing: boolean
          knowledge_section: string
        }[]
      }
      get_consolidated_answer_key: {
        Args: { p_concurso_id: string }
        Returns: Json
      }
      get_official_answer_weights: {
        Args: { p_concurso_id: string }
        Returns: Json
      }
      get_realtime_rankings: {
        Args: { p_concurso_id: string; p_reservation_type?: string }
        Returns: {
          ranking_id: string
          user_id: string
          user_name: string
          avatar_url: string
          basic_knowledge_score: number
          specific_knowledge_score: number
          specific_knowledge_1_score: number
          specific_knowledge_2_score: number
          specific_knowledge_3_score: number
          discursive_score: number
          case_study_1_score: number
          case_study_2_score: number
          case_study_3_score: number
          weighted_basic_score: number
          weighted_specific_1_score: number
          weighted_specific_2_score: number
          weighted_specific_3_score: number
          weighted_discursive_score: number
          weighted_case_study_1_score: number
          weighted_case_study_2_score: number
          weighted_case_study_3_score: number
          customDisciplineScores: Json
          weightedCustomDisciplineScores: Json
          reservation_type: string
          is_classified: boolean
          score: number
        }[]
      }
      get_user_answers_consolidated: {
        Args: { p_ranking_id: string }
        Returns: Json
      }
      get_user_answers_jsonb: {
        Args: { p_ranking_id: string; p_booklet_id?: string }
        Returns: Json
      }
      get_user_booklets_with_answers: {
        Args: { p_ranking_id: string }
        Returns: Json
      }
      is_candidate_classified: {
        Args: { p_ranking_id: string; p_concurso_id: string }
        Returns: boolean
      }
      manage_exam_booklets: {
        Args: { p_operation: string; p_concurso_id: string; p_booklets?: Json }
        Returns: Json
      }
      manage_question_blocks: {
        Args: { p_operation: string; p_concurso_id: string; p_blocks?: Json }
        Returns: Json
      }
      migrate_existing_answers_to_jsonb: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      migrate_official_answers_to_consolidated: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_all_scores: {
        Args: { p_concurso_id: string }
        Returns: Json
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
      save_consolidated_answer_key: {
        Args: { p_concurso_id: string; p_booklet_id: string; p_answers: Json }
        Returns: Json
      }
      save_scores_transaction: {
        Args: {
          p_ranking_id: string
          p_raw_scores: Json
          p_weighted_scores: Json
          p_subjective_scores: Json
        }
        Returns: Json
      }
      save_user_answers_and_calculate_scores: {
        Args: {
          p_ranking_id: string
          p_concurso_id: string
          p_answers: Json
          p_discursive_score?: number
          p_case_study_1_score?: number
          p_case_study_2_score?: number
          p_case_study_3_score?: number
          p_current_edit_count?: number
        }
        Returns: Json
      }
      save_user_answers_with_booklet: {
        Args: {
          p_ranking_id: string
          p_concurso_id: string
          p_booklet_id: string
          p_answers: Json
          p_discursive_score?: number
          p_case_study_1_score?: number
          p_case_study_2_score?: number
          p_case_study_3_score?: number
          p_current_edit_count?: number
        }
        Returns: Json
      }
      save_user_answers_with_booklet_old: {
        Args: {
          p_ranking_id: string
          p_concurso_id: string
          p_booklet_id: string
          p_answers: Json
          p_discursive_score?: number
          p_case_study_1_score?: number
          p_case_study_2_score?: number
          p_case_study_3_score?: number
          p_current_edit_count?: number
        }
        Returns: Json
      }
      switch_user_booklet: {
        Args: { p_ranking_id: string; p_booklet_id: string }
        Returns: Json
      }
      update_answer_with_weight: {
        Args:
          | {
              p_concurso_id: string
              p_question_number: number
              p_correct_answer: string
              p_weight: number
              p_is_nullified?: boolean
              p_section_type?: string
            }
          | {
              p_concurso_id: string
              p_question_number: number
              p_correct_answer: string
              p_weight: number
              p_is_nullified?: boolean
              p_section_type?: string
              p_booklet_id?: string
            }
        Returns: undefined
      }
      update_official_answers_and_recalculate: {
        Args: { p_concurso_id: string; p_answers_data: Json }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
