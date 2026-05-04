import { Request, Response } from 'express';
import { query } from '../db.js';

// --- PERFILES ---
export const getAllProfiles = async (req: Request, res: Response) => {
  try {
    const { rows } = await query('SELECT * FROM profiles ORDER BY fecha_creacion DESC', []);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await query('SELECT * FROM profiles WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, cedula, telefono, estado, rol, is_active } = req.body;
    
    await query(
      `UPDATE profiles SET 
        nombre=$1, apellido=$2, cedula=$3, telefono=$4, estado=$5, rol=$6, is_active=$7
       WHERE id=$8`,
      [nombre, apellido, cedula, telefono, estado, rol, is_active, id]
    );
    
    res.json({ message: 'Perfil actualizado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM profiles WHERE id = $1', [id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- CATÁLOGOS ---
export const getCatalogItems = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { rows } = await query(
      'SELECT c.*, p.name as parent_name FROM catalog_items c LEFT JOIN catalog_items p ON c.parent_id = p.id WHERE c.type = $1 ORDER BY c.name ASC',
      [type]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const saveCatalogItem = async (req: Request, res: Response) => {
  try {
    const { type, name, parent_id, empresa_id, precio_referencia, precio_privado, presentacion } = req.body;
    const { rows } = await query(
      `INSERT INTO catalog_items (type, name, parent_id, empresa_id, precio_referencia, precio_privado, presentacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [type, name, parent_id, empresa_id, precio_referencia, precio_privado, presentacion]
    );
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCatalogItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, parent_id, empresa_id, precio_referencia, precio_privado, presentacion, is_active } = req.body;
    await query(
      `UPDATE catalog_items SET 
        name=$1, parent_id=$2, empresa_id=$3, precio_referencia=$4, precio_privado=$5, presentacion=$6, is_active=$7
       WHERE id=$8`,
      [name, parent_id, empresa_id, precio_referencia, precio_privado, presentacion, is_active, id]
    );
    res.json({ message: 'Item actualizado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCatalogItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM catalog_items WHERE id = $1', [id]);
    res.json({ message: 'Item eliminado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- VULNERABILIDADES ---
export const getVulnerabilities = async (req: Request, res: Response) => {
  try {
    const { rows } = await query('SELECT * FROM vulnerability_data ORDER BY fecha_registro DESC', []);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const saveVulnerability = async (req: Request, res: Response) => {
  try {
    const { estado, municipio, parroquia, nivel_prioridad, descripcion_problema, latitud, longitud } = req.body;
    const { rows } = await query(
      `INSERT INTO vulnerability_data (estado, municipio, parroquia, nivel_prioridad, descripcion_problema, latitud, longitud)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [estado, municipio, parroquia, nivel_prioridad, descripcion_problema, latitud, longitud]
    );
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteVulnerability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM vulnerability_data WHERE id = $1', [id]);
    res.json({ message: 'Punto eliminado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
