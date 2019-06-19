#!/usr/bin/env node

'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const os = require('os');
const path = require('path');

// Public node modules.
const _ = require('lodash');
const fetch = require('node-fetch');
const { machineIdSync } = require('node-machine-id');
const uuid = require('uuid/v4');
const execa = require('execa');

// Local Strapi dependencies.
const packageJSON = require('../../package.json');

/**
 * `$ strapi new`
 *
 * Generate a new Strapi application.
 */

const logError = (scope, error) => {
  return fetch('https://analytics.strapi.io/track', {
    method: 'POST',
    body: JSON.stringify({
      event: 'didNotCreateProject',
      uuid: scope.uuid,
      deviceId: scope.deviceId,
      properties: {
        error: typeof error == 'string' ? error : error && error.message,
        os: os.type(),
        version: scope.strapiPackageJSON.version,
      },
    }),
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {});
};

module.exports = function(location, cliArguments) {
  console.log('🚀 Creating your Strapi application.\n');

  // Build initial scope.
  const rootPath = path.resolve(location);
  const scope = {
    rootPath,
    strapiRoot: path.resolve(__dirname, '..'),
    generatorType: 'new',
    name: path.basename(rootPath),
    strapiPackageJSON: packageJSON,
    debug: cliArguments.debug !== undefined,
    quick: cliArguments.quickstart !== undefined,
    uuid: 'testing', //uuid(),
    deviceId: machineIdSync(),
  };

  const dbArguments = [
    'dbclient',
    'dbhost',
    'dbport',
    'dbname',
    'dbusername',
    'dbpassword',
  ];
  const matchingDbArguments = _.intersection(_.keys(cliArguments), dbArguments);

  if (matchingDbArguments.length) {
    if (
      matchingDbArguments.length !== dbArguments.length &&
      cliArguments.dbclient !== 'sqlite'
    ) {
      console.log(
        `⛔️ Some database arguments are missing. Required arguments list: ${dbArguments}`
      );
      return process.exit(1);
    }

    scope.dbforce = cliArguments.dbforce !== undefined;

    scope.database = {
      settings: {
        client: cliArguments.dbclient,
        host: cliArguments.dbhost,
        srv: cliArguments.dbsrv,
        port: cliArguments.dbport,
        database: cliArguments.dbname,
        username: cliArguments.dbusername,
        password: cliArguments.dbpassword,
        filename: cliArguments.dbfile,
      },
      options: {
        authenticationDatabase: cliArguments.dbauth,
        ssl: cliArguments.dbssl,
      },
    };
  }

  const onError = err => {
    console.log('Error', err);
    logError(scope, err).then(
      () => {
        process.exit(1);
      },
      () => {
        process.exit(1);
      }
    );
  };

  const onSuccess = async () => {
    if (scope.quick) {
      // Create interface for windows user to let them quit the program.
      if (process.platform === 'win32') {
        const rl = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        rl.on('SIGINT', function() {
          process.emit('SIGINT');
        });
      }
      // Listen Ctrl+C / SIGINT event to close the process.
      process.on('SIGINT', function() {
        process.exit();
      });

      await execa('npm', ['run', 'develop'], {
        stdio: 'inherit',
        cwd: scope.rootPath,
        env: {
          FORCE_COLOR: 1,
        },
      });
    }
  };

  require('strapi-generate-new')(scope)
    .then(onSuccess, onError)
    .catch(err => {
      console.log(err);
      process.exit(1);
    });
};
