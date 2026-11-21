(() => {
  const THEME_STORAGE_KEY = 'ic-concept4-theme';
  const themeButtons = document.querySelectorAll('[data-theme-set]');
  const themeColorMeta = document.querySelector('meta[data-theme-color]');
  const colorSchemeMedia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function applyTheme(theme, persist = false) {
    const resolved = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = resolved;

    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', resolved === 'dark' ? '#171b1d' : '#eaf3ef');
    }

    themeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.themeSet === resolved));
    });

    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, resolved);
      } catch {}
    }
  }

  const initialTheme = document.documentElement.dataset.theme || (colorSchemeMedia && colorSchemeMedia.matches ? 'dark' : 'light');
  applyTheme(initialTheme, false);

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => applyTheme(button.dataset.themeSet, true));
  });

  if (colorSchemeMedia && typeof colorSchemeMedia.addEventListener === 'function') {
    colorSchemeMedia.addEventListener('change', (event) => {
      try {
        if (localStorage.getItem(THEME_STORAGE_KEY)) return;
      } catch {}
      applyTheme(event.matches ? 'dark' : 'light', false);
    });
  }

  const scenarios = {
    health: {
      network: 'Mobile + satellite mix',
      policy: 'NHS & council procurement',
      users: 'District nurse handovers',
      outcome:
        'Test hybrid cellular-satellite kits with two community nursing teams before commissioning a county-wide rollout.',
      summary:
        'Network capability only matters when procurement rules and frontline workflows align around the same test.'
    },
    logistics: {
      network: 'Private 5G vs site Wi-Fi',
      policy: 'Shared spectrum licensing',
      users: 'Yard safety & crane comms',
      outcome:
        'Validate private cellular on one container berth with shift supervisors before committing to full-port coverage.',
      summary:
        'Comparing network performance against real shift handovers shows whether dedicated spectrum pays back.'
    },
    rail: {
      network: 'Trackside fibre & NTN',
      policy: 'Multi-operator access',
      users: 'Driver & passenger reliability',
      outcome:
        'Agree a neutral-host sharing model across two priority dead-zones before tendering corridor infrastructure.',
      summary:
        'Early alignment between route owners and operators prevents expensive infrastructure from sitting underused.'
    }
  };

  // Interactive Decision Lens in hero
  const tabs = document.querySelectorAll('[data-scenario]');
  const svgNetwork = document.querySelector('[data-svg-network]');
  const svgPolicy = document.querySelector('[data-svg-policy]');
  const svgUsers = document.querySelector('[data-svg-users]');
  const outcomeEl = document.querySelector('[data-scenario-outcome]');
  const summaryEl = document.querySelector('[data-scenario-summary]');

  function selectScenario(key) {
    const data = scenarios[key];
    if (!data) return;

    tabs.forEach((tab) => {
      tab.setAttribute('aria-selected', String(tab.dataset.scenario === key));
    });

    if (svgNetwork) svgNetwork.textContent = data.network;
    if (svgPolicy) svgPolicy.textContent = data.policy;
    if (svgUsers) svgUsers.textContent = data.users;
    if (outcomeEl) outcomeEl.textContent = data.outcome;
    if (summaryEl) summaryEl.textContent = data.summary;
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => selectScenario(tab.dataset.scenario));
  });

  // Mobile navigation toggle
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const siteNav = document.querySelector('[data-site-nav]');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
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

  // Perspectives briefing dialogs
  document.querySelectorAll('[data-open-dialog]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = document.getElementById(button.dataset.openDialog);
      if (dialog && typeof dialog.showModal === 'function') {
        dialog.showModal();
      }
    });
  });

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = button.closest('dialog');
      if (dialog) dialog.close();
    });
  });

  document.querySelectorAll('dialog.briefing-dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  // Conversation starter brief builder
  const briefForm = document.querySelector('[data-brief-form]');
  const draftOutput = document.querySelector('[data-draft-output]');
  const copyButton = document.querySelector('[data-copy-draft]');
  const copyStatus = document.querySelector('[data-copy-status]');

  function updateDraft() {
    if (!briefForm || !draftOutput) return;
    const formData = new FormData(briefForm);
    const sector = (formData.get('sector') || 'Public sector').toString().toLowerCase();
    const stage = (formData.get('stage') || 'exploring where emerging connectivity could help').toString().toLowerCase();

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
