import { useAuth0 } from '@auth0/auth0-react';
import { User, LogOut } from 'lucide-react';

export function UserMenu() {
  const { user, logout } = useAuth0();

  if (!user) return null;

  return (
    <div className="absolute top-4 right-4 flex items-center gap-3 bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20">
      <div className="flex items-center gap-2">
        {user.picture ? (
          <img 
            src={user.picture} 
            alt={user.name || 'User'} 
            className="w-8 h-8 rounded-full border-2 border-white/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
        <span className="text-white text-sm">{user.name || user.email}</span>
      </div>
      
      <button
        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        className="text-white/70 hover:text-white transition-colors"
        title="Log out"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
