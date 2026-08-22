import React from 'react';
import { Eye, Palette, Gauge, Wind, Sparkles, Activity, X } from 'lucide-react';
import { VisualizerMode, ColorPalette } from '../types';
import { COLOR_PALETTES } from '../presets';

interface VisualizerControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visualMode: VisualizerMode;
  onChangeVisualMode: (mode: VisualizerMode) => void;
  selectedPalette: ColorPalette;
  onSelectPalette: (palette: ColorPalette) => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
}

export const VisualizerControlsModal: React.FC<VisualizerControlsModalProps> = ({
  isOpen,
  onClose,
  visualMode,
  onChangeVisualMode,
  selectedPalette,
  onSelectPalette,
  speed,
  onChangeSpeed,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="visualizer-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="visualizer-modal-card"
        className="w-full max-w-lg bg-slate-950/95 border border-white/15 rounded-3xl backdrop-blur-2xl shadow-2xl p-6 text-slate-100 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Eye size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Procedural Visualizer Studio</h2>
              <p className="text-xs text-slate-400">Configure canvas generation, speed, and ambient colors</p>
            </div>
          </div>
          <button
            id="close-visualizer-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Visualizer Engine Style */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Activity size={14} className="text-sky-400" />
            <span>Procedural Mode</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                id: 'particles',
                name: 'Constellation',
                desc: 'Floating glowing nodes with interactive constellation physics',
                icon: Sparkles,
              },
              {
                id: 'gradient',
                name: 'Gradient Flow',
                desc: 'Harmonic liquid metablobs and fluid light blending',
                icon: Wind,
              },
              {
                id: 'aurora',
                name: 'Breathing Aurora',
                desc: 'Undulating sinusoidal ribbons and guided breath pacer',
                icon: Eye,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = visualMode === item.id;
              return (
                <button
                  key={item.id}
                  id={`visual-mode-btn-${item.id}`}
                  onClick={() => onChangeVisualMode(item.id as VisualizerMode)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-400/60 ring-2 ring-sky-400/30 shadow-lg text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <Icon size={18} className={isSelected ? 'text-sky-400 mb-1.5' : 'text-slate-400 mb-1.5'} />
                  <div className="text-xs font-bold">{item.name}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">{item.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Color Palette Presets */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Palette size={14} className="text-purple-400" />
            <span>Color Palette Presets</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COLOR_PALETTES.map((palette) => {
              const isSelected = selectedPalette.id === palette.id;
              return (
                <button
                  key={palette.id}
                  id={`palette-btn-${palette.id}`}
                  onClick={() => onSelectPalette(palette)}
                  className={`p-2.5 rounded-2xl border transition-all text-left ${
                    isSelected
                      ? 'bg-purple-500/20 border-purple-400/60 ring-2 ring-purple-400/30 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold">{palette.name}</span>
                  </div>
                  {/* Swatches */}
                  <div className="flex gap-1 h-3 rounded-lg overflow-hidden border border-white/10">
                    {palette.colors.map((c, idx) => (
                      <div key={idx} className="flex-1 h-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Animation Speed Slider */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <Gauge size={14} className="text-amber-400" />
              <strong className="font-semibold">Visualizer Pace:</strong>
            </span>
            <span className="font-mono font-bold text-amber-300">{speed.toFixed(2)}x</span>
          </div>
          <input
            id="visualizer-speed-slider"
            type="range"
            min="0.25"
            max="3.0"
            step="0.05"
            value={speed}
            onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Slow Drift (0.25x)</span>
            <span>Natural (1.0x)</span>
            <span>Energetic (3.0x)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            id="close-visualizer-settings-bottom-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-purple-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
