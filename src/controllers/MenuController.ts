import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import {RecipeSearcher, unlink} from '../util/typeDefs';
import Recipe from '../entity/Recipe';
import Ingredient from '../entity/Ingredient';
import Menu from '../entity/Menu';
import User from '../entity/User';
import Middleware from '../util/Middleware';
import * as puppeteer from 'puppeteer';
import stream = require('stream');

/*TODO:
    * add basic views
*/
export default class MenuController {

    private menuRepo : Repository<Menu>;
    private recipeRepo : Repository<Recipe>;
    private ingredientRepo : Repository<Ingredient>;
    private userRepo : Repository<User>;

    getIndex = async (req: Request, res: Response) => { //TODO: more descriptive errors, fix params issues, implement user search, admin, payment, exports, optimize relation loading in updates, don't send empty forms in req.body
        try {
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
            }

            res.render(menu ? 'menu' : 'notFound', {menu: menu, session: req.session, error: req.flash('error'), pdf: req.query.pdf == 'true'});
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'Error getting menu');
                res.redirect('/menus');
            }
        }
    }

    getAll = async (req: Request, res: Response) => {
        let menus : Menu[] = [];

        try {
            menus = await this.menuRepo.createQueryBuilder('menu')
                .leftJoinAndSelect('menu.sharedUsers', 'sharedUsers')
                .where('authorId = :userID OR sharedUsers.id = :userID', {userID: req.session.userID})
                .getMany();

            for(let i = 0; i < menus.length; i++){
                let hasTransferred = await this.menuRepo.createQueryBuilder('menu')
                    .where('menu.from = :menuID AND menu.authorId = :userID', {menuID:  menus[i].id, userID: req.session.userID})
                    .getOne();

                menus[i].transferID = hasTransferred ?  hasTransferred.id : null;
            }
        }catch(e){
            req.flash('error', 'Error getting menus');
        }

        res.render('menus', {menus: menus, session: req.session, error: req.flash('error')});
    }

    getPublic = async (req: Request, res: Response) => {
        let menus : Menu[] = [];

        try {
            menus = await this.menuRepo.createQueryBuilder('menu')
                .leftJoinAndSelect('menu.author', 'author')
                .where('author.admin = :yes', {yes: true})
                .getMany();

            for(let i = 0; i < menus.length; i++){
                let hasTransferred = await this.menuRepo.createQueryBuilder('menu')
                    .where('menu.from = :menuID AND menu.authorId = :userID', {menuID:  menus[i].id, userID: req.session.userID})
                    .getOne();

                menus[i].transferID = hasTransferred ?  hasTransferred.id : null;
            }
        }catch(e){
            req.flash('error', 'Error getting public menus');
        }

        res.render('menus', {
            menus: menus.sort((a, b) => {
                if(a.name < b.name) { return -1; }
                if(a.name > b.name) { return 1; }
                return 0;
            }),
            session: req.session,
            public: true,
            error: req.flash('error')
        });
    }

    getCreate = async (req: Request, res: Response) => {
        try {
            let user : User = await this.userRepo.findOne(req.session.userID, {
                relations: ['recipes', 'brigade']
            });

            res.render('createMenu', {user: user, session: req.session, error: req.flash('error')});
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'Error loading data for menu creation');
                res.redirect('/menus');
            }
        }
    }

    getPDF = async (req: Request, res: Response) => {
        try {
            let host = req.headers.host;
            let start = `http${host.indexOf('localhost') == -1 ? 's' : ''}://${host}`;

            let browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
            let page = await browser.newPage();

            await page.goto(`${start}/login`, {waitUntil: 'networkidle0'});
            await page.type('input[name=username]', req.session.username);
            await page.type('input[name=password]', req.session.password);
            await page.click('input[type=submit]');

            await page.goto(`${start}/menus/${req.params.id}?pdf=true`, {waitUntil: 'networkidle0'});
            let pdf = await page.pdf({format: 'A4'});

            await browser.close();

            var fileContents = Buffer.from(pdf, "base64");

            var readStream = new stream.PassThrough();
            readStream.end(fileContents);

            res.set('Content-disposition', 'attachment; filename=menu.pdf');
            res.set('Content-Type', 'text/plain');

            readStream.pipe(res);
        }catch(e){
            if(!res.headersSent){
                res.send('Error getting PDF');
            }
        }
    }

    postCreate = async (req: Request, res: Response) => { //TODO: Add file upload for logo
        try {
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
        }catch(e){
            req.flash('error', 'There was an issue creating the menu');
            res.redirect('/menus');
        }
    }

    patchUpdate = async (req: Request, res: Response) => {
        try {
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
                    try {
                        let matched = this.menuRepo.createQueryBuilder()
                            .select()
                            .where('filePaths LIKE :fileName', {fileName: `%${toUpdate.logo}%`})
                            .getOne();

                        if(!matched){
                            await unlink(__dirname + '../../../public' + toUpdate.logo);
                        }
                    }catch(e){ }
                }

                Object.assign(toUpdate, update);

                await this.menuRepo.save(toUpdate);
            }
        }catch(e){
            req.flash('error', 'Error updating menu');
        }

        res.redirect(`/menus/${req.params.id}`);

    }

    putTransfer = async (req: Request, res: Response) => {
        try {
            let toTransfer : Menu = await this.menuRepo.findOne(parseInt(req.params.id), {
                relations: ['recipes', 'recipes.ingredients', 'recipes.ingredients.nutritionalInfo', 'recipes.author', 'recipes.subRecipes']
            });

            if(toTransfer){
                let temp : Recipe[] = toTransfer.recipes;
                let recipeSearcher : RecipeSearcher = await RecipeSearcher.createSearcher(req.session.userID, {
                    ingredientRepo: this.ingredientRepo,
                    recipeRepo: this.recipeRepo
                });

                toTransfer.from = toTransfer['id'];
                delete toTransfer['id'];
                toTransfer.recipes = [];
                toTransfer.author = recipeSearcher.author;

                toTransfer = await this.menuRepo.save(toTransfer);

                for(let recipe of temp){
                    let matched : Recipe[] = await this.recipeRepo.createQueryBuilder('recipe')
                        .leftJoinAndSelect('recipe.author', 'author')
                        .where('author.id = :userID AND (recipe.name = :name OR recipe.from = :id)', {userID: recipeSearcher.author.id, name: recipe.name, id: recipe.id})
                        .getMany();

                    let final : Recipe;

                    for(let rec of matched){
                        if(recipeSearcher.getUnits(recipe.price) == rec.price.units){
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
        }catch(e){
            req.flash('error', 'Error transferring menu');
        }

        res.redirect('/menus');
    }

    delete = async (req: Request, res: Response) => {
        try {
            await this.menuRepo.createQueryBuilder()
                .delete()
                .where('authorId = :userID AND id = :id', {
                    userID: req.session.userID,
                    id: parseInt(req.params.id)
                })
                .execute();
        }catch(e){
            req.flash('Error deleting menu');
        }

        res.redirect('/menus');
    }

    constructor(){
        this.menuRepo = getRepository(Menu);
        this.userRepo = getRepository(User);
        this.recipeRepo = getRepository(Recipe);
        this.ingredientRepo = getRepository(Ingredient);
    }

}
