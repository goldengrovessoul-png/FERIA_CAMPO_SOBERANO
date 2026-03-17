# 📄 Ficha Técnica y Guía de Migración - Feria Campo Soberano

Este documento proporciona la información necesaria para el equipo de TI de **CUSPAL** referente a la arquitectura, tecnologías y el proceso de despliegue del sistema de reportes de la Feria del Campo Soberano.

---

## 🏗️ Especificaciones Técnicas

### 1. Frontend
- **Framework:** [React 19+](https://react.dev/) (Vite como motor de construcción).
- **Lenguaje:** TypeScript.
- **Estilos:** Tailwind CSS v3.
- **Navegación:** React Router v7.
- **Mapas:** Leaflet con React-Leaflet.
- **Gráficas:** Recharts.
- **Iconografía:** Lucide React.
- **PWA/Móvil:** Integración con **Capacitor v8** para generación de APK nativa en Android.

### 2. Backend y Base de Datos (BaaS)
- **Plataforma:** [Supabase](https://supabase.com/) (Instancia PostgreSQL).
- **Autenticación:** Supabase Auth (Manejo de sesiones y roles: Admin e Inspector).
- **Seguridad:** Políticas de Seguridad de Nivel de Fila (RLS) activas para proteger los datos de cada perfil.
- **API:** RESTful generada automáticamente por PostgREST a través del cliente de Supabase.

### 3. Persistencia de Datos
- **Offline First:** El sistema cuenta con un mecanismo de auto-guardado en `localStorage` para prevenir pérdida de datos en zonas sin cobertura.

---

## 🛠️ Requisitos del Servidor / Entorno
Para instalar y ejecutar esta aplicación en servidores locales de CUSPAL, se requiere:

- **Node.js:** Versión 18.0 o superior.
- **npm:** Versión 9.0 o superior.
- **Acceso a Base de Datos:** Una instancia de Supabase (puede ser en la nube o auto-alojada vía Docker en servidores de CUSPAL).

---

## 🚀 Paso a Paso para la Instalación Local

### Paso 1: Clonar/Preparar el Proyecto
1. Extraer los archivos del código fuente en el directorio de trabajo del servidor.
2. Asegurarse de que el archivo `.env` contenga las credenciales correctas (ver sección de Variables de Entorno).

### Paso 2: Instalación de Dependencias
Ejecutar el siguiente comando en la raíz del proyecto:
```bash
npm install
```

### Paso 3: Configuración de la Base de Datos
1. Si se va a migrar la base de datos a un nuevo servidor PostgreSQL/Supabase, utilizar el script de respaldo ubicado en:  
   `Doc´s/supabase_schema.sql`.
2. Este script contiene la estructura de tablas (`reports`, `report_items`, `catalog_items`, `audit_logs`) y las funciones de base de datos necesarias.

### Paso 4: Ejecución en Desarrollo
Para realizar pruebas o ajustes:
```bash
npm run dev
```

### Paso 5: Generación del Build de Producción
Para desplegar en un servidor web (Nginx, Apache) o local:
```bash
npm run build
```
Esto generará una carpeta `dist/` con los archivos estáticos listos para ser servidos.

---

## ⚡ Variables de Entorno (.env)
El sistema requiere las siguientes claves para funcionar:
- `VITE_SUPABASE_URL`: URL del proyecto de Supabase.
- `VITE_SUPABASE_ANON_KEY`: Clave pública anónima (JWT Legacy).

---

## 📁 Estructura del Proyecto
- `/src`: Código fuente de la aplicación.
- `/src/pages`: Pantallas principales (Login, Dashboard, Formulario).
- `/src/lib`: Configuraciones de Supabase y Contextos de Autenticación.
- `/src/components`: Componentes reutilizables de UI.
- `/android`: Proyecto nativo de Capacitor para generación de la App móvil.
- `/Doc´s`: Documentación de visión, estatus y esquemas SQL.

---

> [!IMPORTANT]
> **Nota para TI:** Para la generación de la APK de Android, se requiere Android Studio instalado y ejecutar `npx cap sync android` seguido de `npx cap open android`.
