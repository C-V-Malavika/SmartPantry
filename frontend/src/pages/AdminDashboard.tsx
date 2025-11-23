import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { Shield, Package, ChefHat, ArrowLeft, Plus, List } from 'lucide-react';
import AddIngredientForm from '@/components/AddIngredientForm';
import AddRecipeForm from '@/components/AddRecipeForm';
import ManageIngredients from '@/components/ManageIngredients';
import ManageRecipes from '@/components/ManageRecipes';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">
                Admin <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Dashboard</span>
              </h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Manage ingredients and recipes in the database
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleBackToDashboard} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {/* Welcome Card */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Welcome, {user?.name}!
            </CardTitle>
            <CardDescription>
              You have administrative access to manage the SmartPantry database.
              Add new ingredients and recipes that will be available to all users.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="ingredients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ingredients" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Manage Ingredients
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Manage Recipes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingredients" className="space-y-6">
            <Tabs defaultValue="add" className="space-y-4">
              <TabsList>
                <TabsTrigger value="add" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Ingredient
                </TabsTrigger>
                <TabsTrigger value="manage" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Manage Ingredients
                </TabsTrigger>
              </TabsList>
              <TabsContent value="add">
                <AddIngredientForm />
              </TabsContent>
              <TabsContent value="manage">
                <ManageIngredients />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="recipes" className="space-y-6">
            <Tabs defaultValue="add" className="space-y-4">
              <TabsList>
                <TabsTrigger value="add" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Recipe
                </TabsTrigger>
                <TabsTrigger value="manage" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Manage Recipes
                </TabsTrigger>
              </TabsList>
              <TabsContent value="add">
                <AddRecipeForm />
              </TabsContent>
              <TabsContent value="manage">
                <ManageRecipes />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

