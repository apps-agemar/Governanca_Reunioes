/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import AgemarLogo from './AgemarLogo';
import { authenticateWithLDAPS } from '../services/ldapService';
import { User } from '../types';
import { KeyRound, User as UserIcon, ShieldAlert, Loader2 } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [networkLogin, setNetworkLogin] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize LDAPS configuration internally on load if not already set
  useEffect(() => {
    const saved = localStorage.getItem('agemar_ldaps_config');
    if (!saved) {
      localStorage.setItem('agemar_ldaps_config', JSON.stringify({
        host: 'ldaps://ldap.agemar.com.br',
        port: 636,
        ssl: true,
        baseDn: 'dc=agemar,dc=com,dc=br',
        bindDn: 'cn=admin,dc=agemar,dc=com,dc=br',
        bindPassword: 'password123',
        userFilter: '(sAMAccountName={{username}})'
      }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const authenticatedUser = await authenticateWithLDAPS(networkLogin, password);
      onLoginSuccess(authenticatedUser);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado na autenticação LDAPS.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden" id="login-container">
      {/* Background decoration representing infrastructure coordinates */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 z-10 duration-300 relative transition-all"
        id="login-card"
      >
        {/* Banner header accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#007A38] via-amber-400 to-[#007A38] rounded-t-2xl" />

        {/* Brand visual showcase */}
        <div className="flex flex-col items-center mb-8">
          <AgemarLogo size="md" showCelebration={true} className="mb-2" />
          <h2 className="text-xl font-bold text-slate-800 mt-4 tracking-tight">
            Governança de Reuniões
          </h2>
          <p className="text-sm text-slate-500 text-center mt-1">
            Plataforma Corporativa Integrada • Autenticação de Domínio
          </p>
        </div>



        {errorMsg && (
          <div 
            className="mb-5 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3 text-sm text-red-800 animate-fadeIn"
            id="login-error-banner"
          >
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Falha no LDAPS BIND</span>
              <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
              Usuário de Rede (Domain SAM)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-5 h-5" />
              </span>
              <input
                id="login-username-input"
                type="text"
                required
                value={networkLogin}
                onChange={(e) => setNetworkLogin(e.target.value)}
                placeholder="Ex: jorge.cabral"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
              Senha de Rede
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-5 h-5" />
              </span>
              <input
                id="login-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex justify-end text-xs text-slate-500">
            <span className="hover:underline cursor-help">Ajuda de acesso?</span>
          </div>

          <button
            id="login-submit-button"
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#007A38] hover:bg-emerald-800 text-white font-semibold rounded-lg text-sm transition-colors shadow-md shadow-[#007A38]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validando com Active Directory...
              </>
            ) : (
              'Autenticar no Domínio'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-150 text-center text-[11px] text-slate-400 leading-relaxed">
          Grupo Agemar • © 2026. Todos os direitos reservados. <br />
          Sistematização de Atas, Decisões e Governança Corporativa.
        </div>
      </div>
    </div>
  );
}
