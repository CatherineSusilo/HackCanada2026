import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface InteractionData {
  id: string;
  type: 'choice' | 'quiz' | 'drawing';
  paragraphIndex: number;
  prompt: string;
  imagePrompt?: string;
  options?: { id: string; emoji: string; text: string }[];
  bridgeTexts?: Record<string, string>;
  correctAnswer?: boolean;
  response: any | null;
}

interface StoryInteractionProps {
  interaction: InteractionData;
  childAge: number;
  announced: boolean;
  onRespond: (interactionId: string, response: any) => void;
}

export function StoryInteraction({ interaction, childAge, announced, onRespond }: StoryInteractionProps) {
  const { type } = interaction;

  if (!announced) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 z-40 flex flex-col justify-end"
      style={{ background: 'rgba(0, 0, 0, 0.45)' }}
    >
      <div className="w-full flex flex-col items-center pb-10 px-6">
        {/* Prompt text - subtitle style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 px-8 py-5 w-full max-w-[900px]"
          style={{
            background: 'rgba(0, 0, 0, 0.65)',
            borderRadius: '12px',
          }}
        >
          <p
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: childAge <= 4 ? '34px' : '30px',
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: '1.4',
              margin: 0,
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            {interaction.prompt}
          </p>
        </motion.div>

        {/* Interaction controls */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-full max-w-[900px]"
        >
          {type === 'choice' && <ChoiceUI interaction={interaction} childAge={childAge} announced={announced} onRespond={onRespond} />}
          {type === 'quiz' && <QuizUI interaction={interaction} childAge={childAge} announced={announced} onRespond={onRespond} />}
          {type === 'drawing' && <DrawingUI interaction={interaction} onRespond={onRespond} />}
        </motion.div>
      </div>
    </motion.div>
  );
}

function ChoiceUI({ interaction, childAge, onRespond }: StoryInteractionProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (optionId: string) => {
    if (selected) return;
    setSelected(optionId);
    const bridgeText = interaction.bridgeTexts?.[optionId] || '';
    setTimeout(() => {
      onRespond(interaction.id, { selectedOption: optionId, bridgeText });
    }, 800);
  };

  return (
    <div className="flex gap-4 justify-center flex-wrap">
      {interaction.options?.map((option, i) => (
        <motion.button
          key={option.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.15, type: 'spring', stiffness: 200 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => handleSelect(option.id)}
          className="cursor-pointer flex flex-col items-center gap-3"
          style={{
            width: childAge <= 4 ? '180px' : '200px',
            padding: childAge <= 4 ? '28px 16px' : '24px 20px',
            background: selected === option.id
              ? 'rgba(130, 100, 255, 0.5)'
              : 'rgba(0, 0, 0, 0.55)',
            border: selected === option.id
              ? '3px solid rgba(200, 180, 255, 0.7)'
              : '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            opacity: selected && selected !== option.id ? 0.3 : 1,
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(4px)',
          }}
        >
          <span style={{ fontSize: childAge <= 4 ? '64px' : '52px', lineHeight: 1 }}>{option.emoji}</span>
          <span
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: childAge <= 4 ? '28px' : '24px',
              color: '#ffffff',
              textShadow: '0 2px 6px rgba(0,0,0,0.4)',
              textAlign: 'center',
            }}
          >
            {option.text}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

function QuizUI({ interaction, childAge, onRespond }: StoryInteractionProps) {
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (answer: boolean) => {
    if (answered !== null) return;
    setAnswered(answer);
    const correct = answer === interaction.correctAnswer;
    setShowResult(true);
    setTimeout(() => {
      onRespond(interaction.id, { answer, correct });
    }, 2000);
  };

  return (
    <div>
      <div className="flex gap-6 justify-center">
        {[true, false].map((val, i) => (
          <motion.button
            key={String(val)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.15, type: 'spring', stiffness: 200 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => handleAnswer(val)}
            className="cursor-pointer flex flex-col items-center gap-3"
            style={{
              width: childAge <= 4 ? '180px' : '200px',
              padding: childAge <= 4 ? '32px 24px' : '28px 24px',
              background: answered === val
                ? showResult && val === interaction.correctAnswer
                  ? 'rgba(80, 200, 120, 0.45)'
                  : showResult && val !== interaction.correctAnswer
                    ? 'rgba(255, 80, 80, 0.4)'
                    : 'rgba(130, 100, 255, 0.5)'
                : 'rgba(0, 0, 0, 0.55)',
              border: answered === val
                ? '3px solid rgba(200, 180, 255, 0.7)'
                : '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              opacity: answered !== null && answered !== val ? 0.3 : 1,
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(4px)',
            }}
          >
            <span style={{ fontSize: childAge <= 4 ? '72px' : '60px', lineHeight: 1 }}>
              {val ? '👍' : '👎'}
            </span>
            <span
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: childAge <= 4 ? '32px' : '28px',
                color: '#ffffff',
                textShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}
            >
              {val ? 'True!' : 'False!'}
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 text-center"
          >
            <span style={{ fontSize: '64px' }}>
              {answered === interaction.correctAnswer ? '⭐' : '💫'}
            </span>
            <p
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '28px',
                color: '#ffffff',
                marginTop: '4px',
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              {answered === interaction.correctAnswer
                ? 'Great job! You remembered!'
                : "Good try! Let's keep listening!"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DrawingUI({ interaction, onRespond }: { interaction: InteractionData; onRespond: (id: string, response: any) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'rgba(15, 13, 38, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx || !lastPos.current) return;
    const pos = getPos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const drawingDataUrl = canvas.toDataURL('image/png');
    onRespond(interaction.id, { drawingUrl: drawingDataUrl });
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onRespond(interaction.id, { drawingUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const colors = ['#ffffff', '#ffb3ba', '#bae1ff', '#baffc9', '#ffffba', '#e8c0ff'];

  return (
    <div className="flex flex-col items-center">
      {/* Color picker */}
      <div className="flex gap-3 justify-center mb-4">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="rounded-full cursor-pointer transition-transform"
            style={{
              width: '36px',
              height: '36px',
              background: c,
              border: color === c ? '3px solid rgba(255, 255, 255, 0.9)' : '2px solid rgba(255,255,255,0.3)',
              transform: color === c ? 'scale(1.25)' : 'scale(1)',
              boxShadow: color === c ? '0 0 12px rgba(255,255,255,0.3)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={600}
        height={350}
        className="w-full max-w-[600px] cursor-crosshair touch-none"
        style={{
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          background: 'rgba(15, 13, 38, 0.5)',
          backdropFilter: 'blur(4px)',
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />

      {/* Action buttons */}
      <div className="flex gap-4 mt-5 justify-center">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleSubmit}
          disabled={!hasDrawn}
          className="cursor-pointer"
          style={{
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '26px',
            color: '#ffffff',
            padding: '16px 36px',
            background: hasDrawn ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0,0,0,0.25)',
            border: hasDrawn ? '2px solid rgba(255,255,255,0.35)' : '2px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            opacity: hasDrawn ? 1 : 0.4,
            backdropFilter: 'blur(4px)',
            textShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          ✨ Done!
        </motion.button>

        <label
          className="cursor-pointer"
          style={{
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '26px',
            color: '#ffffff',
            padding: '16px 36px',
            background: 'rgba(0, 0, 0, 0.55)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            backdropFilter: 'blur(4px)',
            textShadow: '0 2px 6px rgba(0,0,0,0.4)',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          📸 Photo
          <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
        </label>
      </div>
    </div>
  );
}
