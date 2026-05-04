import { Request, Response } from 'express';
import { query } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario por email (o cédula si prefieres)
    const sql = 'SELECT * FROM profiles WHERE email = $1 OR cedula = $1';
    const { rows } = await query(sql, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];

    // 2. Verificar contraseña/PIN
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Generar JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        rol: user.rol,
        email: user.email 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // 4. Responder con los datos del usuario y el token
    // (Omitimos la contraseña en la respuesta)
    const { password: _, ...userWithoutPassword } = user;
    
    return res.json({
      user: userWithoutPassword,
      token
    });

  } catch (error: any) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error en el servidor durante el login' });
  }
};

export const register = async (req: Request, res: Response) => {
  const { email, password, nombre, apellido, cedula, rol } = req.body;

  try {
    // 1. Verificar si ya existe
    const checkSql = 'SELECT id FROM profiles WHERE email = $1 OR cedula = $2';
    const existing = await query(checkSql, [email, cedula]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Esta cédula o email ya está registrado' });
    }

    // 2. Hashear password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insertar
    const insertSql = `
      INSERT INTO profiles (email, password, nombre, apellido, cedula, rol)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, nombre, rol
    `;
    const { rows } = await query(insertSql, [email, hashedPassword, nombre, apellido, cedula, rol || 'INSPECTOR']);

    // 4. Generar token para inicio automático
    const user = rows[0];
    const token = jwt.sign({ id: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({
      user,
      token,
      message: 'Registro exitoso'
    });

  } catch (error: any) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

export const getAdmins = async (req: Request, res: Response) => {
  try {
    const { rows } = await query(
      "SELECT id, nombre, apellido, rol FROM profiles WHERE rol IN ('ADMIN', 'JEFE') ORDER BY rol ASC",
      []
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener administradores' });
  }
};

