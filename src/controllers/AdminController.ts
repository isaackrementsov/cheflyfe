import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Visit from '../entity/Visit';
import User from '../entity/User';
import Ingredient from '../entity/Ingredient';
import Recipe from '../entity/Recipe';
import Menu from '../entity/Menu';

export default class AdminController {

    private visitRepo : Repository<Visit>;
    private userRepo : Repository<User>;
    private ingredientRepo : Repository<Ingredient>;
    private recipeRepo : Repository<Recipe>;
    private menuRepo : Repository<Menu>;

    getIndex = async (req: Request, res: Response) => {
        let visits : Visit[] = await this.visitRepo.find({select: ['timestamp']});
        let users : User[] = await this.userRepo.find({select: ['timestamp']});
        let ingredients : Ingredient[] = await this.ingredientRepo.find({select: ['timestamp']});
        let recipes : Recipe[] = await this.recipeRepo.find({select: ['timestamp']});
        let menus : Menu[] = await this.menuRepo.find({select: ['timestamp']});

        res.render('admin', {visits, users, ingredients, recipes, menus, ...{session: req.session}});
    }

    constructor(){
        this.visitRepo = getRepository(Visit);
        this.userRepo = getRepository(User);
        this.ingredientRepo = getRepository(Ingredient);
        this.recipeRepo = getRepository(Recipe);
        this.menuRepo = getRepository(Menu);
    }
}
