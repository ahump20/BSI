export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: string;
}

export const SHOP_CATALOG: CatalogItem[] = [
  {
    id: 'skin_flame_commander',
    name: 'Flame Commander Skin',
    description: 'Fiery unit skin for your commander',
    cost: 150,
    category: 'cosmetic',
  },
  {
    id: 'banner_gold',
    name: 'Golden Banner',
    description: 'Gold-plated base banner',
    cost: 100,
    category: 'cosmetic',
  },
  {
    id: 'emote_gg',
    name: 'GG Emote',
    description: 'Post-match GG emote',
    cost: 50,
    category: 'emote',
  },
];

export function getCatalogItem(itemId: string): CatalogItem | undefined {
  return SHOP_CATALOG.find((i) => i.id === itemId);
}
