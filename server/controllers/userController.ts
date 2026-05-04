import { Request, Response } from 'express';
import { query } from '../db.js';
import bcrypt from 'bcryptjs';

export const manageUsers = async (req: Request, res: Response) => {
  const { action, userData, userId } = req.body;

  try {
    switch (action) {
      case 'create': {
        const { email, password, nombre, apellido, cedula, telefono, estado, rol } = userData;
        
        // 1. Hashear el PIN/Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Insertar en la base de datos local
        // Nota: En la versión local, asumimos que 'profiles' es nuestra tabla principal de usuarios
        const sql = `
          INSERT INTO profiles (email, password, nombre, apellido, cedula, telefono, estado, rol)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, email, nombre, rol
        `;
        const values = [email, hashedPassword, nombre, apellido, cedula, telefono, estado, rol];
        
        const { rows } = await query(sql, values);
        return res.status(201).json({ data: rows[0], message: 'Usuario creado exitosamente' });
      }

      case 'update': {
        const { email, password, nombre, apellido, cedula, telefono, estado, rol } = userData;
        let sql = '';
        let values: any[] = [];

        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          sql = `
            UPDATE profiles 
            SET email=$1, password=$2, nombre=$3, apellido=$4, cedula=$5, telefono=$6, estado=$7, rol=$8
            WHERE id=$9 RETURNING id
          `;
          values = [email, hashedPassword, nombre, apellido, cedula, telefono, estado, rol, userId];
        } else {
          sql = `
            UPDATE profiles 
            SET email=$1, nombre=$2, apellido=$3, cedula=$4, telefono=$5, estado=$6, rol=$7
            WHERE id=$8 RETURNING id
          `;
          values = [email, nombre, apellido, cedula, telefono, estado, rol, userId];
        }

        const { rows } = await query(sql, values);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        return res.json({ data: rows[0], message: 'Usuario actualizado' });
      }

      case 'delete': {
        const sql = 'DELETE FROM profiles WHERE id = $1 RETURNING id';
        const { rows } = await query(sql, [userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        return res.json({ message: 'Usuario eliminado correctamente' });
      }

      default:
        return res.status(400).json({ error: 'Acción no válida' });
    }
  } catch (error: any) {
    console.error('Error en manageUsers:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};
