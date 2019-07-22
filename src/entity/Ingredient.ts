import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, OneToOne, ManyToOne, JoinTable, JoinColumn} from 'typeorm';
import {UnitQt, PricePerUnit} from '../util/typeDefs';
import Recipe from './Recipe';
import NutritionalInfo from './NutritionalInfo';
import User from './User';

@Entity()
export default class Ingredient {

    @PrimaryGeneratedColumn()
    id : number;

    @ManyToMany(type => Recipe)
    @JoinTable()
    recipes : Recipe[];

    unitConvert(initial : UnitQt) : number {
        let factor = this.conversions.find(c => c.unit == initial.unit);

        if(factor) return factor.qt * initial.qt;
    }

    constructor(
        @Column() public name : string,
        @Column() public brand : string,
        @Column() public wastage : number,
        @Column('simple-json') public price : PricePerUnit,
        @Column('simple-json') public conversions : UnitQt[],
        @Column('simple-array') public allergens : string[],
        @OneToOne(type => NutritionalInfo) @JoinColumn() public nutritionalInfo : NutritionalInfo,
        @ManyToOne(type => User, user => user.ingredients) public author : User
    ){}

}
