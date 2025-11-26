# SMART PANTRY

## Introduction

Smart Pantry is an intelligent web-based application designed to support cooking 
enthusiasts by simplifying the process of finding the perfect recipe based on the ingredients 
they already have. The platform functions as a virtual cooking assistant hosted by a chef or 
culinary expert, making it valuable not only for hobbyists but also for beginners who want 
guided and stress-free recipe exploration. 

## Architecture Diagram

<img width="725" height="654" alt="Architecture diagram" src="https://github.com/user-attachments/assets/2ce9218e-43f7-4e05-b75c-39cc0be877c4" />

## Functionalities

### Admin (Chef/Culinary Expert)

#### Ingredients

- Create: Add new ingredients (name, category, image).
- Read: View all stored ingredients.
- Update: Edit ingredient name, category, and image.
- Delete: Remove ingredients from the database.

#### Recipes

- Create: Add new recipes (name, time, difficulty, ingredients, instructions, servings, image).
- Read: View all saved recipes.
- Update: Edit recipe details such as name, time, ingredients list, quantity, difficulty, image, and instructions.
- Delete: Remove any recipe from the database.

### User

#### My Pantry

- Create: Add ingredients to their personal pantry from the browse page.
- Read: View all selected ingredients organized by category.
- Update: Modify or reselect ingredients as needed.
- Delete: Remove ingredients from their pantry if not required.

#### Recipe Suggestions

Read Only:
- View recipe suggestions based on pantry ingredients.
- Filter recipes by difficulty level, cooking time, or search by name.
- Access the full recipe details (steps, ingredients, image, serving size).
