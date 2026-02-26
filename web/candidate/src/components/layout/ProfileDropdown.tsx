import { Link } from "react-router-dom";
import { User, Shield, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { currentUser } from "@/lib/mock-data";

export function ProfileDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center focus-ring">
          {currentUser.avatar}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-3 py-2">
          <p className="text-sm font-medium">{currentUser.name}</p>
          <p className="text-xs text-muted-foreground">{currentUser.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/privacy" className="flex items-center gap-2 cursor-pointer">
            <Shield className="h-4 w-4" /> Data & Privacy
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/login" className="flex items-center gap-2 cursor-pointer text-destructive">
            <LogOut className="h-4 w-4" /> Logout
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
