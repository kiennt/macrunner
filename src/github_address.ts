/**
 * GithubAddress defines a model to address a repo/organization in github
 *
 * E.g:
 *    tikivn is an address to the org tikivn
 *    kiennt/macrunner is an address to the repo macrunner of the user kiennt
 *    tikivn/miniappp is an address to the repo miniapp of the org tikivn
 */
export class GithubAddress extends Object {
  static fromPath(url: string): GithubAddress | undefined {
    const tokens = url.split('/');
    switch (tokens.length) {
      case 1:
        return new GithubAddress(tokens[0]);
      case 2:
        return new GithubAddress(tokens[0], tokens[1]);
      default:
        return undefined;
    }
  }

  constructor(readonly owner: string, readonly repo?: string) {
    super();
  }

  isOrg(): boolean {
    return this.repo == undefined;
  }

  toOrg(): { org: string } {
    return {
      org: this.owner,
    };
  }

  toRepo(): { owner: string; repo: string } {
    return {
      owner: this.owner,
      repo: this.repo || '',
    };
  }

  toString(): string {
    if (this.isOrg()) {
      return `organization ${this.owner}`;
    } else {
      return `repo ${this.owner}/${this.repo}`;
    }
  }

  toPath(): string {
    if (this.isOrg()) {
      return `${this.owner}`;
    }
    return `${this.owner}/${this.repo}`;
  }
}
