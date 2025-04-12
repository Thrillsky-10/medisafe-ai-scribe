
import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileX, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="mb-6 flex justify-center">
          <div className="bg-primary/10 rounded-full p-4">
            <FileX className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-2 text-secondary">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Link to="/">
          <Button>
            <Home className="mr-2 h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </Link>
      </div>
      <div className="mt-12 text-sm text-muted-foreground">
        <p>
          If you believe this is an error, please contact system administrator.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
