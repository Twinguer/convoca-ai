# Módulo Community

Planejamento da modularização de **Comunidade + Grupos de estudo**: descoberta de concurseiros, feed de grupos, membros, posts e solicitações de entrada.

> O escopo inclui `components/studyGroups/` e `GroupDetailsPage` — hoje acoplados à tab “Grupos” em `/comunidade` e usados também pelo Coach (`CoachGroupsTab`).

## Estado atual (pré COM1)

| Camada | Situação |
|--------|----------|
| **Pages** | `CommunityPage` no módulo; `GroupDetailsPage` em `src/pages/` |
| **Domain** | Parcial — `utils/communityProfileRules.ts` |
| **Services** | Fora — `integrations/supabase/community.ts`, `studyGroups/*` |
| **Hooks** | Fora — 5 hooks em `src/hooks/` |
| **Components** | Fora — `components/community/` (7) + `components/studyGroups/` (11) |
| **index.ts** | Ausente |

**Status:** Shell (1 page no módulo; resto legado).

## Superfície funcional

### Tab Concurseiros (`CommunityPage`)

- RPC `get_public_community_profiles` com busca debounced
- Ordenação: Coach > Pro > Free, depois online
- Cards com tema coach (`communityCoachCardTheme`)
- Navegação segura para perfil (`userUrlObfuscation`)

### Tab Grupos (`GroupsTab`)

- Listagem, criar grupo, entrar/sair
- Limites de plano (`usePlanLimits`)
- Coach: tab dedicada em `CoachGroupsTab`

### Detalhe do grupo (`GroupDetailsPage`)

- Feed de posts, comentários, membros
- Configurações, upload de capa, pedidos pendentes
- ~578 linhas — god page

## Fora do módulo (hoje)

| Peça | Caminho |
|------|---------|
| Page legada | `pages/GroupDetailsPage.tsx` |
| UI comunidade | `components/community/*` |
| UI grupos | `components/studyGroups/*` |
| Hooks | `useCommunityUsers`, `useStudyGroups`, `useGroupMembers`, `useGroupPosts`, `useGroupRequests` |
| Tipos | `types/studyGroups.ts` |
| Regras perfil | `utils/communityProfileRules.ts` |
| URL grupos | `services/communityUrlObfuscation.ts` |
| Supabase | `integrations/supabase/community.ts`, `studyGroups/{groups,members,posts}.ts` |
| Presença | `contexts/PresenceContext` (transversal) |

## Arquitetura alvo

```
src/modules/community/
  index.ts
  domain/
    communityProfileRules.ts       # mover de utils/
    communityUserSort.ts           # prioridade Coach/Pro/online (hoje inline na page)
    groupVisibilityRules.ts        # público/privado, limites plano
  services/
    communityProfileService.ts     # RPC get_public_community_profiles
    studyGroupService.ts           # facade groups/members/posts
  hooks/
    useCommunityUsers.ts
    useStudyGroups.ts
    useGroupMembers.ts
    useGroupPosts.ts
    useGroupRequests.ts
  components/
    users/                         # UserGrid, UserCard, states
    groups/                        # GroupCard, GroupsGrid, modals, feed
    shared/                        # CommunitySectionHeader, loading/error/empty
  pages/
    CommunityPage.tsx
    GroupDetailsPage.tsx
```

**Permanece fora:**

| Peça | Motivo |
|------|--------|
| `PresenceContext` | Infra transversal (online/studying) |
| `userUrlObfuscation` | Segurança transversal |
| Perfil público | `PublicUserProfile` consome links seguros |
| Coach dashboard tab | Importa `@/modules/community` (`CoachGroupsTab` ou API de grupos) |

## Dependência com Coach

- `useGroupMembers` verifica assinatura coach ativa para permissões de grupo.
- **Pré-requisito:** Coach **C2** expõe `useIsActiveCoach` / `coachSubscriptionService` via `@/modules/coach`.
- Até lá, hooks community podem importar integração coach com re-export `@deprecated`.

## Invariantes

1. Perfis públicos só via RPC `get_public_community_profiles` — sem SELECT amplo em `users_profiles`.
2. Regras de badge Pro/Coach alinhadas com `mapCommunityProfileFlags` e backend.
3. URLs de grupo/usuário ofuscadas — nunca expor UUID cru em produção.
4. Limites Free/Pro para criar/entrar em grupos via `usePlanLimits` (ou domain equivalente).
5. CoachGroupsTab no dashboard coach importa API community — não duplica CRUD de grupos.

## Import alvo

```ts
import {
  CommunityPage,
  GroupDetailsPage,
  useCommunityUsers,
  useStudyGroups,
  GroupsTab,
  mapCommunityProfileFlags,
} from '@/modules/community';
```

## Referências

- [ROADMAP.md](./ROADMAP.md) — fases COM1–COM9
- [RESTORE.md](./RESTORE.md) — tags e smoke test
- [../coach/MODULE.md](../coach/MODULE.md) — assinatura coach e grupos
- [../MATRIZ_MODULARIZACAO.md](../MATRIZ_MODULARIZACAO.md)
