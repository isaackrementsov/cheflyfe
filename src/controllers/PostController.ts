import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Post from '../entity/Post';
import User from '../entity/User';
import Comment from '../entity/Comment';

class PostController {

    postRepo : Repository<Post>;
    userRepo : Repository<User>;
    commentRepo : Repository<Comment>;

    getIndex = async (req: Request, res: Response) => {
        let user : User = await this.userRepo.findOne({
            where: {'username': req.params.username},
            relations: ['recipes', 'ingredients', 'menus']
        });

        let posts : Post[] = await this.postRepo.find({
            where: {'author.username': req.params.username},
            relations: ['author']
        });
    }

    postCreate = async (req: Request, res: Response) => {
        let post : Post = new Post(
            req.body.title,
            req.body.text,
            [],
            await this.userRepo.findOne({'username': req.session.username})
        );

        await this.postRepo.save(post);

        res.redirect('/users/' + req.session.username);
    }

    patchUpdate = async (req: Request, res: Response) => {
        await this.postRepo.update(req.params.id, req.body);

        res.redirect('/users/' + req.session.username);
    }

    delete = async (req: Request, res: Response) => {
        await this.postRepo.delete(req.params.id);

        res.redirect('/users/' + req.session.username);
    }

    constructor(){
        this.postRepo = getRepository(Post);
        this.userRepo = getRepository(User);
        this.commentRepo = getRepository(Comment);
    }

}
