import { db } from '@/firebase';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';

export interface Ingredient {
  Name: string;
  Category: string;
  Image: string;
}

export interface IngredientWithMeasure {
  name: string;
  measure: string;
}

export interface Recipe {
  Name: string;
  'Cooking Time': string;
  Difficulty: string;
  Image: string;
  Ingredients: IngredientWithMeasure[];
  Recipe: string;
  Servings: number;
}

export const firestoreService = {
  // Add ingredient to Firestore
  async addIngredient(ingredient: Ingredient): Promise<void> {
    try {
      console.log('Attempting to add ingredient:', ingredient);
      const docRef = await addDoc(collection(db, 'Ingredients'), {
        Name: ingredient.Name,
        Category: ingredient.Category,
        Image: ingredient.Image,
      });
      console.log('Ingredient added successfully with ID:', docRef.id);
    } catch (error: any) {
      console.error('Error adding ingredient:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to add ingredient to database';
      if (error?.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firestore security rules.';
      } else if (error?.code === 'unavailable') {
        errorMessage = 'Firestore is unavailable. Please check your internet connection.';
      } else if (error?.message) {
        errorMessage = `Failed to add ingredient: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  },

  // Add recipe to Firestore
  async addRecipe(recipe: Recipe): Promise<void> {
    try {
      await addDoc(collection(db, 'Food'), {
        Name: recipe.Name,
        'Cooking Time': recipe['Cooking Time'],
        Difficulty: recipe.Difficulty,
        Image: recipe.Image,
        Ingredients: recipe.Ingredients,
        Recipe: recipe.Recipe,
        Servings: recipe.Servings,
      });
    } catch (error) {
      console.error('Error adding recipe:', error);
      throw new Error('Failed to add recipe to database');
    }
  },

  // Check if ingredient name already exists
  async ingredientExists(name: string): Promise<boolean> {
    try {
      const q = query(collection(db, 'Ingredients'), where('Name', '==', name));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking ingredient:', error);
      return false;
    }
  },

  // Check if recipe name already exists
  async recipeExists(name: string): Promise<boolean> {
    try {
      const q = query(collection(db, 'Food'), where('Name', '==', name));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking recipe:', error);
      return false;
    }
  },

  // Delete ingredient
  async deleteIngredient(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'Ingredients', id));
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      throw new Error('Failed to delete ingredient');
    }
  },

  // Delete recipe
  async deleteRecipe(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'Food', id));
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw new Error('Failed to delete recipe');
    }
  },

  // Update ingredient
  async updateIngredient(id: string, updates: Partial<Ingredient>): Promise<void> {
    try {
      const ingredientRef = doc(db, 'Ingredients', id);
      await updateDoc(ingredientRef, {
        Name: updates.Name,
        Category: updates.Category,
        Image: updates.Image,
      });
    } catch (error) {
      console.error('Error updating ingredient:', error);
      throw new Error('Failed to update ingredient');
    }
  },

  // Update recipe
  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<void> {
    try {
      const recipeRef = doc(db, 'Food', id);
      await updateDoc(recipeRef, {
        Name: updates.Name,
        'Cooking Time': updates['Cooking Time'],
        Difficulty: updates.Difficulty,
        Image: updates.Image,
        Ingredients: updates.Ingredients,
        Recipe: updates.Recipe,
        Servings: updates.Servings,
      });
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw new Error('Failed to update recipe');
    }
  },

  // Get ingredient by ID
  async getIngredient(id: string): Promise<Ingredient & { id: string }> {
    try {
      const ingredientRef = doc(db, 'Ingredients', id);
      const ingredientSnap = await getDoc(ingredientRef);
      if (!ingredientSnap.exists()) {
        throw new Error('Ingredient not found');
      }
      return {
        id: ingredientSnap.id,
        Name: ingredientSnap.data().Name,
        Category: ingredientSnap.data().Category,
        Image: ingredientSnap.data().Image,
      };
    } catch (error) {
      console.error('Error getting ingredient:', error);
      throw new Error('Failed to get ingredient');
    }
  },

  // Get recipe by ID
  async getRecipe(id: string): Promise<Recipe & { id: string }> {
    try {
      const recipeRef = doc(db, 'Food', id);
      const recipeSnap = await getDoc(recipeRef);
      if (!recipeSnap.exists()) {
        throw new Error('Recipe not found');
      }
      const data = recipeSnap.data();
      return {
        id: recipeSnap.id,
        Name: data.Name,
        'Cooking Time': data['Cooking Time'],
        Difficulty: data.Difficulty,
        Image: data.Image,
        Ingredients: data.Ingredients,
        Recipe: data.Recipe,
        Servings: data.Servings,
      };
    } catch (error) {
      console.error('Error getting recipe:', error);
      throw new Error('Failed to get recipe');
    }
  },
};

