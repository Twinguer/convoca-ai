import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSecureAdminUrls } from '@/services/adminUrlObfuscation';
import { adminResourcePath, type AdminResource } from '@/config/adminRoutes';

const DEFAULT_LINKS: Record<AdminResource, string> = {
  dashboard: adminResourcePath('dashboard'),
  concursos: adminResourcePath('concursos'),
  usuarios: adminResourcePath('usuarios'),
  vouchers: adminResourcePath('vouchers'),
};

export function useAdminNavLinks() {
  const { user } = useAuth();
  const { generateSecureUrl } = useSecureAdminUrls();
  const [links, setLinks] = useState(DEFAULT_LINKS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadLinks = async () => {
      try {
        const [dashboard, concursos, usuarios, vouchers] = await Promise.all([
          generateSecureUrl(user.id, 'dashboard'),
          generateSecureUrl(user.id, 'concursos'),
          generateSecureUrl(user.id, 'usuarios'),
          generateSecureUrl(user.id, 'vouchers'),
        ]);

        if (!cancelled) {
          setLinks({ dashboard, concursos, usuarios, vouchers });
        }
      } catch {
        if (!cancelled) {
          setLinks(DEFAULT_LINKS);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLinks();

    return () => {
      cancelled = true;
    };
  }, [user?.id, generateSecureUrl]);

  return { links, loading };
}
