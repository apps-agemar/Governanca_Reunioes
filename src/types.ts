/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LdapConfig {
  host: string;
  port: number;
  ssl: boolean;
  baseDn: string;
  bindDn: string;
  bindPassword?: string;
  userFilter: string;
}

export type UserRole = 'Administrador' | 'Editor' | 'Visualizador';

export interface User {
  id: string;
  networkLogin: string;
  name: string;
  email: string;
  role: UserRole;
}

export type BUStatus = 'Ativa' | 'Inativa';

export interface BusinessUnit {
  id: string;
  name: string;
  code: string;
  responsibleDirector: string;
  status: BUStatus;
  observations: string;
  createdAt: string;
  updatedAt: string;
}

export type MeetingType =
  | 'Reunião de resultados mensais'
  | 'Reunião Quadrimestral - Reforecast'
  | 'FUPs com Equipes'
  | 'Outros';

export type MeetingStatus = 'PLANEJADA' | 'REALIZADA' | 'CANCELADA';

export type MeetingSource = 'PLANNING' | 'DIRECT_REGISTRATION';

export interface Attachment {
  id: string;
  meetingId: string;
  fileName: string;
  fileUrl: string; // Base64 simulated URL or Object URL
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Meeting {
  id: string;
  meetingType: MeetingType;
  responsibleDirector: string;
  businessUnitId: string;
  businessUnitName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  participants: string; // string listing participants
  evidenceLink?: string;
  attachments: Attachment[];
  observationsDecisions: string;
  status: MeetingStatus;
  source: MeetingSource;
  plannedMeetingId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
