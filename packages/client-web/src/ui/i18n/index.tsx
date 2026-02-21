import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { en, de, type LocaleData } from './locales';

export type Locale = 'en' | 'de';

interface I18nContextType {
    locale: Locale;
    t: (key: string, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALES: Record<Locale, LocaleData> = { en, de };
const FALLBACK_LOCALE: Locale = 'en';

function getTranslation(locale: Locale, key: string): string | undefined {
    const [ns, path] = key.split(':');
    if (!ns || !path) return undefined;

    let current: any = LOCALES[locale][ns];
    if (!current) return undefined;

    const parts = path.split('.');
    for (const part of parts) {
        current = current[part];
        if (current === undefined) return undefined;
    }

    return typeof current === 'string' ? current : undefined;
}

/**
 * Translates a key with optional variable interpolation.
 * Format: "ns:path.to.key"
 * Interpolation: "{{varName}}"
 */
export function translate(locale: Locale, key: string, vars?: Record<string, string>): string {
    let text = getTranslation(locale, key);

    // Fallback to EN if missing and current is not EN
    if (text === undefined && locale !== FALLBACK_LOCALE) {
        text = getTranslation(FALLBACK_LOCALE, key);
    }

    if (text === undefined) {
        return key;
    }

    if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
            text = text!.replace(new RegExp(`{{${k}}}`, 'g'), v);
        });
    }

    return text;
}

function getInitialLocale(): Locale {
    if (typeof window === 'undefined') return FALLBACK_LOCALE;
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');
    if (lang === 'de' || lang === 'en') return lang;

    if (navigator.language?.startsWith('de')) return 'de';
    return 'en';
}

/**
 * Provider component that manages the current locale and provides
 * the translation function to the application.
 */
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale] = useState<Locale>(getInitialLocale);

    const contextValue = useMemo(() => ({
        locale,
        t: (key: string, vars?: Record<string, string>) => translate(locale, key, vars)
    }), [locale]);

    return (
        <I18nContext.Provider value={contextValue}>
            {children}
        </I18nContext.Provider>
    );
};

/**
 * Hook to access the I18n context.
 */
export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};

/**
 * Hook to access the translation function.
 */
export const useT = () => useI18n().t;
