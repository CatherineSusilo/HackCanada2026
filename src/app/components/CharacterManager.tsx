import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Loader2, Mic, Edit3, BookOpen, ChevronDown, ChevronUp, Sparkles, Play } from 'lucide-react';
import { useApi } from '../../lib/api';

export function CharacterManager() {
  const api = useApi();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [matchingVoice, setMatchingVoice] = useState<string | null>(null);
  const [voiceResult, setVoiceResult] = useState<any>(null);
  const [detailData, setDetailData] = useState<Record<string, any>>({});
  const [voices, setVoices] = useState<any[]>([]);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [newChar, setNewChar] = useState({ name: '', description: '', personality: '', icon: '🧸' });

  useEffect(() => { loadCharacters(); }, []);
  useEffect(() => {
    api.getVoices().then((r: any) => setVoices(r.voices || [])).catch(() => {});
  }, []);

  const loadCharacters = async () => {
    try {
      const data = await api.getCharacters();
      setCharacters(data);
    } catch (err) {
      console.error('Failed to load characters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newChar.name.trim()) return;
    setSaving(true);
    try {
      const created = await api.createCharacter(newChar);
      setCharacters(prev => [created, ...prev]);
      setNewChar({ name: '', description: '', personality: '', icon: '🧸' });
      setShowCreate(false);
    } catch (err) {
      console.error('Failed to create character:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCharacter(id);
      setCharacters(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const updated = await api.updateCharacter(id, editData);
      setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const handleMatchVoice = async (id: string) => {
    setMatchingVoice(id);
    setVoiceResult(null);
    try {
      const result = await api.matchCharacterVoice(id);
      setVoiceResult(result);
      setCharacters(prev => prev.map(c => c.id === id ? { ...c, voiceId: result.voiceId, voiceName: result.voiceName } : c));
    } catch (err) {
      console.error('Voice match failed:', err);
    } finally {
      setMatchingVoice(null);
    }
  };

  const handlePlayVoice = async (char: any) => {
    if (!char.voiceId) return;
    if (playingVoiceId === char.id) {
      audioRef.current?.pause();
      setPlayingVoiceId(null);
      return;
    }
    setPlayingVoiceId(char.id);
    try {
      const sample = `"Hello! I'm ${char.name}," said the character with a warm smile.`;
      const blob = await api.generateAudio(sample, char.voiceId);
      const url = URL.createObjectURL(blob);
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlayingVoiceId(null);
      audioRef.current.play();
    } catch {
      setPlayingVoiceId(null);
    }
  };

  const handleSelectVoice = async (charId: string, voice: any) => {
    try {
      await api.updateCharacter(charId, { voiceId: voice.voice_id, voiceName: voice.name });
      setCharacters(prev => prev.map(c => c.id === charId ? { ...c, voiceId: voice.voice_id, voiceName: voice.name } : c));
    } catch (err) {
      console.error('Failed to update voice:', err);
    }
  };

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!detailData[id]) {
      try {
        const detail = await api.getCharacter(id);
        setDetailData(prev => ({ ...prev, [id]: detail }));
      } catch {}
    }
  };

  const inputStyle = {
    fontFamily: "'Patrick Hand', cursive",
    fontSize: '16px',
    color: 'rgba(20, 15, 10, 0.9)',
    background: 'rgba(255, 255, 255, 0.5)',
    border: '1.5px solid rgba(40, 30, 20, 0.3)',
    outline: 'none' as const,
  };

  return (
    <div
      className="size-full overflow-y-auto p-4 pt-16 sm:p-8 sm:pl-20"
      style={{
        backgroundColor: '#e4d5b7',
        backgroundImage: 'url(https://www.toptal.com/designers/subtlepatterns/patterns/old_map.png)',
        backgroundSize: '400px 400px',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '36px', fontWeight: 'bold', color: 'rgba(20, 15, 10, 0.9)' }}>
            characters
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-3 flex items-center gap-2 transition-all cursor-pointer"
            style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', fontWeight: 'bold', color: 'rgba(20, 15, 10, 0.85)', background: 'rgba(210, 180, 140, 0.4)', border: '2px solid rgba(40, 30, 20, 0.35)', boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12)' }}
          >
            <Plus className="w-5 h-5" />
            new character
          </button>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-6"
              style={{ background: 'rgba(250, 245, 235, 0.9)', border: '2px solid rgba(40, 30, 20, 0.3)', boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <input value={newChar.icon} onChange={e => setNewChar({ ...newChar, icon: e.target.value })} placeholder="emoji" className="px-3 py-2 text-center" style={{ ...inputStyle, fontSize: '24px' }} />
                <input value={newChar.name} onChange={e => setNewChar({ ...newChar, name: e.target.value })} placeholder="character name" className="px-4 py-2 md:col-span-3" style={inputStyle} />
              </div>
              <textarea
                value={newChar.description}
                onChange={e => setNewChar({ ...newChar, description: e.target.value })}
                placeholder="description (who is this character? what do they look like?)"
                rows={2}
                className="w-full px-4 py-2 mb-3 resize-none"
                style={inputStyle}
              />
              <textarea
                value={newChar.personality}
                onChange={e => setNewChar({ ...newChar, personality: e.target.value })}
                placeholder="personality traits (brave, gentle, curious, funny...)"
                rows={2}
                className="w-full px-4 py-2 mb-4 resize-none"
                style={inputStyle}
              />
              <button
                onClick={handleCreate}
                disabled={saving || !newChar.name.trim() || !newChar.description.trim()}
                className="px-6 py-2.5 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', fontWeight: 'bold', color: 'rgba(20, 15, 10, 0.85)', background: 'rgba(210, 180, 140, 0.5)', border: '2px solid rgba(40, 30, 20, 0.35)' }}
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> creating...</> : 'create character'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Character list */}
        {loading ? (
          <div className="flex items-center gap-2 py-12 justify-center" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(40, 30, 20, 0.6)' }}>
            <Loader2 className="w-5 h-5 animate-spin" /> loading characters...
          </div>
        ) : characters.length === 0 ? (
          <div className="py-16 text-center" style={{ background: 'rgba(250, 245, 235, 0.6)', border: '2px dashed rgba(40, 30, 20, 0.25)' }}>
            <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '22px', color: 'rgba(30, 20, 15, 0.6)', marginBottom: '8px' }}>no characters yet</p>
            <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', color: 'rgba(30, 20, 15, 0.45)' }}>create characters to include them in bedtime stories</p>
          </div>
        ) : (
          <div className="space-y-4">
            {characters.map((char, idx) => {
              const isExpanded = expandedId === char.id;
              const isEditing = editingId === char.id;
              const detail = detailData[char.id];

              return (
                <motion.div
                  key={char.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="transition-all"
                  style={{ background: 'rgba(250, 245, 235, 0.85)', border: '2px solid rgba(40, 30, 20, 0.25)', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' }}
                >
                  {/* Header row */}
                  <button
                    onClick={() => handleExpand(char.id)}
                    className="w-full p-5 flex items-center gap-4 text-left cursor-pointer"
                  >
                    <span style={{ fontSize: '36px' }}>{char.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate" style={{ fontFamily: "'Indie Flower', cursive", fontSize: '22px', fontWeight: 'bold', color: 'rgba(20, 15, 10, 0.9)' }}>
                        {char.name}
                      </h3>
                      <p className="truncate" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(30, 20, 15, 0.6)' }}>
                        {char.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {char.voiceName && (
                        <span className="px-2 py-1 flex items-center gap-1" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: 'rgba(80, 60, 120, 0.8)', background: 'rgba(120, 100, 160, 0.15)', border: '1px solid rgba(80, 60, 120, 0.25)' }}>
                          <Mic className="w-3 h-3" /> {char.voiceName}
                        </span>
                      )}
                      <span className="px-2 py-1" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: 'rgba(40, 30, 20, 0.5)', background: 'rgba(40, 30, 20, 0.06)', border: '1px solid rgba(40, 30, 20, 0.12)' }}>
                        {char.totalStories || 0} stories
                      </span>
                      {(char.engagementScore ?? 0) > 0 && (
                        <span className="px-2 py-1" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: 'rgba(80, 100, 60, 0.8)', background: 'rgba(100, 140, 80, 0.15)', border: '1px solid rgba(60, 100, 40, 0.25)' }}>
                          {Math.round(char.engagementScore)}% excited to see
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: 'rgba(40, 30, 20, 0.4)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'rgba(40, 30, 20, 0.4)' }} />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-5 pb-5 overflow-hidden"
                      >
                        <div style={{ borderTop: '1px solid rgba(40, 30, 20, 0.15)', paddingTop: '16px' }}>
                          {/* Edit mode */}
                          {isEditing ? (
                            <div className="space-y-3 mb-4">
                              <input value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} className="w-full px-3 py-2" style={inputStyle} placeholder="name" />
                              <textarea value={editData.description || ''} onChange={e => setEditData({ ...editData, description: e.target.value })} className="w-full px-3 py-2 resize-none" rows={2} style={inputStyle} placeholder="description" />
                              <textarea value={editData.personality || ''} onChange={e => setEditData({ ...editData, personality: e.target.value })} className="w-full px-3 py-2 resize-none" rows={2} style={inputStyle} placeholder="personality" />
                              <div className="flex gap-2">
                                <button onClick={() => handleUpdate(char.id)} className="px-4 py-2 cursor-pointer" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', fontWeight: 'bold', color: 'rgba(20, 15, 10, 0.85)', background: 'rgba(210, 180, 140, 0.5)', border: '1px solid rgba(40, 30, 20, 0.35)' }}>save</button>
                                <button onClick={() => setEditingId(null)} className="px-4 py-2 cursor-pointer" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', color: 'rgba(40, 30, 20, 0.6)', background: 'rgba(250, 245, 235, 0.3)', border: '1px solid rgba(40, 30, 20, 0.2)' }}>cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="mb-4">
                              {char.personality && (
                                <p className="mb-2" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(40, 30, 20, 0.65)' }}>
                                  <strong>personality:</strong> {char.personality}
                                </p>
                              )}
                              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(40, 30, 20, 0.65)' }}>
                                <strong>description:</strong> {char.description}
                              </p>
                            </div>
                          )}

                          {/* Story appearances */}
                          {detail?.stories && detail.stories.length > 0 && (
                            <div className="mb-4">
                              <p className="mb-2 flex items-center gap-1" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', fontWeight: 'bold', color: 'rgba(20, 15, 10, 0.7)' }}>
                                <BookOpen className="w-4 h-4" /> appeared in
                              </p>
                              <div className="space-y-1">
                                {detail.stories.map((s: any) => (
                                  <div key={s.id} className="flex items-center gap-2 px-3 py-1.5" style={{ background: 'rgba(210, 180, 140, 0.15)', border: '1px solid rgba(40, 30, 20, 0.1)' }}>
                                    <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(30, 20, 15, 0.7)', flex: 1 }}>{s.storyTitle}</span>
                                    <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '12px', color: 'rgba(40, 30, 20, 0.4)' }}>
                                      {new Date(s.startTime).toLocaleDateString()}
                                    </span>
                                    {s.completed && <span style={{ fontSize: '12px', color: 'rgba(60, 120, 60, 0.7)' }}>✓</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Engagement & excitement */}
                          {(char.engagementScore ?? 0) > 0 && (
                            <div className="mb-4 p-3" style={{ background: 'rgba(100, 140, 80, 0.15)', border: '1px solid rgba(60, 100, 40, 0.25)' }}>
                              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', fontWeight: 'bold', color: 'rgba(40, 80, 40, 0.9)' }}>
                                engagement: {Math.round(char.engagementScore)}%
                              </p>
                              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: 'rgba(40, 30, 20, 0.65)' }}>
                                how excited your child is to see this character in stories
                              </p>
                            </div>
                          )}

                          {/* Voice selection */}
                          <div className="mb-4">
                            <p className="mb-2" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', fontWeight: 'bold', color: 'rgba(20, 15, 10, 0.7)' }}>
                              voice
                            </p>
                            <div className="flex flex-wrap gap-2 items-center">
                              <select
                                value={char.voiceId || ''}
                                onChange={(e) => {
                                  const v = voices.find((x: any) => x.voice_id === e.target.value);
                                  if (v) handleSelectVoice(char.id, v);
                                }}
                                className="px-3 py-2 max-w-[200px]"
                                style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(40, 30, 20, 0.3)' }}
                              >
                                <option value="">— select voice —</option>
                                {voices.map((v: any) => (
                                  <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handlePlayVoice(char)}
                                disabled={!char.voiceId}
                                className="px-3 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(80, 60, 120, 0.8)', background: 'rgba(120, 100, 160, 0.15)', border: '1px solid rgba(80, 60, 120, 0.25)' }}
                              >
                                {playingVoiceId === char.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                play voice
                              </button>
                              <button
                                onClick={() => handleMatchVoice(char.id)}
                                disabled={matchingVoice === char.id}
                                className="px-3 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(80, 60, 120, 0.8)', background: 'rgba(120, 100, 160, 0.12)', border: '1px solid rgba(80, 60, 120, 0.25)' }}
                              >
                                {matchingVoice === char.id ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> matching...</> : <><Sparkles className="w-3.5 h-3.5" /> auto-match</>}
                              </button>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => { setEditingId(char.id); setEditData({ name: char.name, description: char.description, personality: char.personality }); }}
                              className="px-3 py-2 flex items-center gap-1.5 cursor-pointer transition-all"
                              style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(40, 30, 20, 0.7)', background: 'rgba(250, 245, 235, 0.3)', border: '1px solid rgba(40, 30, 20, 0.2)' }}
                            >
                              <Edit3 className="w-3.5 h-3.5" /> edit
                            </button>
                            <button
                              onClick={() => handleDelete(char.id)}
                              className="px-3 py-2 flex items-center gap-1.5 cursor-pointer transition-all ml-auto"
                              style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(139, 0, 0, 0.6)', background: 'rgba(139, 0, 0, 0.06)', border: '1px solid rgba(139, 0, 0, 0.15)' }}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> delete
                            </button>
                          </div>

                          {/* Voice match result */}
                          {voiceResult && matchingVoice === null && expandedId === char.id && (
                            <div className="mt-3 p-3" style={{ background: 'rgba(100, 150, 100, 0.1)', border: '1px solid rgba(60, 100, 60, 0.2)' }}>
                              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(40, 80, 40, 0.8)', fontWeight: 'bold' }}>
                                matched: {voiceResult.voiceName}
                              </p>
                              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: 'rgba(40, 30, 20, 0.55)' }}>
                                {voiceResult.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
