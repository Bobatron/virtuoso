import React from 'react';
import type { ReactElement } from 'react';
import { FiPlay, FiEdit2, FiTrash2 } from 'react-icons/fi';
import type { Composition } from '../../../types/composition';

interface CompositionListProps {
  compositions: Composition[];
  loading: boolean;
  onPlay: (composition: Composition) => void;
  onEdit: (composition: Composition) => void;
  onDelete: (compositionId: string) => void;
}

export function CompositionList({ compositions, loading, onPlay, onEdit, onDelete }: CompositionListProps): ReactElement {
  if (loading) {
    return <div className="composition-list loading">Loading compositions...</div>;
  }

  if (!compositions || compositions.length === 0) {
    return (
      <div className="composition-list empty">
        <p className="empty-title">No compositions yet</p>
        <p className="empty-hint">Click "Compose New" to record one.</p>
      </div>
    );
  }

  return (
    <div className="composition-list">
      {compositions.map((composition) => (
        <div key={composition.id} className="composition-item">
          <div className="composition-item-info">
            <div className="composition-name">{composition.name || 'Untitled Composition'}</div>
            <div className="composition-meta">{composition.stanzas?.length ?? 0} stanzas</div>
          </div>
          <div className="composition-item-actions">
            <button className="btn-icon" title="Play" onClick={() => onPlay(composition)}>
              <FiPlay />
            </button>
            <button className="btn-icon" title="Edit" onClick={() => onEdit(composition)}>
              <FiEdit2 />
            </button>
            <button className="btn-icon danger" title="Delete" onClick={() => onDelete(composition.id)}>
              <FiTrash2 />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
