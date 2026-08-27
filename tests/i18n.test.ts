import { describe, expect, it } from 'vitest';
import { resources } from '../src/i18n';

describe('i18n resources', () => {
  it('keeps all supported locales aligned', () => {
    const base = resources.en.translation;
    const locales = [resources.zh.translation, resources.ja.translation];
    for (const locale of locales) {
      for (const key of Object.keys(base)) {
        expect(locale, `${key} is missing`).toHaveProperty(key);
      }
    }
  });
});
