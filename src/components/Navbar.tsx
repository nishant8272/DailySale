import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊', roles: ['owner', 'worker'] },
    { name: 'Shift', path: '/shift', icon: '🏪', roles: ['owner', 'worker'] },
    { name: 'Products', path: '/products', icon: '📦', roles: ['owner'] },
    { name: 'Daily Sheet', path: '/daily-sheet', icon: '📝', roles: ['owner'] },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <span className="font-bold text-xl tracking-tight">DailySales</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            // Only show link if user role is allowed
            link.roles.includes(user?.role || '') && (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  location.pathname === link.path ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                <span>{link.icon}</span>
                {link.name}
              </Link>
            )
          ))}
        </div>

        {/* Profile & Logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-800">{user?.name}</p>
            <p className="text-[10px] text-gray-500 uppercase">{user?.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <span className="text-xl">🚪</span>
          </button>
        </div>
      </div>
    </nav>
  );
}