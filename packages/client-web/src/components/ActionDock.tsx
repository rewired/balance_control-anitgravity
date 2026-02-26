import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import type { InteractionController, InteractionActionMode } from '../ui/interaction/types';
import { MeasureTray } from './MeasureTray';
import { groupFormalizeIntents } from '../ui/interaction/formalizeHelpers';
import { groupConvertIntents } from '../ui/interaction/convertHelpers';
import { useT } from '../ui/i18n';
import { getObjectLabel } from '../ui/interaction/labelHelpers';
import { tileIconUrlByType } from '../ui/tiles/tileAssets';

interface ActionDockProps {
    isActive: boolean;
    G: GameState;
    controller: InteractionController;
    showLeftPanel?: boolean;
    onToggleLeftPanel?: () => void;
    showRightPanel?: boolean;
    onToggleRightPanel?: () => void;
}

const formatIntentLabel = (intent: LegalIntent, t: (key: string, vars?: Record<string, string>) => string, G: GameState) => {
    if (intent.moveType === 'moveInfluence') {
        return t('core:draft.moveInfluenceSummary', {
            source: getObjectLabel(G, intent.payload?.sourceId),
            target: getObjectLabel(G, intent.payload?.targetId)
        });
    }
    if (intent.moveType === 'placeInfluence') {
        return t('core:draft.placeInfluenceSummary', {
            target: getObjectLabel(G, intent.payload?.targetTileId)
        });
    }
    if (intent.moveType === 'placeTile') {
        return t('core:draft.placeTileSummary', {
            tile: intent.payload?.tileId,
            coord: intent.payload?.coord
        });
    }
    if (intent.moveType === 'formalizeInfluence') {
        return t('core:draft.formalizeSummary', {
            tile: getObjectLabel(G, intent.payload?.tileId || intent.payload?.committeeTileId)
        });
    }
    if (intent.moveType === 'convertResources') {
        const outputResort = typeof intent.payload?.outputResort === 'string' ? intent.payload.outputResort : '?';
        const inputCount = inferConvertInputCount(intent.payload);
        const paySummary = inputCount ? `${inputCount}×Resource` : t('core:ui.free');
        return t('core:draft.convertSummary', {
            tile: getObjectLabel(G, intent.payload?.tileId || intent.payload?.grassrootsTileId),
            to: outputResort,
            pay: paySummary
        });
    }
    if (intent.moveType.endsWith('.takeMeasure')) {
        return t('core:draft.takeMeasureSummary', {
            measure: getObjectLabel(G, intent.payload)
        });
    }
    return intent.moveType;
};

import { canonicalJsonStringify } from '../ui/interaction/utils';

const intentSortKey = (intent: LegalIntent) => {
    const payloadKey = canonicalJsonStringify(intent.payload ?? {});
    return `${intent.moveType}:${payloadKey}`;
};

const getActionLabel = (mode: InteractionActionMode, draftIntent: LegalIntent | null, t: (key: string, vars?: Record<string, string>) => string, G: GameState) => {
    if (draftIntent) return formatIntentLabel(draftIntent, t, G);
    switch (mode) {
        case 'placeInfluence': return t('core:action.placeInfluence');
        case 'moveInfluence': return t('core:action.moveInfluence');
        case 'formalizeInfluence': return t('core:action.formalize');
        case 'convertResources': return t('core:action.convert');
        case 'takeMeasure': return t('core:action.takeMeasure');
        default: return t('core:step.chooseAction');
    }
};

const getStepLabel = (state: string, mode: InteractionActionMode, moveInfluenceSourceId: string | null, t: (key: string, vars?: Record<string, string>) => string) => {
    if (state === 'draftReady') return t('core:ui.preview');
    if (state === 'selectingParams') {
        if (mode === 'moveInfluence' && !moveInfluenceSourceId) return t('core:step.chooseSource');
        if (mode === 'moveInfluence' && moveInfluenceSourceId) return t('core:step.chooseDestination');
        if (mode === 'placeInfluence') return t('core:step.chooseTile');
        if (mode === 'formalizeInfluence') return t('core:step.chooseTile');
        if (mode === 'convertResources') return t('core:step.chooseTile');
        if (mode === 'takeMeasure') return t('core:step.chooseVariant');
        return t('core:step.chooseVariant');
    }
    if (state === 'selectingVariant') {
        if (mode === 'convertResources') return t('core:ui.selectOutput');
        return t('core:step.chooseVariant');
    }
    return t('core:step.chooseAction');
};

const VariantSelectionPanel: React.FC<{ controller: InteractionController }> = ({ controller }) => {
    const t = useT();
    const {
        interactionState,
        pinnedCommitteeTileId,
        pinnedGrassrootsTileId,
        proposeIntent,
        vm,
        draft,
        selectedConvertFamily,
        setSelectedConvertFamily
    } = controller;

    if (interactionState !== 'selectingVariant') return null;

    if (pinnedCommitteeTileId) {
        const groupsMap = groupFormalizeIntents(vm.intents);
        const groups = groupsMap.get(pinnedCommitteeTileId) || [];

        return (
            <div className="variant-selection-panel" data-testid="variant-selection-panel">
                <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>{t('core:ui.selectPayment')}</div>
                {groups.map(group => (
                    <div key={group.paymentKey} style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {group.paymentResourceIds.length > 0
                                ? t('core:ui.pay', { pay: group.paymentResourceIds.join(', ') })
                                : t('core:ui.free')}
                        </div>
                        {group.variants.map(variant => (
                            <button
                                key={intentSortKey(variant)}
                                className="btn-secondary btn-small"
                                onClick={() => proposeIntent(variant)}
                                style={{ width: '100%', textAlign: 'left', marginBottom: '4px' }}
                                data-testid={`btn-variant-${variant.payload?.extraResourceIds?.join('-') || 'base'}`}
                            >
                                {variant.payload?.extraResourceIds && variant.payload.extraResourceIds.length > 0
                                    ? t('core:ui.extra', { extra: variant.payload.extraResourceIds.join(', ') })
                                    : t('core:ui.standard')}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    if (pinnedGrassrootsTileId) {
        const groupsMap = groupConvertIntents(vm.intents);
        const tileGroup = groupsMap.get(pinnedGrassrootsTileId);

        if (!tileGroup) return <div data-testid="no-variants">{t('core:ui.noVariants')}</div>;

        if (!selectedConvertFamily) {
            return (
                <div className="variant-selection-panel" data-testid="variant-selection-panel">
                    <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>{t('core:ui.selectOutput')}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {tileGroup.outputs.map(outputGroup => (
                            <button
                                key={outputGroup.outputResort}
                                className="btn-secondary"
                                onClick={() => setSelectedConvertFamily(outputGroup.outputResort)}
                                data-testid={`btn-family-${outputGroup.outputResort}`}
                                style={{ textAlign: 'left' }}
                            >
                                {t('core:ui.to', { to: outputGroup.outputResort })}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        const outputGroup = tileGroup.outputs.find(o => o.outputResort === selectedConvertFamily);
        if (!outputGroup) {
            setSelectedConvertFamily(null); // Safety reset
            return null;
        }

        return (
            <div className="variant-selection-panel" data-testid="variant-selection-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <button
                        className="btn-secondary btn-small"
                        onClick={() => setSelectedConvertFamily(null)}
                        data-testid="btn-back-to-families"
                    >
                        &larr; {t('core:ui.back')}
                    </button>
                    <div style={{ fontWeight: 'bold' }}>{t('core:ui.to', { to: outputGroup.outputResort })}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {outputGroup.variants.map((variant, index) => {
                        const inputCount = inferConvertInputCount(variant.payload);
                        const paySummary = inputCount ? `${inputCount}×Resource` : t('core:ui.free');

                        return (
                            <button
                                key={intentSortKey(variant)}
                                className="btn-secondary"
                                onClick={() => proposeIntent(variant)}
                                style={{ textAlign: 'left' }}
                                data-testid={`btn-variant-pay-${outputGroup.outputResort}-${inputCount ?? 'unknown'}-${index}`}
                            >
                                {t('core:ui.pay', { pay: paySummary })}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
};

function inferConvertInputCount(payload: any): number | null {
    const declared = payload?.inputCount;
    if (typeof declared === 'number' && Number.isFinite(declared)) return declared;
    const ids = payload?.inputResourceIds;
    if (Array.isArray(ids)) return ids.length;
    return null;
}

const CurrentActionPanel: React.FC<{ G: GameState; controller: InteractionController }> = ({ G, controller }) => {
    const t = useT();
    const {
        actionMode,
        interactionState,
        draft,
        moveInfluenceSourceId,
        pinnedCommitteeTileId,
        pinnedGrassrootsTileId,
        confirmDraft,
        cancelDraft,
        editDraftSource,
        editDraftDestination,
        editDraftTarget,
        editDraftVariant,
        editPinnedTile,
        vm
    } = controller;

    const actionLabel = getActionLabel(actionMode, draft.intent, t, G);
    const stepLabel = getStepLabel(interactionState, actionMode, moveInfluenceSourceId, t);

    return (
        <div className="current-action-panel" data-testid="current-action-panel" style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <div className="action-status-block">
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('core:inspector.activeAction')}</div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{actionLabel}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('core:inspector.step')}</div>
                <div style={{ fontWeight: 'bold' }}>{stepLabel}</div>
                {moveInfluenceSourceId && (
                    <div className="pinned-params" style={{ marginTop: '4px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{t('core:ui.source')}: </span>
                        {getObjectLabel(G, moveInfluenceSourceId)}
                    </div>
                )}
                {pinnedCommitteeTileId && (
                    <div className="pinned-params" style={{ marginTop: '4px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{t('core:ui.committee')}: </span>
                        {getObjectLabel(G, pinnedCommitteeTileId)}
                    </div>
                )}
                {pinnedGrassrootsTileId && (
                    <div className="pinned-params" style={{ marginTop: '4px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{t('core:ui.grassroots')}: </span>
                        {getObjectLabel(G, pinnedGrassrootsTileId)}
                    </div>
                )}
            </div>

            {interactionState === 'selectingVariant' && (
                <div className="action-panel-draft" data-testid="action-dock-variant-select" style={{ marginTop: '12px' }}>
                    <button
                        className="btn-secondary btn-small"
                        onClick={editPinnedTile}
                        data-testid="btn-change-tile"
                    >
                        {t('core:ui.changeTile')}
                    </button>
                </div>
            )}

            {interactionState === 'draftReady' && draft.intent && (
                <div className="action-panel-draft" data-testid="action-dock-draft" style={{ marginTop: '12px' }}>
                    {draft.key && (
                        <span data-testid="draft-key" hidden>{draft.key}</span>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                        {draft.intent.moveType === 'placeTile' && (
                            <button className="btn-secondary btn-small" onClick={editDraftTarget} data-testid="btn-edit-placement">
                                {t('core:ui.changePlacement')}
                            </button>
                        )}
                        {draft.intent.moveType === 'placeInfluence' && (
                            <button className="btn-secondary btn-small" onClick={editDraftTarget} data-testid="btn-edit-target">
                                {t('core:ui.changeTarget')}
                            </button>
                        )}
                        {draft.intent.moveType === 'moveInfluence' && (
                            <>
                                <button className="btn-secondary btn-small" onClick={editDraftSource} data-testid="btn-edit-source">
                                    {t('core:ui.changeSource')}
                                </button>
                                <button className="btn-secondary btn-small" onClick={editDraftDestination} data-testid="btn-edit-destination">
                                    {t('core:ui.changeDestination')}
                                </button>
                            </>
                        )}
                        {(draft.intent.moveType === 'formalizeInfluence' || draft.intent.moveType === 'convertResources' || draft.intent.moveType.endsWith('.takeMeasure')) && (
                            <button className="btn-secondary btn-small" onClick={editDraftVariant} data-testid="btn-edit-selection">
                                {t('core:ui.changeVariant')}
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="btn-primary btn-small"
                            onClick={confirmDraft}
                            disabled={!draft.isLegalNow}
                            data-testid="btn-confirm-draft"
                        >
                            {t('core:ui.confirm')}
                        </button>
                        <button
                            className="btn-secondary btn-small"
                            onClick={cancelDraft}
                            data-testid="btn-cancel-draft"
                        >
                            {t('core:ui.cancel')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const getCoachMessage = (
    stage: string | null | undefined,
    interactionState: string,
    mode: InteractionActionMode,
    moveInfluenceSourceId: string | null,
    t: (key: string, vars?: Record<string, string>) => string
) => {
    if (interactionState === 'draftReady') return t('core:coach.review');

    if (stage === 'drawAndPlace') return t('core:coach.placeTile');

    if (stage === 'politicalAction') {
        if (interactionState === 'selectingParams') {
            if (mode === 'moveInfluence') {
                return moveInfluenceSourceId ? t('core:coach.chooseDestination') : t('core:coach.chooseSource');
            }
            if (mode === 'placeInfluence') return t('core:coach.chooseTarget');
            if (mode === 'formalizeInfluence' || mode === 'convertResources') return t('core:coach.chooseTarget');
            return t('core:coach.chooseVariant');
        }
        if (interactionState === 'selectingVariant') return t('core:coach.chooseVariant');
        return t('core:coach.chooseAction');
    }

    return t('core:coach.chooseAction');
};

const PoliticalActionList: React.FC<{ G: GameState; controller: InteractionController }> = ({ G, controller }) => {
    const t = useT();
    const { vm, actionMode, setActionMode, proposeIntent } = controller;

    // 1. Place Influence
    const placeIntents = vm.intents.filter(i => i.moveType === 'placeInfluence');
    const hasPlace = placeIntents.length > 0;

    // 2. Move Influence
    const moveIntents = vm.intents.filter(i => i.moveType === 'moveInfluence');
    const hasMove = moveIntents.length > 0;

    // 3. Best of Rest
    const formalizeIntents = vm.political.formalizeInfluence;
    const convertIntents = vm.political.convertResources;
    const measureIntents = vm.political.measures;

    let thirdActionType: 'formalize' | 'convert' | 'takeMeasure' | null = null;
    // Priority: Formalize > Convert > Measure
    if (formalizeIntents.length > 0) thirdActionType = 'formalize';
    else if (convertIntents.length > 0) thirdActionType = 'convert';
    else if (measureIntents.length > 0) thirdActionType = 'takeMeasure';

    // Collect "More" items
    const moreItems: React.ReactNode[] = [];

    // Helper to add to More
    const addToMore = (key: string, label: string, onClick: () => void, testId: string, count?: number) => {
        moreItems.push(
             <button
                key={key}
                className="btn-secondary"
                onClick={onClick}
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
                data-testid={testId}
            >
                <span>{label}</span>
                {count !== undefined && <span style={{opacity: 0.7, fontSize: '0.9em'}}>({count})</span>}
            </button>
        );
    };

    // If Formalize is NOT primary but has intents
    if (thirdActionType !== 'formalize' && formalizeIntents.length > 0) {
        addToMore('formalize', t('core:action.formalize'),
            () => setActionMode(actionMode === 'formalizeInfluence' ? 'none' : 'formalizeInfluence'),
            'btn-more-formalize', formalizeIntents.length);
    }

    // If Convert is NOT primary but has intents
    if (thirdActionType !== 'convert' && convertIntents.length > 0) {
         addToMore('convert', t('core:action.convert'),
            () => setActionMode(actionMode === 'convertResources' ? 'none' : 'convertResources'),
            'btn-more-convert', convertIntents.length);
    }

    // If Measure is NOT primary but has intents
    if (thirdActionType !== 'takeMeasure' && measureIntents.length > 0) {
         addToMore('takeMeasure', t('core:action.takeMeasure'),
            () => setActionMode(actionMode === 'takeMeasure' ? 'none' : 'takeMeasure'),
            'btn-more-takeMeasure', measureIntents.length);
    }

    // Others (Expansions)
    vm.political.others.forEach(intent => {
         moreItems.push(
            <button
                key={intentSortKey(intent)}
                className="btn-secondary"
                onClick={() => proposeIntent(intent)}
                style={{ textAlign: 'left', width: '100%' }}
                data-testid={`btn-other-${intent.moveType}`}
            >
                {formatIntentLabel(intent, t, G)}
            </button>
         );
    });

    return (
        <div className="political-action-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Primary 1: Place */}
            {hasPlace && (
                <button
                    className={actionMode === 'placeInfluence' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActionMode(actionMode === 'placeInfluence' ? 'none' : 'placeInfluence')}
                    data-testid="btn-mode-place-influence"
                    style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}
                >
                    <span>{t('core:action.placeInfluence')}</span>
                    <span style={{opacity: 0.8, fontSize: '0.9em'}}>({placeIntents.length})</span>
                </button>
            )}

            {/* Primary 2: Move */}
            {hasMove && (
                <button
                    className={actionMode === 'moveInfluence' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActionMode(actionMode === 'moveInfluence' ? 'none' : 'moveInfluence')}
                    data-testid="btn-mode-move-influence"
                     style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}
                >
                    <span>{t('core:action.moveInfluence')}</span>
                    <span style={{opacity: 0.8, fontSize: '0.9em'}}>({moveIntents.length})</span>
                </button>
            )}

            {/* Primary 3: Best of Rest */}
            {thirdActionType === 'formalize' && (
                <button
                    className={actionMode === 'formalizeInfluence' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActionMode(actionMode === 'formalizeInfluence' ? 'none' : 'formalizeInfluence')}
                    data-testid="btn-mode-formalize-influence"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}
                >
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <img src={tileIconUrlByType.Committee} style={{ width: 16, height: 16 }} alt="" />
                        {t('core:action.formalize')}
                    </div>
                    <span style={{opacity: 0.8, fontSize: '0.9em'}}>({formalizeIntents.length})</span>
                </button>
            )}

            {thirdActionType === 'convert' && (
                 <button
                    className={actionMode === 'convertResources' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActionMode(actionMode === 'convertResources' ? 'none' : 'convertResources')}
                    data-testid="btn-mode-convert-resources"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}
                >
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <img src={tileIconUrlByType.Grassroots} style={{ width: 16, height: 16 }} alt="" />
                        {t('core:action.convert')}
                    </div>
                    <span style={{opacity: 0.8, fontSize: '0.9em'}}>({convertIntents.length})</span>
                </button>
            )}

            {thirdActionType === 'takeMeasure' && (
                <button
                    className={actionMode === 'takeMeasure' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActionMode(actionMode === 'takeMeasure' ? 'none' : 'takeMeasure')}
                    data-testid="btn-mode-take-measure"
                     style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}
                >
                    <span>{t('core:action.takeMeasure')}</span>
                    <span style={{opacity: 0.8, fontSize: '0.9em'}}>({measureIntents.length})</span>
                </button>
            )}

            {/* More Actions */}
            {moreItems.length > 0 && (
                <details className="action-group-collapsible">
                    <summary
                        data-testid="summary-more-actions"
                        style={{
                            cursor: 'pointer',
                            margin: '8px 0',
                            fontSize: '0.9em',
                            textTransform: 'uppercase',
                            color: 'var(--text-secondary)',
                            userSelect: 'none'
                        }}
                    >
                        {t('core:group.moreActions', { count: String(moreItems.length) })}
                    </summary>
                    <div className="action-panel-secondary" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                        {moreItems}
                    </div>
                </details>
            )}
        </div>
    );
};

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const ActionDock: React.FC<ActionDockProps> = ({
    isActive,
    G,
    controller,
    showLeftPanel,
    onToggleLeftPanel,
    showRightPanel,
    onToggleRightPanel
}) => {
    const t = useT();
    if (!isActive) return null;

    const {
        vm,
        proposeIntent,
        interactionState,
        actionMode
    } = controller;

    const coachMessage = getCoachMessage(vm.stage, interactionState, actionMode, controller.moveInfluenceSourceId, t);
    const isDrawAndPlace = vm.stage === 'drawAndPlace';
    const isPoliticalAction = vm.stage === 'politicalAction';

    return (
        <div className="action-panel action-dock" data-testid="action-dock">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                <button
                    onClick={onToggleLeftPanel}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                    title={showLeftPanel ? "Collapse Players Panel" : "Expand Players Panel"}
                    data-testid="toggle-left-panel"
                >
                    <span style={{ fontSize: '1.2em' }}>{showLeftPanel ? '◀' : '▶'}</span>
                    <span>{t('core:ui.players')}</span>
                </button>

                <button
                    onClick={onToggleRightPanel}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                    title={showRightPanel ? "Collapse Inspector Panel" : "Expand Inspector Panel"}
                    data-testid="toggle-right-panel"
                >
                    <span>{t('core:inspector.title')}</span>
                    <span style={{ fontSize: '1.2em' }}>{showRightPanel ? '▶' : '◀'}</span>
                </button>
            </div>

            <div className="action-panel-header" data-testid="coach-header">
                <div className="action-panel-title" style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{coachMessage}</div>
            </div>

            <CurrentActionPanel G={G} controller={controller} />

            {interactionState === 'selectingVariant' ? (
                <VariantSelectionPanel controller={controller} />
            ) : (
                interactionState !== 'draftReady' && (
                    <>
                        {isDrawAndPlace && (
                            <div className="action-panel-primary">
                                <div className="action-panel-meta">{t('core:ui.staged', { tile: vm.stagedTileId || t('core:inspector.none') })}</div>
                            </div>
                        )}
                        {isPoliticalAction && (
                            <>
                                {actionMode === 'takeMeasure' && interactionState === 'selectingParams' && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <MeasureTray
                                            G={G}
                                            intents={vm.political.measures}
                                            onSelect={proposeIntent}
                                        />
                                    </div>
                                )}
                                <PoliticalActionList G={G} controller={controller} />
                            </>
                        )}
                    </>
                ))}
        </div>
    );
};
