import {Request, Response, NextFunction} from 'express';
import { Repository, getRepository } from 'typeorm';
import * as path from 'path';
import * as shortId from 'shortid';
import * as fs from 'fs';
import * as Busboy from 'busboy';
import Comment from '../entity/Comment';
import Ingredient from '../entity/Ingredient';
import Menu from '../entity/Menu';
import NutritionalInfo from '../entity/NutritionalInfo';
import Post from '../entity/Post';
import Recipe from '../entity/Recipe';
import User from '../entity/User';

//Check for errors when converting params, JSON, relational, file delete
export default class Middleware {

    commentRepo : Repository<Comment>;
    ingredientRepo : Repository<Ingredient>;
    menuRepo : Repository<Menu>;
    nutritionalInfoRepo : Repository<NutritionalInfo>;
    postRepo : Repository<Post>;
    recipeRepo : Repository<Recipe>;
    userRepo : Repository<User>;

    multipart = (req: Request, res: Response, next: NextFunction) => {
        if(req.headers['content-type']){
            if(req.headers['content-type'].indexOf('multipart/form-data') != -1){
                let fields = {};
                let maxFiles = 1;
                let fileCount = 0;
                let currentField = '';

                let busboy = new Busboy({headers: req.headers});
                req.pipe(busboy);

                busboy.on('field', (key, val) => {
                    req.body[key] = val;
                });

                busboy.on('file', (fieldname, file, filename, encoding, mimetype) => { //TODO: Add mime check
                    if(fieldname.indexOf('Multi') != -1){
                        if(currentField != fieldname){
                            let max = fieldname[fieldname.indexOf('Multi') + 5];
                            fileCount = 0;
                            if(!isNaN(parseInt(max))) maxFiles = parseInt(max);
                            else maxFiles = -1;
                        }
                    }
                    if((fileCount <= maxFiles || maxFiles == -1) && filename){
                        fileCount++;
                        let ext = filename.split('.')[filename.split('.').length - 1];
                        let saveTo = path.join(__dirname, '../../public/img/upload/' + (req.body.username || shortId.generate()) + '.' + ext);
                        let obj = {path: saveTo.replace(/\\/g, '/').split('/public')[1]};
                        if(maxFiles != 1){
                            fields[fieldname] ? fields[fieldname].push(obj) : fields[fieldname] = [obj];
                        }else{
                            fields[fieldname] = obj;
                        }

                        file.pipe(fs.createWriteStream(saveTo));
                    }else{
                        file.emit('close');
                        file.emit('end');
                    }
                });

                busboy.on('finish', function(){
                    if(Object.keys(fields).length > 0){
                        req.files = fields;
                    }

                    next();
                });
            }else{
                next();
            }
        }else{
            next();
        }
    }

    checkParams = (req: Request, res: Response, next: NextFunction) => {
        let invalid = false;

        for(let key in req.params){
            if(key == 'id'){
                invalid = isNaN(req.params.id);
                if(invalid) break;
            }
        }

        this.sendBack(req, res, next, invalid);
    }

    //Checks empty fields, auto parses and populates special fields
    checkBody = async (req: Request, res: Response, next: NextFunction) => {
        let invalid = false;
        for(let key in req.body){
            if(key.indexOf('Opt') == -1 && req.body[key] == ''){
                if(req.method == 'PATCH'){
                    delete req.body[key];
                }else{
                    invalid = true;
                    break;
                }
            }

            if(key.indexOf('JSON') != -1){
                try {
                    req.body[key] = JSON.parse(req.body[key]);
                }
                catch(e){ invalid = true; }
            }

            if(key.indexOf('Rel') != -1){
                let id = req.body[key];

                if(typeof id == 'number' || typeof id == 'string'){
                    if(typeof id == 'string') id = parseInt(id);
                    let obj;

                    if(key.indexOf('comment') != -1) obj = await this.commentRepo.find(id);
                    else if(key.indexOf('ingredient')) obj = await this.ingredientRepo.findOne(id);
                    else if(key.indexOf('menu')) obj = await this.menuRepo.findOne(id);
                    else if(key.indexOf('nutritionalInfo')) obj = await this.nutritionalInfoRepo.findOne(id);
                    else if(key.indexOf('post')) obj = await this.postRepo.findOne(id);
                    else if(key.indexOf('recipe')) obj = await this.recipeRepo.findOne(id);
                    else if(key.indexOf('user')) obj = await this.userRepo.findOne(id);

                    req.body[key] = obj;

                }else if (id.constructor == Array){
                    let objs;

                    if(key.indexOf('comment') != -1) objs = await this.commentRepo.findByIds(id);
                    else if(key.indexOf('ingredient') != -1) objs = await this.ingredientRepo.findByIds(id);
                    else if(key.indexOf('menu') != -1) objs = await this.menuRepo.findByIds(id);
                    else if(key.indexOf('nutritionalInfo') != -1) objs = await this.nutritionalInfoRepo.findByIds(id);
                    else if(key.indexOf('post') != -1) objs = await this.postRepo.findByIds(id);
                    else if(key.indexOf('recipe') != -1) objs = await this.recipeRepo.findByIds(id);
                    else if(key.indexOf('user') != -1 || key.indexOf('requested') != -1 || key.indexOf('brigade') != -1) objs = await this.userRepo.findByIds(id);

                    req.body[key] = objs;
                }else{
                    invalid = true;
                }
            }
        }

        this.sendBack(req, res, next, invalid);
    }

    auth = (req: Request, res: Response, next: NextFunction) => {
        let adminRestricted : boolean = req.url.indexOf('/admin') != -1;
        let userRestricted : boolean = !(req.url == '/' || req.url == '/login' || req.url == '/signup' || req.url.indexOf('/css/') != -1 || req.url.indexOf('/js/') != -1 ||  req.url.indexOf('/img/') != -1 );

        if((adminRestricted && req.session.admin) || (userRestricted && req.session.userID) || (!userRestricted && !req.session.userID)){
            next();
        }else if((adminRestricted && !req.session.admin) || (userRestricted && !req.session.userID)){
            res.redirect('/login');
        }else if(!userRestricted && req.session.userID){
            res.redirect('/users/' + req.session.userID);
        }
    }

    errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
        this.sendBack(req, res, next, true, err);
    }

    sendBack(req: Request, res: Response, next: NextFunction, condition: boolean, err? : Error){
        if(condition){
            req.session.error = err ? err.stack : 'Invalid input'
            res.redirect(req.header('Referer') || '/');
        }else next();
    }

    static decodeBody(body: object, files?: object | undefined) : object {
        let decoded = {};

        for(let key in body){
            if(key.indexOf('Meta') == -1){
                let finalKey = key.replace('Opt', '').replace('Rel', '').replace('JSON', '');

                decoded[finalKey] = body[key];
            }
        }

        if(files){
            for(let key in files){
                let finalKey = key.replace('Multi', '').replace('Upl', '').replace(/\d+/, '');
                decoded[finalKey] = files[key].length ? files[key].map(f => f.path) : files[key].path;
            }
        }

        return decoded;
    }

    constructor(){
        this.commentRepo = getRepository(Comment);
        this.ingredientRepo = getRepository(Ingredient);
        this.menuRepo = getRepository(Menu);
        this.nutritionalInfoRepo = getRepository(NutritionalInfo);
        this.postRepo = getRepository(Post);
        this.recipeRepo = getRepository(Recipe);
        this.userRepo = getRepository(User);
    }
}
