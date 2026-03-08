import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Palette, Type, Mic, Upload, Volume2, Trash2, Loader2, Check, Play, Shield } from 'lucide-react';
import { useApi } from '../../lib/api';

interface AISettingsProps {
  onBack?: () => void;
}

export function AISettings({ onBack }: AISettingsProps) {
  const api = useApi();
  const [activeTab, setActiveTab] = useState<'image' | 'text' | 'voice' | 'general'>('image');
  const [imageStyle, setImageStyle] = useState('soft watercolor');
  const [textTone, setTextTone] = useState('gentle and calming');
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [cloneFiles, setCloneFiles] = useState<File[]>([]);
  const [cloneStatus, setCloneStatus] = useState<string | null>(null);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [parentPin, setParentPin] = useState(localStorage.getItem('parent_pin') || '1234');
  const [pinSaved, setPinSaved] = useState(false);

  useEffect(() => {
    loadVoices();
    
    const savedImageStyle = localStorage.getItem('ai_image_style');
    const savedTextTone = localStorage.getItem('ai_text_tone');
    if (savedImageStyle) setImageStyle(savedImageStyle);
    if (savedTextTone) setTextTone(savedTextTone);
  }, []);

  const loadVoices = async () => {
    try {
      const data = await api.getVoices();
      setVoices(data.voices || []);
      
      const savedVoiceId = localStorage.getItem('ai_selected_voice');
      if (savedVoiceId && data.voices) {
        setSelectedVoice(data.voices.find((v: any) => v.voice_id === savedVoiceId));
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  };

  const handleCloneFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setCloneFiles(prev => [...prev, ...Array.from(files).slice(0, 3 - prev.length)]);
  };

  const handleCloneVoice = async () => {
    if (!cloneName.trim() || cloneFiles.length === 0) return;
    setUploading(true);
    setCloneStatus('converting audio files...');
    try {
      const base64Files: string[] = [];
      for (const file of cloneFiles) {
        const b64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        base64Files.push(b64);
      }

      setCloneStatus('cloning voice with elevenlabs...');
      const result = await api.cloneVoice(cloneName, `Custom voice: ${cloneName}`, base64Files);
      setCloneStatus('voice cloned successfully!');
      setCloneName('');
      setCloneFiles([]);
      await loadVoices();
      if (result.voice_id) {
        localStorage.setItem('ai_selected_voice', result.voice_id);
      }
    } catch (error: any) {
      console.error('Voice cloning failed:', error);
      setCloneStatus(`failed: ${error.message || 'unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePreviewVoice = async (voice: any) => {
    if (previewingVoice === voice.voice_id) {
      audioRef.current?.pause();
      setPreviewingVoice(null);
      return;
    }
    setPreviewingVoice(voice.voice_id);
    try {
      const blob = await api.generateAudio('Once upon a time, in a cozy little forest...', voice.voice_id);
      const url = URL.createObjectURL(blob);
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPreviewingVoice(null);
      audioRef.current.play();
    } catch {
      setPreviewingVoice(null);
    }
  };

  const handleSaveImageStyle = () => {
    localStorage.setItem('ai_image_style', imageStyle);
    alert('Image style saved!');
  };

  const handleSaveTextTone = () => {
    localStorage.setItem('ai_text_tone', textTone);
    alert('Text tone saved!');
  };

  const handleSelectVoice = (voice: any) => {
    setSelectedVoice(voice);
    localStorage.setItem('ai_selected_voice', voice.voice_id);
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
        {/* Header */}
        <div className="mb-8">
          <h1 
            style={{ 
              fontFamily: "'Indie Flower', cursive", 
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'rgba(20, 15, 10, 0.9)' 
            }}
          >
            ai customization
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8">
          {[
            { id: 'image' as const, icon: Palette, label: 'image style' },
            { id: 'text' as const, icon: Type, label: 'story tone' },
            { id: 'voice' as const, icon: Mic, label: 'voice settings' },
            { id: 'general' as const, icon: Shield, label: 'parent settings' },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-5 py-3 flex items-center gap-2 transition-all cursor-pointer"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '18px',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  color: activeTab === tab.id ? 'rgba(20, 15, 10, 0.9)' : 'rgba(30, 20, 15, 0.7)',
                  background: activeTab === tab.id ? 'rgba(210, 180, 140, 0.4)' : 'rgba(250, 245, 235, 0.3)',
                  border: activeTab === tab.id ? '2px solid rgba(40, 30, 20, 0.4)' : '1px solid rgba(40, 30, 20, 0.2)',
                }}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Image Style Tab */}
        {activeTab === 'image' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
            style={{
              background: 'rgba(250, 245, 235, 0.8)',
              border: '2px solid rgba(40, 30, 20, 0.25)',
              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 
              className="mb-4"
              style={{ 
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'rgba(20, 15, 10, 0.85)' 
              }}
            >
              image generation style
            </h3>
            <p 
              className="mb-6"
              style={{ 
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '16px',
                color: 'rgba(30, 20, 15, 0.7)' 
              }}
            >
              describe how you want story images to look
            </p>
            <textarea
              value={imageStyle}
              onChange={(e) => setImageStyle(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 mb-4"
              placeholder="e.g., 'soft watercolor, dreamy lighting, children's book style'"
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '17px',
                color: 'rgba(20, 15, 10, 0.9)',
                background: 'rgba(255, 255, 255, 0.5)',
                border: '1.5px solid rgba(40, 30, 20, 0.3)',
                outline: 'none',
                resize: 'vertical',
              }}
            />
            <button
              onClick={handleSaveImageStyle}
              className="px-6 py-3 cursor-pointer"
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'rgba(20, 15, 10, 0.85)',
                background: 'rgba(210, 180, 140, 0.5)',
                border: '2px solid rgba(40, 30, 20, 0.35)',
              }}
            >
              save style
            </button>
          </motion.div>
        )}

        {/* Text Tone Tab */}
        {activeTab === 'text' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
            style={{
              background: 'rgba(250, 245, 235, 0.8)',
              border: '2px solid rgba(40, 30, 20, 0.25)',
              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 
              className="mb-4"
              style={{ 
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'rgba(20, 15, 10, 0.85)' 
              }}
            >
              storytelling tone
            </h3>
            <p 
              className="mb-6"
              style={{ 
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '16px',
                color: 'rgba(30, 20, 15, 0.7)' 
              }}
            >
              customize the narrative voice and pacing
            </p>
            <textarea
              value={textTone}
              onChange={(e) => setTextTone(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 mb-4"
              placeholder="e.g., 'gentle and calming, slower pacing, reassuring tone'"
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '17px',
                color: 'rgba(20, 15, 10, 0.9)',
                background: 'rgba(255, 255, 255, 0.5)',
                border: '1.5px solid rgba(40, 30, 20, 0.3)',
                outline: 'none',
                resize: 'vertical',
              }}
            />
            <button
              onClick={handleSaveTextTone}
              className="px-6 py-3 cursor-pointer"
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'rgba(20, 15, 10, 0.85)',
                background: 'rgba(210, 180, 140, 0.5)',
                border: '2px solid rgba(40, 30, 20, 0.35)',
              }}
            >
              save tone
            </button>
          </motion.div>
        )}

        {/* Voice Tab */}
        {activeTab === 'voice' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Voice Clone */}
            <div 
              className="p-6 mb-6"
              style={{
                background: 'rgba(250, 245, 235, 0.8)',
                border: '2px solid rgba(40, 30, 20, 0.25)',
                boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h3 
                className="mb-3"
                style={{ 
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'rgba(20, 15, 10, 0.85)' 
                }}
              >
                clone your voice
              </h3>
              <p 
                className="mb-5"
                style={{ 
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '16px',
                  color: 'rgba(30, 20, 15, 0.7)' 
                }}
              >
                upload 1-3 audio clips of you reading (at least 30s each) and elevenlabs will create an ai clone of your voice
              </p>

              <input
                type="text"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="voice name (e.g. Mom's voice)"
                className="w-full px-4 py-3 mb-4"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '17px',
                  color: 'rgba(20, 15, 10, 0.9)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1.5px solid rgba(40, 30, 20, 0.3)',
                  outline: 'none',
                }}
              />

              {cloneFiles.length > 0 && (
                <div className="mb-4 space-y-2">
                  {cloneFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2" style={{ background: 'rgba(210, 180, 140, 0.2)', border: '1px solid rgba(40, 30, 20, 0.15)' }}>
                      <Mic className="w-4 h-4" style={{ color: 'rgba(40, 30, 20, 0.5)' }} />
                      <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(30, 20, 15, 0.75)', flex: 1 }}>{f.name}</span>
                      <button onClick={() => setCloneFiles(cloneFiles.filter((_, j) => j !== i))} className="cursor-pointer p-1" style={{ color: 'rgba(139, 0, 0, 0.6)' }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                {cloneFiles.length < 3 && (
                  <label className="cursor-pointer">
                    <input type="file" accept="audio/*" onChange={handleCloneFileSelect} className="hidden" disabled={uploading} />
                    <div className="px-5 py-2.5 inline-flex items-center gap-2" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '17px', fontWeight: 'bold', color: 'rgba(20, 15, 10, 0.85)', background: 'rgba(210, 180, 140, 0.3)', border: '2px dashed rgba(40, 30, 20, 0.3)' }}>
                      <Upload className="w-4 h-4" />
                      add audio ({cloneFiles.length}/3)
                    </div>
                  </label>
                )}
                <button
                  onClick={handleCloneVoice}
                  disabled={uploading || !cloneName.trim() || cloneFiles.length === 0}
                  className="px-5 py-2.5 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '17px',
                    fontWeight: 'bold',
                    color: 'rgba(250, 245, 240, 0.95)',
                    background: 'linear-gradient(135deg, rgba(140, 100, 60, 0.85), rgba(120, 85, 50, 0.9))',
                    border: '2px solid rgba(160, 120, 80, 0.5)',
                  }}
                >
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> cloning...</> : 'clone voice'}
                </button>
              </div>

              {cloneStatus && (
                <p className="mt-3" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: cloneStatus.includes('failed') ? 'rgba(180, 60, 60, 0.8)' : 'rgba(60, 100, 60, 0.8)' }}>
                  {cloneStatus}
                </p>
              )}
            </div>

            {/* Available Voices */}
            <div 
              className="p-6"
              style={{
                background: 'rgba(250, 245, 235, 0.8)',
                border: '2px solid rgba(40, 30, 20, 0.25)',
                boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h3 
                className="mb-6"
                style={{ 
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'rgba(20, 15, 10, 0.85)' 
                }}
              >
                available voices
              </h3>
              
              {voices.length === 0 ? (
                <p 
                  style={{ 
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '16px',
                    color: 'rgba(30, 20, 15, 0.6)' 
                  }}
                >
                  loading voices...
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {voices.map((voice) => (
                    <div
                      key={voice.voice_id}
                      className="p-4 transition-all"
                      style={{
                        fontFamily: "'Patrick Hand', cursive",
                        fontSize: '17px',
                        color: selectedVoice?.voice_id === voice.voice_id ? 'rgba(20, 15, 10, 0.9)' : 'rgba(30, 20, 15, 0.75)',
                        background: selectedVoice?.voice_id === voice.voice_id ? 'rgba(210, 180, 140, 0.4)' : 'rgba(250, 245, 235, 0.5)',
                        border: selectedVoice?.voice_id === voice.voice_id ? '2px solid rgba(40, 30, 20, 0.4)' : '1px solid rgba(40, 30, 20, 0.2)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-5 h-5 shrink-0" style={{ color: 'rgba(40, 30, 20, 0.6)' }} />
                        <div className="flex-1 min-w-0">
                          <p style={{ fontWeight: 'bold', marginBottom: '2px' }} className="truncate">{voice.name}</p>
                          {voice.labels && (
                            <p className="text-sm truncate" style={{ fontSize: '14px', color: 'rgba(40, 30, 20, 0.5)' }}>
                              {Object.entries(voice.labels).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handlePreviewVoice(voice)}
                            className="p-1.5 cursor-pointer transition-all"
                            style={{ background: 'rgba(100, 80, 140, 0.15)', border: '1px solid rgba(100, 80, 140, 0.3)' }}
                          >
                            {previewingVoice === voice.voice_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleSelectVoice(voice)}
                            className="p-1.5 cursor-pointer transition-all"
                            style={{
                              background: selectedVoice?.voice_id === voice.voice_id ? 'rgba(100, 150, 100, 0.3)' : 'rgba(210, 180, 140, 0.2)',
                              border: selectedVoice?.voice_id === voice.voice_id ? '1px solid rgba(40, 60, 40, 0.4)' : '1px solid rgba(40, 30, 20, 0.2)',
                            }}
                          >
                            {selectedVoice?.voice_id === voice.voice_id ? <Check className="w-4 h-4" style={{ color: 'rgba(40, 100, 40, 0.8)' }} /> : <Check className="w-4 h-4" style={{ color: 'rgba(40, 30, 20, 0.3)' }} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
        {/* Parent Settings Tab */}
        {activeTab === 'general' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
            style={{
              background: 'rgba(250, 245, 235, 0.8)',
              border: '2px solid rgba(40, 30, 20, 0.25)',
              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3
              className="mb-4"
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'rgba(20, 15, 10, 0.85)',
              }}
            >
              parent exit PIN
            </h3>
            <p
              className="mb-5"
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '16px',
                color: 'rgba(30, 20, 15, 0.7)',
              }}
            >
              set a 4-digit PIN to exit story mode — prevents accidental taps by little hands
            </p>

            <div className="flex items-center gap-4 mb-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={parentPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setParentPin(val);
                  setPinSaved(false);
                }}
                className="w-40 px-4 py-3 text-center"
                placeholder="1234"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '28px',
                  letterSpacing: '8px',
                  color: 'rgba(20, 15, 10, 0.9)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1.5px solid rgba(40, 30, 20, 0.3)',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => {
                  if (parentPin.length === 4) {
                    localStorage.setItem('parent_pin', parentPin);
                    setPinSaved(true);
                    setTimeout(() => setPinSaved(false), 2000);
                  }
                }}
                disabled={parentPin.length !== 4}
                className="px-6 py-3 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'rgba(20, 15, 10, 0.85)',
                  background: 'rgba(210, 180, 140, 0.5)',
                  border: '2px solid rgba(40, 30, 20, 0.35)',
                }}
              >
                {pinSaved ? <><Check className="w-4 h-4" /> saved!</> : 'save PIN'}
              </button>
            </div>
            <p
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '14px',
                color: 'rgba(40, 30, 20, 0.45)',
              }}
            >
              current PIN: {localStorage.getItem('parent_pin') || '1234 (default)'}
            </p>
          </motion.div>
        )}
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
