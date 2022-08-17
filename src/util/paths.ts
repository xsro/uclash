import os from "os";

export class Paths{
    public valueMap=new Map();
    resolve(str:string){
        let re=/\{(.*?)\}/.exec(str);
        while(re){
            if(re[1]==="home"){
                str=str.replace("{home}",os.homedir())
            }
            if(re[1]==="tmp"){
                str=str.replace("{tmp}",os.homedir())
            }
            if(this.valueMap.has(re[1])){
                str=str.replace(re[0],this.valueMap.get(re[1]))
            }
            re=/\{(.*?)\}/.exec(str);
        }
        return str
    }
}