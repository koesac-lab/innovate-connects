(() => {
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* Dark / Light mode toggle with system preference + persistence */
  const root = document.documentElement;
  const themeBtn = document.querySelector('[data-theme-toggle]');
  const themeLabel = document.querySelector('[data-theme-label]');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const colorSchemeMedia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  const applyTheme = (theme, persist = false) => {
    const isDark = theme === 'dark';
    root.dataset.theme = theme;
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isDark ? '#102e2c' : '#ffffff');
    }
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(isDark));
      themeBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    if (themeLabel) {
      themeLabel.textContent = isDark ? 'Light' : 'Dark';
    }
    if (persist) {
      try {
        localStorage.setItem('ic-theme', theme);
      } catch {
        /* Storage unavailable in restricted contexts */
      }
    }
  };

  applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
    });
  }

  if (colorSchemeMedia && colorSchemeMedia.addEventListener) {
    colorSchemeMedia.addEventListener('change', (event) => {
      try {
        if (!localStorage.getItem('ic-theme')) {
          applyTheme(event.matches ? 'dark' : 'light');
        }
      } catch {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    });
  }

  /* Mobile navigation */
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-site-nav]');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('is-open', !expanded);
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      });
    });
  }

  /* Interactive conversation starter */
  const topics = {
    workshop: {
      subject: 'Scoping a cross-sector connectivity workshop',
      body: 'We are looking to bring our technical, policy and operational teams together to agree on the right connectivity problem to test next.'
    },
    strategy: {
      subject: 'Discussing an adoption strategy',
      body: 'We want to move an emerging connectivity initiative beyond pilot stage and build a clear pathway to everyday operational adoption.'
    },
    research: {
      subject: 'Commissioning technical connectivity research',
      body: 'We need an independent assessment of emerging network capabilities, commercial trade-offs and real-world deployment constraints.'
    },
    report: {
      subject: 'Requesting the Telco adoption strategy report',
      body: 'Please share a copy of the Telco adoption strategy report along with any related briefing notes.'
    }
  };

  const pills = document.querySelectorAll('[data-topic]');
  const triggers = document.querySelectorAll('[data-topic-trigger]');
  const subjectEl = document.querySelector('[data-preview-subject]');
  const bodyEl = document.querySelector('[data-preview-body]');
  const mailtoLink = document.querySelector('[data-mailto-link]');
  const copyBtn = document.querySelector('[data-copy-prompt]');

  let activeKey = 'workshop';

  const setTopic = (key) => {
    const topic = topics[key];
    if (!topic) return;
    activeKey = key;

    pills.forEach((pill) => {
      const isMatch = pill.dataset.topic === key;
      pill.classList.toggle('is-active', isMatch);
      pill.setAttribute('aria-pressed', String(isMatch));
    });

    if (subjectEl) {
      subjectEl.textContent = `Subject: ${topic.subject}`;
    }
    if (bodyEl) {
      bodyEl.textContent = topic.body;
    }
    if (mailtoLink) {
      const params = new URLSearchParams({
        subject: topic.subject,
        body: `${topic.body}\n\nContext:\n`
      });
      mailtoLink.href = `mailto:hello@innovateconnects.com?${params.toString().replace(/\+/g, '%20')}`;
    }
    if (copyBtn) {
      copyBtn.textContent = 'Copy prompt';
    }
  };

  pills.forEach((pill) => {
    pill.addEventListener('click', () => setTopic(pill.dataset.topic));
  });

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => setTopic(trigger.dataset.topicTrigger));
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const topic = topics[activeKey];
      const text = `Subject: ${topic.subject}\n\n${topic.body}`;
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copied';
      } catch {
        copyBtn.textContent = 'Copy unavailable';
      }
    });
  }

  setTopic(activeKey);

  /* Smooth GPU-composited ribbon parallax and pathway filament */
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ribbonNodes = Array.from(document.querySelectorAll('[data-parallax]')).map((el) => ({
    el,
    speed: parseFloat(el.dataset.parallax || '0'),
    driftX: parseFloat(el.dataset.driftX || '0'),
    rotate: parseFloat(el.dataset.rotate || '0'),
    pointer: parseFloat(el.dataset.pointer || '0'),
    currentX: 0,
    currentY: 0,
    currentR: 0
  }));

  const pathwaySection = document.querySelector('[data-pathway-section]');
  const pathwayFill = document.querySelector('[data-pathway-fill]');

  if (!reducedMotion && (ribbonNodes.length > 0 || pathwayFill)) {
    let pointerX = 0;
    let pointerY = 0;
    let rafId = null;

    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    const updateFrame = () => {
      const vh = window.innerHeight || 900;
      const isCompact = window.innerWidth < 780;
      const scaleFactor = isCompact ? 0.45 : 1;
      let needsAnotherFrame = false;

      ribbonNodes.forEach((item) => {
        const rect = item.el.parentElement.getBoundingClientRect();
        const centerOffset = (rect.top + rect.height * 0.5 - vh * 0.5) / vh;
        const progress = clamp(centerOffset, -1.25, 1.25);

        const targetY = progress * item.speed * 260 * scaleFactor + pointerY * item.pointer * scaleFactor;
        const targetX = progress * item.driftX * scaleFactor + pointerX * item.pointer * scaleFactor;
        const targetR = progress * item.rotate * scaleFactor;

        item.currentX += (targetX - item.currentX) * 0.1;
        item.currentY += (targetY - item.currentY) * 0.1;
        item.currentR += (targetR - item.currentR) * 0.1;

        if (
          Math.abs(targetX - item.currentX) > 0.08 ||
          Math.abs(targetY - item.currentY) > 0.08 ||
          Math.abs(targetR - item.currentR) > 0.02
        ) {
          needsAnotherFrame = true;
        }

        item.el.style.transform = `translate3d(${item.currentX.toFixed(2)}px, ${item.currentY.toFixed(2)}px, 0) rotate(${item.currentR.toFixed(2)}deg)`;
      });

      if (pathwaySection && pathwayFill) {
        const rect = pathwaySection.getBoundingClientRect();
        const raw = (vh * 0.78 - rect.top) / (rect.height * 0.85);
        const fill = clamp(raw, 0.12, 1);
        pathwayFill.style.transform = `scaleX(${fill.toFixed(3)})`;
      }

      if (needsAnotherFrame) {
        rafId = window.requestAnimationFrame(updateFrame);
      } else {
        rafId = null;
      }
    };

    const requestTick = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateFrame);
      }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick, { passive: true });

    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('pointermove', (event) => {
        pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
        pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
        requestTick();
      }, { passive: true });
    }

    requestTick();
  }
})();
