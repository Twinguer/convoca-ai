import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface MetricsResponse {
  timestamp: string;
  status: 'ok' | 'error';
  metrics: {
    // Métricas de usuários
    users: {
      total: number;
      online: number;
      active_24h: number;
      active_7d: number;
    };
    // Métricas de rankings
    rankings: {
      total: number;
      active: number;
      participations: number;
      participations_24h: number;
    };
    // Métricas de pontuações
    scores: {
      average: number;
      highest: number;
      lowest: number;
      total_scored: number;
    };
    // Métricas de estudos
    studies: {
      total_cycles: number;
      active_cycles: number;
      total_sessions: number;
      total_hours: number;
      questions_answered: number;
      correct_answers: number;
      accuracy_rate: number;
    };
    // Métricas de coach
    coach: {
      total_coaches: number;
      active_subscriptions: number;
      total_students: number;
      pending_invitations: number;
      access_logs_24h: number;
    };
    // Métricas de segurança
    security: {
      audit_logs_24h: number;
      security_logs_24h: number;
      total_security_events: number;
    };
    // Métricas de notificações
    notifications: {
      total: number;
      unread: number;
      created_24h: number;
    };
    // Métricas de performance
    performance: {
      avg_query_time_ms: number;
      slow_queries_count: number;
      active_alerts: number;
      critical_alerts: number;
    };
    // Métricas de sistema
    system: {
      health: 'healthy' | 'warning' | 'critical';
      engagement_rate: number;
      uptime_percentage: number;
    };
  };
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Criar cliente Supabase com service role para acesso completo
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ============================================
    // 1. MÉTRICAS DE USUÁRIOS
    // ============================================
    const { count: totalUsers } = await supabase
      .from('users_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: onlineUsers } = await supabase
      .from('users_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_online', true);

    const { count: active24h } = await supabase
      .from('users_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity', yesterday.toISOString());

    const { count: active7d } = await supabase
      .from('users_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity', weekAgo.toISOString());

    // ============================================
    // 2. MÉTRICAS DE RANKINGS
    // ============================================
    const { count: totalRankings } = await supabase
      .from('concursos')
      .select('*', { count: 'exact', head: true });

    const { count: activeRankings } = await supabase
      .from('concursos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Em andamento');

    const { count: totalParticipations } = await supabase
      .from('user_rankings')
      .select('*', { count: 'exact', head: true });

    const { count: participations24h } = await supabase
      .from('user_rankings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    // ============================================
    // 3. MÉTRICAS DE PONTUAÇÕES
    // ============================================
    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 0;
    let totalScored = 0;

    try {
      const { data: scoreData } = await supabase
        .from('user_rankings')
        .select('score')
        .not('score', 'is', null);

      if (scoreData && scoreData.length > 0) {
        const scores = scoreData
          .map(r => typeof r.score === 'number' ? r.score : parseFloat(r.score || '0'))
          .filter(s => !isNaN(s) && s >= 0);

        if (scores.length > 0) {
          totalScored = scores.length;
          averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          highestScore = Math.max(...scores);
          lowestScore = Math.min(...scores);
        }
      }
    } catch (error) {
      console.warn('[metrics] Error fetching scores:', error);
    }

    // ============================================
    // 4. MÉTRICAS DE ESTUDOS
    // ============================================
    let totalCycles = 0;
    let activeCycles = 0;
    let totalSessions = 0;
    let totalHours = 0;
    let questionsAnswered = 0;
    let correctAnswers = 0;

    try {
      // Contar ciclos de estudos
      const { count: cyclesCount } = await supabase
        .from('study_cycles_v2')
        .select('*', { count: 'exact', head: true });

      totalCycles = cyclesCount || 0;

      // Contar ciclos ativos (últimos 30 dias)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const { count: activeCyclesCount } = await supabase
        .from('study_cycles_v2')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      activeCycles = activeCyclesCount || 0;

      // Buscar estatísticas agregadas de estudos
      const { data: studyStats } = await supabase
        .from('study_statistics')
        .select('statistics_data');

      if (studyStats && studyStats.length > 0) {
        studyStats.forEach(stat => {
          const data = stat.statistics_data;
          if (data) {
            totalSessions += typeof data.totalSessions === 'number' ? data.totalSessions : 0;
            totalHours += typeof data.totalHours === 'number' ? data.totalHours : 0;
            questionsAnswered += typeof data.questionsAnswered === 'number' ? data.questionsAnswered : 0;
            correctAnswers += typeof data.correctAnswers === 'number' ? data.correctAnswers : 0;
          }
        });
      }

      // Alternativa: buscar de user_study_v2 se study_statistics não tiver dados
      if (totalSessions === 0) {
        const { data: userStudyData } = await supabase
          .from('user_study_v2')
          .select('study_sessions');

        if (userStudyData) {
          userStudyData.forEach(user => {
            const sessions = user.study_sessions;
            if (Array.isArray(sessions)) {
              totalSessions += sessions.length;
              sessions.forEach((session: any) => {
                if (session.duration_minutes) {
                  totalHours += (session.duration_minutes || 0) / 60;
                }
                if (session.questions) {
                  questionsAnswered += session.questions || 0;
                }
                if (session.correct_answers) {
                  correctAnswers += session.correct_answers || 0;
                }
              });
            }
          });
        }
      }
    } catch (error) {
      console.warn('[metrics] Error fetching study metrics:', error);
    }

    const accuracyRate = questionsAnswered > 0 
      ? Math.round((correctAnswers / questionsAnswered) * 100 * 100) / 100
      : 0;

    // ============================================
    // 5. MÉTRICAS DE COACH
    // ============================================
    let totalCoaches = 0;
    let activeSubscriptions = 0;
    let totalStudents = 0;
    let pendingInvitations = 0;
    let accessLogs24h = 0;

    try {
      const { count: coachesCount } = await supabase
        .from('coach_profiles')
        .select('*', { count: 'exact', head: true });

      totalCoaches = coachesCount || 0;

      const { count: subscriptionsCount } = await supabase
        .from('coach_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      activeSubscriptions = subscriptionsCount || 0;

      // Contar alunos totais (somar current_students de todas as assinaturas)
      const { data: subscriptions } = await supabase
        .from('coach_subscriptions')
        .select('current_students')
        .eq('status', 'active');

      if (subscriptions) {
        totalStudents = subscriptions.reduce((sum, sub) => {
          return sum + (typeof sub.current_students === 'number' ? sub.current_students : 0);
        }, 0);
      }

      // Contar convites pendentes (agregar de coach_profiles)
      const { data: coachProfiles } = await supabase
        .from('coach_profiles')
        .select('pending_invitations');

      if (coachProfiles) {
        coachProfiles.forEach(profile => {
          const invitations = profile.pending_invitations;
          if (Array.isArray(invitations)) {
            pendingInvitations += invitations.length;
          }
        });
      }

      // Contar logs de acesso (últimas 24h)
      const { count: logsCount } = await supabase
        .from('coach_access_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      accessLogs24h = logsCount || 0;
    } catch (error) {
      console.warn('[metrics] Error fetching coach metrics:', error);
    }

    // ============================================
    // 6. MÉTRICAS DE SEGURANÇA
    // ============================================
    let auditLogs24h = 0;
    let securityLogs24h = 0;
    let totalSecurityEvents = 0;

    try {
      const { count: auditCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      auditLogs24h = auditCount || 0;

      const { count: securityCount } = await supabase
        .from('security_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      securityLogs24h = securityCount || 0;

      const { count: totalSecurityCount } = await supabase
        .from('security_logs')
        .select('*', { count: 'exact', head: true });

      totalSecurityEvents = totalSecurityCount || 0;
    } catch (error) {
      console.warn('[metrics] Error fetching security metrics:', error);
    }

    // ============================================
    // 7. MÉTRICAS DE NOTIFICAÇÕES
    // ============================================
    let totalNotifications = 0;
    let unreadNotifications = 0;
    let notifications24h = 0;

    try {
      const { count: notificationsCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

      totalNotifications = notificationsCount || 0;

      const { count: unreadCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      unreadNotifications = unreadCount || 0;

      const { count: notificationsCount24h } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      notifications24h = notificationsCount24h || 0;
    } catch (error) {
      console.warn('[metrics] Error fetching notification metrics:', error);
    }

    // ============================================
    // 8. MÉTRICAS DE PERFORMANCE
    // ============================================
    let avgQueryTime = 0;
    let slowQueriesCount = 0;
    
    try {
      const { data: queryLogs } = await supabase
        .from('query_performance_logs')
        .select('execution_time_ms')
        .order('created_at', { ascending: false })
        .limit(100);

      if (queryLogs && queryLogs.length > 0) {
        const times = queryLogs
          .map(log => log.execution_time_ms)
          .filter(time => time !== null && time !== undefined) as number[];
        
        if (times.length > 0) {
          avgQueryTime = times.reduce((sum, time) => sum + time, 0) / times.length;
          slowQueriesCount = times.filter(time => time > 1000).length;
        }
      }
    } catch (error) {
      console.warn('[metrics] Error fetching query performance logs:', error);
    }

    let activeAlertsCount = 0;
    let criticalAlertsCount = 0;
    
    try {
      const { data: alerts } = await supabase
        .from('performance_alerts')
        .select('severity, is_resolved')
        .eq('is_resolved', false);

      if (alerts) {
        activeAlertsCount = alerts.length;
        criticalAlertsCount = alerts.filter(a => a.severity === 'critical').length;
      }
    } catch (error) {
      console.warn('[metrics] Error fetching performance alerts:', error);
    }

    // ============================================
    // 9. MÉTRICAS DE SISTEMA
    // ============================================
    const userEngagement = totalUsers && totalUsers > 0
      ? Math.round((active24h || 0) / totalUsers * 100)
      : 0;

    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (userEngagement < 10 || criticalAlertsCount > 0) {
      systemHealth = 'critical';
    } else if (userEngagement < 30 || activeAlertsCount > 5) {
      systemHealth = 'warning';
    }

    // Calcular uptime (simplificado - baseado em métricas de performance)
    const uptimePercentage = avgQueryTime < 500 && systemHealth === 'healthy' ? 99.9 : 
                            avgQueryTime < 1000 && systemHealth !== 'critical' ? 99.5 : 95.0;

    // ============================================
    // 10. MONTAR RESPOSTA
    // ============================================
    const response: MetricsResponse = {
      timestamp: now.toISOString(),
      status: 'ok',
      metrics: {
        users: {
          total: totalUsers || 0,
          online: onlineUsers || 0,
          active_24h: active24h || 0,
          active_7d: active7d || 0,
        },
        rankings: {
          total: totalRankings || 0,
          active: activeRankings || 0,
          participations: totalParticipations || 0,
          participations_24h: participations24h || 0,
        },
        scores: {
          average: Math.round(averageScore * 100) / 100,
          highest: Math.round(highestScore * 100) / 100,
          lowest: Math.round(lowestScore * 100) / 100,
          total_scored: totalScored,
        },
        studies: {
          total_cycles: totalCycles,
          active_cycles: activeCycles,
          total_sessions: totalSessions,
          total_hours: Math.round(totalHours * 100) / 100,
          questions_answered: questionsAnswered,
          correct_answers: correctAnswers,
          accuracy_rate: accuracyRate,
        },
        coach: {
          total_coaches: totalCoaches,
          active_subscriptions: activeSubscriptions,
          total_students: totalStudents,
          pending_invitations: pendingInvitations,
          access_logs_24h: accessLogs24h,
        },
        security: {
          audit_logs_24h: auditLogs24h,
          security_logs_24h: securityLogs24h,
          total_security_events: totalSecurityEvents,
        },
        notifications: {
          total: totalNotifications,
          unread: unreadNotifications,
          created_24h: notifications24h,
        },
        performance: {
          avg_query_time_ms: Math.round(avgQueryTime * 100) / 100,
          slow_queries_count: slowQueriesCount,
          active_alerts: activeAlertsCount,
          critical_alerts: criticalAlertsCount,
        },
        system: {
          health: systemHealth,
          engagement_rate: userEngagement,
          uptime_percentage: uptimePercentage,
        },
      },
    };

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('[metrics] Error:', error);
    
    const errorResponse: MetricsResponse = {
      timestamp: new Date().toISOString(),
      status: 'error',
      metrics: {
        users: { total: 0, online: 0, active_24h: 0, active_7d: 0 },
        rankings: { total: 0, active: 0, participations: 0, participations_24h: 0 },
        scores: { average: 0, highest: 0, lowest: 0, total_scored: 0 },
        studies: { total_cycles: 0, active_cycles: 0, total_sessions: 0, total_hours: 0, questions_answered: 0, correct_answers: 0, accuracy_rate: 0 },
        coach: { total_coaches: 0, active_subscriptions: 0, total_students: 0, pending_invitations: 0, access_logs_24h: 0 },
        security: { audit_logs_24h: 0, security_logs_24h: 0, total_security_events: 0 },
        notifications: { total: 0, unread: 0, created_24h: 0 },
        performance: { avg_query_time_ms: 0, slow_queries_count: 0, active_alerts: 0, critical_alerts: 0 },
        system: { health: 'critical', engagement_rate: 0, uptime_percentage: 0 },
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return new Response(
      JSON.stringify(errorResponse, null, 2),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

