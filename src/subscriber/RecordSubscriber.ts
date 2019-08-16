import {EventSubscriber, EntitySubscriberInterface, InsertEvent, getRepository} from 'typeorm';
import Record from '../entity/Record';
import Ingredient from '../entity/Ingredient';
import Menu from '../entity/Menu';
import Post from '../entity/Post';
import Recipe from '../entity/Recipe';
import User from '../entity/User';
import { DBCategory } from '../util/typeDefs';

@EventSubscriber()
export default class RecordSubscriber implements EntitySubscriberInterface {
    entityValues = [Ingredient, Menu, Post, Recipe, User];
    entityCategories : DBCategory[] = ['ingredient', 'menu', 'post', 'recipe', 'user'];

    beforeInsert(event: InsertEvent<any>){
        if(event.entity){
            let i = this.entityValues.indexOf(event.entity.constructor);

            if(i != -1){
                getRepository(Record).save(new Record(this.entityCategories[i]));
            }
        }
    }

}
