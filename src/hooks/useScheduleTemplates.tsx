import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ScheduleTemplate {
  id: string;
  name: string;
  organization: string;
  template_type: 'contest' | 'bank';
  schedule_data: Array<{
    day: number;
    subjects: string[];
    hours: number;
  }>;
  is_public: boolean;
  created_by?: string;
  usage_count: number;
}

export const useScheduleTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('schedule_templates')
      .select('*')
      .order('usage_count', { ascending: false });

    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  };

  const applyTemplate = async (templateId: string, cycleId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template || !user) return;

    // Incrementar contador de uso
    await supabase
      .from('schedule_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', templateId);

    // Converter template para estrutura de blocos do ciclo
    const blocks = template.schedule_data.map((daySchedule, index) => ({
      id: `block-${index}`,
      name: `${getDayName(daySchedule.day)} - ${daySchedule.hours}h`,
      disciplines: daySchedule.subjects.map(subject => ({
        id: `discipline-${index}-${subject}`,
        name: subject,
        status: 'not_started' as const,
        estimatedHours: daySchedule.hours / daySchedule.subjects.length
      }))
    }));

    // Atualizar ciclo com os novos blocos
    const { error } = await supabase
      .from('study_cycles')
      .update({ blocks: blocks })
      .eq('id', cycleId)
      .eq('user_id', user.id);

    if (!error) {
      // Atualizar contador local
      setTemplates(prev => prev.map(t => 
        t.id === templateId 
          ? { ...t, usage_count: t.usage_count + 1 }
          : t
      ));
      
      return blocks;
    }
  };

  const createTemplate = async (
    name: string, 
    organization: string, 
    templateType: 'contest' | 'bank',
    scheduleData: Array<{ day: number; subjects: string[]; hours: number; }>,
    isPublic: boolean = false
  ) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('schedule_templates')
      .insert({
        name,
        organization,
        template_type: templateType,
        schedule_data: scheduleData,
        is_public: isPublic,
        created_by: user.id,
        usage_count: 0
      })
      .select()
      .single();

    if (!error && data) {
      setTemplates(prev => [...prev, data]);
      return data;
    }
  };

  const getDayName = (day: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[day] || 'Dia inválido';
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    loading,
    applyTemplate,
    createTemplate,
    refreshTemplates: loadTemplates,
    getDayName
  };
};