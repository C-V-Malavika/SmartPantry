import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, ChefHat, Star, Filter, X, Search } from 'lucide-react';
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

interface IngredientWithMeasure {
  name: string;
  measure: string;
}

interface Recipe {
  id: string;
  name: string;
  recipe: string;
  cookingTime: string;
  difficulty: string;
  servings: number;
  ingredients: IngredientWithMeasure[] | string[]; // Support both old and new format
  image: string;
}

interface RecipeSuggestionsProps {
  pantryIngredientIds: string[];
}

export const RecipeSuggestions: React.FC<RecipeSuggestionsProps> = ({ pantryIngredientIds }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'rating' | 'time' | 'ingredients'>('ingredients');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // 🔍 NEW: Search state
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        console.log('Fetching recipes from Firestore...');
        const foodCollection = collection(db, 'Food');
        const foodSnapshot = await getDocs(foodCollection);
        
        const recipesList = foodSnapshot.docs.map(doc => {
          const data = doc.data();
          // Handle both old format (string[]) and new format (IngredientWithMeasure[])
          let ingredients = data.Ingredients || data.ingredients || [];
          // Convert old format to new format if needed
          if (ingredients.length > 0 && typeof ingredients[0] === 'string') {
            ingredients = ingredients.map((ing: string) => ({
              name: ing.split(/[-:]/)[0].trim(),
              measure: ing.includes(':') || ing.includes('-') ? ing.split(/[-:]/).slice(1).join(' ').trim() : ''
            }));
          }
          return {
            id: doc.id,
            name: data.Name || data.name || doc.id,
            recipe: data.Recipe || data.recipe || '',
            cookingTime: data['Cooking Time'] || data.cookingTime || '',
            difficulty: data.Difficulty || data.difficulty || 'Easy',
            servings: data.Servings || data.servings || 1,
            ingredients: ingredients,
            image: data.Image || data.image || ''
          };
        });
        
        setRecipes(recipesList);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const filteredAndSortedRecipes = useMemo(() => {
    let filtered = recipes.filter(recipe => {
      const difficultyMatch = selectedDifficulty === 'All' || recipe.difficulty === selectedDifficulty;

      // 🔍 NEW: Search match logic
      const searchMatch =
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients.some(ing => {
          const ingredientName = typeof ing === 'string' 
            ? ing.toLowerCase()
            : ing.name.toLowerCase();
          return ingredientName.includes(searchTerm.toLowerCase());
        });

      return difficultyMatch && searchMatch;
    });

    // Calculate match score based on pantry ingredients
    const recipesWithScore = filtered.map(recipe => {
      const matchingIngredients = recipe.ingredients.filter(ingredient => {
        const ingredientName = typeof ingredient === 'string' 
          ? ingredient.split(/[-:]/)[0].trim().toLowerCase()
          : ingredient.name.trim().toLowerCase();
        return pantryIngredientIds.some(
          pantryItem => pantryItem.trim().toLowerCase() === ingredientName
        );
      });

      const matchScore = matchingIngredients.length / recipe.ingredients.length;

      return {
        ...recipe,
        matchScore,
        matchingIngredients: matchingIngredients.length,
        totalIngredients: recipe.ingredients.length
      };
    });

    // Sorting logic
    recipesWithScore.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          const parseTimeToSeconds = (timeStr: string) => {
            if (!timeStr || typeof timeStr !== 'string') return Infinity;
            const normalized = timeStr.toLowerCase().trim();
            let totalSeconds = 0;

            const hoursMatch = normalized.match(/(\d+)\s*(?:hrs?|hours?|h)/);
            if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;

            const minutesMatch = normalized.match(/(\d+)\s*(?:mins?|minutes?|m)/);
            if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;

            const secondsMatch = normalized.match(/(\d+)\s*(?:secs?|seconds?|s)/);
            if (secondsMatch) totalSeconds += parseInt(secondsMatch[1]);

            if (totalSeconds === 0) {
              const anyNumberMatch = normalized.match(/(\d+)/);
              if (anyNumberMatch) totalSeconds = parseInt(anyNumberMatch[1]) * 60;
            }

            return totalSeconds;
          };

          return parseTimeToSeconds(a.cookingTime) - parseTimeToSeconds(b.cookingTime);

        case 'ingredients':
        default:
          return b.matchScore - a.matchScore;
      }
    });

    return recipesWithScore;
  }, [recipes, pantryIngredientIds, selectedDifficulty, sortBy, searchTerm]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timeStr: string) => timeStr;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p>Loading recipes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Search Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search recipes by name or ingredient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedDifficulty === 'All' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty('All')}
            >
              All
            </Button>
            {['Easy', 'Medium', 'Hard'].map(difficulty => (
              <Button
                key={difficulty}
                variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDifficulty(difficulty)}
              >
                {difficulty}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            <Button
              variant={sortBy === 'ingredients' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('ingredients')}
            >
              <Filter className="mr-1 h-3 w-3" />
              Match
            </Button>
            <Button
              variant={sortBy === 'time' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('time')}
            >
              <Clock className="mr-1 h-3 w-3" />
              Time
            </Button>
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedRecipes.map(recipe => (
          <Card key={recipe.id} className="hover:shadow-lg transition-shadow h-[400px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {recipe.image && (
                    <img
                      src={`/${recipe.image}${recipe.image.includes('.') ? '' : '.jpg'}`}
                      alt={recipe.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <CardTitle className="text-lg">{recipe.name}</CardTitle>
                  </div>
                </div>
                <Badge className={getDifficultyColor(recipe.difficulty)}>
                  {recipe.difficulty}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">{recipe.recipe}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(recipe.cookingTime)}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {recipe.servings}
                </div>
              </div>

              {/* Match Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ingredients Match</span>
                  <span className="font-medium">
                    {recipe.matchingIngredients}/{recipe.totalIngredients}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${recipe.matchScore * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1 flex-1">
                <h4 className="text-sm font-medium">Ingredients:</h4>
                <div className="flex flex-wrap gap-1">
                  {recipe.ingredients.slice(0, 4).map((ingredient, index) => {
                    const ingredientName = typeof ingredient === 'string' 
                      ? ingredient.split(/[-:]/)[0].trim()
                      : ingredient.name.trim();
                    return (
                      <Badge
                        key={index}
                        variant={pantryIngredientIds.includes(ingredientName) ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {ingredientName}
                      </Badge>
                    );
                  })}
                  {recipe.ingredients.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{recipe.ingredients.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                size="sm"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <ChefHat className="mr-2 h-4 w-4" />
                View Recipe
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedRecipes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No recipes found matching your criteria.</p>
        </div>
      )}

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRecipe(null);
          }}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">{selectedRecipe.name}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRecipe(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {selectedRecipe.image && (
                <div className="flex justify-center">
                  <img
                    src={`/${selectedRecipe.image}${selectedRecipe.image.includes('.') ? '' : '.jpg'}`}
                    alt={selectedRecipe.name}
                    className="w-64 h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(selectedRecipe.cookingTime)}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {selectedRecipe.servings} servings
                </div>
                <Badge className={getDifficultyColor(selectedRecipe.difficulty)}>
                  {selectedRecipe.difficulty}
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {selectedRecipe.recipe}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
                <div className="space-y-2">
                  {selectedRecipe.ingredients.map((ingredient, index) => {
                    const ingredientName = typeof ingredient === 'string' 
                      ? ingredient.split(/[-:]/)[0].trim()
                      : ingredient.name.trim();
                    const ingredientMeasure = typeof ingredient === 'string'
                      ? (ingredient.includes(':') || ingredient.includes('-') 
                          ? ingredient.split(/[-:]/).slice(1).join(' ').trim()
                          : '')
                      : ingredient.measure.trim();
                    const displayText = ingredientMeasure 
                      ? `${ingredientName} - ${ingredientMeasure}`
                      : ingredientName;
                    
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <Badge
                          variant={pantryIngredientIds.includes(ingredientName) ? 'default' : 'outline'}
                          className="text-sm"
                        >
                          {displayText}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
