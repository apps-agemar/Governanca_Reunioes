import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth } from '../auth';

// Router for POST /api/reunioes/:meetingId/anexos
export const anexoCreateRouter = Router({ mergeParams: true });
anexoCreateRouter.use(requireAuth);

anexoCreateRouter.post('/', async (req: Request, res: Response) => {
  const { meetingId } = req.params;
  const { fileName, fileUrl, fileType, uploadedBy } = req.body;

  if (!fileName || !fileUrl || !fileType || !uploadedBy) {
    res.status(400).json({ error: 'Dados do anexo incompletos.' });
    return;
  }

  const id = `att_${Date.now()}`;
  await pool.query(
    `INSERT INTO anexos (id, meeting_id, file_name, file_url, file_type, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, meetingId, fileName, fileUrl, fileType, uploadedBy]
  );

  const [rows] = await pool.query('SELECT * FROM anexos WHERE id = ?', [id]) as any;
  const a = rows[0];
  res.status(201).json({
    id: a.id, meetingId: a.meeting_id, fileName: a.file_name,
    fileUrl: a.file_url, fileType: a.file_type,
    uploadedBy: a.uploaded_by, uploadedAt: a.uploaded_at,
  });
});

// Router for DELETE /api/anexos/:id
export const anexoDeleteRouter = Router();
anexoDeleteRouter.use(requireAuth);

anexoDeleteRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await pool.query('DELETE FROM anexos WHERE id = ?', [id]);
  res.status(204).send();
});
