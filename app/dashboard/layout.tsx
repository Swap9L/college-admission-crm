import { auth, signOut } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, Phone, GraduationCap } from "lucide-react";
import { UserProfileDialog } from "@/components/user-profile-dialog"; // Import new component

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  
  // Create a server action specifically for the client component to use for logout
  const signOutAction = async () => {
    'use server';
    await signOut();
  };

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <aside className="hidden border-r bg-white md:block w-64 fixed h-full z-10">
        <div className="flex h-full max-h-screen flex-col gap-2">
          
          <div className="flex h-14 items-center border-b px-6">
            <Link className="flex items-center gap-2 font-semibold" href="#">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              <span>VCK Admissions</span>
            </Link>
          </div>

          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                <LayoutDashboard className="h-4 w-4" /> Overview
              </Link>
              <Link href="/dashboard/students" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                <Phone className="h-4 w-4" /> Calling List
              </Link >
              {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
                <Link href="/dashboard/faculty" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100"  >
                  <Users className="h-4 w-4" /> Faculty Team
                </Link>
              )}
            </nav>
          </div>

          {/* NEW PROFILE FOOTER */}
          <UserProfileDialog user={session.user} signOutAction={signOutAction} />

        </div>
      </aside>
      <main className="flex-1 md:ml-64 h-full overflow-y-auto">
        <div className="h-full p-8">{children}</div>
      </main>
    </div>
  );
}
