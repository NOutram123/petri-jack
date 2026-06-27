export class AudioManager {
  constructor() {
    this.context = null;
    this.master = null;
    this.effectsGain = null;
    this.musicGain = null;
    this.ambientGain = null;
    this.muted = false;
    this.unlocked = false;
    this.bleachGate = 0;
    this.flameGate = 0;
    this.musicStep = 0;
    this.musicTimer = null;
  }

  unlock() {
    if (this.unlocked) {
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.effectsGain = this.context.createGain();
    this.musicGain = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.72;
    this.effectsGain.gain.value = 0.8;
    this.musicGain.gain.value = 0.2;
    this.effectsGain.connect(this.master);
    this.musicGain.connect(this.master);
    this.master.connect(this.context.destination);
    this.startAmbient();
    this.startSoundtrack();
    this.unlocked = true;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.72, this.context.currentTime, 0.03);
    }
  }

  startAmbient() {
    const now = this.context.currentTime;
    const hum = this.context.createOscillator();
    const humGain = this.context.createGain();
    hum.type = "sine";
    hum.frequency.value = 46;
    humGain.gain.value = 0.055;
    hum.connect(humGain).connect(this.musicGain);
    hum.start(now);

    const pulse = this.context.createOscillator();
    const pulseGain = this.context.createGain();
    pulse.type = "triangle";
    pulse.frequency.value = 1.25;
    pulseGain.gain.value = 0.04;
    pulse.connect(pulseGain).connect(this.musicGain);
    pulse.start(now);

    this.ambientGain = humGain;
  }

  startSoundtrack() {
    const tempoMs = 260;
    this.musicTimer = setInterval(() => this.playMusicStep(), tempoMs);
    this.playMusicStep();
  }

  playMusicStep() {
    if (!this.unlocked || this.muted) {
      return;
    }
    const bassNotes = [41, 41, 55, 41, 62, 55, 37, 46];
    const leadNotes = [0, 165, 0, 147, 196, 0, 131, 0, 220, 0, 196, 147, 0, 165, 0, 123];
    const step = this.musicStep % 16;
    if (step % 2 === 0) {
      this.musicTone(bassNotes[(step / 2) % bassNotes.length], 0.22, 0.13, "sawtooth", -4);
      this.musicNoise(0.045, step % 4 === 0 ? 95 : 420, step % 4 === 0 ? 0.12 : 0.055, step % 4 === 0 ? "lowpass" : "highpass");
    }
    if (leadNotes[step] > 0) {
      this.musicTone(leadNotes[step], 0.18, 0.045, "triangle", -12);
    }
    if (step === 7 || step === 15) {
      this.musicNoise(0.18, 680, 0.035, "bandpass");
    }
    this.musicStep += 1;
  }

  playBleach(dt) {
    this.bleachGate -= dt;
    if (this.bleachGate > 0) {
      return;
    }
    this.noise(0.08, 900, 0.035, "highpass");
    this.bleachGate = 0.07;
  }

  playFlame(dt) {
    this.flameGate -= dt;
    if (this.flameGate > 0) {
      return;
    }
    this.noise(0.1, 120, 0.06, "lowpass");
    this.tone(82, 0.08, 0.035, "sawtooth");
    this.flameGate = 0.055;
  }

  playSplat() {
    this.noise(0.12, 520, 0.13, "bandpass");
    this.tone(110 + Math.random() * 60, 0.08, 0.04, "triangle", -260);
  }

  playJackDamage() {
    this.tone(150, 0.14, 0.12, "sawtooth", -640);
  }

  playPickup() {
    this.tone(520, 0.08, 0.055, "triangle", 420);
  }

  playClear() {
    this.tone(330, 0.11, 0.08, "triangle", 220);
    setTimeout(() => this.tone(520, 0.16, 0.08, "triangle", 120), 90);
  }

  playGameOver() {
    this.tone(120, 0.6, 0.14, "sawtooth", -90);
    this.noise(0.5, 180, 0.11, "lowpass");
  }

  tone(frequency, duration, gainValue, type = "sine", slide = 0) {
    if (!this.unlocked || this.muted) {
      return;
    }
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slide) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, frequency + slide), now + duration);
    }
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(this.effectsGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  noise(duration, frequency, gainValue, filterType) {
    if (!this.unlocked || this.muted) {
      return;
    }
    const now = this.context.currentTime;
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    filter.type = filterType;
    filter.frequency.value = frequency;
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(filter).connect(gain).connect(this.effectsGain);
    source.start(now);
  }

  musicTone(frequency, duration, gainValue, type = "sine", slide = 0) {
    if (!this.unlocked || this.muted) {
      return;
    }
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slide) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, frequency + slide), now + duration);
    }
    filter.type = "lowpass";
    filter.frequency.value = 900;
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(filter).connect(gain).connect(this.musicGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  musicNoise(duration, frequency, gainValue, filterType) {
    if (!this.unlocked || this.muted) {
      return;
    }
    const now = this.context.currentTime;
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    filter.type = filterType;
    filter.frequency.value = frequency;
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(filter).connect(gain).connect(this.musicGain);
    source.start(now);
  }
}
