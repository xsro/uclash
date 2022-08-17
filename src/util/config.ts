import fs from "fs";
import os from "os";
import {Paths} from "./paths";
import default_config from "./default"; 
import YAML from "yaml";

class Config{
    _projectFolder="";
    custom_Config_Paths=[
        "{home}/.config/uclash/config.",
        "{home}/.config/uclash.",
        "{home}/.uclash.",
    ];
    custom_Config_Exts=[
        "yml","json","yaml"
    ]

    default:{[id:string]:any}=default_config;
    custom:{[id:string]:any}={};
    merged:{[id:string]:any}={};
    paths:Paths=new Paths();

    set projectFolder(str:string){
        this._projectFolder=str;
        this.paths.valueMap.set("project",this._projectFolder);
    }

    constructor(){
        a:
        for (const _custom_path of this.custom_Config_Paths){
            for (const ext of this.custom_Config_Exts){
                const custom_path=this.paths.resolve(_custom_path+ext)
                if(fs.existsSync(custom_path)){
                    const custom_str=fs.readFileSync(custom_path,"utf-8");
                    switch(ext){
                        case "json":
                            this.custom=JSON.parse(custom_str);
                            break;
                        case "yaml":
                        case "yml":
                            this.custom=YAML.parse(custom_str);
                        break
                    }
                    break a;
                }
            }
        }
        this.merged={...this.default,...this.custom};
    }

    toString(){
        return JSON.stringify(this.merged)
    }
}

const config=new Config()

export default config




