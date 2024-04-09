import { Inject, Injectable } from '@public/core/decorators/injectable';
import { Logger } from '@public/core/logger';
import { wait } from '@public/core/utils';
import { ServerEvent } from '@public/shared/event';
import { getDistance, Vector3 } from '@public/shared/polyzone/vector';

import { Notifier } from './notifier';

interface RopeState {
    rope: number;
    baseEntity: number;
    maxLength: number;
    attachPosition: Vector3;
    holdingObjectProp: number;
    lastRopeLength?: number;
}

@Injectable()
export class RopeService {
    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(Logger)
    private logger: Logger;

    private ropeState: RopeState | null = null;

    public createNewRope(
        attachPosition: Vector3,
        baseEntity: number,
        ropeType: number,
        maxLength: number,
        holdingObjectPropName: string,
        ropeData?: string
    ): number | null {
        const position = GetEntityCoords(PlayerPedId(), true) as Vector3;
        if (this.ropeState) {
            this.notifier.notify("Vous vous surestimez. Vous n'êtes pas assez musclé pour tirer deux cordes.", 'error');
            return null;
        }
        const initLength = getDistance(position, attachPosition);
        RopeLoadTextures();
        const [rope] = AddRope(
            position[0],
            position[1],
            position[2],
            0.0,
            0.0,
            0.0,
            maxLength,
            ropeType,
            initLength,
            0.5,
            0,
            false,
            true,
            true,
            1.0,
            false,
            0
        );
        if (ropeData) {
            LoadRopeData(rope, ropeData);
        }

        const object = CreateObject(
            GetHashKey(holdingObjectPropName),
            position[0],
            position[1],
            position[2] - 1.0,
            true,
            true,
            true
        );
        const netId = ObjToNet(object);
        SetNetworkIdCanMigrate(netId, false);
        SetEntityCollision(object, false, true);
        TriggerServerEvent(ServerEvent.OBJECT_ATTACHED_REGISTER, netId);
        AttachEntityToEntity(
            object,
            PlayerPedId(),
            GetPedBoneIndex(PlayerPedId(), 26610),
            0.04,
            -0.04,
            0.02,
            305.0,
            270.0,
            -40.0,
            true,
            true,
            false,
            true,
            0,
            true
        );

        this.ropeState = {
            rope,
            baseEntity,
            maxLength,
            attachPosition,
            holdingObjectProp: object,
        };
        AttachRopeToEntity(
            this.ropeState.rope,
            baseEntity,
            attachPosition[0],
            attachPosition[1],
            attachPosition[2],
            true
        );

        try {
            ActivatePhysics(this.ropeState.rope);
        } catch (e) {
            this.logger.error(`error while trying to create a rope ${e}`);
            this.deleteRope();
            return null;
        }

        this.manageRopePhysics();

        return this.ropeState.rope;
    }

    private async manageRopePhysics() {
        while (this.ropeState) {
            const ped = PlayerPedId();
            const rope = this.ropeState.rope;
            const ropeLength = GetRopeLength(rope);
            const handPosition = GetWorldPositionOfEntityBone(
                ped,
                GetEntityBoneIndexByName(ped, 'BONETAG_L_FINGER2')
            ) as Vector3;

            AttachEntitiesToRope(
                this.ropeState.rope,
                this.ropeState.baseEntity,
                ped,
                this.ropeState.attachPosition[0],
                this.ropeState.attachPosition[1],
                this.ropeState.attachPosition[2],
                handPosition[0],
                handPosition[1],
                handPosition[2],
                this.ropeState.maxLength,
                true,
                true,
                null,
                'BONETAG_L_FINGER2'
            );

            if (!this.ropeState.lastRopeLength) {
                this.ropeState.lastRopeLength = ropeLength;

                continue;
            }

            const desiredRopeLength = Math.max(ropeLength + 0.3, 3.0);

            if (desiredRopeLength < 5.0) {
                StopRopeWinding(rope);
                StartRopeUnwindingFront(rope);
                RopeForceLength(rope, desiredRopeLength);
            } else if (this.ropeState.lastRopeLength < ropeLength) {
                StopRopeUnwindingFront(rope);
                StartRopeWinding(rope);
                RopeResetLength(rope, desiredRopeLength);
            } else if (this.ropeState.lastRopeLength > ropeLength) {
                StopRopeWinding(rope);
                StartRopeUnwindingFront(rope);
                RopeForceLength(rope, desiredRopeLength);
            }

            this.ropeState.lastRopeLength = ropeLength;

            await wait(0);
        }
    }

    public getRopeDistance() {
        if (!this.ropeState) {
            return null;
        }
        const handPosition = GetWorldPositionOfEntityBone(
            PlayerPedId(),
            GetEntityBoneIndexByName(PlayerPedId(), 'BONETAG_L_FINGER2')
        ) as Vector3;
        return getDistance(this.ropeState.attachPosition, handPosition);
    }

    public deleteRope() {
        RopeUnloadTextures();
        DeleteRope(this.ropeState.rope);
        SetEntityAsMissionEntity(this.ropeState.holdingObjectProp, true, true);
        TriggerServerEvent(ServerEvent.OBJECT_ATTACHED_UNREGISTER, ObjToNet(this.ropeState.holdingObjectProp));
        DeleteEntity(this.ropeState.holdingObjectProp);
        this.ropeState = null;
    }
}
