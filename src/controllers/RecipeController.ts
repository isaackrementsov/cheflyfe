import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import {RecipeSearcher} from '../util/typeDefs';
import Recipe from '../entity/Recipe';
import User from '../entity/User';
import Middleware from '../util/Middleware';
//import * as fs from 'fs';
import Ingredient from '../entity/Ingredient';

export default class RecipeController {

    private recipeRepo : Repository<Recipe>;
    private userRepo : Repository<User>;
    private ingredientRepo : Repository<Ingredient>;

    getIndex = async (req: Request, res: Response) => {
        try {
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
                .where('(shared.id = :userID OR author.id = :userID OR author.admin = :yes) AND recipe.id = :id', {
                    userID: req.session.userID,
                    yes: true,
                    id: parseInt(req.params.id)
                })
                .getOne();

            if(recipe) await recipe.populateInfo();

            res.render(recipe ? 'recipe' : 'notFound', {recipe: recipe, session: req.session, error: req.flash('error')});
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'There was an error getting recipe');
                res.redirect('/recipes');
            }
        }
    }

    getAll = async (req: Request, res: Response) => {
        let recipes : Recipe[] = [];
        try {
            recipes = await this.recipeRepo.createQueryBuilder('recipe')
                .leftJoinAndSelect('recipe.sharedUsers', 'sharedUsers')
                .where('authorId = :userID OR sharedUsers.id = :userID', {userID: req.session.userID})
                .getMany();
        }catch(e){
            req.flash('error', 'There was an error getting recipes');
        }

        res.render('recipes', {recipes: recipes, session: req.session, error: req.flash('error')});
    }

    getPublic = async (req: Request, res: Response) => {
        let recipes : Recipe[] = [];

        try {
            recipes = await this.recipeRepo.createQueryBuilder('recipe')
                .limit(5)
                .leftJoinAndSelect('recipe.author', 'author')
                .where('author.admin = :yes', {yes: true})
                .getMany();
        }catch(e){
            req.flash('There was an error getting public recipes');
        }

        res.render('recipes', {recipes: recipes, session: req.session, public: true, error: req.flash('error')});
    }

    getCreate = async (req: Request, res: Response) => {
        try {
            let user : User = await this.userRepo.findOne(req.session.userID, {
                relations: ['ingredients', 'recipes', 'brigade']
            });

            for(let i = 0; i < user.recipes.length; i++){
                await user.recipes[i].getRelations();
                await user.recipes[i].getFoodCost();
            }
            res.render('createRecipe', {session: req.session, user: user});
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'There was an error loading recipe creation data');
                res.redirect('/recipes');
            }
        }
    }

    postCreate = async (req: Request, res: Response) => {
        try {
            let recipe : Recipe = new Recipe({
                name: req.body.name,
                description: req.body.descriptionOpt || 'no description',
                serves: req.body.servesJSON,
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
                showServingCost: req.body.servingShareJSON || false,
                feed: req.body.postShareJSON || false,
                author: await this.userRepo.findOne(req.session.userID)
            });

            await this.recipeRepo.save(recipe);

            res.redirect('/recipes/' + this.recipeRepo.getId(recipe));
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'There was an error creating recipe');
                res.redirect('/recipes');
            }
        }
    }

    patchUpdate = async (req: Request, res: Response) => {
        try {
            let update = Middleware.decodeBody(req.body, req.files);

            if(update['stars']){
                let toUpdate : Recipe = await this.recipeRepo.createQueryBuilder()
                    .select()
                    .where('id = :id', {id: parseInt(req.params.id)})
                    .getOne();

                if(toUpdate.ratings.map(r => r.userID).indexOf(req.session.userID) == -1){
                    toUpdate.ratings.push({userID: req.session.userID, val: update['stars']});
                    await this.recipeRepo.save(toUpdate);
                }
                res.redirect(req.header('referer'));
            }else{
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
                        if(!update['shareServingCost']){
                            update['shareServingCost'] = false;
                        }

                        Object.assign(toUpdate, update);

                        //TODO: Work on deleting with shared recipes
                        /*if(req.body.deletedMeta != '' && req.body.deletedMeta){
                            try{
                                fs.unlinkSync(__dirname + '../../../public' + req.body.deletedMeta);
                            }catch(e){ }
                        }*/
                    }

                    await this.recipeRepo.save(toUpdate);
                }

                res.redirect('/recipes/' + req.params.id);
            }
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'There was an error updating recipe');
                res.redirect(req.header('Referer'));
            }
        }
    }

    putTransfer = async (req: Request, res: Response) => {
        try {
            let toTransfer : Recipe = await this.recipeRepo.createQueryBuilder('recipe')
                .leftJoinAndSelect('recipe.ingredients', 'ingredients')
                .leftJoinAndSelect('ingredients.nutritionalInfo', 'ingredients_nutritionalInfo')
                .leftJoinAndSelect('recipe.subRecipes', 'subRecipes')
                .leftJoinAndSelect('recipe.sharedUsers', 'sharedUsers')
                .leftJoinAndSelect('recipe.author', 'author')
                .where('(sharedUsers.id = :userID OR (author.admin = :yes AND author.id != :userID)) AND recipe.id = :id', {
                    userID: req.session.userID,
                    yes: true,
                    id: parseInt(req.params.id)
                })
                .getOne();

            if(toTransfer){
                let recipeSearcher : RecipeSearcher = await RecipeSearcher.createSearcher(req.session.userID, {
                    ingredientRepo: this.ingredientRepo,
                    recipeRepo: this.recipeRepo
                });

                await recipeSearcher.transferRecipe(toTransfer);
            }
        }catch(e){
            req.flash('error', 'There was an error transferring recipe');
        }

        res.redirect('/recipes');
    }

    delete = async (req: Request, res: Response) => {
        try {
            let toDelete : Recipe = await this.recipeRepo.createQueryBuilder('recipe')
                .leftJoinAndSelect('recipe.menus', 'menus')
                .where('recipe.authorId = :userID AND recipe.id = :id', {userID: req.session.userID, id: parseInt(req.params.id)})
                .getOne();

            if(toDelete.menus.length == 0){
                /*toDelete.filePaths.map(p => {
                    try {
                        fs.unlink(__dirname + '../../../public' + p);
                    }catch(e){ }
                });*/

                await this.recipeRepo.createQueryBuilder()
                    .delete()
                    .where('id = :id', {id: toDelete.id})
                    .execute();
            }
        }catch(e){
            req.flash('error', 'There was an error deleting recipe');
        }

        res.redirect('/recipes');
    }

    constructor(){
        this.recipeRepo = getRepository(Recipe);
        this.userRepo = getRepository(User);
        this.ingredientRepo = getRepository(Ingredient);
    }

}
