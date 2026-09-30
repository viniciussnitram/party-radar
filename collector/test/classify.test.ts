import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classifyEvent } from '../src/classify.ts';
import type { DetailedEvent } from '../src/types.ts';

const baseEvent: DetailedEvent = {
  source: 'sympla',
  sourceId: '1',
  name: 'Sabado do TNT',
  startsAt: '2026-10-03T19:00:00+00:00',
  endsAt: null,
  city: 'Rio das Ostras',
  state: 'RJ',
  venue: 'Tô no Trabalho',
  address: null,
  latitude: null,
  longitude: null,
  imageUrl: null,
  url: 'https://www.sympla.com.br/evento/sabado-do-tnt/1',
  organizer: 'Tô no Trabalho',
  category: 'musica',
  description: 'A festa continua! Maiores de 18 anos.',
};

function eventWith(overrides: Partial<DetailedEvent>): DetailedEvent {
  return { ...baseEvent, ...overrides };
}

describe('classifyEvent', () => {
  describe('filtering', () => {
    it('keeps music events', () => {
      assert.notEqual(classifyEvent(baseEvent), null);
    });

    it('keeps events with a party word in the name, whatever the category', () => {
      const festival = eventWith({ name: 'Cavaleiros Festival', category: 'gastronomia-comidas-e-bebidas' });
      assert.notEqual(classifyEvent(festival), null);
    });

    it('drops events from excluded categories', () => {
      assert.equal(classifyEvent(eventWith({ category: 'desenvolvimento-pessoal' })), null);
    });

    it('drops other categories without a party word in the name', () => {
      assert.equal(classifyEvent(eventWith({ name: 'Mulheres Essenciais', category: 'outro' })), null);
    });

    it('drops events whose name or venue points to theater, courses and the like', () => {
      assert.equal(classifyEvent(eventWith({ name: 'Amor de Baile - Teatro Firjan SESI Macaé' })), null);
      assert.equal(classifyEvent(eventWith({ venue: 'Teatro Municipal' })), null);
      assert.equal(classifyEvent(eventWith({ name: 'Imersão 3D' })), null);
    });

    it('drops family events', () => {
      const musical = eventWith({ name: 'O Mágico de Oz', description: 'Uma montagem para toda a família.' });
      assert.equal(classifyEvent(musical), null);
    });

    it('drops listings whose date is still to be defined', () => {
      const crowdfunding = eventWith({ description: 'ATENÇÃO: DATA A DEFINIREste não é um ingresso comum.' });
      assert.equal(classifyEvent(crowdfunding), null);
    });

    it('classifies events without a page by name alone', () => {
      const withoutPage = eventWith({ name: 'Halloween da Mamacita', category: null, description: null });
      assert.equal(classifyEvent(withoutPage)?.kind, 'party');
    });
  });

  describe('kind', () => {
    it('is a party when the name has a party word', () => {
      assert.equal(classifyEvent(eventWith({ name: 'Réveillon 2027', description: null }))?.kind, 'party');
    });

    it('is a party when the description mentions a party, DJ or open bar', () => {
      assert.equal(classifyEvent(eventWith({ name: 'Fresh Sessions', description: 'Fresh Baile Charme!' }))?.kind, 'party');
    });

    it('is a show for tributes and live shows, even with a party in the description', () => {
      const tribute = eventWith({ name: 'Tributo a Djavan', description: 'Uma festa para os fãs.' });
      assert.equal(classifyEvent(tribute)?.kind, 'show');
    });

    it('is a show when nothing points to a party', () => {
      const forro = eventWith({ name: 'Forró do Sabadinho', description: 'Forró pé de serra.' });
      assert.equal(classifyEvent(forro)?.kind, 'show');
    });
  });

  describe('open bar', () => {
    it('is full for a plain open bar', () => {
      const reveillon = eventWith({ description: '+ Open Bar & Open Food + Queima de fogos' });
      assert.equal(classifyEvent(reveillon)?.openBar, 'full');
    });

    it('is partial when limited in time or to one drink', () => {
      ['1H DE MEGA OPEN BAR', 'Open bar até 1h', 'Open de chopp a noite toda', '500 litros de cerveja liberados'].forEach(
        (description) => assert.equal(classifyEvent(eventWith({ description }))?.openBar, 'partial', description),
      );
    });

    it('is null when not mentioned', () => {
      assert.equal(classifyEvent(baseEvent)?.openBar, null);
    });
  });

  describe('audience', () => {
    it('is university when name, organizer or description mentions it', () => {
      assert.equal(classifyEvent(eventWith({ name: 'Choppada da Titãs' }))?.audience, 'university');
      assert.equal(classifyEvent(eventWith({ organizer: 'Atlética Cavaleiros' }))?.audience, 'university');
      assert.equal(classifyEvent(eventWith({ description: 'Festa dos alunos da UFF!' }))?.audience, 'university');
    });

    it('is independent otherwise, without matching words inside other words', () => {
      assert.equal(classifyEvent(eventWith({ description: 'Festa com buffet completo.' }))?.audience, 'independent');
    });
  });
});
