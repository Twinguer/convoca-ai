// ============================================
// TIPOS PARA STUDY GROUPS
// ============================================

export type PrivacyLevel = 'public' | 'private' | 'invite_only';
export type GroupMemberRole = 'member' | 'moderator' | 'admin' | 'coach';
export type GroupMemberStatus = 'active' | 'invited' | 'pending' | 'requested' | 'left' | 'removed';

// ============================================
// GRUPO DE ESTUDOS
// ============================================
export interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  privacy_level: PrivacyLevel;
  max_members: number;
  current_members: number;
  focus_area?: string;
  target_concurso_id?: string;
  coach_id?: string;
  created_by: string;
  posts_data: GroupPost[];
  group_settings: Record<string, any>;
  post_retention_days: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// MEMBRO DO GRUPO (seguindo padrão Follower)
// ============================================
export interface GroupMember {
  id: string;
  group_id?: string;
  user_id?: string;
  name: string;
  avatar_url?: string;
  role: GroupMemberRole;
  status?: GroupMemberStatus;
  joined_at: string;
}

// ============================================
// POST DO GRUPO (JSONB)
// ============================================
export interface PostAttachment {
  url: string;
  type: 'image' | 'pdf';
  name: string;
}

export interface GroupPost {
  id: string;
  author_id: string;
  content: string;
  comments_count: number;
  comments: GroupComment[];
  is_pinned: boolean;
  is_deleted: boolean;
  expires_at: string;
  created_at: string;
  attachments?: PostAttachment[];
  // Campos enriquecidos do autor (adicionados pela função get_group_feed)
  author_name?: string;
  author_avatar?: string;
}

// ============================================
// COMENTÁRIO DO POST (JSONB)
// ============================================
export interface GroupComment {
  id: string;
  author_id: string;
  content: string;
  parent_comment_id?: string;
  created_at: string;
  // Campos enriquecidos do autor (adicionados pela função get_group_feed)
  author_name?: string;
  author_avatar?: string;
}

// ============================================
// DADOS PARA CRIAÇÃO/EDIÇÃO
// ============================================
export interface CreateGroupInput {
  name: string;
  description?: string;
  cover_image_url?: string;
  privacy_level?: PrivacyLevel;
  max_members?: number;
  focus_area?: string;
  target_concurso_id?: string;
  post_retention_days?: number;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  cover_image_url?: string;
  privacy_level?: PrivacyLevel;
  max_members?: number;
  focus_area?: string;
  post_retention_days?: number;
}

