export enum ProfileType {
    clash = 0,
    sourceBase,
    use,
    js,
}

export interface ProfileParser {
    type?: ProfileType,
    destination: string,
    copyTo?: string,
    win32?: ProfileParser,
}

export interface ProfileParsed {
    json: any,
    text: string,
}

import { genApi } from "./parse/main"

export interface ProfileJs {
    parser: ProfileParser,
    gen: {
        (this: genApi): Promise<ProfileParsed> | ProfileParsed
    }
}

export type Profile = ProfileJs
