async function gen() {
    const { download2, YAML, ip192 } = this;
    console.log(this)
    const text_ = await download2("https://github.com/yu-steven/openit/blob/raw/Clash.yaml")
    const json = YAML.parse(text_)
    json["allow-lan"] = true
    json["hosts"] = { clash: ip192 }
    const text = YAML.stringify(json)
    return { json, text }

}

export default {
    parser: {
        type: 3,
        destination: "./examplejs_gen.yml",
        updateTime: {
            "ibcn": new Date().toString()
        }
    },
    gen
}