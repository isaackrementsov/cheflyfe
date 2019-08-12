import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Menu from '../entity/Menu';
import User from '../entity/User';
import Middleware from '../util/Middleware';
import * as fs from 'fs';

/*TODO:
    * add basic views
*/
export default class MenuController {

    private menuRepo : Repository<Menu>;
    private userRepo : Repository<User>;

    getIndex = async (req: Request, res: Response) => { //TODO: more descriptive errors, fix params issues, implement user search, admin, payment, exports, optimize relation loading in updates, don't send empty forms in req.body
        let menu : Menu = await this.menuRepo.createQueryBuilder('menu')
            .leftJoinAndSelect('menu.recipes', 'recipes')
            .leftJoinAndSelect('recipes.ingredients', 'recipe_ingredients')
            .leftJoinAndSelect('menu.author', 'author')
            .leftJoinAndSelect('author.recipes','author_recipes')
            .leftJoinAndSelect('author.brigade','author_brigade')
            .leftJoinAndSelect('menu.sharedUsers', 'shared')
            .where('shared.id = :userID OR author.id = :userID', {userID: req.session.userID})
            .andWhere('menu.id = :id', {id: parseInt(req.params.id)})
            .getOne();

        if(menu){
            await menu.getAllIngredients();
            await menu.getAllAllergens();

            for(let i = 0; i < menu.recipes.length; i++){
                await menu.recipes[i].populateInfo();
            }
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
    }

}
