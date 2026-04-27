# Manual de Despliegue

## 1. Prerrequisitos
- **Sistema operativo**: Windows 10/11 (compatible con Docker y Node.js).  
- **Node.js**: versión 18.x o superior (verificar con `node -v`).  
- **npm / Yarn**: gestor de paquetes (npm viene con Node.js).  
- **Expo CLI**: `npm install -g expo-cli`.  
- **EAS CLI**: `npm install -g eas-cli` (para builds de Android/iOS).  
- **Cuenta de Expo** y **perfil de proyecto** configurado (`expo login`).  
- **Supabase**: proyecto activo, claves API disponibles.  
- **Git**: versión 2.40+ y acceso al repositorio remoto.
- **Android SDK** (para pruebas locales) o **Xcode** (para iOS).

## 2. Configuración del entorno
1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-organizacion/feria-campo-soberano.git
   cd feria-campo-soberano
   ```
2. **Instalar dependencias**
   ```bash
   npm ci   # o `yarn install` si usas Yarn
   ```
3. **Crear archivo de variables de entorno**
   Copiar el template y rellenar los valores reales:
   ```bash
   cp .env.example .env
   ```
   Variables obligatorias:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_API_BASE`
   - `APP_ENV` (development | production)

## 3. Verificación local
- **Ejecutar la app en modo desarrollo**
  ```bash
  expo start
  ```
  - Escanear el QR con la app Expo Go (Android/iOS) o abrir en simulador.
- **Ejecutar pruebas**
  ```bash
  npm test   # o `yarn test`
  ```
- **Lint y formato**
  ```bash
  npm run lint   # revisa código con ESLint
  npm run format # aplica Prettier
  ```

## 4. Generación de build (APK/IPA)
### 4.1 Android (APK – preview)
```bash
eas build -p android --profile preview
```
- El comando genera un archivo **.apk** descargable en la página de EAS.  
- Para distribución interna, subir a **Firebase App Distribution** o compartir vía correo.

### 4.2 iOS (IPA – preview)
```bash
eas build -p ios --profile preview
```
- Requiere una cuenta Apple Developer y configuración de certificados en el Dashboard de Expo.
- El artefacto **.ipa** se distribuye mediante **TestFlight** o **Diawi**.

## 5. Despliegue a producción
1. **Seleccionar el perfil de producción** (definido en `eas.json`).
   ```bash
   eas build -p android --profile production
   eas build -p ios --profile production
   ```
2. **Actualizar la API (Supabase)**
   - Aplicar migraciones si existen:
     ```bash
     supabase db push
     ```
   - Verificar que las variables `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` correspondan al entorno **production**.
3. **Publicar en tiendas**
   - **Google Play Console**: subir el **.aab** generado (recomendado) y seguir el wizard de publicación.
   - **App Store Connect**: subir el **.ipa** y completar revisión.
4. **Post‑deploy verification**
   - Acceder a la app en modo producción.
   - Verificar que los recursos multilingües se carguen (`es`, `en`).
   - Probar flujos críticos: registro, login, generación de QR, sincronización con Supabase.
   - Revisar logs de **EAS Build** y **Google Play Console** para detectar errores.

## 6. Rollback rápido
- **Android**: en Google Play Console, usar la opción *Release > Manage releases* → *Create new release* → subir una versión anterior del **.aab**.
- **iOS**: en App Store Connect, crear una nueva versión y subir la build anterior.
- **Backend**: si se requiere revertir cambios de base de datos, usar los *SQL migration snapshots* guardados en el repositorio (`supabase/migrations/`).

## 7. Mantenimiento
- **Actualizaciones de dependencias**
  ```bash
  npm outdated
  npm update
  ```
- **Monitoreo**: habilitar **Sentry** (si está configurado) para capturar excepciones en producción.
- **Documentación**: mantener este manual actualizado en el repositorio bajo `docs/MANUAL_DESPLIEGUE.md`.

---
*Este documento está pensado para que el equipo de IT pueda seguir los pasos sin requerir asistencia adicional. Cualquier desviación de la arquitectura descrita (por ejemplo, uso de otro proveedor de backend) debe ser reflejada en una nueva versión del manual.*
