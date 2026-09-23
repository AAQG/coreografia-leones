/**
 * ENTRENADOR DE COREOGRAFÍA - TEAM LEON MIX
 * Reproductor de Video de Referencia (100% Silencioso) sincronizado con el MP3 master.
 * Información por canciones y pasos mostrados únicamente durante las transiciones.
 */

// ==========================================
// 1. VIDEO & SONG PHASES CONFIGURATION
// ==========================================
const SONG_PHASES = [
  {
    phaseIndex: 1,
    id: "ole_ole",
    file: "videos/ole ole.mp4",
    audioStart: 2.5, // Arranca en el segundo 2.5
    audioEnd: 53,
    title: "Pop Infantil (Karina)",
    vibe: "Ritmo: Alegre y Ligero",
    themeClass: "theme-fase1",
    timeframe: "0:02 - 0:53",
    desc: "La rutina comienza con energía de bienvenida, sonrisas grandes y movimientos amplios. El objetivo es verse sincronizados, alegres y ocupar todo el espacio del escenario.",
    nextNotice: "En el segundo <strong>0:53</strong>: Suelta de manos del círculo y mirada seria al frente para cambio a <strong>Funk Brasileño / Matemáticas</strong>.",
    steps: [
      "1. Paso lateral con rebote",
      "2. Giro de avión",
      "3. Aplausos arriba",
      "4. Círculo de preparación"
    ]
  },
  {
    phaseIndex: 2,
    id: "six_seven",
    file: "videos/six seven recortado.mp4",
    audioStart: 56,
    audioEnd: 82,
    title: "Funk Brasileño / Matemáticas",
    vibe: "Ritmo: Agresivo y Callejero",
    themeClass: "theme-fase2",
    timeframe: "0:56 - 1:22",
    desc: "El corte es brusco. Cambia la expresión facial de alegre a actitud dura (callejera). El centro de gravedad baja, doblando las rodillas, con movimientos secos y percusivos.",
    nextNotice: "En el segundo <strong>1:22</strong>: Pose congelada desafiante (Freeze), acelerando para <strong>Chipi Chipi Chapa Chapa</strong>.",
    steps: [
      "1. Chest pops aislados",
      "2. Footwork agresivo 20+20",
      "3. Sarrada no ar",
      "4. Freeze congelado"
    ]
  },
  {
    phaseIndex: 3,
    id: "chipi_chapa",
    file: "videos/chipi chapa dubi dubi.mp4",
    audioStart: 84,
    audioEnd: 130,
    title: "Chipi Chipi Chapa Chapa",
    vibe: "Ritmo: Rápido y Viral",
    themeClass: "theme-fase3",
    timeframe: "1:24 - 2:10",
    desc: "La velocidad se dispara. Entramos a una zona de baile tipo 'TikTok'. Todo es hiperactivo, muy saltado, con movimientos de manos cómicos pero perfectamente sincronizados.",
    nextNotice: "En el segundo <strong>2:10</strong>: La música baja, manos en rodillas simulando agotamiento... En 2:13 estallan las guitarras eléctricas.",
    steps: [
      "1. Rebote Kawaii orejitas",
      "2. Limpiaparabrisas",
      "3. Cruce relámpago",
      "4. Respiro en rodillas"
    ]
  },
  {
    phaseIndex: 4,
    id: "pokemon",
    file: "videos/pokemon.mp4",
    audioStart: 133,
    audioEnd: 196,
    title: "Pokémon (Final Épico)",
    vibe: "Ritmo: Rock, Marcial y Heroico",
    themeClass: "theme-fase4",
    timeframe: "2:13 - 3:16",
    desc: "La canción estalla con guitarras eléctricas. Movimientos gigantes, teatrales y llenos de pasión. ¡Muestra pasión, fuerza y mirada fija hacia el frente!",
    nextNotice: "En el segundo <strong>3:16</strong>: Pose heroica final congelados hasta que termine la pista.",
    steps: [
      "1. Salto de explosión",
      "2. Golpes y patadas ('Tengo que ser')",
      "3. Headbanging roquero",
      "4. Pose Heroica final"
    ]
  }
];

const TOTAL_DURATION_SEC = 198; // 3:18

// ==========================================
// 2. STATE MANAGEMENT
// ==========================================
let currentTime = 0;
let isPlaying = false;
let playbackSpeed = 1.0;
let loopMode = 'none'; // 'none' | 'phase'
let beepsEnabled = true;
let currentPhaseIndex = 1;
let animationFrameId = null;
let lastTimestamp = 0;
let audioContext = null;
let hasCustomAudio = false;

let lastSignaledCountdown = null;
let currentLoadedVideoFile = "";

// ==========================================
// 3. DOM ELEMENTS
// ==========================================
const choreoVideo = document.getElementById('choreoVideo');
const transitionScreen = document.getElementById('transitionScreen');
const transBadge = document.getElementById('transBadge');
const transTitle = document.getElementById('transTitle');
const transSub = document.getElementById('transSub');
const transStepsPreview = document.getElementById('transStepsPreview');
const transCountdown = document.getElementById('transCountdown');

const phaseBanner = document.getElementById('phaseBanner');
const phaseTag = document.getElementById('phaseTag');
const phaseName = document.getElementById('phaseName');
const phaseVibe = document.getElementById('phaseVibe');

const songBadge = document.getElementById('songBadge');
const songTimeframe = document.getElementById('songTimeframe');
const songTitle = document.getElementById('songTitle');
const songVibeTag = document.getElementById('songVibeTag');
const songDescription = document.getElementById('songDescription');
const songProgressText = document.getElementById('songProgressText');
const songProgressBar = document.getElementById('songProgressBar');
const nextTransText = document.getElementById('nextTransText');

const currentTimeText = document.getElementById('currentTimeText');
const timelineRange = document.getElementById('timelineRange');
const timelineFill = document.getElementById('timelineFill');

const btnPlayPause = document.getElementById('btnPlayPause');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const mainAudio = document.getElementById('mainAudio');
const audioFileInput = document.getElementById('audioFileInput');
const audioStatusText = document.getElementById('audioStatusText');


// ==========================================
// 4. WEB AUDIO API SYNTHESIZER (BEEPS EN TRANSICIONES)
// ==========================================
function getAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function playTone(freq, duration, type = 'sine', gainVal = 0.25) {
  if (!beepsEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn("Audio Context error:", err);
  }
}

function triggerTransitionCue(countRemaining) {
  if (countRemaining === 3) {
    playTone(440, 0.15, 'sine', 0.22); // A4
  } else if (countRemaining === 2) {
    playTone(523.25, 0.15, 'sine', 0.26); // C5
  } else if (countRemaining === 1) {
    playTone(659.25, 0.2, 'triangle', 0.32); // E5
  } else if (countRemaining === 0) {
    playTone(880, 0.35, 'triangle', 0.32); // A5 inicio
  }
}

// ==========================================
// 5. VIDEO SYNC & TRANSITION CONTROLLER
// ==========================================
function syncVideoWithAudio(audioTime, isAudioPlaying) {
  if (!choreoVideo) return;

  // STRICT REQUIREMENT: Video is 100% silent, audio comes only from master MP3
  choreoVideo.muted = true;
  choreoVideo.volume = 0;

  let currentSegment = null;
  let inTransition = false;
  let transitionData = null;

  // Exact time brackets:
  if (audioTime < 2.5) {
    // 0:00 - 0:02.5: Intro Countdown (Video 1 starts at sec 2.5)
    inTransition = true;
    transitionData = {
      badge: "INICIO DE COREOGRAFÍA",
      title: "¡Prepárense!",
      sub: "Team Leon Mix inicia en el segundo 2.5 con Pop Infantil (Karina):",
      steps: SONG_PHASES[0].steps,
      countdown: Math.max(1, Math.ceil(2.5 - audioTime))
    };
    preloadVideo("videos/ole ole.mp4");
  } else if (audioTime >= 2.5 && audioTime < 53) {
    // 0:02.5 - 0:53: Ole Ole (Pop Infantil)
    currentSegment = SONG_PHASES[0];
  } else if (audioTime >= 53 && audioTime < 56) {
    // 0:53 - 0:56: Transition 1 to Funk
    inTransition = true;
    transitionData = {
      badge: "CAMBIO DE PISTA (0:53 - 0:56)",
      title: "¡Suelta de manos del círculo!",
      sub: "Miren al frente serios... ¡Entra Funk Brasileño / Matemáticas!",
      steps: SONG_PHASES[1].steps,
      countdown: Math.max(1, Math.ceil(56 - audioTime))
    };
    preloadVideo("videos/six seven recortado.mp4");
  } else if (audioTime >= 56 && audioTime < 82) {
    // 0:56 - 1:22: Six Seven (Funk Brasileño)
    currentSegment = SONG_PHASES[1];
  } else if (audioTime >= 82 && audioTime < 84) {
    // 1:22 - 1:24: Transition 2 to Chipi Chipi
    inTransition = true;
    transitionData = {
      badge: "CAMBIO DE PISTA (1:22 - 1:24)",
      title: "¡Velocidad Viral TikTok!",
      sub: "Manos a la cabeza... ¡Entra Chipi Chipi Chapa Chapa!",
      steps: SONG_PHASES[2].steps,
      countdown: Math.max(1, Math.ceil(84 - audioTime))
    };
    preloadVideo("videos/chipi chapa dubi dubi.mp4");
  } else if (audioTime >= 84 && audioTime < 130) {
    // 1:24 - 2:10: Chipi Chapa (Chipi Chipi)
    currentSegment = SONG_PHASES[2];
  } else if (audioTime >= 130 && audioTime < 133) {
    // 2:10 - 2:13: Transition 3 to Pokémon
    inTransition = true;
    transitionData = {
      badge: "PREPARACIÓN ÉPICA (2:10 - 2:13)",
      title: "¡Respiro hondo en rodillas!",
      sub: "La música baja... En 2:13 estallan las guitarras eléctricas de Pokémon:",
      steps: SONG_PHASES[3].steps,
      countdown: Math.max(1, Math.ceil(133 - audioTime))
    };
    preloadVideo("videos/pokemon.mp4");
  } else if (audioTime >= 133 && audioTime < 196) {
    // 2:13 - 3:16: Pokémon Rock
    currentSegment = SONG_PHASES[3];
  } else {
    // 3:16 - 3:18: Closing Pose
    inTransition = true;
    transitionData = {
      badge: "¡CIERRE HEROICO!",
      title: "¡Pose Final!",
      sub: "¡Congelados hasta el final de la música! ¡Excelente coreografía Team Leon!",
      steps: ["¡Pose Heroica Sostenida!"],
      countdown: "🏆"
    };
  }

  // Handle Transition Screen & Beeps ONLY during transition
  if (inTransition && transitionData) {
    transBadge.textContent = transitionData.badge;
    transTitle.textContent = transitionData.title;
    transSub.textContent = transitionData.sub;
    transCountdown.textContent = transitionData.countdown;

    // Render upcoming steps chips inside transition screen
    if (transStepsPreview) {
      transStepsPreview.innerHTML = transitionData.steps.map(step =>
        `<span class="trans-step-chip">${step}</span>`
      ).join('');
    }

    transitionScreen.classList.remove('hidden');

    // Trigger transition sound cues on countdown ticks
    if (typeof transitionData.countdown === 'number') {
      if (transitionData.countdown !== lastSignaledCountdown) {
        lastSignaledCountdown = transitionData.countdown;
        triggerTransitionCue(transitionData.countdown);
      }
    }

    if (!choreoVideo.paused) {
      choreoVideo.pause();
    }
  } else if (currentSegment) {
    // Hide transition screen during normal playback
    transitionScreen.classList.add('hidden');
    lastSignaledCountdown = null;

    // Switch video source if needed
    if (currentLoadedVideoFile !== currentSegment.file) {
      currentLoadedVideoFile = currentSegment.file;
      choreoVideo.src = currentSegment.file;
      choreoVideo.playbackRate = playbackSpeed;
      choreoVideo.load();
    }

    // Synchronize video playback time with segment offset
    const targetVideoTime = Math.max(0, audioTime - currentSegment.audioStart);

    // Drift correction
    if (Math.abs(choreoVideo.currentTime - targetVideoTime) > 0.35) {
      choreoVideo.currentTime = targetVideoTime;
    }

    choreoVideo.playbackRate = playbackSpeed;

    // Synchronize play / pause state
    if (isAudioPlaying && choreoVideo.paused) {
      choreoVideo.play().catch(e => console.warn("Video play notice:", e));
    } else if (!isAudioPlaying && !choreoVideo.paused) {
      choreoVideo.pause();
    }
  }
}

function preloadVideo(filePath) {
  if (currentLoadedVideoFile !== filePath) {
    currentLoadedVideoFile = filePath;
    choreoVideo.src = filePath;
    choreoVideo.currentTime = 0;
    choreoVideo.playbackRate = playbackSpeed;
    choreoVideo.pause();
  }
}

// ==========================================
// 6. RENDER & UPDATE LOGIC (SONG OVERVIEW)
// ==========================================
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function getActivePhase(timeSec) {
  for (let i = 0; i < SONG_PHASES.length; i++) {
    const p = SONG_PHASES[i];
    if (timeSec < p.audioEnd) {
      return p;
    }
  }
  return SONG_PHASES[SONG_PHASES.length - 1];
}

function updateUI() {
  const phase = getActivePhase(currentTime);
  if (!phase) return;

  // 1. Update Body Theme Class
  document.body.className = phase.themeClass;

  // 2. Update Floating Banner & Info Panel
  phaseTag.textContent = `FASE ${phase.phaseIndex}`;
  phaseName.textContent = phase.title;
  phaseVibe.textContent = phase.vibe;

  songBadge.textContent = `CANCIÓN ${phase.phaseIndex} / 4`;
  songTimeframe.textContent = phase.timeframe;
  songTitle.textContent = phase.title;
  songVibeTag.textContent = phase.vibe;
  songDescription.textContent = phase.desc;
  nextTransText.innerHTML = phase.nextNotice;

  // 3. Song Progress Subtimer
  const songDuration = Math.max(1, phase.audioEnd - phase.audioStart);
  const songElapsed = Math.max(0, Math.min(songDuration, currentTime - phase.audioStart));
  const songPercent = Math.min(100, (songElapsed / songDuration) * 100);

  songProgressText.textContent = `${formatTime(songElapsed)} / ${formatTime(songDuration)}`;
  songProgressBar.style.width = `${songPercent}%`;

  // 4. Global Timeline Updates
  currentTimeText.textContent = formatTime(currentTime);
  const globalPercent = Math.min(100, (currentTime / TOTAL_DURATION_SEC) * 100);
  timelineFill.style.width = `${globalPercent}%`;
  timelineRange.value = currentTime;

  // Update phase indicator dots on timeline
  document.querySelectorAll('.phase-dot').forEach((dot, idx) => {
    dot.classList.toggle('active', (phase.phaseIndex - 1) === idx);
  });

  // 5. Synchronize video and transition state
  syncVideoWithAudio(currentTime, isPlaying);
}

// ==========================================
// 7. MAIN PLAYBACK LOOP (TICK)
// ==========================================
function tick(timestamp) {
  if (!isPlaying) return;

  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // Advance time according to master audio track
  if (hasCustomAudio && !mainAudio.paused) {
    currentTime = mainAudio.currentTime;
  } else {
    currentTime += delta * playbackSpeed;
  }

  // Check Loop Conditions
  if (loopMode === 'phase') {
    const activePhase = getActivePhase(currentTime);
    if (activePhase && currentTime >= activePhase.audioEnd) {
      currentTime = activePhase.audioStart;
      if (hasCustomAudio) mainAudio.currentTime = currentTime;
      triggerTransitionCue(0);
    }
  } else {
    // Choreo finished
    if (currentTime >= TOTAL_DURATION_SEC) {
      currentTime = TOTAL_DURATION_SEC;
      pause();
      updateUI();
      return;
    }
  }

  updateUI();
  animationFrameId = requestAnimationFrame(tick);
}

// ==========================================
// 8. USER CONTROLS & ACTIONS
// ==========================================
function play() {
  getAudioContext();
  isPlaying = true;
  lastTimestamp = 0;
  playIcon.classList.add('hidden');
  pauseIcon.classList.remove('hidden');

  if (hasCustomAudio) {
    mainAudio.playbackRate = playbackSpeed;
    mainAudio.currentTime = currentTime;
    mainAudio.play().catch(e => console.log('Audio autoplay notice:', e));
  }

  syncVideoWithAudio(currentTime, true);
  animationFrameId = requestAnimationFrame(tick);
}

function pause() {
  isPlaying = false;
  playIcon.classList.remove('hidden');
  pauseIcon.classList.add('hidden');

  if (hasCustomAudio) {
    mainAudio.pause();
  }

  if (choreoVideo && !choreoVideo.paused) {
    choreoVideo.pause();
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function togglePlay() {
  if (isPlaying) {
    pause();
  } else {
    play();
  }
}

function seekTo(sec) {
  currentTime = Math.max(0, Math.min(TOTAL_DURATION_SEC, sec));
  if (hasCustomAudio) {
    mainAudio.currentTime = currentTime;
  }
  lastSignaledCountdown = null;
  syncVideoWithAudio(currentTime, isPlaying);
  updateUI();
}

function jumpToSecond(sec) {
  seekTo(sec);
  if (!isPlaying) updateUI();
}

function jumpToPhase(phaseIdx) {
  const p = SONG_PHASES[phaseIdx];
  if (p) {
    seekTo(p.audioStart);
  }
}

function prevStep() {
  const activePhase = getActivePhase(currentTime);
  const prevIdx = activePhase ? Math.max(0, activePhase.phaseIndex - 2) : 0;
  jumpToPhase(prevIdx);
}

function nextStep() {
  const activePhase = getActivePhase(currentTime);
  const nextIdx = activePhase ? Math.min(SONG_PHASES.length - 1, activePhase.phaseIndex) : 0;
  jumpToPhase(nextIdx);
}

function restartChoreo() {
  seekTo(0);
}

function setSpeed(speed) {
  playbackSpeed = speed;
  if (hasCustomAudio) {
    mainAudio.playbackRate = speed;
  }
  if (choreoVideo) {
    choreoVideo.playbackRate = speed;
  }
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.speed) === speed);
  });
}

function handleLoopChange(mode) {
  loopMode = mode;
}

function toggleBeeps() {
  beepsEnabled = !beepsEnabled;
  const btn = document.getElementById('btnBeepsToggle');
  const onIcon = document.getElementById('beepIconOn');
  const offIcon = document.getElementById('beepIconOff');

  btn.classList.toggle('active', beepsEnabled);
  onIcon.classList.toggle('hidden', !beepsEnabled);
  offIcon.classList.toggle('hidden', beepsEnabled);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.warn("Fullscreen error:", err);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// Custom Audio Upload Handling
function handleAudioUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  mainAudio.src = url;
  hasCustomAudio = true;
  audioStatusText.textContent = `🎵 ${file.name.substring(0, 14)}...`;
  mainAudio.currentTime = currentTime;
  mainAudio.playbackRate = playbackSpeed;
  console.log("Audio file loaded:", file.name);
}

// Drag & drop audio onto window
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      mainAudio.src = url;
      hasCustomAudio = true;
      audioStatusText.textContent = `🎵 ${file.name.substring(0, 14)}...`;
      mainAudio.currentTime = currentTime;
    }
  }
});

// Timeline Slider input listener
timelineRange.addEventListener('input', (e) => {
  seekTo(parseFloat(e.target.value));
});


// ==========================================
// 10. KEYBOARD SHORTCUTS
// ==========================================
window.addEventListener('keydown', (e) => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

  if (e.code === 'Space') {
    e.preventDefault();
    togglePlay();
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault();
    prevStep();
  } else if (e.code === 'ArrowRight') {
    e.preventDefault();
    nextStep();
  } else if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen();
  } else if (e.key === 'm' || e.key === 'M') {
    toggleBeeps();
  } else if (e.key === 'r' || e.key === 'R') {
    restartChoreo();
  }
});

// ==========================================
// 11. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Ensure video is strictly muted
  if (choreoVideo) {
    choreoVideo.muted = true;
    choreoVideo.volume = 0;
  }

  // Auto-detect preloaded track (mix_infantil_team_leon.mp3)
  if (mainAudio && (mainAudio.src || mainAudio.getAttribute('src'))) {
    hasCustomAudio = true;
    console.log("Preloaded track detected:", mainAudio.src);
    mainAudio.addEventListener('ended', () => {
      pause();
      seekTo(0);
    });
  }

  updateUI();
  console.log("Team Leon Mix Choreography Video Trainer initialized successfully!");
});
