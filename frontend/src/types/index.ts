export interface PantryItem {
  id: number;
  ingredient: {
    id: number;
    name: string;
    category: string;
  };
  quantity?: string;
}

