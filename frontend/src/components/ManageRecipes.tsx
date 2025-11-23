import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { firestoreService, IngredientWithMeasure } from '@/services/firestore';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Edit, Trash2, X, Save, ChevronDown, Plus } from 'lucide-react';

interface RecipeItem {
  id: string;
  Name: string;
  'Cooking Time': string;
  Difficulty: string;
  Image: string;
  Ingredients: IngredientWithMeasure[] | string[];
  Recipe: string;
  Servings: number;
}

const ManageRecipes = () => {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    difficulty: string;
    ingredients: IngredientWithMeasure[];
    recipe: string;
  } | null>(null);
  const [availableIngredients, setAvailableIngredients] = useState<Array<{ id: string; name: string }>>([]);
  const [showIngredientDropdowns, setShowIngredientDropdowns] = useState<{ [key: string]: boolean }>({});
  const [ingredientInputs, setIngredientInputs] = useState<{ [key: string]: string }>({});
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState<{ [key: string]: boolean }>({});

  const difficultyOptions = ['Easy', 'Medium', 'Hard'];

  useEffect(() => {
    fetchRecipes();
    fetchAvailableIngredients();
  }, []);

  const fetchRecipes = async () => {
    try {
      const foodCollection = collection(db, 'Food');
      const foodSnapshot = await getDocs(foodCollection);
      
      const recipesList = foodSnapshot.docs.map(doc => {
        const data = doc.data();
        let ingredients = data.Ingredients || [];
        if (ingredients.length > 0 && typeof ingredients[0] === 'string') {
          ingredients = ingredients.map((ing: string) => ({
            name: ing.split(/[-:]/)[0].trim(),
            measure: ing.includes(':') || ing.includes('-') ? ing.split(/[-:]/).slice(1).join(' ').trim() : ''
          }));
        }
        return {
          id: doc.id,
          Name: data.Name || '',
          'Cooking Time': data['Cooking Time'] || '',
          Difficulty: data.Difficulty || '',
          Image: data.Image || '',
          Ingredients: ingredients,
          Recipe: data.Recipe || '',
          Servings: data.Servings || 1,
        };
      });
      
      setRecipes(recipesList);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recipes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableIngredients = async () => {
    try {
      const ingredientsCollection = collection(db, 'Ingredients');
      const ingredientsSnapshot = await getDocs(ingredientsCollection);
      
      const ingredientsList: Array<{ id: string; name: string }> = [];
      ingredientsSnapshot.forEach(doc => {
        const data = doc.data();
        const name = data?.Name || data?.name;
        if (typeof name === 'string' && name.trim().length > 0) {
          ingredientsList.push({
            id: doc.id,
            name: name.trim(),
          });
        }
      });
      
      ingredientsList.sort((a, b) => a.name.localeCompare(b.name));
      setAvailableIngredients(ingredientsList);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await firestoreService.deleteRecipe(id);
      toast({
        title: 'Success',
        description: `Recipe "${name}" has been deleted`,
      });
      fetchRecipes();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete recipe',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (recipe: RecipeItem) => {
    const ingredients = recipe.Ingredients.map(ing => 
      typeof ing === 'string' 
        ? { name: ing.split(/[-:]/)[0].trim(), measure: '' }
        : ing
    );
    
    setEditingId(recipe.id);
    setEditData({
      difficulty: recipe.Difficulty,
      ingredients: ingredients,
      recipe: recipe.Recipe,
    });
    
    // Initialize inputs
    const inputs: { [key: string]: string } = {};
    ingredients.forEach((ing, idx) => {
      inputs[`${recipe.id}-${idx}`] = ing.name;
    });
    setIngredientInputs(inputs);
  };

  const handleSave = async (id: string) => {
    if (!editData) return;

    try {
      const recipe = recipes.find(r => r.id === id);
      if (!recipe) return;

      await firestoreService.updateRecipe(id, {
        Name: recipe.Name,
        'Cooking Time': recipe['Cooking Time'],
        Difficulty: editData.difficulty,
        Image: recipe.Image,
        Ingredients: editData.ingredients.filter(ing => ing.name.trim() !== ''),
        Recipe: editData.recipe,
        Servings: recipe.Servings,
      });

      toast({
        title: 'Success',
        description: 'Recipe updated successfully',
      });

      setEditingId(null);
      setEditData(null);
      fetchRecipes();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update recipe',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
    setIngredientInputs({});
  };

  const handleIngredientNameChange = (recipeId: string, index: number, name: string) => {
    if (!editData) return;
    
    const newInputs = { ...ingredientInputs };
    newInputs[`${recipeId}-${index}`] = name;
    setIngredientInputs(newInputs);

    const newIngredients = [...editData.ingredients];
    newIngredients[index] = { ...newIngredients[index], name };
    setEditData({ ...editData, ingredients: newIngredients });

    const newDropdowns = { ...showIngredientDropdowns };
    newDropdowns[`${recipeId}-${index}`] = true;
    setShowIngredientDropdowns(newDropdowns);
  };

  const handleIngredientSelect = (recipeId: string, index: number, name: string) => {
    if (!editData) return;
    
    const newInputs = { ...ingredientInputs };
    newInputs[`${recipeId}-${index}`] = name;
    setIngredientInputs(newInputs);

    const newIngredients = [...editData.ingredients];
    newIngredients[index] = { ...newIngredients[index], name };
    setEditData({ ...editData, ingredients: newIngredients });

    const newDropdowns = { ...showIngredientDropdowns };
    newDropdowns[`${recipeId}-${index}`] = false;
    setShowIngredientDropdowns(newDropdowns);
  };

  const handleIngredientMeasureChange = (index: number, measure: string) => {
    if (!editData) return;
    const newIngredients = [...editData.ingredients];
    newIngredients[index] = { ...newIngredients[index], measure };
    setEditData({ ...editData, ingredients: newIngredients });
  };

  const addIngredientField = (recipeId: string) => {
    if (!editData) return;
    const newIngredients = [...editData.ingredients, { name: '', measure: '' }];
    setEditData({ ...editData, ingredients: newIngredients });
    setIngredientInputs({ ...ingredientInputs, [`${recipeId}-${newIngredients.length - 1}`]: '' });
  };

  const removeIngredientField = (recipeId: string, index: number) => {
    if (!editData || editData.ingredients.length <= 1) return;
    const newIngredients = editData.ingredients.filter((_, i) => i !== index);
    setEditData({ ...editData, ingredients: newIngredients });
    
    const newInputs = { ...ingredientInputs };
    delete newInputs[`${recipeId}-${index}`];
    setIngredientInputs(newInputs);
  };

  if (loading) {
    return <div className="text-center py-8">Loading recipes...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Recipes</CardTitle>
        <CardDescription>
          View, edit, or delete recipes in the database
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recipes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recipes found. Add some recipes to get started.
          </div>
        ) : (
          <div className="space-y-6">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {recipe.Image && (
                    <img
                      src={`/${recipe.Image}`}
                      alt={recipe.Name}
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{recipe.Name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>⏱️ {recipe['Cooking Time']}</span>
                          <span>👥 {recipe.Servings} servings</span>
                          <Badge variant="secondary">{recipe.Difficulty}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {editingId === recipe.id ? (
                          <>
                            <Button size="sm" onClick={() => handleSave(recipe.id)}>
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(recipe)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(recipe.id, recipe.Name)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingId === recipe.id && editData ? (
                      <div className="mt-4 space-y-4">
                        <div>
                          <Label>Difficulty</Label>
                          <div className="relative mt-1">
                            <Input
                              type="text"
                              placeholder="Select difficulty"
                              value={editData.difficulty}
                              readOnly
                              onClick={() => setShowDifficultyDropdown({ ...showDifficultyDropdown, [recipe.id]: true })}
                              onFocus={() => setShowDifficultyDropdown({ ...showDifficultyDropdown, [recipe.id]: true })}
                              onBlur={() => setTimeout(() => setShowDifficultyDropdown({ ...showDifficultyDropdown, [recipe.id]: false }), 200)}
                              className="cursor-pointer w-40"
                            />
                            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                            {showDifficultyDropdown[recipe.id] && (
                              <div className="absolute z-20 w-40 mt-1 bg-popover border border-border rounded-md shadow-lg">
                                {difficultyOptions.map((option) => (
                                  <div
                                    key={option}
                                    className={`px-4 py-2 hover:bg-accent cursor-pointer transition-colors ${
                                      editData.difficulty === option ? 'bg-accent font-medium' : ''
                                    }`}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setEditData({ ...editData, difficulty: option });
                                      setShowDifficultyDropdown({ ...showDifficultyDropdown, [recipe.id]: false });
                                    }}
                                  >
                                    {option}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label>Ingredients</Label>
                          <div className="space-y-2 mt-1">
                            {editData.ingredients.map((ingredient, index) => (
                              <div key={index} className="flex gap-2">
                                <div className="relative flex-1">
                                  <Input
                                    type="text"
                                    placeholder="Ingredient name"
                                    value={ingredientInputs[`${recipe.id}-${index}`] || ''}
                                    onChange={(e) => handleIngredientNameChange(recipe.id, index, e.target.value)}
                                    onFocus={() => setShowIngredientDropdowns({ ...showIngredientDropdowns, [`${recipe.id}-${index}`]: true })}
                                    onBlur={() => setTimeout(() => setShowIngredientDropdowns({ ...showIngredientDropdowns, [`${recipe.id}-${index}`]: false }), 200)}
                                  />
                                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                  {showIngredientDropdowns[`${recipe.id}-${index}`] && (
                                    <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                                      {availableIngredients
                                        .filter(ing => !ingredientInputs[`${recipe.id}-${index}`] || ing.name.toLowerCase().includes(ingredientInputs[`${recipe.id}-${index}`].toLowerCase()))
                                        .map((ing) => (
                                          <div
                                            key={ing.id}
                                            className="px-4 py-2 hover:bg-accent cursor-pointer"
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              handleIngredientSelect(recipe.id, index, ing.name);
                                            }}
                                          >
                                            {ing.name}
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                                <Input
                                  type="text"
                                  placeholder="Measure"
                                  value={ingredient.measure}
                                  onChange={(e) => handleIngredientMeasureChange(index, e.target.value)}
                                  className="w-40"
                                />
                                {editData.ingredients.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => removeIngredientField(recipe.id, index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addIngredientField(recipe.id)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Ingredient
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label>Recipe Instructions</Label>
                          <textarea
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                            value={editData.recipe}
                            onChange={(e) => setEditData({ ...editData, recipe: e.target.value })}
                            placeholder="Enter recipe instructions..."
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">{recipe.Recipe}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {recipe.Ingredients.slice(0, 5).map((ingredient, index) => {
                            const name = typeof ingredient === 'string' 
                              ? ingredient.split(/[-:]/)[0].trim()
                              : ingredient.name.trim();
                            const measure = typeof ingredient === 'string'
                              ? (ingredient.includes(':') || ingredient.includes('-') 
                                  ? ingredient.split(/[-:]/).slice(1).join(' ').trim()
                                  : '')
                              : ingredient.measure.trim();
                            return (
                              <Badge key={index} variant="outline" className="text-xs">
                                {name} {measure && `- ${measure}`}
                              </Badge>
                            );
                          })}
                          {recipe.Ingredients.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{recipe.Ingredients.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageRecipes;

