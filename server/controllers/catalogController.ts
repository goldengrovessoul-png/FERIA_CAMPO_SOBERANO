import { Request, Response } from 'express';
import { query } from '../db.js';

export const getFullCatalog = async (req: Request, res: Response) => {
  try {
    const { rows } = await query('SELECT id, type, name, parent_id, empresa_id FROM catalog_items WHERE is_active = true ORDER BY name ASC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getDpa = async (req: Request, res: Response) => {
  try {
    const { rows } = await query('SELECT estado, municipio, parroquia FROM venezuela_dpa ORDER BY estado, municipio, parroquia');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getEntrepreneurData = async (req: Request, res: Response) => {
  try {
    const tipos = await query('SELECT nombre FROM cat_emprendimiento_tipos ORDER BY nombre ASC');
    const campos = await query('SELECT id, nombre, etiqueta, tipo, requerido FROM cat_emprendimiento_campos ORDER BY orden ASC');
    res.json({
      tipos: tipos.rows.map(r => r.nombre),
      campos: campos.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
