/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from '../types';

/**
 * PRODUCTION INTEGRATION GUIDE FOR LDAPS (LDAP over SSL)
 * 
 * To connect this frontend auth flow to a real enterprise LDAPS server:
 * 
 * 1. BACKEND ROUTE (Express / Node.js):
 *    Create an endpoint on your secure server, e.g., POST `/api/auth/login`.
 *    Avoid running LDAP client-side to protect service account credentials and bypass CORS restrictions.
 *    
 * 2. COMPONENT DEPS:
 *    Install the `ldapjs` or `activedirectory2` library in your backend:
 *    `npm install ldapjs @types/ldapjs`
 * 
 * 3. SAMPLE SERVER-SIDE IMPLEMENTATION:
 *    ```javascript
 *    import ldap from 'ldapjs';
 *    
 *    function authenticateLDAP(username, password) {
 *      return new Promise((resolve, reject) => {
 *        // Secure LDAPS URL (port 636)
 *        const client = ldap.createClient({
 *          url: 'ldaps://ldap.agemar.com.br:636',
 *          tlsOptions: { rejectUnauthorized: true } // Ensure certs are validated
 *        });
 * 
 *        const userPrincipalName = `${username}@agemar.com.br`;
 * 
 *        client.bind(userPrincipalName, password, (err) => {
 *          if (err) {
 *            client.destroy();
 *            return reject(new Error('Invalid credentials or bad connection: ' + err.message));
 *          }
 *          
 *          // If bind succeeds, search for user's details and groups
 *          const opts = {
 *            filter: `(userPrincipalName=${userPrincipalName})`,
 *            scope: 'sub',
 *            attributes: ['dn', 'cn', 'mail', 'memberOf']
 *          };
 * 
 *          client.search('dc=agemar,dc=com,dc=br', opts, (searchErr, res) => {
 *            if (searchErr) {
 *              client.destroy();
 *              return reject(searchErr);
 *            }
 * 
 *            let userData = null;
 * 
 *            res.on('searchEntry', (entry) => {
 *              userData = entry.object;
 *            });
 * 
 *            res.on('error', (err) => {
 *              client.destroy();
 *              reject(err);
 *            });
 * 
 *            res.on('end', (result) => {
 *              client.destroy();
 *              if (userData) {
 *                resolve(userData);
 *              } else {
 *                reject(new Error('User found but details could not be retrieved.'));
 *              }
 *            });
 *          });
 *        });
 *      });
 *    }
 *    ```
 * 
 * 4. MAPPING USER ROLES:
 *    Inside the Active Directory/LDAP groups, check `memberOf`:
 *    - If group contains 'CN=GG_GovReunioes_Admin', assign Administrador
 *    - If group contains 'CN=GG_GovReunioes_Editor', assign Editor
 *    - Default to Visualizador
 */

// Simulated database of corporate users mapped through AD / LDAP
const MOCK_AD_USERS = [
  {
    username: 'admin.agemar',
    password: 'password123',
    user: {
      id: 'usr_1',
      networkLogin: 'admin.agemar',
      name: 'Jorge Cabral (Administrador)',
      email: 'jorge.cabral@agemar.com.br',
      role: 'Administrador' as const
    }
  },
  {
    username: 'aplicativos.agemar',
    password: 'password123',
    user: {
      id: 'usr_app_agemar',
      networkLogin: 'aplicativos.agemar',
      name: 'Equipe de Aplicativos Agemar',
      email: 'aplicativos@agemar.com.br',
      role: 'Administrador' as const
    }
  },
  {
    username: 'editor.agemar',
    password: 'password123',
    user: {
      id: 'usr_2',
      networkLogin: 'editor.agemar',
      name: 'Renata Lins (Diretora/Editor)',
      email: 'renata.lins@agemar.com.br',
      role: 'Editor' as const
    }
  },
  {
    username: 'visitante.agemar',
    password: 'password123',
    user: {
      id: 'usr_3',
      networkLogin: 'visitante.agemar',
      name: 'Claudio Melo (Visualizador)',
      email: 'claudio.melo@agemar.com.br',
      role: 'Visualizador' as const
    }
  }
];

export async function authenticateWithLDAPS(networkLogin: string, password: string): Promise<User> {
  // Simulate network latency (between 400ms and 800ms) over secure tunnel
  await new Promise((resolve) => setTimeout(resolve, 550));

  if (!networkLogin || !password) {
    throw new Error('Usuário de rede e senha são obrigatórios.');
  }

  // Look up credentials in simulated LDAP service registry
  const match = MOCK_AD_USERS.find(
    (u) => u.username.toLowerCase() === networkLogin.toLowerCase() && u.password === password
  );

  if (match) {
    return match.user;
  }

  // Simulate LDAPS bind failure
  throw new Error('LDAPS authentication failed. Usuário ou senha inválidos para o domínio AGEMAR.');
}
