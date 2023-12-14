import '../DiagnosticPad/index.scss';

import { useBackspace } from '@public/nui/hook/control';
import { useNuiEvent, useNuiFocus } from '@public/nui/hook/nui';
import { useOutside } from '@public/nui/hook/outside';
import { healthLevelToLabel, stressLevelToLabel } from '@public/shared/health';
import { MedicalMetadata } from '@public/shared/item';
import {
    bones,
    DamageConfigs,
    DamageGravity,
    DamageServerData,
    DamagesTypes,
    JobsWithInjuries,
} from '@public/shared/job/lsmc';
import { PlayerCriminalState, PlayerMetadata } from '@public/shared/player';
import { getRandomInt } from '@public/shared/random';
import { format } from 'date-fns';
import { FunctionComponent, useState } from 'react';
export const MedicalApp: FunctionComponent = () => {
    const [medicalDatas, setMedicalDatas] = useState<MedicalMetadata>(null);

    useNuiFocus(medicalDatas !== null, medicalDatas !== null, false);
    useNuiEvent('medicalDiag', 'open', setMedicalDatas);

    const refOutside = useOutside({
        click: () => setMedicalDatas(null),
    });

    useBackspace(() => {
        if (medicalDatas) {
            setMedicalDatas(null);
        }
    });

    if (!medicalDatas) {
        return null;
    }

    const patient = medicalDatas.patient;

    const getBodyStatesStyle = (level: number) => {
        if (level < 25) {
            return 'red';
        } else if (level < 50) {
            return 'orange';
        } else if (level < 75) {
            return 'yellow';
        } else if (level >= 100) {
            return 'rgb(34, 197, 94)';
        }
    };

    const getHeartRate = (stressLevel: number, health: number) => {
        const healthLevel = health - 100;
        let min = 60;
        let max = 90;
        if (stressLevel > 50) {
            min = 100;
            max = 140;
        }

        if (stressLevel > 80) {
            min = 120;
            max = 180;
        }

        if (healthLevel < 20) {
            min = 120;
            max = 130;
        }

        return getRandomInt(min, max);
    };

    const getInjuriesStatus = (metadata: PlayerMetadata): [allowed: boolean, label: string] => {
        let state = '';
        let allowed = false;
        if (metadata.criminal_state == PlayerCriminalState.Allowed) {
            allowed = true;
            if (metadata.injuries_count >= 7) {
                state = 'graves';
            } else if (metadata.injuries_count >= 4) {
                state = 'moyennes';
            } else if (metadata.injuries_count >= 1) {
                state = 'légères';
            } else {
                state = 'aucunes';
            }
        } else if (JobsWithInjuries.includes(patient.job.id)) {
            allowed = true;
            if (metadata.injuries_count >= 3) {
                state = 'graves';
            } else if (metadata.injuries_count >= 2) {
                state = 'moyennes';
            } else if (metadata.injuries_count >= 1) {
                state = 'légères';
            } else {
                state = 'aucunes';
            }
        }
        return [allowed, state];
    };

    const getWoundImportance = (damageQty: number, isFatal?: boolean) => {
        if (isFatal) {
            return DamageGravity.Critical;
        }

        if (damageQty <= 10) {
            return DamageGravity.VerySmall;
        } else if (damageQty <= 30) {
            return DamageGravity.Small;
        } else if (damageQty <= 50) {
            return DamageGravity.Medium;
        } else if (damageQty <= 70) {
            return DamageGravity.Heavy;
        } else {
            return DamageGravity.Critical;
        }
    };

    function getWoundAnteriority(damageDate: number) {
        const time = Date.now() - damageDate;
        const hours = time / 1000 / 60 / 60;

        if (hours < 1) {
            return "Moins d'une heure";
        } else if (hours < 3) {
            return "Plus d'une heure";
        } else if (hours < 12) {
            return 'Entre 3 et 12 heures';
        } else {
            return 'Plus de 12 heures';
        }
    }

    function getStyleByGravity(damage: number, isFatal: boolean) {
        const woundGravity = getWoundImportance(damage, isFatal);
        return DamageConfigs[woundGravity].color;
    }

    const getMaxGravityInzone = (damages: DamageServerData[]) => {
        let globalDamages = 0;
        let isOneFatal = false;
        damages.map(damage => {
            globalDamages += damage.damageQty;
            damage.isFatal ? (isOneFatal = true) : false;
        });
        return getWoundImportance(globalDamages, isOneFatal);
    };

    const getIconByDamageType = (damageType: number) => {
        switch (damageType) {
            case 0:
                return 'unknown';
                break;
            case 2:
                return 'melee';
                break;
            case 3:
                return 'bullet';
                break;
            case 5:
                return 'explosive';
                break;
            case 6:
                return 'fire';
                break;
            case 8:
                return 'fall';
                break;
            case 10:
                return 'electrocution';
                break;
            case 11:
                return 'wire-';
                break;
            case 901:
                return 'dehydratation';
                break;
            case 902:
                return 'alcohol';
                break;
            case 903:
                return 'overdose';
                break;
            case 904:
                return 'hunger';
                break;
            case 905:
                return 'choc';
                break;
            case 906:
                return 'drown';
                break;
            case 907:
                return 'entaille';
                break;

            default:
                return 'unknown';
                break;
        }
    };

    function groupByMultiple(array, f) {
        const groups = {};
        array.forEach(function (o) {
            const group = JSON.stringify(f(o));
            groups[group] = groups[group] || [];
            groups[group].push(o);
        });
        return Object.keys(groups).map(function (group) {
            return groups[group];
        });
    }

    const renderDamagedZones = () => {
        const damages = medicalDatas.damages.reduce(function (memo, damage) {
            if (!memo[bones[damage.bone]]) {
                memo[bones[damage.bone]] = [];
            }
            memo[bones[damage.bone]].push(damage);
            return memo;
        }, {});

        const headZone = {
            label: bones[31086],
            zones: damages[bones[31086]],
        };
        // Epaules
        const rightShoulder = {
            label: bones[10706],
            zones: damages[bones[10706]],
        };
        const leftShoulder = {
            label: bones[64729],
            zones: damages[bones[64729]],
        };
        // Bras
        const rightArm = {
            label: bones[40269],
            zones: damages[bones[40269]],
        };
        const leftArm = {
            label: bones[45509],
            zones: damages[bones[45509]],
        };
        // Mains
        const rightHand = {
            label: bones[57005],
            zones: damages[bones[57005]],
        };
        const leftHand = {
            label: bones[18905],
            zones: damages[bones[18905]],
        };

        // Jambes
        const rightLeg = {
            label: bones[36864],
            zones: damages[bones[36864]],
        };
        const leftLeg = {
            label: bones[63931],
            zones: damages[bones[63931]],
        };
        // Pieds
        const rightFoot = {
            label: bones[52301],
            zones: damages[bones[52301]],
        };
        const leftFoot = {
            label: bones[14201],
            zones: damages[bones[14201]],
        };

        return (
            <div className="flex flex-row h-full w-full ">
                <div className="flex flex-col pl-[13vh] w-[80%] h-full">
                    <div className="flex flex-row pb-[1vh] justify-center h-[15%]">
                        {renderZones(headZone.label, headZone.zones)}
                    </div>
                    <div className="flex flex-row h-[16%]">
                        <div className="flex flex-col w-[33%] items-end">
                            {renderZones(rightShoulder.label, rightShoulder.zones)}
                        </div>
                        <div className="flex flex-col w-[33%]"></div>

                        <div className="flex flex-col w-[33%] items-start">
                            {renderZones(leftShoulder.label, leftShoulder.zones)}
                        </div>
                    </div>
                    <div className="flex flex-row h-[15%]">
                        <div className="flex flex-col w-[28%] items-end">
                            {renderZones(rightArm.label, rightArm.zones)}
                        </div>
                        <div className="flex flex-col w-[41%]"></div>
                        <div className="flex flex-col w-[20%] items-start">
                            {renderZones(leftArm.label, leftArm.zones)}
                        </div>
                    </div>
                    <div className="flex flex-row h-[20%]">
                        <div className="flex flex-col w-[37%]">{renderZones(rightHand.label, rightHand.zones)}</div>
                        <div className="flex flex-col w-[24%]"></div>
                        <div className="flex flex-col w-[38%]">{renderZones(leftHand.label, leftHand.zones)}</div>
                    </div>
                    <div className="flex flex-row h-[20%]">
                        <div className="flex flex-col w-[35%] items-end">
                            {renderZones(rightLeg.label, rightLeg.zones)}
                        </div>
                        <div className="flex flex-col w-[28%]"></div>

                        <div className="flex flex-col w-[27%] items-start">
                            {renderZones(leftLeg.label, leftLeg.zones)}
                        </div>
                    </div>
                    <div className="flex flex-row h-[20%]">
                        <div className="flex flex-col w-[28%] items-end">
                            {renderZones(rightFoot.label, rightFoot.zones)}
                        </div>
                        <div className="flex flex-col w-[40%]"></div>
                        <div className="flex flex-col w-[30%] items-start">
                            {renderZones(leftFoot.label, leftFoot.zones)}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col h-full w-[20%] justify-start items-center">
                    <div className="bg-[black] h-[65%] bg-opacity-25 p-8 border-[2px] border-[#8bfee19a] rounded-[3vh] [box-shadow:_0_1px_5px_rgb(39_169_151)]">
                        <div className="flex flex-col h-[33%]">{renderZones(bones[0], damages[bones[0]])}</div>
                        <div className="flex flex-col h-[33%]">{renderZones(bones[24817], damages[bones[24817]])}</div>
                        <div className="flex flex-col h-[33%]">{renderZones(bones[24816], damages[bones[24816]])}</div>
                    </div>
                </div>
            </div>
        );
    };

    function getGlobalZoneColor(damages: DamageServerData[]) {
        return damages ? DamageConfigs[getMaxGravityInzone(damages)].color : 'rgba(39,169,151,0.7)';
    }

    const renderZones = (name: string, damages: DamageServerData[]) => {
        const globalZoneColor = getGlobalZoneColor(damages);

        return (
            <div className={`flex flex-col justify-end items-center`}>
                <div className="flex flex-col justify-center items-start py-[0.5vh] text-[#53e2cf]">
                    <p className="neuropol text-s [text-shadow:_0_1px_12px_rgb(39_169_151)]">{name}</p>
                </div>
                <div
                    className="flex flex-row justify-center min-w-[8vh] min-h-[8vh] rounded-lg [box-shadow:_0_1px_5px_rgb(39_169_151)] bg-black bg-opacity-50"
                    style={{
                        borderWidth: '0.2vh',
                        borderColor: globalZoneColor,
                        boxShadow: `0 1px 12px ${globalZoneColor}`,
                    }}
                >
                    {renderDamagedIcons(damages)}
                </div>
            </div>
        );
    };

    const renderDetail = (damage: DamageServerData, count: number, globalDamages) => {
        const gravity = getWoundImportance(globalDamages, damage.isFatal);
        const textColor = DamageConfigs[gravity].color;
        return (
            <div
                className="flex flex-col h-full p-4 opacity-90 [text-shadow:_0_1px_12px_rgb(39_169_151)]"
                style={{ color: 'white' }}
            >
                <div className="flex flex-row">
                    <div className="flex flex-col uppercase  w-[75%] justify-center items-start pe-[1rem]">
                        <p className="text-2xs mb-[1rem]">
                            Analyse : #
                            {(Math.random() * 10000).toFixed(0) + '-' + patient.charinfo.lastname.toUpperCase()}
                        </p>
                        <p className="text-lg neuropol">
                            {DamagesTypes[damage.damageType].label}
                            {count > 1 && ' Multiple'}
                        </p>
                        <div
                            className={`h-[2]  w-full opacity-30 pt-[1px] my-2`}
                            style={{ backgroundColor: textColor, boxShadow: `0 1px 12px ${textColor}` }}
                        ></div>
                        <p
                            className={`text-m neuropol`}
                            style={{
                                color: textColor,
                                textShadow: `0 1px 12px ${textColor}`,
                            }}
                        >
                            {DamageConfigs[gravity].label}
                        </p>
                        <div
                            className={`h-[2] w-full opacity-30 pt-[1px] my-2`}
                            style={{ backgroundColor: textColor, boxShadow: `0 1px 12px ${textColor}` }}
                        ></div>{' '}
                        <p className="text-m neuropol">{getWoundAnteriority(damage.date)}</p>
                    </div>
                    <div className="flex flex-col justify-start h-[6rem] items-start w-[25%]">
                        {<img src={`/public/images/lsmc/icons/${getIconByDamageType(damage.damageType)}.webp`}></img>}
                    </div>
                </div>
                <div
                    className={`h-[2] w-full opacity-30 pt-[1px] my-2`}
                    style={{ backgroundColor: textColor, boxShadow: `0 1px 12px ${textColor}` }}
                ></div>
            </div>
        );
    };

    const renderDamagedIcons = (damages: DamageServerData[]) => {
        let sortedDamage = [];
        if (damages) {
            sortedDamage = groupByMultiple(damages, function (damage: DamageServerData) {
                return [damage.damageType, getWoundImportance(damage.damageQty)];
            });
        }

        return (
            <div className="flex flex-row items-center min-w-[20%] h-full">
                {sortedDamage &&
                    sortedDamage.map((damages, index) => {
                        let globalDamages = 0;
                        damages.map(damage => {
                            globalDamages += damage.damageQty;
                        });
                        const styleByGravity = getStyleByGravity(globalDamages, damages[0].isFatal);
                        return (
                            <div
                                key={index}
                                className={`h-[5vh] w-[5vh] bg-opacity-50 border-solid border-4 rounded flex items-center justify-center cursor-pointer group`}
                                style={{
                                    boxShadow: `0 1px 12px ${styleByGravity}`,
                                    borderColor: styleByGravity,
                                }}
                            >
                                {false && damages.length > 1 && (
                                    <span className="absolute ms-[4rem] mb-[4rem] ">{damages.length}</span>
                                )}
                                {
                                    <img
                                        className="p-1"
                                        src={`/public/images/lsmc/icons/${getIconByDamageType(
                                            damages[0].damageType
                                        )}.webp`}
                                    ></img>
                                }
                                <div
                                    className={`flex flex-col bottom-[9vh] left-[132vh] absolute w-[30vh] rounded-[2vh] bg-[black] 
                                    border-2 p-2 bg-opacity-100 scale-0 group-hover:scale-100`}
                                    style={{
                                        boxShadow: `0 1px 12px ${styleByGravity}`,
                                        borderColor: styleByGravity,
                                    }}
                                >
                                    {renderDetail(damages[0], damages.length, globalDamages)}
                                </div>
                            </div>
                        );
                    })}
            </div>
        );
    };

    const renderLeftPatientInformations = () => {
        const healthStateLabel = healthLevelToLabel(patient.metadata.health_level, 0, 100);
        const stressLevelLabel = stressLevelToLabel(patient.metadata.stress_level);
        const maxStaminaLevelLabel = healthLevelToLabel(patient.metadata.max_stamina, 60, 150);
        const strengthLevelLabel = healthLevelToLabel(patient.metadata.strength, 60, 150);
        const [injuriesAllowed, injuriesLabel] = getInjuriesStatus(patient.metadata);
        return (
            <>
                <div className="[box-shadow:_0_1px_10px_rgb(39_169_151)] [text-shadow:_0_1px_15px_rgb(255_255_255)] rounded-lg border-2 border-[#27a997] h-full">
                    <h1 className="neuropol mb-2 text-xl text-[#53e2cf] [text-shadow:_0_1px_5px_rgb(39_169_151)] px-2 pu-1 rounded-t bg-[#27a99842]">
                        Informations
                    </h1>
                    <div className="px-2">
                        <p className="my-1">
                            Nom : <span>{patient.charinfo.lastname}</span>
                        </p>
                        <p className="mb-2">
                            Prénom : <span>{patient.charinfo.firstname}</span>
                        </p>
                        <div className="h-[1px] bg-green-500 bg-opacity-30 [box-shadow:_0_1px_10px_rgb(39_169_151)] mb-2"></div>
                        <p className="mb-2">
                            DATE : <span>{format(medicalDatas.date, 'yyyy-MM-dd HH:mm:ss')} </span>
                        </p>
                    </div>
                </div>
                <div className="[box-shadow:_0_1px_10px_rgb(39_169_151)] mt-10 [text-shadow:_0_2px_12px_rgb(255_255_255)]  rounded-lg border-2 border-[#27a997] h-full">
                    <h1 className="neuropol mb-2 text-xl text-[#53e2cf] [text-shadow:_0_2px_12px_rgb(39_169_151)] px-2 py-1 rounded-t bg-[#27a99842]">
                        Constantes
                    </h1>
                    <div className="my-1 flex flex-row items-center">
                        <div className="flex flex-col me-[1rem]">
                            <img className="w-[2.5rem]" src={`/public/images/lsmc/icons/heart.webp`}></img>
                        </div>
                        <div className="flex flex-col text-l">
                            {getHeartRate(patient.metadata.stress_level, patient.metadata.health)}
                        </div>
                    </div>
                    <div className="flex flex-row items-center my-2">
                        <div className="flex flex-col me-[1rem]">
                            <img className="w-[2.5rem]" src={`/public/images/lsmc/icons/o2.webp`}></img>
                        </div>
                        <div className="flex flex-col text-l">{getRandomInt(95, 99)} %</div>
                    </div>
                </div>
                <div className="[box-shadow:_0_1px_10px_rgb(39_169_151)] mt-10 [text-shadow:_0_1px_15px_rgb(255_255_255)] rounded-lg border-2 border-[#27a997] h-full">
                    <h1 className="neuropol mb-2 text-xl text-[#53e2cf] [text-shadow:_0_2px_12px_rgb(39_169_151)] px-2 py-1 rounded-t bg-[#27a99842]">
                        Santé Générale
                    </h1>
                    <div className="px-2">
                        <h2 className="mb-2 text-l text-[#53e2cf] [text-shadow:_0_2px_12px_rgb(39_169_151)]">
                            Nutrition
                        </h2>
                        <div className="capitalize">
                            <p>
                                Glucides :{' '}
                                <span
                                    style={{
                                        color: getBodyStatesStyle(patient.metadata.sugar),
                                        textShadow: `0 1px 12px ${getBodyStatesStyle(patient.metadata.sugar)}`,
                                    }}
                                >
                                    {patient.metadata.sugar} %{' '}
                                </span>
                            </p>
                            <p>
                                Lipides :{' '}
                                <span
                                    style={{
                                        color: getBodyStatesStyle(patient.metadata.lipid),
                                        textShadow: `0 1px 12px ${getBodyStatesStyle(patient.metadata.lipid)}`,
                                    }}
                                >
                                    {patient.metadata.lipid} %{' '}
                                </span>
                            </p>
                            <p>
                                Protéïnes :{' '}
                                <span
                                    style={{
                                        color: getBodyStatesStyle(patient.metadata.protein),
                                        textShadow: `0 1px 12px ${getBodyStatesStyle(patient.metadata.protein)}`,
                                    }}
                                >
                                    {patient.metadata.protein} %{' '}
                                </span>
                            </p>
                            <p>
                                Fibres :{' '}
                                <span
                                    style={{
                                        color: getBodyStatesStyle(patient.metadata.fiber),
                                        textShadow: `0 1px 12px ${getBodyStatesStyle(patient.metadata.fiber)}`,
                                    }}
                                >
                                    {patient.metadata.fiber} %{' '}
                                </span>
                            </p>
                        </div>
                        <div className="h-[1px] my-2 bg-green-500 bg-opacity-30 [box-shadow:_0_1px_10px_rgb(39_169_151)]  mb-2"></div>
                        <h2 className="my-2 text-l text-[#53e2cf] [text-shadow:_0_2px_12px_rgb(39_169_151)]">
                            Condition physique
                        </h2>
                        <div className="capitalize">
                            <p>Santé : {healthStateLabel}</p>
                            <p>Force : {strengthLevelLabel}</p>
                            <p>Stress : {stressLevelLabel}</p>
                            <p>Endurance : {maxStaminaLevelLabel}</p>
                        </div>
                        {injuriesAllowed && (
                            <>
                                <div className="h-[1px] my-2 bg-green-500 bg-opacity-30 [box-shadow:_0_1px_10px_rgb(39_169_151)]  mb-2"></div>
                                <h2 className="my-2 text-l text-[#53e2cf] [text-shadow:_0_2px_12px_rgb(39_169_151)]">
                                    Blessures
                                </h2>
                                <div className="capitalize">
                                    <p>État des blessures : {injuriesLabel}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="absolute w-[177vh] h-full flex justify-center items-center text-white">
            <div
                ref={refOutside}
                style={{
                    backgroundImage: `url(/public/images/lsmc/medical_app_background_${
                        patient.charinfo.gender === 0 ? 'male' : 'female'
                    }.png)`,
                    width: '100%',
                    height: '100%',
                    margin: '4vh',
                    backgroundSize: 'cover',
                    padding: '6vh',
                }}
            >
                <div className="w-full h-full p-5">
                    <div className="h-full flex flex-row ">
                        <div className="flex flex-col relative w-[40vh]">
                            <div className=" ms-2 mt-2 flex flex-col ">{renderLeftPatientInformations()}</div>
                        </div>
                        <div className="flex flex-col w-full h-full">{renderDamagedZones()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
