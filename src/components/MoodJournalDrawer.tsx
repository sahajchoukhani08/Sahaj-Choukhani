import React, { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, Trash2, Copy, Check, Calendar, ArrowRight, Zap, Target, Leaf, Moon, Wind } from 'lucide-react';
import { MoodEntry } from '../types';

interface MoodJournalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentIntention: string;
}

const MOODS = [
  { id: 'energized', label: 'Energized', emoji: '⚡', icon: Zap, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
  { id: 'focused', label: 'Focused', emoji: '🎯', icon: Target, color: 'text-sky-400 border-sky-500/40 bg-sky-500/10' },
  { id: 'calm', label: 'Calm', emoji: '🌿', icon: Leaf, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
  { id: 'tired', label: 'Tired', emoji: '🥱', icon: Moon, color: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10' },
  { id: 'distracted', label: 'Distracted', emoji: '🌪️', icon: Wind, color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
] as const;

export const MoodJournalDrawer: React.FC<MoodJournalDrawerProps> = ({
  isOpen,
  onClose,
  currentIntention,
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodEntry['mood']>('focused');
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [scratchpadNote, setScratchpadNote] = useState<string>('');
  const [quickReflection, setQuickReflection] = useState<string>('');
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedBadge, setSavedBadge] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedScratchpad = localStorage.getItem('focus_scratchpad');
      if (savedScratchpad) {
        setScratchpadNote(savedScratchpad);
      }

      const savedEntries = localStorage.getItem('focus_mood_entries');
      if (savedEntries) {
        setEntries(JSON.parse(savedEntries));
      }
    } catch (e) {
      console.error('Failed to read from localStorage:', e);
    }
  }, []);

  // Auto-save scratchpad to localStorage
  const handleScratchpadChange = (text: string) => {
    setScratchpadNote(text);
    try {
      localStorage.setItem('focus_scratchpad', text);
      setSavedBadge(true);
      setTimeout(() => setSavedBadge(false), 1200);
    } catch (e) {
      console.error('Failed to save scratchpad:', e);
    }
  };

  // Log new Mood entry
  const handleSaveMoodEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: MoodEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      mood: selectedMood,
      energy: energyLevel,
      note: quickReflection.trim(),
      intention: currentIntention || 'Open flow',
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    setQuickReflection('');

    try {
      localStorage.setItem('focus_mood_entries', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save mood entries:', err);
    }
  };

  // Delete an entry
  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    try {
      localStorage.setItem('focus_mood_entries', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update entries:', err);
    }
  };

  // Copy scratchpad content
  const handleCopyScratchpad = () => {
    if (!scratchpadNote) return;
    navigator.clipboard.writeText(scratchpadNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const wordCount = scratchpadNote.trim() ? scratchpadNote.trim().split(/\s+/).length : 0;

  if (!isOpen) return null;

  return (
    <div
      id="mood-journal-drawer-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="mood-journal-drawer-panel"
        className="w-full max-w-md h-full bg-slate-950/95 border-l border-white/15 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in slide-in-from-right duration-300"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <BookOpen className="text-sky-400" size={20} />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Micro-Journal & Mood</h2>
              <p className="text-xs text-slate-400">Capture mind-state and fleeting thoughts</p>
            </div>
          </div>
          <button
            id="close-mood-drawer-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Section 1: Check-in Mood & Energy */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Current Mind State
              </label>
              <span className="text-xs text-slate-400">Select vibe</span>
            </div>

            {/* 5-Emoji Mood Picker */}
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((m) => {
                const isSelected = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    id={`mood-select-${m.id}`}
                    type="button"
                    onClick={() => setSelectedMood(m.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${
                      isSelected
                        ? `${m.color} ring-2 ring-white/30 scale-105 shadow-lg`
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl mb-1">{m.emoji}</span>
                    <span className="text-[11px] font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Energy Slider */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Energy & Clarity:</span>
                <span className="font-mono font-bold text-sky-400">{energyLevel} / 10</span>
              </div>
              <input
                id="energy-level-slider"
                type="range"
                min="1"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Drained</span>
                <span>Balanced</span>
                <span>Peak Flow</span>
              </div>
            </div>

            {/* Quick reflection input */}
            <form onSubmit={handleSaveMoodEntry} className="space-y-2 pt-2">
              <div className="flex gap-2">
                <input
                  id="mood-quick-reflection-input"
                  type="text"
                  placeholder="One line thought or sensation..."
                  value={quickReflection}
                  onChange={(e) => setQuickReflection(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
                <button
                  id="log-mood-entry-btn"
                  type="submit"
                  className="px-3.5 py-2 bg-sky-500/90 hover:bg-sky-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1 shrink-0"
                >
                  <span>Log</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </form>
          </div>

          <hr className="border-white/10" />

          {/* Section 2: Brain Dump Scratchpad */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Brain Dump Scratchpad
                </label>
                {savedBadge && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    Saved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{wordCount} words</span>
                <button
                  id="copy-scratchpad-btn"
                  onClick={handleCopyScratchpad}
                  title="Copy scratchpad to clipboard"
                  className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <textarea
              id="brain-dump-scratchpad"
              rows={6}
              value={scratchpadNote}
              onChange={(e) => handleScratchpadChange(e.target.value)}
              placeholder="Dump quick thoughts, distractions to parking lot, snippets, or tasks so they don't break your flow state..."
              className="w-full bg-black/40 border border-white/15 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 leading-relaxed resize-none transition-colors"
            />
          </div>

          <hr className="border-white/10" />

          {/* Section 3: Reflection History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Session History ({entries.length})
              </label>
              {entries.length > 0 && (
                <button
                  id="clear-all-mood-entries-btn"
                  onClick={() => {
                    if (confirm('Clear all logged mood history?')) {
                      setEntries([]);
                      localStorage.removeItem('focus_mood_entries');
                    }
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Clear log
                </button>
              )}
            </div>

            {entries.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-slate-400">
                No reflections logged yet. Pick a mood above and tap "Log" to record your mental state.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {entries.map((entry) => {
                  const moodDef = MOODS.find((m) => m.id === entry.mood) || MOODS[1];
                  const timeStr = new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{moodDef.emoji}</span>
                          <span className="font-semibold text-white capitalize">{entry.mood}</span>
                          <span className="text-[10px] text-slate-400 bg-white/10 px-1.5 py-0.5 rounded">
                            Energy {entry.energy}/10
                          </span>
                          <span className="text-[10px] text-slate-500 ml-auto">{timeStr}</span>
                        </div>
                        {entry.note && <p className="text-slate-300 text-xs italic">"{entry.note}"</p>}
                        {entry.intention && (
                          <div className="text-[10px] text-slate-400 truncate">
                            🎯 Focus: <span className="text-slate-300">{entry.intention}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        title="Delete log"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
