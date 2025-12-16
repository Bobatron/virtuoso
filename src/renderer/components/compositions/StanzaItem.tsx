import React from 'react';
import type { ReactElement } from 'react';
import type { Stanza, StanzaType } from '../../../types/composition';

interface StanzaItemProps {
  stanza: Stanza;
  index: number;
}

const emojiMap: Record<StanzaType, string> = {
  connect: '🔗',
  disconnect: '🔌',
  send: '📤',
  cue: '⏱️',
  assert: '✅',
};

function formatDescription(stanza: Stanza): string {
  switch (stanza.type) {
    case 'connect':
      return `${stanza.accountAlias} connects`;
    case 'disconnect':
      return `${stanza.accountAlias} disconnects`;
    case 'send':
      return `${stanza.accountAlias} sends stanza`;
    case 'cue':
      return `Wait for response`;
    case 'assert':
      return `Assert condition`;
    default:
      return stanza.description;
  }
}

export function StanzaItem({ stanza, index }: StanzaItemProps): ReactElement {
  const emoji = emojiMap[stanza.type] || '📋';

  return (
    <div className={`stanza-item stanza-${stanza.type}`}>
      <span className="stanza-index">{index}</span>
      <span className="stanza-emoji">{emoji}</span>
      <span className="stanza-description">{formatDescription(stanza)}</span>
    </div>
  );
}
