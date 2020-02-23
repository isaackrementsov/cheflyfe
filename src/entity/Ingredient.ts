import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, OneToOne, ManyToOne, JoinColumn, AfterInsert} from 'typeorm';
import {UnitQt, PricePerUnit, PurchaseRecord} from '../util/typeDefs';
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
    @Column()
    timestamp : Date = new Date();
    @Column('simple-json')
    price : PricePerUnit;
    @Column('simple-json')
    conversions : UnitQt[];
    @Column('simple-array')
    allergens : string[];
    @Column('simple-json')
    purchaseRecords : PurchaseRecord[] = [];

    @ManyToMany(type => Recipe, recipe => recipe.ingredients)
    recipes : Recipe[];

    @OneToOne(type => NutritionalInfo, n => n.ingredient, {cascade: true, nullable: true})
    @JoinColumn()
    nutritionalInfo : NutritionalInfo;

    @ManyToOne(type => User, user => user.ingredients)
    author : User;

    grams : number = 0;

    unitConvert(initial : UnitQt) : number {
        let factor = this.conversions.concat([this.price]).find(c => c.units == initial.units);

        if(factor) return initial.qt / factor.qt;
        else return 0;
    }

    tryToGetGrams(initial : UnitQt) : number {
        let acceptedUnits =         ['g', 'lbs',   'oz',    'grain',   'kg', 'mg',   'ml', 'l', 'fl oz',     'pt',       'gal',   'cup'];
        let acceptedConversions =   [1,   453.592, 28.3495, 0.0647989, 1000, 1/1000, 1,    10,  29.57352956, 473.176475, 3785.41, 236.5882375];
        let conversions = [{units: this.price.units, qt: 1}].concat(this.conversions);
        let startUnitQt = initial;

        //startUnitQt.qt = this.unitConvert(startUnitQt);

        let acceptedConversion = conversions.find(u => acceptedUnits.indexOf(u.units) != 1);

        if(acceptedConversion){
            let qt0 = acceptedConversion.qt * initial.qt;
            let idx = acceptedUnits.indexOf(acceptedConversion.units);

            return qt0 * acceptedConversions[idx];
        }else{
            return 0;
        }
    }

    constructor(ingredients : Partial<Ingredient>){
        Object.assign(this, ingredients);
    }

}
