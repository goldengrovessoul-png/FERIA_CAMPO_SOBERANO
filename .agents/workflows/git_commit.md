---
description: Guardar commit de Git al cerrar sesión o tras cambios importantes
---

# Procedimiento de Commit Git — Feria Campo Soberano

Este workflow se ejecuta SIEMPRE al:
- Cerrar/finalizar una sesión de trabajo
- Completar una funcionalidad o cambio importante
- Antes de iniciar refactorizaciones o experimentos de diseño
- Cuando el usuario lo solicite explícitamente

## Contexto del Repositorio

- **Ruta del proyecto**: `c:\Users\GONZALO\Documents\PROYECTOS DE ANTIGRAVITY\FERIA_CAMPO_SOBERANO`
- **Rama principal**: `master`
- **IMPORTANTE**: El repo Git está inicializado DENTRO del proyecto (no en el directorio de usuario). Siempre verificar con `git rev-parse --show-toplevel` que apunta al proyecto.

## Pasos del Workflow

// turbo-all

1. Verificar que el repositorio Git es el correcto:
```
git -C "c:\Users\GONZALO\Documents\PROYECTOS DE ANTIGRAVITY\FERIA_CAMPO_SOBERANO" rev-parse --show-toplevel
```
Debe devolver la ruta del proyecto. Si devuelve `C:/Users/GONZALO`, hay un problema — reportar al usuario.

2. Agregar todos los archivos fuente relevantes al staging:
```
git add src/ public/ index.html package.json tailwind.config.js vite.config.ts tsconfig.app.json tsconfig.json tsconfig.node.json postcss.config.js eslint.config.js vercel.json .gitignore "Doc´s/"
```
NUNCA agregar: `.env`, `node_modules/`, `dist/`, `android/`

3. Verificar qué archivos cambiaron:
```
git status --short
```

4. Crear el commit con un mensaje descriptivo usando el formato:
```
git commit -m "✅ [TIPO] Descripción clara del cambio (DD-MMM-YYYY)

- Detalle 1 de lo que se hizo
- Detalle 2
- Estado: ESTABLE / EN PROGRESO"
```

**Tipos de commit permitidos:**
- `✅ ESTABLE` — Sesión cerrada, app funcionando correctamente
- `🚀 FEATURE` — Nueva funcionalidad implementada
- `🐛 FIX` — Corrección de bug
- `🎨 DESIGN` — Cambios de UI/UX
- `♻️ REFACTOR` — Refactorización de código
- `⚠️ WIP` — Trabajo en progreso (antes de experimentos riesgosos)

5. Confirmar el commit creado:
```
git log --oneline -3
```
Mostrar al usuario el ID del commit y el mensaje para que quede registrado.

## Ejemplos de Mensajes de Commit

```
✅ ESTABLE - Dashboard Analítico completo (05-Mar-2026)
- Mapa Venezuela operativo con leyenda de actividades
- Gráficas MINPPAL, Rubros, Auditoría Operativa
- KPIs: Jornadas, Cobertura, Familias, Habitantes
- Filtros: Estado, Ente, Rubro, Tipo, Fechas

🚀 FEATURE - Filtro por Municipio implementado (10-Mar-2026)
- Selector dinámico de municipio basado en estado seleccionado
- Datos cargados desde catálogos Supabase

🐛 FIX - Corrección timeout Supabase en JefeDashboard (08-Mar-2026)
- Aumentado timeout de queries a 30s
- Agregado retry automático en fetchData
```

## Regla de Oro

> Antes de hacer cualquier cambio experimental o de diseño, crear un commit con tipo `⚠️ WIP` para poder revertir si algo sale mal.
> Al terminar y verificar que todo funciona, crear un commit `✅ ESTABLE`.
