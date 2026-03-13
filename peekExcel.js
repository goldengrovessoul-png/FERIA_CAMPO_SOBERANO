import fs from 'fs';
import * as XLSX from 'xlsx';

const buf = fs.readFileSync('ESTADOS MUNICIPIO Y PARROQUIA DE VENEZUELA.xlsx');
const workbook = XLSX.read(buf);
const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
console.log("Column headers:", Object.keys(sheetData[0]));
console.log("First row example:", sheetData[0]);
