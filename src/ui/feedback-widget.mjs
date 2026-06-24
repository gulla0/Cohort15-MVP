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
            <h3>Are you looking to form a small, high-commitment group?</h3>
            <div class="feedback-options">
              <label><input type="radio" name="lookingForGroup" value="yes"> Yes</label>
              <label><input type="radio" name="lookingForGroup" value="no"> No</label>
            </div>
          </section>

          <section class="feedback-step" data-feedback-step="2" hidden>
            <h3 data-feedback-step-2-title>What are you looking for instead?</h3>
            <textarea name="lookingForInstead" maxlength="1000" placeholder="Optional"></textarea>
          </section>

          <section class="feedback-step" data-feedback-step="3" hidden>
            <h3>Are you looking to create a group, join a group, or both?</h3>
            <div class="feedback-options">
              <label><input type="radio" name="groupIntent" value="create"> Create</label>
              <label><input type="radio" name="groupIntent" value="join"> Join</label>
              <label><input type="radio" name="groupIntent" value="both"> Both</label>
            </div>
          </section>

          <section class="feedback-step" data-feedback-step="4" hidden>
            <h3>Did you create or join a group on Cohort15?</h3>
            <div class="feedback-options">
              <label><input type="radio" name="didCreateOrJoin" value="created"> Created</label>
              <label><input type="radio" name="didCreateOrJoin" value="joined"> Joined</label>
              <label><input type="radio" name="didCreateOrJoin" value="both"> Both</label>
              <label><input type="radio" name="didCreateOrJoin" value="not_yet"> Not yet</label>
              <label><input type="radio" name="didCreateOrJoin" value="tried_but_stopped"> Tried but stopped</label>
            </div>
          </section>

          <section class="feedback-step" data-feedback-step="5" hidden>
            <h3 data-feedback-step-5-title>How was the experience?</h3>
            <textarea name="whyOrWhyNot" maxlength="2000" data-feedback-step-5-text placeholder="What felt clear, confusing, useful, or missing?"></textarea>
          </section>

          <section class="feedback-step" data-feedback-step="6" hidden>
            <h3>Founder’s socials</h3>
            <p>I’m Harsha, the founder of Cohort15. If this is the kind of group you’re looking for, I’d genuinely love to hear what you’re trying to form and what got in the way.</p>
            <p class="founder-social-label">Reach me directly</p>
            <nav class="founder-socials" aria-label="Founder contact links">
              <a href="https://x.com/cohort15dotcom" target="_blank" rel="noopener noreferrer" aria-label="Founder on X">${icon('x')}</a>
              <a href="https://www.linkedin.com/in/harsha-gullapalli-4b23451a" target="_blank" rel="noopener noreferrer" aria-label="Founder on LinkedIn">${icon('linkedin')}</a>
              <a href="mailto:cohort15dotcom@gmail.com" aria-label="Email the founder">${icon('mail')}</a>
            </nav>
            <p class="field-note">If you’re open to it, leave the best way to reach you. One is enough. Use whatever feels easiest.</p>
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
      const stepFiveTitle = widget.querySelector('[data-feedback-step-5-title]');
      const stepFiveText = widget.querySelector('[data-feedback-step-5-text]');
      const steps = [...widget.querySelectorAll('[data-feedback-step]')];
      const storageKey = 'cohort15.feedback.v1';
      const contextKey = 'cohort15.feedback.context.v1';
      const sessionOpenKey = 'cohort15.feedback.opened-session.v1';
      const sessionDismissedKey = 'cohort15.feedback.dismissed-session.v1';
      let currentStep = 1;
      let dirty = false;
      let hasProgress = false;
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

      const markAction = (key) => {
        const context = loadJson(contextKey, {});
        context[key] = true;
        saveJson(contextKey, context);
      };
      const shouldAutoOpen = () => sessionStorage.getItem(sessionOpenKey) !== 'true'
        && sessionStorage.getItem(sessionDismissedKey) !== 'true'
        && panel.hidden;
      const openPanel = ({ automatic = false } = {}) => {
        if (automatic && !shouldAutoOpen()) return;
        panel.hidden = false;
        openButton.setAttribute('aria-expanded', 'true');
        document.body.classList.add('feedback-open');
        showStep(currentStep);
        if (automatic) {
          sessionStorage.setItem(sessionOpenKey, 'true');
        } else {
          panel.querySelector('input, textarea, button')?.focus();
        }
      };
      const autoOpen = () => {
        openPanel({ automatic: true });
      };
      if (location.pathname === '/cohorts/new') markAction('openedCohortRequest');
      if (location.pathname.startsWith('/cohorts/') && location.pathname !== '/cohorts/new') markAction('openedCohortDetail');
      if (location.pathname.startsWith('/research')) markAction('readResearch');
      if (location.pathname === '/cohorts/new') {
        setTimeout(autoOpen, 500);
      }
      if (location.pathname.startsWith('/cohorts/') && location.pathname !== '/cohorts/new') {
        setTimeout(autoOpen, 500);
      }
      if (location.pathname.startsWith('/research')) {
        setTimeout(autoOpen, 25000);
      }
      document.querySelector('a[href="/cohorts/new"]')?.addEventListener('click', () => {
        markAction('openedCohortRequest');
      }, { once: true });
      document.querySelector('[data-cohort-form]')?.addEventListener('input', () => {
        markAction('startedCohortForm');
        autoOpen();
      }, { once: true });
      document.querySelector('[data-cohort-form]')?.addEventListener('submit', () => {
        markAction('submittedCohortRequest');
        autoOpen();
      }, { once: true });
      document.querySelector('.interest-form')?.addEventListener('submit', () => {
        markAction('submittedInterest');
        autoOpen();
      }, { once: true });

      const values = () => Object.fromEntries(new FormData(form).entries());
      const refreshHidden = () => {
        sessionInput.value = feedbackState.sessionId;
        pathInput.value = location.pathname + location.search;
        contextInput.value = JSON.stringify(loadJson(contextKey, {}));
        lastStepInput.value = String(currentStep);
      };
      const showStep = (step) => {
        const data = values();
        if (step === 5) {
          const hadExperience = ['created', 'joined', 'both'].includes(data.didCreateOrJoin);
          stepFiveTitle.textContent = hadExperience ? 'How was the experience?' : 'What got in the way?';
          stepFiveText.placeholder = hadExperience
            ? 'What felt clear, confusing, useful, or missing?'
            : 'Timing, unclear fit, missing group, form friction, or anything else.';
        }
        currentStep = step;
        for (const section of steps) section.hidden = Number(section.dataset.feedbackStep) !== step;
        back.hidden = step <= 1;
        next.textContent = step >= 6 || (step === 2 && data.lookingForGroup === 'no') ? 'Done' : 'Next';
        refreshHidden();
      };
      const nextStep = () => {
        const data = values();
        if (currentStep === 1 && data.lookingForGroup === 'no') return 2;
        if (currentStep === 1 && data.lookingForGroup) return 3;
        if (currentStep === 2) return 6;
        return Math.min(6, currentStep + 1);
      };
      const previousStep = () => {
        const data = values();
        if (currentStep === 6 && data.lookingForGroup === 'no') return 2;
        if (currentStep === 3) return 1;
        return Math.max(1, currentStep - 1);
      };
      const validStep = () => {
        const data = values();
        if (currentStep === 1 && !data.lookingForGroup) return 'Choose one option to continue.';
        if (currentStep === 3 && !data.groupIntent) return 'Choose one option to continue.';
        if (currentStep === 4 && !data.didCreateOrJoin) return 'Choose one option to continue.';
        return '';
      };
      const answered = () => {
        const data = values();
        return Boolean(data.lookingForGroup || data.lookingForInstead || data.groupIntent || data.didCreateOrJoin || data.whyOrWhyNot || data.contactEmail || data.contactX || data.contactLinkedin || data.contactOther);
      };
      const clearBranchValues = () => {
        const data = values();
        if (data.lookingForGroup === 'no') {
          form.elements.groupIntent.value = '';
          form.elements.didCreateOrJoin.value = '';
          form.elements.whyOrWhyNot.value = '';
          form.elements.contactEmail.value = '';
          form.elements.contactX.value = '';
          form.elements.contactLinkedin.value = '';
          form.elements.contactOther.value = '';
        } else if (data.lookingForGroup === 'yes') {
          form.elements.lookingForInstead.value = '';
        }
      };
      const save = async ({ completed = false, closing = false } = {}) => {
        refreshHidden();
        clearBranchValues();
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
          if (currentStep === 6 && form.elements.contactEmail.value && !form.elements.contactEmail.validity.valid) {
            return;
          }
          save().catch(() => {
            status.textContent = 'We could not save the latest change.';
          });
        }, 700);
      };
      openButton.addEventListener('click', () => {
        openPanel();
      });
      const closePanel = async () => {
        clearTimeout(saveTimer);
        if (!completed && (dirty || hasProgress || answered()) && !success.hidden) {
          try { await save({ closing: true }); } catch { status.textContent = 'We could not save the latest change.'; }
        } else if (!completed && (dirty || hasProgress || answered())) {
          try { await save({ closing: true }); } catch {}
        }
        panel.hidden = true;
        sessionStorage.setItem(sessionDismissedKey, 'true');
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
          status.textContent = 'We could not save that yet. Please try again.';
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
        if (currentStep === 2 || currentStep === 6) {
          await completeAndClose();
          return;
        }
        try {
          await save();
          showStep(nextStep());
        } catch {
          status.textContent = 'We could not save that yet. Please try again.';
        }
      });
      back.addEventListener('click', () => showStep(previousStep()));
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        await completeAndClose();
      });
      showStep(1);
    })();
  </script>`;
}
