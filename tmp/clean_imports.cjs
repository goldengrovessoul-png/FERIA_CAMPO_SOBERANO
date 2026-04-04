const fs = require('fs');
const path = 'c:\\Users\\GONZALO\\Documents\\PROYECTOS DE ANTIGRAVITY\\FERIA_CAMPO_SOBERANO\\src\\pages\\JefeDashboard.tsx';
let content = fs.readFileSync(path, 'utf8').split('\n');

// Actualizar bloque de iconos (líneas 1 a 11 aprox)
const newImports = [
    "/* eslint-disable @typescript-eslint/no-explicit-any */",
    "import { useNavigate } from 'react-router-dom';",
    "import { useState } from 'react';",
    "import {",
    "    BarChart3, Users, LogOut, Search,",
    "    TrendingUp, Package,",
    "    Activity, RefreshCw, Home,",
    "    ChevronDown, Building2, Eraser, Star, AlertTriangle, Percent, ArrowDownRight,",
    "    Leaf, UserPlus, X, Calendar, MapPin, Globe, Map as MapIcon",
    "} from 'lucide-react';",
    ""
];

// Reemplazar primeras 11 líneas
content.splice(0, 11, ...newImports);

fs.writeFileSync(path, content.join('\n'), 'utf8');
console.log('Limpieza de imports integrada.');
