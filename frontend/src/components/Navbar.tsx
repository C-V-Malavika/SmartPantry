import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ChefHat } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
          onClick={() => navigate("/")}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-soft">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            SmartPantry
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/auth?mode=login")}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-soft"
          >
            Login
          </Button>
          <Button 
            onClick={() => navigate("/auth?mode=signup")}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-soft"
          >
            Sign Up
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
