import { FunctionComponent } from 'react';

import { TaxLabel, TaxType } from '../../../../shared/bank';
import { NuiEvent } from '../../../../shared/event';
import { JobPermission, JobType } from '../../../../shared/job';
import { MenuType } from '../../../../shared/nui/menu';
import { RepositoryType } from '../../../../shared/repository';
import { fetchNui } from '../../../fetch';
import { useHasJobPermission } from '../../../hook/job';
import { useConfigurationValue, useRepository } from '../../../hook/repository';
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
    const allowed = useHasJobPermission(JobType.Gouv, JobPermission.GouvUpdateTax);
    const tier = useConfigurationValue('JobTaxTier');

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
                    {allowed && <MenuItemSubMenuLink id="tax">Gérer les taxes</MenuItemSubMenuLink>}
                    {allowed && <MenuItemSubMenuLink id="tier">Gérer les seuils d'impôts</MenuItemSubMenuLink>}
                </MenuContent>
            </MainMenu>
            {allowed && (
                <>
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
                    <SubMenu id="tier">
                        <MenuTitle banner={banner}>Seuil des Impôts</MenuTitle>
                        <MenuContent>
                            <MenuItemButton
                                onConfirm={() => {
                                    fetchNui(NuiEvent.GouvSetJobTaxTier, {
                                        tier: 'Tier1',
                                    });
                                }}
                            >
                                Tier 1 : {tier.Tier1}
                            </MenuItemButton>
                            <MenuItemButton
                                onConfirm={() => {
                                    fetchNui(NuiEvent.GouvSetJobTaxTier, {
                                        tier: 'Tier2',
                                    });
                                }}
                            >
                                Tier 2 : {tier.Tier2}
                            </MenuItemButton>
                            <MenuItemButton
                                onConfirm={() => {
                                    fetchNui(NuiEvent.GouvSetJobTaxTier, {
                                        tier: 'Tier3',
                                    });
                                }}
                            >
                                Tier 3 : {tier.Tier3}
                            </MenuItemButton>
                            <MenuItemButton
                                onConfirm={() => {
                                    fetchNui(NuiEvent.GouvSetJobTaxTier, {
                                        tier: 'Tier4',
                                    });
                                }}
                            >
                                Tier 4 : {tier.Tier4}
                            </MenuItemButton>
                        </MenuContent>
                    </SubMenu>
                </>
            )}
        </Menu>
    );
};
