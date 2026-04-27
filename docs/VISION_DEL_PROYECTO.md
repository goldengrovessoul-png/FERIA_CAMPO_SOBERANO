# Visión del Proyecto: Feria Campo Soberano

Este documento establece las bases técnicas, arquitectónicas y estratégicas de la aplicación Feria Campo Soberano. Sirve como la "fuente de verdad" para el desarrollo, mantenimiento y futura migración del sistema.

## 1. Descripción General
Feria Campo Soberano es una plataforma integral diseñada para la gestión, seguimiento y reporte en tiempo real de actividades de distribución de alimentos. Facilita la labor de los inspectores en campo y proporciona herramientas analíticas de alto nivel para la toma de decisiones estratégicas.

## 2. Pilares Tecnológicos
- **Frontend**: React 19 + Vite (TypeScript).
- **Mobile**: Capacitor 8 para despliegue nativo en Android/iOS.
- **Estilos**: Tailwind CSS con estética premium (Neon/Dark Mode).
- **Backend**: Supabase (PostgreSQL 17, Auth, Storage).
- **IA**: Integración con Google Gemini para análisis inteligente mediante lenguaje natural.

## 3. Arquitectura y Base de Datos
- **Proyecto Supabase**: `cuspal_feria_campo-soberano` (ID: `oiszovahzjohxadzxpag`)
- **Gestión Dinámica (JSONB)**: Se utiliza el tipo de dato JSONB para almacenar estructuras de formularios y respuestas, permitiendo cambios dinámicos en los campos sin afectar la integridad del esquema SQL.
- **Rendimiento**: 
    - **Índices**: Todas las tablas cuentan con índices estratégicos en llaves foráneas y filtros frecuentes (`inspector_id`, `estado_geografico`, `fecha`).
    - **DPA**: Optimización de búsqueda en la División Político Administrativa (Venezuela) mediante índices compuestos.

## 4. Seguridad y Control de Acceso
- **Seguridad a Nivel de Filas (RLS)**: 
    - Implementación de políticas optimizadas mediante subconsultas `(SELECT auth.uid())` para garantizar alto rendimiento.
    - Los **Inspectores** solo pueden gestionar sus propios reportes.
    - **Jefes** y **Admins** poseen acceso de lectura global para análisis.
- **Blindaje de Funciones (RPC)**:
    - La función `execute_ai_query` está protegida internamente, permitiendo ejecución solo a roles `ADMIN` y `JEFE`.
    - Todas las funciones `SECURITY DEFINER` tienen configurado el `search_path = public`.
- **Modelo de Acceso Bifurcado**:
    - `/app`: Interfaz móvil-first para Inspectores.
    - `/dashboard`: Interfaz analítica para Jefes/Admins.
    - `/admin`: Panel de control total.

## 5. Experiencia de Usuario (UX)
- **Mobile-First & Offline-Ready**: Capacidad de guardar borradores localmente en zonas de baja conectividad y sincronización automática al detectar red.
- **Georreferenciación**: Captura obligatoria de latitud/longitud con validación de precisión GPS.
- **Visualización Estratégica**: Mapas con Clustering y gráficas de Pareto para identificar puntos críticos de distribución.
- **Exportación**: Generación de reportes PDF con evidencias fotográficas y ubicación GPS precisa.

## 6. Estado Actual y Próximos Pasos (Abril 2026)
- **Hito Reciente**: Completado el blindaje de seguridad y optimización de rendimiento de la base de datos (Paso 1 y 2).
- **Próximos Pasos**:
    - [ ] Optimización avanzada de la carga de imágenes (compresión en cliente).
    - [ ] Implementación del módulo de Planificación (Planner).
    - [ ] Sincronización robusta offline para reportes persistentes.

---
*Este documento es dinámico y debe actualizarse ante cualquier cambio estructural significativo en el proyecto.*
