function icon(name) {
  const icons = {
    chat: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-5 4v-4.5A2.5 2.5 0 0 1 4 12.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 8h8M8 11h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    close: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    mail: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 6h16v12H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    linkedin: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6.8 9.4V18H4V9.4zm.2-3A1.5 1.5 0 1 1 4 6.4a1.5 1.5 0 0 1 3 0M10 9.4h2.7v1.2h.1a3 3 0 0 1 2.7-1.5c2.9 0 3.5 1.9 3.5 4.4V18h-2.8v-4c0-1 0-2.3-1.4-2.3s-1.7 1.1-1.7 2.2V18H10z" fill="currentColor"/></svg>',
    x: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M14 10.6 20.1 3h-2.4l-4.8 6-3.8-6H3l6.5 10.1L3 21h2.4l5.2-6.5 4.2 6.5H21zm-2.5 2-1.1-1.7L6.7 4.8h1.5l3 4.8 1.1 1.7 3.9 6.1h-1.5z" fill="currentColor"/></svg>',
  };
  return icons[name] ?? '';
}

export function renderFeedbackWidget() {
  return `<aside class="feedback-widget" data-feedback-widget aria-label="Cohort15 feedback">
    <button class="feedback-trigger" type="button" data-feedback-open aria-expanded="false">
      <span>${icon('chat')}</span><span>Feedback</span>
    </button>
    <div class="feedback-panel" data-feedback-panel hidden role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <div class="feedback-panel-inner">
        <header class="feedback-header">
          <div><p class="eyebrow">Feedback</p><h2 id="feedback-title">Help shape Cohort15</h2></div>
          <button class="feedback-icon-button" type="button" data-feedback-close aria-label="Close feedback">${icon('close')}</button>
        </header>
        <form class="feedback-form" data-feedback-form>
          <input type="hidden" name="sessionId" data-feedback-session>
          <input type="hidden" name="path" data-feedback-path>
          <input type="hidden" name="actionContext" data-feedback-context>
          <input type="hidden" name="lastStep" data-feedback-last-step value="1">
          <input type="hidden" name="completionState" data-feedback-completion value="partial">
          <input type="hidden" name="submittedOnClose" data-feedback-close-field value="false">

          <section class="feedback-step" data-feedback-step="1">
            <p class="feedback-intro">We’re building Cohort15 for people trying to form serious, high-commitment groups. Your feedback directly shapes what we build next.</p>
            <label for="feedback-message">What would you like us to know?</label>
            <textarea id="feedback-message" name="whyOrWhyNot" maxlength="2000" data-feedback-message placeholder="What felt clear, confusing, useful, or missing?"></textarea>
          </section>

          <section class="feedback-step" data-feedback-step="2" hidden>
            <h3>Founder’s socials</h3>
            <p>I’m Harsha, the founder of Cohort15. If this is the kind of group you’re looking for, I’d genuinely love to hear what you’re trying to form and what got in the way.</p>
            <p class="founder-social-label">Reach me directly</p>
            <nav class="founder-socials" aria-label="Founder contact links">
              <a href="https://x.com/cohort15dotcom" target="_blank" rel="noopener noreferrer" aria-label="Founder on X">${icon('x')}</a>
              <a href="https://www.linkedin.com/in/harsha-gullapalli-4b23451a" target="_blank" rel="noopener noreferrer" aria-label="Founder on LinkedIn">${icon('linkedin')}</a>
              <a href="mailto:cohort15dotcom@gmail.com" aria-label="Email the founder">${icon('mail')}</a>
            </nav>
            <p class="field-note">Your feedback has been sent. If you’re open to a follow-up, leave the best way to reach you. Every field is optional; one is enough.</p>
            <label>Best contact email <input type="email" name="contactEmail" maxlength="254" autocomplete="email"></label>
            <label>X / Twitter <input name="contactX" maxlength="200" placeholder="@handle"></label>
            <label>LinkedIn <input name="contactLinkedin" maxlength="500" placeholder="Profile link or name"></label>
            <label>Other link or handle <input name="contactOther" maxlength="500"></label>
          </section>

          <p class="feedback-status" data-feedback-status role="status" aria-live="polite"></p>
          <div class="feedback-actions">
            <button class="button-link secondary" type="button" data-feedback-back hidden>Back</button>
            <button class="button-link" type="button" data-feedback-next>Next</button>
          </div>
        </form>
        <div class="feedback-success" data-feedback-success hidden>
          <h3>Thank you.</h3>
          <p>This helps us understand what serious group-seekers need from Cohort15.</p>
        </div>
      </div>
    </div>
  </aside>${feedbackScript()}`;
}

function feedbackScript() {
  return `<script>
    (() => {
      const widget = document.querySelector('[data-feedback-widget]');
      if (!widget) return;
      const openButton = widget.querySelector('[data-feedback-open]');
      const closeButton = widget.querySelector('[data-feedback-close]');
      const panel = widget.querySelector('[data-feedback-panel]');
      const form = widget.querySelector('[data-feedback-form]');
      const success = widget.querySelector('[data-feedback-success]');
      const next = widget.querySelector('[data-feedback-next]');
      const back = widget.querySelector('[data-feedback-back]');
      const status = widget.querySelector('[data-feedback-status]');
      const sessionInput = widget.querySelector('[data-feedback-session]');
      const pathInput = widget.querySelector('[data-feedback-path]');
      const contextInput = widget.querySelector('[data-feedback-context]');
      const lastStepInput = widget.querySelector('[data-feedback-last-step]');
      const completionInput = widget.querySelector('[data-feedback-completion]');
      const closeField = widget.querySelector('[data-feedback-close-field]');
      const steps = [...widget.querySelectorAll('[data-feedback-step]')];
      const storageKey = 'cohort15.feedback.v1';
      let currentStep = 1;
      let dirty = false;
      let hasProgress = false;
      let feedbackSubmitted = false;
      let completed = false;
      let saveTimer = null;

      const loadJson = (key, fallback) => {
        try { return JSON.parse(localStorage.getItem(key) || ''); } catch { return fallback; }
      };
      const saveJson = (key, value) => {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
      };
      const feedbackState = loadJson(storageKey, {});
      if (!feedbackState.sessionId) {
        feedbackState.sessionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
        saveJson(storageKey, feedbackState);
      }

      const openPanel = () => {
        panel.hidden = false;
        openButton.setAttribute('aria-expanded', 'true');
        document.body.classList.add('feedback-open');
        showStep(currentStep);
        panel.querySelector('textarea, input, button')?.focus();
      };

      const values = () => Object.fromEntries(new FormData(form).entries());
      const refreshHidden = () => {
        sessionInput.value = feedbackState.sessionId;
        pathInput.value = location.pathname + location.search;
        contextInput.value = '{}';
        lastStepInput.value = String(currentStep);
      };
      const showStep = (step) => {
        currentStep = step;
        for (const section of steps) section.hidden = Number(section.dataset.feedbackStep) !== step;
        back.hidden = step <= 1;
        next.textContent = step === 2 ? 'Send feedback' : 'Next';
        refreshHidden();
      };
      const validStep = () => {
        const data = values();
        if (currentStep === 1 && !data.whyOrWhyNot?.trim()) return 'Write a little feedback to continue.';
        return '';
      };
      const answered = () => {
        const data = values();
        return Boolean(data.whyOrWhyNot?.trim() || data.contactEmail || data.contactX || data.contactLinkedin || data.contactOther);
      };
      const save = async ({ completed = false, closing = false } = {}) => {
        refreshHidden();
        completionInput.value = completed ? 'completed' : 'partial';
        closeField.value = closing ? 'true' : 'false';
        if (!answered()) return;
        hasProgress = true;
        const payload = Object.fromEntries(new FormData(form).entries());
        status.textContent = completed ? 'Sending...' : 'Saved';
        const response = await fetch('/feedback', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: closing,
        });
        if (!response.ok) throw new Error('feedback failed');
        dirty = false;
        status.textContent = completed ? '' : 'Saved';
      };
      const scheduleAutoSave = () => {
        if (completed || !answered()) return;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          if (currentStep === 2 && form.elements.contactEmail.value && !form.elements.contactEmail.validity.valid) {
            return;
          }
          save({ completed: feedbackSubmitted }).catch(() => {
            const action = currentStep === 2 ? 'Send feedback' : 'Next';
            status.textContent = 'We couldn’t save your latest changes. They’re still here—select ' + action + ' to try again.';
          });
        }, 700);
      };
      openButton.addEventListener('click', () => {
        openPanel();
      });
      const closePanel = async () => {
        clearTimeout(saveTimer);
        if (!completed && (dirty || hasProgress || answered()) && !success.hidden) {
          try { await save({ completed: feedbackSubmitted, closing: true }); } catch {}
        } else if (!completed && (dirty || hasProgress || answered())) {
          try { await save({ completed: feedbackSubmitted, closing: true }); } catch {}
        }
        panel.hidden = true;
        openButton.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('feedback-open');
        openButton.focus();
      };
      const completeAndClose = async () => {
        try {
          await save({ completed: true });
          completed = true;
          form.hidden = true;
          success.hidden = false;
          setTimeout(() => { closePanel(); }, 1200);
        } catch {
          status.textContent = 'We couldn’t save your feedback. Your response is still here—select Send feedback to try again.';
        }
      };
      closeButton.addEventListener('click', closePanel);
      form.addEventListener('input', () => { dirty = true; scheduleAutoSave(); });
      form.addEventListener('change', () => { dirty = true; scheduleAutoSave(); });
      next.addEventListener('click', async () => {
        const validationMessage = validStep();
        if (validationMessage) {
          status.textContent = validationMessage;
          return;
        }
        if (currentStep === 2) {
          await completeAndClose();
          return;
        }
        try {
          await save({ completed: true });
          feedbackSubmitted = true;
          showStep(2);
          status.textContent = 'Feedback sent. Contact details are optional.';
        } catch {
          status.textContent = 'We couldn’t save your feedback. Your response is still here—select Next to try again.';
        }
      });
      back.addEventListener('click', () => showStep(1));
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        await completeAndClose();
      });
      showStep(1);
    })();
  </script>`;
}
