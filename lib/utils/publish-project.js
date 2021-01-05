const fetch = require('node-fetch');
const config = require('../config');
const { getUserAgent } = require('./client-info');

module.exports = async function publishProject({ appToken, appConf, appHash }) {
  const query = `
  mutation PublishApp($input: PublishAppInput!) {
    publishApp(input: $input) {
      projectId
    }
  }
  `;
  const variables = {
    input: {
      appToken,
      appConf,
      appHash,
    },
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      authorization: `Bearer ${appToken}`,
      'user-agent': getUserAgent(),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  };

  try {
    const res = await fetch(config.API, options);
    const response = await res.json();
    // if (res.status !== 200) {
    //   // http status is 4xx or 5xx
    // }
    if (res.status !== 200 || (response.errors && response.errors.length)) {
      return {
        status: 'error',
        status_code: 'exception',
      };
    }
    return {
      projectId: response.data.publishApp.projectId,
    };
  } catch (error) {
    return {
      status: 'error',
      status_code: 'exception',
    };
  }
};
