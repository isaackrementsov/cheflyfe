import {Request, Response, NextFunction} from 'express';
import { Repository, getRepository } from 'typeorm';
import * as multer from 'multer';
import Comment from '../entity/Comment';
import Ingredient from '../entity/Ingredient';
import Menu from '../entity/Menu';
import NutritionalInfo from '../entity/NutritionalInfo';
import Post from '../entity/Post';
import Recipe from '../entity/Recipe';
import User from '../entity/User';

//TODO: Add Opt to optional req.body params, JSON to parsible, Rel to relational
//Check for errors when converting params, JSON, relational
export default class Middleware {

    commentRepo : Repository<Comment>;
    ingredientRepo : Repository<Ingredient>;
    menuRepo : Repository<Menu>;
    nutritionalInfoRepo : Repository<NutritionalInfo>;
    postRepo : Repository<Post>;
    recipeRepo : Repository<Recipe>;
    userRepo : Repository<User>;
    upload : multer.Instance;

    multipart = (req: Request, res: Response, next: NextFunction) => {
        let fields = [];

        for(let key in req.body){
            if(key.indexOf('Upl') != -1){
                if(key.indexOf('Multi') == -1){
                    fields.push({name: key, maxCount: 1});
                }else{
                    let max = key[key.indexOf('Multi') + 5];
                    let f = {name: key};

                    if(max) f['maxCount'] = parseInt(max);
                    fields.push(f);
                }
            }

            if(fields.length > 0){
                this.upload.fields(fields)(req, res, next);
            }else{
                next();
            }
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
                invalid = true;
                break;
            }

            if(key.indexOf('JSON') != -1){
                try {
                    req.body[key] = JSON.parse(req.body[key]);
                }
                catch(e){ invalid = true; }
            }

            if(key.indexOf('Rel') != -1){
                let id = req.body[key];

                if(typeof id == 'string'){
                    id = parseInt(id);
                    let obj;

                    if(key.indexOf('comment') != -1) obj = await this.commentRepo.findOne(id);
                    else if(key.indexOf('ingredient')) obj = await this.ingredientRepo.findOne(id);
                    else if(key.indexOf('menu')) obj = await this.menuRepo.findOne(id);
                    else if(key.indexOf('nutritionalInfo')) obj = await this.nutritionalInfoRepo.findOne(id);
                    else if(key.indexOf('post')) obj = await this.postRepo.findOne(id);
                    else if(key.indexOf('recipe')) obj = await this.recipeRepo.findOne(id);
                    else if(key.indexOf('user')) obj = await this.userRepo.findOne(id);

                    req.body[key] = obj;

                }else if (id.constructor == Array){
                    let objs;

                    if(key.indexOf('comment') != -1) objs = await this.commentRepo.find(id);
                    else if(key.indexOf('ingredient')) objs = await this.ingredientRepo.find(id);
                    else if(key.indexOf('menu')) objs = await this.menuRepo.find(id);
                    else if(key.indexOf('nutritionalInfo')) objs = await this.nutritionalInfoRepo.find(id);
                    else if(key.indexOf('post')) objs = await this.postRepo.find(id);
                    else if(key.indexOf('recipe')) objs = await this.recipeRepo.find(id);
                    else if(key.indexOf('user')) objs = await this.userRepo.find(id);

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
        let userRestricted : boolean = !(req.url == '/' || req.url == '/login' || req.url == '/signup');

        if(adminRestricted && req.session.admin || userRestricted && req.session.userID || !adminRestricted && !req.session.admin || !userRestricted && !req.session.userID){
            next();
        }else if(adminRestricted && !req.session.admin || userRestricted && !req.session.userID){
            res.redirect('/login');
        }else if(!userRestricted && req.session.user){
            res.redirect('/users/' + req.session.userID);
        }
    }

    sendBack(req: Request, res: Response, next: NextFunction, condition: boolean){
        if(condition) res.redirect(req.header('Referer') || '/');
        else next();
    }

    static decodeBody(body: object, files?: object | undefined) : object {
        let decoded = {};

        for(let key in body){
            let finalKey = key.replace('Opt', '').replace('Rel', '').replace('JSON', '');

            decoded[finalKey] = body[key];
        }

        if(files){
            for(let key in files){
                let finalKey = key.replace('Multi', '').replace('Upl', '').replace(/\d+/, '');

                decoded[finalKey] = typeof files[key] == 'string' ? files[key].path : files[key].map(f => f.path);
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
        this.upload = multer({dest: 'public/img/upload/'});
    }
}
