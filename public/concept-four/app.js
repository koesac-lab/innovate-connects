(() => {
  // Theme switcher (Evening-Luxe Dark / Editorial Warm Paper Light)
  const THEME_KEY = 'ic-concept4-theme';
  const themeButtons = document.querySelectorAll('[data-theme-set]');
  const themeMeta = document.querySelector('meta[data-theme-color]');
  const lightMedia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  function applyTheme(theme, persist = false) {
    const resolved = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = resolved;

    if (themeMeta) {
      themeMeta.setAttribute('content', resolved === 'light' ? '#f4ecdc' : '#171b1d');
    }

    themeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.themeSet === resolved));
    });

    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, resolved);
      } catch {}
    }
  }

  const initial = document.documentElement.dataset.theme || (lightMedia && lightMedia.matches ? 'light' : 'dark');
  applyTheme(initial, false);

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => applyTheme(button.dataset.themeSet, true));
  });

  if (lightMedia && typeof lightMedia.addEventListener === 'function') {
    lightMedia.addEventListener('change', (event) => {
      try {
        if (localStorage.getItem(THEME_KEY)) return;
      } catch {}
      applyTheme(event.matches ? 'light' : 'dark', false);
    });
  }

  // Mobile menu
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const siteNav = document.querySelector('[data-site-nav]');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const open = siteNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });

    siteNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        siteNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && siteNav.classList.contains('is-open')) {
        siteNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
      }
    });
  }

  // Sticky split-rail chapter sync
  const chapters = document.querySelectorAll('[data-chapter-id]');
  const railChapter = document.querySelector('[data-rail-chapter]');
  const railTitle = document.querySelector('[data-rail-title]');
  const railSummary = document.querySelector('[data-rail-summary]');
  const railLinks = document.querySelectorAll('[data-rail-link]');

  if (chapters.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (!visible) return;
        const el = visible.target;
        const id = el.dataset.chapterId;

        if (railChapter) railChapter.textContent = el.dataset.chapterLabel || '';
        if (railTitle) railTitle.textContent = el.dataset.chapterTitle || '';
        if (railSummary) railSummary.textContent = el.dataset.chapterSummary || '';

        railLinks.forEach((link) => {
          if (link.dataset.railLink === id) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 }
    );

    chapters.forEach((chapter) => observer.observe(chapter));
  }

  // Sector Dossier tabs
  const sectors = {
    public: {
      heading: 'Turning digital infrastructure funding into everyday community value.',
      copy: 'Councils, health trusts and regional programmes carry the mandate for rural coverage, tourism and local growth, yet often lack the internal bridge between telecoms engineering and service delivery.',
      scenario: 'Combining mobile, fibre and satellite options for rural health, social care or regional transport.',
      blocker: 'Capital grants fund build-out without securing long-term operational ownership or user take-up.',
      step: 'A cross-departmental framing workshop to align anchor users, procurement rules and realistic test criteria.'
    },
    industrial: {
      heading: 'Proving private wireless where continuous coverage is operationally critical.',
      copy: 'Manufacturing sites, ports, agriculture and large campuses face complex physical footprints where standard mobile coverage drops out and Wi-Fi struggles with handover.',
      scenario: 'Evaluating private 5G, IoT telemetry or hybrid wireless across yards, berths and production lines.',
      blocker: 'Technical proofs of concept impress engineering teams but stall before winning shift-floor ownership.',
      step: 'Prioritising one operational bottleneck and defining clear payback criteria before committing to site-wide rollout.'
    },
    telecoms: {
      heading: 'Translating advanced network capability into propositions buyers trust.',
      copy: 'Operators, neutral hosts and satellite or NTN teams build remarkable networks, yet enterprise and public-sector buyers hesitate when integration effort and business risk go unanswered.',
      scenario: 'Positioning private networks, neutral-host sharing or non-terrestrial connectivity for new vertical markets.',
      blocker: 'Technical specifications dominate the pitch while buyer readiness and operational change are left to the customer.',
      step: 'Adoption research and proposition workshops grounded in how target organisations actually buy and deploy.'
    }
  };

  const sectorTabs = document.querySelectorAll('[data-sector]');
  const sectorHeading = document.querySelector('[data-sector-heading]');
  const sectorCopy = document.querySelector('[data-sector-copy]');
  const sectorScenario = document.querySelector('[data-sector-scenario]');
  const sectorBlocker = document.querySelector('[data-sector-blocker]');
  const sectorStep = document.querySelector('[data-sector-step]');

  sectorTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const data = sectors[tab.dataset.sector];
      if (!data) return;

      sectorTabs.forEach((item) => {
        item.setAttribute('aria-selected', String(item === tab));
      });

      if (sectorHeading) sectorHeading.textContent = data.heading;
      if (sectorCopy) sectorCopy.textContent = data.copy;
      if (sectorScenario) sectorScenario.textContent = data.scenario;
      if (sectorBlocker) sectorBlocker.textContent = data.blocker;
      if (sectorStep) sectorStep.textContent = data.step;
    });
  });

  // Conversation brief composer
  const briefForm = document.querySelector('[data-brief-form]');
  const draftOutput = document.querySelector('[data-draft-output]');
  const copyButton = document.querySelector('[data-copy-draft]');
  const copyStatus = document.querySelector('[data-copy-status]');

  function updateDraft() {
    if (!briefForm || !draftOutput) return;
    const formData = new FormData(briefForm);
    const sector = (formData.get('sector') || 'UK public sector').toString();
    const stage = (formData.get('stage') || 'exploring where emerging connectivity can solve a real problem').toString();

    draftOutput.textContent =
      `We are a ${sector} team ${stage}. We would like to discuss how to align network evidence, policy constraints and user needs before deciding what to test.`;

    if (copyStatus) copyStatus.textContent = '';
  }

  if (briefForm) {
    briefForm.addEventListener('change', updateDraft);
    updateDraft();
  }

  if (copyButton && draftOutput) {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(draftOutput.textContent);
        if (copyStatus) copyStatus.textContent = 'Brief copied to clipboard.';
      } catch {
        if (copyStatus) copyStatus.textContent = 'Select and copy the brief text above.';
      }
    });
  }
})();
