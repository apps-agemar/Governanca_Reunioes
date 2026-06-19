import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth } from '../auth';

const router = Router();
router.use(requireAuth);

function mapRow(r: any, attachments: any[] = []) {
  return {
    id: r.id,
    meetingType: r.meeting_type,
    responsibleDirector: r.responsible_director,
    businessUnitId: r.business_unit_id,
    businessUnitName: r.bu_name || '',
    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : r.date,
    time: r.time,
    location: r.location,
    participants: r.participants,
    evidenceLink: r.evidence_link || undefined,
    observationsDecisions: r.observations_decisions || '',
    status: r.status,
    source: r.source,
    plannedMeetingId: r.planned_meeting_id || undefined,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    completedAt: r.completed_at || undefined,
    attachments,
  };
}

function mapAttachment(a: any) {
  return {
    id: a.id,
    meetingId: a.meeting_id,
    fileName: a.file_name,
    fileUrl: a.file_url,
    fileType: a.file_type,
    uploadedBy: a.uploaded_by,
    uploadedAt: a.uploaded_at,
  };
}

// GET /api/reunioes
router.get('/', async (_req: Request, res: Response) => {
  const [rows] = await pool.query(
    `SELECT r.*, u.name AS bu_name
     FROM reunioes r
     LEFT JOIN unidades_negocio u ON u.id = r.business_unit_id
     ORDER BY r.date DESC`
  ) as any;

  const [attachRows] = await pool.query('SELECT * FROM anexos') as any;

  const meetings = rows.map((r: any) => {
    const atts = attachRows.filter((a: any) => a.meeting_id === r.id).map(mapAttachment);
    return mapRow(r, atts);
  });

  res.json(meetings);
});

// GET /api/reunioes/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    `SELECT r.*, u.name AS bu_name
     FROM reunioes r
     LEFT JOIN unidades_negocio u ON u.id = r.business_unit_id
     WHERE r.id = ?`, [id]
  ) as any;

  if (!rows[0]) { res.status(404).json({ error: 'Reunião não encontrada.' }); return; }

  const [attRows] = await pool.query('SELECT * FROM anexos WHERE meeting_id = ?', [id]) as any;
  res.json(mapRow(rows[0], attRows.map(mapAttachment)));
});

// POST /api/reunioes
router.post('/', async (req: Request, res: Response) => {
  const {
    meetingType, responsibleDirector, businessUnitId, date, time, location,
    participants, evidenceLink, observationsDecisions, status, source,
    plannedMeetingId, createdBy,
  } = req.body;

  const id = `meet_${Date.now()}`;
  const completedAt = status === 'REALIZADA' ? new Date() : null;

  await pool.query(
    `INSERT INTO reunioes
      (id, meeting_type, responsible_director, business_unit_id, date, time, location,
       participants, evidence_link, observations_decisions, status, source,
       planned_meeting_id, created_by, completed_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, meetingType, responsibleDirector, businessUnitId, date, time, location,
     participants, evidenceLink || null, observationsDecisions || '', status, source,
     plannedMeetingId || null, createdBy, completedAt]
  );

  const [rows] = await pool.query(
    `SELECT r.*, u.name AS bu_name FROM reunioes r
     LEFT JOIN unidades_negocio u ON u.id = r.business_unit_id WHERE r.id = ?`, [id]
  ) as any;

  res.status(201).json(mapRow(rows[0], []));
});

// PUT /api/reunioes/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    meetingType, responsibleDirector, businessUnitId, date, time, location,
    participants, evidenceLink, observationsDecisions, status, source,
    plannedMeetingId,
  } = req.body;

  // Only set completedAt if transitioning to REALIZADA and not already set
  const [existing] = await pool.query('SELECT completed_at FROM reunioes WHERE id = ?', [id]) as any;
  const prevCompleted = existing[0]?.completed_at;
  const completedAt = status === 'REALIZADA' ? (prevCompleted || new Date()) : prevCompleted || null;

  await pool.query(
    `UPDATE reunioes SET
       meeting_type=?, responsible_director=?, business_unit_id=?, date=?, time=?, location=?,
       participants=?, evidence_link=?, observations_decisions=?, status=?, source=?,
       planned_meeting_id=?, completed_at=?
     WHERE id=?`,
    [meetingType, responsibleDirector, businessUnitId, date, time, location,
     participants, evidenceLink || null, observationsDecisions || '', status, source,
     plannedMeetingId || null, completedAt, id]
  );

  const [rows] = await pool.query(
    `SELECT r.*, u.name AS bu_name FROM reunioes r
     LEFT JOIN unidades_negocio u ON u.id = r.business_unit_id WHERE r.id = ?`, [id]
  ) as any;

  if (!rows[0]) { res.status(404).json({ error: 'Reunião não encontrada.' }); return; }

  const [attRows] = await pool.query('SELECT * FROM anexos WHERE meeting_id = ?', [id]) as any;
  res.json(mapRow(rows[0], attRows.map(mapAttachment)));
});

// DELETE /api/reunioes/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await pool.query('DELETE FROM reunioes WHERE id = ?', [id]);
  res.status(204).send();
});

export default router;
