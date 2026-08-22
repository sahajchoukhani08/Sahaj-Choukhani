export type VisualizerMode = 'particles' | 'gradient' | 'aurora';

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  bgGradient: string;
}

export type BinauralBeatType = 'none' | 'alpha' | 'theta' | 'delta' | 'beta';

export interface SoundTrackConfig {
  id: string;
  name: string;
  type: 'noise' | 'binaural' | 'ambient';
  volume: number; // 0 to 1
  enabled: boolean;
  iconName: string;
  description: string;
}

export interface SoundPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  paletteId: string;
  visualMode: VisualizerMode;
  tracks: {
    whiteNoise: number;
    brownNoise: number;
    binaural: { type: BinauralBeatType; volume: number };
    rain: number;
    fire: number;
    birds: number;
  };
}

export interface MoodEntry {
  id: string;
  timestamp: number;
  mood: 'energized' | 'focused' | 'calm' | 'tired' | 'distracted';
  energy: number; // 1 - 10
  note: string;
  intention: string;
}

export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  autoStartBreaks: boolean;
  soundEnabled: boolean;
}
