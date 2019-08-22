import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Config from '../entity/Config';

export default class HomeController { //TODO: cleanup imports

    configRepo : Repository<Config>;

    getIndex = (req: Request, res: Response) => {
        res.render('index', {session: req.session, error: req.flash('error')});
    }

    getTerms = async (req: Request, res: Response) => {
        let config : Config;
        try {
            config = await this.configRepo.findOne({category: 'terms'});
        }catch(e){ }

        res.render('terms', {path: config ? config.path : null, session: req.session, error: req.flash('error')});
    }

    getPrivacy = async (req: Request, res: Response) => {
        let config : Config;
        try {
            config = await this.configRepo.findOne({category: 'privacy'});
        }catch(e){ }

        res.render('privacy', {path: config ? config.path : null, session: req.session, error: req.flash('error')});
    }

    constructor(){
        this.configRepo = getRepository(Config);
    }

}
