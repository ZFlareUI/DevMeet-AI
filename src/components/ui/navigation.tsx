'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  RocketLaunchIcon,
  ArrowLeftIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

interface NavigationProps {
  showBackButton?: boolean;
  backUrl?: string;
  backLabel?: string;
}

export default function Navigation({ showBackButton = false, backUrl = '/', backLabel = 'Back' }: NavigationProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Home', href: '/', icon: HomeIcon, show: true },
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, show: !!session },
    { name: 'Candidates', href: '/candidates', icon: UserGroupIcon, show: !!session },
    { name: 'Interviews', href: '/interviews', icon: CalendarIcon, show: !!session },
    { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon, show: true },
    { name: 'Features', href: '/features', icon: CogIcon, show: true },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, show: !!session }
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const isActivePage = (href: string) => {
    if (!pathname) return false;
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="bg-gradient-to-r from-black/40 via-purple-900/30 to-black/40 backdrop-blur-xl border-b border-purple-500/30 shadow-2xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Back Button */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link href={backUrl}>
                <Button variant="ghost" className="text-cyan-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-500/20 border border-transparent hover:border-cyan-400/30 transition-all duration-300">
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  {backLabel}
                </Button>
              </Link>
            )}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-xl group-hover:shadow-cyan-500/25 transition-all duration-300 group-hover:scale-110">
                <RocketLaunchIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:from-cyan-200 group-hover:via-purple-300 group-hover:to-pink-300 transition-all duration-300">
                DevMeet AI
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems
              .filter(item => item.show)
              .map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button 
                    variant="ghost" 
                    className={`text-sm transition-all duration-300 border border-transparent ${
                      isActivePage(item.href)
                        ? 'text-white bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border-cyan-400/40'
                        : 'text-purple-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-cyan-500/20 hover:border-purple-400/30'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Button>
                </Link>
              ))}
          </div>

          {/* Auth Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {session.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-purple-200 text-sm">{session.user?.name}</span>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="border-red-400/50 text-red-300 hover:text-white hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 hover:border-red-300/70 transition-all duration-300"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-purple-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-cyan-500/20">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:from-cyan-400 hover:via-purple-500 hover:to-pink-400 text-white shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-purple-300 hover:text-white"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-purple-500/30 py-4">
            <div className="space-y-2">
              {navigationItems
                .filter(item => item.show)
                .map((item) => (
                  <Link key={item.name} href={item.href}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start transition-all duration-300 ${
                        isActivePage(item.href)
                          ? 'text-white bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border border-cyan-400/40'
                          : 'text-purple-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-cyan-500/20'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4 mr-3" />
                      {item.name}
                    </Button>
                  </Link>
                ))}
              
              {/* Mobile Auth */}
              <div className="border-t border-purple-500/30 pt-4 mt-4">
                {session ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 px-3 py-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {session.user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span className="text-purple-200 text-sm">{session.user?.name}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start border-red-400/50 text-red-300 hover:text-white hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/auth/signin">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-purple-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-cyan-500/20"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button 
                        className="w-full justify-start bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:from-cyan-400 hover:via-purple-500 hover:to-pink-400 text-white"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}