//https://stackoverflow.com/a/14438954/14070379
function onlyUnique(value, index, self) {
    return self.lastIndexOf(value) === index;
}

export default function getInfo(proxies, config) {
    const _proxies = proxies.map(val => val.name);

    if (!config.parser.date || !config.parser.area) {
        return { updateTime: undefined, areas: {} }
    }

    const timeR = new RegExp(config.parser.date);
    const timeRE = JSON.stringify(_proxies).match(timeR)
    const updateTime = timeRE ? timeRE[1] : null;

    const cb = (val) => {
        const areaR = new RegExp(config.parser.area);
        const areaRE = val.match(areaR);
        return areaRE ? areaRE[1] : undefined
    }
    const unique_areas = _proxies.map(cb).filter(val => val).filter(onlyUnique);
    const areas = {};
    for (const a of unique_areas) {
        areas[a] = _proxies.filter(val => val.includes(a)).length
    }

    return {
        updateTime,
        areas
    }
}