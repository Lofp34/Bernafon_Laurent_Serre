import ReactMarkdown from 'react-markdown';

export default function SynthesisModal({ isOpen, isSynthesizing, text, onClose, onCopyToClipboard, onAddToSession9 }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Synthèse des Notes</h3>
          <button onClick={onClose} className="btn-ghost">✕</button>
        </div>
        <div className="modal-content">
          {isSynthesizing ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Génération de la synthèse en cours...</p>
            </div>
          ) : text ? (
            <div className="synthesis-content">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          ) : (
            <p>Aucune synthèse disponible</p>
          )}
        </div>
        {text && !isSynthesizing && (
          <div className="modal-footer">
            <button onClick={onCopyToClipboard} className="btn-secondary">
              📋 Copier
            </button>
            <button onClick={onAddToSession9} className="btn-primary">
              ➕ Ajouter à Session 9
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 