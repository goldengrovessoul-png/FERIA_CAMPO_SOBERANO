# Visión del Proyecto: Feria Campo Soberano

## 1. Descripción General
Feria Campo Soberano es una aplicación diseñada para la gestión, seguimiento y reporte de actividades de comercialización y distribución de alimentos. Está orientada a inspectores y personal operativo que reportan datos en tiempo real desde el campo.

## 2. Pilares Tecnológicos
- **Frontend**: React + Vite (Web y Mobile vía Capacitor).
- **Estilos**: Tailwind CSS para una UI moderna y responsiva.
- **Backend**: Supabase (PostgreSQL, Auth, Storage).
- **IA**: Integración con Gemini para análisis de datos mediante consultas SQL inteligentes.

## 3. Módulos Principales
- **Reportes**: Carga de datos de ferias, rubros vendidos y beneficiarios.
- **Emprendedores**: Registro de participación de emprendimientos locales.
- **Presencia de Entes**: Control de asistencia y productos de entes gubernamentales.
- **Dashboard IA**: Consultas en lenguaje natural sobre el estado de las ferias.

## 4. Estado de Seguridad y Datos
- **RLS (Row Level Security)**: Activo y reforzado. Los inspectores solo gestionan sus propios reportes.
- **Storage**: Gestión de fotos de evidencias en buckets protegidos.
- **Funciones RPC**: Protegidas y con `search_path` configurado.

## 5. Próximos Pasos
- [ ] Optimización de la carga de imágenes en zonas de baja conectividad.
- [ ] Refinamiento del dashboard de IA para reportes consolidados.
- [ ] Sincronización offline para reportes en campo.
