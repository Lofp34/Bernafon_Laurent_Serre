import { SESSIONS } from '../data/constants';

export default function SynthesisModal({ 
  isOpen, 
  isSynthesizing, 
  text, 
  onClose, 
  onCopyToClipboard, 
  onAddToSession9 
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal show" role="dialog" aria-modal="true" aria-label="Synthèse des notes">
      <div className="card" style={{width: 'min(900px, 95vw)'}}>
        <header className="row">
          <strong>🧠 Synthèse des notes</strong>
          <div className="spacer"></div>
          <button className="btn-ghost" aria-label="Fermer" onClick={onClose}>✖</button>
        </header>
        <div className="content">
          <div style={{whiteSpace: 'pre-wrap', lineHeight: 1.45, maxHeight: '60vh', overflow: 'auto'}}>
            {isSynthesizing ? "Génération en cours, veuillez patienter..." : text}
          </div>
          <div className="row" style={{marginTop: '12px'}}>
            <button onClick={onCopyToClipboard} className="btn-primary" disabled={isSynthesizing}>Copier</button>
            <button onClick={onAddToSession9} disabled={isSynthesizing}>Ajouter à Session 9</button>
            <button onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );
} 