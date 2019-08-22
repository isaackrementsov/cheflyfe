import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import {createObjectCsvWriter} from 'csv-writer';
import Record from '../entity/Record';
import User from '../entity/User';
import Config from '../entity/Config';
import * as fs from 'fs';

export default class AdminController {

    private recordRepo : Repository<Record>;
    private userRepo : Repository<User>;
    private configRepo : Repository<Config>;

    getIndex = async (req: Request, res: Response) => {
        let visits, ingredients, recipes, menus, posts, users : Record[] = [];
        let userData : User[];

        try {
            visits = await this.recordRepo.find({select: ['timestamp'], where: {category: 'session'}});
            ingredients= await this.recordRepo.find({select: ['timestamp'], where: {category: 'ingredient'}});
            recipes = await this.recordRepo.find({select: ['timestamp'], where: {category: 'recipe'}});
            menus = await this.recordRepo.find({select: ['timestamp'], where: {category: 'menu'}});
            posts = await this.recordRepo.find({select: ['timestamp'], where: {category: 'post'}});
            users = await this.recordRepo.find({select: ['timestamp'], where: {category: 'user'}});
            userData = await this.userRepo.find();
        }catch(e){ }

        res.render('admin', {visits, ingredients, recipes, menus, posts, users, userData, session: req.session, error: req.flash('error')});
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
                    await fs.unlink(existing.path, () => {});
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

    constructor(){
        this.recordRepo = getRepository(Record);
        this.userRepo = getRepository(User);
        this.configRepo = getRepository(Config);
    }
}
