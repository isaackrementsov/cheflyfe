import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Menu from '../entity/Menu';
import User from '../entity/User';
import Middleware from '../util/Middleware';
import * as fs from 'fs';
import Recipe from '../entity/Recipe';
import Ingredient from '../entity/Ingredient';
import { RecipeSearcher } from '../util/typeDefs';

/*TODO:
    * add basic views
*/
export default class MenuController {

    private menuRepo : Repository<Menu>;
    private recipeRepo : Repository<Recipe>;
    private ingredientRepo : Repository<Ingredient>;
    private userRepo : Repository<User>;

    getIndex = async (req: Request, res: Response) => { //TODO: more descriptive errors, fix params issues, implement user search, admin, payment, exports, optimize relation loading in updates, don't send empty forms in req.body
        let menu : Menu = await this.menuRepo.createQueryBuilder('menu')
            .leftJoinAndSelect('menu.recipes', 'recipes')
            .leftJoinAndSelect('recipes.ingredients', 'recipe_ingredients')
            .leftJoinAndSelect('menu.author', 'author')
            .leftJoinAndSelect('author.recipes','author_recipes')
            .leftJoinAndSelect('author.brigade','author_brigade')
            .leftJoinAndSelect('menu.sharedUsers', 'shared')
            .where('(shared.id = :userID OR author.id = :userID OR author.admin = :yes) AND menu.id = :id', {
                userID: req.session.userID,
                yes: true,
                id: parseInt(req.params.id)
            })
            .getOne();

        if(menu){
            for(let i = 0; i < menu.recipes.length; i++){
                await menu.recipes[i].getRelations();
                await menu.recipes[i].populateInfo();
            }

            await menu.getAllIngredients();
            await menu.getAllAllergens();
        };

        res.render(menu ? 'menu' : 'notFound', {menu: menu, session: req.session});
    }

    getAll = async (req: Request, res: Response) => {
        let menus : Menu[] = await this.menuRepo.createQueryBuilder('menu')
            .leftJoinAndSelect('menu.sharedUsers', 'sharedUsers')
            .where('authorId = :userID OR sharedUsers.id = :userID', {userID: req.session.userID})
            .getMany()

        res.render('menus', {menus: menus, session: req.session});
    }

    getPublic = async (req: Request, res: Response) => {
        let menus : Menu[] = await this.menuRepo.createQueryBuilder('menu')
            .limit(5)
            .leftJoinAndSelect('menu.author', 'author')
            .where('author.admin = :yes', {yes: true})
            .getMany();

        res.render('menus', {menus: menus, session: req.session, public: true});
    }

    getCreate = async (req: Request, res: Response) => {
        let user : User = await this.userRepo.findOne(req.session.userID, {
            relations: ['recipes', 'brigade']
        });

        res.render('createMenu', {user: user, session: req.session});
    }

    postCreate = async (req: Request, res: Response) => { //TODO: Add file upload for logo
        let menu : Menu = new Menu({
            logo: req.files['logoUpl'].path,
            name: req.body.name,
            recipes: req.body.recipesRelJSON,
            sharedUsers: req.body.sharedUsersRelJSON,
            sharingPermissions: {
                food: req.body.foodShareJSON || false,
                labor: req.body.laborShareJSON || false,
                misc: req.body.miscShareJSON || false,
                overhead: req.body.overheadShareJSON || false,
                price: req.body.priceShareJSON || false,
                profit: req.body.profitShareJSON || false,
                profitMargin: req.body.profitMarginShareJSON || false,
                allergens: req.body.allergensShareJSON || false
            },
            author: await this.userRepo.findOne(req.session.userID)
        });

        await this.menuRepo.save(menu);

        res.redirect('/menus/' + this.menuRepo.getId(menu));
    }

    patchUpdate = async (req: Request, res: Response) => {
        let update = Middleware.decodeBody(req.body, req.files);

        let toUpdate : Menu = await this.menuRepo.createQueryBuilder()
            .select()
            .where('authorId = :userID AND id = :id', {
                userID: req.session.userID,
                id: parseInt(req.params.id)
            })
            .getOne();

        if(toUpdate){
            if(update['logo'] != toUpdate.logo){
                try{
                    fs.unlinkSync(toUpdate.logo);
                }catch(e){ }
            }

            Object.assign(toUpdate, update);

            await this.menuRepo.save(toUpdate);
        }

        res.redirect('/menus/' + req.params.id);
    }

    putTransfer = async (req: Request, res: Response) => {
        let toTransfer : Menu = await this.menuRepo.findOne(parseInt(req.params.id), {
            relations: ['recipes', 'recipes.ingredients', 'recipes.ingredients.nutritionalInfo']
        });

        if(toTransfer){
            let temp : Recipe[] = toTransfer.recipes;
            let recipeSearcher : RecipeSearcher = await RecipeSearcher.createSearcher(req.session.userID, {
                ingredientRepo: this.ingredientRepo,
                recipeRepo: this.recipeRepo
            });

            delete toTransfer['id'];
            toTransfer.recipes = [];
            toTransfer.author = recipeSearcher.author;

            toTransfer = await this.menuRepo.save(toTransfer);

            for(let recipe of temp){
                let matched : Recipe[] = await this.recipeRepo.createQueryBuilder('recipe')
                    .leftJoinAndSelect('recipe.author', 'author')
                    .where('author.id = :userID AND recipe.name = :name', {userID: recipeSearcher.author.id, name: recipe.name})
                    .getMany();

                let final : Recipe;

                for(let rec of matched){
                    if(rec.price.units == recipe.price.units){
                        final = rec;
                        break;
                    }
                }

                if(final){
                    toTransfer.recipes.push(final);
                }else{
                    toTransfer.recipes.push(await recipeSearcher.transferRecipe(recipe));
                }
            }

            await this.menuRepo.save(toTransfer);
        }

        res.redirect('/menus');
    }

    delete = async (req: Request, res: Response) => {
        await this.menuRepo.createQueryBuilder()
            .delete()
            .where('authorId = :userID AND id = :id', {
                userID: req.session.userID,
                id: parseInt(req.params.id)
            })
            .execute();

        res.redirect('/menus');
    }

    constructor(){
        this.menuRepo = getRepository(Menu);
        this.userRepo = getRepository(User);
        this.recipeRepo = getRepository(Recipe);
        this.ingredientRepo = getRepository(Ingredient);
    }

}
