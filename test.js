// const axios = require("axios").default;

// axios.put(
//   "http://127.0.0.1:9090/configs",
//   { path: "C:\\Users\\jinze\\.config\\uclash\\clash\\out\\free.yml" },
//   {
//     headers: {
//       "Content-Type": "application/json",
//     },
//   }
// ).then(res=>{
//     console.log(res)
// })


const a={
    y:{
        y:{
            c:function(){
                console.log(this)
            }
        }
    }
}

a.y.y.c.bind({aa:"ss"})()
a.y.y.c()