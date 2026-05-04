# Guía de Despliegue: Servidor Local (On-Premise) - Independencia Total
**Proyecto:** Feria Campo Soberano
**Para:** Equipo de Infraestructura / TI
**Fecha:** Mayo 2026

---

## 1. Resumen de Arquitectura
La aplicación ha sido migrada de Supabase a una arquitectura propia más ligera y robusta para entornos locales:
- **Frontend:** React 19 + Vite (TypeScript).
- **Backend:** Node.js + Express.js (Ubicado en la carpeta `/server`).
- **Base de Datos:** PostgreSQL 17 Local.
- **Autenticación:** Basada en JWT (JSON Web Tokens) gestionados por el servidor local.

## 2. Requisitos Previos
- **Node.js** v20 o superior.
- **PostgreSQL** v16 o 17 instalado y corriendo.
- **Git** (opcional, para gestión de versiones).

## 3. Paso 1: Configuración de la Base de Datos
Se ha extraído un respaldo completo de la nube para mantener la continuidad operativa.

1.  **Crear Base de Datos:** Crear una base de datos vacía llamada `feria_campo_soberano`.
2.  **Importar Respaldo:**
    - Usar el archivo: **`respaldo_completo_nube.sql`** (incluye esquemas y datos históricos con fotos).
    - Comando recomendado: `psql -U postgres -d feria_campo_soberano -f respaldo_completo_nube.sql`
    - *Nota: El script incluye `SET session_replication_role = 'replica';` para evitar conflictos de integridad durante la carga inicial.*

## 4. Paso 2: Configuración del Servidor (Backend)
1.  **Instalar dependencias:** Ejecutar `npm install` en la raíz del proyecto.
2.  **Variables de Entorno:** Configurar el archivo `.env` con las credenciales de su PostgreSQL local:
    ```env
    PORT=3000
    DATABASE_URL=postgresql://usuario:password@localhost:5432/feria_campo_soberano
    JWT_SECRET=una_clave_secreta_muy_larga_y_segura
    ```
3.  **Iniciar Servidor:**
    - Desarrollo: `npm run server`
    - Producción: `node server/index.ts` (usando `tsx` o compilando previamente).

## 5. Paso 3: Despliegue del Frontend
1.  **Compilación:** Ejecutar `npm run build`.
2.  **Servicio:** La carpeta `dist/` resultante debe ser servida por un servidor web (Nginx/Apache).
3.  **Configuración Nginx:**
    ```nginx
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://localhost:3000;
    }
    ```

## 6. Paso 4: Aplicación Móvil (APK)
Para generar el APK que apunte al nuevo servidor, usar **Capacitor**:
1. Actualizar `src/services/api.ts` con la nueva URL del servidor.
2. Ejecutar `npx cap sync`.
3. Abrir en Android Studio y generar el `Signed APK`.

---
*Documento actualizado para Migración Final - Mayo 2026*
