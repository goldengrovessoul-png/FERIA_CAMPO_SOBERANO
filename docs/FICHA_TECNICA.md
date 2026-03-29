# 📋 FICHA TÉCNICA - APLICACIÓN FERIA CAMPO SOBERANO (FCS)
**Versión del Documento:** 1.0.0  
**Fecha de Emisión:** 29 de Marzo de 2026

---

## 🚀 Resumen Técnico
La aplicación **Feria Campo Soberano** es una plataforma de gestión operativa y visualización estratégica diseñada para monitorear el impacto de las jornadas de alimentación a nivel nacional. Utiliza una arquitectura moderna de **Single Page Application (SPA)** con capacidades híbridas para dispositivos móviles.

---

## 🛠️ Stack Tecnológico (Core)

### 1. Frontend & Framework
*   **React 19.2.0**: Biblioteca principal para la interfaz de usuario.
*   **Node.js v22.18.0**: Entorno de ejecución de JavaScript en el sistema.
*   **TypeScript 5.9.3**: Lenguaje de tipado estático para garantizar robustez y prevenir errores de lógica.
*   **Vite 7.3.1**: Herramienta de construcción y empaquetado de última generación para un desarrollo ultra-rápido.

### 2. Backend & Persistencia
*   **Supabase (BaaS)**: Plataforma backend utilizada para:
    *   **Base de Datos**: PostgreSQL para almacenamiento relacional.
    *   **Autenticación**: Supabase Auth para la gestión de usuarios y roles.
    *   **Real-time**: Sincronización de datos entre Inspectores y el Dashboard.

### 3. Visualización y Gráficos
*   **Recharts 3.7.0**: Implementación de gráficos estadísticos (Donas, Barras, Líneas) para análisis estratégico.
*   **Leaflet 1.9.4 & React-Leaflet 5.0.0**: Motor de mapas interactivos para georeferenciación de jornadas.
*   **Lucide-React 0.575.0**: Paquete de iconos vectoriales para una interfaz moderna y clara.

### 4. Estilos y Layout
*   **Tailwind CSS 3.4.19**: Framework de CSS utilitario para un diseño responsivo, pulcro y personalizado.
*   **Lucide-React**: Iconografía optimizada.

### 5. Capacidades Móviles
*   **Capacitor 8.1.0**: Framework para convertir la aplicación web en una App nativa para Android/iOS sin pérdida de rendimiento.

---

## 🏗️ Infraestructura y Despliegue
*   **Vercel**: Hosting de la versión web con despliegue continuo (CI/CD).
*   **Geolocalización**: Uso de la API del navegador (HTML5 Geolocation) para captura de coordenadas GPS en campo.

---

## 🔒 Seguridad
*   **Row Level Security (RLS)**: Políticas de seguridad a nivel de base de datos en Supabase para asegurar que los usuarios solo accedan a los datos permitidos por su rol.
*   **JWT (JSON Web Tokens)**: Gestión de sesiones seguras.

---

**© 2026 - Sistema de Gestión Feria Campo Soberano**
