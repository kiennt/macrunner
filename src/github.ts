import fetch from 'node-fetch';
import { Octokit } from '@octokit/rest';
import { GithubAddress } from './github_address';

export interface IGithubClient {
  hasScope(scope: string): Promise<boolean>;

  isAddressExist(address: GithubAddress): Promise<boolean>;
  hasPermissionToManageRunner(address: GithubAddress): Promise<boolean>;
  registerNewRunner(address: GithubAddress): Promise<string>;
  getRunnerDownloadURL(address: GithubAddress): Promise<string>;
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

  async hasPermissionToManageRunner(address: GithubAddress): Promise<boolean> {
    try {
      address.isOrg()
        ? await this.client.actions.listSelfHostedRunnersForOrg(address.toOrg())
        : await this.client.actions.listSelfHostedRunnersForRepo(address.toRepo());
      return true;
    } catch (err) {
      return false;
    }
  }

  async isAddressExist(address: GithubAddress): Promise<boolean> {
    try {
      const resp = address.isOrg()
        ? await this.client.orgs.get(address.toOrg())
        : await this.client.repos.get(address.toRepo());

      return resp.data.id !== undefined;
    } catch (err) {
      return false;
    }
  }

  async registerNewRunner(address: GithubAddress): Promise<string> {
    const resp = address.isOrg()
      ? await this.client.actions.createRegistrationTokenForOrg(address.toOrg())
      : await this.client.actions.createRegistrationTokenForRepo(address.toRepo());
    return resp.data.token;
  }

  async getRunnerDownloadURL(address: GithubAddress): Promise<string> {
    const resp = address.isOrg()
      ? await this.client.actions.listRunnerApplicationsForOrg(address.toOrg())
      : await this.client.actions.listRunnerApplicationsForRepo(address.toRepo());
    const apps = resp.data.filter((item) => item.os === 'osx');
    return apps[0].download_url;
  }
}
