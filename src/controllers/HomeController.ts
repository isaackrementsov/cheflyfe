import {Request, Response} from 'express';

class HomeController {

    getIndex = (req: Request, res: Response) => {
        res.render('index');
    }

}
