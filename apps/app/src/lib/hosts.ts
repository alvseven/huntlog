const APP_PREFIX = "app.";

const { protocol, hostname, host } = window.location;
const siteHost = host.startsWith(APP_PREFIX) ? host.slice(APP_PREFIX.length) : host;

export const isAppHost = hostname.startsWith(APP_PREFIX);
export const landingUrl = `${protocol}//${siteHost}`;
export const appUrl = `${protocol}//${APP_PREFIX}${siteHost}`;
