import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Palette, Type, Mic, Upload, Volume2, Trash2 } from 'lucide-react';
import { useApi } from '../../lib/api';

interface AISettingsProps {
  onBack: () => void;
}

export function AISettings({ onBack }: AISettingsProps) {
  const api = useApi();
  const [activeTab, setActiveTab] = useState<'image' | 'text' | 'voice'>('image');
  const [imageStyle, setImageStyle] = useState('soft watercolor');
  const [textTone, setTextTone] = useState('gentle and calming');
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadVoices();
    
    // Load saved settings
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

  const handleVoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // Convert audio files to base64
      const base64Files = [];
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const file = files[i];
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        base64Files.push(base64);
      }

      // TODO: Implement voice cloning via backend
      alert('Voice upload functionality coming soon! Will clone your voice using ElevenLabs.');
      
    } catch (error) {
      console.error('Failed to upload voice:', error);
      alert('Failed to upload voice. Please try again.');
    } finally {
      setUploading(false);
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
      className="size-full overflow-y-auto p-8 pl-24"
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
            {/* Voice Upload */}
            <div 
              className="p-6 mb-6"
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
                upload your voice
              </h3>
              <p 
                className="mb-6"
                style={{ 
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '16px',
                  color: 'rgba(30, 20, 15, 0.7)' 
                }}
              >
                upload 2-3 audio clips of you reading (at least 30 seconds each) to create an ai clone of your voice
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="audio/*"
                  onChange={handleVoiceUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div 
                  className="px-6 py-3 inline-flex items-center gap-2"
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
                  <Upload className="w-5 h-5" />
                  {uploading ? 'processing...' : 'upload voice samples'}
                </div>
              </label>
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
                    <button
                      key={voice.voice_id}
                      onClick={() => handleSelectVoice(voice)}
                      className="p-4 text-left transition-all cursor-pointer"
                      style={{
                        fontFamily: "'Patrick Hand', cursive",
                        fontSize: '17px',
                        color: selectedVoice?.voice_id === voice.voice_id ? 'rgba(20, 15, 10, 0.9)' : 'rgba(30, 20, 15, 0.75)',
                        background: selectedVoice?.voice_id === voice.voice_id ? 'rgba(210, 180, 140, 0.4)' : 'rgba(250, 245, 235, 0.5)',
                        border: selectedVoice?.voice_id === voice.voice_id ? '2px solid rgba(40, 30, 20, 0.4)' : '1px solid rgba(40, 30, 20, 0.2)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-5 h-5" style={{ color: 'rgba(40, 30, 20, 0.6)' }} />
                        <div className="flex-1">
                          <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>{voice.name}</p>
                          {voice.labels && (
                            <p 
                              className="text-sm"
                              style={{ 
                                fontSize: '14px',
                                color: 'rgba(40, 30, 20, 0.5)' 
                              }}
                            >
                              {Object.entries(voice.labels).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </p>
                          )}
                        </div>
                        {selectedVoice?.voice_id === voice.voice_id && (
                          <div 
                            className="text-xs px-2 py-1"
                            style={{
                              fontFamily: "'Patrick Hand', cursive",
                              fontSize: '13px',
                              fontWeight: 'bold',
                              color: 'rgba(40, 60, 40, 0.8)',
                              background: 'rgba(100, 150, 100, 0.2)',
                              border: '1px solid rgba(40, 60, 40, 0.3)',
                            }}
                          >
                            active
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
