import { config } from "../util.js";

/**
 * parse github link
 * @param {string} url 
 * @returns {{owner:string,repo:string,branch:string,path:string}|undefined}
 */
function parse(url) {
    const jsdelivr = /https:\/\/cdn.jsdelivr.net\/gh\/(.*?)\/(.*?)\@(.*?)\/(.*)/;
    const githubusercontent = /https:\/\/raw.githubusercontent.com\/(.*?)\/(.*?)\/(.*?)\/(.*)/;
    const github = /https:\/\/github.com\/(.*?)\/(.*?)\/(\w*?)\/(.*?)\/(.*)/;
    let re = jsdelivr.exec(url);
    if (re) {
        const [_, owner, repo, branch, path] = re;
        return { owner, repo, branch, path, type: "jsdelivr" }
    }
    re = githubusercontent.exec(url);
    if (re) {
        const [_, owner, repo, branch, path] = re;
        return { owner, repo, branch, path, type: "githubusercontent" }
    }
    re = github.exec(url);
    if (re) {
        const [_, owner, repo, mode, branch, path] = re;
        return { owner, repo, branch, path, mode, type: "github" }
    }
    return undefined
}

/**
 * format infomation to github links
 * @param  {{owner:string,repo:string,branch:string,path:string}} info 
 */
function format(info) {
    const links = [
        "https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}",
        "https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}"
    ];
    const user = config.get("githubusercontent-mirror");
    Array.isArray(user) && links.push(...user)
    const formatted = links.map(function (link) {
        return link
            .replace("{owner}", info.owner)
            .replace("{repo}", info.repo)
            .replace("{branch}", info.branch)
            .replace("{path}", info.path)
    })
    return formatted;
}

export const githublink = {
    parse, format
}