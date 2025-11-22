import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter } from 'lucide-react';
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Ingredient {
  id: string;
  name: string;
  category: string;
  image?: string;
}

interface IngredientBrowserProps {
  onAddToPantry: (ingredient: Ingredient) => void;
  pantryItems: string[];
}

export const IngredientBrowser: React.FC<IngredientBrowserProps> = ({ onAddToPantry, pantryItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(['All']);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        console.log('Fetching ingredients from Firestore...');
        const ingredientsCollection = collection(db, 'Ingredients');
        const ingredientsSnapshot = await getDocs(ingredientsCollection);
        console.log('Snapshot size:', ingredientsSnapshot.size);
        console.log('Docs:', ingredientsSnapshot.docs);
        
        const ingredientsList = ingredientsSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Document data:', doc.id, data);
          console.log('Available fields:', Object.keys(data));
          return {
            id: doc.id,
            name: data.Name || data.name || doc.id, // Try different field name variations
            category: data.Category || data.category || 'Unknown',
            image: data.Image || data.image || ''
          };
        });
        
        console.log('Ingredients list:', ingredientsList);
        setIngredients(ingredientsList);
        // Build categories dynamically from fetched data
        const uniqueCategories = Array.from(
          new Set(
            ingredientsList
              .map(i => i.category)
              .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
          )
        ).sort((a, b) => a.localeCompare(b));
        setCategories(['All', ...uniqueCategories]);
      } catch (error) {
        console.error('Error fetching ingredients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, []);

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ingredient.category === selectedCategory;
    console.log('Filtering ingredient:', ingredient.name, 'matchesSearch:', matchesSearch, 'matchesCategory:', matchesCategory);
    return matchesSearch && matchesCategory;
  });
  
  console.log('Total ingredients:', ingredients.length);
  console.log('Filtered ingredients:', filteredIngredients.length);

  const handleAddToPantry = (ingredient: Ingredient) => {
    onAddToPantry(ingredient);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p>Loading ingredients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Ingredients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIngredients.map(ingredient => {
          const isInPantry = pantryItems.includes(ingredient.id);
          return (
            <Card key={ingredient.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {ingredient.image && (
                      <img 
                        src={`/${ingredient.image}`} 
                        alt={ingredient.name}
                        className="w-12 h-12 object-cover rounded-lg"
                        onLoad={() => console.log('Image loaded successfully:', `/${ingredient.image}`)}
                        onError={(e) => {
                          console.log('Image failed to load:', `/${ingredient.image}`);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg">{ingredient.name}</CardTitle>
                    </div>
                  </div>
                  <Badge variant="secondary">{ingredient.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={() => handleAddToPantry(ingredient)}
                  disabled={isInPantry}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isInPantry ? 'In Pantry' : 'Add to Pantry'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredIngredients.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No ingredients found matching your search.</p>
        </div>
      )}
    </div>
  );
};
