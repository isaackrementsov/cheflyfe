import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import {createObjectCsvWriter} from 'csv-writer';
import {unlink} from '../util/typeDefs';
import Record from '../entity/Record';
import User from '../entity/User';
import Config from '../entity/Config';
import HowTo from '../entity/HowTo';
import * as fs from 'fs';
import PaymentManager from '../managers/PaymentManager';

let landingJSON = require('../util/landing.json');

export default class AdminController {

    private recordRepo : Repository<Record>;
    private userRepo : Repository<User>;
    private configRepo : Repository<Config>;
    private howToRepo : Repository<HowTo>;

    getIndex = async (req: Request, res: Response) => {
        let visits, ingredients, recipes, menus, posts, users : Record[] = [];
        let userData : User[] = [];
        let howTos : HowTo[] = [];

        try {
            visits = await this.recordRepo.find({select: ['timestamp'], where: {category: 'session'}});
            ingredients= await this.recordRepo.find({select: ['timestamp'], where: {category: 'ingredient'}});
            recipes = await this.recordRepo.find({select: ['timestamp'], where: {category: 'recipe'}});
            menus = await this.recordRepo.find({select: ['timestamp'], where: {category: 'menu'}});
            posts = await this.recordRepo.find({select: ['timestamp'], where: {category: 'post'}});
            users = await this.recordRepo.find({select: ['timestamp'], where: {category: 'user'}});
            userData = await this.userRepo.find();
            howTos = await this.howToRepo.find();
        }catch(e){ }

        res.render('admin', {visits, ingredients, recipes, menus, posts, users, userData, howTos, landing: landingJSON, session: req.session, error: req.flash('error')});
    }

    getExportEmails = async (req: Request, res: Response) => { //TODO: make path joining consistent and efficient
        try {
            let data : User[] = await this.userRepo.find({select: ['email', 'name']});
            let path = './public/img/tmp/emails.csv';
            let csv = createObjectCsvWriter({
                path: path,
                header: [
                    {id: 'email', title: 'Email'},
                    {id: 'firstName', title: 'First Name'},
                    {id: 'lastName', title: 'Last Name'}
                ]
            });

            csv.writeRecords(data.map(u => {
                return {email: u.email, firstName: u.name.first, lastName: u.name.last};
            })).then(() => {
                res.download(`${__dirname}/../.${path}`, 'emails.csv', () => {
                    fs.unlink(`${__dirname}/../.${path}`, () => {});
                });
            });
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'Download Failed');
                res.redirect(req.header('Referer'));
            }
        }
    }

    postUpl = async (req: Request, res: Response) => {
        try {
            let category;
            let path;

            if(req.files['termsPDFUpl']){
                category = 'terms';
                path = req.files['termsPDFUpl'].path;
            }else if(req.files['privacyPDFUpl']){
                category = 'privacy';
                path = req.files['privacyPDFUpl'].path;
            }

            let existing : Config = await this.configRepo.findOne({category});

            if(!existing){
                existing = new Config({category, path});
            }else{
                existing.category = category;

                try {
                    await unlink(__dirname + '/../../public' + existing.path);
                }catch(e){ }

                existing.path = path;
            }

            await this.configRepo.save(existing);

            res.redirect('/admin');
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'Download Failed');
                res.redirect(req.header('Referer'));
            }
        }
    }

    postCreateHowTo = async (req: Request, res: Response) => {
        try {
            let howTo : HowTo = new HowTo({link: req.body.link, description: req.body.description});

            await this.howToRepo.save(howTo);
        }catch(e){
            req.flash('error', 'There was an error saving how-to');
        }

        res.redirect('/admin');
    }

    patchUpdate = (req: Request, res: Response) => {
        Object.assign(landingJSON, req.body);

        fs.writeFile(__dirname + '/../util/landing.json', JSON.stringify(landingJSON), () => {
            res.redirect('/admin');
        });
    }

    patchPromoteDemote = async (req: Request, res: Response) => {
        try {
            let toUpdate = await this.userRepo.findOne(parseInt(req.params.id));
            let key = toUpdate.paymentKey;

            toUpdate.admin = !toUpdate.admin;

            await this.userRepo.save(toUpdate);

            if(key != '') await PaymentManager.cancelUserSubscription(key);
        }catch(e){
            req.flash('error', 'There was an error changing user status')
        }

        res.redirect('/admin');
    }

    patchDate = async (req: Request, res: Response) => {
        try {
            await this.userRepo.update(parseInt(req.params.id), {expires: new Date(req.body.expires + ' 00:00')});
        }catch(e){
            req.flash('error', 'There was an error changing user date');
        }

        res.redirect('/admin');
    }

    deleteHowTo = async (req: Request, res: Response) => {
        try {
            await this.howToRepo.delete(parseInt(req.params.id));
        }catch(e){
            req.flash('error', 'There was an error deleting how-to');
        }

        res.redirect('/admin');
    }

    constructor(){
        this.recordRepo = getRepository(Record);
        this.userRepo = getRepository(User);
        this.configRepo = getRepository(Config);
        this.howToRepo = getRepository(HowTo);
    }
}
