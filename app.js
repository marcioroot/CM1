/**
 * Main Application Logic for CM1 Practice Hub
 * Strictly adhering to coding standards: English code, functions, comments.
 * UI is 100% in French for CM1 pupils.
 * Full support for Grammatical Variations (Gender, Number, Conjugations).
 */

// Sound synthesis using Web Audio API (Offline, zero external dependencies)
class SoundEffects {
  constructor() {
    this.audioCtx = null;
    this.enabled = true;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3); // C6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playWrong() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.25);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const now = this.audioCtx.currentTime + idx * 0.1;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    });
  }
}

// Particle Confetti Generator
class ConfettiManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animationId = null;

    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(count = 70) {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#d946ef'];
    
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 3,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 18,
        gravity: 0.4,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        life: 1,
        decay: Math.random() * 0.015 + 0.01
      });
    }

    if (!this.animationId) {
      this.animate();
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.vRot;
      p.life -= p.decay;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();

      if (p.life <= 0 || p.y > window.innerHeight) {
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.animationId = null;
    }
  }
}

// Main Application Controller
class CM1App {
  constructor() {
    this.sound = new SoundEffects();
    this.confetti = new ConfettiManager('confettiCanvas');

    // State
    this.selectedDicteeId = 1;
    this.includePriorVocab = true;
    this.includeVariations = true;
    this.generationMode = 'story'; // 'story' | 'sentences' | 'dynamic' | 'variations'
    this.practiceSubTab = 'discovery'; // 'discovery' | 'cloze' | 'notebook' | 'game' | 'variations'

    // User progress state loaded from localStorage
    this.userStats = this.loadStats();
    this.masteredWords = this.loadMasteredWords();

    // Notebook dictation step
    this.currentNotebookSentenceIndex = 0;

    // Word puzzle game state
    this.currentGameWord = '';
    this.scrambledLetters = [];

    // French speech synthesis voice selection
    this.frenchVoice = null;
    this.initVoices();

    // Speech synthesis reading state
    this.speechState = 'idle'; // 'idle' | 'playing' | 'paused'
    this.currentSpeechMode = null; // 'normal' | 'slow'
    this.currentSpeechRate = 0.9;
    this.speechChunks = [];
    this.currentChunkIndex = 0;
    this.currentChunkCharOffset = 0;
    this.pausedChunkCharOffset = 0;
    this.currentUtterance = null;
    this.chunkTimeout = null;
  }

  loadStats() {
    try {
      const saved = localStorage.getItem('cm1_stats');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load stats from localStorage', e);
    }
    return { stars: 25, streak: 1, completedExercises: 0, level: 'Apprenti Scribe' };
  }

  saveStats() {
    try {
      localStorage.setItem('cm1_stats', JSON.stringify(this.userStats));
    } catch (e) {
      console.warn('Failed to save stats to localStorage', e);
    }
    this.updateStatsUI();
  }

  loadMasteredWords() {
    try {
      const saved = localStorage.getItem('cm1_mastered_words');
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {
      console.warn('Failed to load mastered words', e);
    }
    return new Set();
  }

  saveMasteredWords() {
    try {
      localStorage.setItem('cm1_mastered_words', JSON.stringify([...this.masteredWords]));
    } catch (e) {
      console.warn('Failed to save mastered words', e);
    }
  }

  initVoices() {
    if ('speechSynthesis' in window) {
      const findVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return;

        // Filter all available French voices
        const frenchVoices = voices.filter(v => v.lang && v.lang.startsWith('fr'));
        if (frenchVoices.length === 0) return;

        // 1. Prefer offline local system voices (native Windows SAPI, macOS/iOS, Linux)
        // Remote/cloud voices (e.g. Google français) break pause/resume in Chromium
        const localVoices = frenchVoices.filter(v => v.localService === true);
        const pool = localVoices.length > 0 ? localVoices : frenchVoices;

        // 2. Look for high-quality standard French voices
        this.frenchVoice = pool.find(v =>
          v.name.includes('Thomas') ||
          v.name.includes('Hortense') ||
          v.name.includes('Paul') ||
          v.name.includes('Amelie') ||
          v.name.includes('Julie')
        ) || pool[0] || null;
      };

      findVoice();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = findVoice;
      }
    }
  }

  getCurrentDicteeTextChunks() {
    const dictee = this.getCurrentDictee();
    if (!dictee) return [];

    let textArray = [];
    if (this.generationMode === 'story') {
      // Split the story by sentence terminators (. ! ? … \n), preserving the punctuation
      const matches = dictee.story.match(/[^.!?…\n]+(?:[.!?…]+|\n|$)/g);
      textArray = matches ? matches.map(s => s.trim()).filter(Boolean) : [dictee.story.trim()];
    } else if (this.generationMode === 'variations') {
      textArray = this.getVariationSentences().map(item => item.sentence.trim()).filter(Boolean);
    } else {
      textArray = (dictee.sentences || []).map(s => s.trim()).filter(Boolean);
    }

    return textArray.length > 0 ? textArray : [(dictee.story || "").trim()].filter(Boolean);
  }

  getCurrentDicteeText() {
    return this.getCurrentDicteeTextChunks().join(' ');
  }

  // Short one-off speech for individual words or sentences
  speak(text, rate = 0.95) {
    if (!('speechSynthesis' in window) || !text) return;
    this.stopSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    if (this.frenchVoice) {
      utterance.voice = this.frenchVoice;
    }
    utterance.rate = rate;
    utterance.pitch = 1.05;

    this.currentUtterance = utterance;
    window._cm1_utterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  // Full-text continuous reading with sentence-chunk queue architecture
  startReading(input, rate = 0.9, mode = 'normal', startIndex = 0) {
    if (!('speechSynthesis' in window)) return;
    this.stopSpeech();

    let chunks = [];
    if (Array.isArray(input)) {
      chunks = input.map(s => (s || '').trim()).filter(Boolean);
    } else if (typeof input === 'string') {
      const matches = input.match(/[^.!?…\n]+(?:[.!?…]+|\n|$)/g);
      chunks = matches ? matches.map(s => s.trim()).filter(Boolean) : [input.trim()].filter(Boolean);
    }

    if (chunks.length === 0) return;

    this.speechState = 'playing';
    this.currentSpeechMode = mode;
    this.currentSpeechRate = rate;
    this.speechChunks = chunks;
    this.currentChunkIndex = Math.min(startIndex, chunks.length - 1);
    this.currentChunkCharOffset = 0;
    this.pausedChunkCharOffset = 0;

    this.updateSpeechControlsUI();
    this.playCurrentChunk();
  }

  playCurrentChunk() {
    if (!('speechSynthesis' in window)) return;
    if (this.speechState !== 'playing') return;

    if (this.currentChunkIndex >= this.speechChunks.length) {
      this.resetSpeechControls();
      return;
    }

    if (this.chunkTimeout) {
      clearTimeout(this.chunkTimeout);
      this.chunkTimeout = null;
    }

    window.speechSynthesis.cancel();

    const fullChunkText = this.speechChunks[this.currentChunkIndex];
    let textToSpeak = fullChunkText;

    if (this.pausedChunkCharOffset > 0 && this.pausedChunkCharOffset < fullChunkText.length) {
      // Resume from the exact character/word offset where it was paused
      textToSpeak = fullChunkText.slice(this.pausedChunkCharOffset).replace(/^[,;:.!?—\s]+/, '').trim();
      if (!textToSpeak) {
        this.currentChunkIndex++;
        this.pausedChunkCharOffset = 0;
        this.currentChunkCharOffset = 0;
        this.playCurrentChunk();
        return;
      }
    }

    // Reset boundary tracking for this utterance segment
    this.currentChunkCharOffset = 0;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'fr-FR';
    if (this.frenchVoice) {
      utterance.voice = this.frenchVoice;
    }
    utterance.rate = this.currentSpeechRate;
    utterance.pitch = 1.05;

    // Track word position boundary
    utterance.onboundary = (e) => {
      if (e && typeof e.charIndex === 'number') {
        this.currentChunkCharOffset = e.charIndex;
      }
    };

    utterance.onend = () => {
      if (this.speechState === 'playing') {
        this.currentChunkIndex++;
        this.pausedChunkCharOffset = 0;
        this.currentChunkCharOffset = 0;
        if (this.currentChunkIndex < this.speechChunks.length) {
          // Natural brief pause between sentences (250ms for normal, 450ms for slow)
          const pauseDuration = this.currentSpeechMode === 'slow' ? 450 : 250;
          this.chunkTimeout = setTimeout(() => {
            if (this.speechState === 'playing') {
              this.playCurrentChunk();
            }
          }, pauseDuration);
        } else {
          this.resetSpeechControls();
        }
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('Speech chunk error:', e);
        this.resetSpeechControls();
      }
    };

    this.currentUtterance = utterance;
    window._cm1_utterance = utterance;

    window.speechSynthesis.speak(utterance);
  }

  pauseReading() {
    if (!('speechSynthesis' in window)) return;
    if (this.speechState !== 'playing') return;

    this.speechState = 'paused';
    if (this.chunkTimeout) {
      clearTimeout(this.chunkTimeout);
      this.chunkTimeout = null;
    }

    // Accumulate the character offset where paused in the current chunk
    this.pausedChunkCharOffset = (this.pausedChunkCharOffset || 0) + (this.currentChunkCharOffset || 0);

    // Cancel current speech utterance immediately so sound halts without freeze
    window.speechSynthesis.cancel();
    this.updateSpeechControlsUI();
  }

  resumeReading() {
    if (!('speechSynthesis' in window)) return;
    if (this.speechState !== 'paused') return;

    this.speechState = 'playing';
    this.updateSpeechControlsUI();

    // Replay speech continuing from the paused chunk and char offset
    this.playCurrentChunk();
  }

  stopSpeech() {
    if (this.chunkTimeout) {
      clearTimeout(this.chunkTimeout);
      this.chunkTimeout = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.resetSpeechControls();
  }

  resetSpeechControls() {
    if (this.chunkTimeout) {
      clearTimeout(this.chunkTimeout);
      this.chunkTimeout = null;
    }
    this.speechState = 'idle';
    this.currentSpeechMode = null;
    this.speechChunks = [];
    this.currentChunkIndex = 0;
    this.currentChunkCharOffset = 0;
    this.pausedChunkCharOffset = 0;
    this.currentUtterance = null;
    this.updateSpeechControlsUI();
  }

  updateSpeechControlsUI() {
    const speakAllBtn = document.getElementById('speakAllBtn');
    const speakSlowBtn = document.getElementById('speakSlowBtn');
    const pauseSpeechBtn = document.getElementById('pauseSpeechBtn');
    const stopSpeechBtn = document.getElementById('stopSpeechBtn');

    // speakAllBtn always maintains standard text
    if (speakAllBtn) {
      speakAllBtn.innerHTML = '<span>🔊</span> Tout écouter';
      speakAllBtn.title = 'Écouter la lecture à voix haute';
      if (this.speechState === 'playing' && this.currentSpeechMode === 'normal') {
        speakAllBtn.classList.add('is-speaking');
        speakAllBtn.classList.remove('is-paused');
      } else if (this.speechState === 'paused' && this.currentSpeechMode === 'normal') {
        speakAllBtn.classList.add('is-paused');
        speakAllBtn.classList.remove('is-speaking');
      } else {
        speakAllBtn.classList.remove('is-speaking', 'is-paused');
      }
    }

    // speakSlowBtn always maintains standard text
    if (speakSlowBtn) {
      speakSlowBtn.innerHTML = '<span>🐌</span> Vitesse lente';
      speakSlowBtn.title = 'Lecture lente pour s\'entraîner à la dictée';
      if (this.speechState === 'playing' && this.currentSpeechMode === 'slow') {
        speakSlowBtn.classList.add('is-speaking');
        speakSlowBtn.classList.remove('is-paused');
      } else if (this.speechState === 'paused' && this.currentSpeechMode === 'slow') {
        speakSlowBtn.classList.add('is-paused');
        speakSlowBtn.classList.remove('is-speaking');
      } else {
        speakSlowBtn.classList.remove('is-speaking', 'is-paused');
      }
    }

    // pauseSpeechBtn is strictly the only button with Pause / Reprendre toggle
    if (pauseSpeechBtn) {
      if (this.speechState === 'playing') {
        pauseSpeechBtn.innerHTML = '<span>⏸️</span> Pause';
        pauseSpeechBtn.title = 'Mettre en pause la lecture';
        pauseSpeechBtn.disabled = false;
        pauseSpeechBtn.classList.add('is-speaking');
        pauseSpeechBtn.classList.remove('is-paused');
      } else if (this.speechState === 'paused') {
        pauseSpeechBtn.innerHTML = '<span>▶️</span> Reprendre';
        pauseSpeechBtn.title = 'Reprendre la lecture de la dictée';
        pauseSpeechBtn.disabled = false;
        pauseSpeechBtn.classList.add('is-paused');
        pauseSpeechBtn.classList.remove('is-speaking');
      } else {
        // Idle state
        pauseSpeechBtn.innerHTML = '<span>⏸️</span> Pause';
        pauseSpeechBtn.title = 'Mettre en pause ou reprendre la lecture';
        pauseSpeechBtn.disabled = true;
        pauseSpeechBtn.classList.remove('is-speaking', 'is-paused');
      }
    }

    // stopSpeechBtn
    if (stopSpeechBtn) {
      stopSpeechBtn.disabled = (this.speechState === 'idle');
    }
  }

  init() {
    this.renderDicteeSelector();
    this.renderDicteeView();
    this.setupEventListeners();
    this.updateStatsUI();
    this.renderConjugationModule();
    this.renderGrammarModule();
    this.renderMathModule();
    this.renderTrophiesModule();
    this.renderVariationsWorkshop();
  }

  getCurrentDictee() {
    return window.CM1_DATA.dictees.find(d => d.id === this.selectedDicteeId) || window.CM1_DATA.dictees[0];
  }

  getPriorWords() {
    // All words from previous dictées (Dictée 1 to N-1)
    const currentId = this.selectedDicteeId;
    const prior = [];
    window.CM1_DATA.dictees.forEach(d => {
      if (d.id < currentId) {
        d.words.forEach(w => {
          if (!prior.includes(w)) prior.push(w);
        });
      }
    });
    return prior;
  }

  renderDicteeSelector() {
    const selectEl = document.getElementById('dicteeSelect');
    const chipsWrapper = document.getElementById('dicteeChips');
    if (!selectEl || !chipsWrapper) return;

    selectEl.innerHTML = '';
    chipsWrapper.innerHTML = '';

    window.CM1_DATA.dictees.forEach(d => {
      // Dropdown option
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = `${d.title} : ${d.theme}`;
      if (d.id === this.selectedDicteeId) opt.selected = true;
      selectEl.appendChild(opt);

      // Carousel chip
      const chip = document.createElement('button');
      chip.className = `dictee-chip ${d.id === this.selectedDicteeId ? 'active' : ''}`;
      chip.innerHTML = `<span>${d.icon}</span> <span>${d.title}</span>`;
      chip.addEventListener('click', () => {
        this.selectDictee(d.id);
      });
      chipsWrapper.appendChild(chip);
    });

    selectEl.addEventListener('change', (e) => {
      this.selectDictee(parseInt(e.target.value, 10));
    });
  }

  selectDictee(id) {
    this.stopSpeech();
    this.selectedDicteeId = id;
    const selectEl = document.getElementById('dicteeSelect');
    if (selectEl) selectEl.value = id;

    // Update chips
    document.querySelectorAll('.dictee-chip').forEach((chip, idx) => {
      const dict = window.CM1_DATA.dictees[idx];
      if (dict && dict.id === id) {
        chip.classList.add('active');
        chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        chip.classList.remove('active');
      }
    });

    this.currentNotebookSentenceIndex = 0;
    this.renderDicteeView();
    this.renderVariationsWorkshop();
  }

  renderDicteeView() {
    const dictee = this.getCurrentDictee();
    const priorWords = this.getPriorWords();

    // 1. Update Hero Banner
    const iconEl = document.getElementById('bannerIcon');
    const titleEl = document.getElementById('bannerTitle');
    const badgeEl = document.getElementById('bannerBadge');
    const countEl = document.getElementById('bannerWordsCount');

    if (iconEl) iconEl.textContent = dictee.icon;
    if (titleEl) titleEl.textContent = `${dictee.title} : ${dictee.theme}`;
    if (badgeEl) badgeEl.textContent = dictee.badge;
    if (countEl) countEl.textContent = `${dictee.words.length} mots cibles`;

    // 2. Prior Vocabulary Alert Box
    const priorBox = document.getElementById('priorVocabBox');
    const priorCountEl = document.getElementById('priorCountText');
    const priorPillsList = document.getElementById('priorWordsPills');

    if (priorBox && priorCountEl && priorPillsList) {
      if (priorWords.length > 0) {
        priorBox.style.display = 'flex';
        priorCountEl.innerHTML = `<strong>Tu as déjà maîtrisé ${priorWords.length} mots</strong> des listes précédentes (Dictées 1 à ${dictee.id - 1}). Ces mots sont réinvestis naturellement dans les textes et exercices ci-dessous pour consolider ta mémoire !`;
        
        priorPillsList.innerHTML = priorWords.map(w => `<span class="prior-word-tag">${w}</span>`).join('');
      } else {
        priorBox.style.display = 'none';
      }
    }

    // 3. Render Words Cards Grid with interactive checkboxes, speech buttons, and variations drawer
    const wordsGrid = document.getElementById('wordsGrid');
    if (wordsGrid) {
      wordsGrid.innerHTML = '';
      dictee.words.forEach(word => {
        const isMastered = this.masteredWords.has(word);
        const card = document.createElement('div');
        card.className = `word-card ${isMastered ? 'mastered' : ''}`;

        // Check if word has variations in database
        const varInfo = window.CM1_DATA.variations ? window.CM1_DATA.variations[word.toLowerCase()] : null;
        let variationsHtml = '';

        if (varInfo) {
          const rows = [];
          if (varInfo.category) rows.push(`<div><strong>Nature :</strong> ${varInfo.category}</div>`);
          if (varInfo.femSing) rows.push(`<div class="var-item-row"><span><strong>Féminin :</strong> ${varInfo.femSing}</span><button class="var-item-speak" onclick="event.stopPropagation(); window.cm1App.speak('${varInfo.femSing}')">🔊</button></div>`);
          if (varInfo.mascPlur) rows.push(`<div class="var-item-row"><span><strong>Pluriel :</strong> ${varInfo.mascPlur}</span><button class="var-item-speak" onclick="event.stopPropagation(); window.cm1App.speak('${varInfo.mascPlur}')">🔊</button></div>`);
          if (varInfo.femPlur) rows.push(`<div class="var-item-row"><span><strong>Fém. pluriel :</strong> ${varInfo.femPlur}</span><button class="var-item-speak" onclick="event.stopPropagation(); window.cm1App.speak('${varInfo.femPlur}')">🔊</button></div>`);
          if (varInfo.imparfait) rows.push(`<div class="var-item-row"><span><strong>Imparfait :</strong> il ${varInfo.imparfait.il}</span><button class="var-item-speak" onclick="event.stopPropagation(); window.cm1App.speak('${varInfo.imparfait.il}')">🔊</button></div>`);
          if (varInfo.futur) rows.push(`<div class="var-item-row"><span><strong>Futur :</strong> il ${varInfo.futur.il}</span><button class="var-item-speak" onclick="event.stopPropagation(); window.cm1App.speak('${varInfo.futur.il}')">🔊</button></div>`);
          if (varInfo.note) rows.push(`<div style="font-size:0.75rem; color:#7e22ce;">💡 ${varInfo.note}</div>`);

          variationsHtml = `
            <button class="word-card-variations-btn" type="button" onclick="this.nextElementSibling.classList.toggle('open')">
              ✨ Voir les variations
            </button>
            <div class="word-card-variations-drawer">
              ${rows.join('')}
            </div>
          `;
        }

        card.innerHTML = `
          <div class="word-card-main-row">
            <div class="word-card-left">
              <input type="checkbox" class="word-checkbox" id="chk_${word.replace(/\s+/g, '_')}" ${isMastered ? 'checked' : ''} title="Marquer comme appris">
              <span class="word-text">${word}</span>
            </div>
            <button class="word-speak-btn" title="Écouter la prononciation" type="button">🔊</button>
          </div>
          ${variationsHtml}
        `;

        // Checkbox click
        const chk = card.querySelector('.word-checkbox');
        chk.addEventListener('change', (e) => {
          if (e.target.checked) {
            this.masteredWords.add(word);
            card.classList.add('mastered');
            this.addStars(1);
            this.sound.playSuccess();
          } else {
            this.masteredWords.delete(word);
            card.classList.remove('mastered');
          }
          this.saveMasteredWords();
        });

        // Speak button click
        const speakBtn = card.querySelector('.word-speak-btn');
        speakBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.speak(word);
        });

        wordsGrid.appendChild(card);
      });
    }

    // 4. Render Active Generator Content (Story / Sentences / Dynamic / Variations)
    this.renderGeneratedContent();

    // 5. Setup Game word for this dictée
    this.setupWordGame();
  }

  // Dynamic sentence builder using template structures
  generateDynamicSentences(dictee, priorWords) {
    const targets = [...dictee.words];
    const priors = priorWords.length > 0 ? [...priorWords] : ["histoire", "temps", "général", "roi"];

    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const sentences = [];
    const usedTargets = [...targets].sort(() => 0.5 - Math.random());

    for (let i = 0; i < 5; i++) {
      const w1 = usedTargets[i % usedTargets.length] || getRandom(targets);
      const w2 = usedTargets[(i + 5) % usedTargets.length] || getRandom(targets);
      const p1 = getRandom(priors);

      let sentence = "";
      switch (i) {
        case 0:
          sentence = `Le personnage principal s'efforce d'utiliser ce ${w1} pour surmonter le défi lié à ${p1}.`;
          break;
        case 1:
          sentence = `Dans cette époque fascinante, on remarque que ${w1} joue un rôle majeur auprès de chaque ${w2}.`;
          break;
        case 2:
          sentence = `Après de longues recherches, le savant parvient à comprendre ${w1} grâce aux leçons du passé.`;
          break;
        case 3:
          sentence = `Pour assurer la réussite de l'expédition, il est indispensable de maîtriser ${w1} et ${w2}.`;
          break;
        default:
          sentence = `Les récits de l'époque témoignent de la grandeur de ${w1}, admirée par tous les spécialistes.`;
          break;
      }
      sentences.push(sentence);
    }

    return sentences;
  }

  // Get variation sentences for the current dictée
  getVariationSentences() {
    const dictee = this.getCurrentDictee();
    if (window.CM1_DATA.variationSentences && window.CM1_DATA.variationSentences[dictee.id]) {
      return window.CM1_DATA.variationSentences[dictee.id];
    }
    // Fallback: build default variation items
    return dictee.sentences.map((s, idx) => ({
      sentence: s,
      targetBase: dictee.words[idx % dictee.words.length],
      variation: dictee.words[idx % dictee.words.length],
      type: "Forme usuelle",
      hint: dictee.words[idx % dictee.words.length]
    }));
  }

  renderGeneratedContent() {
    this.stopSpeech();
    const dictee = this.getCurrentDictee();
    const priorWords = this.getPriorWords();

    // Helper to highlight words, recognizing both base forms AND all grammatical variations!
    const highlightText = (text) => {
      // Split into tokens preserving delimiters
      const tokens = text.split(/([\s,.;:!?'"«»()\[\]\-]+)/);

      return tokens.map(token => {
        const clean = token.toLowerCase().trim();
        if (!clean) return token;

        // Check if exact target word
        const exactTarget = dictee.words.find(w => w.toLowerCase() === clean);
        if (exactTarget) {
          return `<span class="badge-target-word" onclick="window.cm1App.speak('${token.replace(/'/g, "\\'")}')" title="Mot cible de la ${dictee.title} (clique pour écouter)">${token}</span>`;
        }

        // Check if reverse variation of target word
        if (window.CM1_DATA.reverseIndex && window.CM1_DATA.reverseIndex[clean]) {
          const rev = window.CM1_DATA.reverseIndex[clean];
          const isTargetBase = dictee.words.find(w => w.toLowerCase() === rev.baseWord.toLowerCase());
          if (isTargetBase) {
            return `<span class="badge-target-word badge-variation" onclick="window.cm1App.speak('${token.replace(/'/g, "\\'")}')" title="Variation de '${rev.baseWord}' (${rev.type}) - clique pour écouter">${token} <small class="var-tag">var.</small></span>`;
          }
          if (this.includePriorVocab && priorWords.some(w => w.toLowerCase() === rev.baseWord.toLowerCase())) {
            return `<span class="badge-prior-word badge-variation" onclick="window.cm1App.speak('${token.replace(/'/g, "\\'")}')" title="Mot révisé varié de '${rev.baseWord}' (${rev.type}) - clique pour écouter">${token} <small class="var-tag">révisé</small></span>`;
          }
        }

        // Check if exact prior word
        if (this.includePriorVocab && priorWords.some(w => w.toLowerCase() === clean)) {
          return `<span class="badge-prior-word" onclick="window.cm1App.speak('${token.replace(/'/g, "\\'")}')" title="Mot révisé d'une dictée précédente (clique pour écouter)">${token}</span>`;
        }

        return token;
      }).join('');
    };

    // 1. Discovery View
    const discoveryBox = document.getElementById('discoveryTextContainer');
    if (discoveryBox) {
      if (this.generationMode === 'story') {
        discoveryBox.innerHTML = `
          <div class="generated-story-box">
            <div class="story-header-title">
              <span>📖</span>
              <span>Récit Thématique CM1 : ${dictee.theme}</span>
            </div>
            <p>${highlightText(dictee.story)}</p>
          </div>
        `;
      } else if (this.generationMode === 'sentences') {
        const listHtml = dictee.sentences.map((sentence, idx) => `
          <div class="sentence-card">
            <div class="sentence-number">${idx + 1}</div>
            <div class="sentence-text-wrapper">${highlightText(sentence)}</div>
            <button class="sentence-audio-btn" type="button" onclick="window.cm1App.speak('${sentence.replace(/'/g, "\\'")}')">🔊</button>
          </div>
        `).join('');
        discoveryBox.innerHTML = `<div class="sentences-list">${listHtml}</div>`;
      } else if (this.generationMode === 'variations') {
        // Dedicated Grammatical Variations Mode
        const varList = this.getVariationSentences();
        const listHtml = varList.map((item, idx) => `
          <div class="sentence-card">
            <div class="sentence-number" style="background:#fae8ff; color:#86198f;">${idx + 1}</div>
            <div class="sentence-text-wrapper">
              <div>${highlightText(item.sentence)}</div>
              <div style="margin-top:4px; font-size:0.8rem; font-weight:700; color:#c026d3;">
                🎯 Trait grammatical : <em>${item.type}</em> (mot de base : <strong>${item.targetBase}</strong>)
              </div>
            </div>
            <button class="sentence-audio-btn" style="border-color:#f0abfc; color:#a21caf;" type="button" onclick="window.cm1App.speak('${item.sentence.replace(/'/g, "\\'")}')">🔊</button>
          </div>
        `).join('');

        discoveryBox.innerHTML = `
          <div class="story-header-title" style="margin-bottom: 14px; color:#86198f;">
            <span>✨</span>
            <span>Phrases d'entraînement aux Variations (Genre, Nombre & Conjugaisons)</span>
          </div>
          <div class="sentences-list">${listHtml}</div>
        `;
      } else {
        // Dynamic mode
        const dynamicSentences = this.generateDynamicSentences(dictee, priorWords);
        const listHtml = dynamicSentences.map((sentence, idx) => `
          <div class="sentence-card">
            <div class="sentence-number">${idx + 1}</div>
            <div class="sentence-text-wrapper">${highlightText(sentence)}</div>
            <button class="sentence-audio-btn" type="button" onclick="window.cm1App.speak('${sentence.replace(/'/g, "\\'")}')">🔊</button>
          </div>
        `).join('');
        discoveryBox.innerHTML = `
          <div class="story-header-title" style="margin-bottom: 14px;">
            <span>🎲</span>
            <span>Phrases Dynamiques Combinées (Mots cibles + Vocabulaire révisé)</span>
          </div>
          <div class="sentences-list">${listHtml}</div>
        `;
      }
    }

    // 2. Cloze (Fill-in-the-blanks) View
    this.renderClozeExercise();

    // 3. Seyès Notebook Dictation View
    this.renderNotebookDictation();
  }

  // Mode 2: Fill-in-the-blanks with grammatical variations support
  renderClozeExercise() {
    const clozeContainer = document.getElementById('clozeExerciseContainer');
    const feedbackBar = document.getElementById('clozeFeedbackBar');
    if (!clozeContainer) return;

    if (feedbackBar) {
      feedbackBar.className = 'cloze-feedback-bar';
      feedbackBar.style.display = 'none';
    }

    const dictee = this.getCurrentDictee();
    clozeContainer.innerHTML = '';
    let blankIndex = 0;

    if (this.generationMode === 'variations') {
      // In variations mode, blank out the variation words specifically!
      const varList = this.getVariationSentences();
      varList.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cloze-sentence-row';

        const escapedVar = item.variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b(${escapedVar})\\b`, 'i');

        let sentenceHtml = item.sentence;
        if (regex.test(sentenceHtml)) {
          sentenceHtml = sentenceHtml.replace(regex, (match) => {
            const id = `cloze_${blankIndex++}`;
            return `<input type="text" class="cloze-input" id="${id}" data-answer="${match}" data-base="${item.targetBase}" data-hint="${item.hint}" placeholder="(${item.hint})" autocomplete="off" spellcheck="false">`;
          });
        }
        row.innerHTML = sentenceHtml;
        clozeContainer.appendChild(row);
      });
    } else {
      const sourceSentences = this.generationMode === 'sentences' ? dictee.sentences : [dictee.story];
      sourceSentences.forEach((sentence) => {
        const row = document.createElement('div');
        row.className = 'cloze-sentence-row';

        let processedSentence = sentence;
        dictee.words.forEach(targetWord => {
          const regex = new RegExp(`\\b(${targetWord})\\b`, 'gi');
          if (regex.test(processedSentence)) {
            processedSentence = processedSentence.replace(regex, (match) => {
              const id = `cloze_${blankIndex++}`;
              return `<input type="text" class="cloze-input" id="${id}" data-answer="${match}" data-base="${match}" data-hint="${match.length} lettres" placeholder="(${match.length} lettres)" autocomplete="off" spellcheck="false">`;
            });
          }
        });

        row.innerHTML = processedSentence;
        clozeContainer.appendChild(row);
      });
    }

    // Handle enter key in inputs
    clozeContainer.querySelectorAll('.cloze-input').forEach((input, index, allInputs) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (allInputs[index + 1]) {
            allInputs[index + 1].focus();
          } else {
            this.verifyClozeAnswers();
          }
        }
      });
    });
  }

  verifyClozeAnswers() {
    const inputs = document.querySelectorAll('.cloze-input');
    const feedbackBar = document.getElementById('clozeFeedbackBar');
    if (!inputs.length) return;

    let correctCount = 0;
    let accentMistakes = 0;
    let baseFormMistakes = 0;

    const normalizeString = (str) => str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    inputs.forEach(input => {
      const expected = input.getAttribute('data-answer').trim();
      const baseWord = (input.getAttribute('data-base') || '').trim();
      const userValue = input.value.trim();

      if (userValue.toLowerCase() === expected.toLowerCase()) {
        input.className = 'cloze-input correct';
        input.title = "Bravo ! Bonne orthographe.";
        correctCount++;
      } else if (baseWord && userValue.toLowerCase() === baseWord.toLowerCase() && userValue.toLowerCase() !== expected.toLowerCase()) {
        // Student entered base word instead of inflected form!
        input.className = 'cloze-input wrong';
        input.title = `Attention à l'accord ! Tu as écrit la forme de base "${baseWord}". Il fallait accorder : "${expected}"`;
        baseFormMistakes++;
      } else if (normalizeString(userValue) === normalizeString(expected)) {
        // Accent missing
        input.className = 'cloze-input wrong';
        input.title = `Attention à l'accent ! Tu as écrit "${userValue}", la bonne orthographe est "${expected}"`;
        accentMistakes++;
      } else {
        input.className = 'cloze-input wrong';
        input.title = `Réponse attendue : "${expected}"`;
      }
    });

    const total = inputs.length;
    const isPerfect = correctCount === total;

    if (feedbackBar) {
      feedbackBar.style.display = 'flex';
      if (isPerfect) {
        feedbackBar.className = 'cloze-feedback-bar perfect';
        feedbackBar.innerHTML = `
          <div>
            <strong>🎉 Félicitations ! Score parfait : ${correctCount} / ${total} !</strong>
            <p>Tu as maîtrisé les accords, le genre, le nombre et l'orthographe sans aucune faute. Super travail !</p>
          </div>
          <button class="btn-primary" onclick="window.cm1App.renderClozeExercise()">Recommencer 🔄</button>
        `;
        this.sound.playFanfare();
        this.confetti.burst(80);
        this.addStars(10);
      } else {
        feedbackBar.className = 'cloze-feedback-bar partial';
        let tipParts = [];
        if (accentMistakes > 0) tipParts.push(`${accentMistakes} oubli(s) d'accent`);
        if (baseFormMistakes > 0) tipParts.push(`${baseFormMistakes} oubli(s) d'accord/conjugaison (forme de base utilisée)`);
        let tip = tipParts.length > 0 ? ` (${tipParts.join(', ')})` : '';

        feedbackBar.innerHTML = `
          <div>
            <strong>💪 Bon effort : ${correctCount} / ${total} mots corrects${tip} !</strong>
            <p>Survole les cases rouges avec la souris pour lire les conseils d'accord et corriger tes erreurs.</p>
          </div>
          <button class="btn-secondary" onclick="window.cm1App.renderClozeExercise()">Réessayer 🔄</button>
        `;
        this.sound.playWrong();
        this.addStars(Math.max(1, correctCount));
      }
    }
  }

  // Mode 3: French Seyès Ruled Notebook Dictation Pad
  renderNotebookDictation() {
    const dictee = this.getCurrentDictee();
    const sentences = this.generationMode === 'variations' 
      ? this.getVariationSentences().map(item => item.sentence)
      : dictee.sentences;

    const currentSentence = sentences[this.currentNotebookSentenceIndex] || sentences[0];

    const labelEl = document.getElementById('notebookStepLabel');
    const textareaEl = document.getElementById('seyesTextarea');
    const diffEl = document.getElementById('dictationDiffResult');

    if (labelEl) {
      labelEl.textContent = `Phrase ${this.currentNotebookSentenceIndex + 1} sur ${sentences.length}`;
    }
    if (textareaEl) {
      textareaEl.value = '';
    }
    if (diffEl) {
      diffEl.style.display = 'none';
      diffEl.innerHTML = '';
    }
  }

  playCurrentNotebookSentence(slow = false) {
    const dictee = this.getCurrentDictee();
    const sentences = this.generationMode === 'variations' 
      ? this.getVariationSentences().map(item => item.sentence)
      : dictee.sentences;

    const sentence = sentences[this.currentNotebookSentenceIndex] || sentences[0];
    this.speak(sentence, slow ? 0.5 : 0.95);
  }

  verifyNotebookDictation() {
    const dictee = this.getCurrentDictee();
    const sentences = this.generationMode === 'variations' 
      ? this.getVariationSentences().map(item => item.sentence)
      : dictee.sentences;

    const targetSentence = sentences[this.currentNotebookSentenceIndex] || sentences[0];
    const textareaEl = document.getElementById('seyesTextarea');
    const diffEl = document.getElementById('dictationDiffResult');
    if (!textareaEl || !diffEl) return;

    const userText = textareaEl.value.trim();
    if (!userText) {
      alert("Écris d'abord la phrase dans le cahier avant de cliquer sur 'Vérifier' !");
      return;
    }

    // Word by word diff
    const cleanWord = (w) => w.replace(/[.,!?;:«»"']/g, '').trim().toLowerCase();
    const targetWords = targetSentence.split(/\s+/);
    const userWords = userText.split(/\s+/);

    let mistakes = 0;
    const diffHtml = targetWords.map((tWord, idx) => {
      const uWord = userWords[idx] || '';
      if (cleanWord(uWord) === cleanWord(tWord)) {
        return `<span class="diff-word-correct">${tWord}</span>`;
      } else {
        mistakes++;
        return `<span class="diff-word-wrong">${uWord || '...'}</span><span class="diff-word-expected">${tWord}</span>`;
      }
    }).join(' ');

    diffEl.style.display = 'block';
    if (mistakes === 0) {
      diffEl.innerHTML = `
        <div style="color: #059669; font-weight: 800; font-size: 1.15rem; margin-bottom: 8px;">
          ⭐ Bravo ! Dictée impeccable, aucun mot erroné !
        </div>
        <p style="font-size: 1.1rem; line-height: 1.8;">${diffHtml}</p>
        <div style="margin-top: 14px;">
          <button class="btn-primary" onclick="window.cm1App.nextNotebookSentence()">Phrase suivante ➔</button>
        </div>
      `;
      this.sound.playFanfare();
      this.confetti.burst(60);
      this.addStars(8);
    } else {
      diffEl.innerHTML = `
        <div style="color: #b91c1c; font-weight: 800; font-size: 1.1rem; margin-bottom: 8px;">
          ✏️ Correction détaillée (${mistakes} différence(s)) :
        </div>
        <p style="font-size: 1.15rem; line-height: 2;">${diffHtml}</p>
        <div style="margin-top: 14px; display: flex; gap: 10px;">
          <button class="btn-secondary" onclick="window.cm1App.renderNotebookDictation()">Réécrire 🔄</button>
          <button class="btn-primary" onclick="window.cm1App.nextNotebookSentence()">Phrase suivante ➔</button>
        </div>
      `;
      this.sound.playWrong();
      this.addStars(2);
    }
  }

  nextNotebookSentence() {
    const dictee = this.getCurrentDictee();
    const sentences = this.generationMode === 'variations' 
      ? this.getVariationSentences().map(item => item.sentence)
      : dictee.sentences;

    if (this.currentNotebookSentenceIndex < sentences.length - 1) {
      this.currentNotebookSentenceIndex++;
    } else {
      this.currentNotebookSentenceIndex = 0;
      alert("Tu as terminé toutes les phrases de cette dictée ! Excellent travail d'écriture !");
    }
    this.renderNotebookDictation();
    this.playCurrentNotebookSentence();
  }

  // Mode 4: Word Puzzle Game (Anagramme / Mot Mystère)
  setupWordGame() {
    const dictee = this.getCurrentDictee();
    const suitableWords = dictee.words.filter(w => w.length >= 5 && !w.includes(' '));
    const word = suitableWords[Math.floor(Math.random() * suitableWords.length)] || dictee.words[0];
    this.currentGameWord = word;

    const letters = word.split('').sort(() => 0.5 - Math.random());
    this.scrambledLetters = letters;

    const lettersBox = document.getElementById('scrambledLettersBox');
    const inputEl = document.getElementById('gameInput');
    const hintEl = document.getElementById('gameHint');

    if (lettersBox) {
      lettersBox.innerHTML = letters.map((l, idx) => `
        <div class="letter-tile" onclick="window.cm1App.clickGameLetter('${l}', ${idx})">${l}</div>
      `).join('');
    }
    if (inputEl) {
      inputEl.value = '';
      inputEl.focus();
    }
    if (hintEl) {
      hintEl.textContent = `Indice : mot de ${word.length} lettres de la ${dictee.title}`;
    }
  }

  clickGameLetter(letter) {
    const inputEl = document.getElementById('gameInput');
    if (inputEl) {
      inputEl.value += letter;
    }
  }

  verifyGameWord() {
    const inputEl = document.getElementById('gameInput');
    if (!inputEl) return;

    const answer = inputEl.value.trim().toLowerCase();
    const target = this.currentGameWord.trim().toLowerCase();

    if (answer === target) {
      this.sound.playFanfare();
      this.confetti.burst(60);
      this.addStars(5);
      alert(`🎉 Bravo ! Le mot mystère était bien "${this.currentGameWord}" !`);
      this.setupWordGame();
    } else {
      this.sound.playWrong();
      alert(`Presque ! Essaie encore ou clique sur "Nouveau mot".`);
    }
  }

  // Mode 5: Grammatical Variations Workshop (Atelier des Variations)
  renderVariationsWorkshop() {
    const container = document.getElementById('workshopDrillsGrid');
    if (!container) return;

    const dictee = this.getCurrentDictee();
    const words = dictee.words;

    // Build 3 customized drills based on the current dictée words
    const drills = [];

    // Drill 1: Féminin
    const adjOrNoun = words.find(w => {
      const info = window.CM1_DATA.variations ? window.CM1_DATA.variations[w.toLowerCase()] : null;
      return info && info.femSing;
    }) || "puissant";
    const info1 = window.CM1_DATA.variations[adjOrNoun.toLowerCase()] || { femSing: adjOrNoun + "e" };

    drills.push({
      id: "drill-fem",
      typeClass: "genre",
      typeLabel: "Féminin",
      title: "Passer au féminin",
      prompt: `Mets au féminin : "un souverain ${adjOrNoun}" ➔ "une reine <strong>${adjOrNoun}</strong>"`,
      expected: info1.femSing.trim().toLowerCase(),
      placeholder: "Écris la forme féminine...",
      tip: `Pense à la règle du féminin pour "${adjOrNoun}"`
    });

    // Drill 2: Pluriel
    const pluralWord = words.find(w => {
      const info = window.CM1_DATA.variations ? window.CM1_DATA.variations[w.toLowerCase()] : null;
      return info && info.mascPlur && info.mascPlur !== w;
    }) || words[2] || "accord";
    const info2 = window.CM1_DATA.variations[pluralWord.toLowerCase()] || { mascPlur: pluralWord + "s" };

    drills.push({
      id: "drill-plur",
      typeClass: "nombre",
      typeLabel: "Pluriel",
      title: "Accord en nombre",
      prompt: `Mets au pluriel : "un ${pluralWord}" ➔ "des <strong>${pluralWord}</strong>"`,
      expected: info2.mascPlur.trim().toLowerCase(),
      placeholder: "Écris au pluriel...",
      tip: `Attention à la marque du pluriel (-s ou -x) pour "${pluralWord}"`
    });

    // Drill 3: Conjugaison CM1
    const verbWord = words.find(w => {
      const info = window.CM1_DATA.variations ? window.CM1_DATA.variations[w.toLowerCase()] : null;
      return info && info.category === "verbe";
    }) || "régner";
    const info3 = window.CM1_DATA.variations[verbWord.toLowerCase()] || {
      imparfait: { il: verbWord.replace(/er$/, "ait") }
    };
    const expectedVerb = info3.imparfait ? info3.imparfait.il : (verbWord.replace(/er$/, "ait"));

    drills.push({
      id: "drill-conj",
      typeClass: "conjugaison",
      typeLabel: "Conjugaison CM1",
      title: "Conjuguer à l'Imparfait",
      prompt: `Conjugue à l'imparfait avec "il" : "${verbWord}" ➔ "Autrefois, il <strong>${verbWord}</strong> avec sagesse."`,
      expected: expectedVerb.trim().toLowerCase(),
      placeholder: "Forme conjuguée...",
      tip: `Terminaison de l'imparfait à la 3e personne du singulier : -ait`
    });

    container.innerHTML = drills.map(d => `
      <div class="drill-card" id="${d.id}">
        <div>
          <div class="drill-header">
            <span class="drill-badge ${d.typeClass}">${d.typeLabel}</span>
            <h4>${d.title}</h4>
          </div>
          <div class="drill-prompt" style="margin-top:10px;">
            ${d.prompt}
          </div>
        </div>
        <div>
          <div class="drill-input-row">
            <input type="text" class="drill-input" data-expected="${d.expected}" placeholder="${d.placeholder}" autocomplete="off">
            <button class="btn-primary" type="button" onclick="window.cm1App.verifyDrill(this)">Valider</button>
          </div>
          <div class="drill-feedback"></div>
        </div>
      </div>
    `).join('');
  }

  verifyDrill(btn) {
    const card = btn.closest('.drill-card');
    if (!card) return;

    const input = card.querySelector('.drill-input');
    const feedback = card.querySelector('.drill-feedback');
    const expected = input.getAttribute('data-expected').trim().toLowerCase();
    const answer = input.value.trim().toLowerCase();

    if (answer === expected) {
      input.className = "drill-input correct";
      feedback.className = "drill-feedback show success";
      feedback.textContent = `🎉 Excellent ! La bonne réponse est bien "${expected}".`;
      this.sound.playSuccess();
      this.addStars(4);
    } else {
      input.className = "drill-input wrong";
      feedback.className = "drill-feedback show error";
      feedback.textContent = `Presque ! Réponse attendue : "${expected}". Réessaie !`;
      this.sound.playWrong();
    }
  }

  // Conjugation Module
  renderConjugationModule() {
    const container = document.getElementById('conjugationModuleContainer');
    if (!container) return;

    container.innerHTML = window.CM1_DATA.conjugationLessons.map((lesson) => `
      <div class="module-card">
        <div>
          <div class="module-card-header">
            <div class="module-icon">🖋️</div>
            <div>
              <h3>${lesson.title}</h3>
              <p>${lesson.desc}</p>
            </div>
          </div>
          <div class="quiz-prompt" style="font-size: 1.05rem; margin-bottom: 12px;">
            ${lesson.questions[0].prompt}
          </div>
          <div class="quiz-options-grid">
            ${lesson.questions[0].options.map(opt => `
              <button class="quiz-option-btn" onclick="window.cm1App.answerQuiz(this, '${opt}', '${lesson.questions[0].answer}')">${opt}</button>
            `).join('')}
          </div>
        </div>
        <div style="font-size: 0.85rem; color: #64748b; font-weight: 700;">
          Temps CM1 : ${lesson.tense}
        </div>
      </div>
    `).join('');
  }

  // Grammar Module
  renderGrammarModule() {
    const container = document.getElementById('grammarModuleContainer');
    if (!container) return;

    container.innerHTML = window.CM1_DATA.grammarLessons.map((lesson) => `
      <div class="module-card">
        <div>
          <div class="module-card-header">
            <div class="module-icon">📚</div>
            <div>
              <h3>${lesson.title}</h3>
              <p>${lesson.desc}</p>
            </div>
          </div>
          <div class="quiz-prompt" style="font-size: 1.05rem; margin-bottom: 12px;">
            ${lesson.questions[0].prompt}
          </div>
          <div class="quiz-options-grid">
            ${lesson.questions[0].options.map(opt => `
              <button class="quiz-option-btn" onclick="window.cm1App.answerQuiz(this, '${opt}', '${lesson.questions[0].answer}')">${opt}</button>
            `).join('')}
          </div>
        </div>
      </div>
    `).join('');
  }

  answerQuiz(btn, chosen, correct) {
    const parentGrid = btn.closest('.quiz-options-grid');
    if (!parentGrid) return;

    const allBtns = parentGrid.querySelectorAll('.quiz-option-btn');
    allBtns.forEach(b => b.disabled = true);

    if (chosen === correct) {
      btn.className = 'quiz-option-btn correct';
      this.sound.playSuccess();
      this.addStars(4);
    } else {
      btn.className = 'quiz-option-btn wrong';
      allBtns.forEach(b => {
        if (b.textContent.trim() === correct.trim()) {
          b.className = 'quiz-option-btn correct';
        }
      });
      this.sound.playWrong();
    }
  }

  // Mental Math Module
  renderMathModule() {
    const container = document.getElementById('mathModuleContainer');
    if (!container) return;

    const math = window.CM1_DATA.mathLessons[0];
    const drill = math.drills[Math.floor(Math.random() * math.drills.length)];

    container.innerHTML = `
      <div class="math-sprint-card">
        <div class="math-timer-bar">
          <span>⚡ Calcul Mental CM1</span>
          <span style="color: #c2410c;">Défi Express</span>
        </div>
        <p style="color: #64748b; font-weight: 700;">Calcule le résultat le plus vite possible :</p>
        <div class="math-equation-display">${drill.q} ?</div>
        <div class="quiz-options-grid">
          ${drill.choices.map(c => `
            <button class="quiz-option-btn" onclick="window.cm1App.answerMath(this, ${c}, ${drill.a})">${c}</button>
          `).join('')}
        </div>
        <button class="btn-secondary" style="margin: 16px auto 0;" onclick="window.cm1App.renderMathModule()">Autre calcul 🔄</button>
      </div>
    `;
  }

  answerMath(btn, chosen, correct) {
    const parentGrid = btn.closest('.quiz-options-grid');
    if (!parentGrid) return;

    const allBtns = parentGrid.querySelectorAll('.quiz-option-btn');
    allBtns.forEach(b => b.disabled = true);

    if (chosen === correct) {
      btn.className = 'quiz-option-btn correct';
      this.sound.playFanfare();
      this.addStars(3);
      setTimeout(() => this.renderMathModule(), 1200);
    } else {
      btn.className = 'quiz-option-btn wrong';
      allBtns.forEach(b => {
        if (parseInt(b.textContent.trim(), 10) === correct) {
          b.className = 'quiz-option-btn correct';
        }
      });
      this.sound.playWrong();
    }
  }

  // Trophies Module
  renderTrophiesModule() {
    const container = document.getElementById('trophiesContainer');
    if (!container) return;

    const trophies = [
      { id: 't1', icon: '🌟', title: 'Premier Pas de CM1', desc: 'Avoir complété le premier exercice', reqStars: 10 },
      { id: 't2', icon: '⚔️', title: 'Héros d\'Alésia', desc: 'Maîtriser les mots de la Dictée 1', reqStars: 30 },
      { id: 't3', icon: '👑', title: 'Roi des Mérovingiens', desc: 'Réussir les Dictées 1 et 2', reqStars: 60 },
      { id: 't4', icon: '🏰', title: 'Mécène d\'Aquitaine', desc: 'Réinvestir le vocabulaire précédent', reqStars: 90 },
      { id: 't5', icon: '☀️', title: 'Soleil de Versailles', desc: 'Atteindre plus de 120 étoiles', reqStars: 120 },
      { id: 't6', icon: '🔭', title: 'Astronome de Galilée', desc: 'Devenir un champion de l\'orthographe', reqStars: 200 }
    ];

    container.innerHTML = trophies.map(t => {
      const isUnlocked = this.userStats.stars >= t.reqStars;
      return `
        <div class="trophy-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="trophy-icon">${t.icon}</div>
          <div class="trophy-details">
            <h4>${t.title}</h4>
            <p>${t.desc}</p>
            <div style="font-size: 0.78rem; font-weight: 800; color: ${isUnlocked ? '#059669' : '#94a3b8'}; margin-top: 4px;">
              ${isUnlocked ? '✓ Débloqué !' : `Nécessite ${t.reqStars} ⭐`}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  addStars(count) {
    this.userStats.stars += count;
    this.userStats.completedExercises++;
    this.saveStats();
    this.renderTrophiesModule();
  }

  updateStatsUI() {
    const starsEl = document.getElementById('userStars');
    const streakEl = document.getElementById('userStreak');
    const levelEl = document.getElementById('userLevel');

    if (starsEl) starsEl.textContent = this.userStats.stars;
    if (streakEl) streakEl.textContent = `${this.userStats.streak} j`;

    let levelTitle = "Apprenti";
    if (this.userStats.stars >= 150) levelTitle = "Grand Savant";
    else if (this.userStats.stars >= 100) levelTitle = "Maître Scribe";
    else if (this.userStats.stars >= 50) levelTitle = "Explorateur";

    if (levelEl) levelEl.textContent = levelTitle;
  }

  setupEventListeners() {
    // 1. Navigation Tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        const section = document.getElementById(targetId);
        if (section) section.classList.add('active');
      });
    });

    // 2. Practice Sub-Tabs
    document.querySelectorAll('.subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.practice-view').forEach(v => v.classList.remove('active'));

        btn.classList.add('active');
        const targetViewId = btn.getAttribute('data-view');
        const view = document.getElementById(targetViewId);
        if (view) view.classList.add('active');

        if (targetViewId === 'viewVariations') {
          this.renderVariationsWorkshop();
        }
      });
    });

    // 3. Generator Mode Switches (Récit / Phrases / Dynamique / Variations)
    document.querySelectorAll('.mode-switch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-switch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.generationMode = btn.getAttribute('data-mode');
        this.renderGeneratedContent();
      });
    });

    // 4. Prior Vocabulary Toggle Checkbox
    const priorToggle = document.getElementById('priorVocabToggle');
    if (priorToggle) {
      priorToggle.addEventListener('change', (e) => {
        this.includePriorVocab = e.target.checked;
        this.renderGeneratedContent();
      });
    }

    // 5. Variations Toggle Checkbox
    const varToggle = document.getElementById('variationsToggle');
    if (varToggle) {
      varToggle.addEventListener('change', (e) => {
        this.includeVariations = e.target.checked;
        this.renderGeneratedContent();
      });
    }

    // Expand prior words pill list on click
    const priorBox = document.getElementById('priorVocabBox');
    const pillsList = document.getElementById('priorWordsPills');
    if (priorBox && pillsList) {
      priorBox.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
          pillsList.classList.toggle('open');
        }
      });
    }

    // 6. Sound Mute / Unmute Button
    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.sound.enabled = !this.sound.enabled;
        soundBtn.innerHTML = this.sound.enabled ? '🔊 Son Actif' : '🔇 Muet';
      });
    }

    // 7. Action Bar Buttons
    const generateBtn = document.getElementById('generateNewTextBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        if (this.generationMode !== 'variations' && this.generationMode !== 'dynamic') {
          this.generationMode = 'dynamic';
          document.querySelectorAll('.mode-switch-btn').forEach(b => {
            if (b.getAttribute('data-mode') === 'dynamic') b.classList.add('active');
            else b.classList.remove('active');
          });
        }
        this.renderGeneratedContent();
        this.sound.playSuccess();
      });
    }

    const speakAllBtn = document.getElementById('speakAllBtn');
    if (speakAllBtn) {
      speakAllBtn.addEventListener('click', () => {
        const chunks = this.getCurrentDicteeTextChunks();
        this.startReading(chunks, 0.9, 'normal');
      });
    }

    const speakSlowBtn = document.getElementById('speakSlowBtn');
    if (speakSlowBtn) {
      speakSlowBtn.addEventListener('click', () => {
        const chunks = this.getCurrentDicteeTextChunks();
        this.startReading(chunks, 0.5, 'slow');
      });
    }

    const pauseSpeechBtn = document.getElementById('pauseSpeechBtn');
    if (pauseSpeechBtn) {
      pauseSpeechBtn.addEventListener('click', () => {
        if (this.speechState === 'playing') {
          this.pauseReading();
        } else if (this.speechState === 'paused') {
          this.resumeReading();
        }
      });
    }

    const stopSpeechBtn = document.getElementById('stopSpeechBtn');
    if (stopSpeechBtn) {
      stopSpeechBtn.addEventListener('click', () => {
        this.stopSpeech();
      });
    }

    const printBtn = document.getElementById('printWorksheetBtn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // 8. Cloze Validation Button
    const verifyClozeBtn = document.getElementById('verifyClozeBtn');
    if (verifyClozeBtn) {
      verifyClozeBtn.addEventListener('click', () => {
        this.verifyClozeAnswers();
      });
    }

    // 9. Seyès Notebook Buttons
    const playNotebookAudioBtn = document.getElementById('playNotebookAudioBtn');
    if (playNotebookAudioBtn) {
      playNotebookAudioBtn.addEventListener('click', () => {
        this.playCurrentNotebookSentence(false);
      });
    }

    const playNotebookSlowBtn = document.getElementById('playNotebookSlowBtn');
    if (playNotebookSlowBtn) {
      playNotebookSlowBtn.addEventListener('click', () => {
        this.playCurrentNotebookSentence(true);
      });
    }

    const verifyNotebookBtn = document.getElementById('verifyNotebookBtn');
    if (verifyNotebookBtn) {
      verifyNotebookBtn.addEventListener('click', () => {
        this.verifyNotebookDictation();
      });
    }

    // 10. Game Input Enter Key
    const gameInput = document.getElementById('gameInput');
    if (gameInput) {
      gameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.verifyGameWord();
        }
      });
    }
  }
}

// Instantiate and initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.cm1App = new CM1App();
  window.cm1App.init();
});

window.addEventListener('beforeunload', () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
});
