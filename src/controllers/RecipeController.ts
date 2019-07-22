import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Recipe from '../entity/Recipe';
import Ingredient from '../entity/Ingredient';
import User from '../entity/User';

//TODO: Add recipe sharing, user security
class RecipeController {

    recipeRepo : Repository<Recipe>;
    ingredientRepo : Repository<Ingredient>;
    userRepo : Repository<User>;

    getIndex = async (req: Request, res: Response) => {
        let recipe : Recipe = await this.recipeRepo.findOne(req.params.id, {
            relations: ['ingredients', 'subRecipes', 'menus', 'author']
        });

        res.render('recipe', {recipe: recipe, session: req.session});
    }

    getAll = async (req: Request, res: Response) => {
        let recipes : Recipe[] = await this.recipeRepo.find({
            where: {'author.username': req.session.username},
            relations: ['author']
        });

        res.render('recipes', {recipes: recipes, session: req.session});
    }

    getCreate = async (req: Request, res: Response) => {
        res.render('createRecipe', {session: req.session});
    }

    postCreate = async (req: Request, res: Response) => {
        let recipe : Recipe = new Recipe(
            JSON.parse(req.body.steps),
            {val: req.body.val, qt: req.body.qt, units: req.body.units},
            {labor: req.body.labor, overhead: req.body.overhead, misc: req.body.misc},
            JSON.parse(req.body.quantities),
            await this.ingredientRepo.findByIds(JSON.parse(req.body.ids)),
            await this.recipeRepo.findByIds(JSON.parse(req.body.recipeIds)),
            await this.userRepo.findOne({'username': req.session.username})
        )
    }

    patchUpdate = async (req: Request, res: Response) => {
        await this.recipeRepo.update(req.params.id, req.body);

        res.redirect('/recipes/' + req.params.id);
    }

    delete = async (req: Request, res: Response) => {
        await this.recipeRepo.delete(req.params.id);

        res.redirect('/recipes');
    }

    constructor(){
        this.recipeRepo = getRepository(Recipe);
        this.ingredientRepo = getRepository(Ingredient);
        this.userRepo = getRepository(User);
    }

}
