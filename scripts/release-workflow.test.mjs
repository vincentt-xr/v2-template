/**
 * release.yml has two paths: a tag push reaches staging only, a dispatch from
 * the tag is the promote. These assertions read the workflow file so a later
 * edit cannot quietly hand a tag push the prod token or the `latest` move.
 */
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const yaml = readFileSync(path.join(REPO, '.github/workflows/release.yml'), 'utf8')
  .split('\n')
  .filter((l) => !/^\s*#/.test(l))
  .join('\n');

function step(name) {
  const part = yaml.split(`- name: ${name}`)[1];
  expect(part, `step "${name}" exists`).toBeDefined();
  return part.split(/\n\s+- name:/)[0];
}

test('keeps the repo guard, the release environment and both triggers', () => {
  expect(yaml).toContain("github.repository == 'vincentt-xr/v2-template'");
  expect(yaml).toMatch(/^\s+environment:\s*release\s*$/m);
  expect(yaml).toMatch(/push:\s*\n\s+tags:/);
  expect(yaml).toMatch(/workflow_dispatch:/);
});

test('moving `latest` is promote-only', () => {
  const move = step('Move `latest`');
  expect(move).toContain("github.event_name == 'workflow_dispatch'");
  expect(yaml.match(/git push --force origin refs\/tags\/latest/g)).toHaveLength(1);
});

test('the tag push writes the staging row with no prod token', () => {
  const s = step('Write the staging release row');
  expect(s).toContain("github.event_name == 'push'");
  expect(s).toContain('--target staging');
  expect(s).not.toContain('TOKEN_PROD');
});

test('the prod token reaches only the promote row step', () => {
  const s = step('Write the prod release row');
  expect(s).toContain("github.event_name == 'workflow_dispatch'");
  expect(s).toContain('--target prod');
  expect(s).not.toContain('TOKEN_STAGING');
  expect(yaml.match(/secrets\.RELEASE_PUBLISHER_TOKEN_PROD/g)).toHaveLength(1);
});

test('the promote is gated before `latest` moves, and the dispatch ref must be the tag', () => {
  expect(yaml.indexOf('check-release-pointer.mjs --promote')).toBeGreaterThan(0);
  expect(yaml.indexOf('check-release-pointer.mjs --promote')).toBeLessThan(yaml.indexOf('- name: Move `latest`'));
  expect(yaml).toMatch(/REF_TYPE"\s*!=\s*"tag"/);
  expect(yaml).toMatch(/REF_NAME"\s*!=\s*"\$INPUT_REF"/);
});
