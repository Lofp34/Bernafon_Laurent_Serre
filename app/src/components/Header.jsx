export default function Header({ user, onUserChange, onThemeToggle, onOpenSettings, onSynthesize, isSynthesizing }) {
  return (
    <header>
      <div className="brand"><span className="dot"></span> Bernafon • <span className="muted">Plan de vente & Notes</span></div>
      <div className="spacer"></div>
      <div className="row" id="userRow">
        <input 
          id="fullName" 
          type="text" 
          placeholder="Prénom Nom" 
          style={{width: '220px'}}
          value={user.fullName}
          onChange={(e) => onUserChange({ ...user, fullName: e.target.value })}
          tabIndex="1"
        />
        <button className="btn-ghost" id="switchUserBtn" title="Changer d'utilisateur" tabIndex="2">Changer</button>
        <span className="save-indicator" id="saveIndicator">—</span>
      </div>
      <div className="row">
        <button 
          id="synthBtn" 
          className="btn-primary" 
          onClick={onSynthesize} 
          disabled={isSynthesizing}
        >
          {isSynthesizing ? "Synthèse en cours…" : "Synthèse des notes (IA)"}
        </button>
        <button id="exportBtn">Exporter en PDF</button>
        <button id="settingsBtn" className="btn-ghost" title="Paramètres" onClick={onOpenSettings}>⚙️</button>
        <button id="themeBtn" className="btn-ghost" title="Basculer clair/sombre" onClick={onThemeToggle}>🌓</button>
      </div>
    </header>
  );
} 