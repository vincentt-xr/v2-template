import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MIGRATION_FILE,
  MAX_SUMMARY,
  MAX_NOTES,
  MAX_NOTE_ENTRY,
  MigrationParseError,
  splitEntries,
  parseEntryBlock,
  validateBounds,
  findEntry,
  parseTargets,
  tokenEnvVar,
  buildBody,
  postRelease,
} from './release-row.mjs';

describe('parseEntryBlock — the happy path', () => {
  it('parses required: false with no notes', () => {
    const entry = parseEntryBlock('1.5.5', ['required: false', 'No action required.']);
    expect(entry).toEqual({ required: false, summary: 'No action required.', notes: [] });
  });

  it('parses required: true with notes', () => {
    const entry = parseEntryBlock('2.0.0', [
      'required: true',
      'Hand gestures moved to the gesture tracker.',
      '- GestureTracker replaces the callbacks read from HandTracker.',
      '- Update your imports.',
    ]);
    expect(entry.required).toBe(true);
    expect(entry.summary).toBe('Hand gestures moved to the gesture tracker.');
    expect(entry.notes).toEqual([
      'GestureTracker replaces the callbacks read from HandTracker.',
      'Update your imports.',
    ]);
  });

  it('tolerates blank lines between required, summary, and notes', () => {
    const entry = parseEntryBlock('1.0.0', [
      '',
      'required: true',
      '',
      'A summary line.',
      '',
      '- a note',
      '',
    ]);
    expect(entry).toEqual({ required: true, summary: 'A summary line.', notes: ['a note'] });
  });
});

describe('parseEntryBlock — strictness can go red', () => {
  it('rejects a missing required line', () => {
    expect(() => parseEntryBlock('1.0.0', ['Just a summary.'])).toThrow(MigrationParseError);
  });

  it('rejects a non-boolean required value', () => {
    expect(() => parseEntryBlock('1.0.0', ['required: yes', 'Summary.'])).toThrow(
      MigrationParseError,
    );
  });

  it('rejects a missing summary', () => {
    expect(() => parseEntryBlock('1.0.0', ['required: false'])).toThrow(MigrationParseError);
  });

  it('rejects a summary that is actually a bullet', () => {
    expect(() => parseEntryBlock('1.0.0', ['required: false', '- not a summary'])).toThrow(
      MigrationParseError,
    );
  });

  it('rejects stray content after the notes rather than best-effort parsing it', () => {
    expect(() =>
      parseEntryBlock('1.0.0', [
        'required: true',
        'Summary.',
        '- a note',
        'this is not a bullet and not blank',
      ]),
    ).toThrow(MigrationParseError);
  });

  it('never returns a partial entry — a throw carries no entry at all', () => {
    try {
      parseEntryBlock('1.0.0', ['required: false']);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(MigrationParseError);
      expect(err.version).toBe('1.0.0');
    }
  });
});

describe('splitEntries', () => {
  it('splits on ## headings, newest-first order preserved', () => {
    const content = [
      '# Migration notes',
      '',
      '## 1.5.5',
      'required: false',
      'No action required.',
      '',
      '## 1.5.4',
      'required: true',
      'Something changed.',
      '- a note',
    ].join('\n');
    const blocks = splitEntries(content);
    expect([...blocks.keys()]).toEqual(['1.5.5', '1.5.4']);
  });
});

describe('findEntry', () => {
  it('throws when the version has no heading at all', () => {
    const content = '# Migration notes\n\n## 1.5.5\nrequired: false\nNo action required.\n';
    expect(() => findEntry(content, '9.9.9')).toThrow(MigrationParseError);
  });

  it('finds and validates the current entry in the repo\'s real MIGRATION.md', () => {
    const content = readFileSync(join(process.cwd(), MIGRATION_FILE), 'utf8');
    const entry = findEntry(content, '1.5.5');
    expect(entry.required).toBe(false);
    expect(entry.summary.length).toBeGreaterThan(0);
  });
});

describe('validateBounds', () => {
  it('accepts an in-bounds entry', () => {
    expect(() =>
      validateBounds('1.0.0', { summary: 'short', notes: ['a', 'b'] }),
    ).not.toThrow();
  });

  it('rejects an over-long summary', () => {
    expect(() =>
      validateBounds('1.0.0', { summary: 'x'.repeat(MAX_SUMMARY + 1), notes: [] }),
    ).toThrow(MigrationParseError);
  });

  it('rejects more than the max notes', () => {
    expect(() =>
      validateBounds('1.0.0', {
        summary: 'ok',
        notes: Array.from({ length: MAX_NOTES + 1 }, (_, i) => `note ${i}`),
      }),
    ).toThrow(MigrationParseError);
  });

  it('rejects an over-long note', () => {
    expect(() =>
      validateBounds('1.0.0', { summary: 'ok', notes: ['y'.repeat(MAX_NOTE_ENTRY + 1)] }),
    ).toThrow(MigrationParseError);
  });
});

describe('parseTargets', () => {
  it('parses the documented RELEASE_ROWS_TARGETS shape', () => {
    expect(
      parseTargets('staging=https://api.staging.vincentt.studio,prod=https://api.vincentt.studio'),
    ).toEqual([
      { name: 'staging', url: 'https://api.staging.vincentt.studio' },
      { name: 'prod', url: 'https://api.vincentt.studio' },
    ]);
  });

  it('throws on a pair with no "="', () => {
    expect(() => parseTargets('staging')).toThrow();
  });
});

describe('tokenEnvVar', () => {
  it('uppercases the target name into the token env var name', () => {
    expect(tokenEnvVar('staging')).toBe('RELEASE_PUBLISHER_TOKEN_STAGING');
    expect(tokenEnvVar('prod')).toBe('RELEASE_PUBLISHER_TOKEN_PROD');
  });
});

describe('buildBody', () => {
  it('is identical across targets — the body does not vary by env', () => {
    const entry = { required: false, summary: 'No action required.', notes: [] };
    const body = buildBody('1.5.5', entry);
    expect(body).toEqual({
      component: 'template',
      version: '1.5.5',
      migration: { required: false, summary: 'No action required.', notes: [] },
      source: { repo: 'vincentt-xr/v2-template', sha: '', runId: '' },
    });
  });
});

describe('postRelease', () => {
  const target = { name: 'staging', url: 'https://api.staging.example' };
  const body = { component: 'template', version: '1.5.5' };

  it('reports an error, never throws, when the token env var is unset', async () => {
    delete process.env.RELEASE_PUBLISHER_TOKEN_STAGING;
    const result = await postRelease(target, body, vi.fn());
    expect(result.outcome).toBe('error');
    expect(result.detail).toContain('RELEASE_PUBLISHER_TOKEN_STAGING');
  });

  it('reports "written" on a 200 with written:true', async () => {
    process.env.RELEASE_PUBLISHER_TOKEN_STAGING = 'vrp_test';
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ component: 'template', version: '1.5.5', written: true, release: '2026.09.3' }),
    });
    const result = await postRelease(target, body, fetchImpl);
    expect(result.outcome).toBe('written');
    delete process.env.RELEASE_PUBLISHER_TOKEN_STAGING;
  });

  it('reports "unchanged" on a 200 with written:false', async () => {
    process.env.RELEASE_PUBLISHER_TOKEN_STAGING = 'vrp_test';
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ written: false }),
    });
    const result = await postRelease(target, body, fetchImpl);
    expect(result.outcome).toBe('unchanged');
    delete process.env.RELEASE_PUBLISHER_TOKEN_STAGING;
  });

  it('reports "refused" with the code and reason on a 400', async () => {
    process.env.RELEASE_PUBLISHER_TOKEN_STAGING = 'vrp_test';
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        code: 'migration_note_invalid',
        message: 'the migration note was refused',
        detail: { component: 'template', reason: 'path_token' },
      }),
    });
    const result = await postRelease(target, body, fetchImpl);
    expect(result.outcome).toBe('refused');
    expect(result.code).toBe('migration_note_invalid');
    expect(result.reason).toBe('path_token');
    delete process.env.RELEASE_PUBLISHER_TOKEN_STAGING;
  });

  it('reports "error" on a transport fault rather than throwing', async () => {
    process.env.RELEASE_PUBLISHER_TOKEN_STAGING = 'vrp_test';
    const fetchImpl = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
    const result = await postRelease(target, body, fetchImpl);
    expect(result.outcome).toBe('error');
    expect(result.detail).toContain('ENOTFOUND');
    delete process.env.RELEASE_PUBLISHER_TOKEN_STAGING;
  });
});
