/**
 * hash ipv4 into a short name
 */

export function encode(ip) {
    return ip.split(".")
        .map(parseFloat)
        .map(val => val.toString(16))
        .map(val => val.length === 2 ? val : "0" + val)
        .join("")
}

/**
 * 
 * @param {string} str 
 * @returns 
 */
export function decode(str) {
    const segs = []
    for (let i = 0; i < str.length; i += 2) {
        segs.push(str.substring(i, i + 2))
    }
    const values = segs.map(val => parseInt(val, 16))
    if (values.length != 4) return false
    if (values.includes(NaN)) return false
    return values.join(".")
}