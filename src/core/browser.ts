// Single abstraction point for the WebExtension API. Using webextension-polyfill gives
// us the promise-based `browser.*` surface on every target (including Chrome/Edge, which
// natively expose the callback-based `chrome.*`). All core/module code imports from here.
import browser from 'webextension-polyfill';

export default browser;
