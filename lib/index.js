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
  .option('--projectId <projectId>', 'unique ID of the project')
  .option('--secret <secret>', 'secret token to authorize deployment')
  .option('-f, --force', 'force deployment')
  .action(async (path, options) => {
    await commands.deploy({
      projPath: path || '.',
      projectId: options.projectId || '',
      stage: options.stage || 'prod',
      secret: options.secret || '',
      force: options.force || false,
    });
  });

cli.addHelpCommand(true);
cli.parse(process.argv);
