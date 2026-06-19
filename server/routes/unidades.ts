import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth } from '../auth';

const router = Router();
router.use(requireAuth);

// GET /api/unidades-negocio
router.get('/', async (_req: Request, res: Response) => {
  const [rows] = await pool.query(
    'SELECT * FROM unidades_negocio ORDER BY name ASC'
  ) as any;

  const mapped = rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    responsibleDirector: r.responsible_director,
    status: r.status,
    observations: r.observations || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  res.json(mapped);
});

// POST /api/unidades-negocio
router.post('/', async (req: Request, res: Response) => {
  const { name, code, responsibleDirector, status, observations } = req.body;
  if (!name || !responsibleDirector) {
    res.status(400).json({ error: 'Nome e diretor responsável são obrigatórios.' });
    return;
  }

  const id = `bu_${Date.now()}`;
  await pool.query(
    `INSERT INTO unidades_negocio (id, name, code, responsible_director, status, observations)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, name, code || '', responsibleDirector, status || 'Ativa', observations || '']
  );

  const [rows] = await pool.query('SELECT * FROM unidades_negocio WHERE id = ?', [id]) as any;
  const r = rows[0];
  res.status(201).json({
    id: r.id, name: r.name, code: r.code,
    responsibleDirector: r.responsible_director, status: r.status,
    observations: r.observations || '', createdAt: r.created_at, updatedAt: r.updated_at,
  });
});

// PUT /api/unidades-negocio/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { name, code, responsibleDirector, status, observations } = req.body;
  const { id } = req.params;

  await pool.query(
    `UPDATE unidades_negocio SET name=?, code=?, responsible_director=?, status=?, observations=?
     WHERE id=?`,
    [name, code || '', responsibleDirector, status, observations || '', id]
  );

  const [rows] = await pool.query('SELECT * FROM unidades_negocio WHERE id = ?', [id]) as any;
  if (!rows[0]) { res.status(404).json({ error: 'BU não encontrada.' }); return; }
  const r = rows[0];
  res.json({
    id: r.id, name: r.name, code: r.code,
    responsibleDirector: r.responsible_director, status: r.status,
    observations: r.observations || '', createdAt: r.created_at, updatedAt: r.updated_at,
  });
});

// DELETE /api/unidades-negocio/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const [linked] = await pool.query(
    'SELECT COUNT(*) as cnt FROM reunioes WHERE business_unit_id = ?', [id]
  ) as any;

  if (linked[0].cnt > 0) {
    res.status(409).json({ error: 'Existem reuniões vinculadas a esta BU. Inative-a em vez de excluir.' });
    return;
  }

  await pool.query('DELETE FROM unidades_negocio WHERE id = ?', [id]);
  res.status(204).send();
});

export default router;
