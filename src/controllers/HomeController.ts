import {Request, Response} from 'express';

export default class HomeController {

    getIndex = (req: Request, res: Response) => {
        res.render('index');
    }

}
