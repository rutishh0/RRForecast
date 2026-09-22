import React, { useState } from 'react';
import { BrainrotQuestion } from '@/lib/types';
import { CheckCircle2, Zap, Clock } from 'lucide-react';

interface PlayerQuizInputProps {
  question: BrainrotQuestion;
  questionNumber: number;
  totalQuestions: number;
  timerSeconds: number;
  /** Seconds of 'get ready' left before taps are accepted. */
  preRoll: number;
  /** The option the server has recorded for this player, if any. */
  myAnswer?: number;
  onSelectOption: (optionIndex: number) => void;
}

const LETTERS = ['A', 'B', 'C', 'D'];
const THEMES = [{ bg: 'bg-[#00e5ff]' }, { bg: 'bg-[#00e676]' }, { bg: 'bg-[#ff9100]' }, { bg: 'bg-[#ff1744]' }];

/** Mount with key={question.id} so local tap state never leaks between questions. */
export const PlayerQuizInput: React.FC<PlayerQuizInputProps> = ({
  question,
  questionNumber,
  totalQuestions,
  timerSeconds,
  preRoll,
  myAnswer,
  onSelectOption,
}) => {
  const [tapped, setTapped] = useState<number | null>(null);
  const [nudge, setNudge] = useState(false);
  const selected = myAnswer ?? tapped;
  const timeUp = timerSeconds <= 0;
  const notYet = preRoll > 0;
  const locked = selected !== null || timeUp || notYet;

  const handleTap = (index: number) => {
    if (notYet) {
      setNudge(true);
      setTimeout(() => setNudge(false), 900);
      return;
    }
    if (locked) return;
    setTapped(index);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(35);
    onSelectOption(index);
  };

  return (
    <div className="flex-grow flex flex-col p-4 max-w-md mx-auto w-full font-mono select-none gap-3">
      <div className="bg-[#0d1522] border border-[#1e314f] rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00e5ff]" />
          <span className="text-xs font-black uppercase text-[#f0f4f8]">
            Decryptor · {questionNumber}/{totalQuestions}
          </span>
        </div>
        <div className={`flex items-center gap-1 text-sm font-telemetry font-bold ${notYet ? 'text-[#829ab1]' : timerSeconds <= 5 ? 'text-[#ff1744]' : 'text-[#ff9100]'}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{notYet ? `in ${preRoll}` : `${timerSeconds}s`}</span>
        </div>
      </div>

      <div className="bg-[#131f33] border border-[#1e314f] rounded-2xl p-3 text-center">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#829ab1] mb-1">Decode this</div>
        <div className="text-sm font-bold text-[#f0f4f8] leading-snug">&ldquo;{question.slangPrompt}&rdquo;</div>
      </div>

      <div className="text-center min-h-[40px] flex items-center justify-center">
        {selected !== null ? (
          <div className="text-xs font-black text-[#00e676] uppercase flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Locked in — watch the screen for the reveal</span>
          </div>
        ) : notYet ? (
          <div className={`text-sm font-black uppercase tracking-widest ${nudge ? 'text-[#ff1744]' : 'text-[#ff9100] animate-pulse'}`}>{nudge ? 'Not yet!' : `Get ready… ${preRoll}`}</div>
        ) : timeUp ? (
          <div className="text-xs font-black text-[#ff1744] uppercase">Time&apos;s up</div>
        ) : (
          <div className="text-xs font-bold text-[#829ab1] uppercase tracking-wider">Tap what it actually means</div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {question.options.map((opt, idx) => {
          const theme = THEMES[idx];
          const isSelected = selected === idx;
          return (
            <button
              key={idx}
              disabled={locked && !notYet}
              onClick={() => handleTap(idx)}
              className={`p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 text-left active:scale-[0.98] ${
                isSelected
                  ? 'border-[#f0f4f8] bg-[#f0f4f8]/10 glow-cyan scale-[1.02] text-[#f0f4f8]'
                  : notYet
                    ? 'border-[#1e314f] bg-[#0d1522] text-[#f0f4f8] opacity-70'
                    : locked
                      ? 'border-[#1e314f] bg-[#0d1522]/40 opacity-40 text-[#829ab1]'
                      : `border-[#1e314f] bg-[#0d1522] text-[#f0f4f8]`
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0 font-telemetry ${
                  isSelected ? 'bg-[#f0f4f8] text-[#06090e]' : `${theme.bg} text-[#06090e]`
                }`}
              >
                {LETTERS[idx]}
              </div>
              <div className="text-sm font-bold leading-snug flex-grow">{opt.text}</div>
            </button>
          );
        })}
      </div>

      <div className="text-center text-[10px] text-[#829ab1]">Correct = 500 + speed bonus. First five correct answers get +250.</div>
    </div>
  );
};
