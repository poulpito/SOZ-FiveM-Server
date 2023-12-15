import { FunctionComponent, useState } from 'react';

import { useNuiEvent } from '../../hook/nui';
import ColdIcon from '../../icons/cold.svg';

export const ColdOverlay: FunctionComponent = () => {
    const [coldMode, setColdMode] = useState(false);
    useNuiEvent('cold', 'cold', setColdMode);

    if (!coldMode) {
        return null;
    }

    return (
        <div className="fixed items-center justify-center flex w-full bottom-[6rem] text-white/75">
            <div className="breathing-icon-container items-center justify-center flex">
                <ColdIcon className="w-12 h-12 breathing-icon" />
                <div className="breathing-icon-shadow"></div>
            </div>
        </div>
    );
};
