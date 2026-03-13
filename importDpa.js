import fs from 'fs';
import * as XLSX from 'xlsx';

const buf = fs.readFileSync('ESTADOS MUNICIPIO Y PARROQUIA DE VENEZUELA.xlsx');
const workbook = XLSX.read(buf);
const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

const SUPABASE_URL = 'https://oiszovahzjohxadzxpag.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pc3pvdmFoempvaHhhZHp4cGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjIzMDgsImV4cCI6MjA4NzU5ODMwOH0.nl28OI34KTisrKXpOVXSc7fq6yL6daQpXINGO8Gndxs'; // Anon key we made insertable

const insertData = async () => {
    // Generate raw SQL to insert rows because supabase anon key might have RLS issues even if we granted insert? 
    // Wait, the MCP can just run raw SQL directly through `apply_migration` but it has a limit on size. 
    // So let's just use REST API via fetch.
    const url = `${SUPABASE_URL}/rest/v1/venezuela_dpa`;

    const CHUNK_SIZE = 500;
    
    // First, clear the table if any rows exist
    await fetch(url + '?id=gt.0', {
        method: 'DELETE',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    const rows = sheetData.map(row => ({
        estado: String(row.Estado).trim(),
        municipio: String(row.Municipio).trim(),
        parroquia: String(row.Parroquia).trim()
    }));

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(chunk)
        });

        if (!res.ok) {
            console.error('Failed to insert chunk:', await res.text());
        } else {
            console.log(`Inserted chunk ${i} to ${i + CHUNK_SIZE}`);
        }
    }

    console.log("Done inserting", rows.length, "rows.");
};

insertData().catch(console.error);
