export default function SettingsModal({ isOpen, onClose, settings, onSettingsChange }) {
  if (!isOpen) {
    return null;
  }

  const handleFieldChange = (field, value) => {
    onSettingsChange({ ...settings, [field]: value });
  };

  return (
    <div className="modal show" role="dialog" aria-modal="true" aria-label="Paramètres">
      <div className="card">
        <header className="row">
          <strong>Paramètres</strong>
          <div className="spacer"></div>
          <button className="btn-ghost" onClick={onClose}>✖</button>
        </header>
        <div className="content">
          <div className="row2">
            <div>
              <label>Clé API OpenAI (stockée en localStorage)</label>
              <input 
                id="apiKey" 
                type="text" 
                placeholder="sk-..."
                value={settings.apiKey}
                onChange={(e) => handleFieldChange('apiKey', e.target.value)}
              />
              <p className="small">⚠️ La clé est stockée localement dans votre navigateur.</p>
            </div>
            <div>
              <label>Modèle</label>
              <select 
                id="modelSel"
                value={settings.model}
                onChange={(e) => handleFieldChange('model', e.target.value)}
              >
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4o">gpt-4o</option>
              </select>
            </div>
          </div>
          {/* We will add the other settings later */}
        </div>
      </div>
    </div>
  );
} 