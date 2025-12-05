/**
 * URL do avatar padrão do sistema (imagem "NOMEIA Aí" do usuário @nomeiai)
 */
export const DEFAULT_AVATAR_URL = 'https://ppsymqrdtjyaguftracc.supabase.co/storage/v1/object/public/profiles/ee17d498-b633-419f-90bd-0cad82166804-1762810011516.png';

/**
 * Obtém a URL do avatar do usuário, usando o padrão se não existir
 * @param avatarUrl - URL do avatar existente (pode ser null ou undefined)
 * @returns URL do avatar (existente ou padrão)
 */
export const getAvatarUrl = (avatarUrl: string | null | undefined): string => {
  return avatarUrl || DEFAULT_AVATAR_URL;
};

