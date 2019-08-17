import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Ingredient from '../entity/Ingredient';
import User from '../entity/User';
import NutritionalInfo from '../entity/NutritionalInfo';
import Middleware from '../util/Middleware';
import * as csvParser from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';
import { UnitQt } from '../util/typeDefs';

//TODO: add CSV ingredient batch uplaod, keywords, prep time, video?, add required to all non-optional inputs
export default class IngredientController {

    private ingredientRepo : Repository<Ingredient>;
    private userRepo : Repository<User>;

    getAll = async (req: Request, res: Response) => {
        let ingredients : Ingredient[] = await this.ingredientRepo.createQueryBuilder('ingredient')
            .leftJoinAndSelect('ingredient.recipes', 'recipes')
            .leftJoinAndSelect('ingredient.author', 'author')
            .leftJoinAndSelect('ingredient.nutritionalInfo', 'nutritionalInfo')
            .where('author.id = :userID', {userID: req.session.userID})
            .getMany()

        res.render('ingredients', {ingredients: ingredients, session: req.session});
    }

    getExport = async (req: Request, res: Response) => {

    }

    postCreate = async (req: Request, res: Response) => {
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
                    return isNaN(obj[k][j]);
                });

                if(nestedInvalid.length > 0) return obj[k];
            }else{
                return isNaN(obj[k]);
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

        res.redirect('/ingredients');
    }

    postCreateCSV = async (req: Request, res: Response) => {
        if(req.files){
            if(req.files['csvUpl']){
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
                                    return isNaN(obj[k][j]);
                                });

                                if(nestedInvalid.length > 0) return obj[k];
                            }else{
                                return isNaN(obj[k]);
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

                        let ingredient : Ingredient = new Ingredient({
                            name: row.Name,
                            description: row.Description || 'no description',
                            brand: row.Brand || 'no brand',
                            wastage: row.Wastage,
                            price: {val: row.Price_val, qt: row.Price_qt, units: row.Price_units},
                            conversions: conversions,
                            allergens: row.Allergens.split(','),
                            nutritionalInfo: n,
                            author: await this.userRepo.findOne(req.session.userID)
                        });

                        await this.ingredientRepo.save(ingredient);

                    })
                    .on('end', () => {
                        fs.unlinkSync(p);
                        res.redirect('/ingredients');
                    });
            }else{
                res.redirect('/ingredients');
            }
        }else{
            res.redirect('/ingredients');
        }
    }

    patchUpdate = async (req: Request, res: Response) => {
        let update = Middleware.decodeBody(req.body);

        await this.ingredientRepo.createQueryBuilder('ingredient')
            .update().set(update)
            .where('authorId = :userID AND id = :id', {
                userID: req.session.userID,
                id: parseInt(req.params.id)
            })
            .execute();


        res.redirect('/ingredients');
    }

    delete = async (req: Request, res: Response) => {
        await this.ingredientRepo.createQueryBuilder()
            .delete()
            .where('authorId = :userID AND id = :id', {
                userID: req.session.userID,
                id: parseInt(req.params.id)
            })
            .execute();

        res.redirect('/ingredients');
    }

    constructor(){
        this.ingredientRepo = getRepository(Ingredient);
        this.userRepo = getRepository(User);
    }

}
