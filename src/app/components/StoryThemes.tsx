import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Loader2, FileText } from 'lucide-react';
import { useApi } from '../../lib/api';
import { DEFAULT_STORY_THEMES } from '../data/storyThemes';

export function StoryThemes() {
  const api = useApi();
  const [customThemes, setCustomThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTheme, setNewTheme] = useState({ name: '', description: '', icon: '📖' });
  const [fullText, setFullText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedStory, setAnalyzedStory] = useState<string | null>(null);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const themes = await api.getThemes();
      setCustomThemes(themes);
    } catch (err) {
      console.error('Failed to load themes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTheme = async () => {
    if (!newTheme.name.trim()) return;
    setSaving(true);
    try {
      const created = await api.createTheme(newTheme);
      setCustomThemes([...customThemes, created]);
      setNewTheme({ name: '', description: '', icon: '📖' });
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to create theme:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTheme(id);
      setCustomThemes(customThemes.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete theme:', err);
    }
  };

  const handleAnalyzeText = async () => {
    if (fullText.trim().length < 20) return;
    setAnalyzing(true);
    try {
      const result = await api.analyzeText(fullText);
      if (result.theme) {
        setNewTheme({ name: result.theme.name, description: result.theme.description, icon: result.theme.icon || '📖' });
      }
      if (result.story) {
        setAnalyzedStory(result.story);
      }
    } catch (err) {
      console.error('Text analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div
      className="size-full overflow-y-auto p-8 pl-24"
      style={{
        backgroundColor: '#e4d5b7',
        backgroundImage: 'url(https://www.toptal.com/designers/subtlepatterns/patterns/old_map.png)',
        backgroundSize: '400px 400px',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '36px', fontWeight: 'bold', color: 'rgba(20, 15, 10, 0.9)' }}>
            story themes
          </h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-5 py-3 flex items-center gap-2 transition-all cursor-pointer"
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'rgba(20, 15, 10, 0.85)',
              background: 'rgba(210, 180, 140, 0.4)',
              border: '2px solid rgba(40, 30, 20, 0.35)',
              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12)',
            }}
          >
            <Plus className="w-5 h-5" />
            add theme
          </button>
        </div>

        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-6 mb-8"
            style={{
              background: 'rgba(250, 245, 235, 0.9)',
              border: '2px solid rgba(40, 30, 20, 0.3)',
              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Full text analysis section */}
            <div className="mb-5 pb-5" style={{ borderBottom: '1px solid rgba(40, 30, 20, 0.15)' }}>
              <p className="mb-2 flex items-center gap-2" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '17px', fontWeight: 'bold', color: 'rgba(20, 15, 10, 0.75)' }}>
                <FileText className="w-4 h-4" />
                paste a story or text (optional)
              </p>
              <p className="mb-3" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(40, 30, 20, 0.5)' }}>
                gemini will analyze it and create a theme + bedtime script from it
              </p>
              <textarea
                value={fullText}
                onChange={(e) => setFullText(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 mb-3 resize-vertical"
                placeholder="paste any story, fairy tale, article, or idea here..."
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '16px',
                  color: 'rgba(20, 15, 10, 0.9)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1.5px solid rgba(40, 30, 20, 0.3)',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAnalyzeText}
                disabled={analyzing || fullText.trim().length < 20}
                className="px-5 py-2 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'rgba(20, 15, 10, 0.85)',
                  background: 'rgba(140, 120, 180, 0.25)',
                  border: '1.5px solid rgba(100, 80, 140, 0.35)',
                }}
              >
                {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> analyzing...</> : '✨ analyze with gemini'}
              </button>
              {analyzedStory && (
                <div className="mt-3 p-3" style={{ background: 'rgba(100, 150, 100, 0.1)', border: '1px solid rgba(60, 100, 60, 0.2)' }}>
                  <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(40, 80, 40, 0.8)', fontWeight: 'bold', marginBottom: '4px' }}>
                    story script generated ({analyzedStory.split('\n').filter(l => l.trim()).length} paragraphs)
                  </p>
                  <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: 'rgba(40, 30, 20, 0.55)' }}>
                    {analyzedStory.substring(0, 150)}...
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="theme name"
                value={newTheme.name}
                onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                className="px-4 py-2 w-full"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '17px',
                  color: 'rgba(20, 15, 10, 0.9)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1.5px solid rgba(40, 30, 20, 0.3)',
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="emoji icon"
                value={newTheme.icon}
                onChange={(e) => setNewTheme({ ...newTheme, icon: e.target.value })}
                className="px-4 py-2 w-full"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '17px',
                  color: 'rgba(20, 15, 10, 0.9)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1.5px solid rgba(40, 30, 20, 0.3)',
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="short description"
                value={newTheme.description}
                onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
                className="px-4 py-2 w-full"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '17px',
                  color: 'rgba(20, 15, 10, 0.9)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1.5px solid rgba(40, 30, 20, 0.3)',
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={handleAddTheme}
              disabled={saving || !newTheme.name.trim()}
              className="px-6 py-2 cursor-pointer disabled:opacity-50"
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'rgba(20, 15, 10, 0.85)',
                background: 'rgba(210, 180, 140, 0.5)',
                border: '2px solid rgba(40, 30, 20, 0.35)',
              }}
            >
              {saving ? 'saving...' : 'save theme'}
            </button>
          </motion.div>
        )}

        {/* Default themes */}
        <p className="mb-3" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(40, 30, 20, 0.6)', fontWeight: 'bold' }}>
          built-in themes
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {DEFAULT_STORY_THEMES.map((theme, index) => (
            <motion.div
              key={`default-${theme.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 transition-all"
              style={{
                background: 'rgba(250, 245, 235, 0.8)',
                border: '2px solid rgba(40, 30, 20, 0.25)',
                boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="text-4xl mb-3">{theme.icon}</div>
              <h3 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '22px', fontWeight: 'bold', color: 'rgba(20, 15, 10, 0.9)', marginBottom: '6px' }}>
                {theme.name}
              </h3>
              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', color: 'rgba(30, 20, 15, 0.7)' }}>
                {theme.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Custom themes */}
        <p className="mb-3" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(40, 30, 20, 0.6)', fontWeight: 'bold' }}>
          your custom themes
        </p>
        {loading ? (
          <div className="flex items-center gap-2 py-8 justify-center" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(40, 30, 20, 0.6)' }}>
            <Loader2 className="w-5 h-5 animate-spin" />
            loading...
          </div>
        ) : customThemes.length === 0 ? (
          <div className="py-8 text-center" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(40, 30, 20, 0.5)' }}>
            no custom themes yet — tap "add theme" to create one
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {customThemes.map((theme, index) => (
              <motion.div
                key={theme.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 transition-all relative group"
                style={{
                  background: 'rgba(250, 245, 235, 0.8)',
                  border: '2px solid rgba(40, 30, 20, 0.25)',
                  boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <button
                  onClick={() => handleDelete(theme.id)}
                  className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ background: 'rgba(139, 0, 0, 0.1)', border: '1px solid rgba(139, 0, 0, 0.3)', borderRadius: '6px' }}
                >
                  <Trash2 className="w-4 h-4" style={{ color: 'rgba(139, 0, 0, 0.7)' }} />
                </button>
                <div className="text-4xl mb-3">{theme.icon}</div>
                <h3 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '22px', fontWeight: 'bold', color: 'rgba(20, 15, 10, 0.9)', marginBottom: '6px' }}>
                  {theme.name}
                </h3>
                <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', color: 'rgba(30, 20, 15, 0.7)' }}>
                  {theme.description}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
