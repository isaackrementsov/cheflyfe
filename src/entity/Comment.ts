import {Entity, Column, PrimaryGeneratedColumn, ManyToOne} from 'typeorm';
import Post from './Post';
import User from './User';

//TODO: Add user tagging
@Entity()
export default class Comment {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    content : string;

    @ManyToOne(type => Post, post => post.comments)
    post : Post;
    @ManyToOne(type => User, user => user.comments)
    author : User;

    constructor(comment : Partial<Comment>){
        Object.assign(this, comment);
    }

}
