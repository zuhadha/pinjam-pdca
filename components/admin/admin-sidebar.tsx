'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Settings, 
  LogOut,
  Home,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Inbox,
  Menu,
  X,
  Tags,
  DoorOpen,
  CalendarDays,
  CalendarCheck
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { logoutAction } from '@/lib/auth/actions'

interface AdminSidebarProps {
  user: {
    name: string
    role: string
  }
}

const adminNavigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Kelola Kategori', href: '/admin/categories', icon: Tags },
  { name: 'Kelola Barang', href: '/admin/items', icon: Package },
  { name: 'Kelola Peminjaman', href: '/admin/requests', icon: FileText },
  { name: 'Kelola Permintaan', href: '/admin/permanent-requests', icon: FileText },
  { name: 'Kelola Booking Ruangan', href: '/admin/room-bookings', icon: CalendarCheck },
  { name: 'Kelola Ruangan', href: '/admin/rooms', icon: DoorOpen },
]

const externalNavigation = [
  { name: 'Beranda Utama', href: '/', icon: Home },
  { name: 'Katalog Barang', href: '/catalog', icon: ShoppingBag },
  { name: 'Jadwal Ruangan', href: '/rooms', icon: CalendarDays },
]

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Sync sidebar width with main content using CSS variable (Desktop only)
  useEffect(() => {
    const updateWidth = () => {
      if (window.innerWidth >= 1024) {
        const width = isCollapsed ? '80px' : '260px'
        document.documentElement.style.setProperty('--admin-sidebar-width', width)
      } else {
        document.documentElement.style.setProperty('--admin-sidebar-width', '0px')
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [isCollapsed])

  const handleLogout = async () => {
    await logoutAction()
  }

  return (
    <>
      {/* Mobile menu button */}
      {!mobileMenuOpen && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-white shadow-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside
        style={{ width: isCollapsed ? '80px' : '260px' }}
        className={`
          fixed top-0 left-0 z-40 h-screen bg-[#f9fafb] border-r border-gray-200 transition-all duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full relative">
          
          {/* Collapse Toggle Button (Desktop Only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-20 z-50 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-400 hover:text-gray-600 shadow-sm transition-transform"
            style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Header Area */}
          <div className={`mb-2 transition-all duration-300 ${isCollapsed ? 'p-2 py-4' : 'p-4'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-6`}>
              <Link href="/" className={`flex items-center ${isCollapsed ? 'gap-0' : 'gap-3'}`}>
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  <Image 
                    src="/logo-invensa.jpeg" 
                    alt="Logo" 
                    width={40} 
                    height={40} 
                    className="h-9 w-9 object-contain rounded-lg shadow-sm"
                  />
                </div>
                <span className={`
                  font-bold text-gray-900 text-lg tracking-tight transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden
                  ${isCollapsed ? 'w-0 opacity-0 -translate-x-4 invisible' : 'w-auto opacity-100 translate-x-0 visible'}
                `}>
                  INVENSA
                </span>
              </Link>
              {/* Mobile Close Button - Absolutely positioned for cleaner look */}
              {mobileMenuOpen && (
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-6 overflow-y-auto no-scrollbar">
            {/* Menu Section */}
            <div>
              <p className={`
                px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 transition-opacity duration-300
                ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}
              `}>
                Menu Utama
              </p>
              <div className="space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href)
                  const Icon = item.icon
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center rounded-xl font-medium transition-all duration-300 group
                        ${isCollapsed ? 'justify-center h-11 w-11 mx-auto px-0' : 'gap-3 px-3 py-2.5'}
                        ${isActive 
                          ? 'bg-white text-primary-700 shadow-sm border border-gray-100' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                      title={isCollapsed ? item.name : ''}
                    >
                      <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-primary-600' : 'group-hover:text-gray-900'}`} />
                      <span className={`
                        transition-all duration-300 ease-out whitespace-nowrap overflow-hidden
                        ${isCollapsed ? 'w-0 opacity-0 -translate-x-4 invisible' : 'w-auto opacity-100 translate-x-0 visible'}
                      `}>
                        {item.name}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Access Section */}
            <div>
              <p className={`
                px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 transition-opacity duration-300
                ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}
              `}>
                Navigasi
              </p>
              <div className="space-y-1">
                {externalNavigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center rounded-xl font-medium text-sm text-gray-600 transition-all duration-300 group
                        ${isCollapsed ? 'justify-center h-11 w-11 mx-auto px-0' : 'gap-3 px-3 py-2.5 hover:bg-gray-100 hover:text-gray-900'}
                      `}
                      title={isCollapsed ? item.name : ''}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0 group-hover:text-gray-900 transition-colors" />
                      <span className={`
                        transition-all duration-300 ease-out whitespace-nowrap overflow-hidden
                        ${isCollapsed ? 'w-0 opacity-0 -translate-x-4 invisible' : 'w-auto opacity-100 translate-x-0 visible'}
                      `}>
                        {item.name}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* User Footer */}
          <div className="p-3 border-t border-gray-100">
             <div className={`p-2 rounded-xl transition-all duration-300 ${isCollapsed ? 'flex flex-col items-center' : 'bg-white border border-gray-100 shadow-sm'}`}>
                <Link 
                  href="/admin/settings"
                  title="Pengaturan"
                  className={`flex items-center gap-3 overflow-hidden rounded-lg hover:bg-gray-50 transition-colors ${isCollapsed ? 'justify-center p-0' : 'p-1'}`}
                >
                   <div className="min-w-[40px] h-10 bg-primary-50 text-primary-700 rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                   </div>
                   <div className={`
                     transition-all duration-300 ease-out overflow-hidden
                     ${isCollapsed ? 'w-0 opacity-0 -translate-x-4 invisible' : 'w-auto opacity-100 translate-x-0 visible'}
                   `}>
                      <p className="font-bold text-gray-900 text-xs truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Admin</p>
                   </div>
                </Link>
                {!isCollapsed && (
                   <button
                    onClick={handleLogout}
                    className="mt-3 flex items-center gap-3 px-3 py-2 w-full rounded-lg font-medium text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="whitespace-nowrap">Logout</span>
                  </button>
                )}
             </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}

