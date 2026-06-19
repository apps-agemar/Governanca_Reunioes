import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth, requireAdmin } from '../auth';

const router = Router();

// GET /api/configuracao-ldap  (admin only — returns password masked)
router.get('/', requireAdmin, async (_req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT * FROM configuracao_ldaps ORDER BY id LIMIT 1') as any;
  if (!rows[0]) { res.status(404).json({ error: 'Configuração não encontrada.' }); return; }
  const r = rows[0];
  res.json({
    id: r.id,
    host: r.host,
    port: r.port,
    ssl: !!r['ssl'],
    baseDn: r.base_dn,
    bindDn: r.bind_dn,
    bindPassword: '••••••••',  // never return the real password
    userFilter: r.user_filter,
    updatedAt: r.updated_at,
  });
});

// PUT /api/configuracao-ldap  (admin only)
router.put('/', requireAdmin, async (req: Request, res: Response) => {
  const { host, port, ssl, baseDn, bindDn, bindPassword, userFilter } = req.body;

  const [rows] = await pool.query('SELECT id FROM configuracao_ldaps ORDER BY id LIMIT 1') as any;

  if (rows[0]) {
    // Only update password if a real value was sent (not the masked placeholder)
    const passwordClause = bindPassword && bindPassword !== '••••••••'
      ? ', bind_password = ?'
      : '';
    const params: any[] = [host, port, ssl ? 1 : 0, baseDn, bindDn, userFilter];
    if (passwordClause) params.push(bindPassword);
    params.push(rows[0].id);

    await pool.query(
      `UPDATE configuracao_ldaps SET host=?, port=?, ssl=?, base_dn=?, bind_dn=?, user_filter=?${passwordClause} WHERE id=?`,
      params
    );
  } else {
    await pool.query(
      `INSERT INTO configuracao_ldaps (host, port, ssl, base_dn, bind_dn, bind_password, user_filter)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [host, port, ssl ? 1 : 0, baseDn, bindDn, bindPassword || '', userFilter]
    );
  }

  res.json({ ok: true });
});

// POST /api/configuracao-ldap/testar  (admin only — tests the LDAP connection)
router.post('/testar', requireAdmin, async (_req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT * FROM configuracao_ldaps ORDER BY id LIMIT 1') as any;
  if (!rows[0]) {
    res.json({ success: false, message: 'Nenhuma configuração LDAP cadastrada.' });
    return;
  }
  const cfg = rows[0];

  try {
    const ldap = await import('ldapjs');
    await new Promise<void>((resolve, reject) => {
      const client = ldap.default.createClient({
        url: `${cfg.host}:${cfg.port}`,
        tlsOptions: { rejectUnauthorized: false },
        timeout: 5000,
        connectTimeout: 5000,
      });
      client.on('error', (err: Error) => { client.destroy(); reject(err); });
      client.bind(cfg.bind_dn, cfg.bind_password, (err) => {
        client.destroy();
        if (err) reject(err); else resolve();
      });
    });
    res.json({ success: true, message: `Conexão e BIND com ${cfg.host} realizados com sucesso.` });
  } catch (err: any) {
    res.json({ success: false, message: `Falha: ${err.message}` });
  }
});

export default router;
