import { BinauralBeatType } from './types';

class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;

  // Track gain nodes
  private gains: {
    whiteNoise: GainNode | null;
    brownNoise: GainNode | null;
    binaural: GainNode | null;
    rain: GainNode | null;
    fire: GainNode | null;
    birds: GainNode | null;
  } = {
    whiteNoise: null,
    brownNoise: null,
    binaural: null,
    rain: null,
    fire: null,
    birds: null,
  };

  // Binaural nodes
  private binauralNodes: {
    oscLeft: OscillatorNode | null;
    oscRight: OscillatorNode | null;
    merger: ChannelMergerNode | null;
    currentType: BinauralBeatType;
  } = {
    oscLeft: null,
    oscRight: null,
    merger: null,
    currentType: 'none',
  };

  // Timers for procedural sound effects (rain droplets, fire crackles, bird chirps)
  private rainTimer: number | null = null;
  private fireTimer: number | null = null;
  private birdsTimer: number | null = null;

  // Noise audio buffer sources
  private whiteNoiseSource: AudioBufferSourceNode | null = null;
  private brownNoiseSource: AudioBufferSourceNode | null = null;
  private rainNoiseSource: AudioBufferSourceNode | null = null;
  private fireNoiseSource: AudioBufferSourceNode | null = null;
  private birdsWindSource: AudioBufferSourceNode | null = null;

  private isInitialized = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Create individual track gain nodes
      (Object.keys(this.gains) as Array<keyof typeof this.gains>).forEach((key) => {
        if (!this.ctx || !this.masterGain) return;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.connect(this.masterGain);
        this.gains[key] = gain;
      });

      this.setupWhiteNoise();
      this.setupBrownNoise();
      this.setupBinauralBeats();
      this.setupRain();
      this.setupFire();
      this.setupBirds();

      this.isInitialized = true;
    } catch (e) {
      console.error('Failed to initialize AudioContext:', e);
    }
  }

  // --- WHITE NOISE GENERATOR ---
  private setupWhiteNoise() {
    if (!this.ctx || !this.gains.whiteNoise) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Highpass + Lowpass for smoother white noise
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2400;
    filter.Q.value = 0.5;

    this.whiteNoiseSource = this.ctx.createBufferSource();
    this.whiteNoiseSource.buffer = buffer;
    this.whiteNoiseSource.loop = true;
    this.whiteNoiseSource.connect(filter);
    filter.connect(this.gains.whiteNoise);
    this.whiteNoiseSource.start(0);
  }

  // --- BROWN NOISE GENERATOR (Warm, deep rumble) ---
  private setupBrownNoise() {
    if (!this.ctx || !this.gains.brownNoise) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // boost gain
    }

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 450;

    this.brownNoiseSource = this.ctx.createBufferSource();
    this.brownNoiseSource.buffer = buffer;
    this.brownNoiseSource.loop = true;
    this.brownNoiseSource.connect(lowpass);
    lowpass.connect(this.gains.brownNoise);
    this.brownNoiseSource.start(0);
  }

  // --- BINAURAL BEATS GENERATOR ---
  private setupBinauralBeats() {
    if (!this.ctx || !this.gains.binaural) return;

    this.binauralNodes.merger = this.ctx.createChannelMerger(2);
    this.binauralNodes.merger.connect(this.gains.binaural);

    this.updateBinauralBeats(this.binauralNodes.currentType);
  }

  public updateBinauralBeats(type: BinauralBeatType) {
    if (!this.ctx || !this.binauralNodes.merger) return;
    this.binauralNodes.currentType = type;

    // Clean up old oscillators
    if (this.binauralNodes.oscLeft) {
      try {
        this.binauralNodes.oscLeft.stop();
        this.binauralNodes.oscLeft.disconnect();
      } catch {}
      this.binauralNodes.oscLeft = null;
    }
    if (this.binauralNodes.oscRight) {
      try {
        this.binauralNodes.oscRight.stop();
        this.binauralNodes.oscRight.disconnect();
      } catch {}
      this.binauralNodes.oscRight = null;
    }

    if (type === 'none') return;

    // Base carrier frequency (Hz) & Beat frequency (Hz)
    let carrier = 180;
    let diff = 10; // Alpha: 10Hz (Relaxed Focus)

    if (type === 'alpha') {
      carrier = 196; // G3
      diff = 10; // 10Hz Alpha: Creative Flow & Concentration
    } else if (type === 'theta') {
      carrier = 164; // E3
      diff = 6; // 6Hz Theta: Deep Meditation & Insight
    } else if (type === 'delta') {
      carrier = 130; // C3
      diff = 3.5; // 3.5Hz Delta: Restorative Rest
    } else if (type === 'beta') {
      carrier = 220; // A3
      diff = 15; // 15Hz Beta: Active Alert Focus
    }

    const oscL = this.ctx.createOscillator();
    const oscR = this.ctx.createOscillator();
    oscL.type = 'sine';
    oscR.type = 'sine';
    oscL.frequency.setValueAtTime(carrier, this.ctx.currentTime);
    oscR.frequency.setValueAtTime(carrier + diff, this.ctx.currentTime);

    // Left channel to input 0, Right channel to input 1
    oscL.connect(this.binauralNodes.merger, 0, 0);
    oscR.connect(this.binauralNodes.merger, 0, 1);

    oscL.start();
    oscR.start();

    this.binauralNodes.oscLeft = oscL;
    this.binauralNodes.oscRight = oscR;
  }

  // --- PROCEDURAL RAIN ---
  private setupRain() {
    if (!this.ctx || !this.gains.rain) return;

    // Continuous soothing rain bed: Pink noise with soft lowpass
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;

    this.rainNoiseSource = this.ctx.createBufferSource();
    this.rainNoiseSource.buffer = buffer;
    this.rainNoiseSource.loop = true;
    this.rainNoiseSource.connect(filter);
    filter.connect(this.gains.rain);
    this.rainNoiseSource.start(0);

    // Dynamic random gentle rain droplet transients
    const scheduleDrop = () => {
      if (this.ctx && this.gains.rain) {
        const gainVal = this.gains.rain.gain.value;
        if (gainVal > 0.01 && this.ctx.state === 'running') {
          this.triggerRainDrop();
        }
      }
      const nextDelay = 80 + Math.random() * 250;
      this.rainTimer = window.setTimeout(scheduleDrop, nextDelay);
    };
    scheduleDrop();
  }

  private triggerRainDrop() {
    if (!this.ctx || !this.gains.rain) return;
    const osc = this.ctx.createOscillator();
    const dropGain = this.ctx.createGain();
    const startFreq = 1800 + Math.random() * 1200;
    const endFreq = 600 + Math.random() * 400;
    const duration = 0.03 + Math.random() * 0.04;
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    dropGain.gain.setValueAtTime(0.04 * Math.random(), now);
    dropGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(dropGain);
    dropGain.connect(this.gains.rain);

    osc.start(now);
    osc.stop(now + duration);
  }

  // --- PROCEDURAL FIRE ---
  private setupFire() {
    if (!this.ctx || !this.gains.fire) return;

    // Fire low rumble bed
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.015 * white) / 1.015;
      last = data[i];
    }

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 280;
    bandpass.Q.value = 1.0;

    this.fireNoiseSource = this.ctx.createBufferSource();
    this.fireNoiseSource.buffer = buffer;
    this.fireNoiseSource.loop = true;
    this.fireNoiseSource.connect(bandpass);
    bandpass.connect(this.gains.fire);
    this.fireNoiseSource.start(0);

    // Random crackles and pops
    const scheduleCrackle = () => {
      if (this.ctx && this.gains.fire) {
        const gainVal = this.gains.fire.gain.value;
        if (gainVal > 0.01 && this.ctx.state === 'running') {
          this.triggerFireCrackle();
        }
      }
      const nextDelay = 120 + Math.random() * 400;
      this.fireTimer = window.setTimeout(scheduleCrackle, nextDelay);
    };
    scheduleCrackle();
  }

  private triggerFireCrackle() {
    if (!this.ctx || !this.gains.fire) return;
    const now = this.ctx.currentTime;
    const duration = 0.008 + Math.random() * 0.025;

    // High frequency sharp impulse pop
    const osc = this.ctx.createOscillator();
    const crackleGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600 + Math.random() * 2800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + duration);

    crackleGain.gain.setValueAtTime(0.08 + Math.random() * 0.08, now);
    crackleGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(crackleGain);
    crackleGain.connect(this.gains.fire);

    osc.start(now);
    osc.stop(now + duration);
  }

  // --- PROCEDURAL BIRDS & FOREST AMBIENCE ---
  private setupBirds() {
    if (!this.ctx || !this.gains.birds) return;

    // Soft canopy breeze background
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 0.08;
    }
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 0.6;

    this.birdsWindSource = this.ctx.createBufferSource();
    this.birdsWindSource.buffer = buffer;
    this.birdsWindSource.loop = true;
    this.birdsWindSource.connect(filter);
    filter.connect(this.gains.birds);
    this.birdsWindSource.start(0);

    // Natural bird chirp sequence
    const scheduleBirdSong = () => {
      if (this.ctx && this.gains.birds) {
        const gainVal = this.gains.birds.gain.value;
        if (gainVal > 0.01 && this.ctx.state === 'running') {
          this.triggerBirdChirp();
        }
      }
      const nextDelay = 2200 + Math.random() * 4500;
      this.birdsTimer = window.setTimeout(scheduleBirdSong, nextDelay);
    };
    scheduleBirdSong();
  }

  private triggerBirdChirp() {
    if (!this.ctx || !this.gains.birds) return;
    const numTrills = 2 + Math.floor(Math.random() * 3);
    const baseFreq = 2200 + Math.random() * 1400;
    const now = this.ctx.currentTime;

    for (let i = 0; i < numTrills; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const trillStart = now + i * 0.12;
      const trillDur = 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq + (i % 2 === 0 ? 300 : -200), trillStart);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 800, trillStart + trillDur * 0.5);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, trillStart + trillDur);

      gain.gain.setValueAtTime(0.001, trillStart);
      gain.gain.linearRampToValueAtTime(0.04, trillStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, trillStart + trillDur);

      osc.connect(gain);
      gain.connect(this.gains.birds);

      osc.start(trillStart);
      osc.stop(trillStart + trillDur);
    }
  }

  // --- HARMONIC TIBETAN BOWL / BELL CHIME (Pomodoro alert) ---
  public playTibetanChime() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const fundamental = 528; // 528Hz Solfeggio "Transformation & Miracles" frequency
    const harmonics = [
      { mult: 1.0, amp: 0.45, decay: 4.5 },
      { mult: 2.02, amp: 0.25, decay: 3.8 },
      { mult: 3.01, amp: 0.18, decay: 2.8 },
      { mult: 4.18, amp: 0.10, decay: 2.0 },
      { mult: 5.43, amp: 0.05, decay: 1.4 },
    ];

    const now = this.ctx.currentTime;

    harmonics.forEach(({ mult, amp, decay }) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * mult, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(amp * 0.5, now + 0.03); // crisp attack
      gain.gain.exponentialRampToValueAtTime(0.00001, now + decay);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + decay);
    });
  }

  // --- CONTROL API ---
  public setTrackVolume(track: keyof typeof this.gains, volume: number) {
    this.init();
    const gainNode = this.gains[track];
    if (!gainNode || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, volume));
    gainNode.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.08);
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (!this.masterGain || !this.ctx) return;
    if (!this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.08);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (!this.masterGain || !this.ctx) return this.isMuted;
    const target = this.isMuted ? 0 : this.masterVolume;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }
}

export const audioEngine = new ProceduralAudioEngine();
