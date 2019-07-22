import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Menu from '../entity/Menu';
import User from '../entity/User';
import Recipe from '../entity/Recipe';

/*TODO:
    * Add user verification security
    * 404 not found
    * check relation queries
    * add basic views
*/
export default class MenuController {

    private menuRepo : Repository<Menu>;
    private userRepo : Repository<User>;
    private recipeRepo : Repository<Recipe>;

    getIndex = async (req: Request, res: Response) => {
        let menu : Menu = await this.menuRepo.findOne(req.params.id, {relations: ['recipes']});

        res.render('menu', {menu: menu, session: req.session});
    }

    getAll = async (req: Request, res: Response) => {
        let menus : Menu[] = await this.menuRepo.find({
            where: {'author.name': req.session.username},
            relations: ['author']
        });

        res.render('menus', {menus: menus, session: req.session});
    }

    postCreate = async (req: Request, res: Response) => { //TODO: Add file upload for logo
        let menu : Menu = new Menu(
            '',
            req.body.text,
            JSON.parse(req.body.info),
            await this.recipeRepo.findByIds(JSON.parse(req.body.ids)),
            await this.userRepo.findOne({'username': req.session.username})
        );

        await this.menuRepo.save(menu);

        res.redirect('/menus/' + this.menuRepo.getId(menu));
    }

    patchUpdate = async (req: Request, res: Response) => {
        await this.menuRepo.update(req.params.id, req.body);

        res.redirect('/menus/' + req.params.id);
    }

    delete = async (req: Request, res: Response) => {
        await this.menuRepo.delete(req.params.id);

        res.redirect('/menus');
    }

    constructor(){
        this.menuRepo = getRepository(Menu);
        this.userRepo = getRepository(User);
        this.recipeRepo = getRepository(Recipe);
    }

}
