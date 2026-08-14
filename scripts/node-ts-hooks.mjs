/**
 * Lets Node run the app's TypeScript sources directly.
 *
 * Metro resolves extensionless relative imports and the `@/*` alias; Node's ESM
 * resolver does neither. This hook adds both so verification scripts can import
 * the real app modules instead of a parallel copy.
 */
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { resolve as resolvePath, dirname } from 'node:path';

const SRC = resolvePath(import.meta.dirname, '../src');
const CANDIDATES = ['.ts', '.tsx', '/index.ts', '/index.tsx'];

export async function resolve(specifier, context, next) {
  let spec = specifier;

  if (spec.startsWith('@/')) {
    spec = pathToFileURL(resolvePath(SRC, spec.slice(2))).href;
  }

  const isRelative = spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('file:');
  if (isRelative) {
    const base = spec.startsWith('file:')
      ? new URL(spec)
      : new URL(spec, context.parentURL ?? pathToFileURL(dirname(import.meta.dirname)).href);
    if (!existsSync(base)) {
      for (const ext of CANDIDATES) {
        const candidate = new URL(base.href + ext);
        if (existsSync(candidate)) return next(candidate.href, context);
      }
    }
    return next(base.href, context);
  }

  return next(spec, context);
}
