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
    MenuItemSelect,
    MenuItemSelectOption,
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
    const taxAllowed = useHasJobPermission(JobType.Gouv, JobPermission.GouvUpdateTax);
    const fineAllowed = useHasJobPermission(JobType.Gouv, JobPermission.GouvManageFine);
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
                    {taxAllowed && <MenuItemSubMenuLink id="tax">Taxes</MenuItemSubMenuLink>}
                    {taxAllowed && <MenuItemSubMenuLink id="tier">Seuils d'impôts</MenuItemSubMenuLink>}
                    {fineAllowed && <MenuItemSubMenuLink id="fine">Amendes</MenuItemSubMenuLink>}
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
            <SubMenu id="fine">
                <MenuTitle banner={banner}>Amendes</MenuTitle>
                <MenuContent>
                    <MenuItemSubMenuLink id="fine_1">Catégorie 1</MenuItemSubMenuLink>
                    <MenuItemSubMenuLink id="fine_2">Catégorie 2</MenuItemSubMenuLink>
                    <MenuItemSubMenuLink id="fine_3">Catégorie 3</MenuItemSubMenuLink>
                    <MenuItemSubMenuLink id="fine_4">Catégorie 4</MenuItemSubMenuLink>
                </MenuContent>
            </SubMenu>
            <FineSubMenu category={1} />
            <FineSubMenu category={2} />
            <FineSubMenu category={3} />
            <FineSubMenu category={3} />
        </Menu>
    );
};

type FineSubMenuProps = {
    category: number;
};

const FineSubMenu: FunctionComponent<FineSubMenuProps> = ({ category }) => {
    const fines = useRepository(RepositoryType.Fine);
    const finesForCategory = Object.values(fines).filter(fine => fine.category === category);

    return (
        <SubMenu id={`fine_${category}`}>
            <MenuTitle banner="https://nui-img/soz/menu_job_gouv">Amendes categorie {category}</MenuTitle>
            <MenuContent>
                <MenuItemButton
                    onConfirm={() => {
                        fetchNui(NuiEvent.GouvFineAdd, {
                            category,
                        });
                    }}
                >
                    Ajouter une amende
                </MenuItemButton>
                {finesForCategory.map(fine => (
                    <MenuItemSelect
                        key={fine.id}
                        title={fine.label}
                        onConfirm={(i, value) => {
                            if (value === 'label') {
                                fetchNui(NuiEvent.GouvFineSetLabel, {
                                    id: fine.id,
                                });
                            }

                            if (value === 'min') {
                                fetchNui(NuiEvent.GouvFineSetMinPrice, {
                                    id: fine.id,
                                });
                            }

                            if (value === 'max') {
                                fetchNui(NuiEvent.GouvFineSetMaxPrice, {
                                    id: fine.id,
                                });
                            }

                            if (value === 'delete') {
                                fetchNui(NuiEvent.GouvFineRemove, {
                                    id: fine.id,
                                });
                            }
                        }}
                    >
                        <MenuItemSelectOption value="label">Changer le label</MenuItemSelectOption>
                        <MenuItemSelectOption value="min">Prix min: ${fine.price.min}</MenuItemSelectOption>
                        <MenuItemSelectOption value="max">Prix max: ${fine.price.max}</MenuItemSelectOption>
                        <MenuItemSelectOption value="delete">Supprimer</MenuItemSelectOption>
                    </MenuItemSelect>
                ))}
            </MenuContent>
        </SubMenu>
    );
};
