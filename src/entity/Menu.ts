import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, ManyToOne, JoinTable} from 'typeorm';
import {Info} from '../util/typeDefs';
import Recipe from './Recipe';
import User from './User';

//TODO: Add menu/recipe sharing
@Entity()
export default class Menu {

    @PrimaryGeneratedColumn()
    id : number;

    constructor(
        @Column() public logo : string,
        @Column() public text : string,
        @Column() public info : Info,
        @ManyToMany(type => Recipe) @JoinTable() public recipes : Recipe[],
        @ManyToOne(type => User, user => user.menus) public author : User
    ){}

}
