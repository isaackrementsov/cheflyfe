import {Request, Response} from 'express';
import { Repository, getRepository } from 'typeorm';
import Config from '../entity/Config';

export default class HomeController { //TODO: cleanup imports

    configRepo : Repository<Config>;

    getIndex = (req: Request, res: Response) => {
        res.render('index');
    }

    getTerms = async (req: Request, res: Response) => {
        let config : Config = await this.configRepo.findOne({category: 'terms'});

        res.render('terms', {path: config ? config.path : null, session: req.session});
    }

    getPrivacy = async (req: Request, res: Response) => {
        let config : Config = await this.configRepo.findOne({category: 'privacy'});

        res.render('privacy', {path: config ? config.path : null, session: req.session});
    }

    constructor(){
        this.configRepo = getRepository(Config);
    }

}
