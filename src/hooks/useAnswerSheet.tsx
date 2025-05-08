
import { useState, useEffect } from 'react';
import { Concurso } from '@/types/concursos';
import { supabase } from '@/integrations/supabase/client';
import { useAnswerSheet as useNewAnswerSheet } from './useAnswerSheet/index';

// This file now just re-exports the real implementation from the modular directory
export const useAnswerSheet = useNewAnswerSheet;
