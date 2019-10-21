import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import {RecipeSearcher, unlink} from '../util/typeDefs';
import Recipe from '../entity/Recipe';
import User from '../entity/User';
import Middleware from '../util/Middleware';
import Ingredient from '../entity/Ingredient';
import * as puppeteer from 'puppeteer';
import stream = require('stream');

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

            if(recipe && recipe.author && recipe.author.recipes){
                for(let i = 0; i < recipe.author.recipes.length; i++){
                    await recipe.author.recipes[i].getRelations();
                    await recipe.author.recipes[i].getFoodCost();
                }
            }

            let recipeIsSubTo = await this.recipeRepo.createQueryBuilder('recipe')
                .leftJoinAndSelect('recipe.subRecipes', 'subRecipes')
                .where('subRecipes.id = :recipeID', {recipeID: recipe.id})
                .getOne();

            res.render(recipe ? 'recipe' : 'notFound', {recipe, canEdit: !recipeIsSubTo, session: req.session, error: req.flash('error'), pdf: req.query.pdf == 'true'});
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
                .leftJoinAndSelect('recipe.author', 'author')
                .where('author.id = :userID OR sharedUsers.id = :userID', {userID: req.session.userID})
                .getMany();

            for(let i = 0; i < recipes.length; i++){
                let hasTransferred = await this.recipeRepo.createQueryBuilder('recipe')
                    .where('recipe.from = :recipeID AND recipe.authorId = :userID', {recipeID: recipes[i].id, userID: req.session.userID})
                    .getOne();

                recipes[i].transferID = hasTransferred ?  hasTransferred.id : null;
            }
        }catch(e){
            req.flash('error', 'There was an error getting recipes');
        }

        res.render('recipes', {recipes: recipes.sort((a, b) => {
            if(a.name < b.name) { return 1; }
            if(a.name > b.name) { return -1; }
            return 0;
        }), session: req.session, error: req.flash('error')});
    }

    getPublic = async (req: Request, res: Response) => {
        let recipes : Recipe[] = [];

        try {
            recipes = await this.recipeRepo.createQueryBuilder('recipe')
                .limit(5)
                .leftJoinAndSelect('recipe.author', 'author')
                .where('author.admin = :yes', {yes: true})
                .getMany();

            for(let i = 0; i < recipes.length; i++){
                let hasTransferred = await this.recipeRepo.createQueryBuilder('recipe')
                    .where('recipe.from = :recipeID AND recipe.authorId = :userID', {recipeID: recipes[i].id, userID: req.session.userID})
                    .getOne();

                recipes[i].transferID = hasTransferred ?  hasTransferred.id : null;
            }
        }catch(e){
            req.flash('There was an error getting public recipes');
        }

        res.render('recipes', {recipes: recipes.sort((a, b) => {
            if(a.name < b.name) { return -1; }
            if(a.name > b.name) { return 1; }
            return 0;
        }), session: req.session, public: true, error: req.flash('error')});
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

    getPDF = async (req: Request, res: Response) => {
        try {
            let host = req.headers.host;
            let browser = await puppeteer.launch({headless: true});
            let page = await browser.newPage();

            await page.goto('http://localhost:3000/login', {waitUntil: 'networkidle0'});
            await page.type('input[name=username]', req.session.username);
            await page.type('input[name=password]', req.session.password);
            await page.click('input[type=submit]');

            await page.goto(`http${host.indexOf('localhost') == -1 ? 's' : ''}://${host}/recipes/${req.params.id}?pdf=true`, {waitUntil: 'networkidle0'});
            let pdf = await page.pdf({format: 'A4'});

            await browser.close();

            var fileContents = Buffer.from(pdf, "base64");

            var readStream = new stream.PassThrough();
            readStream.end(fileContents);

            res.set('Content-disposition', 'attachment; filename=recipe.pdf');
            res.set('Content-Type', 'text/plain');

            readStream.pipe(res);
        }catch(e){
            if(!res.headersSent){
                res.send('Error getting PDF');
            }
        }
    }

    postCreate = async (req: Request, res: Response) => {
        try {
            let recipe : Recipe = new Recipe({
                name: req.body.name,
                description: req.body.descriptionOpt || 'no description',
                serves: req.body.servesJSON || 1,
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
                showTotalCost: req.body.totalShareJSON || false,
                showPortionPrice: req.body.portionPriceShareJSON || false,
                showPortionProfit: req.body.portionProfitShareJSON || false,
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
                        if(!update['showServingCost']){
                            update['showServingCost'] = false;
                        }

                        if(!update['showTotalCost']){
                            update['showTotalCost'] = false;
                        }

                        Object.assign(toUpdate, update);

                        if(req.body.deletedMeta != '' && req.body.deletedMeta){
                            try{
                                let matched = this.recipeRepo.createQueryBuilder()
                                    .select()
                                    .where('filePaths LIKE :fileName', {fileName: `%${req.body.deletedMeta}%`})
                                    .getOne();

                                if(!matched){
                                    await unlink(__dirname + '../../../public' + req.body.deletedMeta);
                                }
                            }catch(e){ }
                        }
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
            console.log(e);
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
                toDelete.filePaths.map(async p => {
                    try {
                        let matched = this.recipeRepo.createQueryBuilder()
                            .select()
                            .where('filePaths LIKE :fileName', {fileName: `%${p}%`})
                            .getOne();

                        if(!matched){
                            await unlink(__dirname + '../../../public' + p);
                        }
                    }catch(e){ }
                });

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
