import { Animation } from '../animation';
import { Component, Prop, WardrobeConfig } from '../cloth';
import { VanillaComponentDrawableIndexMaxValue, VanillaPropDrawableIndexMaxValue } from '../drawable';
import { joaat } from '../joaat';
import { JobType } from '../job';
import { Vector3, Vector4 } from '../polyzone/vector';

export type KillerVehData = {
    name: string;
    seat: number;
    plate: string;
};

export const JobsWithInjuries = [JobType.LSPD, JobType.BCSO, JobType.SASP, JobType.CashTransfer];

export const bones = {
    52301: 'Pied droit',
    14201: 'Pied gauche',
    57005: 'Main droite',
    18905: 'Main gauche',
    36864: 'Jambe droite',
    63931: 'Jambe gauche',
    31086: 'Tête',
    39317: 'Nuque',
    28252: 'Bras droit',
    61163: 'Bras gauche',
    24818: 'Torse',
    11816: 'Bassin',
    40269: 'Bras droit',
    45509: 'Bras gauche',
    28422: 'Poignet droit',
    60309: 'Poignet gauche',
    47495: 'Langue',
    20178: 'Lèvre supérieure',
    17188: 'Lèvre inférieure',
    51826: 'Jambe droite',
    58217: 'Jambe gauche',
    64729: 'Épaule gauche',
    57597: 'Dos',
    24817: 'Dos',
    24816: 'Ventre',
    23553: 'Dos',
    0: 'Torse',
    20781: 'SKEL_R_Toe0',
    64081: 'SKEL_R_Finger42',
    64080: 'SKEL_R_Finger41',
    58870: 'SKEL_R_Finger40',
    64065: 'SKEL_R_Finger32',
    64064: 'SKEL_R_Finger31',
    58869: 'SKEL_R_Finger30',
    64113: 'SKEL_R_Finger22',
    64112: 'SKEL_R_Finger21',
    58868: 'SKEL_R_Finger20',
    64097: 'SKEL_R_Finger12',
    64096: 'SKEL_R_Finger11',
    58867: 'SKEL_R_Finger10',
    64017: 'SKEL_R_Finger02',
    64016: 'SKEL_R_Finger01',
    58866: 'SKEL_R_Finger00',
    10706: 'Épaule droite',
    2108: 'SKEL_L_Toe0',
    58271: 'Jambe gauche',
    4154: 'SKEL_L_Finger42',
    4153: 'SKEL_L_Finger41',
    26614: 'SKEL_L_Finger40',
    4138: 'SKEL_L_Finger32',
    4137: 'SKEL_L_Finger31',
    26613: 'SKEL_L_Finger30',
    4186: 'SKEL_L_Finger22',
    4185: 'SKEL_L_Finger21',
    26612: 'SKEL_L_Finger20',
    4170: 'SKEL_L_Finger12',
    4169: 'SKEL_L_Finger11',
    26611: 'SKEL_L_Finger10',
    4090: 'SKEL_L_Finger02',
    4089: 'SKEL_L_Finger01',
    26610: 'SKEL_L_Finger00',
    6442: 'RB_R_ThighRoll',
    43810: 'RB_R_ForeArmRoll',
    37119: 'RB_R_ArmRoll',
    35731: 'Tête',
    23639: 'RB_L_ThighRoll',
    61007: 'RB_L_ForeArmRoll',
    5232: 'RB_L_ArmRoll',
    24806: 'PH_R_Foot',
    57717: 'PH_L_Foot',
    16335: 'Jambe droite',
    2992: 'Bras droit',
    46078: 'Jambe gauche',
    22711: 'Bras gauche',
    56604: 'IK_Root',
    6286: 'Main droite',
    35502: 'IK_R_Foot',
    36029: 'Main gauche',
    65245: 'Pied gauche',
    12844: 'Tête',
    61839: 'FB_UpperLip_000',
    17719: 'FB_R_Lip_Top_000',
    11174: 'FB_R_Lip_Corner_000',
    49979: 'FB_R_Lip_Bot_000',
    43536: 'FB_R_Lid_Upper_000',
    27474: 'Oeil droit',
    19336: 'FB_R_CheekBone_000',
    1356: 'FB_R_Brow_Out_000',
    20623: 'FB_LowerLip_000',
    20279: 'FB_L_Lip_Top_000',
    29868: 'FB_L_Lip_Corner_000',
    47419: 'FB_L_Lip_Bot_000',
    45750: 'FB_L_Lid_Upper_000',
    25260: 'FB_L_Eye_000',
    21550: 'FB_L_CheekBone_000',
    58331: 'FB_L_Brow_Out_000',
    46240: 'Machoire',
    37193: 'FB_Brow_Centre_000',
    65068: 'FACIAL_facialRoot',
};

export const DamageGravity = {
    0: 'Très faible',
    1: 'Faible',
    2: 'Moyenne',
    3: 'Sévère',
    4: 'Critique',
    5: 'Inconnue',
};

export const DamagesTypes = {
    0: {
        label: 'Blessure',
        description: 'Détection de blessures de nature inconnue.',
    },
    2: {
        label: 'Mélée',
        description:
            "Blessure pouvant être induite par des coups à main nue, ou à l'aide d'une arme blanche telle qu'une batte de baseball, ou un couteau.",
    },
    3: {
        label: 'Balles',
        description:
            "Détection d'une blessure par balle. Il s'agit d'un traumatisme physique causé par une balle d'une arme à feu. Les dommages peuvent inclure des saignements, des fractures, des dommages aux organes, une infection de la plaie, ou la perte de la capacité de bouger une partie du corps",
    },
    5: {
        label: 'Explosif',
        description:
            'Détection de blessures internes épidermiques ayant pu être causé par une onde de choc brûlante typique des explosifs.',
    },
    6: {
        label: 'Brûlure',
        description:
            'Détection de lésions épidermiques ayant pu être causées par des chaleurs extrêmes telles que des flammes, ou une explosion.',
    },
    8: {
        label: 'Chute',
        description: "Détection d'écchymoses ayant pu être causés par une chute plus ou moins importante.",
    },
    10: {
        label: 'Électrocution',
        description:
            "Détection d'un passage d'électricité dans le corps ayant pu bauser des brûlures, des troubles cardiaques, des lésions d'organes ou le décès dans des cas sévères.",
    },
    11: {
        label: 'Barbelés',
        description: 'Détection de multiples entailles rapprochées typiques de grillages, barbelés, ronces.',
    },
    901: {
        label: 'Déshydratation',
        description:
            "Détection d'une élimination trop importante d'eau et de sels minéraux, qui sont essentiels au bon fonctionnement de l'organisme. Risque de fièvre, de gastroentérite, de diarhée, ou d'évanouissement dans des cas sévère.",
    },
    902: {
        label: "Overdose d'alcool",
        description: "Détection d'un taux d'alcoolémie dans le sang ayant amené à une perte de conscience. ",
    },
    903: {
        label: 'Overdose de drogue',
        description: "Détection d'une surdose critique de molécules ayant amené à une perte de conscience.",
    },
    904: {
        label: 'Faim',
        description:
            "Détection d'une importante baisse de glycémie ayant pu amener à une transpiration excessive, des tremblements, une asthénie, une faiblesse et une incapacité à réfléchir clairement, voir l'évanouissement.",
    },
    905: {
        label: 'Choc',
        description:
            "Détection d'écchymoses pouvant être amenée par un choc ayant provoqué la rupture de vaisseaux sanguins.",
    },
    906: {
        label: 'Noyade',
        description: "Détection d'une insuffisance respiratoire résultant de la submersion dans un milieu liquide.",
    },
    907: {
        label: 'Grosse Entaille',
        description:
            "Détection d'une blessure nette faite par un objet tranchant (arme blanche frappant de taille, éclat de verre, tôle, etc.), plus ou moins profonde mais souvent hémorragique.",
    },
};

export type DamageData = {
    victimId: string;
    attackerId: number;
    bone: number;
    damageType: number;
    weapon: string;
    damageQty: number;
    isFatal: boolean;
    lastDamage?: number;
};

export type KillData = {
    killerid: number;
    killertype: number;
    killerentitytype: number;
    weaponhash: number;
    weapondamagetype: number;
    weapongroup: number;
    killpos: Vector3;
    killerveh?: KillerVehData;
    ejection: boolean;
    hungerThristDeath: boolean;
    frozenDeath: boolean;
};

export const PHARMACY_PRICES = {
    tissue: 125,
    antibiotic: 125,
    pommade: 125,
    painkiller: 125,
    antiacide: 125,
    heal: 400,
    health_book: 50,
};

export const BedLocations: Vector4[] = [
    [344.27, -1457.18, 32.43, 51.0],
    [347.96, -1452.78, 32.43, 50.99],
    [351.8, -1448.2, 32.43, 50.99],
    [355.65, -1443.61, 32.43, 51.0],
    [346.08, -1443.43, 32.43, 228.99],
    [342.23, -1448.01, 32.43, 228.99],
    [338.38, -1452.6, 32.43, 229.0],
];
export function getBedName(index: number) {
    return `UHU_BED_POS_${index}`;
}

export const FailoverLocationName = 'UHU_FAILOVER_LCOCATION';
export const FailoverLocation: Vector4 = [342.82, -1460.64, 32.51, 315.75];

export const PatientClothes: WardrobeConfig = {
    [joaat('mp_m_freemode_01')]: {
        ['Patient']: {
            Components: {
                [Component.Mask]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Torso]: { Drawable: 15, Texture: 0, Palette: 0 },
                [Component.Legs]: { Drawable: 61, Texture: 0, Palette: 0 },
                [Component.Bag]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Shoes]: { Drawable: 34, Texture: 0, Palette: 0 },
                [Component.Accessories]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Undershirt]: { Drawable: 15, Texture: 0, Palette: 0 },
                [Component.BodyArmor]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Decals]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Tops]: {
                    Drawable: VanillaComponentDrawableIndexMaxValue[joaat('mp_m_freemode_01')][Component.Tops] + 7,
                    Texture: 0,
                    Palette: 0,
                },
            },
            Props: {
                [Prop.Hat]: { Clear: true },
                [Prop.Glasses]: { Clear: true },
                [Prop.Ear]: { Clear: true },
                [Prop.LeftHand]: { Clear: true },
                [Prop.RightHand]: { Clear: true },
                [Prop.Helmet]: { Clear: true },
            },
            GlovesID: 0,
        },
    },
    [joaat('mp_f_freemode_01')]: {
        ['Patient']: {
            Components: {
                [Component.Mask]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Torso]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Legs]: { Drawable: 15, Texture: 3, Palette: 0 },
                [Component.Bag]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Shoes]: { Drawable: 35, Texture: 0, Palette: 0 },
                [Component.Accessories]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Undershirt]: { Drawable: 14, Texture: 0, Palette: 0 },
                [Component.BodyArmor]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Decals]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Tops]: {
                    Drawable: VanillaComponentDrawableIndexMaxValue[joaat('mp_f_freemode_01')][Component.Tops] + 7,
                    Texture: 0,
                    Palette: 0,
                },
            },
            Props: {
                [Prop.Hat]: { Clear: true },
                [Prop.Glasses]: { Clear: true },
                [Prop.Ear]: { Clear: true },
                [Prop.LeftHand]: { Clear: true },
                [Prop.RightHand]: { Clear: true },
                [Prop.Helmet]: { Clear: true },
            },
            GlovesID: 0,
        },
    },
};

export const DUTY_OUTFIT_NAME = 'Tenue de service';
export const HAZMAT_OUTFIT_NAME = 'Tenue hazmat';

export const LsmcCloakroom: WardrobeConfig = {
    [joaat('mp_m_freemode_01')]: {
        [DUTY_OUTFIT_NAME]: {
            Components: {
                [Component.Torso]: { Drawable: 92, Texture: 0, Palette: 0 },
                [Component.Legs]: {
                    Drawable: VanillaComponentDrawableIndexMaxValue[joaat('mp_m_freemode_01')][Component.Legs] + 4,
                    Texture: 0,
                    Palette: 0,
                },
                [Component.Shoes]: { Drawable: 51, Texture: 0, Palette: 0 },
                [Component.Accessories]: {
                    Drawable: VanillaComponentDrawableIndexMaxValue[joaat('mp_m_freemode_01')][Component.Accessories],
                    Texture: 0,
                    Palette: 0,
                },
                [Component.Undershirt]: {
                    Drawable:
                        VanillaComponentDrawableIndexMaxValue[joaat('mp_m_freemode_01')][Component.Undershirt] + 5,
                    Texture: 0,
                    Palette: 0,
                },
                [Component.Decals]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Tops]: {
                    Drawable: VanillaComponentDrawableIndexMaxValue[joaat('mp_m_freemode_01')][Component.Tops] + 3,
                    Texture: 0,
                    Palette: 0,
                },
            },
            Props: {},
        },
        ['Tenue incendie']: {
            Components: {
                [Component.Torso]: { Drawable: 96, Texture: 0, Palette: 0 },
                [Component.Legs]: { Drawable: 120, Texture: 0, Palette: 0 },
                [Component.Shoes]: { Drawable: 24, Texture: 0, Palette: 0 },
                [Component.Accessories]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Undershirt]: { Drawable: 151, Texture: 0, Palette: 0 },
                [Component.BodyArmor]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Decals]: { Drawable: 16, Texture: 0, Palette: 0 },
                [Component.Tops]: { Drawable: 314, Texture: 0, Palette: 0 },
            },
            Props: {
                [Prop.Hat]: {
                    Drawable: VanillaPropDrawableIndexMaxValue[joaat('mp_m_freemode_01')][Prop.Hat] + 3,
                    Texture: 0,
                    Palette: 0,
                },
            },
        },
        [HAZMAT_OUTFIT_NAME]: {
            Components: {
                [Component.Mask]: { Drawable: 46, Texture: 0, Palette: 0 },
                [Component.Torso]: { Drawable: 86, Texture: 0, Palette: 0 },
                [Component.Legs]: { Drawable: 40, Texture: 0, Palette: 0 },
                [Component.Bag]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Shoes]: { Drawable: 25, Texture: 0, Palette: 0 },
                [Component.Accessories]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Undershirt]: { Drawable: 62, Texture: 0, Palette: 0 },
                [Component.BodyArmor]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Decals]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Tops]: { Drawable: 67, Texture: 0, Palette: 0 },
            },
            Props: { [Prop.Hat]: { Clear: true } },
        },
        ['Tenue Hiver']: {
            Components: {
                [Component.Torso]: { Drawable: 90, Texture: 0, Palette: 0 },
                [Component.Legs]: {
                    Drawable: VanillaComponentDrawableIndexMaxValue[joaat('mp_m_freemode_01')][Component.Legs] + 4,
                    Texture: 0,
                    Palette: 0,
                },
                [Component.Shoes]: { Drawable: 51, Texture: 0, Palette: 0 },
                [Component.Accessories]: {
                    Drawable: VanillaComponentDrawableIndexMaxValue[joaat('mp_m_freemode_01')][Component.Accessories],
                    Texture: 0,
                    Palette: 0,
                },
                [Component.Undershirt]: { Drawable: 179, Texture: 11, Palette: 0 },
                [Component.BodyArmor]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Decals]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Tops]: {
                    Drawable: VanillaComponentDrawableIndexMaxValue[joaat('mp_m_freemode_01')][Component.Tops] + 6,
                    Texture: 0,
                    Palette: 0,
                },
            },
            Props: {},
        },
    },
    [joaat('mp_f_freemode_01')]: {
        [DUTY_OUTFIT_NAME]: {
            Components: {
                [Component.Torso]: { Drawable: 106, Texture: 0, Palette: 0 },
                [Component.Legs]: {
                    Drawable: VanillaComponentDrawableIndexMaxValue[joaat('mp_f_freemode_01')][Component.Legs] + 4,
                    Texture: 0,
                    Palette: 0,
                },
                [Component.Shoes]: { Drawable: 52, Texture: 0, Palette: 0 },
                [Component.Accessories]: {
                    Drawable: VanillaComponentDrawableIndexMaxValue[joaat('mp_f_freemode_01')][Component.Accessories],
                    Texture: 0,
                    Palette: 0,
                },
                [Component.Undershirt]: {
                    Drawable:
                        VanillaComponentDrawableIndexMaxValue[joaat('mp_f_freemode_01')][Component.Undershirt] + 5,
                    Texture: 0,
                    Palette: 0,
                },
                [Component.Decals]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Tops]: {
                    Drawable: VanillaComponentDrawableIndexMaxValue[joaat('mp_f_freemode_01')][Component.Tops] + 3,
                    Texture: 0,
                    Palette: 0,
                },
            },
            Props: {},
        },
        ['Tenue incendie']: {
            Components: {
                [Component.Torso]: { Drawable: 111, Texture: 0, Palette: 0 },
                [Component.Legs]: { Drawable: 126, Texture: 0, Palette: 0 },
                [Component.Shoes]: { Drawable: 24, Texture: 0, Palette: 0 },
                [Component.Accessories]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Undershirt]: { Drawable: 187, Texture: 0, Palette: 0 },
                [Component.BodyArmor]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Decals]: { Drawable: 15, Texture: 0, Palette: 0 },
                [Component.Tops]: { Drawable: 325, Texture: 0, Palette: 0 },
            },
            Props: {
                [Prop.Hat]: {
                    Drawable: VanillaPropDrawableIndexMaxValue[joaat('mp_f_freemode_01')][Prop.Hat] + 3,
                    Texture: 0,
                    Palette: 0,
                },
            },
        },
        [HAZMAT_OUTFIT_NAME]: {
            Components: {
                [Component.Mask]: { Drawable: 46, Texture: 0, Palette: 0 },
                [Component.Torso]: { Drawable: 101, Texture: 0, Palette: 0 },
                [Component.Legs]: { Drawable: 40, Texture: 0, Palette: 0 },
                [Component.Bag]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Shoes]: { Drawable: 25, Texture: 0, Palette: 0 },
                [Component.Accessories]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Undershirt]: { Drawable: 43, Texture: 0, Palette: 0 },
                [Component.BodyArmor]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Decals]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Tops]: { Drawable: 61, Texture: 0, Palette: 0 },
            },
            Props: { [0]: { Clear: true } },
        },
        ['Tenue Hiver']: {
            Components: {
                [Component.Torso]: { Drawable: 106, Texture: 0, Palette: 0 },
                [Component.Legs]: {
                    Drawable: VanillaComponentDrawableIndexMaxValue[joaat('mp_f_freemode_01')][Component.Legs] + 4,
                    Texture: 0,
                    Palette: 0,
                },
                [Component.Shoes]: { Drawable: 52, Texture: 0, Palette: 0 },
                [Component.Accessories]: {
                    Drawable: VanillaComponentDrawableIndexMaxValue[joaat('mp_f_freemode_01')][Component.Accessories],
                    Texture: 0,
                    Palette: 0,
                },
                [Component.Undershirt]: { Drawable: 217, Texture: 11, Palette: 0 },
                [Component.BodyArmor]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Decals]: { Drawable: 0, Texture: 0, Palette: 0 },
                [Component.Tops]: {
                    Drawable: VanillaComponentDrawableIndexMaxValue[joaat('mp_f_freemode_01')][Component.Tops] + 6,
                    Texture: 0,
                    Palette: 0,
                },
            },
            Props: {},
        },
    },
};

export const LSMCConfig = {
    scanTime: 10000,
    damageRetentionDays: 3,
};

export type DamageServerData = {
    citizenid: string;
    attackerId: string;
    bone: number;
    damageType: number;
    weapon: string;
    damageQty: number;
    isFatal: boolean;
    date: number;
};

export const WheelChairModel = 'prop_wheelchair_01';
export const StretcherModel = 'fernocot';
export const StretcherFoldedModel = 'loweredfernocot';
export const deathAnim: Animation = {
    base: {
        dictionary: 'dead',
        name: 'dead_a',
        blendInSpeed: 8.0,
        blendOutSpeed: 8.0,
        options: {
            repeat: true,
        },
    },
};

export enum PlasterLocation {
    //LeftArm = 'left_arm',
    //RightArm = 'right_arm',
    LeftFeet = 'left_feet',
    RightFeet = 'right_feet',
    LeftHand = 'left_hand',
    RighHand = 'right_hand',
    Neck = 'neck',
}

export type PlasterConfig = {
    label: string;
    bone: number;
    prop: Record<number, string>;
    position: Vector3;
    rotation: Vector3;
};

export const PlasterConfigs: Record<PlasterLocation, PlasterConfig> = {
    /*
    [PlasterLocation.LeftArm]: {
        label: 'Bras Gauche',
        bone: 22711,
        prop: {
            [joaat('mp_m_freemode_01')]: 'soz_med_plaster_a_l_h',
            [joaat('mp_f_freemode_01')]: 'soz_med_plaster_a_l_f',
        },
        position: [0.0, 0.0, 0.0],
        rotation: [0.0, 0.0, 0.0],
    },
    [PlasterLocation.RightArm]: {
        label: 'Bras Droit',
        bone: 2992,
        prop: {
            [joaat('mp_m_freemode_01')]: 'soz_med_plaster_a_r_h',
            [joaat('mp_f_freemode_01')]: 'soz_med_plaster_a_r_f',
        },
        position: [0.0, 0.0, 0.0],
        rotation: [0.0, 0.0, 0.0],
    },*/
    [PlasterLocation.LeftFeet]: {
        label: 'Pied Gauche',
        bone: 63931,
        prop: {
            [joaat('mp_m_freemode_01')]: 'soz_med_plaster_f_l',
            [joaat('mp_f_freemode_01')]: 'soz_med_plaster_f_l',
        },
        position: [0.32, 0.13, 0.0],
        rotation: [0.0, -2.0, 8.0],
    },
    [PlasterLocation.RightFeet]: {
        label: 'Pied Droit',
        bone: 36864,
        prop: {
            [joaat('mp_m_freemode_01')]: 'soz_med_plaster_f_r',
            [joaat('mp_f_freemode_01')]: 'soz_med_plaster_f_r',
        },
        position: [0.32, 0.13, 0.0],
        rotation: [0.0, 0.0, 8.0],
    },
    [PlasterLocation.LeftHand]: {
        label: 'Main Gauche',
        bone: 61163,
        prop: {
            [joaat('mp_m_freemode_01')]: 'soz_med_plaster_h_l',
            [joaat('mp_f_freemode_01')]: 'soz_med_plaster_h_l',
        },
        position: [0.27, 0.0, 0.0],
        rotation: [180.0, 0.0, 0.0],
    },
    [PlasterLocation.RighHand]: {
        label: 'Main Droit',
        bone: 28252,
        prop: {
            [joaat('mp_m_freemode_01')]: 'soz_med_plaster_h_r',
            [joaat('mp_f_freemode_01')]: 'soz_med_plaster_h_r',
        },
        position: [0.27, 0.0, 0.0],
        rotation: [180.0, 0.0, 0.0],
    },
    [PlasterLocation.Neck]: {
        label: 'Cou',
        bone: 39317,
        prop: {
            [joaat('mp_m_freemode_01')]: 'soz_med_plaster_n',
            [joaat('mp_f_freemode_01')]: 'soz_med_plaster_n',
        },
        position: [0.08, 0.0, 0.0],
        rotation: [0.0, 0.0, 180.0],
    },
};

export type PlasterMenuData = {
    locations: PlasterLocation[];
    playerServerId: number;
};
