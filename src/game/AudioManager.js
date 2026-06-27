export const AUDIO_VOLUME = {
  master: 0.76,
  ambience: 0.42,
  sfx: 0.9,
  ui: 0.82,
  weaponLoop: 0.72,
  soundtrack: 0.24,
  alien: 0.0,
  lowHealth: 0.0
};

const MAX_AUDIBLE_DISTANCE = 980;
const WEAPON_HOLD_TIME = 0.13;

export class AudioManager {
  constructor() {
    this.context = null;
    this.master = null;
    this.ambienceBus = null;
    this.sfxBus = null;
    this.uiBus = null;
    this.weaponLoopBus = null;
    this.soundtrackBus = null;
    this.alienBus = null;
    this.lowHealthBus = null;
    this.ambienceFilter = null;
    this.ambienceNoiseGain = null;
    this.ambiencePad = null;
    this.ambiencePadFilter = null;
    this.alienGain = null;
    this.lowHealthGain = null;
    this.muted = false;
    this.unlocked = false;
    this.noiseBuffer = null;
    this.musicStep = 0;
    this.harmonyStep = 0;
    this.lastBleachTime = -Infinity;
    this.lastFlameTime = -Infinity;
    this.bleachLoop = null;
    this.flameLoop = null;
    this.timers = [];
    this.nextCreakAt = 0;
  }

  unlock() {
    if (this.unlocked) {
      this.context?.resume?.();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }

    this.context = new AudioContext();
    this.noiseBuffer = createNoiseBuffer(this.context, 2);
    this.createBusGraph();
    this.startAmbience();
    this.startSoundtrack();
    this.unlocked = true;
  }

  createBusGraph() {
    this.master = this.context.createGain();
    this.ambienceBus = this.context.createGain();
    this.sfxBus = this.context.createGain();
    this.uiBus = this.context.createGain();
    this.weaponLoopBus = this.context.createGain();
    this.soundtrackBus = this.context.createGain();
    this.alienBus = this.context.createGain();
    this.lowHealthBus = this.context.createGain();

    this.master.gain.value = this.muted ? 0 : AUDIO_VOLUME.master;
    this.ambienceBus.gain.value = AUDIO_VOLUME.ambience;
    this.sfxBus.gain.value = AUDIO_VOLUME.sfx;
    this.uiBus.gain.value = AUDIO_VOLUME.ui;
    this.weaponLoopBus.gain.value = AUDIO_VOLUME.weaponLoop;
    this.soundtrackBus.gain.value = AUDIO_VOLUME.soundtrack;
    this.alienBus.gain.value = AUDIO_VOLUME.alien;
    this.lowHealthBus.gain.value = AUDIO_VOLUME.lowHealth;

    this.ambienceBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.uiBus.connect(this.master);
    this.weaponLoopBus.connect(this.master);
    this.soundtrackBus.connect(this.master);
    this.alienBus.connect(this.master);
    this.lowHealthBus.connect(this.master);
    this.master.connect(this.context.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) {
      this.ramp(this.master.gain, this.muted ? 0 : AUDIO_VOLUME.master, 0.035);
    }
  }

  update(dt, game) {
    if (!this.unlocked) {
      return;
    }

    const now = this.context.currentTime;
    this.updateWeaponLoops(now);
    const intensity = this.enemyIntensity(game);
    const lowHealth = game.jack.health / game.jack.maxHealth < 0.34 ? 1 : 0;
    const alienActive = game.levelNumber >= 6 || game.lifeforms.some((lifeform) => lifeform.type === "alien");

    this.ramp(this.ambienceBus.gain, AUDIO_VOLUME.ambience * (0.75 + intensity * 0.75), 0.8);
    this.ramp(this.soundtrackBus.gain, AUDIO_VOLUME.soundtrack * (0.85 + intensity * 0.35), 0.8);
    this.ramp(this.alienBus.gain, alienActive ? 0.16 + intensity * 0.1 : 0.0, 1.2);
    this.ramp(this.lowHealthBus.gain, lowHealth ? 0.34 : 0.0, 0.4);

    if (this.ambienceFilter) {
      this.ramp(this.ambienceFilter.frequency, 180 + intensity * 360, 1.2);
      this.ramp(this.ambienceFilter.Q, 0.5 + intensity * 2.6, 1.0);
    }

    if (this.ambiencePadFilter) {
      this.ramp(this.ambiencePadFilter.frequency, 520 + intensity * 430, 1.4);
      this.ramp(this.ambiencePadFilter.Q, 1.2 + intensity * 2.4, 1.4);
    }

    if (now > this.nextCreakAt) {
      this.playOrganicCreak(intensity);
      this.nextCreakAt = now + randomBetween(3.4, 7.5) - intensity * 1.4;
    }
  }

  enemyIntensity(game) {
    if (!game?.jack) {
      return 0;
    }
    let pressure = 0;
    for (const lifeform of game.lifeforms) {
      if (lifeform.dead) {
        continue;
      }
      const dx = lifeform.x - game.jack.x;
      const dy = lifeform.y - game.jack.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 620) {
        pressure += 1 - distance / 620;
      }
      if (lifeform.type === "alien") {
        pressure += 0.8;
      }
    }
    return clamp(pressure / 5, 0, 1);
  }

  startAmbience() {
    const now = this.context.currentTime;

    const sub = this.context.createOscillator();
    const subGain = this.context.createGain();
    sub.type = "sine";
    sub.frequency.value = 38;
    subGain.gain.value = 0.052;
    sub.connect(subGain).connect(this.ambienceBus);
    sub.start(now);

    const drone = this.context.createOscillator();
    const droneGain = this.context.createGain();
    const droneFilter = this.context.createBiquadFilter();
    drone.type = "sawtooth";
    drone.frequency.value = 57.5;
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 330;
    droneFilter.Q.value = 1.8;
    droneGain.gain.value = 0.014;
    drone.connect(droneFilter).connect(droneGain).connect(this.ambienceBus);
    drone.start(now);

    const wetNoise = this.context.createBufferSource();
    const wetFilter = this.context.createBiquadFilter();
    const wetGain = this.context.createGain();
    wetNoise.buffer = this.noiseBuffer;
    wetNoise.loop = true;
    wetFilter.type = "bandpass";
    wetFilter.frequency.value = 175;
    wetFilter.Q.value = 0.9;
    wetGain.gain.value = 0.006;
    wetNoise.connect(wetFilter).connect(wetGain).connect(this.ambienceBus);
    wetNoise.start(now);
    this.ambienceFilter = wetFilter;
    this.ambienceNoiseGain = wetGain;

    const mod = this.context.createOscillator();
    const modDepth = this.context.createGain();
    mod.type = "sine";
    mod.frequency.value = 0.032;
    modDepth.gain.value = 95;
    mod.connect(modDepth).connect(wetFilter.frequency);
    mod.start(now);

    this.startHorrorHarmony(now);

    const alienOsc = this.context.createOscillator();
    const alienFilter = this.context.createBiquadFilter();
    const alienGain = this.context.createGain();
    alienOsc.type = "sawtooth";
    alienOsc.frequency.value = 31;
    alienFilter.type = "lowpass";
    alienFilter.frequency.value = 260;
    alienFilter.Q.value = 6;
    alienGain.gain.value = 0.12;
    alienOsc.connect(alienFilter).connect(alienGain).connect(this.alienBus);
    alienOsc.start(now);
    this.alienGain = alienGain;

    const heart = this.context.createOscillator();
    const heartGain = this.context.createGain();
    heart.type = "sine";
    heart.frequency.value = 48;
    heartGain.gain.value = 0.032;
    heart.connect(heartGain).connect(this.lowHealthBus);
    heart.start(now);
    this.lowHealthGain = heartGain;

    this.timers.push(setInterval(() => this.playHeartbeatPulse(this.ambienceBus, 0.032), 1180));
    this.timers.push(setInterval(() => this.playHeartbeatPulse(this.lowHealthBus, 0.11), 660));
    this.timers.push(setInterval(() => this.playWetBubble(), 1150 + Math.random() * 700));
    this.timers.push(setInterval(() => this.changeAmbientChord(), 7600));
    this.timers.push(setInterval(() => this.playDistantHorrorPhrase(), 9200 + Math.random() * 3300));
    this.timers.push(setInterval(() => this.playAlienScrape(), 5400 + Math.random() * 3100));
  }

  startHorrorHarmony(now) {
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 1.4;
    gain.gain.value = 0.24;
    filter.connect(gain).connect(this.ambienceBus);

    const oscillators = [0, 1, 2, 3].map((index) => {
      const osc = this.context.createOscillator();
      const voiceGain = this.context.createGain();
      osc.type = index === 0 ? "sine" : "triangle";
      voiceGain.gain.value = index === 0 ? 0.24 : 0.2;
      osc.connect(voiceGain).connect(filter);
      osc.start(now);
      return { osc, gain: voiceGain };
    });

    this.ambiencePad = { oscillators, gain };
    this.ambiencePadFilter = filter;
    this.changeAmbientChord(true);
  }

  changeAmbientChord(immediate = false) {
    if (!this.ambiencePad || !this.context) {
      return;
    }
    const now = this.context.currentTime;
    const chords = [
      [36.71, 73.42, 87.31, 123.47],
      [34.65, 69.3, 82.41, 116.54],
      [38.89, 77.78, 92.5, 130.81],
      [32.7, 65.41, 92.5, 123.47],
      [41.2, 82.41, 98.0, 138.59]
    ];
    const chord = chords[this.harmonyStep % chords.length];
    this.harmonyStep += 1;
    this.ambiencePad.oscillators.forEach((voice, index) => {
      const target = chord[index] * randomBetween(0.995, 1.006);
      voice.osc.frequency.cancelScheduledValues(now);
      voice.osc.frequency.setTargetAtTime(target, now, immediate ? 0.02 : 1.8 + index * 0.4);
    });
    this.ramp(this.ambiencePad.gain.gain, randomBetween(0.22, 0.3), immediate ? 0.05 : 2.8);
  }

  startSoundtrack() {
    this.timers.push(setInterval(() => this.playMusicStep(), 260));
    this.playMusicStep();
  }

  playMusicStep() {
    if (!this.canSound()) {
      return;
    }
    const step = this.musicStep % 16;
    const bass = [41, 41, 55, 41, 62, 55, 37, 46];
    const motif = [0, 0, 147, 0, 0, 165, 196, 0, 0, 0, 131, 0, 0, 196, 147, 0];
    if (step % 4 === 0) {
      this.layeredTone({
        frequency: bass[(step / 2) % bass.length],
        duration: 0.42,
        gain: 0.075,
        type: "sawtooth",
        slide: -5,
        filter: "lowpass",
        filterFrequency: 240,
        destination: this.soundtrackBus
      });
      this.filteredNoise(0.08, 92, 0.018, "lowpass", this.soundtrackBus);
    }
    if (motif[step]) {
      this.layeredTone({
        frequency: motif[step] * randomBetween(0.995, 1.006),
        duration: 0.38,
        gain: 0.026,
        type: "sine",
        slide: randomBetween(-16, 9),
        filter: "lowpass",
        filterFrequency: 720,
        destination: this.soundtrackBus
      });
    }
    this.musicStep += 1;
  }

  playBleach(dt = 0) {
    if (!this.canSound()) {
      return;
    }
    this.lastBleachTime = this.context.currentTime;
    this.startBleachLoop();
  }

  playFlame(dt = 0) {
    if (!this.canSound()) {
      return;
    }
    this.lastFlameTime = this.context.currentTime;
    this.startFlameLoop();
  }

  startBleachLoop() {
    if (this.bleachLoop) {
      this.ramp(this.bleachLoop.gain.gain, 0.26, 0.03);
      return;
    }
    const now = this.context.currentTime;
    const source = this.context.createBufferSource();
    const hissFilter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noiseBuffer;
    source.loop = true;
    hissFilter.type = "highpass";
    hissFilter.frequency.value = 1400;
    hissFilter.Q.value = 0.7;
    gain.gain.value = 0.001;
    source.connect(hissFilter).connect(gain).connect(this.weaponLoopBus);
    source.start(now);
    const clickTimer = setInterval(() => {
      if (this.bleachLoop) {
        this.chemicalFizz(this.weaponLoopBus, 0.035);
      }
    }, 70 + Math.random() * 70);
    this.bleachLoop = { source, gain, filter: hissFilter, clickTimer };
    this.ramp(gain.gain, 0.26, 0.025);
  }

  startFlameLoop() {
    if (this.flameLoop) {
      this.ramp(this.flameLoop.noiseGain.gain, 0.34, 0.035);
      this.ramp(this.flameLoop.rumbleGain.gain, 0.12, 0.035);
      return;
    }
    const now = this.context.currentTime;
    const noise = this.context.createBufferSource();
    const roarFilter = this.context.createBiquadFilter();
    const noiseGain = this.context.createGain();
    noise.buffer = this.noiseBuffer;
    noise.loop = true;
    roarFilter.type = "lowpass";
    roarFilter.frequency.value = 720;
    roarFilter.Q.value = 2.2;
    noiseGain.gain.value = 0.001;
    noise.connect(roarFilter).connect(noiseGain).connect(this.weaponLoopBus);
    noise.start(now);

    const rumble = this.context.createOscillator();
    const rumbleFilter = this.context.createBiquadFilter();
    const rumbleGain = this.context.createGain();
    rumble.type = "sawtooth";
    rumble.frequency.value = 48;
    rumbleFilter.type = "lowpass";
    rumbleFilter.frequency.value = 145;
    rumbleGain.gain.value = 0.001;
    rumble.connect(rumbleFilter).connect(rumbleGain).connect(this.weaponLoopBus);
    rumble.start(now);

    const crackleTimer = setInterval(() => {
      if (this.flameLoop) {
        this.flameCrackle(this.weaponLoopBus, 0.06);
      }
    }, 45 + Math.random() * 55);

    this.flameLoop = { noise, roarFilter, noiseGain, rumble, rumbleGain, crackleTimer };
    this.ramp(noiseGain.gain, 0.34, 0.035);
    this.ramp(rumbleGain.gain, 0.12, 0.035);
  }

  updateWeaponLoops(now) {
    if (this.bleachLoop && now - this.lastBleachTime > WEAPON_HOLD_TIME) {
      const loop = this.bleachLoop;
      this.bleachLoop = null;
      clearInterval(loop.clickTimer);
      this.ramp(loop.gain.gain, 0.0001, 0.09);
      loop.source.stop(now + 0.16);
      this.chemicalFizz(this.weaponLoopBus, 0.06);
    }
    if (this.flameLoop && now - this.lastFlameTime > WEAPON_HOLD_TIME) {
      const loop = this.flameLoop;
      this.flameLoop = null;
      clearInterval(loop.crackleTimer);
      this.ramp(loop.noiseGain.gain, 0.0001, 0.12);
      this.ramp(loop.rumbleGain.gain, 0.0001, 0.12);
      loop.noise.stop(now + 0.2);
      loop.rumble.stop(now + 0.2);
      this.filteredNoise(0.18, 330, 0.09, "lowpass", this.weaponLoopBus);
    }
  }

  playSplat() {
    this.playKill();
  }

  playHit() {
    if (!this.canSound()) {
      return;
    }
    this.filteredNoise(0.08, randomBetween(240, 420), randomBetween(0.05, 0.075), "bandpass", this.sfxBus);
    this.layeredTone({
      frequency: randomBetween(88, 122),
      duration: 0.09,
      gain: 0.04,
      type: "sine",
      slide: -24,
      destination: this.sfxBus
    });
  }

  playKill() {
    if (!this.canSound()) {
      return;
    }
    this.layeredTone({
      frequency: randomBetween(55, 78),
      duration: 0.18,
      gain: 0.11,
      type: "sine",
      slide: -18,
      destination: this.sfxBus
    });
    this.filteredNoise(0.13, randomBetween(180, 330), 0.12, "bandpass", this.sfxBus);
    this.chemicalFizz(this.sfxBus, 0.08);
  }

  playJackDamage() {
    if (!this.canSound()) {
      return;
    }
    this.layeredTone({
      frequency: randomBetween(62, 78),
      duration: 0.2,
      gain: 0.13,
      type: "sine",
      slide: -22,
      destination: this.sfxBus
    });
    this.filteredNoise(0.12, randomBetween(640, 1100), 0.07, "bandpass", this.sfxBus);
    setTimeout(() => this.playHeartbeatPulse(this.sfxBus, 0.12), 55);
  }

  playPickup() {
    if (!this.canSound()) {
      return;
    }
    const root = randomBetween(392, 430);
    this.layeredTone({ frequency: root, duration: 0.12, gain: 0.055, type: "triangle", slide: 18, destination: this.uiBus });
    setTimeout(() => this.layeredTone({ frequency: root * 1.5, duration: 0.16, gain: 0.04, type: "sine", slide: 24, destination: this.uiBus }), 45);
    this.filteredNoise(0.06, 1600, 0.018, "highpass", this.uiBus);
  }

  playClear() {
    if (!this.canSound()) {
      return;
    }
    [0, 100, 210, 330].forEach((delay, index) => {
      setTimeout(() => {
        this.layeredTone({
          frequency: [146, 196, 247, 330][index],
          duration: 0.42,
          gain: 0.055 - index * 0.004,
          type: index < 2 ? "sawtooth" : "triangle",
          slide: 42,
          filter: "lowpass",
          filterFrequency: 700 + index * 280,
          destination: this.uiBus
        });
      }, delay);
    });
    this.filteredNoise(0.35, 520, 0.06, "bandpass", this.uiBus);
  }

  playGameOver() {
    if (!this.canSound()) {
      return;
    }
    this.layeredTone({
      frequency: 122,
      duration: 1.1,
      gain: 0.16,
      type: "sawtooth",
      slide: -84,
      filter: "lowpass",
      filterFrequency: 360,
      destination: this.uiBus
    });
    setTimeout(() => this.layeredTone({
      frequency: 54,
      duration: 1.3,
      gain: 0.14,
      type: "sine",
      slide: -24,
      destination: this.uiBus
    }), 140);
    this.filteredNoise(0.9, 190, 0.11, "lowpass", this.uiBus);
  }

  playPositionalSfx(name, worldX, worldY, jackX, jackY) {
    if (!this.canSound()) {
      return;
    }
    const dx = worldX - jackX;
    const dy = worldY - jackY;
    const distance = Math.hypot(dx, dy);
    const attenuation = clamp(1 - distance / MAX_AUDIBLE_DISTANCE, 0, 1);
    if (attenuation <= 0.02) {
      return;
    }
    const pan = clamp(dx / 520, -1, 1);
    const destination = this.createPositionalDestination(pan, attenuation, distance);
    if (name === "hit") {
      this.playHitTo(destination);
    } else if (name === "kill" || name === "splat") {
      this.playKillTo(destination);
    } else if (name === "pickup") {
      this.playPickupTo(destination);
    } else {
      this.filteredNoise(0.1, 520, 0.08, "bandpass", destination);
    }
  }

  createPositionalDestination(pan, attenuation, distance) {
    const panNode = this.context.createStereoPanner();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    panNode.pan.value = pan;
    gain.gain.value = attenuation;
    filter.type = "lowpass";
    filter.frequency.value = distance > 460 ? 1100 : 8000;
    filter.connect(gain).connect(panNode).connect(this.sfxBus);
    return filter;
  }

  playHitTo(destination) {
    this.filteredNoise(0.08, randomBetween(240, 420), 0.065, "bandpass", destination);
  }

  playKillTo(destination) {
    this.layeredTone({ frequency: randomBetween(55, 78), duration: 0.18, gain: 0.11, type: "sine", slide: -18, destination });
    this.filteredNoise(0.13, randomBetween(180, 330), 0.12, "bandpass", destination);
  }

  playPickupTo(destination) {
    this.layeredTone({ frequency: randomBetween(392, 430), duration: 0.12, gain: 0.055, type: "triangle", slide: 18, destination });
  }

  playWetBubble() {
    if (!this.canSound()) {
      return;
    }
    this.layeredTone({
      frequency: randomBetween(80, 155),
      duration: randomBetween(0.08, 0.18),
      gain: randomBetween(0.005, 0.011),
      type: "sine",
      slide: randomBetween(20, 55),
      destination: this.ambienceBus
    });
  }

  playOrganicCreak(intensity = 0) {
    if (!this.canSound()) {
      return;
    }
    this.layeredTone({
      frequency: randomBetween(34, 58),
      duration: randomBetween(0.45, 0.9),
      gain: 0.018 + intensity * 0.04,
      type: "sawtooth",
      slide: randomBetween(-14, 18),
      filter: "bandpass",
      filterFrequency: randomBetween(120, 360),
      destination: this.ambienceBus
    });
  }

  playDistantHorrorPhrase() {
    if (!this.canSound()) {
      return;
    }
    const phrase = Math.random() > 0.5
      ? [196, 185, 147, 138]
      : [165, 196, 155, 123];
    phrase.forEach((note, index) => {
      setTimeout(() => {
        this.layeredTone({
          frequency: note * randomBetween(0.992, 1.004),
          duration: randomBetween(0.72, 1.25),
          gain: index === 0 ? 0.044 : 0.032,
          type: "sine",
          slide: randomBetween(-18, 12),
          filter: "lowpass",
          filterFrequency: randomBetween(520, 880),
          destination: this.ambienceBus
        });
        if (index === phrase.length - 1) {
          this.filteredNoise(0.16, randomBetween(360, 620), 0.012, "bandpass", this.ambienceBus);
        }
      }, index * randomBetween(540, 820));
    });
  }

  playAlienScrape() {
    if (!this.canSound()) {
      return;
    }
    this.filteredNoise(randomBetween(0.18, 0.34), randomBetween(260, 620), 0.055, "bandpass", this.alienBus);
  }

  playHeartbeatPulse(destination, gainValue) {
    if (!this.canSound()) {
      return;
    }
    this.layeredTone({ frequency: 52, duration: 0.09, gain: gainValue, type: "sine", slide: -8, destination });
    setTimeout(() => this.layeredTone({ frequency: 42, duration: 0.11, gain: gainValue * 0.62, type: "sine", slide: -5, destination }), 120);
  }

  chemicalFizz(destination, gainValue) {
    const count = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i += 1) {
      setTimeout(() => {
        this.filteredNoise(randomBetween(0.018, 0.05), randomBetween(1300, 3100), gainValue * randomBetween(0.35, 0.9), "highpass", destination);
      }, i * randomBetween(12, 34));
    }
  }

  flameCrackle(destination, gainValue) {
    this.filteredNoise(randomBetween(0.018, 0.045), randomBetween(900, 2600), gainValue * randomBetween(0.45, 1), "bandpass", destination);
  }

  layeredTone({ frequency, duration, gain, type = "sine", slide = 0, filter = null, filterFrequency = 1000, destination }) {
    if (!this.canSound()) {
      return;
    }
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const amp = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, frequency), now);
    if (slide) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, frequency + slide), now + duration);
    }
    amp.gain.setValueAtTime(Math.max(0.0001, gain * randomBetween(0.92, 1.08)), now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    if (filter) {
      const biquad = this.context.createBiquadFilter();
      biquad.type = filter;
      biquad.frequency.value = filterFrequency;
      osc.connect(biquad).connect(amp).connect(destination);
    } else {
      osc.connect(amp).connect(destination);
    }
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  filteredNoise(duration, frequency, gainValue, filterType, destination) {
    if (!this.canSound()) {
      return;
    }
    const now = this.context.currentTime;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = filterType;
    filter.frequency.value = frequency * randomBetween(0.88, 1.15);
    filter.Q.value = filterType === "bandpass" ? randomBetween(1.2, 6) : randomBetween(0.4, 1.6);
    gain.gain.setValueAtTime(Math.max(0.0001, gainValue * randomBetween(0.85, 1.12)), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain).connect(destination);
    source.start(now);
    source.stop(now + duration + 0.03);
  }

  // Backwards-compatible helpers for older call sites.
  tone(frequency, duration, gainValue, type = "sine", slide = 0) {
    this.layeredTone({ frequency, duration, gain: gainValue, type, slide, destination: this.sfxBus });
  }

  noise(duration, frequency, gainValue, filterType) {
    this.filteredNoise(duration, frequency, gainValue, filterType, this.sfxBus);
  }

  getMixSnapshot() {
    return {
      master: this.master?.gain.value ?? AUDIO_VOLUME.master,
      ambienceBus: this.ambienceBus?.gain.value ?? AUDIO_VOLUME.ambience,
      soundtrackBus: this.soundtrackBus?.gain.value ?? AUDIO_VOLUME.soundtrack,
      sfxBus: this.sfxBus?.gain.value ?? AUDIO_VOLUME.sfx,
      uiBus: this.uiBus?.gain.value ?? AUDIO_VOLUME.ui,
      weaponLoopBus: this.weaponLoopBus?.gain.value ?? AUDIO_VOLUME.weaponLoop,
      alienBus: this.alienBus?.gain.value ?? AUDIO_VOLUME.alien,
      lowHealthBus: this.lowHealthBus?.gain.value ?? AUDIO_VOLUME.lowHealth,
      wetNoiseGain: this.ambienceNoiseGain?.gain.value ?? 0.006,
      padGain: this.ambiencePad?.gain.gain.value ?? 0.24,
      padFilterHz: this.ambiencePadFilter?.frequency.value ?? 900
    };
  }

  canSound() {
    return this.unlocked && !this.muted && this.context;
  }

  ramp(param, value, timeConstant) {
    const now = this.context.currentTime;
    param.cancelScheduledValues(now);
    param.setTargetAtTime(value, now, timeConstant);
  }
}

function createNoiseBuffer(context, seconds) {
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
