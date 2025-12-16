/**
 * Performance - the result of the Conductor playing a Composition.
 * Contains timing, pass/fail status, captured responses, assertion results.
 */

// Re-export composition types for convenience
export type {
  Composition,
  AccountReference,
  Movement,
  Stanza,
  StanzaType,
  StanzaData,
  ConnectData,
  DisconnectData,
  SendData,
  CueData,
  AssertData,
  Assertion,
} from './composition';

/**
 * Performance represents the outcome of running a Composition.
 */
export interface Performance {
  id: string;
  compositionId: string;
  status: 'passed' | 'failed' | 'error' | 'stopped';
  startTime: string;
  endTime: string;
  duration: number;
  stanzaResults: StanzaResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

export interface StanzaResult {
  stanzaId: string;
  status: 'passed' | 'failed' | 'error' | 'skipped';
  duration: number;
  sentXml?: string;
  receivedXml?: string;
  assertionResults?: AssertionResult[];
  error?: {
    message: string;
    details?: string;
  };
}

export interface AssertionResult {
  assertionId: string;
  passed: boolean;
  actual?: string;
  expected?: string;
  error?: string;
}
