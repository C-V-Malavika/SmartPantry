import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { firestoreService } from '@/services/firestore';
import { Upload, Loader2, ChevronDown, AlertCircle } from 'lucide-react';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { testFirestore } from '@/utils/testFirestore';

const AddIngredientForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    image: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [firestoreTested, setFirestoreTested] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Test Firestore connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const result = await testFirestore();
      setFirestoreTested(true);
      if (!result.write) {
        setFirestoreError(result.error || 'Firestore write test failed');
      }
    };
    testConnection();
  }, []);

  // Fetch existing categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const ingredientsCollection = collection(db, 'Ingredients');
        const ingredientsSnapshot = await getDocs(ingredientsCollection);
        
        const uniqueCategories = new Set<string>();
        ingredientsSnapshot.forEach(doc => {
          const data = doc.data();
          const category = data?.Category || data?.category;
          if (typeof category === 'string' && category.trim().length > 0) {
            uniqueCategories.add(category.trim());
          }
        });
        
        const sortedCategories = Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b));
        setCategories(sortedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Update category input when formData.category changes
  useEffect(() => {
    setCategoryInput(formData.category);
  }, [formData.category]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter an ingredient name',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.category.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter a category',
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

    setIsLoading(true);

    try {
      // Check if ingredient already exists
      const exists = await firestoreService.ingredientExists(formData.name);
      if (exists) {
        toast({
          title: 'Ingredient already exists',
          description: `An ingredient named "${formData.name}" already exists in the database`,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Upload image
      const uploadResult = await apiService.uploadImage(formData.image, 'ingredients', formData.name);
      
      // Add to Firestore
      await firestoreService.addIngredient({
        Name: formData.name.trim(),
        Category: formData.category.trim(),
        Image: uploadResult.path,
      });

      toast({
        title: 'Success!',
        description: `Ingredient "${formData.name}" has been added to the database`,
      });

      // Add new category to list if it doesn't exist
      const newCategory = formData.category.trim();
      if (newCategory && !categories.includes(newCategory)) {
        setCategories([...categories, newCategory].sort((a, b) => a.localeCompare(b)));
      }

      // Reset form
      setFormData({
        name: '',
        category: '',
        image: null,
      });
      setCategoryInput('');
      setImagePreview(null);
      const fileInput = document.getElementById('ingredient-image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Full error object:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add ingredient';
      console.error('Error message:', errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Ingredient</CardTitle>
        <CardDescription>
          Add a new ingredient to the database with name, category, and image
        </CardDescription>
      </CardHeader>
      <CardContent>
        {firestoreError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Firestore Error</span>
            </div>
            <p className="text-sm mt-1">{firestoreError}</p>
            <p className="text-xs mt-2 text-muted-foreground">
              Please check your Firestore security rules. They should allow writes to the 'Ingredients' collection.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ingredient-name">Ingredient Name *</Label>
            <Input
              id="ingredient-name"
              type="text"
              placeholder="e.g., Asafoetida"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredient-category">Category *</Label>
            <div className="relative">
              <Input
                id="ingredient-category"
                type="text"
                placeholder="e.g., Spice (type to search or add new)"
                value={categoryInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setCategoryInput(value);
                  setFormData({ ...formData, category: value });
                  setShowCategoryDropdown(true);
                }}
                onFocus={() => setShowCategoryDropdown(true)}
                onBlur={() => {
                  // Delay to allow click on dropdown item
                  setTimeout(() => setShowCategoryDropdown(false), 200);
                }}
                required
                disabled={isLoading || isLoadingCategories}
              />
              {showCategoryDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {categories.length > 0 ? (
                    <>
                      {categories
                        .filter(cat => 
                          !categoryInput || cat.toLowerCase().includes(categoryInput.toLowerCase())
                        )
                        .map((cat) => (
                          <div
                            key={cat}
                            className="px-4 py-2 hover:bg-accent cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setCategoryInput(cat);
                              setFormData({ ...formData, category: cat });
                              setShowCategoryDropdown(false);
                            }}
                          >
                            {cat}
                          </div>
                        ))}
                      {categoryInput && !categories.some(cat => cat.toLowerCase() === categoryInput.toLowerCase().trim()) && (
                        <div
                          className="px-4 py-2 hover:bg-accent cursor-pointer border-t border-border font-medium text-primary"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const newCat = categoryInput.trim();
                            setCategoryInput(newCat);
                            setFormData({ ...formData, category: newCat });
                            setShowCategoryDropdown(false);
                          }}
                        >
                          + Add new category: "{categoryInput.trim()}"
                        </div>
                      )}
                    </>
                  ) : (
                    categoryInput && (
                      <div
                        className="px-4 py-2 hover:bg-accent cursor-pointer font-medium text-primary"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const newCat = categoryInput.trim();
                          setCategoryInput(newCat);
                          setFormData({ ...formData, category: newCat });
                          setShowCategoryDropdown(false);
                        }}
                      >
                        + Add new category: "{categoryInput.trim()}"
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {categories.length > 0 
                ? `Select from ${categories.length} existing categories or type to add a new one`
                : 'Type to create a new category'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredient-image">Image *</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  id="ingredient-image"
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
              Image will be saved to assets/ingredients folder
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Ingredient...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Add Ingredient
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddIngredientForm;

