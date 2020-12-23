const chalk = require('chalk');
const uploadProject = require('../utils/upload-project');
const publishProject = require('../utils/publish-project');
const { isLoggedIn, getLogin } = require('../utils/session-helper');
const login = require('./login');
const { domainForm } = require('../forms/domain-form');
const { checkEmailAuth, checkSecretAuth } = require('../utils/auth-helper');
const logger = require('loglevel');
const { getDomainSuggestion } = require('../utils/domain-helper');
const mustache = require('mustache');
const { print } = require('../utils/console-helper');
const { getJsonConfig, updateJsonConfig } = require('../utils/json-config-helper');
const path = require('path');

async function deploy({ projPath, projectId, domain, stage, secret }) {
  try {
    if (!validatePath(projPath)) {
      print();
      print(chalk.red('Error: ') + 'invalid project path ' + projPath);
      print();
      process.exit(1);
    }

    // if (!isLoggedIn()) {
    //   print();
    //   print(chalk.blue('Welcome !!'));
    //   await login();
    // }

    const jsonConfig = getJsonConfig(projPath);
    const deployPath = path.join(projPath, jsonConfig.distDir);

    stage = stage || 'dev';
    projectId = projectId || jsonConfig.projectId;
    // const domainSuggestion = await getDomainSuggestion(projectId, stage);

    console.log({ projectId });

    if (!projectId) {
      stage = 'prod';
      // TODO: remove this condition to create projects with cli
      console.log('invalid project');
      return;
    }

    // get domain name suggestion
    // const domain = await domainForm(
    //   { deployPath, domainSuggestion: domainSuggestion.domain, stage, ask: domainSuggestion.isNew },
    //   name => {
    //     return false;
    //   },
    // );

    // TODO: add a loader in console here

    let authResult;
    if (secret) {
      authResult = await checkSecretAuth({
        secret,
        projectId,
        domain,
        stage,
      });
    } else {
      print(chalk.red('Secret token is required !!'));
      return;
      // const session = getLogin();
      // authResult = await checkEmailAuth({
      //   email: session.login,
      //   access_token: session.password,
      //   projectId,
      //   domain,
      //   stage,
      // });
    }

    await uploadProject({ deployPath, appToken: authResult.appToken });
    const updateResult = await publishProject({ appToken: authResult.appToken, appConf: JSON.stringify(jsonConfig) });
    logger.debug(updateResult);
    console.log(updateResult);

    updateJsonConfig(deployPath, {
      projectId: updateResult.projectId,
      distDir: '.',
    });

    print();
    print(chalk.green('Success !!'));
    print();
  } catch (error) {
    // print();
    logger.debug(error);
    // const view = { domain: chalk.bold(domain) };
    print(chalk.red('Error: ') + getErrorMessage(error));
    print();
  }
}

function validatePath(deployPath) {
  return true;
}

function getErrorMessage(error, view) {
  const errorType = error && typeof error === 'object' ? error.error_code : '';
  const message = error && typeof error === 'object' ? error.message : '';
  if (errorType === 'no_publish_access') {
    return mustache.render(message, view || {});
  }
  if (message) {
    return message;
  }

  switch (errorType) {
    case 'too_many_files':
      return "Hmm, that's too many files. atmost 1000 files are allowed.";
    default:
      return 'failed to publish because of an unknown error. try again.';
  }
}

module.exports = deploy;
