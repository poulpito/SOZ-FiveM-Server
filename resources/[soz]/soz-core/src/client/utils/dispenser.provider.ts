import { Once } from '@public/core/decorators/event';
import { Inject } from '@public/core/decorators/injectable';
import { ServerEvent } from '@public/shared/event';
import { Err, Ok } from '@public/shared/result';

import { Provider } from '../../core/decorators/provider';
import { InputService } from '../nui/input.service';
import { PlayerService } from '../player/player.service';
import { ProgressService } from '../progress.service';
import { TargetFactory } from '../target/target.factory';

const dispenser_eat_price = 9;
const dispenser_drink_price = 9;
const dispenser_cafe_price = 9;

const vending_machine_drink = ['prop_vend_soda_01', 'prop_vend_soda_02', 'prop_watercooler_dark', 'prop_watercooler'];
const vending_machine_food = ['prop_vend_snak_01', 'prop_vend_snak_01_tu'];
const vending_machine_cafe = ['prop_vend_coffe_01'];

@Provider()
export class DispenserProvider {
    @Inject(PlayerService)
    public playerService: PlayerService;

    @Inject(TargetFactory)
    public targetFactory: TargetFactory;

    @Inject(ProgressService)
    private progressService: ProgressService;

    @Inject(InputService)
    private inputService: InputService;

    @Once()
    public onStart() {
        this.targetFactory.createForModel(
            vending_machine_drink,
            [
                {
                    label: "Bouteille d'eau ($" + dispenser_drink_price + ')',
                    icon: 'c:food/bouteille.png',
                    action: () => {
                        this.buy('Achète à boire ...', 'water_bottle', dispenser_drink_price);
                    },
                },
                {
                    label: `Lot de bouteilles</br>($${dispenser_drink_price} unité)`,
                    icon: 'c:food/bouteilles.png',
                    action: async () => {
                        const quantity = await this.inputService.askInput(
                            {
                                title: `Choisir la quantité`,
                                defaultValue: '',
                                maxCharacters: 4,
                            },
                            value => {
                                if (!value) {
                                    return Ok(true);
                                }
                                const int = parseInt(value);
                                if (isNaN(int) || !Number.isInteger(int) || int < 0) {
                                    return Err('Veuillez préciser un nombre entier.');
                                }

                                return Ok(true);
                            }
                        );

                        if (!quantity) {
                            return;
                        }

                        this.buy(
                            'Achat de plusieurs bouteilles ...',
                            'water_bottle',
                            dispenser_drink_price,
                            parseInt(quantity)
                        );
                    },
                },
            ],
            1
        );

        this.targetFactory.createForModel(
            vending_machine_food,
            [
                {
                    label: 'Sandwich ($' + dispenser_eat_price + ')',
                    icon: 'c:food/baguette.png',
                    action: () => {
                        this.buy('Achète à manger...', 'sandwich', dispenser_eat_price);
                    },
                },
                {
                    label: `Lot de sandwichs</br>($${dispenser_eat_price} unité)`,
                    icon: 'c:food/baguettes.png',
                    action: async () => {
                        const quantity = await this.inputService.askInput(
                            {
                                title: `Choisir la quantité`,
                                defaultValue: '',
                                maxCharacters: 4,
                            },
                            value => {
                                if (!value) {
                                    return Ok(true);
                                }
                                const int = parseInt(value);
                                if (isNaN(int) || !Number.isInteger(int) || int < 0) {
                                    return Err('Veuillez préciser un nombre entier.');
                                }

                                return Ok(true);
                            }
                        );

                        if (!quantity) {
                            return;
                        }

                        this.buy(
                            'Achat de plusieurs sandwichs ...',
                            'sandwich',
                            dispenser_eat_price,
                            parseInt(quantity)
                        );
                    },
                },
            ],
            1
        );

        this.targetFactory.createForModel(
            vending_machine_cafe,
            [
                {
                    label: `Café ($${dispenser_cafe_price})`,
                    icon: 'c:food/cafe.png',
                    action: () => {
                        this.buy('Achète un Café ...', 'coffee', dispenser_cafe_price);
                    },
                },
                {
                    label: `Lot de café</br>($${dispenser_cafe_price} unité)`,
                    icon: 'c:food/cafes.png',
                    action: async () => {
                        const quantity = await this.inputService.askInput(
                            {
                                title: `Choisir la quantité`,
                                defaultValue: '',
                                maxCharacters: 4,
                            },
                            value => {
                                if (!value) {
                                    return Ok(true);
                                }
                                const int = parseInt(value);
                                if (isNaN(int) || !Number.isInteger(int) || int < 0) {
                                    return Err('Veuillez préciser un nombre entier.');
                                }

                                return Ok(true);
                            }
                        );

                        if (!quantity) {
                            return;
                        }

                        this.buy('Achat de plusieurs Cafés ...', 'coffee', dispenser_cafe_price, parseInt(quantity));
                    },
                },
            ],
            1
        );
    }

    private async buy(action: string, item: string, price: number, quantity?: number) {
        const { completed } = await this.progressService.progress(
            'dispenser_buy',
            action,
            5000,
            {
                dictionary: 'mini@sprunk',
                name: 'plyr_buy_drink_pt1',
                flags: 16,
            },
            {
                useAnimationService: true,
                disableMovement: true,
                disableCarMovement: false,
                disableMouse: false,
                disableCombat: true,
            }
        );

        if (!completed) {
            return;
        }

        TriggerServerEvent(ServerEvent.DISPENSER_BUY, price, item, quantity ?? 1);
    }
}
