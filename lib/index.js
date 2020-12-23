const cli = require('commander');
const pkg = require('../package.json');
const commands = require('export-files')(`${__dirname}/commands`);
const config = require('./config');
const logger = require('loglevel');
const chalk = require('chalk');
logger.setLevel(config.LOG_LEVEL);

cli.version(pkg.version);
cli.usage(`

${chalk.bold('    One step deployment for front-end apps.')}

    navigate to project path and run the command
    wehire`);

cli
  .arguments('[path]')
  .option('-s, --stage <name>', 'stage name of the deployment')
  .option('--prod', 'prod deployment (same as --stage=prod)')
  .option('--domain <domain>', 'domain name of the app')
  .option('--projectId <projectId>', 'unique ID of the project')
  .option('--secret <secret>', 'secret token to authorize deployment')
  .action(async (path, options) => {
    await commands.deploy({
      projPath: path || '.',
      projectId: options.projectId || '',
      domain: options.domain || '',
      stage: options.stage || 'dev',
      secret: options.secret || '',
    });
  });

cli.addHelpCommand(true);
cli.parse(process.argv);
