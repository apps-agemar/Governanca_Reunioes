/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BusinessUnit, BUStatus } from '../types';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Check, 
  AlertTriangle, 
  FileText, 
  User, 
  CornerDownRight,
  ShieldCheck
} from 'lucide-react';

interface BusinessUnitManagerProps {
  businessUnits: BusinessUnit[];
  onAddBU: (bu: Omit<BusinessUnit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateBU: (id: string, bu: Partial<BusinessUnit>) => void;
  onDeleteBU: (id: string) => boolean | Promise<boolean>;
  userRole: 'Administrador' | 'Editor' | 'Visualizador';
}

export default function BusinessUnitManager({
  businessUnits,
  onAddBU,
  onUpdateBU,
  onDeleteBU,
  userRole,
}: BusinessUnitManagerProps) {
  // Local states for inputs
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [responsibleDirector, setResponsibleDirector] = useState('');
  const [status, setStatus] = useState<BUStatus>('Ativa');
  const [observations, setObservations] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');

  // Feedback states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const canEdit = userRole === 'Administrador' || userRole === 'Editor';

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    // Validations
    if (!name.trim()) {
      setErrorMsg('O Nome da Unidade de Negócio (BU) é obrigatório.');
      return;
    }
    if (!responsibleDirector.trim()) {
      setErrorMsg('O Diretor Responsável é obrigatório.');
      return;
    }

    if (isEditing) {
      onUpdateBU(isEditing, {
        name: name.trim(),
        code: code.trim(),
        responsibleDirector: responsibleDirector.trim(),
        status,
        observations: observations.trim(),
      });
      setSuccessMsg(`Unidade de Negócio "${name}" atualizada com sucesso.`);
      setIsEditing(null);
    } else {
      // Check for code duplication to maintain indexing clean
      if (code.trim() && businessUnits.some(bu => bu.code.toLowerCase() === code.trim().toLowerCase())) {
        setErrorMsg(`Já existe outra BU com o código "${code}". Por favor use um código exclusivo.`);
        return;
      }

      onAddBU({
        name: name.trim(),
        code: code.trim(),
        responsibleDirector: responsibleDirector.trim(),
        status,
        observations: observations.trim(),
      });
      setSuccessMsg(`Unidade de Negócio "${name}" cadastrada com de sucesso.`);
    }

    // Reset fields
    setName('');
    setCode('');
    setResponsibleDirector('');
    setStatus('Ativa');
    setObservations('');

    // Clear message after layout timer
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Turn edit mode on
  const handleStartEdit = (bu: BusinessUnit) => {
    if (!canEdit) return;
    setIsEditing(bu.id);
    setName(bu.name);
    setCode(bu.code);
    setResponsibleDirector(bu.responsibleDirector);
    setStatus(bu.status);
    setObservations(bu.observations);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditing(null);
    setName('');
    setCode('');
    setResponsibleDirector('');
    setStatus('Ativa');
    setObservations('');
    setErrorMsg(null);
  };

  // Perform delete command
  const handleDelete = async (id: string, buName: string) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    const wasDeleted = await onDeleteBU(id);
    if (wasDeleted) {
      setSuccessMsg(`Unidade de Negócio "${buName}" excluída com sucesso.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      // If references exist, we cannot delete - we suggest inverting status instead
      setErrorMsg(`Não é possível excluir a BU "${buName}" pois existem reuniões (planejadas ou realizadas) vinculadas a ela. Sugerimos alterar o status para "Inativa" para prevenir novos registros.`);
    }
    setShowDeleteConfirm(null);
  };

  // Filter logic
  const filteredBUs = businessUnits.filter(bu => {
    const q = searchQuery.toLowerCase();
    return (
      bu.name.toLowerCase().includes(q) ||
      bu.code.toLowerCase().includes(q) ||
      bu.responsibleDirector.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn" id="bu-management-view">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[#007A38]" />
          Cadastro de Unidades de Negócio (BU)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie as divisões corporativas do Grupo Agemar, definindo diretores responsáveis e regras de conformidade.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-sm text-emerald-800 flex items-center gap-3 animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg text-sm text-red-800 flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Ação Não Permitida / Erro</span>
            <p className="mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Input Form (Card) (Col span 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden" id="bu-form-card">
            {/* Top Indicator */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#007A38]" />

            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-1.5">
              {isEditing ? (
                <>
                  <Edit3 className="w-4 h-4 text-emerald-700" />
                  Editar Unidade de Negócio
                </>
              ) : (
                <>
                  <Plus className="w-4.5 h-4.5 text-[#007A38]" />
                  Nova Unidade de Negócio
                </>
              )}
            </h3>

            {!canEdit ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-500 text-center leading-relaxed">
                🔒 Seu papel de usuário no domínio corporativo é <strong>{userRole}</strong>. 
                Apenas usuários com permissões de <strong>Administrador</strong> ou <strong>Editor</strong> podem registrar ou modificar BUs.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" id="bu-form">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nome da BU *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Agemar Logística"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Código da BU (Opcional)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex: BU-LOG"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all"
                  />
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
                      placeholder="Ex: Dr. Jorge de Souza"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Status da BU
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BUStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all"
                  >
                    <option value="Ativa">🟢 Ativa</option>
                    <option value="Inativa">🔴 Inativa (Não disponível em planners)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Observações gerais
                  </label>
                  <textarea
                    rows={3}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Notas adicionais sobre o escopo ou diretoria..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/50 focus:border-[#007A38] bg-white transition-all resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-slate-100 dark:hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#007A38] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    {isEditing ? 'Atualizar BU' : 'Cadastrar Unidade'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: BU List (Col span 8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por nome, código ou diretor..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A38]/30 focus:border-[#007A38] transition-all"
              />
            </div>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold shrink-0 cursor-pointer"
              >
                Limpar
              </button>
            )}
            <div className="text-[11px] font-bold text-slate-500 bg-slate-100 rounded-lg px-2.5 py-1.5 shrink-0 select-none">
              {filteredBUs.length} {filteredBUs.length === 1 ? 'BU cadastrada' : 'BUs cadastradas'}
            </div>
          </div>

          {/* BU Grid & Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="bu-cards-grid">
            {filteredBUs.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-400">
                🔍 Nenhum resultado de busca encontrado. Tente um critério diferente.
              </div>
            ) : (
              filteredBUs.map((bu) => (
                <div 
                  key={bu.id}
                  className={`bg-white rounded-xl border relative p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between ${
                    bu.status === 'Inativa' ? 'border-slate-200 bg-slate-50/55 opacity-70' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header: code and state */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                        {bu.code || 'SEM CÓDIGO'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                        bu.status === 'Ativa' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {bu.status}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-[#007A38] text-base leading-snug">{bu.name}</h4>
                    
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-700">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Diretoria</span>
                        <span className="font-bold text-slate-800">{bu.responsibleDirector}</span>
                      </div>
                    </div>

                    {bu.observations && (
                      <div className="mt-4 pt-3.5 border-t border-slate-100/60 text-xs text-slate-500 leading-relaxed flex items-start gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0" />
                        <span className="italic">{bu.observations}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="mt-6 pt-4 border-t border-slate-150 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono select-none">
                      Cod: {bu.id.split('_')[1] || bu.id}
                    </span>

                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(bu)}
                          title="Editar Unidade de Negócio"
                          className="p-1.5 rounded bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-[#007A38] transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        
                        {showDeleteConfirm === bu.id ? (
                          <div className="flex items-center gap-1 bg-red-50 border border-red-200 p-1 rounded">
                            <span className="text-[9px] font-black uppercase text-red-700 px-1">Excluir?</span>
                            <button
                              onClick={() => handleDelete(bu.id, bu.name)}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-800 text-white text-[9px] font-bold rounded cursor-pointer"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-bold rounded cursor-pointer"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowDeleteConfirm(bu.id)}
                            title="Excluir Unidade de Negócio"
                            className="p-1.5 rounded bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
