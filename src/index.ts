import { Cli, Builtins } from 'clipanion';

import CreateCommand from './commands/create';
import ListCommand from './commands/list';
import ScaleCommand from './commands/scale';

const cli = new Cli({
  binaryLabel: `Github Runner Management Tool for Mac`,
  binaryName: `macrunner`,
  binaryVersion: '1.0.0',
});

[CreateCommand, ListCommand, ScaleCommand].forEach((cmd) => {
  cli.register(cmd);
});
cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);
cli.runExit(process.argv.splice(2), Cli.defaultContext);
