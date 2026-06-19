/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Meeting, BusinessUnit } from '../types';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Users, 
  Building2, 
  ArrowUpRight 
} from 'lucide-react';

interface DashboardProps {
  meetings: Meeting[];
  businessUnits: BusinessUnit[];
  onNavigate: (tab: 'dashboard' | 'meetings' | 'planning' | 'bu') => void;
  onEditMeeting: (meeting: Meeting) => void;
}

export default function Dashboard({ meetings, businessUnits, onNavigate, onEditMeeting }: DashboardProps) {
  const currentDateStr = new Date().toISOString().split('T')[0];

  // Core metrics
  const totalPlanned = meetings.filter(m => m.status === 'PLANEJADA').length;
  const totalRealized = meetings.filter(m => m.status === 'REALIZADA').length;
  const totalCanceled = meetings.filter(m => m.status === 'CANCELADA').length;
  const totalMeetings = meetings.length;

  // Overdue meetings: status === 'PLANEJADA' and date < current date
  const overdueMeetings = meetings.filter(
    m => m.status === 'PLANEJADA' && m.date < currentDateStr
  );

  const totalOverdue = overdueMeetings.length;

  // Execution Rate of Planning (Taxa de Execução do Planejamento):
  // (Meetings that came from PLANNING and are now status REALIZADA) / (Total meetings originating from PLANNING) * 100
  const plannedOriginMeetings = meetings.filter(m => m.source === 'PLANNING');
  const plannedAndRealized = plannedOriginMeetings.filter(m => m.status === 'REALIZADA');
  
  const executionRate = plannedOriginMeetings.length > 0 
    ? Math.round((plannedAndRealized.length / plannedOriginMeetings.length) * 100) 
    : 100; // default to 100 if no future plans created yet

  // Next upcoming planned meetings (sorted by date ascending, limited to 5)
  const upcomingMeetings = [...meetings]
    .filter(m => m.status === 'PLANEJADA' && m.date >= currentDateStr)
    .sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return a.time.localeCompare(b.time);
    })
    .slice(0, 5);

  // Grouping by BU
  const buCounts: { [buName: string]: { planned: number; realized: number; canceled: number; total: number } } = {};
  businessUnits.forEach(bu => {
    buCounts[bu.name] = { planned: 0, realized: 0, canceled: 0, total: 0 };
  });

  meetings.forEach(m => {
    const buName = m.businessUnitName;
    if (!buCounts[buName]) {
      buCounts[buName] = { planned: 0, realized: 0, canceled: 0, total: 0 };
    }
    buCounts[buName].total += 1;
    if (m.status === 'PLANEJADA') buCounts[buName].planned += 1;
    if (m.status === 'REALIZADA') buCounts[buName].realized += 1;
    if (m.status === 'CANCELADA') buCounts[buName].canceled += 1;
  });

  // Convert to array and sort by total meetings desc
  const buStats = Object.keys(buCounts).map(name => ({
    name,
    ...buCounts[name]
  })).sort((a, b) => b.total - a.total);

  // Grouping by Meeting Type
  const typeCounts: { [type: string]: number } = {
    'Reunião de resultados mensais': 0,
    'Reunião Quadrimestral - Reforecast': 0,
    'FUPs com Equipes': 0,
    'Outros': 0
  };

  meetings.forEach(m => {
    if (typeCounts[m.meetingType] !== undefined) {
      typeCounts[m.meetingType] += 1;
    } else {
      typeCounts['Outros'] += 1;
    }
  });

  const typePercentages = Object.keys(typeCounts).map(type => {
    const count = typeCounts[type];
    const percentage = totalMeetings > 0 ? Math.round((count / totalMeetings) * 100) : 0;
    return { type, count, percentage };
  });

  // Helper for formatting Portuguese date
  const formatDateBRA = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="dashboard-view">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#007A38]" />
            Painel Executivo de Governança
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Status dinâmico de compliance das unidades de negócio, atas, decisões e planejamento logístico.
          </p>
        </div>
        <div className="flex gap-2 text-xs font-semibold uppercase text-slate-500 bg-white border border-slate-200 px-4 py-2.5 rounded-lg shadow-sm">
          <span>Domínio: <strong className="text-slate-800">agemar.com.br</strong></span>
        </div>
      </div>

      {/* KPI Overviews row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5" id="dashboard-kpi-grid">
        {/* KPI Card 1: TOTAL PLANEJADAS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Planejadas</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{totalPlanned}</span>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-600 font-medium">
              <span>Aguardando execução</span>
            </div>
          </div>
        </div>

        {/* KPI Card 2: TOTAL REALIZADAS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Realizadas</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{totalRealized}</span>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-medium">
              <span>Atas registradas com evidências</span>
            </div>
          </div>
        </div>

        {/* KPI Card 3: TOTAL CANCELADAS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Canceladas</span>
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-700 tracking-tight">{totalCanceled}</span>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-red-500 font-medium">
              <span>Registros anulados</span>
            </div>
          </div>
        </div>

        {/* KPI Card 4: COMPLIANCE RATE */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-400" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Execução Planner</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{executionRate}%</span>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full" 
                style={{ width: `${executionRate}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {plannedAndRealized.length} de {plannedOriginMeetings.length} planejadas realizadas
            </p>
          </div>
        </div>

        {/* KPI Card 5: ATRASADAS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between relative overflow-hidden">
          {totalOverdue > 0 && <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-600" />}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Não realizadas / Atrasadas</span>
            <div className={`p-2 rounded-lg ${totalOverdue > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-3xl font-black tracking-tight ${totalOverdue > 0 ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
              {totalOverdue}
            </span>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 font-medium">
              <span>{totalOverdue > 0 ? 'Urgente: Regularizar data' : 'Nenhuma atrasada registrada'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main visual charting section (BUs vs Types) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* BU Comparison Metric (8 cols) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-8 flex flex-col justify-between" id="dashboard-bu-share">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#007A38]" />
              Conformidade de Reuniões por Unidade de Negócio (BU)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Proporção de reuniões cadastradas nas principais divisões corporativas do Grupo Agemar.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {buStats.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">
                Nenhuma Unidade de Negócio (BU) cadastrada ou vinculada a reuniões.
              </div>
            ) : (
              buStats.map((stat) => {
                const maxTotal = Math.max(...buStats.map(s => s.total), 1);
                const percentSize = Math.round((stat.total / maxTotal) * 100);
                
                return (
                  <div key={stat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{stat.name}</span>
                      <div className="flex gap-3 text-[11px] text-slate-500">
                        <span className="text-blue-600">{stat.planned} plan.</span>
                        <span className="text-emerald-600">{stat.realized} real.</span>
                        {stat.canceled > 0 && <span className="text-red-500">{stat.canceled} canc.</span>}
                        <span className="font-bold text-slate-800">Total: {stat.total}</span>
                      </div>
                    </div>
                    
                    {/* Visual custom stacked bar representation */}
                    <div className="w-full bg-slate-100 rounded-lg h-3.5 flex overflow-hidden">
                      {stat.total === 0 ? (
                        <div className="w-full h-full bg-slate-100" />
                      ) : (
                        <>
                          <div 
                            className="bg-emerald-600 h-full transition-all duration-500" 
                            style={{ width: `${(stat.realized / stat.total) * 100}%` }}
                            title={`Realizadas: ${stat.realized}`}
                          />
                          <div 
                            className="bg-blue-400 h-full transition-all duration-500" 
                            style={{ width: `${(stat.planned / stat.total) * 100}%` }}
                            title={`Planejadas: ${stat.planned}`}
                          />
                          <div 
                            className="bg-red-400 h-full transition-all duration-500" 
                            style={{ width: `${(stat.canceled / stat.total) * 100}%` }}
                            title={`Canceladas: ${stat.canceled}`}
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm" /> Realizada
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-blue-400 rounded-sm" /> Planejada
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-red-400 rounded-sm" /> Cancelada
              </span>
            </div>
            <button 
              onClick={() => onNavigate('bu')} 
              className="text-[#007A38] font-bold hover:underline inline-flex items-center gap-0.5"
            >
              Gerenciar Unidades <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Meeting types distribution (4 cols) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-4 flex flex-col justify-between" id="dashboard-type-ratio">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#007A38]" />
              Distribuição por Categoria
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Foco das pautas realizadas e planejadas.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {typePercentages.map((item) => (
              <div key={item.type} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium truncate max-w-[180px]">{item.type}</span>
                  <span className="text-slate-800 font-black">{item.count} ({item.percentage}%)</span>
                </div>
                {/* Micro-bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#007A38] h-full rounded-full" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center bg-[#007A38]/5 rounded-xl p-3.5 text-xs text-[#007A38] font-semibold">
            {totalMeetings} reuniões catalogadas no sistema
          </div>
        </div>
      </div>

      {/* Grid of Alert list / Upcoming scheduler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column Left: Próximas Reuniões Planejadas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>📅 Próximos Eventos em Agenda</span>
              <button 
                onClick={() => onNavigate('planning')} 
                className="text-xs font-bold text-[#007A38] hover:underline"
              >
                Abrir Calendário Planner
              </button>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Eventos planejados futuros aguardando registro de evidência física.
            </p>

            <div className="space-y-3 mt-4">
              {upcomingMeetings.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                  Nenhuma reunião planejada futura foi cadastrada.
                </div>
              ) : (
                upcomingMeetings.map((m) => (
                  <div 
                    key={m.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold uppercase truncate max-w-[120px]">
                          {m.businessUnitName}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {formatDateBRA(m.date)} • {m.time}
                        </span>
                      </div>
                      <div className="font-bold text-slate-700 text-xs mt-1 truncate">
                        {m.meetingType}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        Dretor: {m.responsibleDirector} • Local: {m.location}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => onEditMeeting(m)}
                      className="px-2.5 py-1.5 bg-[#007A38] text-white hover:bg-[#007A38]/90 font-bold rounded text-[10px] ml-4 transition-colors shrink-0 cursor-pointer"
                    >
                      Realizar / Ata
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Column Right: Reuniões Pendentes ou Atrasadas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> 
                Ações Requeridas / Planejamento Vencido
              </span>
              <button 
                onClick={() => onNavigate('meetings')} 
                className="text-xs font-bold text-red-600 hover:underline"
              >
                Garantir Atas
              </button>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Reuniões planejadas cujas datas já passaram mas ainda não foram registradas como Realizadas ou Canceladas.
            </p>

            <div className="space-y-3 mt-4">
              {overdueMeetings.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400 bg-emerald-50/20">
                  ✅ Excelente! Tudo em dia! Nenhuma conformidade pendente.
                </div>
              ) : (
                overdueMeetings.slice(0, 5).map((m) => (
                  <div 
                    key={m.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50/40 border border-red-100 hover:bg-red-50/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-800 font-bold uppercase truncate max-w-[120px]">
                          {m.businessUnitName}
                        </span>
                        <span className="text-[11px] font-bold text-red-700">
                          ATRASADO ({formatDateBRA(m.date)})
                        </span>
                      </div>
                      <div className="font-bold text-slate-700 text-xs mt-1 truncate">
                        {m.meetingType}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        Diretor: {m.responsibleDirector} • Responsável: {m.responsibleDirector}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => onEditMeeting(m)}
                      className="px-2.5 py-1.5 bg-[#007A38] text-white hover:bg-[#007A38]/90 font-bold rounded text-[10px] ml-4 transition-colors shrink-0 cursor-pointer"
                    >
                      Regularizar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
