import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, OneToOne, ManyToOne, JoinTable, JoinColumn} from 'typeorm';
import {UnitQt, PricePerUnit} from '../util/typeDefs';
import Recipe from './Recipe';
import NutritionalInfo from './NutritionalInfo';
import User from './User';

@Entity()
export default class Ingredient {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    name : string;
    @Column()
    brand : string;
    @Column('text')
    description : string;
    @Column()
    wastage : number;
    @Column('simple-json')
    price : PricePerUnit;
    @Column('simple-json')
    conversions : UnitQt[];
    @Column('simple-array')
    allergens : string[];

    @ManyToMany(type => Recipe)
    @JoinTable()
    recipes : Recipe[];

    @OneToOne(type => NutritionalInfo, n => n.ingredient, {cascade: true, nullable: true})
    @JoinColumn()
    nutritionalInfo : NutritionalInfo;

    @ManyToOne(type => User, user => user.ingredients)
    author : User;

    unitConvert(initial : UnitQt) : number {
        let factor = this.conversions.concat([this.price]).find(c => c.units == initial.units);

        if(factor) return initial.qt / factor.qt;
    }

    constructor(ingredients : Partial<Ingredient>){
        Object.assign(this, ingredients);
    }

}
