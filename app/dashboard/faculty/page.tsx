import { db } from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { createFaculty } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Import the new client component
import { FacultyClient } from "./faculty-client"; 

export default async function FacultyPage() {
  const session = await auth();

  // 1. Ensure user is logged in
  if (!session || !session.user) redirect("/login");

  const currentUserRole = (session.user as any).role;

  // 2. Access Control: Only Super Admin & Admin can view this page
  if (currentUserRole !== Role.SUPER_ADMIN && currentUserRole !== Role.ADMIN) {
      redirect("/dashboard");
  }


  // fetch *all* users now (not just faculty) to see other admins
  const users = await db.user.findMany({ orderBy: { createdAt: 'desc' } });

  const faculty = await db.user.findMany({
    where: { role: Role.FACULTY },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Faculty Management</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Faculty Form (Stays as Server Form) */}
        <Card>
            <CardHeader><CardTitle>Add New Faculty</CardTitle></CardHeader>
            <CardContent>
                <form action={createFaculty} className="space-y-4">
                    <Input name="name" placeholder="Full Name" required />
                    <Input name="email" type="email" placeholder="Email Address" required />
                    <Input name="password" type="password" placeholder="Initial Password" required />
                    <Button type="submit">Create Account</Button>
                </form>
            </CardContent>
        </Card>

        {/* Existing Faculty List (Now handled by Client Component) */}
        <Card>
            <CardHeader><CardTitle>Existing Faculty</CardTitle></CardHeader>
            <CardContent>
                {/* We pass the data to the client component */}
               <FacultyClient 
                        facultyList={users} 
                        currentUser={session.user} 
                    />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}