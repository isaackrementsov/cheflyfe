import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Recipe from '../entity/Recipe';
import User from '../entity/User';
import Middleware from '../util/Middleware';
import * as fs from 'fs';

//TODO: maybe fix create method?
export default class RecipeController {

    private recipeRepo : Repository<Recipe>;
    private userRepo : Repository<User>;

    getIndex = async (req: Request, res: Response) => {
        let recipe : Recipe = await this.recipeRepo.createQueryBuilder('recipe')
            .leftJoinAndSelect('recipe.ingredients', 'ingredients')
            .leftJoinAndSelect('ingredients.nutritionalInfo', 'ingredients_nutritionalInfo')
            .leftJoinAndSelect('recipe.subRecipes', 'subRecipes')
            .leftJoinAndSelect('recipe.menus', 'menus')
            .leftJoinAndSelect('recipe.author', 'author')
            .leftJoinAndSelect('author.ingredients','author_ingredients')
            .leftJoinAndSelect('author.recipes','author_recipes')
            .leftJoinAndSelect('author.brigade','author_brigade')
            .leftJoinAndSelect('recipe.sharedUsers', 'shared')
            .where('shared.id = :userID OR author.id = :userID', {userID: req.session.userID})
            .andWhere('recipe.id = :id', {id: parseInt(req.params.id)})
            .getOne();

        if(recipe) await recipe.populateInfo();

        res.render(recipe ? 'recipe' : 'notFound', {recipe: recipe, session: req.session});
    }

    getAll = async (req: Request, res: Response) => {
        let recipes : Recipe[] = await this.recipeRepo.createQueryBuilder('recipe')
            .leftJoinAndSelect('recipe.sharedUsers', 'sharedUsers')
            .where('authorId = :userID OR sharedUsers.id = :userID', {userID: req.session.userID})
            .getMany()

        res.render('recipes', {recipes: recipes, session: req.session});
    }

    getCreate = async (req: Request, res: Response) => {
        let user : User = await this.userRepo.findOne(req.session.userID, {
            relations: ['ingredients', 'recipes', 'brigade']
        });

        res.render('createRecipe', {session: req.session, user: user});
    }

    postCreate = async (req: Request, res: Response) => {
        let recipe : Recipe = new Recipe({
            name: req.body.name,
            description: req.body.descriptionOpt || 'no description',
            steps: req.body.stepsJSON,
            filePaths: req.files['recipeUplMulti6'].map(f => f.path),
            price: {val: req.body.priceJSON, qt: req.body.qtJSON, units: req.body.units},
            costs: {labor: req.body.laborJSON, overhead: req.body.overheadJSON, misc: req.body.miscJSON},
            quantities: req.body.quantitiesJSON,
            recipeQuantities: req.body.recipeQuantitiesJSON,
            ingredients: req.body.ingredientsRelJSON,
            subRecipes: req.body.recipesRelJSON,
            sharedUsers: req.body.sharedUsersRelJSON,
            sharingPermissions: {
                allergens: req.body.allergensShareJSON || false,
                profitMargin: req.body.profitMarginShareJSON || false,
                profit: req.body.profitShareJSON || false,
                price: req.body.priceShareJSON || false,
                labor: req.body.laborShareJSON || false,
                misc: req.body.miscShareJSON || false,
                food: req.body.foodShareJSON || false,
                overhead: req.body.overheadShareJSON || false
            },
            feed: req.body.postShareJSON || false,
            author: await this.userRepo.findOne(req.session.userID)
        });

        await this.recipeRepo.save(recipe);

        res.redirect('/recipes/' + this.recipeRepo.getId(recipe));
    }

    patchUpdate = async (req: Request, res: Response) => {
        let update = Middleware.decodeBody(req.body, req.files);
        let toUpdate : Recipe = await this.recipeRepo.createQueryBuilder()
            .select()
            .where('authorId = :userID AND id = :id', {
                userID: req.session.userID,
                id: parseInt(req.params.id)
            })
            .getOne();

        if(toUpdate){
            if(update['recipe']){
                toUpdate.filePaths.push(update['recipe']);
            }else{
                Object.assign(toUpdate, update);

                if(req.body.deletedMeta != '' && req.body.deletedMeta){
                    try{
                        fs.unlinkSync(req.body.deletedMeta);
                    }catch(e){}
                }
            }

            await this.recipeRepo.save(toUpdate);
        }

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
