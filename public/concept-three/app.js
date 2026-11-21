(() => {
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

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
})();
