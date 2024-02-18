import { FunctionComponent } from 'react';

import { TaxLabel, TaxType } from '../../../../shared/bank';
import { NuiEvent } from '../../../../shared/event';
import { MenuType } from '../../../../shared/nui/menu';
import { RepositoryType } from '../../../../shared/repository';
import { fetchNui } from '../../../fetch';
import { useRepository } from '../../../hook/repository';
import {
    MainMenu,
    Menu,
    MenuContent,
    MenuItemButton,
    MenuItemSubMenuLink,
    MenuItemText,
    MenuTitle,
    SubMenu,
} from '../../Styleguide/Menu';

type MandatoryStateProps = {
    data: {
        onDuty: boolean;
        state: {
            radar: boolean;
        };
    };
};

export const GouvJobMenu: FunctionComponent<MandatoryStateProps> = ({ data }) => {
    const banner = 'https://nui-img/soz/menu_job_gouv';
    const taxData = useRepository(RepositoryType.Tax);

    if (!data.onDuty) {
        return (
            <Menu type={MenuType.GouvJobMenu}>
                <MainMenu>
                    <MenuTitle banner={banner}></MenuTitle>
                    <MenuContent>
                        <MenuItemText>Vous n'êtes pas en service.</MenuItemText>
                    </MenuContent>
                </MainMenu>
            </Menu>
        );
    }

    return (
        <Menu type={MenuType.GouvJobMenu}>
            <MainMenu>
                <MenuTitle banner={banner}></MenuTitle>
                <MenuContent>
                    <MenuItemButton
                        onConfirm={async () => {
                            await fetchNui(NuiEvent.GouvAnnoncement);
                        }}
                    >
                        Faire une communication
                    </MenuItemButton>
                    <MenuItemSubMenuLink id="tax">Gérer les taxes</MenuItemSubMenuLink>
                </MenuContent>
            </MainMenu>
            <SubMenu id="tax">
                <MenuTitle banner={banner}>Les taxes</MenuTitle>
                <MenuContent>
                    {Object.values(TaxType).map(taxType => {
                        const tax = taxData[taxType] ?? { id: taxType, value: 11 };

                        return (
                            <MenuItemButton
                                key={tax.id}
                                onConfirm={() => {
                                    fetchNui(NuiEvent.GouvSetTax, {
                                        type: tax.id,
                                    });
                                }}
                            >
                                {TaxLabel[tax.id]}: {tax.value}%
                            </MenuItemButton>
                        );
                    })}
                </MenuContent>
            </SubMenu>
        </Menu>
    );
};
