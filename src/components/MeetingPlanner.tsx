/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Meeting, BusinessUnit, MeetingType } from '../types';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Building2, 
  Clock, 
  MapPin, 
  User, 
  PlusCircle, 
  CornerDownRight, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  ArrowRight,
  ShieldAlert,
  Users,
  CheckCircle2
} from 'lucide-react';

interface MeetingPlannerProps {
  meetings: Meeting[];
  businessUnits: BusinessUnit[];
  onAddPlannedMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt' | 'attachments'>) => void;
  onUpdatePlannedMeeting: (id: string, meeting: Partial<Meeting>) => void;
  onDeletePlannedMeeting: (id: string) => void;
  onRealizeMeeting: (meeting: Meeting) => void;
  userRole: 'Administrador' | 'Editor' | 'Visualizador';
}

export default function MeetingPlanner({
  meetings,
  businessUnits,
  onAddPlannedMeeting,
  onUpdatePlannedMeeting,
  onDeletePlannedMeeting,
  onRealizeMeeting,
  userRole,
}: MeetingPlannerProps) {
  // Navigation states for calendar months
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // 0-based index. 5 corresponds to June

  // Active planning States (Forms)
  const [isAdding, setIsAdding] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

  // Form Fields
  const [meetingType, setMeetingType] = useState<MeetingType>('Reunião de resultados mensais');
  const [buId, setBuId] = useState('');
  const [responsibleDirector, setResponsibleDirector] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [location, setLocation] = useState('');
  const [participants, setParticipants] = useState('');
  const [observations, setObservations] = useState('');

  // Confirmation alert states
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canEdit = userRole === 'Administrador' || userRole === 'Editor';

  // Extract active BUs for selecting
  const activeBUs = businessUnits.filter(bu => bu.status === 'Ativa');

  // Month names
  const ptMonths = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Helper inside form to sync director from selected BU
  const handleBUChange = (selectedId: string) => {
    setBuId(selectedId);
    const selectedBU = businessUnits.find(bu => bu.id === selectedId);
    if (selectedBU) {
      setResponsibleDirector(selectedBU.responsibleDirector);
    }
  };

  // Navigating months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Submit planner form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessBanner(null);
    setErrorBanner(null);

    // Validations
    if (!buId) {
      setErrorBanner('É necessário selecionar uma Unidade de Negócio (BU).');
      return;
    }
    if (!dateStr || !timeStr) {
      setErrorBanner('Data e hora planejadas são obrigatórias.');
      return;
    }
    if (!responsibleDirector.trim()) {
      setErrorBanner('O Diretor Responsável é obrigatório.');
      return;
    }
    if (!participants.trim()) {
      setErrorBanner('Os Participantes previstos são obrigatórios.');
      return;
    }

    const selectedBU = businessUnits.find(bu => bu.id === buId);
    const buName = selectedBU ? selectedBU.name : '';

    if (editingMeetingId) {
      onUpdatePlannedMeeting(editingMeetingId, {
        meetingType,
        businessUnitId: buId,
        businessUnitName: buName,
        responsibleDirector: responsibleDirector.trim(),
        date: dateStr,
        time: timeStr,
        location: location.trim(),
        participants: participants.trim(),
        observationsDecisions: observations.trim(),
      });
      setSuccessBanner('Planejamento de reunião atualizado com sucesso.');
      setEditingMeetingId(null);
    } else {
      onAddPlannedMeeting({
        meetingType,
        businessUnitId: buId,
        businessUnitName: buName,
        responsibleDirector: responsibleDirector.trim(),
        date: dateStr,
        time: timeStr,
        location: location.trim() || 'Sala de Reuniões Corporativa',
        participants: participants.trim(),
        observationsDecisions: observations.trim(),
        status: 'PLANEJADA',
        source: 'PLANNING',
        createdBy: 'LDAP User',
      });
      setSuccessBanner('Nova reunião planejada com status "PLANEJADA" salva no cronograma.');
    }

    // Reset Form
    setIsAdding(false);
    clearForm();
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const clearForm = () => {
    setMeetingType('Reunião de resultados mensais');
    setBuId('');
    setResponsibleDirector('');
    setDateStr('');
    setTimeStr('');
    setLocation('');
    setParticipants('');
    setObservations('');
  };

  const handleStartEdit = (m: Meeting) => {
    if (!canEdit) return;
    setEditingMeetingId(m.id);
    setMeetingType(m.meetingType);
    setBuId(m.businessUnitId);
    setResponsibleDirector(m.responsibleDirector);
    setDateStr(m.date);
    setTimeStr(m.time);
    setLocation(m.location);
    setParticipants(m.participants);
    setObservations(m.observationsDecisions);
    setIsAdding(true);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingMeetingId(null);
    clearForm();
    setErrorBanner(null);
  };

  // Calendar calculations
  // Get first day of month (0 = Sunday, 1 = Monday...)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Get number of days in the month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Create list of days (represented as calendar cells)
  const calendarCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean; meetings: Meeting[] }[] = [];

  // Generate blank spaces/pre-month days
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
  const daysInPrevMonth = new Date(prevMonthYear, prevMonthIdx + 1, 0).getDate();

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayVal = daysInPrevMonth - i;
    const paddingMonthStr = String(prevMonthIdx + 1).padStart(2, '0');
    const fullDateStr = `${prevMonthYear}-${paddingMonthStr}-${String(dayVal).padStart(2, '0')}`;
    calendarCells.push({
      dateStr: fullDateStr,
      dayNum: dayVal,
      isCurrentMonth: false,
      meetings: [],
    });
  }

  // Current month days
  const paddingCurMonthStr = String(currentMonth + 1).padStart(2, '0');
  for (let d = 1; d <= daysInMonth; d++) {
    const fullDateStr = `${currentYear}-${paddingCurMonthStr}-${String(d).padStart(2, '0')}`;
    // Look up meetings on this day
    const dayMeetings = meetings.filter(
      (m) => m.date === fullDateStr && m.status === 'PLANEJADA'
    );

    calendarCells.push({
      dateStr: fullDateStr,
      dayNum: d,
      isCurrentMonth: true,
      meetings: dayMeetings,
    });
  }

  // Complete trailing grid lines to reach multi-row 42 squares (7x6 layout)
  const totalGridSlots = 42;
  const remainingSlots = totalGridSlots - calendarCells.length;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
  const paddingNextMonthStr = String(nextMonthIdx + 1).padStart(2, '0');

  for (let x = 1; x <= remainingSlots; x++) {
    const fullDateStr = `${nextMonthYear}-${paddingNextMonthStr}-${String(x).padStart(2, '0')}`;
    calendarCells.push({
      dateStr: fullDateStr,
      dayNum: x,
      isCurrentMonth: false,
      meetings: [],
    });
  }

  // Fast cell click inside browser to quick add planning
  const handleCellClick = (cellDate: string) => {
    if (!canEdit) return;
    setDateStr(cellDate);
    setIsAdding(true);
  };

  // Helper to format BR date info
  const formatDateBRA = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length !== 3) return dStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="planner-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#007A38]" />
            Cronograma e Planejamento Visual (Planner)
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Projete o calendário de agendas futuras e crie pautas automáticas no registro corporativo de reuniões.
          </p>
        </div>
        {canEdit && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2.5 bg-[#007A38] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            id="btn-add-planejada"
          >
            <Plus className="w-4 h-4" /> Planejar Nova Reunião
          </button>
        )}
      </div>

      {successBanner && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-sm text-emerald-800 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg text-sm text-red-800 flex items-start gap-3 animate-fadeIn">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Validação do Planejamento</span>
            <p className="mt-1 leading-relaxed">{errorBanner}</p>
          </div>
        </div>
      )}

      {/* Adding / Editing Panel (Responsive Form Drawer) */}
      {isAdding && (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-md animate-slideDown" id="planner-form-container">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#007A38]" />
              {editingMeetingId ? 'Modificar Reunião Planejada' : 'Planejar Nova Reunião Corporativa'}
            </h3>
            <span className="px-3 py-1 bg-amber-100 border border-amber-200 text-amber-800 text-[10px] uppercase font-black tracking-widest rounded-full">
              Status Inicial: PLANEJADA
            </span>
          </div>

          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5" id="planner-form">
            {/* Column 1 (Types & BUs) */}
            <div className="md:col-span-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo de Reunião *
                </label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all"
                >
                  <option value="Reunião de resultados mensais">Reunião de resultados mensais</option>
                  <option value="Reunião Quadrimestral - Reforecast">Reunião Quadrimestral - Reforecast</option>
                  <option value="FUPs com Equipes">FUPs com Equipes</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Unidade de Negócio (BU) *
                </label>
                <select
                  required
                  value={buId}
                  onChange={(e) => handleBUChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all"
                >
                  <option value="">Selecione uma BU ativa...</option>
                  {activeBUs.length === 0 ? (
                    <option disabled>Nenhuma Unidade Ativa Cadastrada!</option>
                  ) : (
                    activeBUs.map((bu) => (
                      <option key={bu.id} value={bu.id}>
                        {bu.name} {bu.code ? `(${bu.code})` : ''}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Apenas BUs com status "Ativa" são listadas para novos planejamentos.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Diretor Responsável *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={responsibleDirector}
                    onChange={(e) => setResponsibleDirector(e.target.value)}
                    placeholder="Diretor responsável pelo evento"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Column 2 (Date, Hour, Location) */}
            <div className="md:col-span-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Data Planejada *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Hora Planejada *
                  </label>
                  <input
                    type="time"
                    required
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Local / Endereço / Canal Digital
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Sala de Conselhos ou Teams Link"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Participantes Previstos (Convocados) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Users className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder="Ex: Dr. Jorge, Renata Lins, Claudio de Souza"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Column 3 (Notes & Buttons) */}
            <div className="md:col-span-4 space-y-4 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Observações e Diretrizes Iniciais
                </label>
                <textarea
                  rows={4}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Defina a pauta central desejada para este planejamento..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 bg-slate-100 dark:hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#007A38] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {editingMeetingId ? 'Atualizar Planejamento' : 'Gravar no Cronograma'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Main Dual Partition: Interactive Calendar Grid + Next Events List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Partition Left: Interactive Month Grid Calendar (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col" id="calendar-grid-card">
          {/* Calendar Header with navigation switches */}
          <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-4 select-none">
            <div className="flex items-center gap-1">
              <span className="text-lg font-black text-slate-800 tracking-tight font-sans">
                {ptMonths[currentMonth]}
              </span>
              <span className="text-lg font-bold text-slate-400 font-mono">
                {currentYear}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-200 rounded-lg">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 rounded-md hover:bg-slate-200 hover:text-slate-900 text-slate-500 transition-colors cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setCurrentYear(2026);
                  setCurrentMonth(5); // Reset back to June 2026
                }}
                className="text-[10px] font-black uppercase text-[#007A38] hover:bg-[#007A38]/10 px-2.5 py-1 rounded transition-all cursor-pointer"
              >
                Hoje
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 rounded-md hover:bg-slate-200 hover:text-slate-900 text-slate-500 transition-colors cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday line identifiers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 border-b border-slate-100 pb-2">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2.5" id="calendar-daycells-grid">
            {calendarCells.map((cell, idx) => {
              const isToday = cell.dateStr === '2026-06-15'; // system matching context
              return (
                <div 
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => handleCellClick(cell.dateStr)}
                  className={`min-h-[75px] border rounded-lg p-1.5 flex flex-col justify-between transition-all select-none relative ${
                    cell.isCurrentMonth 
                      ? 'bg-slate-50/40 border-slate-200 hover:bg-[#007A38]/5 cursor-pointer' 
                      : 'bg-slate-100/40 border-slate-150 opacity-40 text-slate-400 cursor-not-allowed'
                  } ${isToday ? 'ring-2 ring-amber-400 ring-offset-1 bg-yellow-50/20' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-bold ${
                      isToday ? 'text-amber-600 bg-amber-100 rounded-full px-1.5 py-0.5' : 'text-slate-500'
                    }`}>
                      {cell.dayNum}
                    </span>
                    {cell.meetings.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </div>

                  {/* Cell list overlay for scheduled meetings */}
                  <div className="space-y-1 mt-1">
                    {cell.meetings.map(m => (
                      <div 
                        key={m.id}
                        title={`${m.meetingType} - ${m.businessUnitName}`}
                        className="text-[9px] font-bold bg-blue-100/90 text-blue-900 border border-blue-200 rounded px-1 py-0.5 mt-0.5 truncate leading-tight hover:scale-[1.03] transition-transform"
                      >
                        {m.businessUnitName.split(' ')[0]}: {m.time}
                      </div>
                    ))}
                  </div>

                  {/* Small add text shown on cell hover */}
                  {cell.isCurrentMonth && canEdit && (
                    <span className="absolute bottom-1 right-1 font-bold text-[9px] text-[#007A38] opacity-0 hover:opacity-100 transition-opacity bg-white/95 rounded px-1 shadow border border-[#007A38]/20">
                      + Agendar
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Partition Right: Chronology list of Plans (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col" id="calendar-timeline-card">
          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-150 pb-3 mb-4 flex items-center justify-between">
            <span>📋 Linha do Tempo Planejada</span>
            <span className="text-xs text-blue-600 font-extrabold bg-blue-50 px-2.5 py-0.5 rounded-full font-mono">
              {meetings.filter(m => m.status === 'PLANEJADA').length} Ativas
            </span>
          </h3>

          <div className="space-y-4 overflow-y-auto max-h-[450px] pr-1.5" id="timeline-list">
            {meetings.filter(m => m.status === 'PLANEJADA').length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs border-2 border-dashed border-slate-150 rounded-xl">
                Nenhuma reunião ativa aguardando cronograma.
              </div>
            ) : (
              [...meetings]
                .filter(m => m.status === 'PLANEJADA')
                .sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .map((m) => {
                  const isCurrentDay = m.date === '2026-06-15';
                  const isOverdue = m.date < '2026-06-15';

                  return (
                    <div 
                      key={m.id}
                      className={`p-4 border rounded-xl shadow-sm hover:shadow transition-shadow flex flex-col gap-3 relative overflow-hidden ${
                        isOverdue 
                          ? 'border-red-200 bg-red-50/20' 
                          : isCurrentDay 
                            ? 'border-amber-200 bg-amber-50/20 ring-1 ring-amber-300' 
                            : 'border-slate-200 bg-white'
                      }`}
                    >
                      {/* Micro-bar indicator code */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isOverdue ? 'bg-red-500' : isCurrentDay ? 'bg-amber-400' : 'bg-blue-500'
                      }`} />

                      <div>
                        {/* Meta metadata row */}
                        <div className="flex items-center justify-between gap-2.5">
                          <span className="px-2 py-0.5 rounded text-[9px] bg-slate-100 text-slate-800 font-extrabold uppercase">
                            {m.businessUnitName}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            isOverdue ? 'text-red-600 font-black' : 'text-slate-500'
                          }`}>
                            {formatDateBRA(m.date)} • {m.time}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-800 text-xs mt-2 text-[#007A38]">
                          {m.meetingType}
                        </h4>

                        <div className="space-y-1 mt-2.5 font-sans text-[11px] text-slate-600">
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Diretor: <strong className="text-slate-700">{m.responsibleDirector}</strong></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>Local: <strong className="text-slate-700">{m.location}</strong></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">Conv.: <strong className="text-slate-700">{m.participants}</strong></span>
                          </div>
                        </div>

                        {m.observationsDecisions && (
                          <div className="mt-3 bg-slate-50 border border-slate-150 p-2 rounded text-[10px] text-slate-500 leading-relaxed italic">
                            Alt. Pauta: {m.observationsDecisions}
                          </div>
                        )}
                      </div>

                      {/* Timeline bottom items actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        {canEdit ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEdit(m)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                              title="Editar agenda"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            
                            {deleteConfirmId === m.id ? (
                              <div className="flex items-center gap-1 bg-red-100/70 p-0.5 rounded border border-red-200">
                                <button
                                  onClick={() => {
                                    onDeletePlannedMeeting(m.id);
                                    setDeleteConfirmId(null);
                                  }}
                                  className="px-1.5 py-0.5 bg-red-600 hover:bg-red-800 text-white font-bold text-[9px] rounded cursor-pointer"
                                  title="Confirmar exclusão"
                                >
                                  Excluir
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-bold rounded cursor-pointer"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(m.id)}
                                className="p-1 rounded hover:bg-red-50 text-slate-500 hover:text-red-600 cursor-pointer"
                                title="Cancelar / Descartar planejamento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">🔒 Apenas Leitura</span>
                        )}

                        <button
                          onClick={() => onRealizeMeeting(m)}
                          className="px-2 py-1 bg-[#007A38] text-white hover:bg-emerald-800 text-[10px] font-black rounded flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Registrar Ata <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
