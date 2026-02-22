import React from 'react';
import { createPortal } from 'react-dom';
import type { Tile } from '@balance-control/rules';
import type { SeatId } from '../ui/tiles/types';

interface BoardHoverCardProps {
    tile: Tile;
    coord: string;
    influenceBySeat: Partial<Record<SeatId, number>>;
    seatColor: (seat: SeatId) => string;
    targetRect: DOMRect;
}

export const BoardHoverCard: React.FC<BoardHoverCardProps> = ({
    tile,
    coord,
    influenceBySeat,
    seatColor,
    targetRect
}) => {
    // Simple positioning logic
    const gap = 12;
    // If we are too close to top, show below
    const fitsAbove = targetRect.top > 140; 
    
    const style: React.CSSProperties = {
        position: 'fixed',
        left: targetRect.left + targetRect.width / 2,
        top: fitsAbove ? targetRect.top - gap : targetRect.bottom + gap,
        transform: fitsAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
        zIndex: 1000, // Above everything
        pointerEvents: 'none', // Must not block clicks
    };

    // Prepare content
    const sortedSeats = Object.keys(influenceBySeat)
        .map(Number)
        .sort((a, b) => a - b) as SeatId[];

    const totalInfluence = Object.values(influenceBySeat).reduce((a, b) => (a || 0) + (b || 0), 0);

    return createPortal(
        <div className="board-hover-card glass-panel" style={style}>
            <div className="hover-card-header">
                <span className="hover-card-type">{tile.type}</span>
                <span className="hover-card-coord">{coord}</span>
            </div>
            
            <div className="hover-card-details">
                {tile.weight !== undefined && (
                    <div className="hover-card-row">
                        <span className="hover-card-label">Weight</span>
                        <span className="hover-card-value">{tile.weight}</span>
                    </div>
                )}
                {tile.type === 'Grassroots' && (tile.conversion?.typedResort || tile.resort) && (
                    <div className="hover-card-row">
                        <span className="hover-card-label">Tag</span>
                        <span className="hover-card-value">
                            {tile.conversion?.typedResort || tile.resort}
                        </span>
                    </div>
                )}
            </div>

            {totalInfluence > 0 && (
                <div className="hover-card-influence">
                    <div className="hover-card-subtitle">Influence</div>
                    <div className="influence-grid">
                        {sortedSeats.map(seat => (
                            <div key={seat} className="influence-item">
                                <div 
                                    className="influence-dot" 
                                    style={{ backgroundColor: seatColor(seat) }}
                                />
                                <span className="influence-count">
                                    {influenceBySeat[seat]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};
