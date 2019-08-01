import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Ingredient from '../entity/Ingredient';
import User from '../entity/User';
import NutritionalInfo from '../entity/NutritionalInfo';
import Middleware from '../util/Middleware';

//TODO: add CSV ingredient batch uplaod, keywords, prep time, video?, add required to all non-optional inputs
export default class IngredientController {

    private ingredientRepo : Repository<Ingredient>;
    private userRepo : Repository<User>;

    getAll = async (req: Request, res: Response) => {
        let ingredients : Ingredient[] = await this.ingredientRepo.find({
            where: {'authorId': req.session.userID},
            relations: ['author', 'recipes'],
        });

        res.render('ingredients', {ingredients: ingredients, session: req.session});
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
                    return (obj[k][j] == '' || obj[k][j] == undefined);
                });

                if(nestedInvalid.length > 0) return obj[k];
            }else{
                return (obj[k] == '' || obj[k] == undefined);
            }
        });

        if(invalid.length == 0){
            n = new NutritionalInfo({
                calories: {total: req.body.calsOptJSON, fromFat: req.body.fatCalsOptJSON},
                fat: {total: req.body.fatOptJSON, saturated: req.body.satFatOptJSON, trans: req.body.transFatOptJSON},
                cholesterol: req.body.cholOptJSON,
                sodium: req.body.sodOptJSON,
                carbohydrates: {total: req.body.carbsOptJSON, fiber: req.body.fibOptJSON, sugar: req.body.sugOptJSON},
                protein: req.body.protOptJSON
            });
        }else{
            n = null;
        }

        let ingredient : Ingredient = new Ingredient({
            name: req.body.name,
            description: req.body.descriptionOptional || 'no description',
            brand: req.body.brandOptional || 'no brand',
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
