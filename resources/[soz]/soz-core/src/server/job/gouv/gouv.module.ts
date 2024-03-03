import { Module } from '../../../core/decorators/module';
import { GouvFineProvider } from './gouv.fine.provider';
import { GouvProvider } from './gouv.provider';

@Module({
    providers: [GouvFineProvider, GouvProvider],
})
export class GouvModule {}
