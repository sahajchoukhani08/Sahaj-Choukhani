import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Sliders,
  Eye,
  BookOpen,
  Maximize2,
  Minimize2,
  Sparkles,
  Pin,
  PinOff,
  Edit3,
  Check,
  RotateCcw,
  Zap,
  Flame,
  CloudRain,
  Trees,
  Compass,
  Play,
  Pause,
} from 'lucide-react';
import { CanvasVisualizer } from './components/CanvasVisualizer';
import { PomodoroTimer } from './components/PomodoroTimer';
import { MoodJournalDrawer } from './components/MoodJournalDrawer';
import { AudioMixerModal, AudioMixerState } from './components/AudioMixerModal';
import { VisualizerControlsModal } from './components/VisualizerControlsModal';
import { audioEngine } from './audioEngine';
import { COLOR_PALETTES, SOUND_PRESETS } from './presets';
import { ColorPalette, VisualizerMode, SoundPreset, PomodoroMode } from './types';

export default function App() {
  // Visualizer State
  const [visualMode, setVisualMode] = useState<VisualizerMode>('particles');
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette>(COLOR_PALETTES[0]);
  const [visualSpeed, setVisualSpeed] = useState<number>(1.0);

  // Audio Mixer State
  const [mixerState, setMixerState] = useState<AudioMixerState>({
    masterVolume: 0.8,
    isMuted: false,
    whiteNoise: 0,
    brownNoise: 0.5,
    binauralType: 'alpha',
    binauralVolume: 0.35,
    rain: 0.25,
    fire: 0,
    birds: 0,
  });

  // Focus Intention
  const [intention, setIntention] = useState<string>('Deep Creative Focus');
  const [isEditingIntention, setIsEditingIntention] = useState<boolean>(false);
  const [tempIntention, setTempIntention] = useState<string>('Deep Creative Focus');

  // UI Modals & Drawers
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);
  const [isVisualModalOpen, setIsVisualModalOpen] = useState<boolean>(false);
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);

  // HUD Auto-hide state
  const [isHudVisible, setIsHudVisible] = useState<boolean>(true);
  const [isHudPinned, setIsHudPinned] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [audioStarted, setAudioStarted] = useState<boolean>(false);

  // Mouse inactivity timer for auto-hide
  const hideTimerRef = useRef<number | null>(null);

  // Reset auto-hide timer on mouse activity
  const handleUserActivity = useCallback(() => {
    setIsHudVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    if (!isHudPinned && !isAudioModalOpen && !isVisualModalOpen && !isJournalOpen) {
      hideTimerRef.current = window.setTimeout(() => {
        setIsHudVisible(false);
      }, 4000);
    }
  }, [isHudPinned, isAudioModalOpen, isVisualModalOpen, isJournalOpen]);

  useEffect(() => {
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    // Initial 4s timer
    handleUserActivity();

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [handleUserActivity]);

  // Load saved intention & preferences
  useEffect(() => {
    try {
      const savedIntention = localStorage.getItem('focus_user_intention');
      if (savedIntention) {
        setIntention(savedIntention);
        setTempIntention(savedIntention);
      }
    } catch {}
  }, []);

  // Save intention
  const saveIntention = (text: string) => {
    const clean = text.trim() || 'Mindful Presence';
    setIntention(clean);
    setTempIntention(clean);
    setIsEditingIntention(false);
    try {
      localStorage.setItem('focus_user_intention', clean);
    } catch {}
  };

  // Preset Selection
  const applyPreset = (preset: SoundPreset) => {
    audioEngine.init();
    setAudioStarted(true);

    // Update Visualizer
    const pal = COLOR_PALETTES.find((p) => p.id === preset.paletteId) || COLOR_PALETTES[0];
    setSelectedPalette(pal);
    setVisualMode(preset.visualMode);

    // Update Audio
    audioEngine.setTrackVolume('whiteNoise', preset.tracks.whiteNoise);
    audioEngine.setTrackVolume('brownNoise', preset.tracks.brownNoise);
    audioEngine.setTrackVolume('rain', preset.tracks.rain);
    audioEngine.setTrackVolume('fire', preset.tracks.fire);
    audioEngine.setTrackVolume('birds', preset.tracks.birds);
    audioEngine.updateBinauralBeats(preset.tracks.binaural.type);
    audioEngine.setTrackVolume('binaural', preset.tracks.binaural.type === 'none' ? 0 : preset.tracks.binaural.volume);

    setMixerState((prev) => ({
      ...prev,
      whiteNoise: preset.tracks.whiteNoise,
      brownNoise: preset.tracks.brownNoise,
      binauralType: preset.tracks.binaural.type,
      binauralVolume: preset.tracks.binaural.volume,
      rain: preset.tracks.rain,
      fire: preset.tracks.fire,
      birds: preset.tracks.birds,
    }));
  };

  // Quick Start Audio Engine on first interaction
  const handleStartSoundscape = () => {
    audioEngine.init();
    setAudioStarted(true);
    // Apply current mixer state
    audioEngine.setTrackVolume('whiteNoise', mixerState.whiteNoise);
    audioEngine.setTrackVolume('brownNoise', mixerState.brownNoise);
    audioEngine.setTrackVolume('rain', mixerState.rain);
    audioEngine.setTrackVolume('fire', mixerState.fire);
    audioEngine.setTrackVolume('birds', mixerState.birds);
    audioEngine.updateBinauralBeats(mixerState.binauralType);
    audioEngine.setTrackVolume('binaural', mixerState.binauralType === 'none' ? 0 : mixerState.binauralVolume);
  };

  // Quick Toggle Master Mute
  const handleToggleMute = () => {
    audioEngine.init();
    if (!audioStarted) {
      handleStartSoundscape();
      return;
    }
    const muted = audioEngine.toggleMute();
    setMixerState((prev) => ({ ...prev, isMuted: muted }));
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Calculate active sound layers count
  const activeSoundLayersCount =
    (mixerState.whiteNoise > 0.05 ? 1 : 0) +
    (mixerState.brownNoise > 0.05 ? 1 : 0) +
    (mixerState.binauralType !== 'none' && mixerState.binauralVolume > 0.05 ? 1 : 0) +
    (mixerState.rain > 0.05 ? 1 : 0) +
    (mixerState.fire > 0.05 ? 1 : 0) +
    (mixerState.birds > 0.05 ? 1 : 0);

  return (
    <div
      id="focus-app-root"
      className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 select-none font-sans"
    >
      {/* 1. Procedural HTML5 Canvas Visualizer */}
      <CanvasVisualizer
        mode={visualMode}
        palette={selectedPalette}
        speed={visualSpeed}
      />

      {/* 2. Top Header Bar (Brand & Quick Mood/Presets) */}
      <header
        id="top-floating-header"
        className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-4 sm:p-6 transition-all duration-500 pointer-events-none ${
          isHudVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 backdrop-blur-xl bg-slate-950/60 border border-white/15 px-4 py-2 rounded-2xl shadow-xl pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>Focus & Mood</span>
              <span className="text-[10px] font-mono font-normal uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/10 text-sky-300">
                v2.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Procedural Ambient Sanctuary</p>
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Quick Audio Start Badge if not running */}
          {!audioStarted ? (
            <button
              id="quick-start-audio-btn"
              onClick={handleStartSoundscape}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-sky-500/90 hover:bg-sky-400 text-slate-950 text-xs font-bold shadow-lg shadow-sky-500/25 transition-all animate-pulse"
            >
              <Play size={14} className="fill-slate-950" />
              <span>Enable Audio</span>
            </button>
          ) : (
            <button
              id="top-quick-mute-btn"
              onClick={handleToggleMute}
              className={`p-2.5 rounded-2xl border backdrop-blur-xl transition-all ${
                mixerState.isMuted
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-slate-950/60 text-slate-200 border-white/15 hover:border-white/30'
              }`}
              title={mixerState.isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {mixerState.isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
          )}

          {/* Micro-Journal Drawer Toggle */}
          <button
            id="open-journal-drawer-btn"
            onClick={() => setIsJournalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl backdrop-blur-xl bg-slate-950/60 hover:bg-slate-900/80 border border-white/15 text-slate-200 hover:text-white text-xs font-semibold shadow-xl transition-all"
          >
            <BookOpen size={16} className="text-sky-400" />
            <span className="hidden sm:inline">Journal & Mood</span>
          </button>
        </div>
      </header>

      {/* 3. Floating Pomodoro Timer (Top-Right / Anchored) */}
      <div
        id="pomodoro-widget-wrapper"
        className={`fixed top-20 sm:top-24 right-4 sm:right-6 z-20 transition-all duration-500 pointer-events-auto ${
          isHudVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <PomodoroTimer />
      </div>

      {/* 4. Center Minimalist Watermark & Intention Display */}
      <div
        id="intention-watermark-container"
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center z-10"
      >
        <div className="max-w-2xl pointer-events-auto space-y-3">
          {isEditingIntention ? (
            <div className="p-4 rounded-3xl backdrop-blur-2xl bg-slate-950/90 border border-white/20 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold uppercase tracking-wider text-sky-400">Set Single Focus Intention</span>
                <span className="text-[11px] text-slate-500">Press Enter to lock in</span>
              </div>
              <div className="flex gap-2">
                <input
                  id="intention-input-field"
                  type="text"
                  autoFocus
                  value={tempIntention}
                  onChange={(e) => setTempIntention(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveIntention(tempIntention);
                    if (e.key === 'Escape') setIsEditingIntention(false);
                  }}
                  placeholder="e.g., Complete System Architecture, Code Shader, Deep Meditation..."
                  className="flex-1 bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
                <button
                  id="save-intention-btn"
                  onClick={() => saveIntention(tempIntention)}
                  className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-sky-500/20"
                >
                  <Check size={16} />
                  <span>Set</span>
                </button>
              </div>

              {/* Quick Preset Intentions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Deep Code Session', 'Draft Article', 'Algorithmic Problem', 'Mindful Breathing', 'System Architecture'].map(
                  (preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setTempIntention(preset);
                        saveIntention(preset);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                    >
                      {preset}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            <div
              id="intention-watermark-display"
              onClick={() => setIsEditingIntention(true)}
              className="group cursor-pointer p-4 rounded-3xl transition-all duration-300 hover:bg-slate-950/40 hover:backdrop-blur-md border border-transparent hover:border-white/10"
              title="Click to change your focus intention"
            >
              <div className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-slate-400/80 mb-2 flex items-center justify-center gap-2">
                <span>Current Intention</span>
                <Edit3 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-sky-400" />
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white/90 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] font-['Outfit'] group-hover:text-white transition-colors">
                {intention}
              </h2>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400/70 group-hover:text-slate-300 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                <span>Single-task flow activated</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Bottom Floating Glassmorphism Control Bar (Auto-hiding HUD) */}
      <nav
        id="bottom-floating-control-bar"
        className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-2 sm:p-2.5 rounded-3xl backdrop-blur-2xl bg-slate-950/85 border border-white/15 shadow-2xl transition-all duration-500 pointer-events-auto ${
          isHudVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
        }`}
        onMouseEnter={() => {
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        }}
      >
        {/* Preset Selector Dropdown / Quick Switch */}
        <div className="hidden md:flex items-center gap-1 pl-2 pr-1 border-r border-white/10">
          <span className="text-[11px] text-slate-400 mr-1 font-medium">Vibe:</span>
          {SOUND_PRESETS.slice(0, 3).map((p) => (
            <button
              key={p.id}
              id={`quick-preset-hud-${p.id}`}
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-xs font-medium transition-all"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Audio Mixer Trigger */}
        <button
          id="hud-open-audio-mixer-btn"
          onClick={() => {
            audioEngine.init();
            setAudioStarted(true);
            setIsAudioModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-400/40 text-slate-200 hover:text-white text-xs font-semibold transition-all group"
        >
          <Sliders size={16} className="text-sky-400 group-hover:rotate-45 transition-transform" />
          <span>Audio Mixer</span>
          {activeSoundLayersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 font-mono text-[10px] flex items-center justify-center font-bold">
              {activeSoundLayersCount}
            </span>
          )}
        </button>

        {/* Visualizer Studio Trigger */}
        <button
          id="hud-open-visualizer-studio-btn"
          onClick={() => setIsVisualModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/40 text-slate-200 hover:text-white text-xs font-semibold transition-all"
        >
          <Eye size={16} className="text-purple-400" />
          <span>Visuals & Themes</span>
        </button>

        {/* Pin HUD Button */}
        <button
          id="hud-pin-toggle-btn"
          onClick={() => setIsHudPinned((prev) => !prev)}
          title={isHudPinned ? 'HUD is pinned (always visible)' : 'Auto-hide enabled (hides after 4s idle)'}
          className={`p-2 rounded-2xl border transition-colors ${
            isHudPinned
              ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
              : 'bg-white/5 text-slate-400 hover:text-white border-white/10 hover:bg-white/10'
          }`}
        >
          {isHudPinned ? <Pin size={15} /> : <PinOff size={15} />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          id="hud-fullscreen-toggle-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </nav>

      {/* 6. Modals & Sidebars */}
      <AudioMixerModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        mixerState={mixerState}
        onChangeMixerState={setMixerState}
        onSelectPreset={(p) => {
          applyPreset(p);
          setIsAudioModalOpen(false);
        }}
      />

      <VisualizerControlsModal
        isOpen={isVisualModalOpen}
        onClose={() => setIsVisualModalOpen(false)}
        visualMode={visualMode}
        onChangeVisualMode={setVisualMode}
        selectedPalette={selectedPalette}
        onSelectPalette={setSelectedPalette}
        speed={visualSpeed}
        onChangeSpeed={setVisualSpeed}
      />

      <MoodJournalDrawer
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        currentIntention={intention}
      />
    </div>
  );
}
