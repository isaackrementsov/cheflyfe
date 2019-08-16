import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import User from '../entity/User';
import Record from '../entity/Record';
import Middleware from '../util/Middleware';
import * as fs from 'fs';

/*TODO:
    * Add payment & subscription
*/
export default class UserController {

    private userRepo : Repository<User>;
    private recordRepo : Repository<Record>;

    getLogin = (req: Request, res: Response) => {
        req.session.page = 'login';
        res.render('login', {session: req.session});
    }

    getSignup = (req: Request, res: Response) => {
        req.session.page = 'signup';
        res.render('login', {session: req.session});
    }

    postLogin = async (req: Request, res: Response) => {
        let user : User = await this.userRepo.findOne({
            'username': req.body.username,
            'password': req.body.password
        });

        if(user){
            await this.recordRepo.save(new Record('session'));

            req.session.username = user.username;
            req.session.userID = user.id;
            req.session.admin = user.admin;
            req.session.avatar = user.avatar;
            req.session.error = null;

            if(user.admin){
                res.redirect('/admin');
            }else{
                res.redirect('/users/' + user.id);
            }
        }else{
            req.session.error = 'Invalid credentials';
            res.redirect('/login');
        }
    }

    postSignup = async (req: Request, res: Response) => {
        let user : User = new User({
            admin: false,
            password: req.body.password,
            email: req.body.email,
            avatar: req.files['avatarUpl'].path,
            name: {first: req.body.first, last: req.body.last},
            username: req.body.username
        });

        try {
            await this.userRepo.save(user);
            req.session.error = null;
            this.postLogin(req, res);
        }catch(e){
            req.session.error = 'Username must be unique';
            res.redirect('/signup');
        }

    }

    postLogout = async (req: Request, res: Response) => {
        await req.session.destroy(() => {});

        res.redirect('/login');
    }

    patchUpdate = async (req: Request, res: Response) => {
        let update = Middleware.decodeBody(req.body, req.files);

        if(update['requested'] || update['brigade']){
            let toUpdate : User = await this.userRepo.findOne(req.query.id ? parseInt(req.query.id) : req.session.userID);

            if(update['requested']) toUpdate.requested = update['requested'];
            if(update['brigade']) toUpdate.brigade = update['brigade'];

             await this.userRepo.save(toUpdate);
        }else{
            if(req.files){
                let toUpdate : User = await this.userRepo.findOne(req.session.userID, {select: ['background', 'avatar']});
                try{
                    if(update['avatar']){
                        fs.unlinkSync(__dirname + '/../../../public' + toUpdate.avatar);
                    }
                    if(update['background']){
                        fs.unlinkSync(__dirname + '/../../../public' + toUpdate.background);
                    }
                }catch(e){}
            }

            await this.userRepo.update(req.session.userID, update);
        }

        res.redirect('/users/' + (req.query.id || req.session.userID));
    }

    delete = async (req: Request, res: Response) => {
        await this.userRepo.delete(req.session.userID);

        res.redirect('/login');
    }

    constructor(){
        this.userRepo = getRepository(User);
        this.recordRepo = getRepository(Record);
    }

}
