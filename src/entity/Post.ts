import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany} from 'typeorm';
import {Rating} from '../util/typeDefs';
import User from './User';
import Comment from './Comment';

//TODO: convert all long strings to @Column('text')
@Entity()
export default class Post {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    name : string;
    @Column('text')
    content : string;
    @Column()
    likes : number = 0;
    @Column('simple-array')
    filePaths : string[];
    @Column()
    timestamp : Date = new Date();
    @Column('simple-json')
    ratings : Rating[];

    @OneToMany(type => Comment, comment => comment.post, {cascade: true})
    comments : Comment[];

    @ManyToOne(type => User, user => user.posts)
    author : User;

    constructor(post : Partial<Post>){
        Object.assign(this, post);
    }

}
