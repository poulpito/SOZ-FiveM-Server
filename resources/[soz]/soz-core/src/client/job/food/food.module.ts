import { Module } from '../../../core/decorators/module';
import { FoodCraftProvider } from './food.craft.provider';
import { FoodFieldProvider } from './food.field.provider';
import { FoodHuntProvider } from './food.hunt.provider';
import { FoodMealsProvider } from './food.meals.provider';
import { FoodProvider } from './food.provider';

@Module({
    providers: [FoodProvider, FoodFieldProvider, FoodCraftProvider, FoodMealsProvider, FoodHuntProvider],
})
export class FoodModule {}
