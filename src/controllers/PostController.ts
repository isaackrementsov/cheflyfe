import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import {unlink} from '../util/typeDefs';
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
        let user : User;

        try {
            user = await this.userRepo.findOne(parseInt(req.params.id), {
                where: {admin: req.session.admin && (req.session.userID == req.params.id)},
                relations: ['brigade', 'requested', 'posts', 'posts.author', 'posts.comments', 'posts.comments.author', 'recipes', 'recipes.sharedUsers']
            });
        }catch(e){
            req.flash('error', 'Error getting posts');
        }

        try {
            res.render('user', {user: user, posts: user.posts, session: req.session, error: req.flash('error')});
        }catch(e){
            res.render('notFound', {error: req.flash('error'), session: req.session})
        }
    }

    getPublic = async (req: Request, res: Response) => {
        let posts : Post[] =  [];

        try {
            posts = await this.postRepo.createQueryBuilder('post')
                .limit(5)
                .leftJoinAndSelect('post.author', 'author')
                .where('author.admin = :yes', {yes: true})
                .getMany();
        }catch(e){
            req.flash('error', 'There was an error getting news');
        }

        res.render('news', {posts, session: req.session, error: req.flash('error')});
    }

    getPublicIndex = async (req: Request, res: Response) => {
        try {
            let post : Post = await this.postRepo.createQueryBuilder('post')
                .leftJoinAndSelect('post.author', 'author')
                .where('author.admin = :yes AND post.id = :id', {id: parseInt(req.params.id), yes: true})
                .getOne();

                res.render('newsPost', {post, session: req.session, error: req.flash('error')});
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'Error getting news');
                res.redirect('/news');
            }
        }
    }

    postCreate = async (req: Request, res: Response) => {
        try {
            let post : Post = new Post({
                landing: req.body.landingJSON || false,
                name: req.body.name,
                content: req.body.contentOpt || '',
                filePaths: req.files ? req.files['postUplMulti8'].map(p => p.path) : [],
                author: await this.userRepo.findOne(req.session.userID),
                comments: []
            });

            await this.postRepo.save(post);
        }catch(e){
            try {
                req.files['postUplMulti8'].map(async p => {
                    await unlink(__dirname + '/../../public' + p.path);
                });
            }catch(e){ }

            req.flash('error', 'Error creating post');
        }

        res.redirect('/users/' + req.session.userID);
    }

    patchUpdate = async (req: Request, res: Response) => {
        try {
            let update = Middleware.decodeBody(req.body, req.files);

            if(update['stars']){
                let toUpdate : Post = await this.postRepo.createQueryBuilder()
                    .select()
                    .where('id = :id', {id: parseInt(req.params.id)})
                    .getOne();

                if(toUpdate.ratings.map(r => r.userID).indexOf(req.session.userID) == -1){
                    toUpdate.ratings.push({userID: req.session.userID, val: update['stars']});

                    await this.postRepo.save(toUpdate);
                }

                res.redirect(req.header('referer'));
            }else{
                if(typeof update['filePaths'] == 'string' || (update['addedComment'] != '' && update['addedComment'])){
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
                    if(update['addedComment'] == '') delete update['addedComment'];
                    if(!update['landing']) update['landing'] = false;

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
                        fs.unlink(__dirname + '/../../public' + req.body.deletedMeta, () => {
                            res.redirect('/users/' + req.query.userID);
                        });
                    }catch(e){ }
                }else{
                    res.redirect('/users/' + req.query.userID);
                }
            }
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'Error updating post');
                res.redirect(req.header('Referer'));
            }
        }
    }

    delete = async (req: Request, res: Response) => {
        try {
            let toDelete : Post = await this.postRepo.createQueryBuilder('post')
                .leftJoinAndSelect('post.comments', 'comments')
                .where('post.authorId = :userID AND post.id = :id', {userID: req.session.userID, id: parseInt(req.params.id)})
                .getOne()

            try {
                toDelete.filePaths.map(async p => {
                    await unlink(__dirname + '/../../public' + p);
                });
            }catch(e){ }

            toDelete.comments.map(async c => {
                await this.commentRepo.delete(c);
            });

            await this.postRepo.remove(toDelete);
        }catch(e){
            req.flash('error', 'There was an error deleting post');
        }

        res.redirect('/users/' + req.session.userID);
    }

    constructor(){
        this.postRepo = getRepository(Post);
        this.userRepo = getRepository(User);
        this.commentRepo = getRepository(Comment);
    }

}
