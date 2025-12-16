import React from 'react';
import type { ReactElement } from 'react';
import { FiPlus, FiPlay, FiEdit2, FiTrash2, FiCircle } from 'react-icons/fi';
import type { Composition, Stanza } from '../../../types/composition';
import { ComposerPanel } from './ComposerPanel';
import { CompositionList } from './CompositionList';

interface CompositionsSidebarProps {
  isComposing: boolean;
  stanzas: Stanza[];
  compositions: Composition[];
  loading: boolean;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  onPlay: (composition: Composition) => void;
  onEdit: (composition: Composition) => void;
  onDelete: (compositionId: string) => void;
}

export function CompositionsSidebar({
  isComposing,
  stanzas,
  compositions,
  loading,
  onStart,
  onStop,
  onCancel,
  onPlay,
  onEdit,
  onDelete,
}: CompositionsSidebarProps): ReactElement {
  return (
    <aside className="compositions-sidebar">
      <div className="compositions-header">
        <h3>Compositions</h3>
        {!isComposing && (
          <button className="compose-button" onClick={onStart} aria-label="Compose New">
            <FiPlus /> Compose New
          </button>
        )}
        {isComposing && (
          <div className="recording-pill" title="Composing">
            <FiCircle className="recording-dot" /> Recording
          </div>
        )}
      </div>

      {isComposing ? (
        <ComposerPanel stanzas={stanzas} onStop={onStop} onCancel={onCancel} />
      ) : (
        <CompositionList
          compositions={compositions}
          loading={loading}
          onPlay={onPlay}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}

      <div className="composition-actions-hint">
        <div className="hint-row"><FiPlay /> Play</div>
        <div className="hint-row"><FiEdit2 /> Edit</div>
        <div className="hint-row"><FiTrash2 /> Delete</div>
      </div>
    </aside>
  );
}
