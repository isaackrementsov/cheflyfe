import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Ingredient from '../entity/Ingredient';
import User from '../entity/User';
import NutritionalInfo from '../entity/NutritionalInfo';
import Middleware from '../util/Middleware';

//TODO: add CSV ingredient batch uplaod
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
        let n : NutritionalInfo = new NutritionalInfo({info: req.body.nutritionalInfoJSON});
        let ingredient : Ingredient = new Ingredient({
            name: req.body.name,
            brand: req.body.brandOptional || 'none',
            wastage: req.body.wastage,
            price: {val: req.body.val, qt: req.body.qt, units: req.body.unit},
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
