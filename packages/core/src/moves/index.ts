import { DrawAndPlaceMoves } from './stages/drawAndPlace';
import { PoliticalActionMoves } from './stages/politicalAction';
import { SystemMoves } from './system/resolveChoice';

export const CoreMoves = {
    ...SystemMoves,
    ...PoliticalActionMoves,
    ...DrawAndPlaceMoves
};

