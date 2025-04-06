import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Users } from "lucide-react";

export default function AdminNavbar() {
  const [location] = useLocation();

  return (
    <div className="bg-secondary py-4 border-b">
      <div className="container flex justify-between items-center">
        <div className="text-xl font-bold">Waitlist App</div>
        <div className="flex gap-4">
          <Button 
            variant={location === "/" ? "default" : "outline"} 
            asChild
            size="sm"
          >
            <Link href="/" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
          </Button>
          <Button 
            variant={location === "/admin" ? "default" : "outline"} 
            asChild
            size="sm"
          >
            <Link href="/admin" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}