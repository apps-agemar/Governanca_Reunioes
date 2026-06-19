/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Meeting, BusinessUnit, MeetingType, MeetingStatus, MeetingSource, Attachment } from '../types';
import { 
  Building2, 
  Calendar, 
  Clock, 
  User, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  X, 
  Eye, 
  Link as LinkIcon, 
  Paperclip, 
  FileText, 
  AlertCircle, 
  File, 
  XCircle, 
  Info,
  Sliders,
  Sparkles,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

interface MeetingRegisterProps {
  meetings: Meeting[];
  businessUnits: BusinessUnit[];
  onAddMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMeeting: (id: string, meeting: Partial<Meeting>) => void;
  onDeleteMeeting: (id: string) => void;
  activeEditingMeeting: Meeting | null;
  onClearActiveEditing: () => void;
  currentUser: { name: string; networkLogin: string };
  userRole: 'Administrador' | 'Editor' | 'Visualizador';
}

export default function MeetingRegister({
  meetings,
  businessUnits,
  onAddMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  activeEditingMeeting,
  onClearActiveEditing,
  currentUser,
  userRole,
}: MeetingRegisterProps) {
  // Navigation tabs or active forms
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

  // Form Field States
  const [meetingType, setMeetingType] = useState<MeetingType>('Reunião de resultados mensais');
  const [buId, setBuId] = useState('');
  const [responsibleDirector, setResponsibleDirector] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [location, setLocation] = useState('');
  const [participants, setParticipants] = useState('');
  const [evidenceLink, setEvidenceLink] = useState('');
  const [observationsDecisions, setObservationsDecisions] = useState('');
  const [status, setStatus] = useState<MeetingStatus>('PLANEJADA');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail View State
  const [detailedMeeting, setDetailedMeeting] = useState<Meeting | null>(null);

  // Search and Advanced Filters State
  const [filterBU, setFilterBU] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDirector, setFilterDirector] = useState('');
  const [filterParticipant, setFilterParticipant] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');

  // UI state alerts
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [cancelWarningId, setCancelWarningId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canEdit = userRole === 'Administrador' || userRole === 'Editor';

  // Monitor external editing request from dashboard or planner
  useEffect(() => {
    if (activeEditingMeeting) {
      handleOpenWithMeeting(activeEditingMeeting);
      onClearActiveEditing(); // clear immediately in app after load
    }
  }, [activeEditingMeeting]);

  const handleOpenWithMeeting = (m: Meeting) => {
    setEditingMeetingId(m.id);
    setMeetingType(m.meetingType);
    setBuId(m.businessUnitId);
    setResponsibleDirector(m.responsibleDirector);
    setDateStr(m.date);
    setTimeStr(m.time);
    setLocation(m.location);
    setParticipants(m.participants);
    setEvidenceLink(m.evidenceLink || '');
    setObservationsDecisions(m.observationsDecisions || '');
    setStatus(m.status);
    setAttachments(m.attachments || []);
    setValidationErrors([]);
    setIsFormOpen(true);
    // Smooth scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const syncDirectorFromBU = (selectedBUId: string) => {
    setBuId(selectedBUId);
    const matchedBU = businessUnits.find(bu => bu.id === selectedBUId);
    if (matchedBU) {
      setResponsibleDirector(matchedBU.responsibleDirector);
    }
  };

  // Drag and Drop triggers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(e.target.files);
    }
  };

  // Read files and convert them as virtual persistent local assets
  const processSelectedFiles = (filesList: FileList) => {
    const newAttachments: Attachment[] = [];

    Array.from(filesList).forEach((file) => {
      const reader = new FileReader();
      
      // Setup file reader
      reader.onload = () => {
        const fileBase64 = reader.result as string;
        const freshAttachment: Attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          meetingId: editingMeetingId || 'pending_save',
          fileName: file.name,
          fileUrl: fileBase64,
          fileType: file.type,
          uploadedBy: currentUser.name,
          uploadedAt: new Date().toISOString(),
        };

        setAttachments((prev) => [...prev, freshAttachment]);
      };

      reader.readAsDataURL(file); // Encode file to Base64 in local state
    });

    setSuccessInfo(`Anexo(s) carregado(s) com sucesso na memória local.`);
    setTimeout(() => setSuccessInfo(null), 3500);
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter(att => att.id !== attId));
  };

  // Submit main register form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setSuccessInfo(null);

    const errors: string[] = [];

    // CORE RULE: Clean trimmed states
    const trimmedDirector = responsibleDirector.trim();
    const trimmedLocation = location.trim();
    const trimmedParticipants = participants.trim();
    const trimmedEvidence = evidenceLink.trim();
    const trimmedDesc = observationsDecisions.trim();

    // 1. Mandatory fields for ALL meetings
    if (!buId) {
      errors.push('O campo "Unidade de Negócio (BU)" é obrigatório.');
    }
    if (!trimmedDirector) {
      errors.push('O campo "Diretor Responsável" é obrigatório.');
    }
    if (!dateStr) {
      errors.push('O campo "Data" é obrigatório.');
    }
    if (!timeStr) {
      errors.push('O campo "Hora" é obrigatório.');
    }
    if (!trimmedParticipants) {
      errors.push('O campo "Participantes" é obrigatório.');
    }

    // 2. Mandatory constraints to lock a meeting as "REALIZADA" (Completed/Realized)
    const targetStatus = status;
    if (targetStatus === 'REALIZADA') {
      if (!trimmedDesc) {
        errors.push('Para registrar a reunião como REALIZADA é obrigatório preencher "Observações / Decisões" (Ata da reunião).');
      }
      if (!trimmedParticipants) {
        errors.push('Para registrar a reunião como REALIZADA é obrigatório preencher a listagem de "Participantes".');
      }
      if (!dateStr || !timeStr) {
        errors.push('Data e hora finais devem estar preenchidas antes de consolidar a ata.');
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      // scroll to errors
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    const matchedBU = businessUnits.find(bu => bu.id === buId);
    const buName = matchedBU ? matchedBU.name : '';

    if (editingMeetingId) {
      const origMeeting = meetings.find(m => m.id === editingMeetingId);
      let adjustedStatus = targetStatus;

      // Rule: "Ao acessar uma reunião planejada, o usuário poderá preencher os dados finais... ao salvar o formulário de realização, o status deverá mudar automaticamente para REALIZADA."
      // If the meeting was PLANEJADA and user edits it, saving can automatically transition it to REALIZADA if decisions are written or if status wasn't cancelled.
      if (origMeeting && origMeeting.status === 'PLANEJADA' && trimmedDesc.length > 10 && targetStatus === 'PLANEJADA') {
        adjustedStatus = 'REALIZADA';
      }

      onUpdateMeeting(editingMeetingId, {
        meetingType,
        businessUnitId: buId,
        businessUnitName: buName,
        responsibleDirector: trimmedDirector,
        date: dateStr,
        time: timeStr,
        location: trimmedLocation || 'Sala Corporativa',
        participants: trimmedParticipants,
        evidenceLink: trimmedEvidence,
        observationsDecisions: trimmedDesc,
        status: adjustedStatus,
        attachments,
        completedAt: adjustedStatus === 'REALIZADA' ? new Date().toISOString() : undefined,
      });

      setSuccessInfo(`Reunião e ata salvas com sucesso. Status definitivo: ${adjustedStatus}.`);
    } else {
      onAddMeeting({
        meetingType,
        businessUnitId: buId,
        businessUnitName: buName,
        responsibleDirector: trimmedDirector,
        date: dateStr,
        time: timeStr,
        location: trimmedLocation || 'Sala Corporativa',
        participants: trimmedParticipants,
        evidenceLink: trimmedEvidence,
        observationsDecisions: trimmedDesc,
        status: targetStatus,
        attachments,
        source: 'DIRECT_REGISTRATION',
        createdBy: currentUser.name,
      });

      setSuccessInfo(`Reunião criada diretamente com status "${targetStatus}".`);
    }

    // Reset Form
    handleCloseForm();
    setTimeout(() => setSuccessInfo(null), 4000);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMeetingId(null);
    setMeetingType('Reunião de resultados mensais');
    setBuId('');
    setResponsibleDirector('');
    setDateStr('');
    setTimeStr('');
    setLocation('');
    setParticipants('');
    setEvidenceLink('');
    setObservationsDecisions('');
    setStatus('PLANEJADA');
    setAttachments([]);
    setValidationErrors([]);
  };

  // Prevent accidental loss of edits: "impedir perda acidental de informações ao editar uma reunião"
  const handleAttemptClose = () => {
    const isDirty = buId || responsibleDirector || dateStr || timeStr || participants || observationsDecisions;
    if (isDirty && editingMeetingId) {
      const confirmDiscard = window.confirm('Você possui alterações não gravadas nesta reunião. Tem certeza que deseja descartar e fechar?');
      if (!confirmDiscard) return;
    }
    handleCloseForm();
  };

  // Table Row cancel / delete actions
  const handleCancelMeeting = (id: string) => {
    onUpdateMeeting(id, { status: 'CANCELADA' });
    setSuccessInfo('O status da reunião foi alterado para: CANCELADA.');
    setCancelWarningId(null);
    setTimeout(() => setSuccessInfo(null), 4000);
  };

  const handleDeleteMeeting = (id: string) => {
    onDeleteMeeting(id);
    setSuccessInfo('Registro de reunião deletado do repositório corporativo.');
    setDeleteConfirmId(null);
    setTimeout(() => setSuccessInfo(null), 4000);
  };

  // Clear all filters fast
  const clearAllFilters = () => {
    setFilterBU('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterType('');
    setFilterStatus('');
    setFilterDirector('');
    setFilterParticipant('');
    setFilterKeyword('');
  };

  // Applied Advanced Filtering Logic
  const filteredMeetings = meetings.filter((m) => {
    // 1. BU match
    if (filterBU && m.businessUnitId !== filterBU) return false;
    
    // 2. Date intervals
    if (filterStartDate && m.date < filterStartDate) return false;
    if (filterEndDate && m.date > filterEndDate) return false;

    // 3. Meeting Type
    if (filterType && m.meetingType !== filterType) return false;

    // 4. Status match
    if (filterStatus && m.status !== filterStatus) return false;

    // 5. Director responsbile (insensitive matching)
    if (filterDirector && !m.responsibleDirector.toLowerCase().includes(filterDirector.toLowerCase())) return false;

    // 6. Participants list matching
    if (filterParticipant && !m.participants.toLowerCase().includes(filterParticipant.toLowerCase())) return false;

    // 7. Memo / Decisions Keyword search
    if (filterKeyword && !m.observationsDecisions.toLowerCase().includes(filterKeyword.toLowerCase())) return false;

    return true;
  });

  // Helpers
  const formatBRADate = (d: string) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const selectActiveBUs = businessUnits.filter(bu => bu.status === 'Ativa');

  return (
    <div className="space-y-6 animate-fadeIn" id="meetings-register-view">
      {/* Header title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-[#007A38]" />
            Registro Oficial e Atas de Reuniões
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Catálogo unificado de reuniões planejadas, realizadas e atas assinadas com governança corporativa.
          </p>
        </div>
        {canEdit && !isFormOpen && (
          <button
            onClick={() => {
              setIsFormOpen(true);
              setValidationErrors([]);
            }}
            className="px-4 py-2.5 bg-[#007A38] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            id="btn-trigger-new-register"
          >
            <Plus className="w-4 h-4" /> Registrar Nova Reunião
          </button>
        )}
      </div>

      {successInfo && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-sm text-emerald-800 flex items-center gap-3 animate-fadeIn" id="success-banner">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successInfo}</span>
        </div>
      )}

      {/* Main Form Drawer (Edit or Create) */}
      {isFormOpen && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 relative overflow-hidden animate-slideDown" id="meeting-main-form">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#007A38]" />
          
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded bg-[#007A38]/10 text-[#007A38]">
                <FileText className="w-4.5 h-4.5" />
              </span>
              <h3 className="font-black text-slate-800 text-base">
                {editingMeetingId ? 'Realização e Assinatura de Ata de Reunião' : 'Registrar Nova Reunião'}
              </h3>
            </div>
            <button 
              onClick={handleAttemptClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {validationErrors.length > 0 && (
            <div className="mb-5 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 font-sans text-xs text-red-900 space-y-1">
              <span className="font-bold block text-sm text-red-800 flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-4.5 h-4.5" /> Erros de preenchimento encontrados:
              </span>
              {validationErrors.map((err, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          {/* Form Structure */}
          <form onSubmit={handleFormSubmit} className="space-y-6" id="register-meeting-form">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box 1 (Core Fields) */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1">
                  <BuilderSubHeader title="1. Dados de Controle" />
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Tipo de Reunião *
                  </label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all font-medium"
                  >
                    <option value="Reunião de resultados mensais">Reunião de resultados mensais</option>
                    <option value="Reunião Quadrimestral - Reforecast">Reunião Quadrimestral - Reforecast</option>
                    <option value="FUPs com Equipes">FUPs com Equipes</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Unidade de Negócio (BU) *
                  </label>
                  <select
                    required
                    value={buId}
                    onChange={(e) => syncDirectorFromBU(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all font-medium"
                  >
                    <option value="">Selecione a Unidade de Negócio...</option>
                    {/* Render active ones, but if is editing, keep current one in selection as fallback even if inactive */}
                    {businessUnits.map((bu) => (
                      <option 
                        key={bu.id} 
                        value={bu.id} 
                        disabled={bu.status === 'Inativa' && buId !== bu.id}
                      >
                        {bu.name} {bu.status === 'Inativa' ? ' (Inativa)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Diretor Responsável *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      required
                      value={responsibleDirector}
                      onChange={(e) => setResponsibleDirector(e.target.value)}
                      placeholder="Identificar diretor"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Definir Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MeetingStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all font-bold"
                  >
                    <option value="PLANEJADA">🟡 PLANEJADA</option>
                    <option value="REALIZADA">🟢 REALIZADA</option>
                    <option value="CANCELADA">🔴 CANCELADA</option>
                  </select>
                </div>
              </div>

              {/* Box 2 (Chronology & Location) */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1">
                  <BuilderSubHeader title="2. Local & Calendário" />
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Data Reunião *
                    </label>
                    <input
                      type="date"
                      required
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Hora Reunião *
                    </label>
                    <input
                      type="time"
                      required
                      value={timeStr}
                      onChange={(e) => setTimeStr(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Localização Física / Videoconferência
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Auditório Matriz ou Link do Zoom"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Lista de Participantes (Separe por vírgula) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder="Ex: Jorge Cabral, Dr. Marcos Lins, Renata de Assis..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all resize-none"
                  />
                  {status === 'REALIZADA' && !participants.trim() && (
                    <span className="text-[10px] text-red-600 font-bold block mt-1">⚠️ Obrigatório para reuniões já realizadas.</span>
                  )}
                </div>
              </div>

              {/* Box 3 (Decisions, Links and evidence drop/selection) */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1">
                  <BuilderSubHeader title="3. Ata & Coleta de Evidências" />
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Redigir Atas, Observações e Decisões
                  </label>
                  <textarea
                    rows={4}
                    value={observationsDecisions}
                    onChange={(e) => setObservationsDecisions(e.target.value)}
                    placeholder="Escreva detalhadamente o escopo debatido, compromissos acordados e metas assinadas..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all resize-none"
                  />
                  {status === 'REALIZADA' && !observationsDecisions.trim() && (
                    <span className="text-[10px] text-red-600 font-bold block mt-1">⚠️ É obrigatório redigir as decisões para salvar como REALIZADA.</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5" /> Link de Evidências (URL)
                  </label>
                  <input
                    type="url"
                    value={evidenceLink}
                    onChange={(e) => setEvidenceLink(e.target.value)}
                    placeholder="Ex: https://sharepoint.agemar.com.br/atas/reuniao_42"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Custom Drag & Drop File Upload Panel */}
            <div className="border-t border-slate-100 pt-5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Paperclip className="w-4 h-4 text-[#007A38]" /> Anexar Documentos de Evidência Física (PDF, Imagens, Notas de Assinatura, Planilhas)
              </label>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Drag zone (col span 7) */}
                <div 
                  className={`md:col-span-7 border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer select-none min-h-[110px] ${
                    isDragging 
                      ? 'border-[#007A38] bg-[#007A38]/5 scale-[0.99]' 
                      : 'border-slate-300 hover:border-[#007A38] hover:bg-slate-50/60'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  id="drag-and-drop-zone"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    multiple
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt"
                    className="hidden" 
                  />
                  <Paperclip className={`w-8 h-8 mb-2 ${isDragging ? 'text-[#007A38] animate-bounce' : 'text-slate-400'}`} />
                  <p className="text-xs font-bold text-slate-700">
                    Arraste os arquivos aqui para anexar, ou <span className="text-[#007A38] underline">clique para selecionar do computador</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    Formatos suportados: PDF, DOCX, XLSX, PNG, JPG, TXT (Gravados na memória do navegador)
                  </p>
                </div>

                {/* Attachments preview list (col span 5) */}
                <div className="md:col-span-5 border border-slate-200 rounded-xl bg-slate-50/50 p-4 min-h-[110px]">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">
                    Anexos Carregados ({attachments.length})
                  </span>

                  {attachments.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-6 text-center text-xs text-slate-400">
                      Nenhum anexo integrado a esta ata.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1">
                      {attachments.map((att) => (
                        <div 
                          key={att.id} 
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <File className="w-4 h-4 text-[#007A38] shrink-0" />
                            <span className="font-medium text-slate-700 truncate block" title={att.fileName}>
                              {att.fileName}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer shrink-0"
                            title="Remover anexo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form footer actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 italic">
                {editingMeetingId ? 'Modificando ata corporativa ativa' : 'Registrando em regime de diretório logístico'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAttemptClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar / Voltar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#007A38] hover:bg-emerald-800 text-white text-xs font-black rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {editingMeetingId ? 'Atualizar e Gravar Ata' : 'Salvar Reunião'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Advanced Filters Panel (Surgical Search Accordion) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" id="meetings-filter-bar">
        <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-4 flex items-center gap-2 select-none">
          <Sliders className="w-4 h-4 text-[#007A38]" />
          Filtros de Busca e Rastreabilidade
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Unidade de Negócio (BU)
            </label>
            <select
              value={filterBU}
              onChange={(e) => setFilterBU(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007A38]/30 focus:border-[#007A38] transition-all font-medium"
            >
              <option value="">Todas as BUs...</option>
              {businessUnits.map((bu) => (
                <option key={bu.id} value={bu.id}>
                  {bu.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tipo de Reunião
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007A38]/30 focus:border-[#007A38] transition-all font-medium"
            >
              <option value="">Todas as categorias...</option>
              <option value="Reunião de resultados mensais">Reunião de resultados mensais</option>
              <option value="Reunião Quadrimestral - Reforecast">Reunião Quadrimestral - Reforecast</option>
              <option value="FUPs com Equipes">FUPs com Equipes</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status da Reunião
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007A38]/30 focus:border-[#007A38] transition-all font-bold"
            >
              <option value="">Todos os status...</option>
              <option value="PLANEJADA">PLANEJADA</option>
              <option value="REALIZADA">REALIZADA</option>
              <option value="CANCELADA">CANCELADA</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Palavra-chave (Ata/Decisões)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder="Debatedor, meta, logística..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/30 focus:border-[#007A38] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Second Filter row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Data de Início
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007A38]/30 focus:border-[#007A38] transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Data de Fim
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007A38]/30 focus:border-[#007A38] transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Diretor Responsável
            </label>
            <input
              type="text"
              value={filterDirector}
              onChange={(e) => setFilterDirector(e.target.value)}
              placeholder="Nome do diretor..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/30 focus:border-[#007A38] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Nome de Participante
            </label>
            <input
              type="text"
              value={filterParticipant}
              onChange={(e) => setFilterParticipant(e.target.value)}
              placeholder="Nome do participante..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/30 focus:border-[#007A38] transition-all"
            />
          </div>
        </div>

        {/* Clear indicators trigger */}
        {(filterBU || filterStartDate || filterEndDate || filterType || filterStatus || filterDirector || filterParticipant || filterKeyword) && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-500">
              Filtro ativo: Corresponde a <strong className="text-slate-850">{filteredMeetings.length}</strong> de <strong className="text-slate-850">{meetings.length}</strong> reuniões.
            </span>
            <button 
              onClick={clearAllFilters}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Limpar Todos os Filtros
            </button>
          </div>
        )}
      </div>

      {/* Main Grid List table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" id="meetings-list-box">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="meetings-grid-table">
            <thead>
              <tr className="bg-slate-55 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Tipo de Reunião</th>
                <th className="py-3 px-4">Unidade (BU)</th>
                <th className="py-3 px-4">Diretor Resp.</th>
                <th className="py-3 px-4">Data & Horário</th>
                <th className="py-3 px-4">Local</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Origem</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-xs">
              {filteredMeetings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs font-semibold">
                    Nenhuma reunião encontrada com os critérios informados.
                  </td>
                </tr>
              ) : (
                filteredMeetings
                  .sort((a,b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
                  .map((m) => {
                    const isOverdue = m.status === 'PLANEJADA' && m.date < '2026-06-15';
                    return (
                      <tr 
                        key={m.id} 
                        className={`hover:bg-slate-50/50 transition-colors ${
                          m.status === 'CANCELADA' ? 'opacity-60 bg-slate-55/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-800">{m.meetingType}</div>
                          {m.attachments?.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-50 text-[#007A38] border border-emerald-100 rounded px-1.5 py-0.5 mt-1 font-bold">
                              <Paperclip className="w-2.5 h-2.5" /> {m.attachments.length} anexo(s)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-700">{m.businessUnitName}</td>
                        <td className="py-3 px-4 font-medium text-slate-600">{m.responsibleDirector}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{formatBRADate(m.date)}</div>
                          <div className="text-[10px] text-slate-450 flex items-center gap-1 mt-0.5 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" /> {m.time}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-[150px] truncate" title={m.location}>
                          {m.location}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase text-center select-none ${
                            m.status === 'REALIZADA' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : m.status === 'PLANEJADA' 
                                ? isOverdue 
                                  ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-200 text-slate-600 border border-slate-350'
                          }`}>
                            {m.status} {isOverdue ? ' (ATRASADA)' : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[9px] font-mono uppercase bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                            {m.source === 'PLANNING' ? 'Planejador' : 'Registro Dir.'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Detailed viewer */}
                            <button
                              onClick={() => setDetailedMeeting(m)}
                              className="p-1 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                              title="Visualizar Detalhes e Ata"
                            >
                              <Eye className="w-3.5 h-3.5" /> Detalhes
                            </button>

                            {/* Operational actions if user is manager */}
                            {canEdit && (
                              <>
                                <button
                                  onClick={() => handleOpenWithMeeting(m)}
                                  className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                                  title="Editar Reunião"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {m.status !== 'CANCELADA' && (
                                  cancelWarningId === m.id ? (
                                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 p-1 rounded animate-fadeIn shrink-0">
                                      <span className="text-[8px] font-bold text-amber-800">Cancelar?</span>
                                      <button 
                                        onClick={() => handleCancelMeeting(m.id)}
                                        className="py-0.5 px-1 bg-amber-600 text-white font-bold text-[9px] rounded-sm shrink-0 cursor-pointer"
                                      >
                                        Sim
                                      </button>
                                      <button 
                                        onClick={() => setCancelWarningId(null)}
                                        className="py-0.5 px-1 bg-slate-200 text-slate-700 font-bold text-[9px] rounded-sm shrink-0 cursor-pointer"
                                      >
                                        Não
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setCancelWarningId(m.id)}
                                      className="p-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                                      title="Cancelar Reunião"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  )
                                )}

                                {userRole === 'Administrador' && (
                                  deleteConfirmId === m.id ? (
                                    <div className="flex items-center gap-1 bg-red-50 border border-red-200 p-1 rounded animate-fadeIn shrink-0">
                                      <span className="text-[8px] font-bold text-red-800">Excluir?</span>
                                      <button 
                                        onClick={() => handleDeleteMeeting(m.id)}
                                        className="py-0.5 px-1 bg-red-600 text-white font-bold text-[9px] rounded-sm shrink-0 cursor-pointer"
                                      >
                                        Sim
                                      </button>
                                      <button 
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="py-0.5 px-1 bg-slate-200 text-slate-700 font-bold text-[9px] rounded-sm shrink-0 cursor-pointer"
                                      >
                                        Não
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setDeleteConfirmId(m.id)}
                                      className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                      title="Apagar Registro Definitivo"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED MEETING DIALOG (Modal view) */}
      {detailedMeeting && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4" id="meeting-details-overlay">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 relative overflow-hidden animate-scaleIn">
            {/* Top decorative bar */}
            <div className={`absolute top-0 left-0 right-0 h-2 ${
              detailedMeeting.status === 'REALIZADA' 
                ? 'bg-emerald-500' 
                : detailedMeeting.status === 'PLANEJADA' 
                  ? 'bg-amber-400' 
                  : 'bg-slate-400'
            }`} />

            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4 mt-1">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Registro ID: {detailedMeeting.id} • Fonte {detailedMeeting.source}
                </span>
                <h3 className="text-lg font-black text-slate-800 tracking-tight mt-0.5 text-[#007A38]">
                  {detailedMeeting.meetingType}
                </h3>
              </div>
              <button 
                onClick={() => setDetailedMeeting(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mt-3">
              <div className="space-y-2 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Unidade de Negócio (BU)</span>
                  <p className="font-bold text-slate-800">{detailedMeeting.businessUnitName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Diretoria Responsável</span>
                  <p className="font-bold text-slate-800">{detailedMeeting.responsibleDirector}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Localidade Assinalada</span>
                  <p className="font-medium text-slate-700">{detailedMeeting.location || 'Sala corporativa'}</p>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Data do Evento</span>
                  <p className="font-bold text-slate-800">{formatBRADate(detailedMeeting.date)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Foco de Horário</span>
                  <p className="font-bold text-slate-750 font-mono">{detailedMeeting.time}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Status Atual</span>
                  <p className="font-black mt-0.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase ${
                      detailedMeeting.status === 'REALIZADA' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : detailedMeeting.status === 'PLANEJADA' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {detailedMeeting.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              {/* Participants */}
              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Participantes Ativos</span>
                <p className="text-slate-755 font-medium leading-relaxed mt-1">{detailedMeeting.participants}</p>
              </div>

              {/* Decisions Box */}
              <div className="bg-emerald-50/15 border border-emerald-100 p-3.5 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#007A38] tracking-wider block border-b border-emerald-100 pb-1">
                  📝 Decisões Assinadas e Pauta da Reunião
                </span>
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed mt-2.5">
                  {detailedMeeting.observationsDecisions || (
                    <span className="italic text-slate-400">Ata de pauta pendente de lavratura. Esta reunião está com o status PLANEJADA.</span>
                  )}
                </p>
              </div>

              {/* Links & evidence references */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-5">
                <div>
                  {detailedMeeting.evidenceLink ? (
                    <a 
                      href={detailedMeeting.evidenceLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#007A38] hover:underline font-bold text-xs"
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> Acessar Repositório de Evidências Original
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs italic">Nenhum repositório de evidência externo cadastrado.</span>
                  )}
                </div>

                <div className="text-[10px] text-slate-400">
                  Criado por: <strong>{detailedMeeting.createdBy || 'Sistema'}</strong>
                </div>
              </div>

              {/* Attachments panel */}
              {detailedMeeting.attachments && detailedMeeting.attachments.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-slate-150">
                  <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider block mb-2">
                    🖇️ Evidências Físicas Anexadas ({detailedMeeting.attachments.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {detailedMeeting.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        download={att.fileName}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-slate-700 text-xs transition-colors shrink-0 max-w-[240px]"
                        title="Clique para baixar a evidência física"
                      >
                        <File className="w-3.5 h-3.5 text-[#007A38]" />
                        <span className="truncate font-medium">{att.fileName}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
              {canEdit && (
                <button
                  onClick={() => {
                    handleOpenWithMeeting(detailedMeeting);
                    setDetailedMeeting(null);
                  }}
                  className="px-4 py-2 bg-[#007A38] hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Modificar Esta Ata
                </button>
              )}
              <button
                onClick={() => setDetailedMeeting(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Helper subcomponents
function BuilderSubHeader({ title }: { title: string }) {
  return (
    <span className="text-slate-800 font-black text-[11px] tracking-widest uppercase block mb-1">
      {title}
    </span>
  );
}
