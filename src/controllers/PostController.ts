import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Post from '../entity/Post';
import User from '../entity/User';
import Comment from '../entity/Comment';
import Middleware from '../util/Middleware';

export default class PostController {

    private postRepo : Repository<Post>;
    private userRepo : Repository<User>;
    private commentRepo : Repository<Comment>;

    getAll = async (req: Request, res: Response) => {
        let user : User = await this.userRepo.findOne(parseInt(req.params.id), {
            relations: ['recipes', 'ingredients', 'menus']
        });

        let posts : Post[] = await this.postRepo.find({
            where: {'authorId': parseInt(req.params.id)},
            relations: ['author', 'comments']
        });

        res.render('user', {user: user, posts: posts});
    }

    postCreate = async (req: Request, res: Response) => {
        let post : Post = new Post({
            name: req.body.name,
            content: req.body.contentOptional,
            filePaths: req.files['postUplMulti'].map(f => f.path),
            author: await this.userRepo.findOne(req.session.userID)
        });

        await this.postRepo.save(post);

        res.redirect('/users/' + req.session.userID);
    }

    postCreateComment = async (req: Request, res: Response) => {
        let comment : Comment = new Comment({
            content: req.body.content,
            post: req.body.postRel,
            author: await this.userRepo.findOne(req.session.userID)
        });

        await this.commentRepo.save(comment);

        res.redirect('/users/' + req.body.userID);
    }

    patchUpdate = async (req: Request, res: Response) => {
        let update = Middleware.decodeBody(req.body, req.files);

        await this.postRepo.createQueryBuilder()
            .update().set(update)
            .where('authorId = :userID AND id = :id', {
                userID: req.session.userID,
                id: parseInt(req.params.id)
            })
            .execute();

        res.redirect('/users/' + req.session.userID);
    }

    delete = async (req: Request, res: Response) => {
        await this.postRepo.createQueryBuilder()
            .delete()
            .where('authorId = :userID AND id = :id', {
                userID: req.session.userID,
                id: parseInt(req.params.id)
            })
            .execute();

        res.redirect('/users/' + req.session.userID);
    }

    constructor(){
        this.postRepo = getRepository(Post);
        this.userRepo = getRepository(User);
        this.commentRepo = getRepository(Comment);
    }

}
