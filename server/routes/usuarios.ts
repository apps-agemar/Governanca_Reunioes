import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAdmin } from '../auth';

const router = Router();
router.use(requireAdmin);

function mapUser(r: any) {
  return {
    id: r.id,
    networkLogin: r.network_login,
    name: r.name,
    email: r.email,
    role: r.role,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// GET /api/usuarios
router.get('/', async (_req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT * FROM usuarios ORDER BY name ASC') as any;
  res.json(rows.map(mapUser));
});

// POST /api/usuarios
router.post('/', async (req: Request, res: Response) => {
  const { networkLogin, name, email, role } = req.body;
  if (!networkLogin || !name || !email || !role) {
    res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    return;
  }

  const id = `usr_${Date.now()}`;
  await pool.query(
    'INSERT INTO usuarios (id, network_login, name, email, role) VALUES (?,?,?,?,?)',
    [id, networkLogin, name, email, role]
  );

  const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]) as any;
  res.status(201).json(mapUser(rows[0]));
});

// PUT /api/usuarios/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { networkLogin, name, email, role } = req.body;

  await pool.query(
    'UPDATE usuarios SET network_login=?, name=?, email=?, role=? WHERE id=?',
    [networkLogin, name, email, role, id]
  );

  const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]) as any;
  if (!rows[0]) { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }
  res.json(mapUser(rows[0]));
});

// DELETE /api/usuarios/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
  res.status(204).send();
});

export default router;
