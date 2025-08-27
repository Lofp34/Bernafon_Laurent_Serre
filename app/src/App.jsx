import { useState, useEffect } from 'react';
import './styles.css';
import Header from './components/Header';
import PlanPanel from './components/PlanPanel';
import NotesPanel from './components/NotesPanel';
import SettingsModal from './components/SettingsModal';
import SynthesisModal from './components/SynthesisModal';
import { SESSIONS, SUBFIELDS, DEFAULT_PLAN } from './data/constants';

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
      alert("Veuillez configurer votre clé API OpenAI dans les paramètres.");
      return;
    }

    const hasNotes = Object.values(notes).some(session => 
      Object.values(session).some(field => field.trim() !== '')
    );

    if (!hasNotes) {
      alert("Aucune note à synthétiser. Veuillez d'abord saisir des notes.");
      return;
    }

    setIsSynthesizing(true);
    setIsSynthesisOpen(true);
    setSynthesisText("");

    try {
      const prompt = `Tu es un expert en formation commerciale. Analyse les notes suivantes prises lors d'une formation Bernafon et crée une synthèse structurée et professionnelle.

Notes par session:
${Object.entries(notes).map(([sessionId, sessionData]) => {
  const session = SESSIONS.find(s => s.id === sessionId);
  if (!session) return '';
  
  const sessionNotes = Object.entries(sessionData)
    .map(([fieldKey, content]) => {
      if (!content.trim()) return '';
      const field = SUBFIELDS.find(f => f.key === fieldKey);
      return field ? `- ${field.label}: ${content}` : '';
    })
    .filter(note => note !== '')
    .join('\n');
  
  return sessionNotes ? `\n## ${session.title}\n${sessionNotes}` : '';
}).join('\n')}

Crée une synthèse qui :
1. Résume les points clés de chaque session
2. Identifie les actions prioritaires à mettre en place
3. Met en évidence les apprentissages les plus importants
4. Propose des axes d'amélioration

Format de réponse : Utilise le Markdown pour structurer clairement le contenu avec des titres, sous-titres, listes à puces et mise en forme appropriée.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                setSynthesisText(prev => prev + parsed.choices[0].delta.content);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la synthèse:', error);
      alert(`Erreur lors de la génération de la synthèse: ${error.message}`);
      setSynthesisText("Erreur lors de la génération de la synthèse.");
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
