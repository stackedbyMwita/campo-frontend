import { AdminGuard } from "@/components/auth/admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="h-full relative bg-slate-50 dark:bg-slate-950 min-h-screen">
        {/* Navigation */}
        <AdminSidebar />
        
        {/* Main Content Area */}
        <main className="md:pl-72 min-h-screen transition-all duration-300 ease-in-out">
          {/* Add a top spacing or container if needed */}
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
             {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}