import { useBackspace } from '@public/nui/hook/control';
import { useNuiEvent, useNuiFocus } from '@public/nui/hook/nui';
import { useOutside } from '@public/nui/hook/outside';
import { healthLevelToLabel, stressLevelToLabel } from '@public/shared/health';
import { MedicalMetadata } from '@public/shared/item';
import { bones, DamageGravity, DamageServerData, DamagesTypes, JobsWithInjuries } from '@public/shared/job/lsmc';
import { PlayerCriminalState } from '@public/shared/player';
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

    const damages = medicalDatas.damages;
    const patient = medicalDatas.patient;

    const groupByBones = (arr, property) => {
        return arr.reduce(function (memo, x) {
            if (!memo[bones[x[property]]]) {
                memo[bones[x[property]]] = [];
            }
            memo[bones[x[property]]].push(x);
            return memo;
        }, {});
    };

    const groupedDamages = groupByBones(damages, 'bone');

    const getRandomInt = (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

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

    const getInjuriesStatus = (patient): [allowed: boolean, label: string] => {
        let state = '';
        let allowed = false;
        if (patient.metadata.criminal_state == PlayerCriminalState.Allowed) {
            allowed = true;
            if (patient.metadata.injuries_count >= 7) {
                state = 'graves';
            } else if (patient.metadata.injuries_count >= 4) {
                state = 'moyennes';
            } else if (patient.metadata.injuries_count >= 1) {
                state = 'légères';
            } else {
                state = 'aucunes';
            }
        } else if (JobsWithInjuries.includes(patient.job.id)) {
            allowed = true;
            if (patient.metadata.injuries_count >= 3) {
                state = 'graves';
            } else if (patient.metadata.injuries_count >= 2) {
                state = 'moyennes';
            } else if (patient.metadata.injuries_count >= 1) {
                state = 'légères';
            } else {
                state = 'aucunes';
            }
        }
        return [allowed, state];
    };

    const getWoundImportance = (damageQty: number, isFatal?: boolean) => {
        if (isFatal) {
            return 4;
        }

        if (damageQty <= 10) {
            return 0;
        } else if (damageQty <= 30) {
            return 1;
        } else if (damageQty <= 60) {
            return 2;
        } else if (damageQty >= 60) {
            return 3;
        } else if (damageQty >= 100) {
            return 4;
        } else {
            return 5;
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

    const getShadowByWoundGravity = (woundGravity: number) => {
        switch (woundGravity) {
            case 1:
                return '[box-shadow:_0_1px_12px_rgb(39_169_43)] border-[rgb(39,169,43)] hover:bg-[rgba(39,169,43,0.5)]';
                break;
            case 2:
                return '[box-shadow:_0_1px_12px_rgb(0_177_247)] border-[rgb(0,177,247)] hover:bg-[rgba(0,177,247,0.5)]';
                break;
            case 3:
                return '[box-shadow:_0_1px_12px_rgb(226_60_0)] border-[rgb(226,60,0)] hover:bg-[rgba(226,60,0,0.5)]';
                break;
            case 4:
                return '[box-shadow:_0_1px_12px_rgb(141_0_250)] border-[rgb(141,0,250)] hover:bg-[rgba(141,0,250,0.5)]';
                break;
            case 5:
                return '[box-shadow:_0_1px_12px_rgb(255_255_255)] border-[rgb(255,255,255)] hover:bg-[rgba(255,255,255,0.5)]';
                break;

            default:
                return '[box-shadow:_0_1px_12px_rgb(255_255_255)] border-[rgb(255,255,255)] hover:bg-[rgba(255,255,255,0.5)]';
                break;
        }
    };

    function getStyleByGravity(damage: number, isFatal: boolean) {
        return getShadowByWoundGravity(getWoundImportance(damage, isFatal));
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

    const getColorByWoundGravity = (woundGravity: number) => {
        switch (woundGravity) {
            case 1:
                return '#27A92B';
                break;
            case 2:
                return '#00B1F7';
                break;
            case 3:
                return '#E23C00';
                break;
            case 4:
                return '#8D00FA';
                break;
            case 5:
                return '#FFFFFF';
                break;

            default:
                return '#FFFFFF';
                break;
        }
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

    const renderDamagedZones = (damages: DamageServerData[]) => {
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
            <div className="flex-col w-full">
                <div className="flex flex-col h-full">
                    <div className="flex flex-row mt-[1rem] justify-center h-[12%]">
                        {renderCenterZones(headZone.label, headZone.zones)}
                    </div>

                    <div className="flex flex-row my-[2rem] h-[12%]">
                        <div className="flex flex-col w-[42%]">
                            {renderLeftZones(rightShoulder.label, rightShoulder.zones)}
                        </div>
                        <div className="flex flex-col w-[16%]"></div>

                        <div className="flex flex-col w-[42%]">
                            {renderRightZones(leftShoulder.label, leftShoulder.zones)}
                        </div>
                    </div>
                    <div className="flex flex-row my-[2rem]  h-[12%]">
                        <div className="flex flex-col  w-[40%]">{renderLeftZones(rightArm.label, rightArm.zones)}</div>
                        <div className="flex flex-col w-[20%]"></div>
                        <div className="flex flex-col w-[40%]">{renderRightZones(leftArm.label, leftArm.zones)}</div>
                    </div>
                    <div className="flex flex-row my-[2rem] h-[12%]">
                        <div className="flex flex-col w-[38%]">{renderLeftZones(rightHand.label, rightHand.zones)}</div>
                        <div className="flex flex-col w-[24%]"></div>
                        <div className="flex flex-col w-[38%]">{renderRightZones(leftHand.label, leftHand.zones)}</div>
                    </div>
                    <div className="flex flex-row my-[2rem]  h-[12%]">
                        <div className="flex flex-col  w-[42%]">{renderLeftZones(rightLeg.label, rightLeg.zones)}</div>
                        <div className="flex flex-col  w-[16%]"></div>

                        <div className="flex flex-col  w-[42%]">{renderRightZones(leftLeg.label, leftLeg.zones)}</div>
                    </div>
                    <div className="flex flex-row my-[2rem] h-[12%]">
                        <div className="flex flex-col w-[40%]">{renderLeftZones(rightFoot.label, rightFoot.zones)}</div>
                        <div className="flex flex-col w-[20%]"></div>
                        <div className="flex flex-col w-[40%]">{renderRightZones(leftFoot.label, leftFoot.zones)}</div>
                    </div>
                    <div className="flex flex-row mb-[3rem] justify-center w-full h-[12%] mt-2">
                        <div className="flex flex-col w-[33%] h-full">
                            {renderCenterZones(bones[0], damages[bones[0]])}
                        </div>
                        <div className="flex flex-col w-[33%]">
                            {renderCenterZones(bones[24817], damages[bones[24817]])}
                        </div>
                        <div className="flex flex-col w-[33%]">
                            {renderCenterZones(bones[24816], damages[bones[24816]])}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderRightZones = (name: string, damages: DamageServerData[]) => {
        const globalZoneColor = damages ? getColorByWoundGravity(getMaxGravityInzone(damages)) : 'rgba(39,169,43,0.7)';

        return (
            <div className={`flex flex-row justify-start items-center h-full`}>
                <div
                    className="flex flex-row h-full p-4 min-w-[7rem] min-h-[7rem] [box-shadow:_0_1px_5px_rgb(39_169_43)] bg-black bg-opacity-50"
                    style={{
                        borderWidth: '0.1rem 0.1rem 0.1rem 0.3rem',
                        borderColor: globalZoneColor,
                        boxShadow: `0 1px 12px ${globalZoneColor}`,
                    }}
                >
                    {renderDamagedIcons(damages)}
                </div>
                <div className="flex flex-col h-full items-start pt-[1rem] text-lg ps-4 uppercase text-green-500 font-bold">
                    <p className="[text-shadow:_0_1px_12px_rgb(39_169_43)]">{name}</p>
                </div>
            </div>
        );
    };

    const renderLeftZones = (name: string, damages: DamageServerData[]) => {
        const globalZoneColor = damages ? getColorByWoundGravity(getMaxGravityInzone(damages)) : 'rgba(39,169,43,0.7)';

        return (
            <div className={`flex flex-row justify-end items-center h-full`}>
                <div className="flex flex-col h-full items-start pt-[1rem] text-lg pe-4 uppercase text-green-500 font-bold">
                    <p className="[text-shadow:_0_1px_12px_rgb(39_169_43)]">{name}</p>
                </div>
                <div
                    className="flex flex-row h-full min-w-[7rem] min-h-[7rem] p-4  bg-black bg-opacity-50"
                    style={{
                        borderWidth: '0.1rem 0.3rem 0.1rem 0.1rem',
                        borderColor: globalZoneColor,
                        boxShadow: `0 1px 12px ${globalZoneColor}`,
                    }}
                >
                    {renderDamagedIcons(damages)}
                </div>
            </div>
        );
    };

    const renderCenterZones = (name: string, damages: DamageServerData[]) => {
        const globalZoneColor = damages ? getColorByWoundGravity(getMaxGravityInzone(damages)) : 'rgba(39,169,43,0.7)';

        return (
            <div className={`flex flex-col justify-end items-center  h-full`}>
                <div className="flex flex-col h-full justify-center items-start pt-[1rem] text-lg pb-2 uppercase text-green-500 font-bold   ">
                    <p className="[text-shadow:_0_1px_12px_rgb(39_169_43)]">{name}</p>
                </div>
                <div
                    className="flex flex-row p-4 min-w-[7rem] min-h-[7rem] h-full [box-shadow:_0_1px_5px_rgb(39_169_43)] bg-black bg-opacity-50"
                    style={{
                        borderWidth: '0.3rem 0.1rem 0.1rem 0.1rem',
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
        const textColor = getColorByWoundGravity(gravity);

        return (
            <div className="flex flex-col h-full opacity-90 text-[rgb(255,255,255)] [text-shadow:_0_1px_12px_rgb(255_255_255)]">
                <div className="flex flex-row">
                    <div className="flex flex-col uppercase font-bold w-[75%] justify-center items-start pe-[1rem]">
                        <p className="text-2xs mb-[1rem]">
                            Analyse : #
                            {(Math.random() * 10000).toFixed(0) + '-' + patient.charinfo.lastname.toUpperCase()}
                        </p>
                        <p className="text-lg">
                            {DamagesTypes[damage.damageType].label}
                            {count > 1 && ' Multiple'}
                        </p>
                        <div
                            className={`h-[2]  w-full opacity-30 pt-[1px] my-2`}
                            style={{ backgroundColor: textColor, boxShadow: `0 1px 12px ${textColor}` }}
                        ></div>
                        <p
                            className={`text-m`}
                            style={{
                                color: textColor,
                                textShadow: `0 1px 12px ${textColor}`,
                            }}
                        >
                            {DamageGravity[gravity]}
                        </p>
                        <div
                            className={`h-[2] w-full opacity-30 pt-[1px] my-2`}
                            style={{ backgroundColor: textColor, boxShadow: `0 1px 12px ${textColor}` }}
                        ></div>{' '}
                        <p className="text-m">{getWoundAnteriority(damage.date)}</p>
                    </div>
                    <div className="flex flex-col justify-start h-[6rem] items-start w-[25%]">
                        {<img src={`/public/images/lsmc/icons/${getIconByDamageType(damage.damageType)}.webp`}></img>}
                    </div>
                </div>
                <div
                    className={`h-[2] w-full opacity-30 pt-[1px] my-2`}
                    style={{ backgroundColor: textColor, boxShadow: `0 1px 12px ${textColor}` }}
                ></div>
                <div className="flex flex-col w-full">
                    <p className="uppercase text-lg font-bold mt-[1rem]">Informations détaillées : </p>
                    <p className="pt-4 text-justify px-1">{DamagesTypes[damage.damageType].description}</p>
                </div>
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
                                className={`w-[5rem] h-[5rem]  mx-2 ${styleByGravity} bg-opacity-50 border-solid border-4 rounded flex items-center justify-center mx-1 cursor-pointer group`}
                            >
                                {false && damages.length > 1 && (
                                    <span className="absolute ms-[4rem] mb-[4rem] font-bold">{damages.length}</span>
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
                                    className={`flex flex-col top-[30rem] left-[30rem] absolute min-h-[30rem] w-[25rem] bg-[black] 
                                    border-2 p-2 ${styleByGravity} bg-opacity-100 scale-0 group-hover:scale-100 border-l-8`}
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
        return (
            <>
                <div className="[box-shadow:_0_1px_10px_rgb(39_169_43)] [text-shadow:_0_1px_15px_rgb(255_255_255)] border-2 border-green-700 p-2 h-full">
                    <h1 className="mb-2 text-xl text-green-500 [text-shadow:_0_1px_5px_rgb(39_169_43)]">
                        Informations
                    </h1>
                    <div className="h-[1px] bg-green-500 bg-opacity-30 [box-shadow:_0_1px_10px_rgb(39_169_43)]  mb-2"></div>
                    <p className="my-1">
                        Nom : <span>{patient.charinfo.lastname}</span>
                    </p>
                    <p className="mb-2">
                        Prénom : <span>{patient.charinfo.firstname}</span>
                    </p>
                    <div className="h-[1px] bg-green-500 bg-opacity-30 [box-shadow:_0_1px_10px_rgb(39_169_43)] mb-2"></div>
                    <p className="mb-2">
                        DATE : <span>{format(medicalDatas.date, 'yyyy-MM-dd HH:mm:ss')} </span>
                    </p>
                </div>
                <div className="[box-shadow:_0_1px_10px_rgb(39_169_43)] mt-10 [text-shadow:_0_2px_12px_rgb(255_255_255)] border-2 border-green-700 p-2 h-full">
                    <h1 className="mb-2 text-xl text-green-500 [text-shadow:_0_2px_12px_rgb(39_169_43)]">Constantes</h1>
                    <div className="h-[1px] bg-green-500 bg-opacity-30 [box-shadow:_0_1px_10px_rgb(39_169_43)]  mb-2"></div>
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
                            <img className="w-[2.5rem]" src={`/public/images/lsmc/icons/O2.webp`}></img>
                        </div>
                        <div className="flex flex-col text-l">{getRandomInt(95, 99)} %</div>
                    </div>
                </div>
            </>
        );
    };

    const renderRightPatientInformations = () => {
        const healthStateLabel = healthLevelToLabel(patient.metadata.health_level, 0, 100);
        const stressLevelLabel = stressLevelToLabel(patient.metadata.stress_level);
        const maxStaminaLevelLabel = healthLevelToLabel(patient.metadata.max_stamina, 60, 150);
        const strengthLevelLabel = healthLevelToLabel(patient.metadata.strength, 60, 150);
        const [injuriesAllowed, injuriesLabel] = getInjuriesStatus(patient);

        return (
            <>
                <div className="[box-shadow:_0_1px_10px_rgb(39_169_43)] [text-shadow:_0_1px_15px_rgb(255_255_255)] border-2 border-green-700 p-2 h-full">
                    <h1 className="mb-2 text-xl text-green-500 [text-shadow:_0_2px_12px_rgb(39_169_43)]">
                        Santé Générale
                    </h1>
                    <div className="h-[1px] bg-green-500 bg-opacity-30 [box-shadow:_0_1px_10px_rgb(39_169_43)]  mb-2"></div>
                    <h2 className="mb-2 text-l text-green-500 [text-shadow:_0_2px_12px_rgb(39_169_43)]">Nutrition</h2>
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
                    <div className="h-[1px] my-2 bg-green-500 bg-opacity-30 [box-shadow:_0_1px_10px_rgb(39_169_43)]  mb-2"></div>
                    <h2 className="my-2 text-l text-green-500 [text-shadow:_0_2px_12px_rgb(39_169_43)]">
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
                            <div className="h-[1px] my-2 bg-green-500 bg-opacity-30 [box-shadow:_0_1px_10px_rgb(39_169_43)]  mb-2"></div>
                            <h2 className="my-2 text-l text-green-500 [text-shadow:_0_2px_12px_rgb(39_169_43)]">
                                Blessures
                            </h2>
                            <div className="capitalize">
                                <p>État des blessures : {injuriesLabel}</p>
                            </div>
                        </>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="absolute w-full h-full flex justify-center items-center text-white">
            <div
                ref={refOutside}
                style={{
                    backgroundImage: `url(/public/images/lsmc/background.png)`,
                    margin: 'auto auto',
                    height: '90%',
                    width: '89%',
                    backgroundSize: 'cover',
                }}
            >
                <div className="w-full h-full p-5">
                    <div className="h-full flex flex-col ">
                        <div className="flex flex-row w-ful relative">
                            <div className="font-bold fixed ms-2 mt-2 flex flex-col w-[25rem]">
                                {renderLeftPatientInformations()}
                            </div>
                            <div className="font-bold fixed flex flex-col right-[12vh] w-[25rem]">
                                {renderRightPatientInformations()}
                            </div>
                        </div>
                        <div className="flex flex-row h-full">{renderDamagedZones(groupedDamages)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
