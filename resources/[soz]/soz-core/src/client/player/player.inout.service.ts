import { Injectable } from '../../core/decorators/injectable';
import { AbstractZone } from '../../shared/polyzone/abstract.zone';

export type PlayerInOutServiceElement = {
    id: string;
    zone: AbstractZone;
    cb: (isInside: boolean) => void;
    isLastInside: boolean;
};

@Injectable()
export class PlayerInOutService {
    private elems: Record<string, PlayerInOutServiceElement> = {};

    public add(id: string, zone: AbstractZone, cb: (isInside: boolean) => void): void {
        const elem: PlayerInOutServiceElement = { id: id, zone: zone, cb: cb, isLastInside: false };
        this.elems[id] = elem;
    }

    public get(): Record<string, PlayerInOutServiceElement> {
        return this.elems;
    }

    public remove(id: string) {
        delete this.elems[id];
    }
}
