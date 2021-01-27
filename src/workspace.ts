import os from 'os';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import shelljs from 'shelljs';

import { IGithubClient, GithubClient } from './github';

interface Runner {
  id: string;
}

export interface IWorkspace {
  createNewRunner(): Promise<Runner>;
  deleteRunner(id: string): Promise<void>;
  listRunners(): Promise<Runner[]>;
  save(): void;
}

export class Workspace extends Object implements IWorkspace {
  private id = '';
  private _gh: IGithubClient;
  private runners: Runner[] = [];

  constructor(
    readonly name: string,
    readonly user: string,
    readonly repo: string,
    readonly token: string,
    id?: string | undefined,
  ) {
    super();
    this.id = id ? id : uuidv4();
  }

  async createNewRunner(): Promise<Runner> {
    const runner = await this.createNewRunnerForRepo();
    this.runners.push(runner);
    this.save();
    return runner;
  }

  private async downloadRunnerAppIfNeeded(): Promise<string> {
    const url = await this.gh().getRunnerForRepo(this.user, this.repo);
    // runner url has format
    // https://github.com/actions/runner/releases/download/v2.164.0/actions-runner-osx-x64-2.164.0.tar.gz
    const tokens = url.split('/');
    const version = tokens[tokens.length - 2];
    const runnerFolder = path.join(os.homedir(), '.macrunner', 'runners', version);
    const runnerPath = path.join(runnerFolder, 'runner.tar.gz');
    fs.mkdirSync(runnerFolder, { recursive: true });

    // we only download runner if it is not stored
    // TODO: what if the file is corrupted
    if (!fs.existsSync(runnerPath)) {
      shelljs.exec(`curl -o ${runnerPath} -L ${url}`);
    }
    return runnerPath;
  }

  private getNextRunnerId(): string {
    return '1';
  }

  private async createNewRunnerForRepo(): Promise<Runner> {
    // download runner software
    const runnerPath = await this.downloadRunnerAppIfNeeded();

    // create new runner folder
    const runnerId = this.getNextRunnerId();
    const workspaceRunnerPath = path.join(this.folderPath(), `runner${runnerId}`);
    fs.rmdirSync(workspaceRunnerPath, { recursive: true });
    fs.mkdirSync(workspaceRunnerPath, { recursive: true });
    shelljs.exec(`tar xvf ${runnerPath} -C ${workspaceRunnerPath}`);

    // register runner to github
    const token = await this.gh().registerNewRunnerForRepo(this.user, this.repo);
    process.chdir(workspaceRunnerPath);
    shelljs.exec(`
      ./config.sh  \
          --unattended \
          --url https://github.com/${this.user}/${this.repo} \
          --token ${token} \
          --name macrunner.${this.name}.runner${runnerId} \
          --labels self-hosted,OSX,X64,macrunner,${this.name} \

      ./svc.sh install
      ./svc.sh start`);

    return {
      id: runnerId,
    };
  }

  async deleteRunner(): Promise<void> {
    return;
  }

  async listRunners(): Promise<Runner[]> {
    return [];
  }

  private gh(): IGithubClient {
    if (!this._gh) {
      this._gh = new GithubClient(this.token);
    }
    return this._gh;
  }

  save(): void {
    fs.mkdirSync(this.folderPath(), { recursive: true });
    fs.writeFileSync(
      this.configPath(),
      JSON.stringify(
        {
          id: this.id,
          name: this.name,
          user: this.user,
          repo: this.repo,
          token: this.token,
          runners: [],
        },
        null,
        2,
      ),
    );
  }

  folderPath(): string {
    return path.join(os.homedir(), '.macrunner', 'workspaces', this.name);
  }

  configPath(): string {
    return path.join(this.folderPath(), 'config.json');
  }
}
