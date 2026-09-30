import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decodeHtmlText, normalize, slugify } from '../src/lib/text.ts';

describe('text', () => {
  it('normalizes case and accents', () => {
    assert.equal(normalize('  MACAÉ '), 'macae');
  });

  it('slugifies city and state', () => {
    assert.equal(slugify('Campos dos Goytacazes', 'RJ'), 'campos-dos-goytacazes-rj');
  });

  it('decodes named and numeric HTML entities and collapses whitespace', () => {
    assert.equal(
      decodeHtmlText('Open Bar &amp; Open Food&nbsp;&nbsp;\n+ Kids &gt; 5 &#39;anos&#x27; &unknown;'),
      "Open Bar & Open Food + Kids > 5 'anos' &unknown;",
    );
  });
});
