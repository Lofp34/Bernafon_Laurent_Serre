import { useState } from 'react';

export default function PlanPanel({ planUrl, onPlanUrlChange }) {
  const [urlInput, setUrlInput] = useState(planUrl);

  const handleLoadClick = () => {
    onPlanUrlChange(urlInput);
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="row">
          <strong>Plan de vente – Visionneuse</strong>
          <span className="pill">déroulez pendant la formation</span>
        </div>
        <div className="row">
          <input 
            id="planUrl" 
            type="text" 
            placeholder="URL du plan (iframe)" 
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            tabIndex="3"
          />
          <button id="reloadPlanBtn" onClick={handleLoadClick}>Charger</button>
        </div>
      </div>
      <div className="panel-body iframe-wrap">
        <iframe id="planFrame" src={planUrl} referrerPolicy="no-referrer"></iframe>
      </div>
    </section>
  );
} 