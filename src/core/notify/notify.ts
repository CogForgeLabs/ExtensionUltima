// Notification service (capability 'notifications'). Best-effort: fails soft if the
// browser blocks or lacks notification support.
import browser from '../browser';

export class NotifyService {
  async show(title: string, message: string): Promise<void> {
    try {
      await browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('icon.png'),
        title,
        message,
      });
    } catch {
      /* notifications unavailable — ignore */
    }
  }
}
