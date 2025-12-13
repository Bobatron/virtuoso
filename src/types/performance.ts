/**
 * Performance data model for recorded XMPP flows
 */

export interface Performance {
  id: string;
  name: string;
  description: string;
  version: string;
  created: string;
  updated: string;
  accounts: AccountReference[];
  stanzas: Stanza[];
  movements?: Movement[];
  variables: Record<string, string>;
  tags: string[];
  author?: string;
}

export interface AccountReference {
  alias: string;
  jid: string;
}

export interface Movement {
  id: string;
  name: string;
  description?: string;
  stanzaIds: string[];
}

export interface Stanza {
  id: string;
  type: StanzaType;
  accountAlias: string;
  description: string;
  data: StanzaData;
  assertions?: Assertion[];
}

export type StanzaType = 'connect' | 'disconnect' | 'send' | 'cue' | 'assert';

export type StanzaData =
  | ConnectData
  | DisconnectData
  | SendData
  | CueData
  | AssertData;

export interface ConnectData {
  type: 'connect';
}

export interface DisconnectData {
  type: 'disconnect';
}

export interface SendData {
  type: 'send';
  xml: string;
  generatedIds?: Record<string, string>;
}

export interface CueData {
  type: 'cue';
  description: string;
  matchType: 'contains' | 'xpath' | 'regex' | 'id';
  matchExpression: string;
  timeout: number;
  correlatedId?: string;
}

export interface AssertData {
  type: 'assert';
  assertionType: 'xpath' | 'contains' | 'regex' | 'equals';
  expression: string;
  expected?: string;
}

export interface Assertion {
  id: string;
  name: string;
  type: 'xpath' | 'contains' | 'regex' | 'equals' | 'exists' | 'count';
  expression: string;
  expected: string | number | boolean;
  negate?: boolean;
}

export interface PlaybackResult {
  performanceId: string;
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
