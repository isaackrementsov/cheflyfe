import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import {unlink} from '../util/typeDefs';
import User from '../entity/User';
import Record from '../entity/Record';
import Middleware from '../util/Middleware';
import PaymentManager from '../managers/PaymentManager';
import EmailManager from '../managers/EmailManager';

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
                .where('(user.username like :q OR user.username = :p) AND user.id != :id', {
                    p: req.query.q,
                    q: `%${req.query.q}%`,
                    id: req.session.userID
                })
                .getMany();

            res.render('usersSearch', {users, session: req.session, error: req.flash('error'), query: req.query.q});
        }catch(e){
            req.flash('error', 'There was an error searching users');
            res.redirect(`/users/${req.session.userID}`)
        }
    }

    getPending = async (req: Request, res: Response) => {
        res.render('pending', {session: req.session, error: req.flash('error')});
    }

    getVerify = async (req: Request, res: Response) => {
        try {
            let user : User = await this.userRepo.findOne({authKey: req.query.authKey});

            if(user){
                user.emailPending = false;

                await this.userRepo.save(user);

                req.session.emailPending = false;

                res.redirect('/users/' + req.session.userID);
            }else{
                throw new Error();
            }
        }catch(e){
            console.log(e);
            if(!res.headersSent){
                req.flash('error', 'There was an error verifying your email')
                res.redirect('/pending');
            }
        }
    }

    getReset = async (req: Request, res: Response) => {
        res.render('reset', {session: req.session, error: req.flash('error')})
    }

    getFinishReset = async (req: Request, res: Response) => {
        try {
            let user : User = await this.userRepo.findOne({authKey: req.query.authKey});

            if(user){
                if(user.tempPassword){
                    user.password = user.tempPassword;
                    user.tempPassword = null;

                    await this.userRepo.save(user);
                }
            }else{
                throw new Error();
            }
        }catch(e){
            req.flash('error', 'There was an error resetting your password');
        }

        res.redirect('/login');
    }

    postSendResetEmail = async (req: Request, res: Response) => {
        try {
            let toUpdate : User = await this.userRepo.findOne({email: req.body.email});

            if(toUpdate){
                if(!toUpdate.emailPending){
                    await EmailManager.sendEmail(req.body.email, {
                        subject: 'Password Reset Requested',
                        html: `Hi ${toUpdate.name.first} ${toUpdate.name.last},<br>
                        A password reset has been requested for your account.
                        To confirm this change,
                        please <a href="https://cheflyfe.com/reset/confirm?authKey=${toUpdate.authKey}">click</a> this link.
                        If you did not request the change, don't click the above link.<br>
                        Regards,<br>
                        Cheflyfe Team`
                    });

                    toUpdate.tempPassword = req.body.temp;
                    await this.userRepo.save(toUpdate);
                }else{
                    throw new Error();
                }
            }else{
                throw new Error();
            }
        }catch(e){
            req.flash('error', 'There was an error sending reset email');
        }

        res.redirect('/login');
    }

    postLogin = async (req: Request, res: Response, created?: boolean) => {
        try {
            let user : User = await this.userRepo.findOne({
                'username': req.body.username,
                'password': req.body.password
            });

            if(user){
                await this.recordRepo.save(new Record('session'));

                PaymentManager.getSubscriptionStatus(user.paymentKey == '' ? 'NaN' : user.paymentKey, async status => {
                    try {
                        req.session.username = user.username;
                        req.session.userID = user.id;
                        req.session.admin = user.admin;
                        req.session.avatar = user.avatar;
                        req.session.currency = user.currency;
                        req.session.system = user.system;
                        req.session.paid = user.paymentKey != '';
                        req.session.pending = (status != 'ACTIVE' || user.emailPending) && !user.admin && !req.session.paid;
                        req.session.paymentStatus = user.paymentStatus;
                        req.session.emailPending = user.emailPending;

                        if(status != user.paymentStatus){
                            user.paymentStatus = status;

                            await this.userRepo.save(user);
                        }

                        if(user.admin){
                            res.redirect('/admin');
                        }else{
                            if(created){
                                res.redirect('/payment');
                            }else{
                                res.redirect('/users/' + user.id);
                            }
                        }
                    }catch(e){
                        if(!res.headersSent){
                            req.flash('error', 'There was an error logging you in');
                            res.redirect('/login');
                        }
                    }
                }, err => {
                    if(!res.headersSent){
                        req.flash('error', 'There was an error getting your payment status');
                        res.redirect('/login');
                    }
                });
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
            let {id} = await this.userRepo.save(user);

            try {
                await EmailManager.sendEmail(user.email, {
                    subject: 'Verify your email',
                    html: `Hello ${user.name.first} ${user.name.last},<br>
                    To use your ChefLyfe account,
                    please <a href="https://cheflyfe.com/verify?authKey=${user.authKey}">verify</a> that your email is ${user.email}.
                    Your account may be deleted if you do not confirm.<br>
                    Regards,<br>
                    Cheflyfe Team`
                });

                this.postLogin(req, res, true);
            }catch(e){
                try {
                    await this.userRepo.delete(id);
                    await unlink(__dirname + '/../../public' + req.files['avatarUpl'].path);
                }catch(e){ }

                req.flash('error', 'There was an error verifying your email');
                res.redirect('/signup');
            }
        }catch(e){
            if(e.errno == 1062){
                try {
                    let duplicate = await this.userRepo.findOne({email: req.body.email});

                    if(duplicate){
                        let daysAgo = (new Date().valueOf() - new Date(duplicate.timestamp).valueOf())/86400000;

                        if(daysAgo >= 4 && duplicate.emailPending && !duplicate.admin){
                            await this.userRepo.remove(duplicate);
                            await this.userRepo.save(user);
                        }else{
                            throw new Error();
                        }

                        this.postLogin(req, res, true);
                    }else{
                        throw new Error();
                    }
                }catch(e){
                    if(!res.headersSent){
                        req.flash('error', 'Username and email must be unique');
                        res.redirect('/signup');
                    }
                }
            }else{
                if(!res.headersSent){
                    req.flash('error', 'There was an error signing you up');
                    res.redirect('/signup');
                }
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

            delete update['admin'];
            delete update['paymentKey'];
            delete update['paymentStatus'];
            delete update['emailPending'];
            delete update['password'];
            delete update['email'];
            delete update['username'];

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
