import React from 'react';
import { Play, Pause, RotateCcw, X, Clock, Flame, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PomodoroTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  secondsLeft: number;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  mode: 'focus' | 'shortBreak' | 'longBreak';
  setMode: (mode: 'focus' | 'shortBreak' | 'longBreak') => void;
  completedSessions: number;
}

export const PomodoroTimerModal: React.FC<PomodoroTimerModalProps> = ({
  isOpen,
  onClose,
  secondsLeft,
  isRunning,
  onToggle,
  onReset,
  mode,
  setMode,
  completedSessions,
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const totalSeconds = mode === 'focus' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60;
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay-backdrop)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '28px', textAlign: 'center', position: 'relative' }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <Clock size={20} color="var(--accent-indigo)" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>StudySync Focus Timer</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Pomodoro synchronization with automatic study streak and session logging.
        </p>

        {/* Mode Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px', background: 'var(--bg-inset)', padding: '4px', borderRadius: '12px' }}>
          <button
            className={`btn btn-sm ${mode === 'focus' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('focus')}
          >
            25m Focus
          </button>
          <button
            className={`btn btn-sm ${mode === 'shortBreak' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('shortBreak')}
          >
            5m Short Break
          </button>
          <button
            className={`btn btn-sm ${mode === 'longBreak' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('longBreak')}
          >
            15m Long Break
          </button>
        </div>

        {/* Timer Display with Circular Progress */}
        <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 24px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="200" height="200" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="transparent"
              stroke="var(--border-subtle)"
              strokeWidth="8"
            />
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="transparent"
              stroke={mode === 'focus' ? 'var(--accent-indigo)' : 'var(--accent-emerald)'}
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div style={{ zIndex: 1 }}>
            <div style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)' }}>
              {formattedTime}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {mode === 'focus' ? 'Deep Work Session' : 'Rest & Recharge'}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
          <button 
            className={`btn ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
            style={{ minWidth: '130px', padding: '12px 24px', fontSize: '1rem' }}
            onClick={onToggle}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            {isRunning ? 'Pause' : 'Start Focus'}
          </button>
          <button 
            className="btn btn-secondary btn-icon"
            onClick={onReset}
            title="Reset Timer"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Sessions Tracked */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Flame size={16} color="var(--accent-amber)" />
            Completed Today: <strong style={{ color: 'var(--text-primary)' }}>{completedSessions}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={16} color="var(--accent-emerald)" />
            Logged: <strong style={{ color: 'var(--text-primary)' }}>{completedSessions * 25} mins</strong>
          </div>
        </div>

      </div>
    </div>
  );
};
