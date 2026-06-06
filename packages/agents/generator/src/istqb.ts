import type { IstqbMeta } from '@qaforge/core';

export interface IstqbAnnotation {
  level: IstqbMeta['level'];
  type: IstqbMeta['type'];
  technique: IstqbMeta['technique'];
  risk: IstqbMeta['risk'];
  requirement?: string;
}

export const DEFAULT_ISTQB: IstqbAnnotation = {
  level: 'system',
  type: 'functional',
  technique: ['EP', 'BVA'],
  risk: 'medium',
};

export function renderIstqbBlock(meta: IstqbAnnotation): string {
  const techniques = meta.technique.join(', ');
  const req = meta.requirement ? `\n * requirement: ${meta.requirement}` : '';
  return `/** @istqb
 * level: ${meta.level}
 * type: ${meta.type}
 * technique: [${techniques}]
 * risk: ${meta.risk}${req}
 */`;
}
