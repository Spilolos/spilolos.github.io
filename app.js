
// EduGhana main client script
(function(){
  // Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(console.warn);
    });
  }

  // Online/Offline indicator
  function setStatus() {
    const el = document.getElementById('offlineStatus');
    if (!el) return;
    const dot = el.querySelector('span');
    if (navigator.onLine) {
      el.classList.remove('bg-gray-400','text-white');
      el.classList.add('bg-white','text-green-700');
      if (dot) { dot.classList.remove('bg-red-500'); dot.classList.add('bg-green-500'); }
      el.innerHTML = `<span class="w-2 h-2 rounded-full bg-green-500 mr-1 inline-block"></span>Online`;
    } else {
      el.classList.remove('bg-white','text-green-700');
      el.classList.add('bg-gray-800','text-white','offline-indicator');
      if (dot) { dot.classList.remove('bg-green-500'); dot.classList.add('bg-red-500'); }
      el.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500 mr-1 inline-block"></span>Offline`;
    }
  }
  window.addEventListener('online', setStatus);
  window.addEventListener('offline', setStatus);
  setStatus();

  // Simple "login" modal behavior if present
  const loginBtn = document.getElementById('btnLogin');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const email = prompt('Enter email to continue:');
      if (!email) return;
      if (/@admin\.test\s*$/i.test(email)) {
        alert('Welcome Admin! Use the Admin menu to manage content.');
        window.location.href = 'lessons.html';
      } else {
        alert('Welcome! Explore subjects and take quizzes.');
      }
    });
  }

  // Quiz interactions (generic, supports data-correct-index on container)
  function initQuizzes(){
    document.querySelectorAll('.quiz-question').forEach((wrap) => {
      const options = wrap.querySelectorAll('.quiz-option');
      if (!options.length) return;
      const feedback = document.getElementById('feedback');
      const correctIndex = parseInt(wrap.dataset.correctIndex || '0', 10);

      options.forEach((opt, idx) => {
        opt.addEventListener('click', () => {
          options.forEach(o => o.classList.remove('bg-green-100','border-green-400','border-red-500','border-green-500'));
          opt.classList.add('bg-green-100','border-green-400');
          if (idx === correctIndex || opt.dataset.correct === 'true') {
            opt.classList.add('border-green-500');
            if (feedback){ feedback.classList.remove('hidden'); }
          } else {
            opt.classList.add('border-red-500');
            if (feedback){ feedback.classList.remove('hidden'); }
          }
        });
      });

      const next = document.getElementById('nextQuestion');
      if (next) {
        next.addEventListener('click', () => {
          options.forEach(o => o.classList.remove('bg-green-100','border-green-400','border-red-500','border-green-500'));
          if (feedback){ feedback.classList.add('hidden'); }
          // In demo we just bump a progress bar if present
          const bar = document.querySelector('.bg-green-500');
          if (bar && bar.style && bar.style.width) {
            const cur = parseInt(bar.style.width || '0',10) || 0;
            bar.style.width = Math.min(cur + 20, 100) + '%';
          }
        });
      }
    });
  }
  document.addEventListener('DOMContentLoaded', initQuizzes);
})();
