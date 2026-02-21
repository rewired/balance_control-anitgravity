import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import type { InteractionController, InteractionActionMode } from '../ui/interaction/types';
import { MeasureTray } from './MeasureTray';
import { groupFormalizeIntents } from '../ui/interaction/formalizeHelpers';
import { groupConvertIntents } from '../ui/interaction/convertHelpers';
import { useT } from '../ui/i18n';
import { getObjectLabel } from '../ui/interaction/labelHelpers';

interface ActionDockProps {
    isActive: boolean;
    G: GameState;
    controller: InteractionController;
}

const formatIntentLabel = (intent: LegalIntent, t: (key: string, vars?: any) => string, G: GameState) => {
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
        return t('core:draft.convertSummary', {
            tile: getObjectLabel(G, intent.payload?.tileId || intent.payload?.grassrootsTileId)
        });
    }
    if (intent.moveType.endsWith('.takeMeasure')) {
        return t('core:draft.takeMeasureSummary', {
            measure: getObjectLabel(G, intent.payload)
        });
    }
    if (intent.moveType === 'passTilePlacement') {
        return t('core:ui.skipPlacement');
    }
    return intent.moveType;
};

import { canonicalJsonStringify } from '../ui/interaction/utils';

const intentSortKey = (intent: LegalIntent) => {
    const payloadKey = canonicalJsonStringify(intent.payload ?? {});
    return `${intent.moveType}:${payloadKey}`;
};

const getActionLabel = (mode: InteractionActionMode, draftIntent: LegalIntent | null, t: (key: string, vars?: any) => string, G: GameState) => {
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

const getStepLabel = (state: string, mode: InteractionActionMode, moveInfluenceSourceId: string | null, t: (key: string, vars?: any) => string) => {
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
        vm
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

        const { selectedConvertFamily, setSelectedConvertFamily } = controller;

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

                {outputGroup.combos.map(combo => (
                    <div key={combo.inputKey} style={{ marginBottom: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '8px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                            {t('core:ui.from', { from: combo.inputResourceIds.join(', ') })}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {combo.variants.map(variant => {
                                const extra = (variant.payload?.extraResourceIds as string[]) ?? [];
                                const label = extra.length > 0
                                    ? t('core:ui.extra', { extra: extra.join(', ') })
                                    : t('core:ui.standard');

                                return (
                                    <button
                                        key={intentSortKey(variant)}
                                        className="btn-secondary btn-small"
                                        onClick={() => proposeIntent(variant)}
                                        style={{ textAlign: 'left' }}
                                        data-testid={`btn-variant-${combo.inputKey}-${extra.join('-') || 'base'}`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

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

const ActionGroupList: React.FC<{ G: GameState; controller: InteractionController }> = ({ G, controller }) => {
    const t = useT();
    const { vm, actionMode, setActionMode, proposeIntent } = controller;

    const hasPlaceInfluenceIntents = vm.intents.some(i => i.moveType === 'placeInfluence');
    const hasMoveInfluenceIntents = vm.intents.some(i => i.moveType === 'moveInfluence');
    const hasFormalizeInfluenceIntents = vm.political.formalizeInfluence.length > 0;
    const hasConvertResourcesIntents = vm.political.convertResources.length > 0;
    const showMoreActions = vm.political.others.length > 0;

    return (
        <div className="action-group-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="action-group">
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{t('core:group.influence')}</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        className={actionMode === 'placeInfluence' ? 'btn-primary' : 'btn-secondary'}
                        disabled={!hasPlaceInfluenceIntents}
                        onClick={() => setActionMode(actionMode === 'placeInfluence' ? 'none' : 'placeInfluence')}
                        data-testid="btn-mode-place-influence"
                    >
                        {t('core:action.placeInfluence')}
                    </button>
                    <button
                        className={actionMode === 'moveInfluence' ? 'btn-primary' : 'btn-secondary'}
                        disabled={!hasMoveInfluenceIntents}
                        onClick={() => setActionMode(actionMode === 'moveInfluence' ? 'none' : 'moveInfluence')}
                        data-testid="btn-mode-move-influence"
                    >
                        {t('core:action.moveInfluence')}
                    </button>
                </div>
            </div>

            {hasFormalizeInfluenceIntents && (
                <div className="action-group">
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{t('core:group.committees')}</h4>
                    <button
                        className={actionMode === 'formalizeInfluence' ? 'btn-primary' : 'btn-secondary'}
                        disabled={!hasFormalizeInfluenceIntents}
                        onClick={() => setActionMode(actionMode === 'formalizeInfluence' ? 'none' : 'formalizeInfluence')}
                        data-testid="btn-mode-formalize-influence"
                    >
                        {t('core:action.formalize')}
                    </button>
                </div>
            )}

            {hasConvertResourcesIntents && (
                <div className="action-group">
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{t('core:group.economy')}</h4>
                    <button
                        className={actionMode === 'convertResources' ? 'btn-primary' : 'btn-secondary'}
                        disabled={!hasConvertResourcesIntents}
                        onClick={() => setActionMode(actionMode === 'convertResources' ? 'none' : 'convertResources')}
                        data-testid="btn-mode-convert-resources"
                    >
                        {t('core:action.convert')}
                    </button>
                </div>
            )}

            {vm.political.measures.length > 0 && (
                <div className="action-group">
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{t('core:group.measures')}</h4>
                    <button
                        className={actionMode === 'takeMeasure' ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => setActionMode(actionMode === 'takeMeasure' ? 'none' : 'takeMeasure')}
                        data-testid="btn-mode-take-measure"
                    >
                        {t('core:action.takeMeasure')}
                    </button>
                    {actionMode === 'takeMeasure' && (
                        <MeasureTray
                            G={G}
                            intents={vm.political.measures}
                            onSelect={proposeIntent}
                        />
                    )}
                </div>
            )}

            {showMoreActions && (
                <div className="action-group">
                    <details className="action-group-collapsible">
                        <summary
                            data-testid="summary-expansions-other"
                            style={{
                                cursor: 'pointer',
                                margin: '0 0 8px 0',
                                fontSize: '0.9em',
                                textTransform: 'uppercase',
                                color: 'var(--text-secondary)',
                                userSelect: 'none'
                            }}
                        >
                            {t('core:group.expansionsWithCount', { count: vm.political.others.length.toString() })}
                        </summary>
                        <div className="action-panel-secondary" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                            {vm.political.others.map(intent => (
                                <button
                                    key={intentSortKey(intent)}
                                    className="btn-secondary"
                                    onClick={() => proposeIntent(intent)}
                                    style={{ textAlign: 'left' }}
                                    data-testid={`btn-other-${intent.moveType}`}
                                >
                                    {formatIntentLabel(intent, t, G)}
                                </button>
                            ))}
                        </div>
                    </details>
                </div>
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
    controller
}) => {
    const t = useT();
    if (!isActive) return null;

    const {
        vm,
        proposeIntent,
        interactionState
    } = controller;

    const stageLabel = vm.stage
        ? (t(`core:ui.${vm.stage}`) !== `core:ui.${vm.stage}` ? t(`core:ui.${vm.stage}`) : vm.stage)
        : t('core:ui.waiting');
    const isDrawAndPlace = vm.stage === 'drawAndPlace';
    const isPoliticalAction = vm.stage === 'politicalAction';

    return (
        <div className="action-panel action-dock" data-testid="action-dock">
            <div className="action-panel-header">
                <div className="action-panel-title">{t('core:ui.actions')}</div>
                <div className="action-panel-stage">{stageLabel}</div>
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
                                {vm.drawAndPlace.passTilePlacement && (
                                    <button
                                        className="btn-primary"
                                        onClick={() => proposeIntent(vm.drawAndPlace.passTilePlacement!)}
                                        data-testid="btn-skip-placement"
                                    >
                                        {t('core:ui.skipPlacement')}
                                    </button>
                                )}
                            </div>
                        )}
                        {isPoliticalAction && (
                            <ActionGroupList G={G} controller={controller} />
                        )}
                    </>
                ))}
        </div>
    );
};
