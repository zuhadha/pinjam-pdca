import { getCurrentUser } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar user={user} />
        
        {/* Main Content */}
        <main 
          className="flex-1 min-w-0 transition-all duration-300 ease-in-out"
          style={{ marginLeft: 'var(--admin-sidebar-width, 0px)' }}
        >
          <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
