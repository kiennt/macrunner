import { Command, Option } from 'clipanion';
import { prompt } from 'enquirer';
import chalk from 'chalk';

import { IGithubClient, GithubClient } from '../github';
import { GithubAddress } from '../github_address';
import { Workspace } from '../workspace';

interface Condition {
  condition: () => Promise<boolean>;
  message: string;
}

export default class CreateCommand extends Command {
  // clipanion params
  static paths = [['create']];
  verbose = Option.Boolean(`-v,--verbose`, true);
  name = Option.String(`-n,--name`, { required: false });
  repo = Option.String(`-r,--repo`, { required: false });
  token = Option.String(`-t,--token`, { required: false });

  private gh: IGithubClient | undefined;
  private address: GithubAddress;

  async execute(): Promise<void> {
    await this.getUserInputParams();

    const workspace = new Workspace(this.name || '', this.address, this.token || '');
    workspace.save();
    console.log(`
${chalk.green`Create a new workspace for Macrunner successfully`}

Now you could scale up/down the workspace later by using the following command

  ${chalk.green`macrunner scale --workspace ${this.name} --count <count>`}

To list all your workspaces, you could use the follow command

  ${chalk.green`macrunner list`}
`);
    await workspace.createNewRunner();
  }

  private clearConsole(): void {
    console.clear();
  }

  private async getUserInputParams(): Promise<void> {
    // get token
    this.token = await this.getGithubToken(this.token, true);
    this.clearConsole();
    this.address = await this.getGithubAddress(this.repo);
    this.clearConsole();
    this.name = await this.getWorkspaceName(this.name);
  }

  private async getWorkspaceName(value: string | undefined): Promise<string> {
    return value
      ? value
      : await this.getInputFromUser(
          `
Please enter a name for workspace.
By naming the workspace, you could scale up/down the workspace later by using the following command

  ${chalk.green`macrunner scale --workspace <name> --count <count>`}

To list all your workspaces, you could use the follow command

  ${chalk.green`macrunner list`}
`,
          'What is your workspace name?',
        );
  }

  private async getInputFromUser(help: string, message: string): Promise<string> {
    if (this.verbose) {
      this.context.stdout.write(`${help}\n`);
    }

    const resp = await prompt<{ value: string }>([
      {
        type: 'input',
        name: 'value',
        message,
      },
    ]);
    return resp.value;
  }

  private async getDetectedGithubToken(): Promise<string | undefined> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return undefined;
    }

    const gh = new GithubClient(token);
    const hasRepoScope = await gh.hasScope('repo');
    return hasRepoScope ? token : undefined;
  }

  private async askGithubToken(detect: boolean): Promise<string> {
    const message = `
${chalk.bold('In order to manage your runner, Macrunner needs to use a github token')}.
The github token needs to have these scopes:

+ ${chalk.green('repo')}:
  this scope allows Macrunner to manage self hosted runners for a repository

+ ${chalk.green('admin:scope')}: (${chalk.italic('optional')})
  this scope allows Macrunner to manage self hosted runners for an organization

To create a new github token, please use the following link
${chalk.blue('https://github.com/settings/tokens')}
`;
    if (!detect) {
      return await this.getInputFromUser(message, 'What is your github token?');
    }

    const detectedToken = await this.getDetectedGithubToken();
    if (!detectedToken) {
      return await this.getInputFromUser(message, 'What is your github token?');
    } else {
      const detectMessage = chalk.green`
We detect a github token already defined in your system.
`;
      const result = await this.getInputFromUser(
        `${message}${detectMessage}`,
        'Do you want to use the old token [y], or create a new one [n]?',
      );

      if (result === 'y') {
        return detectedToken;
      }

      this.clearConsole();
      return await this.getInputFromUser(message, 'What is your github token?');
    }
  }
  private async getGithubToken(value: string | undefined, detectToken: boolean): Promise<string> {
    const token = value ? value : await this.askGithubToken(detectToken);
    this.gh = new GithubClient(token);
    const hasRepoScope = await this.gh.hasScope('repo');
    if (hasRepoScope) {
      return token;
    }

    this.clearConsole();
    this.context.stdout.write(chalk.red`
Please enter a valid github token with repo scope.
Macrunner needs repo scope to manage the self hosted runner.

`);
    return await this.getGithubToken(undefined, false);
  }

  private async checkConditionList(items: Condition[]): Promise<boolean> {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const result = await item.condition();
      if (!result) {
        this.clearConsole();
        this.context.stdout.write(chalk.red(item.message));
        return false;
      }
    }

    return true;
  }

  private async getGithubAddress(value: string | undefined): Promise<GithubAddress> {
    const addressValue = value
      ? value
      : await this.getInputFromUser(
          `
Please enter an organization or a repo in which you want to manage self hosted runners.
The repo could be in following format:

+ ${chalk.green('<org_name>')}, e.g: kakaolabs
  use this if you want set up self hosted runners for all repositories of an organization

+ ${chalk.green('<owner>/<repo>')}, e.g: kiennt/macrunner,
  use this if you want to set up self hosted runners for a specified repository.
`,
          'What is your github repo/org?',
        );
    const address = GithubAddress.fromPath(addressValue);

    if (!address) {
      this.clearConsole();
      return await this.getGithubAddress(undefined);
    }

    if (!this.gh) {
      return address;
    }

    const gh = this.gh;
    const isValidRepo = await this.checkConditionList([
      {
        condition: () => gh.isAddressExist(address),
        message: `
${address.toString()} does not exist.
Please enter a valid github repo/organization.
`,
      },
      {
        condition: () => gh.hasPermissionToManageRunner(address),
        message: `
The current access token does not have access to github actions of ${address.toString()}
Please enter a valid github repo/organization.
`,
      },
    ]);

    if (!isValidRepo) {
      return await this.getGithubAddress(undefined);
    }

    return address;
  }
}
