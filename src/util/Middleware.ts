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
import { unlink } from './typeDefs';

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
                let maxFileObj = {};
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
                            if(!isNaN(parseInt(max))){
                                maxFiles = parseInt(max);
                                maxFileObj[fieldname] = parseInt(max);
                            }else maxFiles = -1;
                        }
                    }

                    if(filename){
                        fileCount++;
                        let ext = filename.split('.')[filename.split('.').length - 1];
                        let saveTo = path.join(__dirname, '../../public/img/upload/' + shortId.generate() + '.' + ext);
                        let obj = {path: saveTo.replace(/\\/g, '/').split('/public')[1], mime: mimetype};
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
                        Object.keys(fields).map(async k => {
                            if(fields[k].constructor == Array){
                                let max = maxFileObj[k] || fields[k].length;
                                let temp = fields[k].slice(0, max);
                                let rejected = fields[k].slice(max, fields[k].length);

                                fields[k] = temp.filter(f => {
                                    let valid = f.mime.indexOf('image/') != -1 || f.mime.indexOf('video/') != -1;
                                    if(!valid) rejected.push(f);
                                    return valid;
                                });

                                rejected.map(async r => {
                                    try {
                                        await unlink(__dirname + '/../../public' + r.path);
                                    }catch(e){ }
                                });
                            }else if(typeof fields[k] == 'object'){
                                if(fields[k].mime.indexOf('image/') == -1 && fields[k].mime.indexOf('video/') == -1){
                                    try {
                                        await unlink(__dirname + '/../../public' + fields[k].path);
                                    }catch(e){ }

                                    delete fields[k];
                                }
                            }
                        });

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
                invalid = isNaN(req.params.id) || typeof req.params.id != 'number';
                if(invalid) break;
            }
        }

        this.sendBack(req, res, next, invalid, 'Invalid ID');
    }

    //Checks empty fields, auto parses and populates special fields
    checkBody = async (req: Request, res: Response, next: NextFunction) => {
        let invalid = false;

        try {
            for(let key in req.body){
                if(key.indexOf('Opt') == -1 && req.body[key] == ''){
                    if(req.method == 'PATCH'){
                        delete req.body[key];
                    }else{
                        invalid = true;
                        break;
                    }
                }

                if(key.indexOf('JSON') != -1 && req.body[key] != ''){
                    try {
                        req.body[key] = JSON.parse(req.body[key]);
                    }
                    catch(e){ invalid = true; }
                }

                if(key.indexOf('Rel') != -1){
                    let id = req.body[key];
                    let cleanKey = key.trim().toLowerCase();

                    if(typeof id == 'number' || typeof id == 'string'){
                        if(typeof id == 'string') id = parseInt(id);
                        let obj;

                        if(cleanKey.indexOf('comment') != -1) obj = await this.commentRepo.find(id);
                        else if(cleanKey.indexOf('ingredient')) obj = await this.ingredientRepo.findOne(id);
                        else if(cleanKey.indexOf('menu')) obj = await this.menuRepo.findOne(id);
                        else if(cleanKey.indexOf('nutritionalInfo')) obj = await this.nutritionalInfoRepo.findOne(id);
                        else if(cleanKey.indexOf('post')) obj = await this.postRepo.findOne(id);
                        else if(cleanKey.indexOf('recipe')) obj = await this.recipeRepo.findOne(id);
                        else if(cleanKey.indexOf('user')) obj = await this.userRepo.findOne(id);

                        req.body[key] = obj;

                    }else if (id.constructor == Array){
                        let objs;

                        if(cleanKey.indexOf('comment') != -1) objs = await this.commentRepo.findByIds(id);
                        else if(cleanKey.indexOf('ingredient') != -1) objs = await this.ingredientRepo.findByIds(id);
                        else if(cleanKey.indexOf('menu') != -1) objs = await this.menuRepo.findByIds(id);
                        else if(cleanKey.indexOf('nutritionalInfo') != -1) objs = await this.nutritionalInfoRepo.findByIds(id);
                        else if(cleanKey.indexOf('post') != -1) objs = await this.postRepo.findByIds(id);
                        else if(cleanKey.indexOf('recipe') != -1) objs = await this.recipeRepo.findByIds(id);
                        else if(cleanKey.indexOf('user') != -1 || key.indexOf('requested') != -1 || key.indexOf('brigade') != -1) objs = await this.userRepo.findByIds(id);

                        req.body[key] = objs;
                    }else{
                        invalid = true;
                    }
                }
            }
        }catch(e){ }

        this.sendBack(req, res, next, invalid, 'Invalid form data');
    }

    auth = (req: Request, res: Response, next: NextFunction) => {
        let adminRestricted : boolean = req.url.indexOf('/admin') != -1;
        let loginRestricted : boolean = ['/login', '/signup', '/reset'].indexOf(req.url) != -1 || req.url.indexOf('/payment') != -1 || req.url.indexOf('/pending') != -1 || req.url.indexOf('/verify') != -1;
        let userRestricted : boolean = ['/', '/login', '/signup', '/terms', '/privacy'].indexOf(req.url) == -1 && req.url.indexOf('/reset') == -1;

        if((adminRestricted && req.session.admin) || (userRestricted && req.session.userID && !req.session.pending) || (!userRestricted && !req.session.userID)){
            if(req.session.userID){
                this.sendBack(req, res, next, req.session.paymentStatus != 'ACTIVE' && !req.session.admin && req.session.paid && req.method != 'GET' && req.url != '/logout');
            }else{
                next();
            }
        }else if((adminRestricted && !req.session.admin) || (userRestricted && !req.session.userID)){
            res.redirect('/login');
        }else if(userRestricted && req.session.pending && req.url.indexOf('/payment') == -1 && req.url.indexOf('/pending') == -1 && req.url.indexOf('/verify') == -1){
            res.redirect('/pending');
        }else if(loginRestricted && req.session.userID && !req.session.pending){
            res.redirect('/users/' + req.session.userID);
        }else{
            next();
        }
    }

    errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
        this.sendBack(req, res, next, true, err.message);
    }

    sendBack(req: Request, res: Response, next: NextFunction, condition: boolean, err? : string){
        if(condition){
            if(err){
                req.flash('error', err);
            }

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
