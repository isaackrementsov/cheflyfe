import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Post from '../entity/Post';
import User from '../entity/User';
import Comment from '../entity/Comment';
import Middleware from '../util/Middleware';
import * as fs from 'fs';

export default class PostController {

    private postRepo : Repository<Post>;
    private userRepo : Repository<User>;
    private commentRepo : Repository<Comment>;

    getAll = async (req: Request, res: Response) => {
        let user : User = await this.userRepo.findOne(parseInt(req.params.id), {
            relations: ['brigade', 'requested', 'posts', 'posts.author', 'posts.comments'],
        });

        res.render(user ? 'user' : 'notFound', {user: user, posts: user.posts, session: req.session});
    }

    postCreate = async (req: Request, res: Response) => {
        let post : Post = new Post({
            name: req.body.name,
            content: req.body.contentOptional,
            filePaths: req.files ? req.files['postUplMulti8'].map(p => p.path) : [],
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

        if(typeof update['filePaths'] == 'string'){
            let toUpdate : Post = await this.postRepo.createQueryBuilder()
                .select()
                .where('authorId = :userID AND id = :id', {
                    userID: req.session.userID,
                    id: parseInt(req.params.id)
                })
                .getOne();

            if(toUpdate){
                toUpdate.filePaths.push(update['filePaths']);
                await this.postRepo.save(toUpdate);
            }
        }else{
            await this.postRepo.createQueryBuilder()
                .update().set(update)
                .where('authorId = :userID AND id = :id', {
                    userID: req.session.userID,
                    id: parseInt(req.params.id)
                })
                .execute();
        }

        if(req.body.deletedMeta != '' && req.body.deletedMeta){
            try{
                fs.unlinkSync(__dirname + '/../../public' + req.body.deletedMeta);
            }catch(e){}
        }

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
