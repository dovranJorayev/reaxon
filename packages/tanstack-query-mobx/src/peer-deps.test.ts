import { createRequire } from 'node:module';
import { satisfies } from 'semver';
import { describe, expect, it } from 'vitest';
import pkg from '../package.json';

/**
 * Guards the contract in `peerDependencies`: whatever version of each peer is
 * installed while the suite runs (the pinned devDependency locally, a matrix
 * entry in CI) must be inside the range the package promises to support.
 * Bumping a devDependency past the range, or widening the range without
 * running the matrix against the new edge, fails here first.
 */
describe('peerDependencies', () => {
  const require = createRequire(import.meta.url);

  it.each(Object.entries(pkg.peerDependencies))(
    'installed %s satisfies %s',
    (name, range) => {
      const { version } = require(`${name}/package.json`) as { version: string };
      expect(satisfies(version, range)).toBe(true);
    }
  );
});
