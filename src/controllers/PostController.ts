import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import Post from '../entity/Post';
import User from '../entity/User';
import Comment from '../entity/Comment';
import Middleware from '../util/Middleware';
import * as fs from 'fs';

//TODO: set page for errors, make error messages more common, handle promise rejection
export default class PostController {

    private postRepo : Repository<Post>;
    private userRepo : Repository<User>;
    private commentRepo : Repository<Comment>;

    getAll = async (req: Request, res: Response) => {
        let user : User = await this.userRepo.findOne(parseInt(req.params.id), {
            relations: ['brigade', 'requested', 'posts', 'posts.author', 'posts.comments', 'posts.comments.author', 'recipes', 'recipes.sharedUsers'],
        });

        res.render(user ? 'user' : 'notFound', {user: user, posts: user.posts, session: req.session});
    }

    postCreate = async (req: Request, res: Response) => {
        let post : Post = new Post({
            name: req.body.name,
            content: req.body.contentOpt || '',
            filePaths: req.files ? req.files['postUplMulti8'].map(p => p.path) : [],
            author: await this.userRepo.findOne(req.session.userID),
            comments: []
        });

        await this.postRepo.save(post);

        res.redirect('/users/' + req.session.userID);
    }

    patchUpdate = async (req: Request, res: Response) => {
        let update = Middleware.decodeBody(req.body, req.files);

        if(typeof update['filePaths'] == 'string' || update['addedComment'] != ''){
            let toUpdate : Post = await this.postRepo.createQueryBuilder('post')
                .select()
                .leftJoinAndSelect('post.comments', 'comment')
                .where('post.authorId = :userID AND post.id = :id', {
                    userID: typeof update['filePaths'] == 'string' ? req.session.userID : parseInt(req.query.userID),
                    id: parseInt(req.params.id)
                })
                .getOne();

            if(toUpdate){
                if(typeof update['filePaths'] == 'string'){
                    toUpdate.filePaths.push(update['filePaths']);
                }else{
                    let comment = new Comment({
                        author: await this.userRepo.findOne(req.session.userID),
                        content: update['addedComment']
                    });

                    toUpdate.comments ? toUpdate.comments.push(comment) : toUpdate.comments = [comment];
                }
                await this.postRepo.save(toUpdate);
            }
        }else{
            if(update['addedComment']) delete update['addedComment'];

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

        res.redirect('/users/' + req.query.userID);
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
