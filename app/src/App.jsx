import { useState, useEffect } from 'react';
import './styles.css';
import Header from './components/Header';
import PlanPanel from './components/PlanPanel';
import NotesPanel from './components/NotesPanel';
import SettingsModal from './components/SettingsModal';
import SynthesisModal from './components/SynthesisModal';
import { SESSIONS, DEFAULT_PLAN } from './data/constants';

const STORAGE_KEY = 'bernafon_notes_data';

// Helper function to create the initial empty notes structure
const initializeNotes = () => {
  const notes = {};
  SESSIONS.forEach(s => {
    notes[s.id] = { inspire: "", actions: "" };
  });
  return notes;
};

const loadStateFromLocalStorage = () => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      return JSON.parse(rawData);
    }
  } catch (e) {
    console.error("Failed to parse state from localStorage", e);
  }
  return null;
};


function App() {
  const initialState = loadStateFromLocalStorage();

  const [user, setUser] = useState(initialState?.user || { fullName: "" });
  const [settings, setSettings] = useState(initialState?.settings || {
    planUrl: DEFAULT_PLAN,
    theme: "light",
    model: "gpt-4o-mini",
    provider: "responses",
    apiKey: ""
  });
  const [notes, setNotes] = useState(initialState?.notes || initializeNotes());
  const [chat, setChat] = useState(initialState?.chat || { history: [] });
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' or 'chat'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSynthesisOpen, setIsSynthesisOpen] = useState(false);
  const [synthesisText, setSynthesisText] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  useEffect(() => {
    const stateToSave = { user, settings, notes, chat };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }, [user, settings, notes, chat]);

  const handleThemeToggle = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      theme: prevSettings.theme === 'light' ? 'dark' : 'light'
    }));
  };

  const handleNoteChange = (sessionId, fieldKey, value) => {
    setNotes(prevNotes => ({
      ...prevNotes,
      [sessionId]: {
        ...prevNotes[sessionId],
        [fieldKey]: value
      }
    }));
  };

  const handlePlanUrlChange = (newUrl) => {
    if (newUrl) {
      setSettings(prevSettings => ({
        ...prevSettings,
        planUrl: newUrl
      }));
    }
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  };

  const handleChatSubmit = async (prompt) => {
    const apiKey = settings.apiKey || import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      alert("Veuillez entrer votre clé API OpenAI dans les paramètres.");
      return;
    }

    const newHistory = [...chat.history, { role: 'user', content: prompt }];
    setChat({ history: newHistory });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: "system", content: "Tu es Coach IA pour commerciaux Bernafon. Aide avec pragmatisme, style franc et concret. Réponds en français." },
          ...newHistory.slice(-16) // Include last 8 turns
        ],
        stream: true
      })
    });

    if (!response.body) return;

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let fullResponse = "";
    setChat(prevChat => ({
      history: [...prevChat.history, { role: 'assistant', content: "..." }]
    }));
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const lines = value.split('\n').filter(line => line.startsWith('data: '));
      for (const line of lines) {
        const message = line.substring(6);
        if (message === '[DONE]') {
          break;
        }
        try {
          const json = JSON.parse(message);
          const chunk = json.choices[0]?.delta?.content || "";
          fullResponse += chunk;
          setChat(prevChat => {
            const newHistory = [...prevChat.history];
            newHistory[newHistory.length - 1].content = fullResponse;
            return { history: newHistory };
          });
        } catch (error) {
          // Ignore parsing errors for incomplete JSON
        }
      }
    }
  };

  const handleSynthesize = async () => {
    const apiKey = settings.apiKey || import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      alert("Veuillez entrer votre clé API OpenAI dans les paramètres.");
      return;
    }

    setIsSynthesizing(true);
    setIsSynthesisOpen(true);

    const blocks = SESSIONS.map(s => {
      const a = (notes[s.id]?.inspire || "").trim();
      const b = (notes[s.id]?.actions || "").trim();
      return `### ${s.title}\n- Inspirations : ${a || "(vide)"}\n- Actions envisagées : ${b || "(vide)"}`;
    }).join("\n\n");

    const prompt = `Tu es Coach IA pour commerciaux Bernafon. Génère une synthèse personnelle structurée en français pour ${user.fullName || "le participant"}.
    Exigences :
    1) TL;DR en 5 puces.
    2) Synthèse par session (1 à 9), 4-6 lignes chacune, en citant des extraits utiles si pertinents.
    3) Plan d'actions « Avoir » : 7 steps maximum, SMART, horizon 90 jours.
    4) Prochaines relances internes (format agenda) pour le manager.
    5) Ton : clair, direct, sans blabla.

    Voici les notes brutes :

    ${blocks}`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: "system", content: "Tu écris des synthèses actionnables pour commerciaux. Garde un style clair et concret." },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur de l'API OpenAI: ${errorText}`);
      }
      
      const data = await response.json();
      const resultText = data.choices[0]?.message?.content || "Aucune réponse de l'IA.";
      setSynthesisText(resultText);

    } catch (error) {
      console.error(error);
      setSynthesisText(`Une erreur est survenue : ${error.message}`);
    } finally {
      setIsSynthesizing(false);
    }
  };
  
  const handleAddToSession9 = () => {
    const prev = notes.s9.actions || "";
    const newActions = (prev ? (prev + "\n\n--- SYNTHÈSE IA ---\n\n") : "") + synthesisText;
    handleNoteChange('s9', 'actions', newActions);
    alert("Synthèse ajoutée à la Session 9 • Actions.");
    setIsSynthesisOpen(false);
  };

  const handleClearChat = () => {
    setChat({ history: [] });
  };


  return (
    <div className="app" data-theme={settings.theme}>
      <Header 
        user={user}
        onUserChange={setUser}
        onThemeToggle={handleThemeToggle} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSynthesize={handleSynthesize}
        isSynthesizing={isSynthesizing}
      />
      <main>
        <div className="grid">
          <PlanPanel 
            planUrl={settings.planUrl}
            onPlanUrlChange={handlePlanUrlChange}
          />
          <NotesPanel 
            notes={notes}
            chatHistory={chat.history}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onNoteChange={handleNoteChange}
            onChatSubmit={handleChatSubmit}
            onClearChat={handleClearChat}
          />
        </div>
      </main>
      <SynthesisModal
        isOpen={isSynthesisOpen}
        isSynthesizing={isSynthesizing}
        text={synthesisText}
        onClose={() => setIsSynthesisOpen(false)}
        onCopyToClipboard={() => navigator.clipboard.writeText(synthesisText)}
        onAddToSession9={handleAddToSession9}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  )
}

export default App
