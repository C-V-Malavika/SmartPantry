import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-ingredients.jpg";
import { Sparkles, ChefHat, ShoppingBasket } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <Navbar />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Turn Your{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Ingredients
                </span>{" "}
                Into Delicious Meals
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                SmartPantry suggests personalized recipes based on the ingredients you have. 
                No more wasting food or wondering what to cook!
              </p>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg"
                  onClick={() => navigate("/auth?mode=signup")}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-soft text-lg px-8"
                >
                  Get Started
                </Button>
                <Button 
                  size="lg"
                  onClick={() => navigate("/auth?mode=login")}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-soft text-lg px-8"
                >
                  Login
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl" />
              <img 
                src={heroImage} 
                alt="Fresh cooking ingredients arranged beautifully"
                className="relative rounded-3xl shadow-2xl w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl p-8 shadow-soft border border-border/50 hover:shadow-glow transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                <ShoppingBasket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Select Ingredients</h3>
              <p className="text-muted-foreground">
                Simply pick what you have in your pantry, and we'll do the rest.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-soft border border-border/50 hover:shadow-glow transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered Suggestions</h3>
              <p className="text-muted-foreground">
                Get personalized recipe recommendations tailored to your ingredients.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-soft border border-border/50 hover:shadow-glow transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Start Cooking</h3>
              <p className="text-muted-foreground">
                Follow step-by-step instructions and create amazing dishes.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
