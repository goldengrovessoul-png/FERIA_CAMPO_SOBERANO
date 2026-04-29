# Guía de Instalación Limpia: Servidor Propio (On-Premise)
**Proyecto:** Feria Campo Soberano
**Para:** Equipo de Infraestructura / TI

---

## 1. Resumen de Arquitectura
El sistema se compone de una **App React (Vite)** que actúa como cliente y un motor **Supabase (Self-Hosted)** que actúa como Backend y Base de Datos. 

**Objetivo de TI:** Desplegar una instancia vacía de Supabase en servidores locales, aplicar la estructura de tablas (Schema) desde el repositorio y servir el Frontend compilado.

## 2. Paso 1: Instalación del Backend (Base de Datos)

⚠️ **IMPORTANTE:** No se requiere migración de datos desde la nube. Se desea una instalación **desde cero (limpia)** con la estructura definida en el código.

1.  **Requisitos:** Servidor Linux (Ubuntu recomendado) con **Docker** y **Docker Compose** instalados.
2.  **Despliegue de Supabase:** 
    *   Utilizar el repositorio oficial de auto-alojamiento: `https://github.com/supabase/postgres` o seguir la guía de Docker oficial: `https://supabase.com/docs/guides/self-hosting/docker`.
3.  **Aplicar Estructura (Migrations):**
    *   Clonar el repositorio de la App desde GitHub.
    *   Dentro de la carpeta raíz, encontrarán la carpeta `./supabase/migrations/`.
    *   Deben ejecutar los scripts SQL contenidos en esa carpeta en el nuevo PostgreSQL para crear las tablas, funciones y políticas de seguridad (RLS).
4.  **Configuración de Red:**
    *   Asegurar que los puertos del API de Supabase (Kong) sean accesibles por la red local/VPN.
5.  **Entrega de Credenciales:** Una vez levantado el servicio, TI debe proveer al equipo de desarrollo:
    *   **API_URL:** La URL base del servidor (ej: `https://api.midominio.com`).
    *   **SERVICE_ROLE_KEY** y **ANON_KEY**: Generadas por la instalación local.

## 3. Paso 2: Despliegue del Frontend (Aplicación Web)

Una vez que el equipo de desarrollo reciba las nuevas credenciales, entregaremos un paquete **`dist.zip`**.

1.  **Servidor Web:** Utilizar Nginx o Apache.
2.  **Configuración Nginx (Obligatoria para React Router):**
    ```nginx
    server {
        listen 80;
        server_name feria.tuempresa.com;
        root /var/www/html/feria;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
    ```
3.  **HTTPS:** Es fundamental el uso de SSL para el correcto funcionamiento de las APIs de geolocalización y autenticación.

## 4. Paso 3: Aplicación Móvil (APK)
El equipo de desarrollo generará un nuevo archivo APK configurado para apuntar a la IP/Dominio del nuevo servidor local. Este APK será el que se distribuirá finalmente a los inspectores.

---
*Documento actualizado para Instalación Limpia - Abril 2026*
