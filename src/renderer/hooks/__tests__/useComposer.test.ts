import {
  composerReducer,
  initialComposerState,
  buildPerformanceFromState,
  generateStanzaId,
  generatePerformanceId,
} from '../useComposer';
import type { ComposerState } from '../useComposer';

describe('composerReducer', () => {
  it('starts composing', () => {
    const next = composerReducer(initialComposerState, { type: 'START' });
    expect(next.isComposing).toBe(true);
    expect(next.stanzas).toHaveLength(0);
  });

  it('adds stanzas while composing and tracks accounts', () => {
    const started = composerReducer(initialComposerState, { type: 'START' });
    const stanza = {
      id: generateStanzaId(),
      type: 'connect' as const,
      accountAlias: 'alice',
      description: 'Connect',
      data: { type: 'connect' as const },
    };
    const next = composerReducer(started, {
      type: 'ADD_STANZA',
      stanza,
      account: { alias: 'alice', jid: 'alice@example.com' },
    });
    expect(next.stanzas).toHaveLength(1);
    expect(next.accounts.get('alice')?.jid).toBe('alice@example.com');
  });

  it('ignores stanza additions when not composing', () => {
    const stanza = {
      id: generateStanzaId(),
      type: 'connect' as const,
      accountAlias: 'alice',
      description: 'Connect',
      data: { type: 'connect' as const },
    };
    const next = composerReducer(initialComposerState, {
      type: 'ADD_STANZA',
      stanza,
      account: { alias: 'alice', jid: 'alice@example.com' },
    });
    expect(next.stanzas).toHaveLength(0);
  });

  it('cancels composing and clears state', () => {
    const started = composerReducer(initialComposerState, { type: 'START' });
    const cancelled = composerReducer(started, { type: 'CANCEL' });
    expect(cancelled.isComposing).toBe(false);
    expect(cancelled.stanzas).toHaveLength(0);
  });
});

describe('buildPerformanceFromState', () => {
  it('returns null when not composing or no stanzas', () => {
    expect(buildPerformanceFromState(initialComposerState)).toBeNull();
  });

  it('builds a performance with ids and accounts', () => {
    const state: ComposerState = {
      isComposing: true,
      startTime: Date.now(),
      stanzas: [
        {
          id: generateStanzaId(),
          type: 'send',
          accountAlias: 'alice',
          description: 'Send',
          data: { type: 'send', xml: '<a />' },
        },
      ],
      accounts: new Map([
        ['alice', { alias: 'alice', jid: 'alice@example.com' }],
      ]),
    };

    const perf = buildPerformanceFromState(state);
    expect(perf).not.toBeNull();
    expect(perf?.id.startsWith('perf_')).toBe(true);
    expect(perf?.stanzas).toHaveLength(1);
    expect(perf?.accounts[0]?.alias).toBe('alice');
    expect(perf?.version).toBe('1.0.0');
  });
});

describe('id generators', () => {
  it('generate unique-ish ids', () => {
    const id1 = generateStanzaId();
    const id2 = generateStanzaId();
    expect(id1).not.toBe(id2);

    const perf1 = generatePerformanceId();
    const perf2 = generatePerformanceId();
    expect(perf1).not.toBe(perf2);
  });
});
