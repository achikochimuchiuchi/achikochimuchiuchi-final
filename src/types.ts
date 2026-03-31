/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Severity = 1 | 2 | 3 | 4 | 5;

export type RecordStatus = 'investigating' | 'archived' | 'resolved' | 'critical';

export interface InactionRecord {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  status: RecordStatus;
  severity: Severity;
  tags: string[];
  location?: string;
  evidenceCount: number;
  authorUid: string;
  createdAt: any;
}

export type MisconductType = 'corruption' | 'fraud' | 'cover-up' | 'harassment' | 'other';

export interface MisconductRecord {
  id: string;
  title: string;
  date: string;
  type: MisconductType;
  organization: string;
  description: string;
  status: 'under-investigation' | 'disciplinary-action' | 'legal-action' | 'closed';
  severity: Severity;
  involvedParties: string[];
  penalty?: string;
  authorUid: string;
  createdAt: any;
}
