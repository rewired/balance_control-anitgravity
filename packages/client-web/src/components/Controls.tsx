import React from 'react';

interface ControlsProps {
    moves: any;
    events?: any;
    ctx: any;
    isActive: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ moves, events, isActive }) => {
    if (!isActive) return null;

    return (
        <div className="controls-bar">
            <button
                className="btn-primary"
                onClick={() => moves.placeInfluence({ targetTileId: 'tile_start_committee' })}
            >
                Place Influence
            </button>
            <button className="btn-secondary" onClick={() => moves.pass({})}>Pass</button>
        </div>
    );
};
