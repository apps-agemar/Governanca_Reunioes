/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User, BusinessUnit, Meeting } from './types';
import Login from './components/Login';
import AgemarLogo from './components/AgemarLogo';
import Dashboard from './components/Dashboard';
import BusinessUnitManager from './components/BusinessUnitManager';
import MeetingPlanner from './components/MeetingPlanner';
import MeetingRegister from './components/MeetingRegister';
import SettingsLDAP from './components/SettingsLDAP';
import * as api from './services/api';
import {
  Building2,
  Calendar,
  LayoutDashboard,
  FolderOpen,
  LogOut,
  Menu,
  X,
  Clock,
  Network,
  Loader2,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('agemar_session');
    return saved ? JSON.parse(saved) : null;
  });

  const hasAdminAccess = !!(currentUser && (
    currentUser.role === 'Administrador' ||
    currentUser.networkLogin === 'aplicativos.agemar' ||
    currentUser.email === 'aplicativos@agemar.com.br'
  ));

  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meetings' | 'planning' | 'bu' | 'ldaps'>('dashboard');
  const [activeEditingMeeting, setActiveEditingMeeting] = useState<Meeting | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load data from API whenever user logs in
  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingData(true);
    try {
      const [bus, meets] = await Promise.all([api.getUnidades(), api.getReunioes()]);
      setBusinessUnits(bus);
      setMeetings(meets);
    } catch (err) {
      console.error('[App] Erro ao carregar dados:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser]);

  useEffect(() => { loadData(); }, [loadData]);

  // Keep unauthorized users away from restricted tabs
  useEffect(() => {
    if ((activeTab === 'ldaps' || activeTab === 'bu') && currentUser && !hasAdminAccess) {
      setActiveTab('dashboard');
    }
  }, [activeTab, currentUser, hasAdminAccess]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('agemar_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('agemar_session');
    sessionStorage.removeItem('agemar_token');
    setBusinessUnits([]);
    setMeetings([]);
    setActiveTab('dashboard');
  };

  // BU CRUD
  const handleAddBU = async (buData: Omit<BusinessUnit, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBU = await api.createUnidade(buData);
    setBusinessUnits(prev => [...prev, newBU]);
  };

  const handleUpdateBU = async (id: string, buData: Partial<BusinessUnit>) => {
    const updated = await api.updateUnidade(id, buData);
    setBusinessUnits(prev => prev.map(bu => bu.id === id ? updated : bu));
    if (buData.name) {
      setMeetings(prev => prev.map(m =>
        m.businessUnitId === id ? { ...m, businessUnitName: buData.name! } : m
      ));
    }
  };

  const handleDeleteBU = async (id: string): Promise<boolean> => {
    try {
      await api.deleteUnidade(id);
      setBusinessUnits(prev => prev.filter(bu => bu.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  // Meetings CRUD
  const handleAddMeeting = async (meetData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { attachments, ...rest } = meetData as any;
    const newMeeting = await api.createReuniao(rest);
    // Upload attachments if any
    if (attachments?.length) {
      const uploadedAtts = await Promise.all(
        attachments.map((att: any) =>
          api.createAnexo(newMeeting.id, {
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileType: att.fileType,
            uploadedBy: att.uploadedBy,
          })
        )
      );
      newMeeting.attachments = uploadedAtts;
    } else {
      newMeeting.attachments = [];
    }
    setMeetings(prev => [...prev, newMeeting]);
  };

  const handleUpdateMeeting = async (id: string, meetData: Partial<Meeting>) => {
    const { attachments, ...rest } = meetData as any;
    const updated = await api.updateReuniao(id, rest);

    // Handle new attachments (those without an uploadedAt are new)
    if (attachments) {
      const existing = meetings.find(m => m.id === id)?.attachments || [];
      const newAtts = attachments.filter((a: any) => !existing.find((e: any) => e.id === a.id));
      const uploadedNew = await Promise.all(
        newAtts.map((att: any) =>
          api.createAnexo(id, {
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileType: att.fileType,
            uploadedBy: att.uploadedBy,
          })
        )
      );
      updated.attachments = [...existing.filter((e: any) => attachments.find((a: any) => a.id === e.id)), ...uploadedNew];
    }

    setMeetings(prev => prev.map(m => m.id === id ? updated : m));
  };

  const handleDeleteMeeting = async (id: string) => {
    await api.deleteReuniao(id);
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  const handleRealizeFromPlanner = (plannedMeeting: Meeting) => {
    setActiveEditingMeeting(plannedMeeting);
    setActiveTab('meetings');
  };

  const handleNavigateShortcut = (tab: 'dashboard' | 'meetings' | 'planning' | 'bu' | 'ldaps') => {
    setActiveTab(tab);
  };

  const handleEditMeetingShortcut = (meeting: Meeting) => {
    setActiveEditingMeeting(meeting);
    setActiveTab('meetings');
  };

  const formatCorporateToday = () => {
    const opt: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('pt-BR', opt);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin text-[#007A38]" />
          <span className="text-sm font-semibold">Carregando dados do servidor...</span>
        </div>
      </div>
    );
  }

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            meetings={meetings}
            businessUnits={businessUnits}
            onNavigate={handleNavigateShortcut}
            onEditMeeting={handleEditMeetingShortcut}
          />
        );
      case 'bu':
        return hasAdminAccess ? (
          <BusinessUnitManager
            businessUnits={businessUnits}
            onAddBU={handleAddBU}
            onUpdateBU={handleUpdateBU}
            onDeleteBU={handleDeleteBU}
            userRole={currentUser.role}
          />
        ) : (
          <div className="p-8 font-bold text-red-650 bg-red-50 rounded-xl border border-red-200">
            Acesso Restrito: Apenas administradores podem gerenciar unidades de negócio.
          </div>
        );
      case 'planning':
        return (
          <MeetingPlanner
            meetings={meetings}
            businessUnits={businessUnits}
            onAddPlannedMeeting={handleAddMeeting}
            onUpdatePlannedMeeting={handleUpdateMeeting}
            onDeletePlannedMeeting={handleDeleteMeeting}
            onRealizeMeeting={handleRealizeFromPlanner}
            userRole={currentUser.role}
          />
        );
      case 'meetings':
        return (
          <MeetingRegister
            meetings={meetings}
            businessUnits={businessUnits}
            onAddMeeting={handleAddMeeting}
            onUpdateMeeting={handleUpdateMeeting}
            onDeleteMeeting={handleDeleteMeeting}
            activeEditingMeeting={activeEditingMeeting}
            onClearActiveEditing={() => setActiveEditingMeeting(null)}
            currentUser={currentUser}
            userRole={currentUser.role}
          />
        );
      case 'ldaps':
        return hasAdminAccess ? (
          <SettingsLDAP userRole={currentUser.role} />
        ) : (
          <div className="p-8 font-bold text-red-650 bg-red-50 rounded-xl border border-red-200">
            Acesso Restrito: Apenas administradores podem acessar as configurações LDAPS.
          </div>
        );
      default:
        return <div className="p-8">Visualização indisponível.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800" id="agemar-app-root">
      {/* SIDEBAR - DESKTOP */}
      <aside className="w-72 bg-gradient-to-b from-[#00602B] to-[#004A20] text-white flex-col justify-between hidden md:flex shrink-0 border-r border-[#003816] shadow-lg sticky top-0 h-screen">
        <div className="flex flex-col">
          <div className="bg-emerald-950/25 p-6 border-b border-[#007A38]/30 flex flex-col items-center">
            <AgemarLogo size="sm" showCelebration={true} className="text-white fill-white" internal={true} />
          </div>

          <nav className="p-4 space-y-2 mt-4">
            {[
              { key: 'dashboard', label: 'Painel Executivo', icon: <LayoutDashboard className="w-5 h-5 shrink-0" />, adminOnly: false },
              { key: 'bu', label: 'Unidades de Negócio', icon: <Building2 className="w-5 h-5 shrink-0" />, adminOnly: true },
              { key: 'planning', label: 'Planejamento (Planner)', icon: <Calendar className="w-5 h-5 shrink-0" />, adminOnly: false },
              { key: 'meetings', label: 'Registro de Atas', icon: <FolderOpen className="w-5 h-5 shrink-0" />, adminOnly: false },
              { key: 'ldaps', label: 'Configuração LDAPS', icon: <Network className="w-5 h-5 shrink-0" />, adminOnly: true },
            ].filter(item => !item.adminOnly || hasAdminAccess).map(item => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === item.key
                    ? 'bg-amber-400 text-emerald-950 shadow-md shadow-amber-400/10'
                    : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-[#005a28] bg-emerald-950/20 text-xs">
          <div className="flex items-center gap-3 mb-3 p-2 bg-[#005a28]/40 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-amber-450/20 border border-amber-400 flex items-center justify-center text-amber-400 font-extrabold shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-slate-100 truncate block text-[11px]" title={currentUser.name}>
                {currentUser.name}
              </span>
              <span className="text-[10px] text-emerald-350 block font-mono font-bold">
                {currentUser.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-650/80 hover:bg-red-700 hover:text-white text-[11px] font-extrabold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Desconectar
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-[#00602B] text-white p-4 flex items-center justify-between shadow-md relative z-30">
        <div className="flex items-center gap-1.5">
          <AgemarLogo size="sm" showCelebration={false} className="text-white fill-white scale-90" internal={true} />
          <h2 className="text-sm font-black tracking-tight leading-none text-amber-400 ml-1">Governança</h2>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-emerald-950/40 rounded border border-[#007A38] text-white shrink-0 cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-emerald-950/95 pt-20 px-6 space-y-4 flex flex-col justify-between pb-8">
          <div className="space-y-3">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Painéis</h3>
            {[
              { key: 'dashboard', label: 'Painel Executivo', icon: <LayoutDashboard className="w-5 h-5" />, adminOnly: false },
              { key: 'bu', label: 'Unidades de Negócio', icon: <Building2 className="w-5 h-5" />, adminOnly: true },
              { key: 'planning', label: 'Planejamento (Planner)', icon: <Calendar className="w-5 h-5" />, adminOnly: false },
              { key: 'meetings', label: 'Registro de Atas', icon: <FolderOpen className="w-5 h-5" />, adminOnly: false },
              { key: 'ldaps', label: 'Configuração LDAPS', icon: <Network className="w-5 h-5" />, adminOnly: true },
            ].filter(item => !item.adminOnly || hasAdminAccess).map(item => (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key as any); setIsMobileMenuOpen(false); }}
                className={`w-full py-3.5 px-4 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-3 border ${
                  activeTab === item.key
                    ? 'bg-amber-400 text-emerald-950 border-amber-400'
                    : 'text-white bg-transparent border-emerald-800'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
          <div className="space-y-4 pt-6 border-t border-emerald-800">
            <div className="flex items-center gap-3 text-white text-xs">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400 text-amber-400 font-extrabold flex items-center justify-center shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <span className="font-extrabold truncate block">{currentUser.name}</span>
                <span className="text-[10px] text-amber-400 font-bold">{currentUser.role}</span>
              </div>
            </div>
            <button
              onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
              className="w-full py-3 bg-red-650 hover:bg-red-700 font-bold text-xs uppercase tracking-widest text-white rounded-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Finalizar Sessão
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col justify-between gap-12">
        <div className="hidden md:flex items-center justify-between text-xs text-slate-500 border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Sessão ativa para <strong className="text-slate-800">{currentUser.name}</strong> • Papel: <strong>{currentUser.role}</strong></span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatCorporateToday()}</span>
          </div>
        </div>

        <div className="flex-1">{renderActiveTabContent()}</div>

        <footer className="text-center text-[10px] text-slate-400 pt-1 border-t border-slate-100 mt-12 flex flex-col md:flex-row justify-between items-center gap-2 pb-2 selection:bg-neutral-50 p-2">
          <span>Grupo Agemar S/A • Diretoria de Governança Corporativa e Relações de Infraestrutura</span>
          <span className="font-mono">Ambiente Corporativo Seguro • LDAPS Ativo</span>
        </footer>
      </main>
    </div>
  );
}
