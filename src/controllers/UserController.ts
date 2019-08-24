import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import {unlink} from '../util/typeDefs';
import User from '../entity/User';
import Record from '../entity/Record';
import Middleware from '../util/Middleware';
import * as nodemailer from 'nodemailer';

/*TODO:
    * Add payment & subscription
*/
export default class UserController {

    private userRepo : Repository<User>;
    private recordRepo : Repository<Record>;

    getLogin = (req: Request, res: Response) => {
        req.session.page = 'login';
        res.render('login', {session: req.session, error: req.flash('error')});
    }

    getSignup = (req: Request, res: Response) => {
        req.session.page = 'signup';
        res.render('login', {session: req.session, error: req.flash('error')});
    }

    getSearchAll = async (req: Request, res: Response) => {
        try {
            let users : User[] = await this.userRepo.createQueryBuilder('user')
                .leftJoinAndSelect('user.requested', 'requested')
                .leftJoinAndSelect('user.brigade', 'brigade')
                .where('user.username like :q AND user.id != :id', {q: `%${req.query.q}%`, id: req.session.userID})
                .getMany();

            res.render('usersSearch', {users, session: req.session, error: req.flash('error'), query: req.query.q});
        }catch(e){
            req.flash('error', 'There was an error searching users');
            res.redirect(`/users/${req.session.userID}`)
        }
    }

    postLogin = async (req: Request, res: Response) => {
        try {
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
                req.session.currency = user.currency;
                req.session.system = user.system;
                req.session.pending = user.pending;

                if(user.admin){
                    res.redirect('/admin');
                }else{
                    res.redirect('/users/' + user.id);
                }
            }else{
                req.flash('error', 'Invalid login details');
                res.redirect('/login');
            }
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'There was an error logging in');
                res.redirect('/login');
            }
        }
    }

    postSignup = async (req: Request, res: Response) => {
        try {
            let user : User = new User({
                admin: false,
                password: req.body.password,
                email: req.body.email,
                avatar: req.files['avatarUpl'].path,
                name: {first: req.body.first, last: req.body.last},
                username: req.body.username,
                system: req.body.system,
                currency: req.body.currency
            });

            try {
                await this.userRepo.save(user);

                /*let account = await nodemailer.createTestAccount(); TODO: figure out email & verification stuff, add pending to middleware
                let transport = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 465,
                    secure: true,
                    auth: {
                        user: account.user,
                        pass: account.pass
                    }
                });
                let info = await transport.sendMail({
                    from: 'ChefLyfe Support <support@cheflyfe.com>',
                    to: user.email,
                    subject: 'Verify your email',
                    html: `To use your ChefLyfe account, please <a href="https://cheflyfe.com/verify?authKey=${user.authKey}">verify</a> that your account is ${user.email}`
                });*/

                this.postLogin(req, res);
            }catch(e){
                console.log(e);
                try {
                    await unlink(__dirname + '/../../public' + req.files['avatarUpl'].avatar);
                }catch(e){ }

                req.flash('error', 'Username and email must be unique');
                res.redirect('/signup');
            }
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'There was an error signing you up');
                res.redirect('/signup');
            }
        }
    }

    postLogout = async (req: Request, res: Response) => {
        try {
            await req.session.destroy(() => {});
        }catch(e){
            req.flash('error', 'There was an error logging you out');
        }

        res.redirect('/login');
    }

    patchUpdate = async (req: Request, res: Response) => {
        try {
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
                            try {
                                await unlink(__dirname + '/../../public' + toUpdate.avatar);
                            }catch(e){ }
                        }
                        if(update['background']){
                            try {
                                await unlink(__dirname + '/../../public' + toUpdate.background);
                            }catch(e){ }
                        }
                    }catch(e){}
                }

                Object.assign(req.session, update);

                await this.userRepo.update(req.session.userID, update);
            }
        }catch(e){
            req.flash('There was an error updating user');
        }

        res.redirect('/users/' + (req.query.id || req.session.userID));
    }

    delete = async (req: Request, res: Response) => {
        try {
            await this.userRepo.delete(req.session.userID);
            await req.session.destroy(() => {});
        }catch(e){
            req.flash('error', 'There was an error deleting your account');
        }

        res.redirect('/login');
    }

    constructor(){
        this.userRepo = getRepository(User);
        this.recordRepo = getRepository(Record);
    }

}
