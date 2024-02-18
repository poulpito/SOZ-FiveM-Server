import { Injectable } from '../../core/decorators/injectable';
import { TaxType } from '../../shared/bank';
import { RepositoryType } from '../../shared/repository';
import { Repository } from './repository';

@Injectable(TaxRepository, Repository)
export class TaxRepository extends Repository<RepositoryType.Tax> {
    public type = RepositoryType.Tax;

    public getTaxValue(taxType: TaxType): number {
        const tax = this.find(taxType);

        if (!tax) {
            return 0;
        }

        return tax.value;
    }
}
