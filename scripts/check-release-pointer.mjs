// Daily check of what `vincentt init` actually hands a creator: the `latest`
// tag. Fails when `latest` is not at the commit of the template version prod's
// `GET /platform/versions` names (a promote died before moving it, or a tag
// moved it), or when the SDK/harness versions locked at `latest` are not the
// ones the template should follow (a package shipped and the template never
// followed). A template on the shared runtime follows the versions that
// runtime carries, since its build loads them from the runtime and a newer local
// copy would be bundled beside it; otherwise it follows npm's `latest` dist-tag.
// Between a template tag and release day `latest` is deliberately behind the
// newest tag; prod's row, not the tag list, says what `latest` must be.
//
// `--promote <tag>` is the release-day gate release.yml runs before it moves
// `latest`: staging's row already names <tag> and the tag's pins are followed.
// Reads the repo this file lives in; tags must be fetched.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const POINTER = 'latest';
export const FOLLOWED = ['@vincentt-xr/sdk', '@vincentt-xr/harness'];
export const RUNTIME = '@vincentt-xr/runtime';
// The production runtime: `latest` is what a creator scaffolds, and prod is
// where a released runtime version is guaranteed to exist.
export const RUNTIME_ORIGIN = 'https://runtime.vincentt.studio';

export const API_ORIGINS = {
  staging: 'https://api.staging.vincentt.studio',
  prod: 'https://api.vincentt.studio',
};

const RELEASE_TAG = /^\d+\.\d+\.\d+$/;

/** The template version a `GET /platform/versions` body names, or null. */
export function namedTemplateVersion(body) {
  const v = body?.components?.template?.version;
  return typeof v === 'string' && RELEASE_TAG.test(v) ? v : null;
}

// The version the root importer resolves `pkg` to. The lockfile, not the
// package.json specifier, is what a scaffold installs: `^1.5.0` says nothing
// about which 1.x a creator gets.
export function lockedVersion(lockText, pkg) {
  const lines = lockText.split('\n');
  const start = lines.findIndex((l) => l === 'importers:');
  if (start === -1) return null;
  const rootAt = lines.findIndex((l, i) => i > start && l === '  .:');
  if (rootAt === -1) return null;
  const keys = [`      '${pkg}':`, `      ${pkg}:`];
  for (let i = rootAt + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^ {0,2}\S/.test(line)) break;
    if (!keys.includes(line)) continue;
    for (let j = i + 1; j < lines.length && lines[j].startsWith('        '); j += 1) {
      const m = /^ {8}version: ([^(\s]+)/.exec(lines[j]);
      if (m) return m[1];
    }
    return null;
  }
  return null;
}

export function pointerFailures({ pointerSha, prodVersion, prodSha }) {
  if (!prodVersion) return ['prod names no template version'];
  if (!pointerSha) return [`tag \`${POINTER}\` does not exist`];
  if (!prodSha) return [`prod names template ${prodVersion}, but that tag does not exist here`];
  if (pointerSha !== prodSha) {
    return [
      `\`${POINTER}\` is at ${pointerSha}, but prod names template ${prodVersion} at ${prodSha}; the promote for ${prodVersion} did not move \`${POINTER}\``,
    ];
  }
  return [];
}

/** The release-day gate: staging's row already names the tag being promoted. */
export function promoteFailures({ tag, stagingVersion }) {
  if (!RELEASE_TAG.test(tag ?? '')) return [`${tag} is not a bare-semver tag`];
  if (stagingVersion !== tag) {
    return [`staging names template ${stagingVersion ?? 'nothing'}, not ${tag}; only the version staging already serves is promoted`];
  }
  return [];
}

/**
 * The versions the template should lock, and where they come from: the shared
 * runtime's own package versions when the template locks a runtime, npm's
 * `latest` dist-tags otherwise. A runtime whose manifest could not be read is a
 * failure, never a silent fall back to npm.
 */
export function expectedVersions({ runtimeVersion, runtimePackages, distLatest }) {
  if (!runtimeVersion) return { want: distLatest, source: 'npm `latest`', failures: [] };
  if (!runtimePackages) {
    return {
      want: {},
      source: `runtime ${runtimeVersion}`,
      failures: [`the template at \`${POINTER}\` locks ${RUNTIME} ${runtimeVersion}, but its manifest could not be read`],
    };
  }
  return { want: runtimePackages, source: `runtime ${runtimeVersion}`, failures: [] };
}

export function pinFailures(locked, want, source = 'npm `latest`') {
  const failures = [];
  for (const pkg of FOLLOWED) {
    const have = locked[pkg];
    const expected = want[pkg];
    if (!have) failures.push(`${pkg} is not locked in the template at \`${POINTER}\``);
    else if (!expected) failures.push(`${pkg} has no version in ${source}`);
    else if (have !== expected) {
      failures.push(`${pkg}: the template at \`${POINTER}\` locks ${have}, ${source} is ${expected}`);
    }
  }
  return failures;
}

async function runtimePackagesFor(version) {
  try {
    const res = await fetch(`${RUNTIME_ORIGIN}/v/${version}/manifest.json`, { redirect: 'error' });
    if (!res.ok) return null;
    const manifest = await res.json();
    if (manifest?.version !== version || typeof manifest.packages !== 'object' || manifest.packages === null) {
      return null;
    }
    return manifest.packages;
  } catch {
    return null;
  }
}

function git(...args) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function tagSha(tag) {
  try {
    return git('rev-list', '-n1', `refs/tags/${tag}`);
  } catch {
    return null;
  }
}

async function versionsAt(origin) {
  try {
    const res = await fetch(`${origin}/platform/versions`, { redirect: 'error' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

// Failures for the pins locked at `ref`, against what they should follow.
async function pinCheck(ref) {
  const lockText = git('show', `${ref}:pnpm-lock.yaml`);
  const locked = {};
  const distLatest = {};
  for (const pkg of FOLLOWED) {
    locked[pkg] = lockedVersion(lockText, pkg);
    const tags = JSON.parse(
      execFileSync('npm', ['view', pkg, 'dist-tags', '--json'], { encoding: 'utf8' }),
    );
    distLatest[pkg] = tags.latest ?? null;
  }
  const runtimeVersion = lockedVersion(lockText, RUNTIME);
  const runtimePackages = runtimeVersion ? await runtimePackagesFor(runtimeVersion) : null;
  const { want, source, failures } = expectedVersions({ runtimeVersion, runtimePackages, distLatest });
  for (const pkg of FOLLOWED) {
    const npmNote = runtimeVersion ? `, npm latest ${distLatest[pkg]}` : '';
    console.log(`${pkg}: locked at ${ref} ${locked[pkg]}, ${source} ${want[pkg] ?? '?'}${npmNote}`);
  }
  return [...failures, ...pinFailures(locked, want, source)];
}

async function main() {
  const promoteAt = process.argv.indexOf('--promote');
  if (promoteAt !== -1) {
    const tag = process.argv[promoteAt + 1];
    const stagingVersion = namedTemplateVersion(await versionsAt(API_ORIGINS.staging));
    const failures = promoteFailures({ tag, stagingVersion });
    if (failures.length === 0) failures.push(...(await pinCheck(`refs/tags/${tag}`)));
    if (failures.length === 0) console.log(`OK: ${tag} is staged and its pins are followed`);
    for (const f of failures) console.log(`::error::${f}`);
    process.exit(failures.length ? 1 : 0);
  }

  const prodVersion = namedTemplateVersion(await versionsAt(API_ORIGINS.prod));
  const failures = pointerFailures({
    pointerSha: tagSha(POINTER),
    prodVersion,
    prodSha: prodVersion ? tagSha(prodVersion) : null,
  });
  if (tagSha(POINTER)) failures.push(...(await pinCheck(`refs/tags/${POINTER}`)));

  console.log(`\`${POINTER}\` -> ${tagSha(POINTER)}; prod names template ${prodVersion}`);
  if (failures.length === 0) console.log('OK');
  for (const f of failures) console.log(`::error::${f}`);
  process.exit(failures.length ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
