import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import {createObjectCsvWriter} from 'csv-writer';
import {UnitQt, PurchaseRecord, unlink} from '../util/typeDefs';
import Ingredient from '../entity/Ingredient';
import User from '../entity/User';
import NutritionalInfo from '../entity/NutritionalInfo';
import Config from '../entity/Config';
import Middleware from '../util/Middleware';
import * as csvParser from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';

//TODO: add CSV ingredient batch uplaod, keywords, prep time, video?, add required to all non-optional inputs
export default class IngredientController {

    private ingredientRepo : Repository<Ingredient>;
    private userRepo : Repository<User>;
    private configRepo : Repository<Config>;

    getAll = async (req: Request, res: Response) => {
        let ingredients : Ingredient[] = [];
        let config : Config = new Config({});

        try {
            ingredients = await this.ingredientRepo.createQueryBuilder('ingredient')
                .leftJoinAndSelect('ingredient.recipes', 'recipes')
                .leftJoinAndSelect('ingredient.author', 'author')
                .leftJoinAndSelect('ingredient.nutritionalInfo', 'nutritionalInfo')
                .where('author.id = :userID', {userID: req.session.userID})
                .getMany()

            config = await this.configRepo.findOne({category: 'ingredients'});
        }catch(e){
            req.flash('error', 'There was an issue finding ingredients')
        }


        res.render('ingredients', {ingredients, config, session: req.session, error: req.flash('error')});
    }

    getExport = async (req: Request, res: Response) => {
        let data : Ingredient[] = [];

        try {
            data = await this.ingredientRepo.createQueryBuilder('ingredient')
                .leftJoinAndSelect('ingredient.nutritionalInfo', 'nutritionalInfo')
                .where('ingredient.authorId = :userID', {userID: req.session.userID})
                .getMany();

            let path = `./public/img/tmp/ingredients-${req.session.userID}.csv`;
            let csv = createObjectCsvWriter({
                path: path,
                header: [
                    {id: 'name', title: 'Name'},
                    {id: 'brand', title: 'Brand'},
                    {id: 'description', title: 'Description'},
                    {id: 'wastage', title: 'Wastage'},
                    {id: 'priceVal', title: 'Price_val'},
                    {id: 'priceQt', title: 'Price_qt'},
                    {id: 'priceUnits', title: 'Price_units'},
                    {id: 'purchaseRecords', title: 'Purchase_records'},
                    {id: 'conversions', title: 'Conversions'},
                    {id: 'allergens', title: 'Allergens'},
                    {id: 'cholesterol', title: 'Cholesterol'},
                    {id: 'sodium', title: 'Sodium'},
                    {id: 'protein', title: 'Protein'},
                    {id: 'carbohydratesTotal', title: 'Carbohydrates_total'},
                    {id: 'carbohydratesFiber', title: 'Carbohydrates_fiber'},
                    {id: 'carbohydratesSugar', title: 'Carbohydrates_sugar'},
                    {id: 'caloriesTotal', title: 'Calories_total'},
                    {id: 'caloriesFromFat', title: 'Calories_from_fat'},
                    {id: 'fatTotal', title: 'Fat_total'},
                    {id: 'fatSaturated', title: 'Fat_saturated'},
                    {id: 'fatTrans', title: 'Fat_trans'},
                ]
            });

            csv.writeRecords(data.map(i => {
                let records = [];
                let conversions = [];
                let nutritionalInfo = {};

                i.purchaseRecords.map(r => {
                    let d = new Date(r.timestamp);

                    records.push(`[${r.val},${d.getUTCMonth() + 1}/${d.getDate()}/${d.getUTCFullYear()}]`);
                });

                i.conversions.map(c => {
                    conversions.push(`[${c.qt}, ${c.units}]`);
                });

                if(i.nutritionalInfo){
                    nutritionalInfo = {
                        cholesterol: i.nutritionalInfo.cholesterol,
                        sodium: i.nutritionalInfo.sodium,
                        protein: i.nutritionalInfo.protein,
                        carbohydratesTotal: i.nutritionalInfo.carbohydrates.total,
                        carbohydratesFiber: i.nutritionalInfo.carbohydrates.fiber,
                        carbohydratesSugar: i.nutritionalInfo.carbohydrates.sugar,
                        caloriesTotal: i.nutritionalInfo.calories.total,
                        caloriesFromFat: i.nutritionalInfo.calories.fromFat,
                        fatTotal: i.nutritionalInfo.fat.total,
                        fatSaturated: i.nutritionalInfo.fat.saturated,
                        fatTrans: i.nutritionalInfo.fat.trans
                    };
                }

                return {
                    name: i.name,
                    brand: i.brand,
                    description: i.description,
                    wastage: i.wastage,
                    priceVal: i.price.val,
                    priceQt: i.price.qt,
                    priceUnits: i.price.units,
                    purchaseRecords: records.join(','),
                    conversions: conversions.join(','),
                    allergens: i.allergens.join(','),
                    ...nutritionalInfo
                };
            })).then(() => {
                res.download(`${__dirname}/../.${path}`, 'ingredients.csv', () => {
                    fs.unlink(`${__dirname}/../.${path}`, () => {});
                });
            });
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'There was an issue converting to CSV');
                res.redirect('/ingredients');
            }
        }
    }

    postCreate = async (req: Request, res: Response) => {
        try {
            let n;
            let obj = {
                calories: {total: req.body.calsOptJSON, fromFat: req.body.fatCalsOptJSON},
                fat: {total: req.body.fatOptJSON, saturated: req.body.satFatOptJSON, trans: req.body.transFatOptJSON},
                cholesterol: req.body.cholOptJSON,
                sodium: req.body.sodOptJSON,
                carbohydrates: {total: req.body.carbsOptJSON, fiber: req.body.fibOptJSON, sugar: req.body.sugOptJSON},
                protein: req.body.protOptJSON
            };

            let invalid = Object.keys(obj).filter(k => {
                if(typeof obj[k] == 'object'){
                    let nestedInvalid = Object.keys(obj[k]).filter(j => {
                        return typeof obj[k][j] != 'number';
                    });

                    if(nestedInvalid.length > 0) return obj[k];
                }else{
                    return typeof obj[k] != 'number';
                }
            });

            if(invalid.length == 0){
                n = new NutritionalInfo(obj);
            }else{
                n = null;
            }

            let ingredient : Ingredient = new Ingredient({
                name: req.body.name,
                description: req.body.descriptionOpt || 'no description',
                brand: req.body.brandOpt || 'no brand',
                wastage: req.body.wastageJSON,
                price: {val: req.body.valJSON, qt: req.body.qtJSON, units: req.body.units},
                conversions: req.body.conversionsJSON,
                allergens: req.body.allergensJSON,
                nutritionalInfo: n,
                author: await this.userRepo.findOne(req.session.userID)
            });

            await this.ingredientRepo.save(ingredient);
        }catch(e){
            req.flash('error', 'There was an error creating ingredient');
        }

        res.redirect('/ingredients');
    }

    postCreateCSV = async (req: Request, res: Response) => {
        if(req.files){
            if(req.files['csvUpl']){
                try {
                    let p = path.join(__dirname, `../../../public/${req.files['csvUpl'].path}`);

                    fs.createReadStream(p)
                        .pipe(csvParser())
                        .on('data', async row => {
                            let n;
                            let obj = {
                                calories: {total: parseFloat(row.Calories_total), fromFat: parseFloat(row.Calories_from_fat)},
                                fat: {total: parseFloat(row.Fat_total), saturated: parseFloat(row.Fat_saturated), trans: parseFloat(row.Fat_trans)},
                                cholesterol: parseFloat(row.Cholesterol),
                                sodium: parseFloat(row.Sodium),
                                carbohydrates: {total: parseFloat(row.Carbohydrates_total), fiber: parseFloat(row.Carbohydrates_fiber), sugar: parseFloat(row.Carbohydrates_sugar)},
                                protein: parseFloat(row.Protein)
                            };

                            let invalid = Object.keys(obj).filter(k => {
                                if(typeof obj[k] == 'object'){
                                    let nestedInvalid = Object.keys(obj[k]).filter(j => {
                                        return typeof obj[k][j] != 'number';
                                    });

                                    if(nestedInvalid.length > 0) return obj[k];
                                }else{
                                    return typeof obj[k] != 'number';
                                }
                            });

                            if(invalid.length > 0){
                                n = new NutritionalInfo(obj);
                            }else{
                                n = null;
                            }

                            let c = row.Conversions.split(',');
                            let conversions : UnitQt[] = [];

                            for(let i = 1; i < c.length; i += 2){
                                let num = parseFloat(c[i - 1].replace('[', ''));
                                let units = c[i].replace(']', '');

                                conversions.push({qt: num, units: units});
                            }

                            let purchases : PurchaseRecord[] = [];

                            if(row.Purchase_records){
                                let p = row.Purchase_records.split(',');

                                for(let i = 1; i < p.length; i += 2){
                                    let val = parseFloat(p[i - 1].replace('[', ''));
                                    let timestamp = new Date(p[i].replace(']', ''));

                                    purchases.push({val, timestamp});
                                }
                            }

                            let ingredient : Ingredient = new Ingredient({
                                name: row.Name,
                                description: row.Description || 'no description',
                                brand: row.Brand || 'no brand',
                                wastage: row.Wastage,
                                price: {val: row.Price_val, qt: row.Price_qt, units: row.Price_units},
                                conversions: conversions,
                                allergens: row.Allergens.split(','),
                                nutritionalInfo: n,
                                purchaseRecords: purchases,
                                author: await this.userRepo.findOne(req.session.userID)
                            });

                            await this.ingredientRepo.save(ingredient);

                        })
                        .on('end', async () => {
                            try {
                                await unlink(p);
                            }catch(e){ }
                            res.redirect('/ingredients');
                        });
                }catch(e){
                    if(!res.headersSent){
                        req.flash('error', 'There was an issue parsing your CSV');
                        res.redirect('/ingredients');
                    }
                }
            }else{
                req.flash('error', 'There was an issue uploading files');
                res.redirect('/ingredients');
            }
        }else{
            req.flash('error', 'There was an issue uploading files');
            res.redirect('/ingredients');
        }
    }

    patchUpdate = async (req: Request, res: Response) => {
        let update = Middleware.decodeBody(req.body);

        try {
            await this.ingredientRepo.createQueryBuilder('ingredient')
                .update().set(update)
                .where('authorId = :userID AND id = :id', {
                    userID: req.session.userID,
                    id: parseInt(req.params.id)
                })
                .execute();
        }catch(e){
            req.flash('error', 'There was an issue updating the ingredient');
        }

        res.redirect('/ingredients');
    }

    delete = async (req: Request, res: Response) => {
        try {
            await this.ingredientRepo.createQueryBuilder()
                .delete()
                .where('authorId = :userID AND id = :id', {
                    userID: req.session.userID,
                    id: parseInt(req.params.id)
                })
                .execute();
        }catch(e){
            req.flash('error', 'There was an issue deleting the ingredient');
        }

        res.redirect('/ingredients');
    }

    constructor(){
        this.ingredientRepo = getRepository(Ingredient);
        this.userRepo = getRepository(User);
        this.configRepo = getRepository(Config);
    }

}
