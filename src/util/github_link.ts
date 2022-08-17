import config from "./config";

export enum GithubHost{
    jsdelivr,
    github,
    githubusercontent
}

export class GithubLink {
    static parse(url: string) {
        const jsdelivr = /https:\/\/cdn.jsdelivr.net\/gh\/(.*?)\/(.*?)\@(.*?)\/(.*)/;
        const githubusercontent = /https:\/\/raw.githubusercontent.com\/(.*?)\/(.*?)\/(.*?)\/(.*)/;
        const github = /https:\/\/github.com\/(.*?)\/(.*?)\/(\w*?)\/(.*?)\/(.*)/;
        let re = jsdelivr.exec(url);
        if (re) {
            const [_, owner, repo, branch, path] = re;
            return new GithubLink(owner, repo, branch, path,GithubHost.jsdelivr)
        }
        re = githubusercontent.exec(url);
        if (re) {
            const [_, owner, repo, branch, path] = re;
            return new GithubLink(owner, repo, branch, path, GithubHost.githubusercontent)
        }
        re = github.exec(url);
        if (re) {
            const [_, owner, repo, mode, branch, path] = re;
            return new GithubLink(owner, repo, branch, path, GithubHost.github)
        }
        return undefined
    }

    constructor(
        public owner: string,
        public repo: string,
        public branch: string,
        public path: string,
        public host: GithubHost,
    ) { }


    /**
     * format infomation to github links
     */
    format() {
        const links = [
            "https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}",
            "https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}"
        ];
        const user = config.get<string>("githubusercontent-mirror");
        Array.isArray(user) && links.push(...user)
        const formatted = links.map( (link)=> {
            return link
                .replace("{owner}", this.owner)
                .replace("{repo}", this.repo)
                .replace("{branch}", this.branch)
                .replace("{path}", this.path)
        })
        return formatted;
    }
}