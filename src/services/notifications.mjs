import { notificationIdempotencyKey } from '../domain/models.mjs';
import { sanitizedEmailProviderErrorCode } from '../email/resend.mjs';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function publicUrl(appUrl, cohortId) {
  return `${appUrl}/cohorts/${encodeURIComponent(cohortId)}`;
}

function confirmationMessage(cohort, url, role) {
  return {
    subject: role === 'creator' ? `Your Cohort15 cohort: ${cohort.title}` : `You're interested in ${cohort.title}`,
    html: `<p>${role === 'creator' ? 'Your cohort is live.' : 'Your interest was recorded.'}</p>`
      + `<p>Interest is collected for seven days. View the public cohort at <a href="${escapeHtml(url)}">${escapeHtml(url)}</a>.</p>`,
  };
}

function quorumMessage(cohort, url) {
  return {
    subject: `Quorum reached: ${cohort.title}`,
    html: `<p>${escapeHtml(cohort.title)} reached quorum.</p>`
      + `<p>First meeting: ${escapeHtml(cohort.firstMeetingLocal)} (${escapeHtml(cohort.creatorTimeZone)}), `
      + `${escapeHtml(cohort.meetingDurationMinutes)} minutes, ${escapeHtml(cohort.recurrence)}, `
      + `${escapeHtml(cohort.meetingCount)} meeting(s).</p>`
      + `<p>Meeting link: <a href="${escapeHtml(cohort.meetingLink)}">${escapeHtml(cohort.meetingLink)}</a></p>`
      + `<p>Public cohort: <a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`,
  };
}

export function createNotificationService({ repositories, emailProvider, appUrl } = {}) {
  if (!repositories?.ensureNotificationDelivery || !repositories?.recordNotificationOutcome) {
    throw new TypeError('notification repositories are required');
  }
  if (!repositories?.listInterestsByCohortId) throw new TypeError('interest repository is required');
  if (!emailProvider?.send) throw new TypeError('emailProvider is required');

  async function deliver({ cohort, interestId = null, recipientEmail, type, message }) {
    const idempotencyKey = notificationIdempotencyKey({
      type, cohortId: cohort.id, interestId, recipientEmail,
    });
    const ensured = await repositories.ensureNotificationDelivery({
      idempotencyKey,
      cohortId: cohort.id,
      interestId,
      recipientEmail,
      type,
    });
    if (!ensured.created) return ensured.delivery;

    try {
      await emailProvider.send({ recipientEmail, to: recipientEmail, ...message, idempotencyKey });
      return repositories.recordNotificationOutcome(idempotencyKey, { status: 'sent', attemptCount: 1 });
    } catch (error) {
      return repositories.recordNotificationOutcome(idempotencyKey, {
        status: 'failed',
        attemptCount: 1,
        providerErrorCode: sanitizedEmailProviderErrorCode(error),
      });
    }
  }

  return Object.freeze({
    async cohortCreated(cohort) {
      const url = publicUrl(appUrl, cohort.id);
      return deliver({
        cohort,
        recipientEmail: cohort.creatorEmail,
        type: 'creator_confirmation',
        message: confirmationMessage(cohort, url, 'creator'),
      });
    },

    async interestAccepted(result) {
      const { cohort, interest, reachedQuorum } = result;
      const url = publicUrl(appUrl, cohort.id);
      const participant = await deliver({
        cohort,
        interestId: interest.id,
        recipientEmail: interest.email,
        type: 'participant_confirmation',
        message: confirmationMessage(cohort, url, 'participant'),
      });
      if (!reachedQuorum) return [participant];

      const interests = await repositories.listInterestsByCohortId(cohort.id);
      const recipients = [cohort.creatorEmail, ...interests.map(({ email }) => email)];
      const quorum = await Promise.all(recipients.map((recipientEmail) => deliver({
        cohort,
        recipientEmail,
        type: 'quorum_met',
        message: quorumMessage(cohort, url),
      })));
      return [participant, ...quorum];
    },
  });
}
