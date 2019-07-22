import {Entity, Column, PrimaryGeneratedColumn, ManyToOne} from 'typeorm';
import Post from './Post';
import User from './User';

//TODO: Add user tagging
@Entity()
export default class Comment {

    @PrimaryGeneratedColumn()
    id : number;

    constructor(
        @Column() public text : string,
        @ManyToOne(type => Post, post => post.comments) public post : Post,
        @ManyToOne(type => User, user => user.comments) public author : User
    ){}

}
