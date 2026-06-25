/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, BusinessUnit, Meeting } from './types';
import Login from './components/Login';
import AgemarLogo from './components/AgemarLogo';
import Dashboard from './components/Dashboard';
import BusinessUnitManager from './components/BusinessUnitManager';
import MeetingPlanner from './components/MeetingPlanner';
import MeetingRegister from './components/MeetingRegister';
import SettingsLDAP from './components/SettingsLDAP';
import { 
  Building2, 
  Calendar, 
  LayoutDashboard, 
  FolderOpen, 
  LogOut, 
  User as UserIcon, 
  HelpCircle,
  Menu,
  X,
  Clock,
  Network
} from 'lucide-react';

// INITIAL SEED DATA FOR LOCAL STORAGE
const SEED_BUs: BusinessUnit[] = [
  {
    id: 'bu_1',
    name: 'Agemar Logística',
    code: 'BU-LOG',
    responsibleDirector: 'Renata Lins',
    status: 'Ativa',
    observations: 'Divisão de terminais rodoviários e portuários de movimentação de cargas.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bu_2',
    name: 'Agemar Infraestrutura',
    code: 'BU-INF',
    responsibleDirector: 'Jorge Cabral',
    status: 'Ativa',
    observations: 'Gerenciamento de armazéns, retroporto e pátio de contêineres.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bu_3',
    name: 'Agemar Aduaneira & Portos',
    code: 'BU-ADU',
    responsibleDirector: 'Carlos Augusto',
    status: 'Ativa',
    observations: 'Desembaraço aduaneiro, fretamento marítimo e agenciamento portuário.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bu_4',
    name: 'Agemar Agronegócio (Histórico)',
    code: 'BU-AGR',
    responsibleDirector: 'Roberto Dias',
    status: 'Inativa',
    observations: 'Antiga divisão de silos e grãos. Inativada formalmente em 2025.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const SEED_MEETINGS: Meeting[] = [
  {
    id: 'meet_1',
    meetingType: 'Reunião de resultados mensais',
    responsibleDirector: 'Renata Lins',
    businessUnitId: 'bu_1',
    businessUnitName: 'Agemar Logística',
    date: '2026-06-05',
    time: '09:30',
    location: 'Sala de Conselhos - Salvador',
    participants: 'Renata Lins, Jorge Cabral, Carlos Augusto, Claudio Melo',
    evidenceLink: 'https://sharepoint.agemar.com.br/atas/resultados_maio_2026',
    attachments: [
      {
        id: 'att_seed_1',
        meetingId: 'meet_1',
        fileName: 'Ata_Assinada_Conselho_Estaleiro.pdf',
        fileUrl: 'data:text/plain;base64,U2VlZGVkIEF0YSBGaWxl...',
        fileType: 'application/pdf',
        uploadedBy: 'Jorge Cabral',
        uploadedAt: '2026-06-05T12:00:00Z',
      }
    ],
    observationsDecisions: 'Concluído o fechamento do faturamento logístico de maio com superávit consolidado de 12.3% comparado ao orçado. Terminais portuários apresentaram throughput recorde de pátio devido ao pico de safra de grãos. Diretoria aprovou as despesas capitais de expansão de guindastes operacionais no Porto.',
    status: 'REALIZADA',
    source: 'DIRECT_REGISTRATION',
    createdBy: 'Jorge Cabral (Administrador)',
    createdAt: '2026-06-05T09:30:00Z',
    updatedAt: '2026-06-05T12:15:00Z',
    completedAt: '2026-06-05T12:15:00Z',
  },
  {
    id: 'meet_2',
    meetingType: 'Reunião Quadrimestral - Reforecast',
    responsibleDirector: 'Jorge Cabral',
    businessUnitId: 'bu_2',
    businessUnitName: 'Agemar Infraestrutura',
    date: '2026-06-18',
    time: '14:00',
    location: 'Auditório Principal e Teams Link',
    participants: 'Jorge Cabral, Renata Lins, Claudio de Souza, Dra. Marilia Santos',
    attachments: [],
    observationsDecisions: 'Discussão centralizada do orçamento operacional Q3 da infraestrutura, focado na aquisição de empilhadeiras portuárias e melhoramento do balizamento do píer secundário.',
    status: 'PLANEJADA',
    source: 'PLANNING',
    createdBy: 'Renata Lins',
    createdAt: '2026-06-10T14:00:00Z',
    updatedAt: '2026-06-10T14:00:00Z',
  },
  {
    id: 'meet_3',
    meetingType: 'FUPs com Equipes',
    responsibleDirector: 'Carlos Augusto',
    businessUnitId: 'bu_3',
    businessUnitName: 'Agemar Aduaneira & Portos',
    date: '2026-06-12', // In the past relative to 2026-06-15 (Overdue!)
    time: '10:00',
    location: 'Teams Corporativo',
    participants: 'Carlos Augusto, Marilene Bezerra, Eduardo Mendes',
    attachments: [],
    observationsDecisions: 'Acompanhamento diário de desembaraço aduaneiro especial de navios mercantes. Necessário recolher as assinaturas físicas e registrar a conclusão das pautas no sistema corporativo.',
    status: 'PLANEJADA', // Remains planned, thus it is Overdue
    source: 'PLANNING',
    createdBy: 'Carlos Augusto',
    createdAt: '2026-06-11T10:00:00Z',
    updatedAt: '2026-06-11T10:00:00Z',
  },
  {
    id: 'meet_4',
    meetingType: 'Outros',
    responsibleDirector: 'Roberto Dias',
    businessUnitId: 'bu_4',
    businessUnitName: 'Agemar Agronegócio (Histórico)',
    date: '2026-06-03',
    time: '16:00',
    location: 'Escritório de Recife Clientes',
    participants: 'Roberto Dias, Jorge Cabral, Assessor Jurídico',
    attachments: [],
    observationsDecisions: 'Reunião suspensa e arquivada em virtude do encerramento formal das operações da BU Agronégócio em 2025. Registros mantidos para auditoria fiscal governamental.',
    status: 'CANCELADA',
    source: 'DIRECT_REGISTRATION',
    createdBy: 'Jorge Cabral (Administrador)',
    createdAt: '2026-06-03T16:00:00Z',
    updatedAt: '2026-06-04T08:00:00Z',
  }
];

export default function App() {
  // 1. Session state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('agemar_session');
    return saved ? JSON.parse(saved) : null;
  });

  const hasAdminAccess = !!(currentUser && (
    currentUser.role === 'Administrador' ||
    currentUser.networkLogin === 'aplicativos.agemar' ||
    currentUser.email === 'aplicativos@agemar.com.br'
  ));

  // 2. Business Units State
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>(() => {
    const saved = localStorage.getItem('agemar_bus');
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem('agemar_bus', JSON.stringify(SEED_BUs));
    return SEED_BUs;
  });

  // 3. Meetings State
  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem('agemar_meetings');
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem('agemar_meetings', JSON.stringify(SEED_MEETINGS));
    return SEED_MEETINGS;
  });

  // 4. Navigation tabs
  const [activeTab, setActiveTab ] = useState<'dashboard' | 'meetings' | 'planning' | 'bu' | 'ldaps'>(() => {
    const saved = localStorage.getItem('agemar_active_tab');
    return (saved as any) || 'dashboard';
  });

  // Navigation redirect parameters (for forwarding context actions)
  const [activeEditingMeeting, setActiveEditingMeeting] = useState<Meeting | null>(null);

  // Mobile sidebar toggle index
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Synchronize localStorage on states update
  useEffect(() => {
    localStorage.setItem('agemar_bus', JSON.stringify(businessUnits));
  }, [businessUnits]);

  useEffect(() => {
    localStorage.setItem('agemar_meetings', JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem('agemar_active_tab', activeTab);
  }, [activeTab]);

  // Keep non-authorized users away from restricted tabs (ldaps and bu) if they manually navigate or have cached tab state
  useEffect(() => {
    if ((activeTab === 'ldaps' || activeTab === 'bu') && currentUser && !hasAdminAccess) {
      setActiveTab('dashboard');
    }
  }, [activeTab, currentUser, hasAdminAccess]);

  // Auth operations
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('agemar_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('agemar_session');
    setActiveTab('dashboard');
  };

  // BU CRUD Actions
  const handleAddBU = (buData: Omit<BusinessUnit, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBU: BusinessUnit = {
      ...buData,
      id: `bu_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBusinessUnits((prev) => [...prev, newBU]);
  };

  const handleUpdateBU = (id: string, buData: Partial<BusinessUnit>) => {
    setBusinessUnits((prev) =>
      prev.map((bu) =>
        bu.id === id
          ? { ...bu, ...buData, updatedAt: new Date().toISOString() }
          : bu
      )
    );

    // Sync cascading changes into existing meeting references to maintain consistency
    if (buData.name) {
      setMeetings((prev) =>
        prev.map((m) =>
          m.businessUnitId === id ? { ...m, businessUnitName: buData.name! } : m
        )
      );
    }
  };

  const handleDeleteBU = (id: string): boolean => {
    // Check if any meetings depend on this BU (safety constraint check)
    const hasLinkedMeetings = meetings.some((m) => m.businessUnitId === id);
    if (hasLinkedMeetings) {
      return false; // blocks deletion
    }

    setBusinessUnits((prev) => prev.filter((bu) => bu.id !== id));
    return true; // signals successful deletion
  };

  // Meetings CRUD Actions
  const handleAddMeeting = (meetData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMeeting: Meeting = {
      ...meetData,
      id: `meet_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: meetData.status === 'REALIZADA' ? new Date().toISOString() : undefined,
    };
    setMeetings((prev) => [...prev, newMeeting]);
  };

  const handleUpdateMeeting = (id: string, meetData: Partial<Meeting>) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === id
          ? { 
              ...m, 
              ...meetData, 
              updatedAt: new Date().toISOString(),
              completedAt: meetData.status === 'REALIZADA' ? (m.completedAt || new Date().toISOString()) : m.completedAt
            }
          : m
      )
    );
  };

  const handleDeleteMeeting = (id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  };

  // Special pipeline from calendar planner to registration
  const handleRealizeFromPlanner = (plannedMeeting: Meeting) => {
    // Navigate straight to meeting register panel, passing the active item
    setActiveEditingMeeting(plannedMeeting);
    setActiveTab('meetings');
  };

  // Helper date formatted today
  const formatCorporateToday = () => {
    const opt: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('pt-BR', opt);
  };

  // Redirecting shortcuts
  const handleNavigateShortcut = (tab: 'dashboard' | 'meetings' | 'planning' | 'bu' | 'ldaps') => {
    setActiveTab(tab);
  };

  const handleEditMeetingShortcut = (meeting: Meeting) => {
    setActiveEditingMeeting(meeting);
    setActiveTab('meetings');
  };

  // If user is not logged in, present Login Flow
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Active Screen Selector Switch
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
            Acesso Restrito: Apenas administradores e usuários autorizados podem gerenciar as unidades de negócio.
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
          <SettingsLDAP 
            userRole={currentUser.role}
          />
        ) : (
          <div className="p-8 font-bold text-red-650 bg-red-50 rounded-xl border border-red-200">
            Acesso Restrito: Apenas usuários com privilégios de Administrador podem acessar as configurações de conexão LDAPS.
          </div>
        );
      default:
        return <div className="p-8">Visualização indisponível.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800" id="agemar-app-root">
      {/* SIDEBAR NAVIGATION - DESKTOP CONTAINER (Hidden on small screens) */}
      <aside 
        className="w-72 bg-gradient-to-b from-[#00602B] to-[#004A20] text-white flex-col justify-between hidden md:flex shrink-0 border-r border-[#003816] shadow-lg sticky top-0 h-screen"
        id="desktop-app-sidebar"
      >
        <div className="flex flex-col">
          {/* Logo Brand top */}
          <div className="bg-emerald-950/25 p-6 border-b border-[#007A38]/30 flex flex-col items-center">
            <AgemarLogo size="sm" showCelebration={true} className="text-white fill-white" />
          </div>

          {/* Active Navigation Options */}
          <nav className="p-4 space-y-2 mt-4" id="sidebar-navigation">
            {/* Dashboard tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-amber-400 text-emerald-950 shadow-md shadow-amber-400/10'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span>Painel Executivo</span>
            </button>

            {/* BU tab */}
            {hasAdminAccess && (
              <button
                onClick={() => setActiveTab('bu')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'bu'
                    ? 'bg-amber-400 text-emerald-950 shadow-md shadow-amber-400/10'
                    : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                }`}
              >
                <Building2 className="w-5 h-5 shrink-0" />
                <span>Unidades de Negócio</span>
              </button>
            )}

            {/* Planning tab */}
            <button
              onClick={() => setActiveTab('planning')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'planning'
                  ? 'bg-amber-400 text-emerald-950 shadow-md shadow-amber-400/10'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <Calendar className="w-5 h-5 shrink-0" />
              <span>Planejamento (Planner)</span>
            </button>

            {/* Meetings Registrer tab */}
            <button
              onClick={() => setActiveTab('meetings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'meetings'
                  ? 'bg-amber-400 text-emerald-950 shadow-md shadow-amber-400/10'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <FolderOpen className="w-5 h-5 shrink-0" />
              <span>Registro de Atas</span>
            </button>

            {/* LDAPS Config tab */}
            {hasAdminAccess && (
              <button
                onClick={() => setActiveTab('ldaps')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'ldaps'
                    ? 'bg-amber-400 text-emerald-950 shadow-md shadow-amber-400/10'
                    : 'text-emerald-105 hover:bg-emerald-800/60 hover:text-white'
                }`}
                id="sidebar-ldaps-tab"
              >
                <Network className="w-5 h-5 shrink-0" />
                <span>Configuração LDAPS</span>
              </button>
            )}
          </nav>
        </div>

        {/* User Identity and Session closing footer */}
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
            id="sidebar-logout-btn"
          >
            <LogOut className="w-4 h-4" /> Desconectar
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER BAR (Hidden on desktop) */}
      <header className="md:hidden bg-[#00602B] text-white p-4 flex items-center justify-between shadow-md relative z-30">
        <div className="flex items-center gap-1.5">
          <AgemarLogo size="sm" showCelebration={false} className="text-white fill-white scale-90" />
          <h2 className="text-sm font-black tracking-tight leading-none text-amber-400 ml-1">
            Governança
          </h2>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-emerald-950/40 rounded border border-[#007A38] text-white shrink-0 cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* MOBILE FLOATING MENU SCREEN */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-emerald-950/95 pt-20 px-6 space-y-4 flex flex-col justify-between pb-8">
          <div className="space-y-3">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Painéis</h3>
            <button
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full py-3.5 px-4 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-3 border ${
                activeTab === 'dashboard' 
                  ? 'bg-amber-400 text-emerald-950 border-amber-400' 
                  : 'text-white bg-transparent border-emerald-800'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" /> Painel Executivo
            </button>
            {hasAdminAccess && (
              <button
                onClick={() => { setActiveTab('bu'); setIsMobileMenuOpen(false); }}
                className={`w-full py-3.5 px-4 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-3 border ${
                  activeTab === 'bu' 
                    ? 'bg-amber-400 text-emerald-950 border-amber-400' 
                    : 'text-white bg-transparent border-emerald-800'
                }`}
              >
                <Building2 className="w-5 h-5" /> Unidades de Negócio
              </button>
            )}
            <button
              onClick={() => { setActiveTab('planning'); setIsMobileMenuOpen(false); }}
              className={`w-full py-3.5 px-4 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-3 border ${
                activeTab === 'planning' 
                  ? 'bg-amber-400 text-emerald-950 border-amber-400' 
                  : 'text-white bg-transparent border-emerald-800'
              }`}
            >
              <Calendar className="w-5 h-5" /> Planejamento (Planner)
            </button>
            <button
              onClick={() => { setActiveTab('meetings'); setIsMobileMenuOpen(false); }}
              className={`w-full py-3.5 px-4 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-3 border ${
                activeTab === 'meetings' 
                  ? 'bg-amber-400 text-emerald-950 border-amber-400' 
                  : 'text-white bg-transparent border-emerald-800'
              }`}
            >
              <FolderOpen className="w-5 h-5" /> Registro de Atas
            </button>
            {hasAdminAccess && (
              <button
                onClick={() => { setActiveTab('ldaps'); setIsMobileMenuOpen(false); }}
                className={`w-full py-3.5 px-4 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-3 border ${
                  activeTab === 'ldaps' 
                    ? 'bg-amber-400 text-emerald-950 border-amber-400' 
                    : 'text-white bg-transparent border-emerald-800'
                }`}
                id="mobile-ldaps-tab"
              >
                <Network className="w-5 h-5" /> Configuração LDAPS
              </button>
            )}
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

      {/* CORE WORK AREA CONTROLLER */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col justify-between gap-12" id="main-frame-dashboard">
        {/* Upper metadata row greeting */}
        <div className="hidden md:flex items-center justify-between text-xs text-slate-500 border-b border-slate-200/60 pb-3" id="top-user-banner">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Sessão ativa para <strong className="text-slate-800">{currentUser.name}</strong> • Papel: <strong>{currentUser.role}</strong></span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatCorporateToday()}</span>
          </div>
        </div>

        {/* Selected content screen */}
        <div className="flex-1">
          {renderActiveTabContent()}
        </div>

        {/* Bottom copyright footer */}
        <footer className="text-center text-[10px] text-slate-400 pt-1 border-t border-slate-100 mt-12 flex flex-col md:flex-row justify-between items-center gap-2 pb-2 selection:bg-neutral-50 p-2">
          <span>Grupo Agemar S/A • Diretoria de Governança Corporativa e Relações de Infraestrutura</span>
          <span className="font-mono">Ambiente Corporativo Seguro • LDAPS Ativo</span>
        </footer>
      </main>
    </div>
  );
}
