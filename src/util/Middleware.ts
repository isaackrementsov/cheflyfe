import {Request, Response, NextFunction} from 'express';

export default class Middleware {

    auth = (req: Request, res: Response, next: NextFunction) => {
        next();
    }

}
