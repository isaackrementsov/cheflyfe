import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Config from '../entity/Config';
import Post from '../entity/Post';
import HowTo from '../entity/HowTo';

let landingJSON = require('../util/landing.json');

export default class HomeController { //TODO: cleanup imports

    postRepo : Repository<Post>;
    configRepo : Repository<Config>;
    howToRepo : Repository<HowTo>;

    getIndex = async (req: Request, res: Response) => {
        let posts : Post[] = await this.postRepo.createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .where('author.admin = :yes AND post.landing = :yes', {yes: true})
            .limit(3)
            .getMany();

        res.render('index', {posts, session: req.session, landing: landingJSON, error: req.flash('error'), home: true});
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

    getHowTo = async (req: Request, res: Response) => {
        let howTos : HowTo[] = [];

        try {
            howTos = await this.howToRepo.find();
        }catch(e){
            req.flash('error', 'There was an error getting how-tos');
        }

        res.render('howTos', {howTos, session: req.session});
    }

    constructor(){
        this.postRepo = getRepository(Post);
        this.configRepo = getRepository(Config);
        this.howToRepo = getRepository(HowTo);
    }

}
