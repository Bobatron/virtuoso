import React from 'react';
import type { ReactElement } from 'react';
import type { Stanza } from '../../../types/composition';
import { StanzaItem } from './StanzaItem';

interface ComposerPanelProps {
  stanzas: Stanza[];
  onStop: () => void;
  onCancel: () => void;
}

export function ComposerPanel({ stanzas, onStop, onCancel }: ComposerPanelProps): ReactElement {
  return (
    <div className="composer-panel">
      <div className="composer-indicator">
        🔴 Recording...
      </div>

      <div className="composer-stanzas">
        {stanzas.length === 0 ? (
          <div className="composer-empty">
            <p className="title">No actions yet</p>
            <p className="hint">Connect, send stanzas, and disconnect to capture them.</p>
          </div>
        ) : (
          stanzas.map((stanza, index) => (
            <StanzaItem key={stanza.id} stanza={stanza} index={index + 1} />
          ))
        )}
      </div>

      <div className="composer-actions">
        <button className="btn-primary" onClick={onStop} disabled={stanzas.length === 0}>
          💾 Stop & Save
        </button>
        <button className="btn-secondary" onClick={onCancel}>
          🗑️ Cancel
        </button>
      </div>
    </div>
  );
}
