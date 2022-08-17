import os from "os";
import path from "path";

export class Paths{
    public valueMap=new Map();
    resolve(str:string){
        let re=/\{(.*?)\}/.exec(str);
        while(re){
            if(re[1]==="home"){
                str=str.replace("{home}",os.homedir())
            }
            else if(re[1]==="tmp"){
                str=str.replace("{tmp}",os.homedir())
            }
            else if(this.valueMap.has(re[1])){
                str=str.replace(re[0],this.valueMap.get(re[1]))
            }
            else{
                throw new Error("can't find variable "+re[1]+" at "+re[0])
            }
            re=/\{(.*?)\}/.exec(str);
        }
        return str
    }

    abs(str:string){
        const p=this.resolve(str)
        if(path.isAbsolute(p)){
            return p
        }
        else {
            return path.resolve(os.homedir(),p)
        }
    }
}