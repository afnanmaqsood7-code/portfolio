import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lens } from './lens';

export type Project = CollectionEntry<'projects'>;

/** Position of a project under a lens (falls back to its global `order`). */
export function lensPosition(p: Project, lens: Lens): number {
  if (lens === 'everything') return p.data.order;
  return p.data.lensOrder?.[lens] ?? p.data.order;
}

/** All projects sorted for the Everything lens. */
export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects');
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getFeaturedProjects(): Promise<Project[]> {
  return (await getProjects()).filter((p) => p.data.featured);
}

/** Human label for a project's lens tag. */
export function lensLabel(lens: Project['data']['lens']): string {
  return lens === 'both' ? 'Product · Brand' : lens === 'product' ? 'Product' : 'Brand';
}
