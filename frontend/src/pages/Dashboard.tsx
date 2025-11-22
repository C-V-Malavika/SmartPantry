import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat, ShoppingBasket, Clock, TrendingUp, Search, Plus, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { IngredientBrowser } from '@/components/IngredientBrowser';
import { PantryManager } from '@/components/PantryManager';
import { RecipeSuggestions } from '@/components/RecipeSuggestions';
import { PantryItem } from '@/types';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [activeTab, setActiveTab] = useState('ingredients');
  const [recipeCount, setRecipeCount] = useState<number>(0);
  const [categoryCount, setCategoryCount] = useState<number>(0);
  const [totalIngredientsCount, setTotalIngredientsCount] = useState<number>(0); // New state for total ingredients

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAddToPantry = (ingredient: { id: number; name: string; category: string }) => {
    const newPantryItem: PantryItem = {
      id: Date.now(), 
      ingredient
    };
    setPantryItems(prev => [...prev, newPantryItem]);
  };

  const handleRemoveFromPantry = (id: number) => {
    setPantryItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateQuantity = (id: number, quantity: string) => {
    setPantryItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const pantryIngredientIds = pantryItems.map(item => item.ingredient.id);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const foodSnapshot = await getDocs(collection(db, 'Food'));
        setRecipeCount(foodSnapshot.size);

        const ingredientsSnapshot = await getDocs(collection(db, 'Ingredients'));
        
        // Count total ingredients
        setTotalIngredientsCount(ingredientsSnapshot.size);
        
        // Count categories (keeping your existing logic)
        const categories = new Set<string>();
        ingredientsSnapshot.forEach(doc => {
          const data = doc.data() as any;
          const category = data?.Category || data?.category;
          if (typeof category === 'string' && category.trim().length > 0) {
            categories.add(category.trim());
          }
        });
        setCategoryCount(categories.size);
      } catch (error) {
        console.error('Error fetching dashboard counts:', error);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">
              Welcome back, <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{user?.name}</span>!
            </h1>
            <p className="text-muted-foreground mt-2">Ready to cook something amazing?</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pantry Items</CardTitle>
              <ShoppingBasket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pantryItems.length}</div>
              <p className="text-xs text-muted-foreground">Items in pantry</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Recipes</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recipeCount}</div>
              <p className="text-xs text-muted-foreground">Recipe suggestions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoryCount}</div>
              <p className="text-xs text-muted-foreground">Ingredient categories</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ingredients</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalIngredientsCount}</div>
              <p className="text-xs text-muted-foreground">Available ingredients</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ingredients" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Browse Ingredients
            </TabsTrigger>
            <TabsTrigger value="pantry" className="flex items-center gap-2">
              <ShoppingBasket className="h-4 w-4" />
              My Pantry ({pantryItems.length})
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Recipe Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingredients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Browse Available Ingredients</CardTitle>
                <CardDescription>
                  Search and add ingredients to your pantry. {totalIngredientsCount} ingredients available across {categoryCount} categories.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IngredientBrowser 
                  onAddToPantry={handleAddToPantry}
                  pantryItems={pantryIngredientIds}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pantry" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Pantry</CardTitle>
                <CardDescription>
                  Manage your pantry items. Add and remove items as needed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PantryManager 
                  pantryItems={pantryItems}
                  onRemoveFromPantry={handleRemoveFromPantry}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recipe Suggestions</CardTitle>
                <CardDescription>
                  Discover recipes based on your available ingredients. Recipes are sorted by ingredient match.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecipeSuggestions pantryIngredientIds={pantryIngredientIds} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;