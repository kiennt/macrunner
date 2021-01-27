import fetch from 'node-fetch';
import { Octokit } from '@octokit/rest';

export interface IGithubClient {
  hasScope(scope: string): Promise<boolean>;

  isOrgExist(org: string): Promise<boolean>;
  hasPermissionsToAddActionsRunnerForOrg(org: string): Promise<boolean>;
  registerNewRunnerForOrg(org: string): Promise<string>;
  getRunnerForOrg(org: string): Promise<string>;

  isRepoExist(owner: string, repo: string): Promise<boolean>;
  hasPermissionsToAddActionsRunnerForRepo(owner: string, repo: string): Promise<boolean>;
  registerNewRunnerForRepo(owner: string, repo: string): Promise<string>;
  getRunnerForRepo(owner: string, repo: string): Promise<string>;
}

export class GithubClient extends Object implements IGithubClient {
  private client: Octokit;

  constructor(readonly token: string) {
    super();
    this.client = new Octokit({
      auth: token,
    });
  }

  private async getScopes(): Promise<string[]> {
    const resp = await fetch('https://api.github.com/user', {
      method: 'HEAD',
      headers: {
        Authorization: `token ${this.token}`,
      },
    });
    const scopes = resp.headers.get('x-oauth-scopes');
    return scopes?.split(',') || [];
  }

  async hasScope(scope: string): Promise<boolean> {
    const scopes = await this.getScopes();
    return scopes.includes(scope);
  }

  async hasPermissionsToAddActionsRunnerForRepo(owner: string, repo: string): Promise<boolean> {
    try {
      await this.client.actions.listSelfHostedRunnersForRepo({
        owner,
        repo,
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  async hasPermissionsToAddActionsRunnerForOrg(org: string): Promise<boolean> {
    try {
      await this.client.actions.listSelfHostedRunnersForOrg({
        org,
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  async isRepoExist(owner: string, repo: string): Promise<boolean> {
    try {
      const resp = await this.client.repos.get({
        owner,
        repo,
      });

      return resp.data.id !== undefined;
    } catch (err) {
      return false;
    }
  }

  async isUserExist(username: string): Promise<boolean> {
    try {
      const resp = await this.client.users.getByUsername({
        username,
      });
      return resp.data.id !== undefined;
    } catch (err) {
      return false;
    }
  }

  async isOrgExist(org: string): Promise<boolean> {
    try {
      const resp = await this.client.orgs.get({
        org,
      });
      return resp.data.id !== undefined;
    } catch (err) {
      return false;
    }
  }

  async registerNewRunnerForRepo(owner: string, repo: string): Promise<string> {
    const resp = await this.client.actions.createRegistrationTokenForRepo({
      owner,
      repo,
    });
    return resp.data.token;
  }

  async registerNewRunnerForOrg(org: string): Promise<string> {
    const resp = await this.client.actions.createRegistrationTokenForOrg({
      org,
    });
    return resp.data.token;
  }

  async getRunnerForOrg(org: string): Promise<string> {
    const resp = await this.client.actions.listRunnerApplicationsForOrg({ org });
    const apps = resp.data.filter((item) => item.os === 'osx');
    return apps[0].download_url;
  }

  async getRunnerForRepo(owner: string, repo: string): Promise<string> {
    const resp = await this.client.actions.listRunnerApplicationsForRepo({ owner, repo });
    const apps = resp.data.filter((item) => item.os === 'osx');
    return apps[0].download_url;
  }
}
