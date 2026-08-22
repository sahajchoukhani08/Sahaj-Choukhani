import React from 'react';
import { Volume2, VolumeX, Sliders, CloudRain, Flame, Trees, Radio, Waves, Sparkles, RefreshCw, X } from 'lucide-react';
import { audioEngine } from '../audioEngine';
import { BinauralBeatType, SoundPreset } from '../types';
import { SOUND_PRESETS } from '../presets';

export interface AudioMixerState {
  masterVolume: number;
  isMuted: boolean;
  whiteNoise: number;
  brownNoise: number;
  binauralType: BinauralBeatType;
  binauralVolume: number;
  rain: number;
  fire: number;
  birds: number;
}

interface AudioMixerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mixerState: AudioMixerState;
  onChangeMixerState: (updater: (prev: AudioMixerState) => AudioMixerState) => void;
  onSelectPreset: (preset: SoundPreset) => void;
}

export const AudioMixerModal: React.FC<AudioMixerModalProps> = ({
  isOpen,
  onClose,
  mixerState,
  onChangeMixerState,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  const handleTrackChange = (key: keyof AudioMixerState, value: number) => {
    audioEngine.init();
    onChangeMixerState((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'masterVolume') {
        audioEngine.setMasterVolume(value);
      } else if (key === 'whiteNoise') {
        audioEngine.setTrackVolume('whiteNoise', value);
      } else if (key === 'brownNoise') {
        audioEngine.setTrackVolume('brownNoise', value);
      } else if (key === 'rain') {
        audioEngine.setTrackVolume('rain', value);
      } else if (key === 'fire') {
        audioEngine.setTrackVolume('fire', value);
      } else if (key === 'birds') {
        audioEngine.setTrackVolume('birds', value);
      } else if (key === 'binauralVolume') {
        audioEngine.setTrackVolume('binaural', value);
      }
      return next;
    });
  };

  const handleBinauralTypeChange = (type: BinauralBeatType) => {
    audioEngine.init();
    audioEngine.updateBinauralBeats(type);
    onChangeMixerState((prev) => {
      const vol = type !== 'none' && prev.binauralVolume === 0 ? 0.35 : prev.binauralVolume;
      audioEngine.setTrackVolume('binaural', type === 'none' ? 0 : vol);
      return {
        ...prev,
        binauralType: type,
        binauralVolume: vol,
      };
    });
  };

  const toggleMute = () => {
    audioEngine.init();
    const muted = audioEngine.toggleMute();
    onChangeMixerState((prev) => ({ ...prev, isMuted: muted }));
  };

  const resetAllTracks = () => {
    audioEngine.setTrackVolume('whiteNoise', 0);
    audioEngine.setTrackVolume('brownNoise', 0);
    audioEngine.setTrackVolume('rain', 0);
    audioEngine.setTrackVolume('fire', 0);
    audioEngine.setTrackVolume('birds', 0);
    audioEngine.updateBinauralBeats('none');
    audioEngine.setTrackVolume('binaural', 0);

    onChangeMixerState((prev) => ({
      ...prev,
      whiteNoise: 0,
      brownNoise: 0,
      binauralType: 'none',
      binauralVolume: 0,
      rain: 0,
      fire: 0,
      birds: 0,
    }));
  };

  return (
    <div
      id="audio-mixer-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="audio-mixer-modal-card"
        className="w-full max-w-xl bg-slate-950/95 border border-white/15 rounded-3xl backdrop-blur-2xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Procedural Audio Mixer</h2>
              <p className="text-xs text-slate-400">100% Web Audio procedural soundscapes & binaural frequencies</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="reset-audio-mixer-btn"
              onClick={resetAllTracks}
              title="Reset all tracks to silent"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 text-xs transition-colors flex items-center gap-1"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Mute All</span>
            </button>
            <button
              id="close-audio-mixer-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* Master Volume Bar */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <button
                id="mixer-master-mute-toggle"
                onClick={toggleMute}
                className={`p-2 rounded-xl border transition-colors ${
                  mixerState.isMuted
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                }`}
              >
                {mixerState.isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div>
                <div className="text-xs font-semibold text-white">Master Output</div>
                <div className="text-[11px] text-slate-400">{mixerState.isMuted ? 'Muted' : `${Math.round(mixerState.masterVolume * 100)}%`}</div>
              </div>
            </div>

            <div className="flex-1 max-w-xs">
              <input
                id="mixer-master-volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={mixerState.masterVolume}
                disabled={mixerState.isMuted}
                onChange={(e) => handleTrackChange('masterVolume', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          {/* Quick Soundscape Presets */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Soundscape Presets
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SOUND_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  id={`preset-btn-${preset.id}`}
                  onClick={() => onSelectPreset(preset)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-400/40 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">
                      {preset.name}
                    </span>
                    <Sparkles size={12} className="text-slate-500 group-hover:text-sky-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Continuous Procedural Noise */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Procedural Acoustic Noise
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Brown Noise */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Waves size={16} className="text-amber-400" />
                    <div>
                      <span className="text-xs font-semibold text-white">Brown Noise</span>
                      <p className="text-[10px] text-slate-400">Deep, warm low-frequency rumble</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {Math.round(mixerState.brownNoise * 100)}%
                  </span>
                </div>
                <input
                  id="mixer-brown-noise-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mixerState.brownNoise}
                  onChange={(e) => handleTrackChange('brownNoise', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* White Noise */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio size={16} className="text-sky-400" />
                    <div>
                      <span className="text-xs font-semibold text-white">White Noise</span>
                      <p className="text-[10px] text-slate-400">Full-spectrum acoustic masking</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-300">
                    {Math.round(mixerState.whiteNoise * 100)}%
                  </span>
                </div>
                <input
                  id="mixer-white-noise-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mixerState.whiteNoise}
                  onChange={(e) => handleTrackChange('whiteNoise', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section: Binaural Beats (Stereo Oscillators) */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Binaural Beats Engine (Headphones Recommended)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Stereo-isolated differential tones to synchronize brainwave frequencies
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-300">
                {mixerState.binauralType === 'none' ? 'Off' : `${Math.round(mixerState.binauralVolume * 100)}%`}
              </span>
            </div>

            {/* Binaural Frequency Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
              {[
                { type: 'none', label: 'Off', desc: 'Disabled' },
                { type: 'alpha', label: 'Alpha (10Hz)', desc: 'Flow & Focus' },
                { type: 'theta', label: 'Theta (6Hz)', desc: 'Meditation' },
                { type: 'delta', label: 'Delta (3.5Hz)', desc: 'Deep Rest' },
                { type: 'beta', label: 'Beta (15Hz)', desc: 'Alert Logic' },
              ].map((item) => (
                <button
                  key={item.type}
                  id={`binaural-type-${item.type}`}
                  onClick={() => handleBinauralTypeChange(item.type as BinauralBeatType)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    mixerState.binauralType === item.type
                      ? 'bg-indigo-500/25 border-indigo-400/50 text-indigo-200 shadow-md font-semibold'
                      : 'bg-black/30 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <div className="text-[11px]">{item.label}</div>
                  <div className="text-[9px] text-slate-400 truncate">{item.desc}</div>
                </button>
              ))}
            </div>

            {mixerState.binauralType !== 'none' && (
              <div className="pt-2">
                <input
                  id="mixer-binaural-volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mixerState.binauralVolume}
                  onChange={(e) => handleTrackChange('binauralVolume', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Section: Procedural Ambient Soundscapes */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Procedural Ambient Elements
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Rain */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudRain size={16} className="text-sky-400" />
                    <span className="text-xs font-semibold text-white">Rain & Drops</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-300">
                    {Math.round(mixerState.rain * 100)}%
                  </span>
                </div>
                <input
                  id="mixer-rain-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mixerState.rain}
                  onChange={(e) => handleTrackChange('rain', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Fire */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-rose-400" />
                    <span className="text-xs font-semibold text-white">Hearth Fire</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-300">
                    {Math.round(mixerState.fire * 100)}%
                  </span>
                </div>
                <input
                  id="mixer-fire-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mixerState.fire}
                  onChange={(e) => handleTrackChange('fire', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Birds & Forest */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trees size={16} className="text-emerald-400" />
                    <span className="text-xs font-semibold text-white">Forest Birds</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    {Math.round(mixerState.birds * 100)}%
                  </span>
                </div>
                <input
                  id="mixer-birds-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mixerState.birds}
                  onChange={(e) => handleTrackChange('birds', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end shrink-0">
          <button
            id="audio-mixer-done-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-sky-500/20"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
