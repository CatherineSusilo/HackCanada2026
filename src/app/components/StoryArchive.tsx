import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Calendar, Clock } from 'lucide-react';
import { useApi } from '../../lib/api';

interface StoryArchiveProps {
  onBack: () => void;
}

export function StoryArchive({ onBack }: StoryArchiveProps) {
  const api = useApi();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadStories(selectedChild.id);
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

  const loadStories = async (childId: string) => {
    try {
      const data = await api.getStories(childId, 50);
      setStories(data.stories || []);
    } catch (error) {
      console.error('Failed to load stories:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
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
          opening the storybook...
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
            story archive
          </h1>
        </div>

        {/* Child Selector */}
        <div className="flex gap-3 mb-8">
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

        {/* Stories List */}
        <div className="grid grid-cols-1 gap-4">
          {stories.length === 0 ? (
            <div 
              className="p-8 text-center"
              style={{
                background: 'rgba(250, 245, 235, 0.6)',
                border: '2px dashed rgba(40, 30, 20, 0.25)',
              }}
            >
              <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(40, 30, 20, 0.3)' }} />
              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(30, 20, 15, 0.6)' }}>
                no stories yet — create one to begin the collection
              </p>
            </div>
          ) : (
            stories.map((story, index) => (
              <motion.button
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedStory(selectedStory?.id === story.id ? null : story)}
                className="p-5 transition-all cursor-pointer text-left"
                style={{
                  background: 'rgba(250, 245, 235, 0.8)',
                  border: '2px solid rgba(40, 30, 20, 0.25)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 
                      style={{ 
                        fontFamily: "'Indie Flower', cursive", 
                        fontSize: '22px',
                        fontWeight: 'bold',
                        color: 'rgba(20, 15, 10, 0.85)',
                        marginBottom: '6px',
                      }}
                    >
                      {story.storyTitle}
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span 
                        className="flex items-center gap-1"
                        style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(30, 20, 15, 0.6)' }}
                      >
                        <Calendar className="w-4 h-4" />
                        {formatDate(story.startTime)}
                      </span>
                      {story.duration && (
                        <span 
                          className="flex items-center gap-1"
                          style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(30, 20, 15, 0.6)' }}
                        >
                          <Clock className="w-4 h-4" />
                          {formatDuration(story.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {story.completed && (
                    <div 
                      className="px-3 py-1 text-xs"
                      style={{
                        fontFamily: "'Patrick Hand', cursive",
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: 'rgba(40, 60, 40, 0.8)',
                        background: 'rgba(100, 150, 100, 0.2)',
                        border: '1px solid rgba(40, 60, 40, 0.3)',
                      }}
                    >
                      completed
                    </div>
                  )}
                </div>

                {/* Expanded Story Content */}
                {selectedStory?.id === story.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4"
                    style={{ borderTop: '1px solid rgba(40, 30, 20, 0.2)' }}
                  >
                    <p 
                      className="mb-3"
                      style={{ 
                        fontFamily: "'Patrick Hand', cursive", 
                        fontSize: '16px',
                        color: 'rgba(30, 20, 15, 0.75)',
                        lineHeight: '1.6',
                        maxHeight: '200px',
                        overflow: 'auto',
                      }}
                    >
                      {story.storyContent?.substring(0, 500)}...
                    </p>
                    {story.parentPrompt && (
                      <p 
                        className="text-sm italic"
                        style={{ 
                          fontFamily: "'Patrick Hand', cursive", 
                          fontSize: '14px',
                          color: 'rgba(40, 30, 20, 0.5)' 
                        }}
                      >
                        prompt: "{story.parentPrompt}"
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.button>
            ))
          )}
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
