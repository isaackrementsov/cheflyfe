import {Request, Response, NextFunction} from 'express';

export default class Middleware {

    auth = (req: Request, res: Response, next: NextFunction) => {
        let adminRestricted : boolean = req.url.indexOf('/admin') != -1;
        let userRestricted : boolean = !(req.url == '/' || req.url == '/login' || req.url == '/signup');

        if(adminRestricted && req.session.admin || userRestricted && req.session.username || !adminRestricted && !req.session.admin || !userRestricted && !req.session.username){
            next();
        }else if(adminRestricted && !req.session.admin || userRestricted && !req.session.username){
            res.redirect('/login');
        }else if(!userRestricted && req.session.user){
            res.redirect('/users/' + req.session.username);
        }
    }

}
