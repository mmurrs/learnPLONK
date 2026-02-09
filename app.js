// ===== Learn PLONK - Interactive App =====

(function () {
  'use strict';

  const TOTAL_MODULES = 8; // modules 0-7
  const STORAGE_KEY = 'learnplonk_progress';

  // --- State ---
  let state = loadState();

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return {
      completedModules: [],
      quizAnswers: {},
      implChecks: []
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  // --- Progress ---
  function updateProgress() {
    const pct = Math.round((state.completedModules.length / TOTAL_MODULES) * 100);
    const fill = document.getElementById('globalProgress');
    const text = document.getElementById('globalProgressText');
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = pct + '% complete';

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      const mod = parseInt(link.dataset.module, 10);
      if (state.completedModules.includes(mod)) {
        link.classList.add('completed');
      } else {
        link.classList.remove('completed');
      }
    });

    // Update buttons
    document.querySelectorAll('.btn-complete').forEach(btn => {
      const mod = parseInt(btn.dataset.module, 10);
      if (state.completedModules.includes(mod)) {
        btn.classList.add('completed');
        btn.textContent = 'Completed';
      }
    });
  }

  // --- Module Completion ---
  function initModuleButtons() {
    document.querySelectorAll('.btn-complete').forEach(btn => {
      btn.addEventListener('click', function () {
        const mod = parseInt(this.dataset.module, 10);
        if (!state.completedModules.includes(mod)) {
          state.completedModules.push(mod);
          saveState();
          updateProgress();
        }
      });
    });
  }

  // --- Collapsibles ---
  function initCollapsibles() {
    document.querySelectorAll('.collapsible-toggle').forEach(toggle => {
      toggle.addEventListener('click', function () {
        const collapsible = this.closest('.collapsible');
        collapsible.classList.toggle('open');
      });
    });
  }

  // --- Quizzes ---
  function initQuizzes() {
    document.querySelectorAll('.quiz-option').forEach(option => {
      option.addEventListener('click', function () {
        const question = this.closest('.quiz-question');
        const feedback = question.querySelector('.quiz-feedback');

        // Don't allow re-answering
        if (question.classList.contains('answered')) return;
        question.classList.add('answered');

        const isCorrect = this.dataset.correct === 'true';

        // Mark all options as disabled
        question.querySelectorAll('.quiz-option').forEach(opt => {
          opt.classList.add('disabled');
        });

        // Mark selected
        this.classList.add('selected');

        if (isCorrect) {
          this.classList.add('correct');
          feedback.textContent = 'Correct!';
          feedback.className = 'quiz-feedback correct';
        } else {
          this.classList.add('incorrect');
          feedback.textContent = 'Not quite. See the highlighted answer.';
          feedback.className = 'quiz-feedback incorrect';
          // Reveal the correct answer
          question.querySelectorAll('.quiz-option').forEach(opt => {
            if (opt.dataset.correct === 'true') {
              opt.classList.add('reveal-correct');
            }
          });
        }

        // Save quiz state
        const quizCard = this.closest('.quiz-card');
        const quizId = quizCard.dataset.quiz;
        const qIndex = Array.from(quizCard.querySelectorAll('.quiz-question')).indexOf(question);
        if (!state.quizAnswers[quizId]) state.quizAnswers[quizId] = {};
        state.quizAnswers[quizId][qIndex] = isCorrect;
        saveState();
      });
    });
  }

  // --- Navigation ---
  function initNavigation() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('navToggle');

    // Mobile toggle
    if (toggle) {
      toggle.addEventListener('click', function () {
        sidebar.classList.toggle('open');
      });
    }

    // Close sidebar on link click (mobile)
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
        }
      });
    });

    // Active link on scroll
    const sections = document.querySelectorAll('.module[data-module]');
    const navLinks = document.querySelectorAll('.nav-link[data-module]');

    function updateActiveLink() {
      let currentModule = 0;
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150) {
          currentModule = parseInt(section.dataset.module, 10);
        }
      });

      navLinks.forEach(link => {
        const mod = parseInt(link.dataset.module, 10);
        if (mod === currentModule) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }

    window.addEventListener('scroll', updateActiveLink, { passive: true });
    updateActiveLink();
  }

  // --- Implementation Checklist ---
  function initChecklist() {
    const checks = document.querySelectorAll('.impl-check');
    checks.forEach((check, i) => {
      // Restore state
      if (state.implChecks.includes(i)) {
        check.checked = true;
      }

      check.addEventListener('change', function () {
        if (this.checked) {
          if (!state.implChecks.includes(i)) state.implChecks.push(i);
        } else {
          state.implChecks = state.implChecks.filter(x => x !== i);
        }
        saveState();
      });
    });
  }

  // --- Restore Quiz State ---
  function restoreQuizState() {
    Object.keys(state.quizAnswers).forEach(quizId => {
      const quizCard = document.querySelector(`.quiz-card[data-quiz="${quizId}"]`);
      if (!quizCard) return;

      const questions = quizCard.querySelectorAll('.quiz-question');
      Object.keys(state.quizAnswers[quizId]).forEach(qIndex => {
        const question = questions[parseInt(qIndex, 10)];
        if (!question || question.classList.contains('answered')) return;

        // We only know if the answer was correct, not which option was selected
        // So just mark the question as answered if they got it right
        // For simplicity, we won't fully restore the visual state on reload
      });
    });
  }

  // --- Circuit Diagram ---
  function initCircuitDiagram() {
    const gates = document.querySelectorAll('.gate');
    const info = document.getElementById('circuitInfo');
    if (!gates.length || !info) return;

    const descriptions = {
      mul1: '<strong>Multiplication Gate 1:</strong> Computes x &times; x = x&sup2;. Both left and right wires carry the input x = 3, so the output is 9. The <em>dashed purple wires</em> show copy constraints &mdash; ensuring the same x value is used.',
      mul2: '<strong>Multiplication Gate 2:</strong> Computes x&sup2; &times; x = x&sup3;. Left wire carries x&sup2; = 9 from the previous gate, right wire carries x = 3 (copy constraint). Output is 27.',
      add1: '<strong>Addition Gate 1:</strong> Computes x&sup3; + x. Left wire carries x&sup3; = 27 (copy from MUL2 output), right wire carries x = 3 (another copy constraint). Output is 30.',
      const: '<strong>Constant Gate:</strong> Introduces the constant value 5. In PLONK, this uses the q<sub>C</sub> selector polynomial. The dashed yellow wire feeds this into the next addition gate.',
      add2: '<strong>Addition Gate 2 (Output):</strong> Computes (x&sup3; + x) + 5 = 30 + 5 = 35. This is the public output that the verifier checks. The proof demonstrates knowledge of x without revealing x = 3.'
    };

    gates.forEach(gate => {
      gate.addEventListener('click', function () {
        gates.forEach(g => g.classList.remove('active'));
        this.classList.add('active');
        const gateId = this.dataset.gate;
        if (descriptions[gateId]) {
          info.innerHTML = '<p>' + descriptions[gateId] + '</p>';
          info.classList.add('active');
        }
      });
    });
  }

  // --- Polynomial Playground ---
  function initPolyPlayground() {
    const canvas = document.getElementById('polyCanvas');
    const eqDisplay = document.getElementById('polyEquation');
    if (!canvas || !eqDisplay) return;

    const ctx = canvas.getContext('2d');
    const sliders = document.querySelectorAll('.poly-slider');
    const valDisplays = document.querySelectorAll('.poly-val');

    // Evaluation points (simulating roots of unity on the real line)
    const xPoints = [-1.5, -0.5, 0.5, 1.5];
    let yPoints = [3, 1, -2, 4];

    function lagrangeInterpolate(xPoints, yPoints, x) {
      let result = 0;
      const n = xPoints.length;
      for (let i = 0; i < n; i++) {
        let basis = yPoints[i];
        for (let j = 0; j < n; j++) {
          if (i !== j) {
            basis *= (x - xPoints[j]) / (xPoints[i] - xPoints[j]);
          }
        }
        result += basis;
      }
      return result;
    }

    function getCoefficients(xPoints, yPoints) {
      // Compute polynomial coefficients via Lagrange
      const n = xPoints.length;
      const coeffs = new Array(n).fill(0);

      for (let i = 0; i < n; i++) {
        // Compute Lagrange basis polynomial coefficients
        let basisCoeffs = [yPoints[i]];
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const denom = xPoints[i] - xPoints[j];
          const newCoeffs = new Array(basisCoeffs.length + 1).fill(0);
          for (let k = 0; k < basisCoeffs.length; k++) {
            newCoeffs[k + 1] += basisCoeffs[k] / denom;
            newCoeffs[k] -= (xPoints[j] * basisCoeffs[k]) / denom;
          }
          basisCoeffs = newCoeffs;
        }
        for (let k = 0; k < basisCoeffs.length; k++) {
          coeffs[k] = (coeffs[k] || 0) + basisCoeffs[k];
        }
      }
      return coeffs;
    }

    function formatPolynomial(coeffs) {
      const terms = [];
      for (let i = coeffs.length - 1; i >= 0; i--) {
        const c = Math.round(coeffs[i] * 100) / 100;
        if (Math.abs(c) < 0.01) continue;
        let term = '';
        if (i === 0) {
          term = c > 0 && terms.length ? '+' + c : '' + c;
        } else if (i === 1) {
          if (Math.abs(c - 1) < 0.01) term = terms.length ? '+x' : 'x';
          else if (Math.abs(c + 1) < 0.01) term = '-x';
          else term = (c > 0 && terms.length ? '+' : '') + c + 'x';
        } else {
          if (Math.abs(c - 1) < 0.01) term = terms.length ? '+x&sup' + i + ';' : 'x&sup' + i + ';';
          else if (Math.abs(c + 1) < 0.01) term = '-x&sup' + i + ';';
          else term = (c > 0 && terms.length ? '+' : '') + c + 'x&sup' + i + ';';
        }
        terms.push(term);
      }
      return 'f(x) = ' + (terms.length ? terms.join(' ') : '0');
    }

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;

      ctx.clearRect(0, 0, cw, ch);

      const xMin = -3, xMax = 3;
      const yMin = -8, yMax = 8;

      function toCanvasX(x) { return ((x - xMin) / (xMax - xMin)) * cw; }
      function toCanvasY(y) { return ch - ((y - yMin) / (yMax - yMin)) * ch; }

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let x = Math.ceil(xMin); x <= xMax; x++) {
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x), 0);
        ctx.lineTo(toCanvasX(x), ch);
        ctx.stroke();
      }
      for (let y = Math.ceil(yMin); y <= yMax; y += 2) {
        ctx.beginPath();
        ctx.moveTo(0, toCanvasY(y));
        ctx.lineTo(cw, toCanvasY(y));
        ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(xMin), toCanvasY(0));
      ctx.lineTo(toCanvasX(xMax), toCanvasY(0));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(toCanvasX(0), 0);
      ctx.lineTo(toCanvasX(0), ch);
      ctx.stroke();

      // Curve
      ctx.strokeStyle = '#7c6ff7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let first = true;
      for (let px = 0; px <= cw; px += 1) {
        const x = xMin + (px / cw) * (xMax - xMin);
        const y = lagrangeInterpolate(xPoints, yPoints, x);
        const cy = toCanvasY(y);
        if (cy < -50 || cy > ch + 50) {
          first = true;
          continue;
        }
        if (first) { ctx.moveTo(px, cy); first = false; }
        else ctx.lineTo(px, cy);
      }
      ctx.stroke();

      // Points
      xPoints.forEach((x, i) => {
        const cx = toCanvasX(x);
        const cy = toCanvasY(yPoints[i]);
        // Outer glow
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(124, 111, 247, 0.3)';
        ctx.fill();
        // Inner dot
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#9d93f9';
        ctx.fill();
        ctx.strokeStyle = '#7c6ff7';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('(' + x + ', ' + yPoints[i] + ')', cx, cy - 14);
      });

      // Update equation
      const coeffs = getCoefficients(xPoints, yPoints);
      eqDisplay.innerHTML = formatPolynomial(coeffs);
    }

    sliders.forEach(slider => {
      slider.addEventListener('input', function () {
        const idx = parseInt(this.dataset.index, 10);
        yPoints[idx] = parseInt(this.value, 10);
        valDisplays.forEach(v => {
          if (parseInt(v.dataset.index, 10) === idx) {
            v.textContent = this.value;
          }
        });
        draw();
      });
    });

    // Initial draw
    window.addEventListener('resize', draw);
    draw();
  }

  // --- Scroll Reveal ---
  function initScrollReveal() {
    const elements = document.querySelectorAll('.card, .quiz-card, .path-summary, .glossary-section');

    // If user prefers reduced motion, just show everything
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(el => observer.observe(el));
  }

  // --- Init ---
  function init() {
    initNavigation();
    initCollapsibles();
    initQuizzes();
    initModuleButtons();
    initChecklist();
    initCircuitDiagram();
    initPolyPlayground();
    initScrollReveal();
    restoreQuizState();
    updateProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
