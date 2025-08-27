import { useState } from 'react';
import { SESSIONS, SUBFIELDS } from '../data/constants';

export default function NotesPanel({ notes, chatHistory, activeTab, onTabChange, onNoteChange, onChatSubmit }) {
  const [prompt, setPrompt] = useState("");
  const [openSessionId, setOpenSessionId] = useState(SESSIONS[0]?.id);

  const handleSend = () => {
    if (prompt.trim()) {
      onChatSubmit(prompt.trim());
      setPrompt("");
    }
  };

  const handleToggleSession = (sessionId) => {
    setOpenSessionId(prevId => prevId === sessionId ? null : sessionId);
  };

  const calculateTotalLength = () => {
    return Object.values(notes).reduce((total, sessionNotes) => {
      return total + (sessionNotes.inspire?.length || 0) + (sessionNotes.actions?.length || 0);
    }, 0);
  };

  return (
    <section className="panel">
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => onTabChange('notes')}
        >
          Notes
        </div>
        <div 
          className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => onTabChange('chat')}
        >
          Chat IA
        </div>
      </div>
      <div className="tabpanes">
        {/* NOTES TAB */}
        <div id="pane-notes" style={{ display: activeTab === 'notes' ? 'block' : 'none' }}>
          <div className="right-actions">
            <span className="small">Autosave localStorage • Données locales (alpha)</span>
          </div>
          <div id="accordion">
            {SESSIONS.map((session) => {
              const sessionNotes = notes[session.id] || { inspire: "", actions: "" };
              const length = (sessionNotes.inspire?.length || 0) + (sessionNotes.actions?.length || 0);

              return (
                <details 
                  key={session.id} 
                  open={openSessionId === session.id}
                  onToggle={(e) => {
                    if (e.target.open) {
                      setOpenSessionId(session.id);
                    } else if (openSessionId === session.id) {
                      setOpenSessionId(null);
                    }
                  }}
                >
                  <summary>
                    <span>{session.title}</span>
                    <span className="badge" id={`badge-${session.id}`}>{length} caractères</span>
                  </summary>
                  <div className="section">
                    {SUBFIELDS.map(field => (
                      <div className="field" key={field.key}>
                        <label htmlFor={`${session.id}_${field.key}`}>{field.label}</label>
                        <textarea
                          id={`${session.id}_${field.key}`}
                          placeholder={`${field.label} — notes…`}
                          value={notes[session.id]?.[field.key] || ""}
                          onChange={(e) => onNoteChange(session.id, field.key, e.target.value)}
                        ></textarea>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
        {/* CHAT TAB */}
        <div id="pane-chat" style={{display: activeTab === 'chat' ? 'flex' : 'none', height:'100%', flexDirection:'column'}}>
          <div className="chat-log" id="chatLog" aria-live="polite">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`msg ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                {msg.content}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <textarea 
              id="chatPrompt" 
              placeholder="Pose une question…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  handleSend();
                }
              }}
            />
            <button 
              id="chatSend" 
              className="btn-primary"
              onClick={handleSend}
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
      <div className="export-bar">
        <span id="charCount" className="small">{calculateTotalLength()} caractères au total</span>
      </div>
    </section>
  );
} 