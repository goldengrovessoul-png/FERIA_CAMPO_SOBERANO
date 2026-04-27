-- MIGRACIÓN DE SEGURIDAD Y RENDIMIENTO - FERIA CAMPO SOBERANO
-- Fecha: 27 de Abril de 2026
-- Objetivo: Blindaje de funciones críticas, optimización de RLS e índices de base de datos.

-- 1. REFORZAR FUNCIÓN execute_ai_query (SEGURIDAD)
CREATE OR REPLACE FUNCTION public.execute_ai_query(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    user_role text;
BEGIN
    -- Verificación de identidad y rol estratégica
    SELECT rol INTO user_role FROM public.profiles WHERE id = auth.uid();
    
    IF user_role IS NULL OR user_role NOT IN ('ADMIN', 'JEFE') THEN
        RAISE EXCEPTION 'Acceso denegado: No tienes permisos de nivel estratégico para esta operación.';
    END IF;

    -- Validación estricta: solo permitir consultas que inicien con SELECT
    IF NOT (LOWER(TRIM(query_text)) ~ '^\s*select\s+') THEN
        RAISE EXCEPTION 'Acceso denegado: Solo se permiten consultas de lectura (SELECT).';
    END IF;

    -- Ejecutamos la consulta y empaquetamos el resultado en JSONB
    EXECUTE 'SELECT jsonb_agg(t) FROM (' || query_text || ') t' INTO result;
    
    RETURN COALESCE(result, '[]'::jsonb);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM, 'query', query_text);
END;
$$;

-- Revocamos ejecución pública y restringimos a usuarios autenticados autorizados
REVOKE EXECUTE ON FUNCTION public.execute_ai_query(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.execute_ai_query(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.execute_ai_query(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_ai_query(text) TO service_role;

-- 2. ASEGURAR handle_new_user CON search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, rol, nombre, apellido, cedula)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'rol')::text, 'INSPECTOR'),
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    COALESCE(NEW.raw_user_meta_data->>'cedula', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. CONSOLIDACIÓN Y OPTIMIZACIÓN DE RLS (EVITAR RE-EVALUACIÓN POR FILA)
-- Usamos (SELECT auth.uid()) para mejorar rendimiento masivo

-- Perfiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_consolidated" ON public.profiles;
CREATE POLICY "profiles_update_consolidated" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = (SELECT auth.uid()) OR (SELECT rol FROM public.profiles WHERE id = (SELECT auth.uid())) = 'ADMIN');

-- Reportes
DROP POLICY IF EXISTS "reports_select_access" ON public.reports;
CREATE POLICY "reports_select_access" ON public.reports
    FOR SELECT TO authenticated
    USING (inspector_id = (SELECT auth.uid()) OR (SELECT rol FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('JEFE', 'ADMIN'));

-- 4. ÍNDICES DE RENDIMIENTO (ESTRATÉGICOS)
CREATE INDEX IF NOT EXISTS idx_reports_inspector_id ON public.reports(inspector_id);
CREATE INDEX IF NOT EXISTS idx_reports_estado_geografico ON public.reports(estado_geografico);
CREATE INDEX IF NOT EXISTS idx_reports_fecha ON public.reports(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_report_items_report_id ON public.report_items(report_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_lookup ON public.catalog_items(parent_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_venezuela_dpa_lookup ON public.venezuela_dpa(estado, municipio, parroquia);
