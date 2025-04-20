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
      answer_keys: {
        Row: {
          answer: string
          concurso_id: string | null
          created_at: string | null
          created_by_user_id: string | null
          id: string
          is_basic_knowledge: boolean | null
          is_nullified: boolean | null
          is_specific_1: boolean | null
          is_specific_2: boolean | null
          question_number: number
          updated_at: string | null
        }
        Insert: {
          answer: string
          concurso_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          is_basic_knowledge?: boolean | null
          is_nullified?: boolean | null
          is_specific_1?: boolean | null
          is_specific_2?: boolean | null
          question_number: number
          updated_at?: string | null
        }
        Update: {
          answer?: string
          concurso_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          is_basic_knowledge?: boolean | null
          is_nullified?: boolean | null
          is_specific_1?: boolean | null
          is_specific_2?: boolean | null
          question_number?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answer_keys_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      concursos: {
        Row: {
          alternatives_count: number | null
          banca: string
          basic_knowledge_questions: number | null
          basic_knowledge_weight: number | null
          case_study_1_weight: number | null
          case_study_2_weight: number | null
          case_study_3_weight: number | null
          created_at: string
          created_by_user_id: string | null
          custom_banca: string | null
          custom_job_title: string | null
          data_publicacao: string | null
          discursive_weight: number | null
          etapa_atual: string | null
          exam_type: string | null
          has_ampla_concorrencia: boolean | null
          has_basic_knowledge: boolean | null
          has_case_study_1: boolean | null
          has_case_study_2: boolean | null
          has_case_study_3: boolean | null
          has_discursive: boolean | null
          has_hipossuficientes: boolean | null
          has_indigenas: boolean | null
          has_pcd: boolean | null
          has_ppp: boolean | null
          has_specific_knowledge_1: boolean | null
          has_specific_knowledge_2: boolean | null
          has_specific_knowledge_3: boolean | null
          has_transsexuais: boolean | null
          id: string
          inscritos: number | null
          is_admin_created: boolean | null
          link: string | null
          localidades: string[] | null
          orgao: string
          predefined_job_title: string | null
          specific_knowledge_1_questions: number | null
          specific_knowledge_1_weight: number | null
          specific_knowledge_2_questions: number | null
          specific_knowledge_2_weight: number | null
          specific_knowledge_3_questions: number | null
          specific_knowledge_3_weight: number | null
          specific_knowledge_weight: number | null
          status: string
          titulo: string
          updated_at: string
          vagas: number | null
          wrong_answer_penalty: number | null
        }
        Insert: {
          alternatives_count?: number | null
          banca?: string
          basic_knowledge_questions?: number | null
          basic_knowledge_weight?: number | null
          case_study_1_weight?: number | null
          case_study_2_weight?: number | null
          case_study_3_weight?: number | null
          created_at?: string
          created_by_user_id?: string | null
          custom_banca?: string | null
          custom_job_title?: string | null
          data_publicacao?: string | null
          discursive_weight?: number | null
          etapa_atual?: string | null
          exam_type?: string | null
          has_ampla_concorrencia?: boolean | null
          has_basic_knowledge?: boolean | null
          has_case_study_1?: boolean | null
          has_case_study_2?: boolean | null
          has_case_study_3?: boolean | null
          has_discursive?: boolean | null
          has_hipossuficientes?: boolean | null
          has_indigenas?: boolean | null
          has_pcd?: boolean | null
          has_ppp?: boolean | null
          has_specific_knowledge_1?: boolean | null
          has_specific_knowledge_2?: boolean | null
          has_specific_knowledge_3?: boolean | null
          has_transsexuais?: boolean | null
          id?: string
          inscritos?: number | null
          is_admin_created?: boolean | null
          link?: string | null
          localidades?: string[] | null
          orgao: string
          predefined_job_title?: string | null
          specific_knowledge_1_questions?: number | null
          specific_knowledge_1_weight?: number | null
          specific_knowledge_2_questions?: number | null
          specific_knowledge_2_weight?: number | null
          specific_knowledge_3_questions?: number | null
          specific_knowledge_3_weight?: number | null
          specific_knowledge_weight?: number | null
          status?: string
          titulo: string
          updated_at?: string
          vagas?: number | null
          wrong_answer_penalty?: number | null
        }
        Update: {
          alternatives_count?: number | null
          banca?: string
          basic_knowledge_questions?: number | null
          basic_knowledge_weight?: number | null
          case_study_1_weight?: number | null
          case_study_2_weight?: number | null
          case_study_3_weight?: number | null
          created_at?: string
          created_by_user_id?: string | null
          custom_banca?: string | null
          custom_job_title?: string | null
          data_publicacao?: string | null
          discursive_weight?: number | null
          etapa_atual?: string | null
          exam_type?: string | null
          has_ampla_concorrencia?: boolean | null
          has_basic_knowledge?: boolean | null
          has_case_study_1?: boolean | null
          has_case_study_2?: boolean | null
          has_case_study_3?: boolean | null
          has_discursive?: boolean | null
          has_hipossuficientes?: boolean | null
          has_indigenas?: boolean | null
          has_pcd?: boolean | null
          has_ppp?: boolean | null
          has_specific_knowledge_1?: boolean | null
          has_specific_knowledge_2?: boolean | null
          has_specific_knowledge_3?: boolean | null
          has_transsexuais?: boolean | null
          id?: string
          inscritos?: number | null
          is_admin_created?: boolean | null
          link?: string | null
          localidades?: string[] | null
          orgao?: string
          predefined_job_title?: string | null
          specific_knowledge_1_questions?: number | null
          specific_knowledge_1_weight?: number | null
          specific_knowledge_2_questions?: number | null
          specific_knowledge_2_weight?: number | null
          specific_knowledge_3_questions?: number | null
          specific_knowledge_3_weight?: number | null
          specific_knowledge_weight?: number | null
          status?: string
          titulo?: string
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
      user_answers: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_basic_knowledge: boolean
          is_nullified: boolean | null
          is_specific_1: boolean | null
          is_specific_2: boolean | null
          is_specific_3: boolean | null
          question_number: number
          updated_at: string
          user_ranking_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_basic_knowledge?: boolean
          is_nullified?: boolean | null
          is_specific_1?: boolean | null
          is_specific_2?: boolean | null
          is_specific_3?: boolean | null
          question_number: number
          updated_at?: string
          user_ranking_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_basic_knowledge?: boolean
          is_nullified?: boolean | null
          is_specific_1?: boolean | null
          is_specific_2?: boolean | null
          is_specific_3?: boolean | null
          question_number?: number
          updated_at?: string
          user_ranking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_user_ranking_id_fkey"
            columns: ["user_ranking_id"]
            isOneToOne: false
            referencedRelation: "user_rankings"
            referencedColumns: ["id"]
          },
        ]
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
          discursive_score: number | null
          edit_count: number | null
          id: string
          reservation_type: string | null
          score: number | null
          specific_knowledge_1_score: number | null
          specific_knowledge_2_score: number | null
          specific_knowledge_3_score: number | null
          specific_knowledge_score: number | null
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
        }
        Insert: {
          all_questions_answered?: boolean | null
          basic_knowledge_score?: number | null
          case_study_1_score?: number | null
          case_study_2_score?: number | null
          case_study_3_score?: number | null
          concurso_id: string
          created_at?: string
          discursive_score?: number | null
          edit_count?: number | null
          id?: string
          reservation_type?: string | null
          score?: number | null
          specific_knowledge_1_score?: number | null
          specific_knowledge_2_score?: number | null
          specific_knowledge_3_score?: number | null
          specific_knowledge_score?: number | null
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
        }
        Update: {
          all_questions_answered?: boolean | null
          basic_knowledge_score?: number | null
          case_study_1_score?: number | null
          case_study_2_score?: number | null
          case_study_3_score?: number | null
          concurso_id?: string
          created_at?: string
          discursive_score?: number | null
          edit_count?: number | null
          id?: string
          reservation_type?: string | null
          score?: number | null
          specific_knowledge_1_score?: number | null
          specific_knowledge_2_score?: number | null
          specific_knowledge_3_score?: number | null
          specific_knowledge_score?: number | null
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
        }
        Relationships: [
          {
            foreignKeyName: "user_rankings_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
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
          avatar_url: string | null
          bio: string | null
          concursos_aprovados: string | null
          concursos_participando: string | null
          created_at: string
          email: string
          id: string
          name: string
          profile_text: string | null
          status_concurseiro: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          concursos_aprovados?: string | null
          concursos_participando?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          profile_text?: string | null
          status_concurseiro?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          concursos_aprovados?: string | null
          concursos_participando?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          profile_text?: string | null
          status_concurseiro?: string | null
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
      admin_operations: {
        Args: { operation: string; data?: Json }
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
