-- =============================================================
-- SCHEMA: FERIA CAMPO SOBERANO
-- Última actualización: 2026-02-25
-- =============================================================

-- TABLA DE PERFILES (Extensión de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  rol TEXT CHECK (rol IN ('INSPECTOR', 'JEFE', 'ADMIN')) NOT NULL DEFAULT 'INSPECTOR',
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  cedula TEXT UNIQUE NOT NULL,
  estado TEXT,
  telefono TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  password_changed BOOLEAN DEFAULT FALSE
);

-- TABLA DE REPORTES
-- NOTA: inspector_id referencia auth.users (NO profiles) para evitar FK violations
-- cuando el trigger aún no ha creado el perfil.
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inspector_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  tipo_actividad TEXT NOT NULL,
  empresa TEXT,
  estado_geografico TEXT,
  municipio TEXT,
  parroquia TEXT,
  sector TEXT,
  nombre_comuna TEXT,
  comunas INTEGER DEFAULT 0,
  familias INTEGER DEFAULT 0,
  personas INTEGER DEFAULT 0,
  latitud DOUBLE PRECISION NOT NULL DEFAULT 0,
  longitud DOUBLE PRECISION NOT NULL DEFAULT 0,
  datos_formulario JSONB,
  estado_reporte TEXT CHECK (estado_reporte IN ('borrador', 'enviado')) DEFAULT 'borrador',
  fotos TEXT[],
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA DE ITEMS / RUBROS (Para KPIs)
CREATE TABLE IF NOT EXISTS public.report_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  rubro TEXT NOT NULL,
  empaque TEXT,
  medida TEXT,
  cantidad NUMERIC DEFAULT 0,
  precio_unitario NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA DE MÉTODOS DE PAGO (Para KPIs)
CREATE TABLE IF NOT EXISTS public.report_payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  metodo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_reports_inspector ON public.reports(inspector_id);
CREATE INDEX IF NOT EXISTS idx_reports_estado_reporte ON public.reports(estado_reporte);
CREATE INDEX IF NOT EXISTS idx_reports_fecha ON public.reports(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_report_items_report ON public.report_items(report_id);
CREATE INDEX IF NOT EXISTS idx_report_pm_report ON public.report_payment_methods(report_id);

-- =============================================================
-- TRIGGER: Crear perfil automáticamente al registrar usuario
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, rol, nombre, apellido, cedula)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'INSPECTOR'),
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'cedula', NEW.id::text)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_payment_methods ENABLE ROW LEVEL SECURITY;

-- ------- POLÍTICAS: profiles --------------------------------
-- Todos los autenticados pueden ver perfiles (sin recursión)
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Usuarios autenticados pueden crear su propio perfil
CREATE POLICY "profiles_insert_authenticated" ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Usuarios pueden editar solo su propio perfil
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ------- POLÍTICAS: reports ---------------------------------
-- INSPECTOR: Ve solo sus propios reportes
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT USING (inspector_id = auth.uid());

-- JEFE/ADMIN: Ve todos los reportes
CREATE POLICY "reports_select_jefe_admin" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.rol IN ('JEFE', 'ADMIN')
    )
  );

-- INSPECTOR: Puede crear reportes (solo asignados a sí mismo)
CREATE POLICY "reports_insert_inspector" ON public.reports
  FOR INSERT WITH CHECK (inspector_id = auth.uid());

-- INSPECTOR: Puede editar solo sus borradores
CREATE POLICY "reports_update_own_draft" ON public.reports
  FOR UPDATE
  USING (inspector_id = auth.uid() AND estado_reporte = 'borrador')
  WITH CHECK (inspector_id = auth.uid() AND estado_reporte IN ('borrador', 'enviado'));

-- ------- POLÍTICAS: report_items ----------------------------
CREATE POLICY "report_items_select" ON public.report_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "report_items_insert" ON public.report_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.inspector_id = auth.uid()
    )
  );

CREATE POLICY "report_items_delete" ON public.report_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.inspector_id = auth.uid()
    )
  );

-- ------- POLÍTICAS: report_payment_methods ------------------
CREATE POLICY "report_pm_select" ON public.report_payment_methods
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "report_pm_insert" ON public.report_payment_methods
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.inspector_id = auth.uid()
    )
  );

CREATE POLICY "report_pm_delete" ON public.report_payment_methods
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.inspector_id = auth.uid()
    )
  );
