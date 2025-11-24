import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { firestoreService } from '@/services/firestore';
import { apiService } from '@/services/api';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Edit, Trash2, X, Save } from 'lucide-react';

interface IngredientItem {
  id: string;
  Name: string;
  Category: string;
  Image: string;
}

const ManageIngredients = () => {
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editName, setEditName] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchIngredients();
    fetchCategories();
  }, []);

  const fetchIngredients = async () => {
    try {
      const ingredientsCollection = collection(db, 'Ingredients');
      const ingredientsSnapshot = await getDocs(ingredientsCollection);
      
      const ingredientsList = ingredientsSnapshot.docs.map(doc => ({
        id: doc.id,
        Name: doc.data().Name || '',
        Category: doc.data().Category || '',
        Image: doc.data().Image || '',
      }));
      
      setIngredients(ingredientsList);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ingredients',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const ingredientsCollection = collection(db, 'Ingredients');
      const ingredientsSnapshot = await getDocs(ingredientsCollection);
      
      const uniqueCategories = new Set<string>();
      ingredientsSnapshot.forEach(doc => {
        const category = doc.data()?.Category || doc.data()?.category;
        if (typeof category === 'string' && category.trim().length > 0) {
          uniqueCategories.add(category.trim());
        }
      });
      
      setCategories(Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b)));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await firestoreService.deleteIngredient(id);
      toast({
        title: 'Success',
        description: `Ingredient "${name}" has been deleted`,
      });
      fetchIngredients();
      fetchCategories();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete ingredient',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (ingredient: IngredientItem) => {
    setEditingId(ingredient.id);
    setEditCategory(ingredient.Category);
    setEditName(ingredient.Name);
    setEditImageFile(null);
    setEditImagePreview(ingredient.Image ? `/${ingredient.Image}` : null);
  };

  const handleSave = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast({ title: 'Not authenticated', description: 'Please sign in to perform this action', variant: 'destructive' });
      return;
    }

    try {
      const ingredient = ingredients.find(ing => ing.id === id);
      if (!ingredient) return;

      if (!editName.trim()) {
        toast({ title: 'Validation error', description: 'Please enter a name', variant: 'destructive' });
        return;
      }

      if (!editCategory.trim()) {
        toast({ title: 'Validation error', description: 'Please enter a category', variant: 'destructive' });
        return;
      }

      let imagePath = ingredient.Image;
      if (editImageFile) {
        const uploadResult = await apiService.uploadImage(editImageFile, 'ingredients', editName || ingredient.Name);
        imagePath = uploadResult.path;
      }

      await firestoreService.updateIngredient(id, {
        Name: editName.trim(),
        Category: editCategory.trim(),
        Image: imagePath,
      });

      toast({
        title: 'Success',
        description: 'Ingredient updated successfully',
      });

      setEditingId(null);
      setEditCategory('');
      setEditName('');
      setEditImageFile(null);
      setEditImagePreview(null);
      setShowCategoryDropdown({});
      fetchIngredients();
      fetchCategories();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update ingredient',
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
    setEditCategory('');
  };

  if (loading) {
    return <div className="text-center py-8">Loading ingredients...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Ingredients</CardTitle>
        <CardDescription>
          View, edit, or delete ingredients in the database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search ingredients by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border rounded-md px-3 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {ingredients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No ingredients found. Add some ingredients to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {ingredients
              .filter(ingredient => ingredient.Name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((ingredient) => (
              <div
                key={ingredient.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {ingredient.Image && (
                    <img
                      src={`/${ingredient.Image}`}
                      alt={ingredient.Name}
                      className="w-12 h-12 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{ingredient.Name}</h4>
                    {editingId === ingredient.id ? (
                      <div className="mt-2 space-y-2">
                        <Input
                          type="text"
                          placeholder="Ingredient name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-56"
                        />

                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="Category"
                            value={editCategory}
                            onChange={(e) => {
                              setEditCategory(e.target.value);
                              setShowCategoryDropdown({ ...showCategoryDropdown, [ingredient.id]: true });
                            }}
                            onFocus={() => setShowCategoryDropdown({ ...showCategoryDropdown, [ingredient.id]: true })}
                            onBlur={() => setTimeout(() => setShowCategoryDropdown({ ...showCategoryDropdown, [ingredient.id]: false }), 200)}
                            className="w-48"
                          />
                          {showCategoryDropdown[ingredient.id] && (
                            <div className="absolute z-10 w-48 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                              {categories
                                .filter(cat => !editCategory || cat.toLowerCase().includes(editCategory.toLowerCase()))
                                .map((cat) => (
                                  <div
                                    key={cat}
                                    className="px-4 py-2 hover:bg-accent cursor-pointer"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setEditCategory(cat);
                                      setShowCategoryDropdown({ ...showCategoryDropdown, [ingredient.id]: false });
                                    }}
                                  >
                                    {cat}
                                  </div>
                                ))}
                              {editCategory && !categories.some(cat => cat.toLowerCase() === editCategory.toLowerCase().trim()) && (
                                <div
                                  className="px-4 py-2 hover:bg-accent cursor-pointer border-t border-border font-medium text-primary"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setEditCategory(editCategory.trim());
                                    setShowCategoryDropdown({ ...showCategoryDropdown, [ingredient.id]: false });
                                  }}
                                >
                                  + Add new category: "{editCategory.trim()}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label htmlFor={`edit-image-${ingredient.id}`} className="inline-block">
                              <span className="bg-primary text-white px-4 py-2 rounded-md cursor-pointer hover:bg-primary/90 transition-colors inline-flex items-center">
                                Choose Image
                              </span>
                              <input
                                id={`edit-image-${ingredient.id}`}
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
                    ) : (
                      <Badge variant="secondary" className="mt-1">
                        {ingredient.Category}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingId === ingredient.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSave(ingredient.id)}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(ingredient)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(ingredient.id, ingredient.Name)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageIngredients;

