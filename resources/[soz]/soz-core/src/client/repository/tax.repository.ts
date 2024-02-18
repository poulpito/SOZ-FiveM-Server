import { Injectable } from '../../core/decorators/injectable';
import { DEFAULT_TAX_PERCENTAGE, TaxType } from '../../shared/bank';
import { RepositoryType } from '../../shared/repository';
import { Repository } from './repository';

@Injectable(TaxRepository, Repository)
export class TaxRepository extends Repository<RepositoryType.Tax> {
    public type = RepositoryType.Tax;

    public getTaxValue(taxType: TaxType): number {
        const tax = this.find(taxType);

        if (!tax) {
            return DEFAULT_TAX_PERCENTAGE;
        }

        return tax.value;
    }
}
