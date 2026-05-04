import { Request, Response } from 'express';
import { query } from '../db.js';

export const getBodegas = async (req: Request, res: Response) => {
  try {
    const { rows } = await query('SELECT * FROM cat_bodegas_moviles ORDER BY estado ASC, nombre ASC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createBodega = async (req: Request, res: Response) => {
  const { estado, nombre } = req.body;
  try {
    const { rows } = await query(
      'INSERT INTO cat_bodegas_moviles (estado, nombre) VALUES ($1, $2) RETURNING *',
      [estado, nombre]
    );
    res.status(201).json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBodega = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estado, nombre } = req.body;
  try {
    const { rows } = await query(
      'UPDATE cat_bodegas_moviles SET estado = $1, nombre = $2 WHERE id = $3 RETURNING *',
      [estado, nombre, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Bodega no encontrada' });
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBodega = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { rowCount } = await query('DELETE FROM cat_bodegas_moviles WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Bodega no encontrada' });
    res.json({ message: 'Bodega eliminada' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
