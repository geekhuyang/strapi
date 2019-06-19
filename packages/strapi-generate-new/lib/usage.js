'use strict';
const os = require('os');
const fetch = require('node-fetch');

function trackEvent(event, body) {
  return fetch('https://analytics.strapi.io/track', {
    method: 'POST',
    body: JSON.stringify({
      event,
      ...body,
    }),
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {});
}

function trackError({ scope, error }) {
  return trackEvent('didNotCreateProject', {
    uuid: scope.uuid,
    deviceId: scope.deviceId,
    properties: {
      error: typeof error == 'string' ? error : error && error.message,
      os: os.type(),
      version: scope.strapiPackageJSON.version,
    },
  });
}

function trackUsage({ event, scope, error }) {
  return trackEvent(event, {
    uuid: scope.uuid,
    deviceId: scope.deviceId,
    properties: {
      error: typeof error == 'string' ? error : error && error.message,
      os: os.type(),
      version: scope.strapiPackageJSON.version,
    },
  });
}

module.exports = {
  trackError,
  trackUsage,
};
