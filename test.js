const a = {
    "A": 1,
    "B": {
        "c": 1
    },
    "C": 2
}

console.log(JSON.stringify(
    a, function (k, v) {
        console.log(k)
        return v
    }
))