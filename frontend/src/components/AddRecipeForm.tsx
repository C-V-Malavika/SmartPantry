import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { firestoreService } from '@/services/firestore';
import { Upload, Loader2, Plus, X, ChevronDown } from 'lucide-react';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface AvailableIngredient {
  id: string;
  name: string;
}

const AddRecipeForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cookingTime: '',
    difficulty: '',
    image: null as File | null,
    ingredients: [{ name: '', measure: '' }] as Array<{ name: string; measure: string }>,
    recipe: '',
    servings: 1,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [availableIngredients, setAvailableIngredients] = useState<AvailableIngredient[]>([]);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(true);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [showIngredientDropdowns, setShowIngredientDropdowns] = useState<boolean[]>([]);
  const [ingredientInputs, setIngredientInputs] = useState<string[]>(['']);

  const difficultyOptions = ['Easy', 'Medium', 'Hard'];

  // Fetch available ingredients from Firestore
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const ingredientsCollection = collection(db, 'Ingredients');
        const ingredientsSnapshot = await getDocs(ingredientsCollection);
        
        const ingredientsList: AvailableIngredient[] = [];
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
        
        // Sort alphabetically by name
        ingredientsList.sort((a, b) => a.name.localeCompare(b.name));
        setAvailableIngredients(ingredientsList);
        // Initialize dropdown states and inputs if not already set
        if (showIngredientDropdowns.length !== formData.ingredients.length) {
          setShowIngredientDropdowns(new Array(formData.ingredients.length).fill(false));
        }
        if (ingredientInputs.length !== formData.ingredients.length) {
          setIngredientInputs(formData.ingredients.map(ing => ing.name));
        }
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        toast({
          title: 'Error',
          description: 'Failed to load available ingredients',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingIngredients(false);
      }
    };

    fetchIngredients();
  }, [toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIngredientNameChange = (index: number, name: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], name };
    setFormData({ ...formData, ingredients: newIngredients });
    
    // Update input value
    const newInputs = [...ingredientInputs];
    newInputs[index] = name;
    setIngredientInputs(newInputs);
    
    // Show dropdown when typing
    const newDropdownStates = [...showIngredientDropdowns];
    newDropdownStates[index] = true;
    setShowIngredientDropdowns(newDropdownStates);
  };

  const handleIngredientSelect = (index: number, name: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], name };
    setFormData({ ...formData, ingredients: newIngredients });
    
    // Update input value
    const newInputs = [...ingredientInputs];
    newInputs[index] = name;
    setIngredientInputs(newInputs);
    
    // Close dropdown after selection
    const newDropdownStates = [...showIngredientDropdowns];
    newDropdownStates[index] = false;
    setShowIngredientDropdowns(newDropdownStates);
  };

  const handleIngredientMeasureChange = (index: number, measure: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], measure };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const addIngredientField = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: '', measure: '' }],
    });
    setShowIngredientDropdowns([...showIngredientDropdowns, false]);
    setIngredientInputs([...ingredientInputs, '']);
  };

  const removeIngredientField = (index: number) => {
    if (formData.ingredients.length > 1) {
      const newIngredients = formData.ingredients.filter((_, i) => i !== index);
      const newDropdownStates = showIngredientDropdowns.filter((_, i) => i !== index);
      const newInputs = ingredientInputs.filter((_, i) => i !== index);
      setFormData({ ...formData, ingredients: newIngredients });
      setShowIngredientDropdowns(newDropdownStates);
      setIngredientInputs(newInputs);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter a recipe name',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.cookingTime.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter cooking time',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.difficulty.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter difficulty level',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.image) {
      toast({
        title: 'Validation error',
        description: 'Please select an image',
        variant: 'destructive',
      });
      return;
    }

    const validIngredients = formData.ingredients.filter(ing => ing.name.trim() !== '');
    if (validIngredients.length === 0) {
      toast({
        title: 'Validation error',
        description: 'Please add at least one ingredient',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.recipe.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter recipe instructions',
        variant: 'destructive',
      });
      return;
    }

    if (formData.servings < 1) {
      toast({
        title: 'Validation error',
        description: 'Servings must be at least 1',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if recipe already exists
      const exists = await firestoreService.recipeExists(formData.name);
      if (exists) {
        toast({
          title: 'Recipe already exists',
          description: `A recipe named "${formData.name}" already exists in the database`,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Upload image
      const uploadResult = await apiService.uploadImage(formData.image, 'food', formData.name);
      
      // Add to Firestore
      await firestoreService.addRecipe({
        Name: formData.name.trim(),
        'Cooking Time': formData.cookingTime.trim(),
        Difficulty: formData.difficulty.trim(),
        Image: uploadResult.path,
        Ingredients: validIngredients.map(ing => ({
          name: ing.name.trim(),
          measure: ing.measure.trim() || '',
        })),
        Recipe: formData.recipe.trim(),
        Servings: formData.servings,
      });

      toast({
        title: 'Success!',
        description: `Recipe "${formData.name}" has been added to the database`,
      });

      // Reset form
      setFormData({
        name: '',
        cookingTime: '',
        difficulty: '',
        image: null,
        ingredients: [{ name: '', measure: '' }],
        recipe: '',
        servings: 1,
      });
      setIngredientInputs(['']);
      setImagePreview(null);
      const fileInput = document.getElementById('recipe-image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add recipe',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Recipe</CardTitle>
        <CardDescription>
          Add a new recipe to the database with all required information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipe-name">Recipe Name *</Label>
            <Input
              id="recipe-name"
              type="text"
              placeholder="e.g., Plain Dosa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cooking-time">Cooking Time *</Label>
              <Input
                id="cooking-time"
                type="text"
                placeholder="e.g., 30 minutes"
                value={formData.cookingTime}
                onChange={(e) => setFormData({ ...formData, cookingTime: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <div className="relative">
                <Input
                  id="difficulty"
                  type="text"
                  placeholder="Select difficulty level"
                  value={formData.difficulty}
                  readOnly
                  onClick={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
                  onFocus={() => setShowDifficultyDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDifficultyDropdown(false), 200)}
                  required
                  disabled={isLoading}
                  className="cursor-pointer"
                />
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                {showDifficultyDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {difficultyOptions.map((option) => (
                      <div
                        key={option}
                        className={`px-4 py-2 hover:bg-accent cursor-pointer transition-colors ${
                          formData.difficulty === option ? 'bg-accent font-medium' : ''
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData({ ...formData, difficulty: option });
                          setShowDifficultyDropdown(false);
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipe-image">Image *</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  id="recipe-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                  disabled={isLoading}
                  className="cursor-pointer"
                />
              </div>
              {imagePreview && (
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Image will be saved to assets/food folder
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ingredients *</Label>
            {isLoadingIngredients ? (
              <div className="text-sm text-muted-foreground">Loading available ingredients...</div>
            ) : availableIngredients.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No ingredients available. Please add ingredients first.
              </div>
            ) : (
              <>
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        placeholder={`Type to search ingredient ${index + 1}`}
                        value={ingredientInputs[index] || ''}
                        onChange={(e) => handleIngredientNameChange(index, e.target.value)}
                        onFocus={() => {
                          const newStates = [...showIngredientDropdowns];
                          newStates[index] = true;
                          setShowIngredientDropdowns(newStates);
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            const newStates = [...showIngredientDropdowns];
                            newStates[index] = false;
                            setShowIngredientDropdowns(newStates);
                          }, 200);
                        }}
                        disabled={isLoading}
                        className="cursor-text"
                      />
                      <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      {showIngredientDropdowns[index] && (
                        <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                          {availableIngredients
                            .filter(ing => 
                              !ingredientInputs[index] || 
                              ing.name.toLowerCase().includes(ingredientInputs[index].toLowerCase())
                            )
                            .map((ing) => (
                              <div
                                key={ing.id}
                                className={`px-4 py-2 hover:bg-accent cursor-pointer transition-colors ${
                                  ingredient.name === ing.name ? 'bg-accent font-medium' : ''
                                }`}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleIngredientSelect(index, ing.name);
                                }}
                              >
                                {ing.name}
                              </div>
                            ))}
                          {availableIngredients.filter(ing => 
                            !ingredientInputs[index] || 
                            ing.name.toLowerCase().includes(ingredientInputs[index].toLowerCase())
                          ).length === 0 && ingredientInputs[index] && (
                            <div className="px-4 py-2 text-sm text-muted-foreground">
                              No ingredients found matching "{ingredientInputs[index]}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="w-40">
                      <Input
                        type="text"
                        placeholder="Measure (e.g., 1 cup)"
                        value={ingredient.measure}
                        onChange={(e) => handleIngredientMeasureChange(index, e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    {formData.ingredients.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeIngredientField(index)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addIngredientField}
                  disabled={isLoading || availableIngredients.length === 0}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Ingredient
                </Button>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipe-instructions">Recipe Instructions *</Label>
            <textarea
              id="recipe-instructions"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter step-by-step recipe instructions..."
              value={formData.recipe}
              onChange={(e) => setFormData({ ...formData, recipe: e.target.value })}
              required
              disabled={isLoading}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="servings">Servings *</Label>
            <Input
              id="servings"
              type="number"
              min="1"
              value={formData.servings}
              onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.select()}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                const v = parseInt(e.currentTarget.value || '0', 10);
                if (isNaN(v) || v < 1) {
                  setFormData({ ...formData, servings: 1 });
                }
              }}
              onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 1 })}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Recipe...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Add Recipe
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddRecipeForm;

