import React from 'react';
import { GameObject } from '@balance-control/rules';

interface TokenProps {
    object: GameObject;
}

export const Token: React.FC<TokenProps> = ({ object }) => {
    let className = 'token';
    const knownResorts = new Set(['dom', 'for', 'inf', 'eco', 'sec', 'clm']);

    if (object.type === 'Influence') {
        className += ' influence';
        // Maybe differentiate by owner color?
        // simple border or style override
    } else if (object.type === 'Resource') {
        const resort = typeof object.resort === 'string' ? object.resort.trim().toLowerCase() : '';
        if (resort && knownResorts.has(resort)) {
            className += ` resource-${resort}`;
        } else {
            className += ' resource-unknown';
        }
    } else if (object.type === 'MetaMarker') {
        className += ' meta-marker';
    }

    return (
        <div
            className={className}
            title={`${object.type} ${object.id} (${object.owner})`}
        />
    );
};
