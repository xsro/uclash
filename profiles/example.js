async function gen() {
    const { config, YAML, ip } = this;
    console.log(Object.keys(this))
    const text_ = config.cURL("https://github.com/Hackl0us/SS-Rule-Snippet/raw/main/LAZY_RULES/clash.yaml")
    const json = YAML.parse(text_)
    json["allow-lan"] = true
    json["hosts"] = { clash: ip.systemIp192() }
    const text = YAML.stringify(json)
    return { json, text }

}

module.exports= {
    parser: {
        type: 3,
        destination: "../example.js.yml",
        updateTime: {
            "ibcn": new Date().toString()
        }
    },
    gen
}