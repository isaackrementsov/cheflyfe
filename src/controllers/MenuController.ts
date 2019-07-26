import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Menu from '../entity/Menu';
import User from '../entity/User';
import Middleware from '../util/Middleware';

/*TODO:
    * add basic views
*/
export default class MenuController {

    private menuRepo : Repository<Menu>;
    private userRepo : Repository<User>;

    getIndex = async (req: Request, res: Response) => {
        let menu : Menu = await this.menuRepo.findOne(parseInt(req.params.id), {
            where: {'authorId': req.session.userID},
            relations: ['recipes']
        });

        res.render(menu ? 'menu' : 'notFound', {menu: menu, session: req.session});
    }

    getAll = async (req: Request, res: Response) => {
        let menus : Menu[] = await this.menuRepo.find({
            where: {'authorId': req.session.userID}
        });

        res.render('menus', {menus: menus, session: req.session});
    }

    postCreate = async (req: Request, res: Response) => { //TODO: Add file upload for logo
        let menu : Menu = new Menu({
            logo: req.files['logoUpl'].path,
            header: req.body.header,
            info: req.body.infoJSON,
            recipes: req.body.recipeRelJSON,
            author: await this.userRepo.findOne(req.session.userID)
        });

        await this.menuRepo.save(menu);

        res.redirect('/menus/' + this.menuRepo.getId(menu));
    }

    patchUpdate = async (req: Request, res: Response) => {
        let update = Middleware.decodeBody(req.body, req.files);

        await this.menuRepo.createQueryBuilder()
            .update().set(update)
            .where('authorId = :userID AND id = :id', {
                userID: req.session.userID,
                id: parseInt(req.params.id)
            })
            .execute();

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
