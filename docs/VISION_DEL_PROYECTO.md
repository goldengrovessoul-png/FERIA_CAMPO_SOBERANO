# Visión del Proyecto: Reporte Feria del Campo Soberano (Suplemento Técnico)

Este documento complementa el **"VISION FERIA DEL CAMPO SOBERANO.pdf"** y establece las bases técnicas, arquitectónicas y de experiencia de usuario acordadas para el desarrollo de la aplicación. Sirve como la "biblia" técnica del proyecto.

## 1. Arquitectura de Sistema y Base de Datos (Supabase)

*   **Proyecto Supabase:** `cuspal_feria_campo-soberano` (ID: `oiszovahzjohxadzxpag`)
*   **Gestión Dinámica de Campos:** Para cumplir con el requerimiento de que el Administrador pueda modificar los campos del formulario dinámicamente, se utilizará un esquema basado en **JSONB** en Supabase para almacenar la estructura de los formularios y las respuestas de los reportes. Esto asegura máxima flexibilidad sin requerir migraciones constantes de esquema SQL.
*   **Seguridad a Nivel de Filas (RLS):** Se implementarán políticas estrictas de RLS en Supabase asegurando que:
    *   Los **Inspectores** solo puedan leer y editar (en estado borrador) sus propios reportes del día actual.
    *   Los **Jefes** y **Administradores** tengan acceso de lectura a todos los reportes enviados para alimentar el Dashboard.
*   **Bitácora de Auditoría (Postpuesto):** Se ha decidido por ahora no implementar el sistema de auditoría. Se evaluará su inclusión en fases posteriores del proyecto.

## 2. Estrategia de Autenticación y Acceso Bifurcado

Para balancear la facilidad de prueba durante el desarrollo con la seguridad en producción y la usabilidad multiplataforma, se implementa un modelo de acceso bifurcado:

*   **Punto de Entrada Unificado, Experiencias Diferenciadas:** La SPA (Single Page Application) detectará la plataforma (móvil vs. escritorio) y el rol del usuario para dirigirlo a la interfaz adecuada.
*   **Ruta Protectoria (Routing):**
    *   `/app`: Área operativa (Móvil-first) exclusiva para el rol **Inspector**. Logueo mediante Cédula + PIN personal de 6 dígitos.
    *   `/dashboard`: Área analítica exclusiva para roles **Jefe** y **Administrador**.
    *   `/admin`: Área de configuración y auditoría exclusiva para **Administrador**.
*   **Credenciales "Maestras" de Desarrollo:**
    *   Rol Jefe: `JEFE` / `123456`
    *   Rol Admin: `ADMIN` / `654321`
    *   *Mecanismo de Seguridad Futuro:* Se preparará la columna `password_changed` en la base de datos. Para el despliegue en producción, se activará una regla que obligue a cambiar estos PINs genéricos en el primer inicio de sesión.

## 3. Experiencia de Usuario (UX) y Movilidad ("Mobile-First")

*   **Capacidad "Offline-First" (Trabajo en Campo):** Es un requerimiento crítico. La vista del Inspector (`/app`) implementará estrategias de almacenamiento local (ej. LocalStorage o IndexedDB) para permitir la creación y guardado de "Borradores" de reportes incluso sin conexión a internet. La sincronización (paso a "Enviado") se realizará al recuperar la conexión.
*   **Georreferenciación Precisa:** Se capturará obligatoriamente la latitud/longitud. Se implementará un filtro de precisión: si el error del GPS es significativo, se alertará al Inspector para mejorar la señal antes de permitir el envío.
*   **Dashboard Gerencial Ubicuo:**
    *   **Escritorio:** Vista panorámica, mapa amplio y gráficos en cuadrícula.
    *   **Dispositivo Móvil:** Si el Jefe accede desde su teléfono, el Dashboard será completamente responsivo. Los gráficos se apilarán verticalmente, el mapa se optimizará para interacción táctil y los controles de filtrado se agruparán en menús colapsables. Esto permite la **decisión rápida en terreno**.
*   **Mapas y Rendimiento:** Se utilizará **Clustering (Agrupamiento de Pines)** en el mapa del Dashboard para evitar la saturación visual y mejorar el rendimiento renderizando cientos de jornadas simultáneas.
*   **Exportación PDF:** Los reportes exportables incluirán, de forma clara, las evidencias fotográficas (hasta 3), un minimapa estático de la ubicación y los datos resumidos.

## 4. Stack Tecnológico

*   **Frontend:** React (TypeScript) + Vite. SPA con diseño Mobile-First.
*   **Estilos:** CSS Vanilla o TailwindCSS (optimizado para consistencia y responsividad extrema).
*   **Backend as a Service (BaaS):** Supabase (PostgreSQL, Auth, Storage, Edge Functions si fueran necesarias para la auditoría compleja).
*   **Alojamiento (Previsto):** Vercel o similar para el Frontend, apuntando al proyecto de Supabase actual (`cuspal_feria_campo-soberano`).

Este documento representa el consenso técnico y debe ser consultado para cualquier decisión de diseño o implementación durante el ciclo de vida del proyecto.
