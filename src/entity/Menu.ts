import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, ManyToOne, JoinTable} from 'typeorm';
import {Info} from '../util/typeDefs';
import Recipe from './Recipe';
import User from './User';

//TODO: Add menu/recipe sharing, change constructors in controllers
@Entity()
export default class Menu {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    logo : string;
    @Column()
    header : string;
    @Column('simple-json')
    info : Info;
    @Column('simple-json')
    sharingPermissions : Info;

    @ManyToMany(type => User)
    @JoinTable()
    sharedUsers : User[];
    @ManyToMany(type => Recipe)
    @JoinTable()
    recipes : Recipe[];

    @ManyToOne(type => User, user => user.menus)
    author : User;

    constructor(menu : Partial<Menu>){
        Object.assign(this, menu);
    }

}
