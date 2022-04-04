/**
 * parse a human-readable string to interval
 * @param {string} str 
 * @returns {string|number} ms interval
 */
export function parse(str) {
    const exp = str
        .replace(/day/g, "*24h")
        .replace(/d/g, "*24h")
        .replace(/hour/g, "*60min")
        .replace(/h/g, "*60min")
        .replace(/min/g, "*60s")
        .replace(/m/g, "*60s")
        .replace(/sec/g, "*1000")
        .replace(/s/g, "*1000")
    let ms = -1;
    try {
        ms = eval(exp)
    } catch (e) {
        // console.log(`parse ${exp} failed`)
    }
    return ms === -1 ? str : ms
}

console.log(parse("30d"))