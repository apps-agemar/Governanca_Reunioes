/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LdapConfig } from '../types';
import { getLdapConfig, saveLdapConfig, testLdapConnection } from '../services/api';
import {
  Server, Key, ShieldCheck, Info, CheckCircle2, AlertTriangle,
  Save, RefreshCw, Lock, Loader2,
} from 'lucide-react';

const DEFAULT_CONFIG: LdapConfig = {
  host: 'ldaps://ldap.agemar.com.br',
  port: 636,
  ssl: true,
  baseDn: 'dc=agemar,dc=com,dc=br',
  bindDn: 'cn=admin,dc=agemar,dc=com,dc=br',
  bindPassword: '',
  userFilter: '(sAMAccountName={{username}})',
};

interface SettingsLDAPProps {
  userRole?: string;
}

export default function SettingsLDAP({ userRole }: SettingsLDAPProps) {
  const [config, setConfig] = useState<LdapConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    getLdapConfig()
      .then(cfg => setConfig({ ...cfg, bindPassword: '' }))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveLdapConfig(config);
      setNotification('Configurações LDAP salvas com sucesso!');
    } catch (err: any) {
      setNotification(`Erro ao salvar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('Deseja redefinir as configurações para os padrões do Grupo Agemar?')) {
      setConfig(DEFAULT_CONFIG);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Iniciando handshake TLS/SSL...');
    try {
      const result = await testLdapConnection();
      setTestStatus(result.success ? 'success' : 'error');
      setTestMessage(result.message);
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        <span className="text-sm">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn" id="ldaps-settings-panel">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700 shrink-0">
            <Server className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold uppercase px-2 py-0.5 rounded">
              Active Directory integrada
            </span>
            <h1 className="text-xl font-bold text-slate-850 mt-1">Configurações de Credenciais LDAPS</h1>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Configure os parâmetros de conexão do Active Directory (LDAP over SSL — porta 636) para autenticação corporativa do Grupo Agemar.
            </p>
          </div>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs p-4 rounded-r-lg font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#007A38]" /> Campos de Conexão Segura
            </h2>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Host de Conexão LDAPS
                </label>
                <input
                  type="text" required value={config.host}
                  onChange={e => setConfig({ ...config, host: e.target.value })}
                  placeholder="ex: ldaps://ldap.agemar.com.br"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Porta do Servidor
                </label>
                <input
                  type="number" required value={config.port}
                  onChange={e => setConfig({ ...config, port: parseInt(e.target.value) || 636 })}
                  placeholder="ex: 636"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  DN Base de Usuários (Base DN)
                </label>
                <input
                  type="text" required value={config.baseDn}
                  onChange={e => setConfig({ ...config, baseDn: e.target.value })}
                  placeholder="ex: dc=agemar,dc=com,dc=br"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Filtro de Login AD
                </label>
                <input
                  type="text" required value={config.userFilter}
                  onChange={e => setConfig({ ...config, userFilter: e.target.value })}
                  placeholder="ex: (sAMAccountName={{username}})"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Usuário de Bind (Bind DN Administrador)
                </label>
                <input
                  type="text" required value={config.bindDn || ''}
                  onChange={e => setConfig({ ...config, bindDn: e.target.value })}
                  placeholder="ex: cn=admin,dc=agemar,dc=com,dc=br"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38]"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Senha do Usuário Bind
                  </label>
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-emerald-700 hover:underline font-bold">
                    {showPassword ? 'Ocultar' : 'Exibir'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={config.bindPassword || ''}
                  onChange={e => setConfig({ ...config, bindPassword: e.target.value })}
                  placeholder="Digite a nova senha para alterar"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38]"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between pt-6 border-t border-slate-150 gap-3">
              <button type="button" onClick={handleRestoreDefaults}
                className="px-4 py-2 text-xs font-extrabold text-red-650 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer">
                Padrões Agemar
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="px-4 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                  Testar Handshake
                </button>
                <button type="submit" disabled={isSaving}
                  className="px-5 py-2 text-xs font-extrabold text-emerald-950 bg-amber-400 hover:bg-amber-500 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Parâmetros
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
              Status do Handshake LDAP
            </h3>
            {testStatus === 'idle' && (
              <div className="text-center py-6 text-slate-400 text-xs">
                <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p>Nenhum teste executado recentemente.</p>
              </div>
            )}
            {testStatus === 'testing' && (
              <div className="flex items-center gap-3 text-xs text-slate-700 py-2">
                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                <span className="font-semibold">Testando servidores de rede...</span>
              </div>
            )}
            {testStatus === 'success' && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Conexão bem-sucedida!</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{testMessage}</p>
              </div>
            )}
            {testStatus === 'error' && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-red-700 bg-red-50 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Erro de Conexão</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{testMessage}</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-[#004A20] to-emerald-950 text-emerald-50 rounded-2xl p-5 shadow-md">
            <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-widest border-b border-emerald-800 pb-2 mb-3">
              Guia de Logon Corporativo
            </h3>
            <ul className="space-y-3.5 text-xs text-emerald-100 leading-relaxed">
              <li className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>O Active Directory corporativo funciona como a fonte de identidades do domínio <strong>@agemar</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Os papéis (Administrador, Editor, Visualizador) são definidos pelo cadastro do usuário no banco de dados.</span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Deixe a senha em branco ao salvar para manter a senha atual sem alteração.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
