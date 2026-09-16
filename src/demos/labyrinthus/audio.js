export class LabyrinthusAudio {
  constructor() {
    this.ctx = null;
    this.musicOscillators = [];
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.isMuted = false;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);
      this.musicGain.gain.value = 0.3;
    } catch (e) {
      console.warn("WebAudio API not supported");
    }
  }

  setMasterVolume(vol) {
    if (this.masterGain) this.masterGain.gain.value = this.isMuted ? 0 : vol;
  }

  setSfxVolume(vol) {
    if (this.sfxGain) this.sfxGain.gain.value = vol;
  }

  setMute(mute) {
    this.isMuted = mute;
    if (this.masterGain) this.masterGain.gain.value = mute ? 0 : 1;
  }

  playFootstep() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.05);
    env.gain.setValueAtTime(0.5, t);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  playCast() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.3);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.7, t + 0.05);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  playImpact() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.exponentialRampToValueAtTime(50, t + 0.5);
    
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(1, t);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    
    noise.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.5);
  }

  playGrowl() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(50, t + 0.4);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.linearRampToValueAtTime(100, t + 0.4);
    
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.8, t + 0.1);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    
    osc.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  playPickup() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.setValueAtTime(1600, t + 0.1);
    
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.5, t + 0.05);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  startMusic() {
    this.init();
    this.stopMusic();
    if (!this.ctx) return;
    const freqs = [65.41, 98.00, 130.81]; // C2, G2, C3
    const t = this.ctx.currentTime;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.musicOscillators.push(lfo);

    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      
      const env = this.ctx.createGain();
      env.gain.value = 0.2;
      
      osc.connect(filter);
      osc.start(t);
      this.musicOscillators.push(osc);
    });
    
    filter.connect(this.musicGain);
  }

  stopMusic() {
    this.musicOscillators.forEach(osc => {
      try { osc.stop(); } catch(e) {}
      osc.disconnect();
    });
    this.musicOscillators = [];
  }

  destroy() {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
