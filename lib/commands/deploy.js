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
const prepareFiles = require('../utils/prepare-files');
const { hashElement } = require('folder-hash');

async function deploy({ projPath, projectId, domain, stage, secret }) {
  try {
    if (!validatePath(projPath)) {
      print();
      print(chalk.red('Error: ') + 'invalid project path ' + projPath);
      print();
      process.exit(1);
    }

    // check if files have changed

    // if (!isLoggedIn()) {
    //   print();
    //   print(chalk.blue('Welcome !!'));
    //   await login();
    // }

    const jsonConfig = getJsonConfig(projPath);
    const deployPath = path.join(projPath, jsonConfig.distDir);

    stage = stage || 'prod';
    projectId = projectId || jsonConfig.projectId;
    // const domainSuggestion = await getDomainSuggestion(projectId, stage);

    if (!projectId) {
      stage = 'prod';
      print(chalk.red('Error: ') + 'projectId required');
      return;
    }

    // get domain name suggestion
    // const domain = await domainForm(
    //   { deployPath, domainSuggestion: domainSuggestion.domain, stage, ask: domainSuggestion.isNew },
    //   name => {
    //     return false;
    //   },
    // );

    // prepare the list of files for deployment
    const deployList = await prepareFiles(deployPath);
    if (deployList.length > 10000) {
      throw { error_code: 'too_many_files' };
    }

    // TODO: it generates diferent hash if path is given different for same folder
    // . vs folder name from previous path generates different hash
    const options = {
      files: {
        include: deployList.map(f => f.key),
      },
    };

    const appHash = (await hashElement(projPath, options)).hash;

    let authResult;
    if (secret) {
      authResult = await checkSecretAuth({
        secret,
        projectId,
        domain,
        stage,
        appHash,
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

    await uploadProject({ deployList, appToken: authResult.appToken });
    const updateResult = await publishProject({
      appToken: authResult.appToken,
      appConf: JSON.stringify(jsonConfig),
      appHash,
    });
    if (updateResult && updateResult.status === 'error') {
      throw 'error';
    }
    logger.debug(updateResult);

    updateJsonConfig(deployPath, {
      projectId: updateResult.projectId,
      distDir: '.',
    });

    print();
    print(chalk.green('Success !!'));
    print();
  } catch (error) {
    if (Array.isArray(error.errors) && error.errors.length && error.errors[0].extensions.code === 'SKIPPED') {
      print();
      print(chalk.yellow('Skipped: ') + error.errors[0].message);
      print();
      return;
    }
    // print();
    logger.debug(error);
    // const view = { domain: chalk.bold(domain) };
    print();
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
