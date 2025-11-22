import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { PantryItem } from '@/types';

interface PantryManagerProps {
  pantryItems: PantryItem[];
  onRemoveFromPantry: (id: number) => void;
  onUpdateQuantity: (id: number, quantity: string) => void;
}

export const PantryManager: React.FC<PantryManagerProps> = ({ 
  pantryItems, 
  onRemoveFromPantry
}) => {

  const groupByCategory = (items: PantryItem[]) => {
    return items.reduce((groups, item) => {
      const category = item.ingredient.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {} as Record<string, PantryItem[]>);
  };

  const groupedItems = groupByCategory(pantryItems);


  return (
    <div className="space-y-6">
      {pantryItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Your pantry is empty. Add some ingredients to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
                <CardDescription>{items.length} item{items.length !== 1 ? 's' : ''}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{item.ingredient.name}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRemoveFromPantry(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

