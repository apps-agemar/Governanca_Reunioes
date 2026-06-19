import { Router, Request, Response } from 'express';
import ldap from 'ldapjs';
import { pool } from '../db';
import { signToken, requireAuth, JwtPayload } from '../auth';

const router = Router();

async function getLdapConfig() {
  const [rows] = await pool.query('SELECT * FROM configuracao_ldaps ORDER BY id LIMIT 1') as any;
  return rows[0] || null;
}

async function authenticateLdap(username: string, password: string): Promise<boolean> {
  const config = await getLdapConfig();
  if (!config) throw new Error('Configuração LDAP não encontrada no banco de dados.');

  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: `${config.host}:${config.port}`,
      tlsOptions: { rejectUnauthorized: false },
      timeout: 5000,
      connectTimeout: 5000,
    });

    client.on('error', (err: Error) => {
      client.destroy();
      reject(new Error(`Erro de conexão LDAP: ${err.message}`));
    });

    const userFilter = config.user_filter.replace('{{username}}', username);
    // Try bind as the user directly (UPN format for Active Directory)
    const userDn = `${username}@${config.base_dn.replace(/dc=/g, '').replace(/,/g, '.')}`;

    client.bind(userDn, password, (err) => {
      client.destroy();
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { networkLogin, password } = req.body;

  if (!networkLogin || !password) {
    res.status(400).json({ error: 'Usuário de rede e senha são obrigatórios.' });
    return;
  }

  // Check if user exists in database
  let dbUser: any;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE network_login = ?', [networkLogin]
    ) as any;
    dbUser = rows[0];
  } catch (dbErr: any) {
    console.error('[DB] Erro ao conectar ao banco de dados:', dbErr.message);
    res.status(503).json({
      error: `Banco de dados indisponível. Verifique se o MariaDB está rodando e as credenciais no arquivo .env estão corretas. (${dbErr.message})`,
    });
    return;
  }

  if (!dbUser) {
    res.status(401).json({ error: 'Usuário não encontrado ou sem permissão de acesso ao sistema.' });
    return;
  }

  // Se LDAP_STRICT=false, pula validação LDAP (modo desenvolvimento/contingência)
  if (process.env.LDAP_STRICT === 'true') {
    let ldapOk = false;
    try {
      ldapOk = await authenticateLdap(networkLogin, password);
    } catch (ldapErr: any) {
      console.warn('[LDAP] Falha na conexão:', ldapErr.message);
    }
    if (!ldapOk) {
      res.status(401).json({ error: 'Credenciais inválidas no domínio AGEMAR.' });
      return;
    }
  } else {
    console.info(`[Auth] LDAP_STRICT=false — acesso liberado via banco para: ${networkLogin}`);
  }

  const payload: JwtPayload = {
    id: dbUser.id,
    networkLogin: dbUser.network_login,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
  };

  const token = signToken(payload);
  res.json({ token, user: payload });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json((req as any).user);
});

export default router;
