import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Record from '../entity/Record';
import User from '../entity/User';
import * as fs from 'fs';
import {createObjectCsvWriter} from 'csv-writer';

export default class AdminController {

    private recordRepo : Repository<Record>;
    private userRepo : Repository<User>;

    getIndex = async (req: Request, res: Response) => {
        let visits : Record[] = await this.recordRepo.find({select: ['timestamp'], where: {category: 'session'}});
        let ingredients : Record[] = await this.recordRepo.find({select: ['timestamp'], where: {category: 'ingredient'}});
        let recipes : Record[] = await this.recordRepo.find({select: ['timestamp'], where: {category: 'recipe'}});
        let menus : Record[] = await this.recordRepo.find({select: ['timestamp'], where: {category: 'menu'}});
        let posts : Record[] = await this.recordRepo.find({select: ['timestamp'], where: {category: 'post'}});
        let users : Record[] = await this.recordRepo.find({select: ['timestamp'], where: {category: 'user'}});
        let userData : User[] = await this.userRepo.find();

        res.render('admin', {visits, ingredients, recipes, menus, posts, users, userData, session: req.session});
    }

    getExportEmails = async (req: Request, res: Response) => { //TODO: make path joining consistent and efficient
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
            return {email: u.email, firstName: u.name.first, lastName: u.name.last}
        })).then(() => {
            res.download(`${__dirname}/../.${path}`, 'emails.csv', () => {
                fs.unlink(`${__dirname}/../.${path}`, () => {});
            });
        });
    }

    constructor(){
        this.recordRepo = getRepository(Record);
        this.userRepo = getRepository(User);
    }
}
