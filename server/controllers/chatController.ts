import { Request, Response } from 'express';
import { query } from '../db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await query('SELECT * FROM chats ORDER BY created_at ASC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { message, receiver_id } = req.body;
    const sender_id = req.user?.id;

    const { rows } = await query(
      'INSERT INTO chats (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING *',
      [sender_id, receiver_id, message]
    );
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
