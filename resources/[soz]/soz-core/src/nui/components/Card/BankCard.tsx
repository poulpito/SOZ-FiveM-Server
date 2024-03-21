import { FunctionComponent } from 'react';

type HealthCardProps = {
    account: string;
    name: string;
};

const isStandardScreen = window.innerHeight < 1400;

export const BankCard: FunctionComponent<HealthCardProps> = ({ name, account }) => {
    return (
        <div
            style={{
                backgroundImage: `url(/public/images/identity/bank.webp)`,
            }}
            className={`transition bg-cover bg-no-repeat aspect-[1.58] h-[${isStandardScreen ? '25vh' : '20vh'}]`}
        >
            <div
                className={`flex ${
                    isStandardScreen ? 'pt-[12.5vh] pl-[3.3vh] text-2xl' : 'pt-[10vh] pl-[3.3vh] text-2xl'
                } uppercase text-[#4fd954] font-kreditblack`}
            >
                {account?.replace(/([A-Z\d]{4})/g, '$1 ') ?? ' '}
            </div>
            <p className="pl-[3.3vh] pt-[12%] uppercase italic font-bold text-white font-kreditback">{name}</p>
        </div>
    );
};
