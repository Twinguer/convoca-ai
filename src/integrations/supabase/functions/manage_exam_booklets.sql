
-- Função para gerenciar cadernos de prova
CREATE OR REPLACE FUNCTION public.manage_exam_booklets(
  p_operation text,
  p_concurso_id uuid DEFAULT NULL,
  p_booklet_id uuid DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_display_order integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_booklet_record record;
BEGIN
  CASE p_operation
    WHEN 'GET' THEN
      -- Buscar cadernos de um concurso
      SELECT jsonb_build_object(
        'success', true,
        'booklets', jsonb_agg(
          jsonb_build_object(
            'id', id,
            'name', name,
            'display_order', display_order
          ) ORDER BY display_order
        )
      ) INTO v_result
      FROM exam_booklets
      WHERE concurso_id = p_concurso_id;
      
      RETURN COALESCE(v_result, jsonb_build_object('success', true, 'booklets', '[]'::jsonb));
      
    WHEN 'CREATE' THEN
      -- Criar novo caderno
      INSERT INTO exam_booklets (concurso_id, name, display_order)
      VALUES (p_concurso_id, p_name, COALESCE(p_display_order, 1))
      RETURNING * INTO v_booklet_record;
      
      RETURN jsonb_build_object(
        'success', true,
        'booklet', jsonb_build_object(
          'id', v_booklet_record.id,
          'name', v_booklet_record.name,
          'display_order', v_booklet_record.display_order
        )
      );
      
    WHEN 'UPDATE' THEN
      -- Atualizar caderno
      UPDATE exam_booklets 
      SET 
        name = COALESCE(p_name, name),
        display_order = COALESCE(p_display_order, display_order),
        updated_at = now()
      WHERE id = p_booklet_id
      RETURNING * INTO v_booklet_record;
      
      RETURN jsonb_build_object(
        'success', true,
        'booklet', jsonb_build_object(
          'id', v_booklet_record.id,
          'name', v_booklet_record.name,
          'display_order', v_booklet_record.display_order
        )
      );
      
    WHEN 'DELETE' THEN
      -- Deletar caderno
      DELETE FROM exam_booklets WHERE id = p_booklet_id;
      
      RETURN jsonb_build_object('success', true);
      
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Operação inválida');
  END CASE;
END;
$$;

-- Função para buscar gabarito por caderno específico
CREATE OR REPLACE FUNCTION public.get_official_answer_weights_by_booklet(
  p_concurso_id uuid,
  p_booklet_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_object_agg(
    'questao' || question_number::text,
    jsonb_build_object(
      'resposta', correct_answer,
      'peso', weight,
      'secao', section_type,
      'anulada', is_nullified
    )
  ) INTO v_result
  FROM official_answer_weights
  WHERE concurso_id = p_concurso_id 
    AND booklet_id = p_booklet_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;
