import { db } from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { StudentClient } from "./client-view"; 

export default async function StudentsPage() {
  const session = await auth();
  const role = (session?.user as any).role;
  const userId = session?.user?.id;
  const where = role === Role.SUPER_ADMIN ? {} : { uploadedById: userId };
  const students = await db.student.findMany({ where, orderBy: { createdAt: 'desc' } });
  return <StudentClient initialStudents={students} role={role} />;
}