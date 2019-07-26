import * as fs from 'fs';
import * as os from 'os';

export function deleteFile(path: string){
    try{
        fs.unlinkSync(path);
    }catch(e){}
}
