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

  // --- Init ---
  function init() {
    initNavigation();
    initCollapsibles();
    initQuizzes();
    initModuleButtons();
    initChecklist();
    restoreQuizState();
    updateProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
