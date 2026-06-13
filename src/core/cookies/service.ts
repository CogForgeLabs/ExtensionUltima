// Cookie service (capability 'cookies'). Used by privacy modules to clear site data.
import browser from '../browser';

export class CookieService {
  /** Remove all cookies for a domain (and its subdomains). Returns how many were removed. */
  async removeForDomain(domain: string): Promise<number> {
    const cookies = await browser.cookies.getAll({ domain });
    let removed = 0;
    for (const c of cookies) {
      const host = c.domain.replace(/^\./, '');
      const url = `http${c.secure ? 's' : ''}://${host}${c.path}`;
      try {
        await browser.cookies.remove({ url, name: c.name, storeId: c.storeId });
        removed++;
      } catch {
        /* skip cookies we can't address */
      }
    }
    return removed;
  }

  /** Count cookies for a domain (and subdomains). */
  async countForDomain(domain: string): Promise<number> {
    return (await browser.cookies.getAll({ domain })).length;
  }
}
