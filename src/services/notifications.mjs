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

export function createNotificationService({ repositories, emailProvider, appUrl, logger = console } = {}) {
  if (!repositories?.ensureNotificationDelivery || !repositories?.recordNotificationOutcome) {
    throw new TypeError('notification repositories are required');
  }
  if (!repositories?.listInterestsByCohortId) throw new TypeError('interest repository is required');
  if (!emailProvider?.send) throw new TypeError('emailProvider is required');

  async function deliver({ cohort, interestId = null, recipientEmail, type, message }) {
    const idempotencyKey = notificationIdempotencyKey({
      type, cohortId: cohort.id, interestId, recipientEmail,
    });
    let ensured;
    try {
      ensured = await repositories.ensureNotificationDelivery({
        idempotencyKey,
        cohortId: cohort.id,
        interestId,
        recipientEmail,
        type,
      });
    } catch {
      logger.error('notification_delivery_failed', {
        phase: 'ensure_delivery', type, cohortId: cohort.id,
      });
      throw new Error('notification delivery could not be persisted');
    }
    if (!ensured.created && ensured.delivery.status === 'sent') return ensured.delivery;

    const attemptCount = ensured.delivery.attemptCount + 1;

    try {
      await emailProvider.send({ recipientEmail, to: recipientEmail, ...message, idempotencyKey });
    } catch (error) {
      const providerErrorCode = sanitizedEmailProviderErrorCode(error);
      try {
        return await repositories.recordNotificationOutcome(idempotencyKey, {
          status: 'failed', attemptCount, providerErrorCode,
        });
      } catch {
        logger.error('notification_delivery_failed', {
          phase: 'record_provider_failure', type, cohortId: cohort.id, providerErrorCode,
        });
        return ensured.delivery;
      }
    }

    try {
      return await repositories.recordNotificationOutcome(idempotencyKey, {
        status: 'sent', attemptCount,
      });
    } catch {
      logger.error('notification_delivery_failed', {
        phase: 'record_provider_acceptance', type, cohortId: cohort.id,
      });
      return ensured.delivery;
    }
  }

  async function deliverQuorum(cohort, url) {
    const interests = await repositories.listInterestsByCohortId(cohort.id);
    const recipients = [cohort.creatorEmail, ...interests.map(({ email }) => email)];
    const deliveryFor = (recipientEmail) => deliver({
      cohort,
      recipientEmail,
      type: 'quorum_met',
      message: quorumMessage(cohort, url),
    });
    const firstResults = await Promise.allSettled(recipients.map(deliveryFor));
    const recoverableRecipients = recipients.filter((_recipientEmail, index) => {
      const result = firstResults[index];
      return result.status === 'rejected' || result.value.status !== 'sent';
    });
    const recoveryResults = await Promise.allSettled(recoverableRecipients.map(deliveryFor));
    const recovered = new Map(recoverableRecipients.map((recipientEmail, index) => (
      [recipientEmail, recoveryResults[index]]
    )));
    return firstResults
      .map((result, index) => recovered.get(recipients[index]) ?? result)
      .filter(({ status }) => status === 'fulfilled')
      .map(({ value }) => value);
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
      }).catch(() => null);
      if (!reachedQuorum) return [participant];

      const quorum = await deliverQuorum(cohort, url);
      return [participant, ...quorum];
    },

    async recoverQuorumNotifications(cohort) {
      if (!cohort.quorumMetAt) return [];
      return deliverQuorum(cohort, publicUrl(appUrl, cohort.id));
    },
  });
}
