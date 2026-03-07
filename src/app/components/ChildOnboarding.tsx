import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useApi } from '../../lib/api';

interface ChildOnboardingProps {
  onComplete: () => void;
  onBack: () => void;
}

interface QuestionnaireData {
  // Basic Info
  name: string;
  age: string;
  
  // Personality & Temperament (Pages 2-8)
  energyLevel: string;
  socialPreference: string;
  emotionalExpression: string;
  adaptability: string;
  curiosity: string;
  attention: string;
  bedtimeResistance: string;
  
  // Interests & Media (Pages 9-12)
  favoriteShows: string;
  favoriteBooks: string;
  favoriteCharacters: string;
  favoriteActivities: string;
  
  // Sleep Patterns (Pages 13-16)
  currentBedtime: string;
  sleepStruggles: string[];
  napSchedule: string;
  sleepEnvironment: string;
  
  // Parent Goals (Pages 17-20)
  primaryGoal: string;
  secondaryGoals: string[];
  concernAreas: string;
  successLooksLike: string;
}

const questions = [
  // Page 1: Basic Info
  {
    id: 'basic',
    title: "let's start with the basics",
    subtitle: "tell us about your little dreamer",
    fields: [
      { name: 'name', label: "child's name", type: 'text', placeholder: 'their given name', required: true },
      { name: 'age', label: 'age', type: 'number', placeholder: '6', required: true, min: 2, max: 12 },
    ]
  },
  
  // Page 2: Energy Level
  {
    id: 'energy',
    title: 'how would you describe their energy?',
    subtitle: 'think about a typical evening',
    fields: [
      {
        name: 'energyLevel',
        type: 'radio',
        options: [
          { value: 'high', label: 'always on the go - hard to settle down', emoji: '⚡' },
          { value: 'moderate', label: 'balanced - active but can calm down', emoji: '🌤️' },
          { value: 'low', label: 'naturally calm - rarely wound up', emoji: '🌙' },
        ]
      }
    ]
  },
  
  // Page 3: Social Preference
  {
    id: 'social',
    title: 'do they recharge alone or with others?',
    subtitle: 'after a busy day, what helps them relax?',
    fields: [
      {
        name: 'socialPreference',
        type: 'radio',
        options: [
          { value: 'social', label: 'being with family - they love company', emoji: '👨‍👩‍👧' },
          { value: 'balanced', label: 'a mix - depends on their mood', emoji: '⚖️' },
          { value: 'solitary', label: 'quiet alone time - they need space', emoji: '🌟' },
        ]
      }
    ]
  },
  
  // Page 4: Emotional Expression
  {
    id: 'emotions',
    title: 'how do they express emotions?',
    subtitle: 'when something upsets or excites them',
    fields: [
      {
        name: 'emotionalExpression',
        type: 'radio',
        options: [
          { value: 'expressive', label: 'very open - you always know how they feel', emoji: '😊' },
          { value: 'moderate', label: 'somewhat open - shares when asked', emoji: '🙂' },
          { value: 'reserved', label: 'keeps feelings inside - needs encouragement', emoji: '😌' },
        ]
      }
    ]
  },
  
  // Page 5: Adaptability
  {
    id: 'adaptability',
    title: 'how do they handle changes?',
    subtitle: 'new routines, unexpected plans, transitions',
    fields: [
      {
        name: 'adaptability',
        type: 'radio',
        options: [
          { value: 'flexible', label: 'goes with the flow - adapts easily', emoji: '🌊' },
          { value: 'moderate', label: 'needs some warning but adjusts', emoji: '🌤️' },
          { value: 'routine-oriented', label: 'prefers consistency - struggles with change', emoji: '📅' },
        ]
      }
    ]
  },
  
  // Page 6: Curiosity
  {
    id: 'curiosity',
    title: 'what drives their curiosity?',
    subtitle: 'what captures their imagination?',
    fields: [
      {
        name: 'curiosity',
        type: 'radio',
        options: [
          { value: 'explorers', label: 'physical world - loves exploring and discovering', emoji: '🔍' },
          { value: 'storytellers', label: 'stories and imagination - loves make-believe', emoji: '📚' },
          { value: 'builders', label: 'how things work - loves puzzles and building', emoji: '🧩' },
          { value: 'social', label: 'people and relationships - loves social play', emoji: '🤝' },
        ]
      }
    ]
  },
  
  // Page 7: Attention Span
  {
    id: 'attention',
    title: 'how long can they focus on stories?',
    subtitle: 'during a typical bedtime story',
    fields: [
      {
        name: 'attention',
        type: 'radio',
        options: [
          { value: 'short', label: '5-10 minutes - then they get restless', emoji: '⏱️' },
          { value: 'moderate', label: '10-20 minutes - a good chapter or two', emoji: '📖' },
          { value: 'long', label: '20+ minutes - they love long tales', emoji: '📚' },
        ]
      }
    ]
  },
  
  // Page 8: Bedtime Resistance
  {
    id: 'resistance',
    title: 'how do they feel about bedtime?',
    subtitle: 'when you announce it\'s time for bed',
    fields: [
      {
        name: 'bedtimeResistance',
        type: 'radio',
        options: [
          { value: 'resistant', label: 'fights it - wants to keep playing', emoji: '😤' },
          { value: 'neutral', label: 'accepts it - some negotiating', emoji: '😐' },
          { value: 'welcoming', label: 'looks forward to it - ready for rest', emoji: '😊' },
        ]
      }
    ]
  },
  
  // Page 9: Favorite Shows
  {
    id: 'shows',
    title: 'what shows or movies do they love?',
    subtitle: 'we\'ll weave these themes into stories',
    fields: [
      { name: 'favoriteShows', label: 'favorite shows/movies', type: 'textarea', placeholder: 'e.g., Moana, Frozen, Bluey, Encanto...', rows: 3 },
    ]
  },
  
  // Page 10: Favorite Books
  {
    id: 'books',
    title: 'any beloved books or story themes?',
    subtitle: 'characters or worlds they return to',
    fields: [
      { name: 'favoriteBooks', label: 'favorite books/stories', type: 'textarea', placeholder: 'e.g., The Gruffalo, Where the Wild Things Are, dragons, princesses...', rows: 3 },
    ]
  },
  
  // Page 11: Favorite Characters
  {
    id: 'characters',
    title: 'who are their hero characters?',
    subtitle: 'real or fictional - who do they admire?',
    fields: [
      { name: 'favoriteCharacters', label: 'favorite characters', type: 'textarea', placeholder: 'e.g., Elsa, Spider-Man, their big sister, astronauts...', rows: 3 },
    ]
  },
  
  // Page 12: Favorite Activities
  {
    id: 'activities',
    title: 'what activities light them up?',
    subtitle: 'hobbies, games, things they love doing',
    fields: [
      { name: 'favoriteActivities', label: 'favorite activities', type: 'textarea', placeholder: 'e.g., drawing, building with blocks, pretend play, sports...', rows: 3 },
    ]
  },
  
  // Page 13: Current Bedtime
  {
    id: 'bedtime',
    title: 'what time is bedtime usually?',
    subtitle: 'their typical sleep schedule',
    fields: [
      { name: 'currentBedtime', label: 'usual bedtime', type: 'text', placeholder: 'e.g., 7:30 PM', required: true },
    ]
  },
  
  // Page 14: Sleep Struggles
  {
    id: 'struggles',
    title: 'what makes bedtime challenging?',
    subtitle: 'select all that apply',
    fields: [
      {
        name: 'sleepStruggles',
        type: 'checkbox',
        options: [
          { value: 'resistance', label: 'resisting bedtime - wants to keep playing' },
          { value: 'anxiety', label: 'anxiety or fears - dark, monsters, separation' },
          { value: 'restlessness', label: 'physical restlessness - can\'t settle body down' },
          { value: 'racing-mind', label: 'racing thoughts - mind too active' },
          { value: 'attention', label: 'short attention span - won\'t focus on story' },
          { value: 'none', label: 'no major struggles - just optimizing' },
        ]
      }
    ]
  },
  
  // Page 15: Nap Schedule
  {
    id: 'naps',
    title: 'do they still take naps?',
    subtitle: 'daytime sleep patterns',
    fields: [
      {
        name: 'napSchedule',
        type: 'radio',
        options: [
          { value: 'regular', label: 'yes, regular naps daily', emoji: '😴' },
          { value: 'occasional', label: 'sometimes - depends on the day', emoji: '🌤️' },
          { value: 'none', label: 'no naps - dropped them already', emoji: '⏰' },
        ]
      }
    ]
  },
  
  // Page 16: Sleep Environment
  {
    id: 'environment',
    title: 'describe their sleep environment',
    subtitle: 'what helps them feel safe and cozy?',
    fields: [
      { name: 'sleepEnvironment', label: 'sleep environment', type: 'textarea', placeholder: 'e.g., night light on, door cracked open, white noise, favorite stuffed animal...', rows: 3 },
    ]
  },
  
  // Page 17: Primary Goal
  {
    id: 'goal',
    title: 'what\'s your main bedtime goal?',
    subtitle: 'the one thing you most want to improve',
    fields: [
      {
        name: 'primaryGoal',
        type: 'radio',
        options: [
          { value: 'faster', label: 'fall asleep faster - reduce time to sleep', emoji: '⏱️' },
          { value: 'easier', label: 'make bedtime easier - less resistance', emoji: '✨' },
          { value: 'anxiety', label: 'reduce anxiety - help them feel safe', emoji: '🛡️' },
          { value: 'consistent', label: 'build consistency - establish routine', emoji: '📅' },
          { value: 'quality', label: 'improve sleep quality - deeper rest', emoji: '💤' },
        ]
      }
    ]
  },
  
  // Page 18: Secondary Goals
  {
    id: 'secondary',
    title: 'any other goals?',
    subtitle: 'select all that apply',
    fields: [
      {
        name: 'secondaryGoals',
        type: 'checkbox',
        options: [
          { value: 'bonding', label: 'quality parent-child bonding time' },
          { value: 'independence', label: 'help them self-soothe independently' },
          { value: 'creativity', label: 'spark imagination and creativity' },
          { value: 'learning', label: 'incorporate learning moments' },
          { value: 'emotional', label: 'emotional processing and regulation' },
          { value: 'none', label: 'just the primary goal is enough' },
        ]
      }
    ]
  },
  
  // Page 19: Concern Areas
  {
    id: 'concerns',
    title: 'anything else we should know?',
    subtitle: 'specific concerns, sensitivities, or context',
    fields: [
      { name: 'concernAreas', label: 'concerns or notes', type: 'textarea', placeholder: 'e.g., scared of loud noises, doesn\'t like certain animals, recently started school...', rows: 4 },
    ]
  },
  
  // Page 20: Success Definition
  {
    id: 'success',
    title: 'what would success look like?',
    subtitle: 'in 30 days, what would make you think "this is working"?',
    fields: [
      { name: 'successLooksLike', label: 'success means...', type: 'textarea', placeholder: 'e.g., they ask for story time, fall asleep within 15 minutes, no more bedtime battles...', rows: 4, required: true },
    ]
  },
];

export function ChildOnboarding({ onComplete, onBack }: ChildOnboardingProps) {
  const api = useApi();
  const [currentPage, setCurrentPage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<Partial<QuestionnaireData>>({
    sleepStruggles: [],
    secondaryGoals: [],
  });

  const currentQuestion = questions[currentPage];
  const progress = ((currentPage + 1) / questions.length) * 100;

  const handleInputChange = (name: string, value: any) => {
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, value: string, checked: boolean) => {
    setData(prev => {
      const current = (prev[name as keyof QuestionnaireData] as string[]) || [];
      if (checked) {
        return { ...prev, [name]: [...current, value] };
      } else {
        return { ...prev, [name]: current.filter(v => v !== value) };
      }
    });
  };

  const canProceed = () => {
    const question = questions[currentPage];
    for (const field of question.fields) {
      if (field.required) {
        const value = data[field.name as keyof QuestionnaireData];
        if (!value || (typeof value === 'string' && !value.trim())) {
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (canProceed() && currentPage < questions.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      const childPreferences = {
        storytellingTone: 'calming',
        favoriteThemes: [
          ...(data.favoriteShows?.split(',').map(s => s.trim()).filter(s => s) || []),
          ...(data.favoriteBooks?.split(',').map(s => s.trim()).filter(s => s) || []),
        ],
        defaultInitialState: data.energyLevel === 'high' ? 'wound-up' : data.energyLevel === 'low' ? 'almost-there' : 'normal',
        personality: `Energy: ${data.energyLevel}. Social: ${data.socialPreference}. Emotions: ${data.emotionalExpression}. Adaptability: ${data.adaptability}. Curiosity: ${data.curiosity}. Attention: ${data.attention}. Bedtime: ${data.bedtimeResistance}.`,
        favoriteMedia: `Shows: ${data.favoriteShows || 'none'}. Books: ${data.favoriteBooks || 'none'}. Characters: ${data.favoriteCharacters || 'none'}. Activities: ${data.favoriteActivities || 'none'}.`,
        parentGoals: `Primary: ${data.primaryGoal}. Secondary: ${data.secondaryGoals?.join(', ') || 'none'}. Struggles: ${data.sleepStruggles?.join(', ') || 'none'}. Success: ${data.successLooksLike}. Concerns: ${data.concernAreas || 'none'}. Bedtime: ${data.currentBedtime}. Naps: ${data.napSchedule}. Environment: ${data.sleepEnvironment || 'not specified'}.`,
      };

      const child = await api.createChild({
        name: data.name!,
        age: parseInt(data.age!),
        preferences: childPreferences,
      });
      
      // Store child data in localStorage for story generation
      localStorage.setItem(`child_${child.id}`, JSON.stringify({
        id: child.id,
        name: child.name,
        age: child.age,
        preferences: childPreferences,
      }));
      
      onComplete();
    } catch (error) {
      console.error('Failed to create child:', error);
      alert('Failed to add child. Please check the console and Auth0 configuration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="size-full overflow-y-auto flex items-center justify-center p-6"
      style={{
        backgroundColor: '#e4d5b7',
        backgroundImage: 'url(https://www.toptal.com/designers/subtlepatterns/patterns/old_map.png)',
        backgroundSize: '400px 400px',
      }}
    >
      {/* Parchment overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 15% 20%, rgba(90, 70, 50, 0.08) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 75%, rgba(80, 60, 40, 0.06) 0%, transparent 40%),
            linear-gradient(180deg, 
              rgba(244, 232, 208, 0.5) 0%, 
              rgba(235, 224, 203, 0.3) 50%,
              rgba(244, 232, 208, 0.5) 100%
            )
          `
        }}
      />

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress bar */}
        <div className="mb-6">
          <div 
            className="h-2 overflow-hidden"
            style={{
              background: 'rgba(250, 245, 235, 0.4)',
              border: '1px solid rgba(40, 30, 20, 0.25)',
            }}
          >
            <motion.div
              className="h-full"
              style={{ background: 'rgba(80, 100, 60, 0.6)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(30, 20, 15, 0.6)', marginTop: '8px', textAlign: 'center' }}>
            page {currentPage + 1} of {questions.length}
          </p>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-8"
            style={{
              background: 'rgba(250, 245, 235, 0.9)',
              border: '2px solid rgba(40, 30, 20, 0.3)',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div className="text-center mb-8">
              <h2 style={{ 
                fontFamily: "'Indie Flower', cursive", 
                fontSize: '34px', 
                color: 'rgba(20, 15, 10, 0.9)', 
                marginBottom: '8px',
                fontWeight: 'bold',
                lineHeight: '1.2',
              }}>
                {currentQuestion.title}
              </h2>
              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(30, 20, 15, 0.7)' }}>
                {currentQuestion.subtitle}
              </p>
            </div>

            <div className="space-y-4">
              {currentQuestion.fields.map((field) => {
                if (field.type === 'text' || field.type === 'number') {
                  return (
                    <div key={field.name}>
                      <label 
                        className="block mb-2"
                        style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '19px', color: 'rgba(20, 15, 10, 0.8)', fontWeight: 'bold' }}
                      >
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        value={(data[field.name as keyof QuestionnaireData] as string) || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        required={field.required}
                        className="w-full px-4 py-3 transition-all"
                        style={{
                          fontFamily: "'Patrick Hand', cursive",
                          fontSize: '18px',
                          color: 'rgba(15, 10, 5, 0.9)',
                          background: 'rgba(255, 250, 240, 0.5)',
                          border: '1px solid rgba(40, 30, 20, 0.25)',
                          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                        }}
                      />
                    </div>
                  );
                } else if (field.type === 'textarea') {
                  return (
                    <div key={field.name}>
                      {field.label && (
                        <label 
                          className="block mb-2"
                          style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '19px', color: 'rgba(20, 15, 10, 0.8)', fontWeight: 'bold' }}
                        >
                          {field.label}
                        </label>
                      )}
                      <textarea
                        value={(data[field.name as keyof QuestionnaireData] as string) || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        rows={field.rows}
                        required={field.required}
                        className="w-full px-4 py-3 transition-all resize-none"
                        style={{
                          fontFamily: "'Patrick Hand', cursive",
                          fontSize: '18px',
                          color: 'rgba(15, 10, 5, 0.9)',
                          background: 'rgba(255, 250, 240, 0.5)',
                          border: '1px solid rgba(40, 30, 20, 0.25)',
                          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                        }}
                      />
                    </div>
                  );
                } else if (field.type === 'radio') {
                  return (
                    <div key={field.name} className="space-y-3">
                      {field.options?.map((option) => {
                        const isSelected = data[field.name as keyof QuestionnaireData] === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleInputChange(field.name, option.value)}
                            className="w-full px-5 py-4 text-left transition-all cursor-pointer group"
                            style={{
                              fontFamily: "'Patrick Hand', cursive",
                              fontSize: '19px',
                              fontWeight: 'bold',
                              color: isSelected ? 'rgba(20, 15, 10, 0.9)' : 'rgba(30, 20, 15, 0.75)',
                              background: isSelected ? 'rgba(210, 180, 140, 0.4)' : 'rgba(250, 245, 235, 0.3)',
                              border: isSelected ? '2px solid rgba(40, 30, 20, 0.5)' : '1px solid rgba(40, 30, 20, 0.25)',
                              boxShadow: isSelected ? '0 3px 8px rgba(0, 0, 0, 0.15)' : '0 2px 5px rgba(0, 0, 0, 0.08)',
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {option.emoji && <span style={{ fontSize: '28px', minWidth: '32px' }}>{option.emoji}</span>}
                              <span style={{ lineHeight: '1.4' }}>{option.label}</span>
                              {isSelected && <Check className="w-5 h-5 ml-auto flex-shrink-0" style={{ color: 'rgba(60, 100, 60, 0.8)' }} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                } else if (field.type === 'checkbox') {
                  return (
                    <div key={field.name} className="space-y-2.5">
                      {field.options?.map((option) => {
                        const isChecked = (data[field.name as keyof QuestionnaireData] as string[] || []).includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleCheckboxChange(field.name, option.value, !isChecked)}
                            className="w-full px-4 py-3 text-left transition-all cursor-pointer"
                            style={{
                              fontFamily: "'Patrick Hand', cursive",
                              fontSize: '17px',
                              fontWeight: isChecked ? 'bold' : 'normal',
                              color: isChecked ? 'rgba(20, 15, 10, 0.9)' : 'rgba(30, 20, 15, 0.7)',
                              background: isChecked ? 'rgba(210, 180, 140, 0.3)' : 'rgba(250, 245, 235, 0.25)',
                              border: isChecked ? '2px solid rgba(40, 30, 20, 0.4)' : '1px solid rgba(40, 30, 20, 0.2)',
                              boxShadow: isChecked ? '0 2px 6px rgba(0, 0, 0, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.06)',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                                style={{
                                  border: '2px solid rgba(40, 30, 20, 0.4)',
                                  background: isChecked ? 'rgba(80, 100, 60, 0.3)' : 'transparent',
                                }}
                              >
                                {isChecked && <Check className="w-4 h-4" style={{ color: 'rgba(40, 60, 40, 0.9)' }} />}
                              </div>
                              <span>{option.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              })}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-3 transition-all cursor-pointer flex items-center gap-2"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'rgba(25, 20, 15, 0.75)',
                  background: 'rgba(250, 245, 235, 0.35)',
                  border: '1px solid rgba(40, 30, 20, 0.25)',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 250, 240, 0.45)';
                  e.currentTarget.style.borderColor = 'rgba(40, 30, 20, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(250, 245, 235, 0.35)';
                  e.currentTarget.style.borderColor = 'rgba(40, 30, 20, 0.25)';
                }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>back</span>
              </button>

              {currentPage < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1 py-3 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: 'rgba(20, 15, 10, 0.85)',
                    background: 'rgba(60, 50, 40, 0.08)',
                    border: '1px solid rgba(30, 20, 15, 0.3)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    if (canProceed()) {
                      e.currentTarget.style.background = 'rgba(60, 50, 40, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(30, 20, 15, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(60, 50, 40, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(30, 20, 15, 0.3)';
                  }}
                >
                  <span>continue</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="flex-1 py-3 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: 'rgba(20, 15, 10, 0.85)',
                    background: 'rgba(60, 100, 60, 0.15)',
                    border: '1px solid rgba(40, 60, 40, 0.4)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    if (canProceed() && !isSubmitting) {
                      e.currentTarget.style.background = 'rgba(60, 100, 60, 0.25)';
                      e.currentTarget.style.borderColor = 'rgba(40, 60, 40, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(60, 100, 60, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(40, 60, 40, 0.4)';
                  }}
                >
                  {isSubmitting ? (
                    <span>inscribing in the dream book...</span>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>complete</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand:wght@400&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
