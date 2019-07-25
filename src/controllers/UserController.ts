import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import User from '../entity/User';
import Middleware from '../util/Middleware';

/*TODO:
    * Add payment & subscription
*/
export default class UserController {

    private userRepo : Repository<User>;

    getLogin = (req: Request, res: Response) => {
        res.render('login', {session: req.session});
    }

    postLogin = async (req: Request, res: Response) => {
        let user : User = await this.userRepo.findOne({
            'username': req.body.username,
            'password': req.body.password
        });

        if(user){
            req.session.username = user.username;
            req.session.userID = user.id;
            req.session.admin = user.admin;

            res.redirect('/user/' + user.id);
        }else{
            req.session.error = 'Invalid credentials';
            req.session.page = 'login';

            res.redirect('/login');
        }
    }

    postSignup = async (req: Request, res: Response) => {
        let user : User = new User({
            admin: req.body.adminJSON,
            password: req.body.password,
            email: req.body.email,
            avatar: req.files['avatar'].path,
            name: {first: req.body.first, last: req.body.last},
            username: req.body.username
        });

        try {
            await this.userRepo.save(user);
            req.session.error = null;
            this.postLogin(req, res);
        }catch(e){
            req.session.error = 'Username must be unique';
            res.redirect('/login');
        }

    }

    postLogout = async (req: Request, res: Response) => {
        await req.session.destroy(() => {});

        res.redirect('/login');
    }

    patchUpdate = async (req: Request, res: Response) => {
        let update = Middleware.decodeBody(req.body, req.files);

        if(req.files){
            req.body.avatar = req.files['logo'].path;
        }

        await this.userRepo.update(req.session.id, update);

        res.redirect('/user/' + req.session.id);
    }

    delete = async (req: Request, res: Response) => {
        await this.userRepo.delete(req.session.id);

        res.redirect('/login');
    }

    constructor(){
        this.userRepo = getRepository(User);
    }

}
