import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import {unlink} from '../util/typeDefs';
import User from '../entity/User';
import Record from '../entity/Record';
import Middleware from '../util/Middleware';
import PaymentManager from '../managers/PaymentManager';
import EmailManager from '../managers/EmailManager';
import Ingredient from '../entity/Ingredient';
import Recipe from '../entity/Recipe';
import Menu from '../entity/Menu';
import Post from '../entity/Post';
import Comment from '../entity/Comment';

/*TODO:
    * Add payment & subscription
*/
export default class UserController {

    private userRepo : Repository<User>;
    private recordRepo : Repository<Record>;
    private ingredientRepo : Repository<Ingredient>;
    private recipeRepo : Repository<Recipe>;
    private menuRepo : Repository<Menu>;
    private postRepo : Repository<Post>;
    private commentRepo : Repository<Comment>;

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
                .where('(user.username like :q OR user.username = :p) AND user.id != :id AND user.admin = :no', {
                    p: req.query.q,
                    q: `%${req.query.q}%`,
                    id: req.session.userID,
                    no: false
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
                req.session.pending = req.session.emailPending || req.session.paymentStatus != 'ACTIVE';

                res.redirect('/users/' + req.session.userID);
            }else{
                throw new Error();
            }
        }catch(e){
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

                let status = await PaymentManager.getSubscriptionStatus(user.paymentKey);

                let expired = false;

                if(user.paymentNotRequired && user.expires){
                    if(new Date(user.expires).valueOf() <= new Date().valueOf()){
                        user.paymentNotRequired = false;
                        expired = true;
                        status = 'MISSING';
                    }
                }

                if(status == 'TRIALING') status = 'ACTIVE';

                req.session.username = user.username;
                req.session.password = user.password;
                req.session.email = user.email;
                req.session.userID = user.id;
                req.session.admin = user.admin;
                req.session.avatar = user.avatar;
                req.session.currency = user.currency;
                req.session.system = user.system;
                req.session.paymentNotRequired = user.paymentNotRequired;
                req.session.paid = user.paymentKey != '';
                req.session.paymentStatus = user.paymentNotRequired ? 'ACTIVE' : status;
                req.session.pending = (req.session.paymentStatus != 'ACTIVE' || user.emailPending) && !user.admin && !req.session.paid;
                req.session.emailPending = user.emailPending;
                req.session.hasUsedFreeTrial = user.hasUsedFreeTrial;

                if(status != user.paymentStatus){
                    user.paymentStatus = status;

                    if(expired){
                        user.expires = null;
                    }
                    await this.userRepo.save(user);
                }

                if(user.admin){
                    res.redirect('/admin');
                }else{
                    if(created === true){
                        res.redirect('/pending');
                    }else{
                        res.redirect('/users/' + user.id);
                    }
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
                avatar: req.files ? req.files['avatarUpl'].path : '/img/static/generic-profile.jpg',
                name: {first: req.body.first, last: req.body.last},
                username: req.body.username,
                system: req.body.system,
                currency: req.body.currency
            });

            try {
                let {id} = await this.userRepo.save(user);

                try {
                    await EmailManager.sendVerificationEmail(user);

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
        }catch(e){
            req.flash('error', 'There was an error with form data');
            res.redirect('/signup');
        }
    }

    postReverify = async (req: Request, res: Response) => {
        try {
            let user : User = await this.userRepo.findOne({id: req.session.userID});

            if(user.emailPending){
                await EmailManager.sendVerificationEmail(user);
            }

            res.redirect('/pending');
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'There was an error resending email');
                res.redirect('/pending');
            }
        }
    }

    postAdminSignup = async (req: Request, res: Response) => {
        try {
            let user : User = new User({
                admin: req.body.adminJSON || false,
                password: req.body.password,
                email: req.body.email,
                avatar: req.files ? req.files['avatarUpl'].path : '/img/static/generic-profile.jpg',
                name: {first: req.body.first, last: req.body.last},
                username: req.body.username,
                system: req.body.system,
                currency: req.body.currency,
                paymentNotRequired: true,
                emailPending: false,
                paymentStatus: 'ACTIVE',
                paymentKey: 'NaN',
                expires: req.body.adminJSON && req.body.expiresOpt ? null : new Date(req.body.expiresOpt + ' 00:00')
            });

            await this.userRepo.save(user);
        }catch(e){
            req.flash('error', 'There was an error saving user. Make sure email and username are unique');
        }

        res.redirect('/admin');
    }

    postLogout = async (req: Request, res: Response) => {
        try {
            await req.session.destroy(() => {});
        }catch(e){
            req.flash('error', 'There was an error logging you out');
        }

        res.redirect('/login');
    }

    patchUpdateEmail = async (req: Request, res: Response) => {
        try {
            let user : User = await this.userRepo.findOne(req.session.userID);

            if(user.emailPending){
                user.email = req.body.email;

                try {
                    await this.userRepo.save(user);
                }catch(e){
                    req.flash('error', 'Email must be unique');
                }

                req.session.email = user.email;

                res.redirect('/pending');
            }
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'There was an error changing email');
                res.redirect('/pending');
            }
        }
    }

    patchUpdate = async (req: Request, res: Response) => {
        try {
            let update = Middleware.decodeBody(req.body, req.files);

            delete update['admin'];
            delete update['paymentKey'];
            delete update['paymentStatus'];
            delete update['hasUsedFreeTrial'];
            delete update['paymentNotRequired'];
            delete update['emailPending'];
            delete update['password'];
            delete update['username'];
            delete update['email'];

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
            req.flash('error', 'here was an error updating user');
        }

        res.redirect('/users/' + (req.query.id || req.session.userID));
    }

    delete = async (req: Request, res: Response, external?: boolean) => {
        try {
            if(external == true || req.session.admin){
                let toDelete = await this.userRepo.findOne(external == true ? req.session.userID : req.params.id, {
                    relations: ['ingredients', 'recipes', 'menus', 'posts', 'comments']
                });

                if(toDelete){
                    if(toDelete.paymentKey != ''){
                        try {
                            await PaymentManager.cancelUserSubscription(toDelete.paymentKey);
                        }catch(e){ }
                    };

                    if(toDelete.ingredients) await this.ingredientRepo.remove(toDelete.ingredients);
                    if(toDelete.recipes) await this.recipeRepo.remove(toDelete.recipes);
                    if(toDelete.menus) await this.menuRepo.remove(toDelete.menus);
                    if(toDelete.posts) await this.postRepo.remove(toDelete.posts);
                    if(toDelete.comments) await this.commentRepo.remove(toDelete.comments);

                    await this.userRepo.remove(toDelete);
                }

                if(external == true){
                    await req.session.destroy(() => {});
                }
            }
        }catch(e){
            req.flash('error', 'There was an error deleting account');
        }

        if(external != true){
            res.redirect('/admin');
        }
    }

    constructor(){
        this.userRepo = getRepository(User);
        this.recordRepo = getRepository(Record);
        this.ingredientRepo = getRepository(Ingredient);
        this.recipeRepo = getRepository(Recipe);
        this.menuRepo = getRepository(Menu);
        this.postRepo = getRepository(Post);
        this.commentRepo = getRepository(Comment);
    }

}
