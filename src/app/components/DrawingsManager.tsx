import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Upload, Trash2, Image as ImageIcon, Calendar } from 'lucide-react';
import { useApi } from '../../lib/api';

interface DrawingsManagerProps {
  onBack: () => void;
}

export function DrawingsManager({ onBack }: DrawingsManagerProps) {
  const api = useApi();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [drawings, setDrawings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadDrawings(selectedChild.id);
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    try {
      const data = await api.getChildren();
      setChildren(data);
      if (data.length > 0) {
        setSelectedChild(data[0]);
      }
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDrawings = async (childId: string) => {
    // For now, store in memory - would need backend endpoint for persistence
    const stored = localStorage.getItem(`drawings_${childId}`);
    if (stored) {
      setDrawings(JSON.parse(stored));
    } else {
      setDrawings([]);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedChild) return;

    setUploading(true);
    try {
      const newDrawings = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        await new Promise((resolve) => {
          reader.onload = (event) => {
            newDrawings.push({
              id: Date.now() + i,
              name: file.name,
              url: event.target?.result as string,
              uploadedAt: new Date().toISOString(),
            });
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      }

      const updated = [...drawings, ...newDrawings];
      setDrawings(updated);
      localStorage.setItem(`drawings_${selectedChild.id}`, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to upload drawings:', error);
      alert('Failed to upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm('delete this drawing?')) return;
    
    const updated = drawings.filter(d => d.id !== id);
    setDrawings(updated);
    localStorage.setItem(`drawings_${selectedChild.id}`, JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div 
        className="size-full flex items-center justify-center"
        style={{
          backgroundColor: '#e4d5b7',
          backgroundImage: 'url(https://www.toptal.com/designers/subtlepatterns/patterns/old_map.png)',
          backgroundSize: '400px 400px',
        }}
      >
        <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.7)' }}>
          opening gallery...
        </p>
        <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
      </div>
    );
  }

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
            drawings collection
          </h1>
        </div>

        {/* Child Selector */}
        <div className="flex gap-3 mb-6">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className="px-5 py-3 transition-all cursor-pointer"
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '18px',
                fontWeight: selectedChild?.id === child.id ? 'bold' : 'normal',
                color: selectedChild?.id === child.id ? 'rgba(20, 15, 10, 0.9)' : 'rgba(30, 20, 15, 0.7)',
                background: selectedChild?.id === child.id ? 'rgba(210, 180, 140, 0.4)' : 'rgba(250, 245, 235, 0.3)',
                border: selectedChild?.id === child.id ? '2px solid rgba(40, 30, 20, 0.4)' : '1px solid rgba(40, 30, 20, 0.2)',
              }}
            >
              {child.name}
            </button>
          ))}
        </div>

        {/* Upload Button */}
        <label className="inline-block mb-8 cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading || !selectedChild}
          />
          <div 
            className="px-6 py-3 inline-flex items-center gap-2 transition-all"
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '19px',
              fontWeight: 'bold',
              color: 'rgba(20, 15, 10, 0.85)',
              background: 'rgba(210, 180, 140, 0.4)',
              border: '2px solid rgba(40, 30, 20, 0.35)',
              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12)',
            }}
          >
            <Upload className="w-5 h-5" />
            {uploading ? 'uploading...' : 'upload drawing'}
          </div>
        </label>

        {/* Drawings Grid */}
        {drawings.length === 0 ? (
          <div 
            className="p-12 text-center"
            style={{
              background: 'rgba(250, 245, 235, 0.6)',
              border: '2px dashed rgba(40, 30, 20, 0.25)',
            }}
          >
            <ImageIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgba(40, 30, 20, 0.3)' }} />
            <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(30, 20, 15, 0.6)' }}>
              no drawings yet
            </p>
            <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', color: 'rgba(30, 20, 15, 0.5)' }}>
              upload their artwork to inspire stories
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {drawings.map((drawing, index) => (
              <motion.div
                key={drawing.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
                style={{
                  background: 'rgba(250, 245, 235, 0.9)',
                  border: '2px solid rgba(40, 30, 20, 0.25)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                  padding: '8px',
                }}
              >
                <img 
                  src={drawing.url} 
                  alt={drawing.name}
                  className="w-full h-48 object-cover mb-2"
                  style={{ border: '1px solid rgba(40, 30, 20, 0.15)' }}
                />
                <p 
                  className="text-sm mb-1 truncate"
                  style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(30, 20, 15, 0.75)' }}
                >
                  {drawing.name}
                </p>
                <p 
                  className="text-xs flex items-center gap-1"
                  style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: 'rgba(40, 30, 20, 0.5)' }}
                >
                  <Calendar className="w-3 h-3" />
                  {new Date(drawing.uploadedAt).toLocaleDateString()}
                </p>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(drawing.id)}
                  className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  style={{
                    background: 'rgba(180, 80, 80, 0.8)',
                    border: '1px solid rgba(100, 40, 40, 0.4)',
                  }}
                >
                  <Trash2 className="w-4 h-4" style={{ color: 'white' }} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
