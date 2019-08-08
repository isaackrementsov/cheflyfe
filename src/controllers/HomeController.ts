import {Request, Response} from 'express';

export default class HomeController {

    getIndex = (req: Request, res: Response) => {
        console.log('fujck off');
        res.render('index');
    }

}
