import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Coffee, Sparkles, Volume2, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { audioEngine } from '../audioEngine';
import { PomodoroMode } from '../types';

interface PomodoroTimerProps {
  onSessionComplete?: (mode: PomodoroMode) => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onSessionComplete }) => {
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [soundAlert, setSoundAlert] = useState<boolean>(true);

  // Custom durations (in seconds)
  const durations: Record<PomodoroMode, number> = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  const timerRef = useRef<number | null>(null);

  // Switch modes
  const handleModeChange = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(durations[newMode]);
  };

  // Start / Pause
  const togglePlay = () => {
    audioEngine.init();
    setIsRunning((prev) => !prev);
  };

  // Reset
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  };

  // Add 1 minute
  const addMinute = () => {
    setTimeLeft((prev) => prev + 60);
  };

  // Timer Tick Effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Finished!
            if (soundAlert) {
              audioEngine.playTibetanChime();
            }
            if (mode === 'work') {
              setCompletedSessions((c) => c + 1);
            }
            onSessionComplete?.(mode);

            // Auto-switch mode
            if (mode === 'work') {
              const nextMode: PomodoroMode = (completedSessions + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
              setMode(nextMode);
              return durations[nextMode];
            } else {
              setMode('work');
              return durations.work;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, completedSessions, soundAlert, onSessionComplete]);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = durations[mode];
  const progressPercent = Math.max(0, Math.min(100, ((totalTime - timeLeft) / totalTime) * 100));

  return (
    <div
      id="pomodoro-floating-card"
      className={`transition-all duration-300 backdrop-blur-xl bg-slate-950/75 border border-white/15 rounded-2xl shadow-2xl text-slate-100 ${
        isMinimized ? 'p-3 w-56' : 'p-5 w-72 sm:w-80'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${mode === 'work' ? 'bg-sky-400' : 'bg-emerald-400'}`} />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {mode === 'work' ? 'Focus Interval' : mode === 'shortBreak' ? 'Short Rest' : 'Deep Rest'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            id="pomodoro-sound-toggle-btn"
            onClick={() => {
              setSoundAlert((prev) => !prev);
              if (!soundAlert) audioEngine.playTibetanChime();
            }}
            title={soundAlert ? 'Sound alert enabled' : 'Mute alert'}
            className={`p-1 rounded-lg transition-colors text-xs ${
              soundAlert ? 'text-sky-300 hover:bg-white/10' : 'text-slate-500 hover:bg-white/5'
            }`}
          >
            <Bell size={14} />
          </button>
          <button
            id="pomodoro-minimize-btn"
            onClick={() => setIsMinimized((prev) => !prev)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title={isMinimized ? 'Expand timer' : 'Minimize timer'}
          >
            {isMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {isMinimized ? (
        // Minimized View
        <div className="flex items-center justify-between pt-2">
          <span className="font-mono text-xl font-bold tracking-tight text-white">{formatTime(timeLeft)}</span>
          <div className="flex items-center gap-1">
            <button
              id="pomodoro-minimized-play-btn"
              onClick={togglePlay}
              className={`p-1.5 rounded-lg text-white ${
                isRunning ? 'bg-amber-500/80 hover:bg-amber-500' : 'bg-sky-500/80 hover:bg-sky-500'
              }`}
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
        </div>
      ) : (
        // Expanded Full View
        <div className="pt-4 space-y-4">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 rounded-xl border border-white/5 text-xs">
            <button
              id="pomodoro-tab-work"
              onClick={() => handleModeChange('work')}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                mode === 'work' ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Focus 25m
            </button>
            <button
              id="pomodoro-tab-short"
              onClick={() => handleModeChange('shortBreak')}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                mode === 'shortBreak' ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Break 5m
            </button>
            <button
              id="pomodoro-tab-long"
              onClick={() => handleModeChange('longBreak')}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                mode === 'longBreak' ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rest 15m
            </button>
          </div>

          {/* Time Display with Circular / Linear Progress */}
          <div className="relative flex flex-col items-center justify-center py-2">
            <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
              {formatTime(timeLeft)}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800/80 h-2 rounded-full mt-3 overflow-hidden border border-white/10">
              <div
                className={`h-full transition-all duration-300 ${
                  mode === 'work'
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-400'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between w-full mt-2 text-[11px] text-slate-400">
              <span>{Math.round(progressPercent)}% elapsed</span>
              <span>
                Streak: <strong className="text-sky-300">{completedSessions}</strong> {completedSessions === 1 ? 'cycle' : 'cycles'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              id="pomodoro-reset-btn"
              onClick={resetTimer}
              title="Reset current interval"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            >
              <RotateCcw size={16} />
            </button>

            <button
              id="pomodoro-main-toggle-btn"
              onClick={togglePlay}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                isRunning
                  ? 'bg-amber-500/90 hover:bg-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-sky-500/90 hover:bg-sky-500 text-slate-950 shadow-sky-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause size={17} />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={17} className="fill-slate-950" />
                  <span>Start Focus</span>
                </>
              )}
            </button>

            <button
              id="pomodoro-add-min-btn"
              onClick={addMinute}
              title="Add 1 minute"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors flex items-center text-xs font-mono"
            >
              <Plus size={14} />
              <span>1m</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
