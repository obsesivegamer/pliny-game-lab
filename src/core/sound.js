// Pliny Game Lab — Classical Web Audio Synthesis Engine
// Pure procedural Web Audio API synthesis: zero audio files, samples, or MP3s.
// Authentic ancient Roman & Hellenistic acoustics, Pythagorean & Just tuning,
// and 10 generative procedural Pavilion soundscapes.

/**
 * Classical Tuning Ratios & Ancient Greek Modes
 */
export const PYTHAGOREAN_RATIOS = [
  1,          // 1/1 Unison
  256 / 243,  // Limma (minor 2nd)
  9 / 8,      // Epogdoon (major 2nd)
  32 / 27,    // Minor 3rd
  81 / 64,    // Ditone (major 3rd)
  4 / 3,      // Diatessaron (perfect 4th)
  729 / 512,  // Tritone
  3 / 2,      // Diapente (perfect 5th)
  128 / 81,   // Minor 6th
  27 / 16,    // Major 6th
  16 / 9,     // Minor 7th
  243 / 128,  // Major 7th
  2           // Diapason (octave)
];

export const JUST_RATIOS = [
  1,        // 1/1 Unison
  16 / 15,  // Minor 2nd
  9 / 8,    // Major 2nd
  6 / 5,    // Minor 3rd
  5 / 4,    // Major 3rd
  4 / 3,    // Perfect 4th
  45 / 32,  // Tritone
  3 / 2,    // Perfect 5th
  8 / 5,    // Minor 6th
  5 / 3,    // Major 6th
  9 / 5,    // Minor 7th
  15 / 8,   // Major 7th
  2         // Octave
];

// Ancient Greek Harmoniai (Modal Scale Step Indexes in Diatonic Octave)
export const MODES = {
  // Dorian (D - E - F - G - A - B - C - D): Classical Spartan/Roman warrior mode
  dorian: [0, 2, 3, 5, 7, 9, 10, 12],
  // Phrygian (E - F - G - A - B - C - D - E): Passionate Dionysian mode
  phrygian: [0, 1, 3, 5, 7, 8, 10, 12],
  // Lydian (F - G - A - B - C - D - E - F): Bright Apollonian celestial mode
  lydian: [0, 2, 4, 6, 7, 9, 11, 12]
};

const NOTE_OFFSETS = {
  C: 0, 'C#': 1, Db: 1,
  D: 2, 'D#': 3, Eb: 3,
  E: 4,
  F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10,
  B: 11
};

export const PAVILION_SOUNDSCAPE_NAMES = {
  ignis: "Ignis Caldera (40Hz Sub-Rumble & Embers)",
  bestiarium: "Bestiarium (Pastoral Drone & Cicadas)",
  mechanica: "Mechanica (Vitruvian Escapement)",
  cosmographia: "Cosmographia (Musica Universalis)",
  fabula: "Fabula (Circus Arena Murmur)",
  mathematica: "Mathematica (Monochord Harmonics)",
  mare: "Mare Nostrum (Ocean Swell & Bell)",
  architectura: "Architectura (Basilica Chamber Echo)",
  alchemia: "Alchemia (Alembic Distillation)",
  strategia: "Strategia (War Drum Heartbeat)"
};

/**
 * Generate soft-clipping saturation curve for Roman bronze instruments
 */
function makeBronzeSaturationCurve(amount = 25, samples = 256) {
  const curve = new Float32Array(samples);
  const k = Math.max(1, amount);
  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

/**
 * Master Web Audio Controller for Pliny Game Lab
 */
export class PlinySoundMaster {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambienceGain = null;

    this.isMuted = false;
    this.volume = 0.65;
    this.isHeadless = (typeof window === 'undefined');

    this.currentPavilionId = null;
    this.activeAmbience = null;

    this.noiseCache = new Map();
    this.bronzeCurve = makeBronzeSaturationCurve(28);

    // Auto-initialize if running in browser with AudioContext available
    this.init();
  }

  /**
   * Safe AudioContext initialization with headless fallback guards
   */
  init() {
    if (this.ctx || this.isHeadless) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        this.isHeadless = true;
        return;
      }

      this.ctx = new AudioContextClass();

      // Master output bus
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0.0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Ambience bus
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.ambienceGain.connect(this.masterGain);
    } catch (e) {
      this.isHeadless = true;
    }
  }

  /**
   * Unlocks AudioContext on user interaction (resolves suspended state)
   */
  async resume() {
    if (this.isHeadless) return Promise.resolve();
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        // Safe headless / browser policy fallback
      }
    }
    return Promise.resolve();
  }

  ensureAudioRunning() {
    if (this.isHeadless) return false;
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return !!this.ctx;
  }

  /**
   * Toggles audio mute state
   * @returns {boolean} New muted state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      const target = this.isMuted ? 0.0001 : this.volume;
      try {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(target, now + 0.04);
      } catch (e) {
        this.masterGain.gain.value = this.isMuted ? 0.0 : this.volume;
      }
    }
    return this.isMuted;
  }

  /**
   * Sets overall audio volume (0.0 to 1.0)
   */
  setVolume(vol) {
    this.volume = Math.max(0.0, Math.min(1.0, Number(vol) || 0.0));
    if (this.ctx && this.masterGain && !this.isMuted) {
      const now = this.ctx.currentTime;
      try {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.04);
      } catch (e) {
        this.masterGain.gain.value = this.volume;
      }
    }
    return this.volume;
  }

  /**
   * Returns descriptive title of currently active ambient soundscape
   */
  getCurrentAmbienceTitle() {
    if (!this.currentPavilionId || this.isMuted) return "Muted / Silent";
    return PAVILION_SOUNDSCAPE_NAMES[this.currentPavilionId] || "Ambient Resonance";
  }

  /**
   * Note name or number parser to frequency in Hertz
   * Supports e.g. 'A4', 'D3', 'F#4', 'Eb5', or numeric Hz
   */
  parseNote(note, defaultFreq = 440, tuning = 'pythagorean') {
    if (typeof note === 'number' && Number.isFinite(note) && note > 0) {
      return note;
    }
    if (typeof note !== 'string') return defaultFreq;

    const match = note.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)?$/);
    if (!match) return defaultFreq;

    const letter = match[1].toUpperCase();
    const accidental = match[2] || '';
    const octave = match[3] !== undefined ? parseInt(match[3], 10) : 4;

    const key = letter + accidental;
    const semitone = NOTE_OFFSETS[key];
    if (semitone === undefined) return defaultFreq;

    // Standard equal temperament base
    const midi = (octave + 1) * 12 + semitone;
    const standardFreq = 440 * Math.pow(2, (midi - 69) / 12);

    if (tuning === 'equal') return standardFreq;

    // Pythagorean intonation relative to D (293.66 Hz fundamental)
    // or Just Intonation adjustment
    const dOctaveMidi = (octave + 1) * 12 + 2; // D in this octave
    const semitoneDiff = (semitone - 2 + 12) % 12;
    const ratioTable = (tuning === 'just') ? JUST_RATIOS : PYTHAGOREAN_RATIOS;
    const ratio = ratioTable[semitoneDiff] || 1;

    // Base D frequency for this octave
    const dBase = 293.6647679659998 * Math.pow(2, octave - 4);
    return dBase * ratio;
  }

  /**
   * Procedural Audio Buffers (White, Pink, Brown noise)
   */
  getNoiseBuffer(type = 'pink', duration = 3.0) {
    if (!this.ctx) return null;
    const cacheKey = `${type}_${duration}`;
    if (this.noiseCache.has(cacheKey)) {
      return this.noiseCache.get(cacheKey);
    }

    const sampleRate = this.ctx.sampleRate || 44100;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      // Paul Kellet's filtered white noise algorithm (1/f)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
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
    } else if (type === 'brown') {
      // Integrated Brownian noise (1/f^2) for deep rumbles
      let lastOut = 0.0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        data[i] = lastOut * 3.5;
      }
    }

    this.noiseCache.set(cacheKey, buffer);
    return buffer;
  }

  // =========================================================================
  // AUTHENTIC ANCIENT INSTRUMENTS
  // =========================================================================

  /**
   * 1. Ancient Lyre / Kithara (Karplus-Strong String Pluck Synthesis)
   * Plucked gut string physical modeling with wooden soundboard resonance.
   */
  playLyre(noteName = 'D4', duration = 1.8) {
    if (!this.ensureAudioRunning() || this.isMuted) return null;
    try {
      const freq = this.parseNote(noteName, 293.66);
      const dur = Math.max(0.2, Number(duration) || 1.8);
      const sampleRate = this.ctx.sampleRate || 44100;
      const totalSamples = Math.floor(sampleRate * dur);
      const period = Math.max(2, Math.round(sampleRate / freq));

      const buffer = this.ctx.createBuffer(1, totalSamples, sampleRate);
      const data = buffer.getChannelData(0);

      // String initial pluck burst (half-sine windowed excitation)
      for (let i = 0; i < period; i++) {
        const noise = (Math.random() * 2 - 1);
        const window = Math.sin((Math.PI * i) / period);
        data[i] = noise * window;
      }

      // Karplus-Strong lowpass feedback loop with frequency-dependent decay
      const decay = Math.min(0.995, 0.982 + 0.012 * (1 - Math.min(freq, 1200) / 1200));
      for (let i = period; i < totalSamples; i++) {
        data[i] = 0.5 * (data[i - period] + data[i - period - 1]) * decay;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      // Wooden soundbox resonance (peaking at 450Hz)
      const bodyFilter = this.ctx.createBiquadFilter();
      bodyFilter.type = 'peaking';
      bodyFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      bodyFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);
      bodyFilter.gain.setValueAtTime(4.0, this.ctx.currentTime);

      const highpass = this.ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(80, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      source.connect(bodyFilter);
      bodyFilter.connect(highpass);
      highpass.connect(gain);
      gain.connect(this.sfxGain);

      source.start(now);
      source.stop(now + dur);
      return source;
    } catch (e) {
      return null;
    }
  }

  /**
   * 2. Ancient Aulos (Dual-pipe double-reed with breath vibrato & formant filter)
   */
  playAulos(freq = 440, duration = 1.5) {
    if (!this.ensureAudioRunning() || this.isMuted) return null;
    try {
      const f = this.parseNote(freq, 440);
      const dur = Math.max(0.2, Number(duration) || 1.5);
      const now = this.ctx.currentTime;

      // Dual pipes (slight detuning for beating reeds)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(f, now);
      osc2.frequency.setValueAtTime(f * 1.006, now); // +10 cents detuning

      // Breath vibrato LFO (~5.5Hz)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5.5, now);
      lfoGain.gain.setValueAtTime(0, now);
      // Vibrato swells naturally after initial attack
      lfoGain.gain.linearRampToValueAtTime(5.5, now + 0.35);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      // Cane reed formant filter (bandpass at 1150Hz)
      const formant = this.ctx.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(1150, now);
      formant.Q.setValueAtTime(3.2, now);

      // Breath hiss noise layer
      const noiseBuffer = this.getNoiseBuffer('pink', 1.5);
      let noiseSource = null;
      let noiseGain = null;
      if (noiseBuffer) {
        noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1400, now);
        noiseFilter.Q.setValueAtTime(2.0, now);

        noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.001, now);
        noiseGain.gain.linearRampToValueAtTime(0.04, now + 0.08);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noiseSource.start(now);
        noiseSource.stop(now + dur);
      }

      // Main reed envelope
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(0.65, now + 0.07); // breath buildup
      env.gain.setValueAtTime(0.6, now + dur * 0.7);
      env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc1.connect(formant);
      osc2.connect(formant);
      formant.connect(env);
      env.connect(this.sfxGain);

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);

      lfo.stop(now + dur);
      osc1.stop(now + dur);
      osc2.stop(now + dur);

      return osc1;
    } catch (e) {
      return null;
    }
  }

  /**
   * 3. Alexandrian Hydraulis (Water Organ with bubbling warmth & flue chiff)
   */
  playHydraulis(freq = 330, duration = 2.0) {
    if (!this.ensureAudioRunning() || this.isMuted) return null;
    try {
      const f = this.parseNote(freq, 330);
      const dur = Math.max(0.3, Number(duration) || 2.0);
      const now = this.ctx.currentTime;

      // Pipe harmonic partials (fundamental + octave + twelfth)
      const p1 = this.ctx.createOscillator();
      const p2 = this.ctx.createOscillator();
      const p3 = this.ctx.createOscillator();
      p1.type = 'sine';
      p2.type = 'sine';
      p3.type = 'triangle';
      p1.frequency.setValueAtTime(f, now);
      p2.frequency.setValueAtTime(f * 2, now);
      p3.frequency.setValueAtTime(f * 3, now);

      const pGain1 = this.ctx.createGain();
      const pGain2 = this.ctx.createGain();
      const pGain3 = this.ctx.createGain();
      pGain1.gain.setValueAtTime(0.65, now);
      pGain2.gain.setValueAtTime(0.28, now);
      pGain3.gain.setValueAtTime(0.12, now);

      // Water bubbling pressure modulation LFO (7.8Hz subtle air jitter)
      const waterLfo = this.ctx.createOscillator();
      const waterLfoGain = this.ctx.createGain();
      waterLfo.frequency.setValueAtTime(7.8, now);
      waterLfoGain.gain.setValueAtTime(1.8, now);
      waterLfo.connect(waterLfoGain);
      waterLfoGain.connect(p1.frequency);
      waterLfoGain.connect(p2.frequency);

      // Resonant water cistern filter
      const chamber = this.ctx.createBiquadFilter();
      chamber.type = 'peaking';
      chamber.frequency.setValueAtTime(820, now);
      chamber.Q.setValueAtTime(2.4, now);
      chamber.gain.setValueAtTime(4.0, now);

      // Organ flue chiff transient (lip strike burst)
      const chiffBuffer = this.getNoiseBuffer('pink', 0.1);
      if (chiffBuffer) {
        const chiff = this.ctx.createBufferSource();
        chiff.buffer = chiffBuffer;
        const chiffFilter = this.ctx.createBiquadFilter();
        chiffFilter.type = 'bandpass';
        chiffFilter.frequency.setValueAtTime(2200, now);
        const chiffGain = this.ctx.createGain();
        chiffGain.gain.setValueAtTime(0.18, now);
        chiffGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        chiff.connect(chiffFilter);
        chiffFilter.connect(chiffGain);
        chiffGain.connect(chamber);
        chiff.start(now);
        chiff.stop(now + 0.05);
      }

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(0.55, now + 0.04); // soft flue rise
      env.gain.setValueAtTime(0.5, now + dur * 0.65);
      env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      p1.connect(pGain1);
      p2.connect(pGain2);
      p3.connect(pGain3);
      pGain1.connect(chamber);
      pGain2.connect(chamber);
      pGain3.connect(chamber);

      chamber.connect(env);
      env.connect(this.sfxGain);

      waterLfo.start(now);
      p1.start(now);
      p2.start(now);
      p3.start(now);

      waterLfo.stop(now + dur);
      p1.stop(now + dur);
      p2.stop(now + dur);
      p3.stop(now + dur);

      return p1;
    } catch (e) {
      return null;
    }
  }

  /**
   * 4. Roman Salpinx (Bronze brass fanfare horn with waveshaper saturation)
   */
  playSalpinx(freq = 293.66, duration = 1.2) {
    if (!this.ensureAudioRunning() || this.isMuted) return null;
    try {
      const f = this.parseNote(freq, 293.66);
      const dur = Math.max(0.2, Number(duration) || 1.2);
      const now = this.ctx.currentTime;

      // Dual sawtooth brass oscillators
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(f, now);
      osc2.frequency.setValueAtTime(f * 2, now); // strong second brass harmonic

      // Bronze waveshaper saturation
      const shaper = this.ctx.createWaveShaper ? this.ctx.createWaveShaper() : this.ctx.createGain();
      if (shaper.curve !== undefined) shaper.curve = this.bronzeCurve;

      // Brass flare cutoff sweep (tongue blip into steady bronze flare)
      const flare = this.ctx.createBiquadFilter();
      flare.type = 'lowpass';
      flare.frequency.setValueAtTime(4200, now);
      flare.frequency.exponentialRampToValueAtTime(1700, now + 0.12);
      flare.Q.setValueAtTime(3.5, now);

      // Roman bell formant peak
      const bell = this.ctx.createBiquadFilter();
      bell.type = 'peaking';
      bell.frequency.setValueAtTime(2150, now);
      bell.Q.setValueAtTime(3.0, now);
      bell.gain.setValueAtTime(6.0, now);

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(0.7, now + 0.02); // crisp trumpet tongue
      env.gain.setValueAtTime(0.65, now + dur * 0.7);
      env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      const mix = this.ctx.createGain();
      osc1.connect(mix);
      const osc2Gain = this.ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.35, now);
      osc2.connect(osc2Gain);
      osc2Gain.connect(mix);

      mix.connect(shaper);
      shaper.connect(flare);
      flare.connect(bell);
      bell.connect(env);
      env.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur);
      osc2.stop(now + dur);

      return osc1;
    } catch (e) {
      return null;
    }
  }

  /**
   * 5. Roman Tympanum (Low-end frame drum thud with membrane sweep)
   */
  playTympanum() {
    if (!this.ensureAudioRunning() || this.isMuted) return null;
    try {
      const now = this.ctx.currentTime;
      const dur = 0.65;

      // Primary membrane pitch drop (160Hz -> 48Hz)
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.08);

      // Sub-chest punch
      const sub = this.ctx.createOscillator();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(52, now);
      sub.frequency.exponentialRampToValueAtTime(38, now + 0.15);

      // Leather skin slap transient
      const slapBuffer = this.getNoiseBuffer('pink', 0.1);
      if (slapBuffer) {
        const slap = this.ctx.createBufferSource();
        slap.buffer = slapBuffer;
        const slapFilter = this.ctx.createBiquadFilter();
        slapFilter.type = 'bandpass';
        slapFilter.frequency.setValueAtTime(750, now);
        slapFilter.Q.setValueAtTime(2.0, now);

        const slapGain = this.ctx.createGain();
        slapGain.gain.setValueAtTime(0.4, now);
        slapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

        slap.connect(slapFilter);
        slapFilter.connect(slapGain);
        slapGain.connect(this.sfxGain);
        slap.start(now);
        slap.stop(now + 0.03);
      }

      // Drum body resonance
      const bodyFilter = this.ctx.createBiquadFilter();
      bodyFilter.type = 'peaking';
      bodyFilter.frequency.setValueAtTime(85, now);
      bodyFilter.Q.setValueAtTime(3.5, now);
      bodyFilter.gain.setValueAtTime(4.0, now);

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.9, now);
      env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(bodyFilter);
      sub.connect(bodyFilter);
      bodyFilter.connect(env);
      env.connect(this.sfxGain);

      osc.start(now);
      sub.start(now);
      osc.stop(now + dur);
      sub.stop(now + dur);

      return osc;
    } catch (e) {
      return null;
    }
  }

  /**
   * 6. Ancient Crotala (Metallic bronze clapper & cymbal bell ping)
   */
  playCrotala() {
    if (!this.ensureAudioRunning() || this.isMuted) return null;
    try {
      const now = this.ctx.currentTime;
      const dur = 1.1;

      // Inharmonic metallic partials: bronze plate modes
      const partials = [1480, 2240, 2980, 4260, 5840];
      const masterEnv = this.ctx.createGain();
      masterEnv.gain.setValueAtTime(0.55, now);
      masterEnv.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      // Acoustic beating LFO (13Hz bronze flutter)
      const beatLfo = this.ctx.createOscillator();
      const beatGain = this.ctx.createGain();
      beatLfo.frequency.setValueAtTime(13, now);
      beatGain.gain.setValueAtTime(0.2, now);
      beatLfo.connect(beatGain);

      partials.forEach((pFreq, idx) => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pFreq, now);

        const pGain = this.ctx.createGain();
        const weight = 1.0 / (idx + 1);
        pGain.gain.setValueAtTime(weight * 0.4, now);
        pGain.gain.exponentialRampToValueAtTime(0.0001, now + dur / (idx * 0.4 + 1));

        beatGain.connect(pGain.gain);
        osc.connect(pGain);
        pGain.connect(masterEnv);

        osc.start(now);
        osc.stop(now + dur);
      });

      // Strike transient burst (>3.5kHz)
      const clickBuffer = this.getNoiseBuffer('white', 0.05);
      if (clickBuffer) {
        const click = this.ctx.createBufferSource();
        click.buffer = clickBuffer;
        const clickFilter = this.ctx.createBiquadFilter();
        clickFilter.type = 'highpass';
        clickFilter.frequency.setValueAtTime(3600, now);

        const clickGain = this.ctx.createGain();
        clickGain.gain.setValueAtTime(0.35, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

        click.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(masterEnv);
        click.start(now);
        click.stop(now + 0.02);
      }

      beatLfo.start(now);
      beatLfo.stop(now + dur);

      masterEnv.connect(this.sfxGain);
      return masterEnv;
    } catch (e) {
      return null;
    }
  }

  /**
   * 7. Hellenistic Temple Chime (UI navigation & card hover chime)
   */
  playChime(note = 'A5', volume = 0.3) {
    if (!this.ensureAudioRunning() || this.isMuted) return null;
    try {
      const f = this.parseNote(note, 880);
      const vol = Math.max(0.01, Math.min(1.0, Number(volume) || 0.3));
      const now = this.ctx.currentTime;
      const dur = 0.75;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(f, now);
      osc2.frequency.setValueAtTime(f * 2.756, now); // pure bell overtone

      const env1 = this.ctx.createGain();
      const env2 = this.ctx.createGain();

      env1.gain.setValueAtTime(0.001, now);
      env1.gain.linearRampToValueAtTime(vol * 0.7, now + 0.003);
      env1.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      env2.gain.setValueAtTime(0.001, now);
      env2.gain.linearRampToValueAtTime(vol * 0.25, now + 0.003);
      env2.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.5);

      osc1.connect(env1);
      osc2.connect(env2);
      env1.connect(this.sfxGain);
      env2.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur);
      osc2.stop(now + dur);

      return osc1;
    } catch (e) {
      return null;
    }
  }

  /**
   * 8. Triumphant Launch Fanfare (Entering a simulation)
   * Roman Dorian triumphant chord: D3 - A3 - D4 - F#4 - A4 - D5
   */
  playLaunchFanfare() {
    if (!this.ensureAudioRunning() || this.isMuted) return null;
    try {
      this.playTympanum();

      // Pythagorean D Major arpeggio / blooming chord
      const chord = [
        { note: 'D3', delay: 0.00, dur: 1.8, instr: 'salpinx' },
        { note: 'A3', delay: 0.05, dur: 1.7, instr: 'salpinx' },
        { note: 'D4', delay: 0.10, dur: 2.0, instr: 'hydraulis' },
        { note: 'F#4', delay: 0.15, dur: 2.0, instr: 'hydraulis' },
        { note: 'A4', delay: 0.20, dur: 2.2, instr: 'salpinx' },
        { note: 'D5', delay: 0.25, dur: 2.4, instr: 'chime' }
      ];

      chord.forEach(({ note, delay, dur, instr }) => {
        setTimeout(() => {
          if (this.isMuted) return;
          if (instr === 'salpinx') {
            this.playSalpinx(note, dur);
          } else if (instr === 'hydraulis') {
            this.playHydraulis(note, dur);
          } else {
            this.playChime(note, 0.45);
            this.playCrotala();
          }
        }, delay * 1000);
      });

      return true;
    } catch (e) {
      return null;
    }
  }

  // =========================================================================
  // PAVILION AMBIENT SOUNDSCAPES (10 THEMATIC PROCEDURAL BACKGROUND LOOPS)
  // =========================================================================

  /**
   * Starts procedural ambient generative soundscape for a specific Pavilion.
   * Smoothly cross-fades with previous running ambience.
   * @param {string} pavilionId ('ignis', 'bestiarium', 'mechanica', etc.)
   */
  startPavilionAmbience(pavilionId) {
    if (!this.ensureAudioRunning()) return false;
    if (this.currentPavilionId === pavilionId && this.activeAmbience) return true;

    // Cross-fade out existing ambience if active
    if (this.activeAmbience) {
      const oldAmbience = this.activeAmbience;
      this.activeAmbience = null;
      const now = this.ctx.currentTime;
      try {
        oldAmbience.gainNode.gain.setValueAtTime(oldAmbience.gainNode.gain.value, now);
        oldAmbience.gainNode.gain.linearRampToValueAtTime(0.0001, now + 1.2);
      } catch (e) {}
      setTimeout(() => {
        try { oldAmbience.stop(); } catch (e) {}
      }, 1300);
    }

    this.currentPavilionId = pavilionId;
    const builder = this.getPavilionAmbienceBuilder(pavilionId);
    if (!builder) return false;

    const now = this.ctx.currentTime;
    const ambGain = this.ctx.createGain();
    ambGain.gain.setValueAtTime(0.0001, now);
    ambGain.gain.linearRampToValueAtTime(0.38, now + 1.2);
    ambGain.connect(this.ambienceGain);

    const cleanupFns = [];
    const addNode = (node) => {
      cleanupFns.push(() => {
        try { node.stop(); } catch (e) {}
        try { node.disconnect(); } catch (e) {}
      });
      return node;
    };
    const addInterval = (id) => cleanupFns.push(() => clearInterval(id));
    const addTimeout = (id) => cleanupFns.push(() => clearTimeout(id));

    builder({ ambGain, addNode, addInterval, addTimeout, ctx: this.ctx });

    this.activeAmbience = {
      pavilionId,
      gainNode: ambGain,
      stop: () => {
        cleanupFns.forEach(fn => {
          try { fn(); } catch (e) {}
        });
        try { ambGain.disconnect(); } catch (e) {}
      }
    };

    return true;
  }

  /**
   * Smoothly stops active ambient soundscape
   * @param {number} fadeDuration Fade-out duration in seconds
   */
  stopPavilionAmbience(fadeDuration = 1.0) {
    if (!this.ctx || !this.activeAmbience) {
      this.currentPavilionId = null;
      return false;
    }
    const oldAmbience = this.activeAmbience;
    this.activeAmbience = null;
    this.currentPavilionId = null;
    const now = this.ctx.currentTime;
    try {
      oldAmbience.gainNode.gain.setValueAtTime(oldAmbience.gainNode.gain.value, now);
      oldAmbience.gainNode.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);
    } catch (e) {}
    setTimeout(() => {
      try { oldAmbience.stop(); } catch (e) {}
    }, (fadeDuration + 0.1) * 1000);
    return true;
  }

  /**
   * Pavilion Ambience Builders Registry
   */
  getPavilionAmbienceBuilder(id) {
    const builders = {
      // 1. Ignis & Terra: Subterranean low-frequency rumble (40Hz) + fire embers
      ignis: ({ ambGain, addNode, addInterval, ctx }) => {
        const brownBuffer = this.getNoiseBuffer('brown', 4.0);
        if (brownBuffer) {
          const noise = ctx.createBufferSource();
          noise.buffer = brownBuffer;
          noise.loop = true;

          // 24dB/oct cascaded lowpass filter at 40Hz
          const lp1 = ctx.createBiquadFilter();
          const lp2 = ctx.createBiquadFilter();
          lp1.type = 'lowpass';
          lp2.type = 'lowpass';
          lp1.frequency.setValueAtTime(42, ctx.currentTime);
          lp2.frequency.setValueAtTime(42, ctx.currentTime);

          // Undulating magma tremor LFO (0.07Hz)
          const tremorLfo = ctx.createOscillator();
          const tremorGain = ctx.createGain();
          tremorLfo.frequency.setValueAtTime(0.07, ctx.currentTime);
          tremorGain.gain.setValueAtTime(0.08, ctx.currentTime);

          const rGain = ctx.createGain();
          rGain.gain.setValueAtTime(0.4, ctx.currentTime);

          tremorLfo.connect(tremorGain);
          tremorGain.connect(rGain.gain);

          noise.connect(lp1);
          lp1.connect(lp2);
          lp2.connect(rGain);
          rGain.connect(ambGain);

          noise.start();
          tremorLfo.start();
          addNode(noise);
          addNode(tremorLfo);
        }

        // Crackling fire embers generator
        const emberInterval = setInterval(() => {
          if (!this.ctx || this.isMuted) return;
          const now = ctx.currentTime;
          const dur = 0.006 + Math.random() * 0.012;
          const snapBuffer = this.getNoiseBuffer('white', 0.05);
          if (!snapBuffer) return;

          const snap = ctx.createBufferSource();
          snap.buffer = snapBuffer;

          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(2500 + Math.random() * 3000, now);
          bp.Q.setValueAtTime(5.0, now);

          const g = ctx.createGain();
          g.gain.setValueAtTime(0.08 + Math.random() * 0.15, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

          snap.connect(bp);
          bp.connect(g);
          g.connect(ambGain);

          snap.start(now);
          snap.stop(now + dur);
        }, 140);
        addInterval(emberInterval);
      },

      // 2. Bestiarium & Silva: Warm pastoral drone + periodic cicada chirps
      bestiarium: ({ ambGain, addNode, addInterval, ctx }) => {
        const chord = [130.81, 196.00, 329.63]; // C3 - G3 - E4 pastoral fifths
        chord.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = i === 2 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(450, ctx.currentTime);

          const g = ctx.createGain();
          g.gain.setValueAtTime(0.12 / (i + 1), ctx.currentTime);

          // Slow breathing drone tremolo
          const lfo = ctx.createOscillator();
          const lfoG = ctx.createGain();
          lfo.frequency.setValueAtTime(0.1 + i * 0.03, ctx.currentTime);
          lfoG.gain.setValueAtTime(0.03, ctx.currentTime);
          lfo.connect(lfoG);
          lfoG.connect(g.gain);

          osc.connect(lp);
          lp.connect(g);
          g.connect(ambGain);

          osc.start();
          lfo.start();
          addNode(osc);
          addNode(lfo);
        });

        // Periodic cicada chirps (modulated bandpass noise)
        const triggerCicada = () => {
          if (!this.ctx || this.isMuted) return;
          const now = ctx.currentTime;
          const burstDur = 1.4 + Math.random() * 0.8;
          const nBuffer = this.getNoiseBuffer('pink', 2.5);
          if (!nBuffer) return;

          const nSrc = ctx.createBufferSource();
          nSrc.buffer = nBuffer;

          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(5400, now);
          bp.Q.setValueAtTime(7.5, now);

          // 24Hz rapid cicada amplitude flutter
          const cLfo = ctx.createOscillator();
          const cLfoG = ctx.createGain();
          cLfo.frequency.setValueAtTime(24, now);
          cLfoG.gain.setValueAtTime(0.06, now);

          const cEnv = ctx.createGain();
          cEnv.gain.setValueAtTime(0.001, now);
          cEnv.gain.linearRampToValueAtTime(0.08, now + 0.4);
          cEnv.gain.setValueAtTime(0.08, now + burstDur - 0.4);
          cEnv.gain.exponentialRampToValueAtTime(0.0001, now + burstDur);

          cLfo.connect(cLfoG);
          cLfoG.connect(cEnv.gain);

          nSrc.connect(bp);
          bp.connect(cEnv);
          cEnv.connect(ambGain);

          cLfo.start(now);
          nSrc.start(now);
          cLfo.stop(now + burstDur);
          nSrc.stop(now + burstDur);
        };

        const cicadaInterval = setInterval(triggerCicada, 5500);
        addInterval(cicadaInterval);
      },

      // 3. Mechanica & Machina: Rhythmic tick-tock clockwork + gear clicks
      mechanica: ({ ambGain, addInterval, ctx }) => {
        let tick = true;
        // Escapement water-clock cadence (1.1Hz)
        const clockInterval = setInterval(() => {
          if (!this.ctx || this.isMuted) return;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(tick ? 720 : 540, now);

          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(tick ? 720 : 540, now);
          bp.Q.setValueAtTime(6.0, now);

          const g = ctx.createGain();
          g.gain.setValueAtTime(0.14, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

          osc.connect(bp);
          bp.connect(g);
          g.connect(ambGain);

          osc.start(now);
          osc.stop(now + 0.025);
          tick = !tick;
        }, 460);
        addInterval(clockInterval);

        // Soft gear tooth clicks
        const gearInterval = setInterval(() => {
          if (!this.ctx || this.isMuted) return;
          const now = ctx.currentTime;
          const clickBuffer = this.getNoiseBuffer('white', 0.05);
          if (!clickBuffer) return;

          const n = ctx.createBufferSource();
          n.buffer = clickBuffer;

          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(2400 + Math.random() * 800, now);
          bp.Q.setValueAtTime(5.0, now);

          const g = ctx.createGain();
          g.gain.setValueAtTime(0.04 + Math.random() * 0.05, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

          n.connect(bp);
          bp.connect(g);
          g.connect(ambGain);

          n.start(now);
          n.stop(now + 0.01);
        }, 220);
        addInterval(gearInterval);
      },

      // 4. Cosmographia: Ethereal "Musica Universalis" Pythagorean fifths pad (D-A-D-F#)
      cosmographia: ({ ambGain, addNode, ctx }) => {
        // Pythagorean D major planetary harmony
        const freqs = [146.83, 220.25, 293.66, 371.70]; // D3 - A3 - D4 - F#4
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, ctx.currentTime);

          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(800, ctx.currentTime);

          const g = ctx.createGain();
          g.gain.setValueAtTime(0.14, ctx.currentTime);

          // Celestial breathing phase LFO
          const lfo = ctx.createOscillator();
          const lfoG = ctx.createGain();
          lfo.frequency.setValueAtTime(0.05 + idx * 0.02, ctx.currentTime);
          lfoG.gain.setValueAtTime(0.05, ctx.currentTime);
          lfo.connect(lfoG);
          lfoG.connect(g.gain);

          osc.connect(lp);
          lp.connect(g);
          g.connect(ambGain);

          osc.start();
          lfo.start();
          addNode(osc);
          addNode(lfo);
        });

        // Shimmering overtone sine (A5/E6 celestial chime)
        const shimmer = ctx.createOscillator();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(880, ctx.currentTime);

        const sFilter = ctx.createBiquadFilter();
        sFilter.type = 'bandpass';
        sFilter.frequency.setValueAtTime(880, ctx.currentTime);
        sFilter.Q.setValueAtTime(8.0, ctx.currentTime);

        const sGain = ctx.createGain();
        sGain.gain.setValueAtTime(0.04, ctx.currentTime);

        const sLfo = ctx.createOscillator();
        const sLfoGain = ctx.createGain();
        sLfo.frequency.setValueAtTime(0.12, ctx.currentTime);
        sLfoGain.gain.setValueAtTime(0.03, ctx.currentTime);
        sLfo.connect(sLfoGain);
        sLfoGain.connect(sGain.gain);

        shimmer.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(ambGain);

        shimmer.start();
        sLfo.start();
        addNode(shimmer);
        addNode(sLfo);
      },

      // 5. Fabula & Arena: Crowd murmur + rhythmic cadence
      fabula: ({ ambGain, addNode, addInterval, ctx }) => {
        const pinkBuffer = this.getNoiseBuffer('pink', 4.0);
        if (pinkBuffer) {
          const crowd = ctx.createBufferSource();
          crowd.buffer = pinkBuffer;
          crowd.loop = true;

          // Dual undulating formant filters (350Hz & 850Hz)
          const f1 = ctx.createBiquadFilter();
          f1.type = 'bandpass';
          f1.frequency.setValueAtTime(360, ctx.currentTime);
          f1.Q.setValueAtTime(2.5, ctx.currentTime);

          const f1Lfo = ctx.createOscillator();
          const f1LfoG = ctx.createGain();
          f1Lfo.frequency.setValueAtTime(0.09, ctx.currentTime);
          f1LfoG.gain.setValueAtTime(80, ctx.currentTime);
          f1Lfo.connect(f1LfoG);
          f1LfoG.connect(f1.frequency);

          const cGain = ctx.createGain();
          cGain.gain.setValueAtTime(0.22, ctx.currentTime);

          crowd.connect(f1);
          f1.connect(cGain);
          cGain.connect(ambGain);

          crowd.start();
          f1Lfo.start();
          addNode(crowd);
          addNode(f1Lfo);
        }

        // Arena cadence pulse (1.2Hz rhythmic footstep/cheer thud)
        const cadenceInterval = setInterval(() => {
          if (!this.ctx || this.isMuted) return;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(82, now);
          osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

          const g = ctx.createGain();
          g.gain.setValueAtTime(0.16, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

          osc.connect(g);
          g.connect(ambGain);

          osc.start(now);
          osc.stop(now + 0.2);
        }, 830);
        addInterval(cadenceInterval);
      },

      // 6. Mathematica: Pure crystal sine harmonics & monochord resonance
      mathematica: ({ ambGain, addNode, ctx }) => {
        // Monochord harmonic series on fundamental 110Hz (1f, 2f, 3f, 4f, 5f, 6f)
        const fundamental = 110;
        const primes = [5.3, 7.1, 9.7, 11.3, 13.9, 17.1];

        for (let h = 1; h <= 6; h++) {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(fundamental * h, ctx.currentTime);

          const g = ctx.createGain();
          g.gain.setValueAtTime(0.08 / h, ctx.currentTime);

          // Incommensurate prime period LFOs: shifting monochord resonance
          const lfo = ctx.createOscillator();
          const lfoG = ctx.createGain();
          lfo.frequency.setValueAtTime(1 / primes[h - 1], ctx.currentTime);
          lfoG.gain.setValueAtTime(0.04 / h, ctx.currentTime);
          lfo.connect(lfoG);
          lfoG.connect(g.gain);

          osc.connect(g);
          g.connect(ambGain);

          osc.start();
          lfo.start();
          addNode(osc);
          addNode(lfo);
        }
      },

      // 7. Mare Nostrum: Ocean swell wash (pink noise LFO lowpass) + harbor bell
      mare: ({ ambGain, addNode, addInterval, ctx }) => {
        const pinkBuffer = this.getNoiseBuffer('pink', 4.0);
        if (pinkBuffer) {
          const surf = ctx.createBufferSource();
          surf.buffer = pinkBuffer;
          surf.loop = true;

          // Cascaded lowpass filter sweeping with ocean wave period (~7.2s)
          const lp1 = ctx.createBiquadFilter();
          const lp2 = ctx.createBiquadFilter();
          lp1.type = 'lowpass';
          lp2.type = 'lowpass';
          lp1.frequency.setValueAtTime(320, ctx.currentTime);
          lp2.frequency.setValueAtTime(320, ctx.currentTime);

          const waveLfo = ctx.createOscillator();
          const waveDepth = ctx.createGain();
          waveLfo.frequency.setValueAtTime(1 / 7.2, ctx.currentTime);
          waveDepth.gain.setValueAtTime(280, ctx.currentTime); // sweep 140Hz - 700Hz
          waveLfo.connect(waveDepth);
          waveDepth.connect(lp1.frequency);
          waveDepth.connect(lp2.frequency);

          const surfGain = ctx.createGain();
          surfGain.gain.setValueAtTime(0.25, ctx.currentTime);

          surf.connect(lp1);
          lp1.connect(lp2);
          lp2.connect(surfGain);
          surfGain.connect(ambGain);

          surf.start();
          waveLfo.start();
          addNode(surf);
          addNode(waveLfo);
        }

        // Distant harbor bell chime
        const bellInterval = setInterval(() => {
          if (!this.ctx || this.isMuted) return;
          const now = ctx.currentTime;
          const bell = ctx.createOscillator();
          bell.type = 'sine';
          bell.frequency.setValueAtTime(1180, now);

          const bFilter = ctx.createBiquadFilter();
          bFilter.type = 'bandpass';
          bFilter.frequency.setValueAtTime(1180, now);
          bFilter.Q.setValueAtTime(7.0, now);

          const bGain = ctx.createGain();
          bGain.gain.setValueAtTime(0.09, now);
          bGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

          bell.connect(bFilter);
          bFilter.connect(bGain);
          bGain.connect(ambGain);

          bell.start(now);
          bell.stop(now + 2.6);
        }, 9500);
        addInterval(bellInterval);
      },

      // 8. Architectura: Resonant chamber acoustics + chisel ping echo
      architectura: ({ ambGain, addNode, addInterval, ctx }) => {
        // Deep basilica stone foundation drone
        const drone = ctx.createOscillator();
        drone.type = 'triangle';
        drone.frequency.setValueAtTime(68, ctx.currentTime);

        const dFilter = ctx.createBiquadFilter();
        dFilter.type = 'lowpass';
        dFilter.frequency.setValueAtTime(180, ctx.currentTime);

        const dGain = ctx.createGain();
        dGain.gain.setValueAtTime(0.18, ctx.currentTime);

        // Echo delay loop
        const delay = ctx.createDelay();
        delay.delayTime.setValueAtTime(0.26, ctx.currentTime);
        const feedback = ctx.createGain();
        feedback.gain.setValueAtTime(0.42, ctx.currentTime);
        const damp = ctx.createBiquadFilter();
        damp.type = 'lowpass';
        damp.frequency.setValueAtTime(1200, ctx.currentTime);

        delay.connect(feedback);
        feedback.connect(damp);
        damp.connect(delay);
        delay.connect(ambGain);

        drone.connect(dFilter);
        dFilter.connect(dGain);
        dGain.connect(ambGain);
        dGain.connect(delay);

        drone.start();
        addNode(drone);

        // Marble chisel ping strike echoing in hall
        const chiselInterval = setInterval(() => {
          if (!this.ctx || this.isMuted) return;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(2850, now);

          const g = ctx.createGain();
          g.gain.setValueAtTime(0.08, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

          osc.connect(g);
          g.connect(ambGain);
          g.connect(delay);

          osc.start(now);
          osc.stop(now + 0.05);
        }, 3400);
        addInterval(chiselInterval);
      },

      // 9. Alchemia: Bubbling alembic liquid + soft hiss
      alchemia: ({ ambGain, addNode, addInterval, ctx }) => {
        // Soft steam simmer hiss
        const whiteBuffer = this.getNoiseBuffer('white', 3.0);
        if (whiteBuffer) {
          const hiss = ctx.createBufferSource();
          hiss.buffer = whiteBuffer;
          hiss.loop = true;

          const hp = ctx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.setValueAtTime(3800, ctx.currentTime);

          const hGain = ctx.createGain();
          hGain.gain.setValueAtTime(0.025, ctx.currentTime);

          hiss.connect(hp);
          hp.connect(hGain);
          hGain.connect(ambGain);

          hiss.start();
          addNode(hiss);
        }

        // Bubbling alembic liquid generator
        const bubbleInterval = setInterval(() => {
          if (!this.ctx || this.isMuted) return;
          const now = ctx.currentTime;
          const dur = 0.025 + Math.random() * 0.025;
          const startF = 260 + Math.random() * 200;
          const endF = startF + 300 + Math.random() * 300;

          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(startF, now);
          osc.frequency.exponentialRampToValueAtTime(endF, now + dur);

          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(endF, now);
          bp.Q.setValueAtTime(4.5, now);

          const g = ctx.createGain();
          g.gain.setValueAtTime(0.09, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

          osc.connect(bp);
          bp.connect(g);
          g.connect(ambGain);

          osc.start(now);
          osc.stop(now + dur + 0.01);
        }, 160);
        addInterval(bubbleInterval);
      },

      // 10. Strategia: War drum heartbeat + bronze beacon horn
      strategia: ({ ambGain, addInterval, ctx }) => {
        // War drum double pulse (56 BPM heartbeat)
        let subPulse = false;
        const drumInterval = setInterval(() => {
          if (!this.ctx || this.isMuted) return;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(subPulse ? 88 : 96, now);
          osc.frequency.exponentialRampToValueAtTime(42, now + 0.09);

          const g = ctx.createGain();
          g.gain.setValueAtTime(subPulse ? 0.16 : 0.22, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

          osc.connect(g);
          g.connect(ambGain);

          osc.start(now);
          osc.stop(now + 0.2);

          subPulse = !subPulse;
        }, subPulse ? 380 : 700);
        addInterval(drumInterval);

        // Distant bronze beacon horn note (long open fifth swell)
        const hornInterval = setInterval(() => {
          if (!this.ctx || this.isMuted) return;
          const now = ctx.currentTime;
          const horn = ctx.createOscillator();
          horn.type = 'sawtooth';
          horn.frequency.setValueAtTime(146.83, now); // D3 beacon call

          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(650, now);

          const hGain = ctx.createGain();
          hGain.gain.setValueAtTime(0.001, now);
          hGain.gain.linearRampToValueAtTime(0.14, now + 0.6);
          hGain.gain.setValueAtTime(0.12, now + 2.0);
          hGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

          horn.connect(lp);
          lp.connect(hGain);
          hGain.connect(ambGain);

          horn.start(now);
          horn.stop(now + 3.3);
        }, 14000);
        addInterval(hornInterval);
      }
    };

    return builders[id] || null;
  }
}

// Global Singleton Instance
export const soundMaster = new PlinySoundMaster();
