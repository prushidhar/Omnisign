import { MemoryLayer, normalizeSequenceKey } from '../MemoryLayer';
import { InMemoryStore } from '../MemoryStore';

describe('MemoryLayer (OmniSign translation memory)', () => {
  it('normalizes sequence keys correctly', () => {
    expect(normalizeSequenceKey(['help', '  medicine  '])).toBe('HELP|MEDICINE');
    expect(normalizeSequenceKey(['account', 'Passbook'])).toBe('ACCOUNT|PASSBOOK');
    expect(normalizeSequenceKey([])).toBe('');
  });

  it('performs synchronous O(1) exact match lookup on seeded memories', () => {
    const memory = new MemoryLayer(new InMemoryStore());
    const start = Date.now();
    const result = memory.lookup(['HELP', 'MEDICINE']);
    const elapsedMs = Date.now() - start;

    expect(elapsedMs).toBeLessThan(50); // microsecond scale
    expect(result.kind).toBe('exact');
    if (result.kind === 'exact') {
      expect(result.match.translations.en).toContain('prescribed medication');
      expect(result.match.translations.hi).toContain('दवा');
      expect(result.match.translations.te).toContain('మందులు');
      expect(result.match.useCount).toBeGreaterThanOrEqual(2);
    }
  });

  it('performs fuzzy match lookup on partial or extended token queries', () => {
    const memory = new MemoryLayer(new InMemoryStore());
    // Extended query with extra token
    const result = memory.lookup(['HELP', 'DOCTOR', 'URGENT']);

    expect(result.kind).toBe('fuzzy');
    if (result.kind === 'fuzzy') {
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.matches[0].normalizedKey).toBe('HELP|DOCTOR');
    }
  });

  it('returns miss for completely unknown token sequences', () => {
    const memory = new MemoryLayer(new InMemoryStore());
    const result = memory.lookup(['RANDOM_UNKNOWN_TOKEN_1234']);
    expect(result.kind).toBe('miss');
  });

  it('remembers new translations and provides instant synchronous lookup', async () => {
    const store = new InMemoryStore();
    const memory = new MemoryLayer(store);

    await memory.remember(
      ['BLOOD', 'TEST'],
      {
        en: 'Where is the blood test laboratory?',
        hi: 'रक्त परीक्षण प्रयोगशाला कहाँ है?',
        te: 'రక్త పరీక్ష ప్రయోగశాల ఎక్కడ ఉంది?',
      },
      'hospital',
    );

    const lookup = memory.lookup(['BLOOD', 'TEST']);
    expect(lookup.kind).toBe('exact');
    if (lookup.kind === 'exact') {
      expect(lookup.match.translations.en).toBe('Where is the blood test laboratory?');
      expect(lookup.match.translations.hi).toBe('रक्त परीक्षण प्रयोगशाला कहाँ है?');
      expect(lookup.match.translations.te).toBe('రక్త పరీక్ష ప్రయోగశాల ఎక్కడ ఉంది?');
    }
  });

  it('restores persisted memories during warmUp', async () => {
    const store = new InMemoryStore([
      {
        id: 'persisted-1',
        tokens: ['PENSION', 'FORM'],
        normalizedKey: 'PENSION|FORM',
        translations: { en: 'I need to submit my pension life certificate.' },
        useCount: 5,
        lastUsedAt: Date.now(),
      },
    ]);

    const memory = new MemoryLayer(store);
    await memory.warmUp();

    const result = memory.lookup(['PENSION', 'FORM']);
    expect(result.kind).toBe('exact');
    if (result.kind === 'exact') {
      expect(result.match.translations.en).toBe('I need to submit my pension life certificate.');
    }
  });
});
