const fetch = require('node-fetch');
const logger = require('loglevel');
const config = require('../config');
const { getUserAgent, getPlatformInfo } = require('./client-info');

module.exports = { checkEmailAuth, checkSecretAuth };

async function checkEmailAuth({ email, access_token, projectId, domain, stage }) {
  // const API_AUTH_PROJECT = `${config.HOST}${config.AUTH_PROJECT}`;

  // const options = {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     accept: 'application/json',
  //     'user-agent': getUserAgent(),
  //     'user-platform': getPlatformInfo(),
  //   },
  //   body: JSON.stringify({
  //     email,
  //     access_token,
  //     projectId,
  //     domain,
  //     stage,
  //   }),
  // };

  // try {
  //   const res = await fetch(API_AUTH_PROJECT, options);
  //   const response = await res.json();
  //   if (res.status !== 200 || response.error_code) {
  //     throw response;
  //   }
  //   return response;
  // } catch (error) {
  //   logger.debug(error);
  //   throw error;
  // }
  throw 'not supported';
}

async function checkSecretAuth({ secret, projectId, domain, stage }) {
  const query = `
  mutation InitApp($input: InitAppInput!) {
    initApp(input: $input) {
      appToken
    }
  }
  `;
  const variables = {
    input: {
      projectId,
      stage,
      domain,
      secret,
    },
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      'user-agent': getUserAgent(),
      'user-platform': getPlatformInfo(),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  };

  try {
    const res = await fetch(config.API, options);
    const response = await res.json();
    console.log(res, response);
    if (res.status !== 200 || (response.errors && response.errors.length)) {
      throw response;
    }
    return {
      appToken: response.data.initApp.appToken,
    };
  } catch (error) {
    logger.debug(error);
    throw error;
  }
}
