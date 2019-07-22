import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import User from '../entity/User';

/*TODO:
    * Add payment & subscription
    * remove unecessary asyncs
    * replace `req.session.username` with `req.session.userID` for faster relational queries
*/
class UserController {

    userRepo : Repository<User>;

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

    postSignup = (req: Request, res: Response) => {
        let user : User = new User(
            JSON.parse(req.body.admin),
            req.body.password,
            req.body.email,
            {first: req.body.first, last: req.body.last},
            req.body.username
        );

        this.userRepo.save(user).then(() => {
            req.session.error = null;
            this.postLogin(req, res);
        }).catch(e => {
            req.session.error = 'Username must be unique';
            res.redirect('/login');
        });

    }

    postLogout = (req: Request, res: Response) => {
        req.session.destroy();

        res.redirect('/login');
    }

    patchUpdate = async (req: Request, res: Response) => {
        await this.userRepo.update(req.session.id, req.body);

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
