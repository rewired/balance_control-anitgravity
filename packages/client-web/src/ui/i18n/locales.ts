import enJson from './en.json';
import deJson from './de.json';

export type LocaleResource = string | { [key: string]: LocaleResource };

export type LocaleData = {
    [namespace: string]: LocaleResource;
};

export const en: LocaleData = enJson as LocaleData;
export const de: LocaleData = deJson as LocaleData;
