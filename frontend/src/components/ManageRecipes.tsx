import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, Users, ChefHat, Star, Filter, Search } from 'lucide-react';
import { firestoreService, IngredientWithMeasure } from '@/services/firestore';
import { apiService } from '@/services/api';
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
  const [editName, setEditName] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editCookingTime, setEditCookingTime] = useState('');
  const [editServings, setEditServings] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableIngredients, setAvailableIngredients] = useState<Array<{ id: string; name: string }>>([]);
  const [showIngredientDropdowns, setShowIngredientDropdowns] = useState<{ [key: string]: boolean }>({});
  const [ingredientInputs, setIngredientInputs] = useState<{ [key: string]: string }>({});
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState<{ [key: string]: boolean }>({});

  const difficultyOptions = ['Easy', 'Medium', 'Hard'];

  const resolveImageSrc = (path: string | undefined | null) => {
    if (!path) return null;
    const trimmed = path.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    return `/${trimmed}`;
  };

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
    setEditName(recipe.Name);
    setEditImageFile(null);
    setEditImagePreview(recipe.Image ? (recipe.Image.startsWith('http') ? recipe.Image : `/${recipe.Image}`) : null);
    setEditCookingTime(recipe['Cooking Time'] || '');
    setEditServings(recipe.Servings || 1);
    
    // Initialize inputs
    const inputs: { [key: string]: string } = {};
    ingredients.forEach((ing, idx) => {
      inputs[`${recipe.id}-${idx}`] = ing.name;
    });
    setIngredientInputs(inputs);
  };

  const handleSave = async (id: string) => {
    if (!editData) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast({ title: 'Not authenticated', description: 'Please sign in to perform this action', variant: 'destructive' });
      return;
    }

    try {
      const recipe = recipes.find(r => r.id === id);
      if (!recipe) return;

      if (!editName.trim()) {
        toast({ title: 'Validation error', description: 'Please enter a recipe name', variant: 'destructive' });
        return;
      }

      if (!editCookingTime.trim()) {
        toast({ title: 'Validation error', description: 'Please enter cooking time', variant: 'destructive' });
        return;
      }

      if (!editServings || editServings < 1) {
        toast({ title: 'Validation error', description: 'Servings must be at least 1', variant: 'destructive' });
        return;
      }

      // handle image upload if changed
      let imagePath = recipe.Image;
      if (editImageFile) {
        const uploadResult = await apiService.uploadImage(editImageFile, 'food', editName || recipe.Name);
        imagePath = uploadResult.path;
      }

      await firestoreService.updateRecipe(id, {
        Name: editName.trim(),
        'Cooking Time': editCookingTime.trim(),
        Difficulty: editData.difficulty,
        Image: imagePath,
        Ingredients: editData.ingredients.filter(ing => ing.name.trim() !== ''),
        Recipe: editData.recipe,
        Servings: editServings,
      });

      toast({
        title: 'Success',
        description: 'Recipe updated successfully',
      });

      setEditingId(null);
      setEditData(null);
      setEditName('');
      setEditImageFile(null);
      setEditImagePreview(null);
      setEditCookingTime('');
      setEditServings(1);
      fetchRecipes();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update recipe',
        variant: 'destructive',
      });
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file type', description: 'Please select an image file', variant: 'destructive' });
        return;
      }
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditImagePreview(reader.result as string);
      reader.readAsDataURL(file);
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
          View, edit, or delete recipes!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search recipes by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border rounded-md px-3 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {recipes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recipes found. Add some recipes to get started.
          </div>
        ) : (
          <div className="space-y-6">
            {recipes
              .filter(recipe => recipe.Name.toLowerCase().includes(searchTerm?.toLowerCase?.() || ''))
              .map((recipe) => (
              <div
                key={recipe.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {resolveImageSrc(recipe.Image) && (
                    <img
                      src={resolveImageSrc(recipe.Image) || ''}
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
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {recipe['Cooking Time']}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {recipe.Servings} servings
                          </div>
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
                        <div className="space-y-2">
                          <Label>Recipe Name</Label>
                          <Input
                            type="text"
                            placeholder="Recipe name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-1/2"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Image</Label>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <label htmlFor={`edit-recipe-image-${recipe.id}`} className="inline-block">
                                  <span className="bg-primary text-white px-4 py-2 rounded-md cursor-pointer hover:bg-primary/90 transition-colors inline-flex items-center">
                                    Choose Image
                                  </span>
                                  <input
                                    id={`edit-recipe-image-${recipe.id}`}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleEditImageChange}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                              {editImagePreview && (
                                <div className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                                  <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Cooking Time</Label>
                            <Input
                              type="text"
                              placeholder="e.g., 30 minutes"
                              value={editCookingTime}
                              onChange={(e) => setEditCookingTime(e.target.value)}
                            />
                            <Label>Servings</Label>
                            <Input
                              type="number"
                              min={1}
                              value={String(editServings)}
                              onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.select()}
                              onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                const v = parseInt(e.currentTarget.value || '0', 10);
                                if (isNaN(v) || v < 1) setEditServings(1);
                              }}
                              onChange={(e) => setEditServings(parseInt(e.target.value || '1', 10))}
                            />
                          </div>
                        </div>
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

