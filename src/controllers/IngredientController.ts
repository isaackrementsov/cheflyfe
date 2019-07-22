import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Ingredient from '../entity/Ingredient';
import User from '../entity/User';
import NutritionalInfo from '../entity/NutritionalInfo';

class IngredientController {

    ingredientRepo : Repository<Ingredient>;
    userRepo : Repository<User>;

    getAll = async (req: Request, res: Response) => {
        let ingredients : Ingredient[] = await this.ingredientRepo.find({
            where: {'author.username': req.session.username},
            relations: ['author', 'recipes'],
        });

        res.render('ingredients', {ingredients: ingredients, session: req.session});
    }

    postCreate = async (req: Request, res: Response) => {
        let nutritionalInfo : NutritionalInfo = new NutritionalInfo(
            JSON.parse(req.body.nutritionalInfo)
        );
        let ingredient : Ingredient = new Ingredient(
            req.body.name,
            req.body.brand || 'none',
            req.body.wastage,
            {val: req.body.val, qt: req.body.qt, units: req.body.unit},
            JSON.parse(req.body.conversions),
            JSON.parse(req.body.allergens),
            nutritionalInfo,
            await this.userRepo.findOne({'username': req.session.username})
        );

        await this.ingredientRepo.save(ingredient);

        res.redirect('/ingredients');
    }

    patchUpdate = async (req: Request, res: Response) => {
        await this.ingredientRepo.update(parseInt(req.params.id), req.body);

        res.redirect('/ingredients');
    }

    delete = async (req: Request, res: Response) => {
        await this.ingredientRepo.delete(req.params.id);

        res.redirect('/ingredients');
    }

    constructor(){
        this.ingredientRepo = getRepository(Ingredient);
        this.userRepo = getRepository(User);
    }

}
