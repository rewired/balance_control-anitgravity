import React from 'react';
import { GameObject } from '@balance-control/rules';

interface TokenProps {
    object: GameObject;
}

export const Token: React.FC<TokenProps> = ({ object }) => {
    let className = 'token';

    if (object.type === 'Influence') {
        className += ' influence';
        // Maybe differentiate by owner color?
        // simple border or style override
    } else if (object.type === 'Resource') {
        if (object.resort) {
            className += ` resource-${object.resort.toLowerCase()}`;
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
