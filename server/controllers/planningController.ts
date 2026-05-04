import { Request, Response } from 'express';
import { query } from '../db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getPlanning = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await query('SELECT * FROM state_product_planning ORDER BY estado, periodo DESC', []);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPlanningByState = async (req: AuthRequest, res: Response) => {
  try {
    const { estado } = req.params;
    const { rows } = await query(
      'SELECT * FROM state_product_planning WHERE estado = $1 ORDER BY periodo DESC',
      [estado]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPlanningByWeek = async (req: AuthRequest, res: Response) => {
  try {
    const { estado, periodo } = req.params;
    const { rows } = await query(
      'SELECT * FROM state_product_planning WHERE estado = $1 AND periodo = $2',
      [estado, periodo]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePlanning = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { cantidad_planificada, cantidad_asignada, cantidad_recibida, periodo } = req.body;
    const { rows } = await query(
      `UPDATE state_product_planning SET 
        cantidad_planificada = $1, 
        cantidad_asignada = $2, 
        cantidad_recibida = $3,
        periodo = $4
       WHERE id = $5 RETURNING *`,
      [cantidad_planificada, cantidad_asignada, cantidad_recibida, periodo, id]
    );
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createPlanning = async (req: AuthRequest, res: Response) => {
  try {
    const { estado, product_id, cantidad_planificada, cantidad_asignada, cantidad_recibida, periodo } = req.body;
    const { rows } = await query(
      `INSERT INTO state_product_planning 
        (estado, product_id, cantidad_planificada, cantidad_asignada, cantidad_recibida, periodo) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [estado, product_id, cantidad_planificada, cantidad_asignada, cantidad_recibida, periodo]
    );
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
