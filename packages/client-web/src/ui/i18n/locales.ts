export type LocaleResource = string | { [key: string]: LocaleResource };

export type LocaleData = {
    [namespace: string]: LocaleResource;
};

export const en: LocaleData = {
    core: {
        group: {
            influence: "Influence",
            committees: "Committees",
            economy: "Economy",
            measures: "Measures",
            expansions: "Expansions",
        },
        action: {
            placeInfluence: "Place influence",
            moveInfluence: "Move influence",
            formalize: "Formalize",
            convert: "Convert",
            takeMeasure: "Take measure",
        },
        step: {
            chooseAction: "Select action",
            chooseSource: "Select source",
            chooseDestination: "Select destination",
            chooseTile: "Select tile",
            chooseVariant: "Select variant",
        },
        ui: {
            preview: "Preview",
            confirm: "Confirm",
            cancel: "Cancel",
            changeSource: "Edit source",
            changeDestination: "Edit destination",
            changeVariant: "Edit variant",
        },
        draft: {
            moveInfluenceSummary: "{{source}} → {{target}}",
            placeInfluenceSummary: "target {{target}}",
            placeTileSummary: "{{tile}} @ {{coord}}",
            formalizeSummary: "tile {{tile}}",
            convertSummary: "tile {{tile}}",
        },
        inspector: {
            activeAction: "Active action",
            step: "Step",
            pinnedSource: "Pinned source",
        },
    },
};

export const de: LocaleData = {
    core: {
        group: {
            influence: "Einfluss",
            committees: "Komitees",
            economy: "Wirtschaft",
            measures: "Maßnahmen",
            expansions: "Erweiterungen",
        },
        action: {
            placeInfluence: "Einfluss platzieren",
            moveInfluence: "Einfluss verschieben",
            formalize: "Formalisieren",
            convert: "Umwandeln",
            takeMeasure: "Maßnahme ziehen",
        },
        step: {
            chooseAction: "Aktion wählen",
            chooseSource: "Quelle wählen",
            chooseDestination: "Ziel wählen",
            chooseTile: "Feld wählen",
            chooseVariant: "Variante wählen",
        },
        ui: {
            preview: "Vorschau",
            confirm: "Bestätigen",
            cancel: "Abbrechen",
            changeSource: "Quelle ändern",
            changeDestination: "Ziel ändern",
            changeVariant: "Variante ändern",
        },
        draft: {
            moveInfluenceSummary: "{{source}} → {{target}}",
            placeInfluenceSummary: "Ziel {{target}}",
            placeTileSummary: "{{tile}} @ {{coord}}",
            formalizeSummary: "Feld {{tile}}",
            convertSummary: "Feld {{tile}}",
        },
        inspector: {
            activeAction: "Aktive Aktion",
            step: "Schritt",
            pinnedSource: "Fixierte Quelle",
        },
    },
};
