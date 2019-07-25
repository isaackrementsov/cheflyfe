import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany} from 'typeorm';
import User from './User';
import Comment from './Comment';

@Entity()
export default class Post {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    name : string;
    @Column()
    content : string;
    @Column('simple-array')
    filePaths : string[];

    @OneToMany(type => Comment, comment => comment.post)
    comments : Comment[];

    @ManyToOne(type => User, user => user.posts)
    author : User;

    constructor(post : Partial<Post>){
        Object.assign(this, post);
    }

}
