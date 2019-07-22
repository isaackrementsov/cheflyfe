import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany} from 'typeorm';
import User from './User';
import Comment from './Comment';

@Entity()
export default class Post {

    @PrimaryGeneratedColumn()
    id : number;

    @OneToMany(type => Comment, comment => comment.post)
    comments : Comment[];

    constructor(
        @Column() public title : string,
        @Column() public text : string,
        @Column('simple-array') public filePaths : string[],
        @ManyToOne(type => User, user => user.posts) public author : User
    ){}

}
