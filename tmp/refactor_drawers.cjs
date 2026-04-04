const fs = require('fs');
const path = 'c:\\Users\\GONZALO\\Documents\\PROYECTOS DE ANTIGRAVITY\\FERIA_CAMPO_SOBERANO\\src\\pages\\JefeDashboard.tsx';
let content = fs.readFileSync(path, 'utf8').split('\n');

// Eliminar desde la línea 1442 (índice 1441) hasta la 1717 (índice 1716)
// El marcador es {isDrillDownOpen && (
const startLineIdx = 1441;
const endLineIdx = 1716;

const newBlock = [
    '            {/* ── DRAWERS DE DRILL-DOWN MODULARIZADOS ── */}',
    '            <DashboardDrawers ',
    '                isDrillDownOpen={isDrillDownOpen}',
    '                setIsDrillDownOpen={setIsDrillDownOpen}',
    '                isStateDrillDownOpen={isStateDrillDownOpen}',
    '                setIsStateDrillDownOpen={setIsStateDrillDownOpen}',
    '                selectedEnte={selectedEnte}',
    '                setSelectedEnte={setSelectedEnte}',
    '                selectedEstado={selectedEstado}',
    '                setSelectedEstado={setSelectedEstado}',
    '                enteJornadasDetails={enteJornadasDetails}',
    '                estadoJornadasDetails={estadoJornadasDetails}',
    '            />'
];

content.splice(startLineIdx, (endLineIdx - startLineIdx + 1), ...newBlock);

fs.writeFileSync(path, content.join('\n'), 'utf8');
console.log('Refactorización completada con éxito.');
