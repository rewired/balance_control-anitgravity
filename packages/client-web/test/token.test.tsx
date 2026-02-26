import { describe, expect, it } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { Token } from '../src/components/Token';

describe('Token', () => {
    it('renders influence token class and title', () => {
        const { container } = render(
            <Token object={{ id: 'inf_1', type: 'Influence', owner: '0' } as any} />,
        );

        const el = container.firstChild as HTMLElement;
        expect(el.className).toContain('token');
        expect(el.className).toContain('influence');
        expect(el.title).toBe('Influence inf_1 (0)');
    });

    it('renders meta-marker token class and title', () => {
        const { container } = render(
            <Token object={{ id: 'meta_1', type: 'MetaMarker', owner: 'BANK' } as any} />,
        );

        const el = container.firstChild as HTMLElement;
        expect(el.className).toContain('token');
        expect(el.className).toContain('meta-marker');
        expect(el.title).toBe('MetaMarker meta_1 (BANK)');
    });

    it('renders resource token for known, unknown, and normalized resort values', () => {
        const { container, rerender } = render(
            <Token object={{ id: 'res_1', type: 'Resource', resort: 'INF', owner: '0' } as any} />,
        );

        let el = container.firstChild as HTMLElement;
        expect(el.className).toContain('resource-inf');
        expect(el.title).toBe('Resource res_1 (0)');

        rerender(
            <Token object={{ id: 'res_2', type: 'Resource', resort: '???', owner: '0' } as any} />,
        );
        el = container.firstChild as HTMLElement;
        expect(el.className).toContain('resource-unknown');

        rerender(
            <Token object={{ id: 'res_3', type: 'Resource', resort: '  sEc  ', owner: '0' } as any} />,
        );
        el = container.firstChild as HTMLElement;
        expect(el.className).toContain('resource-sec');
    });
});
