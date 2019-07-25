import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Recipe from '../entity/Recipe';
import User from '../entity/User';
import Middleware from '../util/Middleware';

//TODO: maybe fix create method?
export default class RecipeController {

    private recipeRepo : Repository<Recipe>;
    private userRepo : Repository<User>;

    getIndex = async (req: Request, res: Response) => {
        let recipe : Recipe = await this.recipeRepo.createQueryBuilder()
            .select()
            .innerJoinAndSelect('recipe.ingredients', 'ingredients')
            .innerJoinAndSelect('recipe.subRecipes', 'subRecipes')
            .innerJoinAndSelect('recipe.menus', 'menus')
            .innerJoinAndSelect('recipe.author', 'author')
            .innerJoin('recipe.sharedUsers', 'shared')
            .where('shared.id = :userID OR authorId = :userID', {userID: req.session.userID})
            .andWhere('id = :id', {id: parseInt(req.params.id)})
            .execute();

        res.render(recipe ? 'recipe' : 'notFound', {recipe: recipe, session: req.session});
    }

    getAll = async (req: Request, res: Response) => {
        let recipes : Recipe[] = await this.recipeRepo.find({
            where: {'authorId': req.session.userID},
        });

        res.render('recipes', {recipes: recipes, session: req.session});
    }

    getCreate = (req: Request, res: Response) => {
        res.render('createRecipe', {session: req.session});
    }

    postCreate = async (req: Request, res: Response) => {
        let recipe : Recipe = new Recipe({
            name: req.body.name,
            description: req.body.descriptionOptional,
            steps: req.body.stepsJSON,
            images: req.files['recipeUplMulti6'].map(f => f.path),
            price: {val: req.body.val, qt: req.body.qt, units: req.body.units},
            costs: {labor: req.body.labor, overhead: req.body.overhead, misc: req.body.misc},
            quantities: req.body.quantitiesJSON,
            ingredients: req.body.ingredientRelJSON,
            subRecipes: req.body.recipeRelJSON,
            author: await this.userRepo.findOne(req.session.userID)
        });

        await this.recipeRepo.save(recipe);

        res.redirect('/recipes/' + this.recipeRepo.getId(recipe));
    }

    patchUpdate = async (req: Request, res: Response) => {
        let updates = Middleware.decodeBody(req.body, req.files);

        await this.recipeRepo.createQueryBuilder()
            .update().set(updates)
            .where('authorId = :userID AND id = :id', {
                userID: req.session.userID,
                id: parseInt(req.params.id)
            })
            .execute();

        res.redirect('/recipes/' + req.params.id);
    }

    delete = async (req: Request, res: Response) => {
        await this.recipeRepo.createQueryBuilder()
            .delete()
            .where('authorId = :userID AND id = :id', {
                userID: req.session.userID,
                id: parseInt(req.params.id)
            })
            .execute();

        res.redirect('/recipes');
    }

    constructor(){
        this.recipeRepo = getRepository(Recipe);
        this.userRepo = getRepository(User);
    }

}
