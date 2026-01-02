'use server'

import { db } from "@/lib/db"
import { auth, signIn } from "@/auth"
import { revalidatePath } from "next/cache"
import { CallStatus, Interest, Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"

// --- UTILS ---
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

// --- AUTH ACTION ---
export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

// --- STUDENT ACTIONS ---
// app/actions.ts

export async function uploadStudents(data: any[]) {
  const user = await getCurrentUser();
  
  // 1. Strict check: ensure user AND user.id exist
  if (!user || !user.id) throw new Error("Unauthorized");

  const studentsToCreate = data
    .map((row) => {
      const prevCourseVal = 
        row["Previous Course"] || 
        row["PreviousCourse"] || 
        row["prev_course"] || 
        row["previous course"] || 
        null;

      return {
        name: String(row.Name || row.name || "").trim(),
        phone: String(row.Phone || row.phone || "").trim(),
        address: (row.Address || row.address) ? String(row.Address || row.address) : null,
        prevCourse: prevCourseVal ? String(prevCourseVal) : null,
        
        // 2. FIX: Force TypeScript to treat this as a string
        uploadedById: user.id as string, 
      };
    })
    .filter(s => s.name.length > 0 && s.phone.length > 0 && s.phone !== "undefined");

  if (studentsToCreate.length === 0) {
    return { success: false, error: "No valid students found." };
  }

  await db.student.createMany({
    data: studentsToCreate,
    skipDuplicates: true 
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateStudent(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const status = formData.get('status') as CallStatus;
  const interest = formData.get('interest') as Interest;
  const notes = formData.get('notes') as string;
  const prevCourse = formData.get('prevCourse') as string;

  // Explicitly get the user's name
  const updaterName = user.name || "Unknown Staff";

  await db.student.update({
    where: { id },
    data: {
      callStatus: status,
      futureInterest: interest === "OTHER" && !Object.values(Interest).includes(interest) ? null : interest,
      notes: notes,
      prevCourse: prevCourse, // <--- SAVE TO DB
      lastUpdatedBy: updaterName
    }
  });

  revalidatePath("/dashboard/students");
}

// --- ADMIN ACTIONS ---

export async function createFaculty(formData: FormData) {
  const session = await auth();
  const currentUserRole = (session?.user as any).role;

  // Allow Super Admin OR Admin
  if (currentUserRole !== Role.SUPER_ADMIN && currentUserRole !== Role.ADMIN) {
      throw new Error("Forbidden");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const hashedPassword = await bcrypt.hash(password, 10);

  // Users created by "Admin" are automatically "FACULTY". 
  // "Super Admin" creates "FACULTY" by default too, promotes later.
  await db.user.create({
    data: { name, email, password: hashedPassword, role: Role.FACULTY }
  });

  revalidatePath("/dashboard/faculty");
}

export async function deleteFaculty(formData: FormData) {
  const session = await auth();
  const currentUserRole = (session?.user as any).role;
  const currentUserId = session?.user?.id;
  const targetUserId = formData.get("id") as string;

  if (currentUserRole !== Role.SUPER_ADMIN && currentUserRole !== Role.ADMIN) {
      throw new Error("Forbidden");
  }

  // Fetch target to check their role
  const targetUser = await db.user.findUnique({ where: { id: targetUserId }});
  if (!targetUser) return;

      // RULE: Admins cannot delete other Admins or Super Admins
      if (currentUserRole === Role.ADMIN) {
        if (targetUser.role === Role.ADMIN || targetUser.role === Role.SUPER_ADMIN) {
          throw new Error("Admins can only remove Faculty.");
        }
      }

      // RULE: Nobody can delete themselves
      if (targetUserId === currentUserId) return;

  await db.user.delete({ where: { id: targetUserId }});
  revalidatePath("/dashboard/faculty");
}


export async function adminResetPassword(formData: FormData) {
  const session = await auth();
  const currentUserRole = (session?.user as any).role;
  
  // 1. Basic Auth Check
  if (currentUserRole !== Role.SUPER_ADMIN && currentUserRole !== Role.ADMIN) {
      throw new Error("Forbidden");
  }

  const id = formData.get("id") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  // 2. Fetch Target User to check their role
  const targetUser = await db.user.findUnique({ where: { id } });
  if (!targetUser) throw new Error("User not found");

      // 3. HIERARCHY CHECK
      // If I am an ADMIN, I cannot touch SUPER_ADMIN or other ADMINS
      if (currentUserRole === Role.ADMIN) {
        if (targetUser.role === Role.SUPER_ADMIN || targetUser.role === Role.ADMIN) {
          throw new Error("Admins can only reset passwords for Faculty.");
        }
      }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id },
    data: { 
      password: hashedPassword 
    }
  });

  revalidatePath("/dashboard/faculty");
  return { success: true };
}

// --- DASHBOARD ANALYTICS (This was missing) ---

export async function getDashboardStats() {
  const user = await getCurrentUser();
  if(!user) return null;
  const role = (user as any).role;

  // If Admin or Super Admin, fetch all. If Faculty, fetch only theirs.
  const where = (role === Role.SUPER_ADMIN || role === Role.ADMIN) ? {} : { uploadedById: user.id };

  const total = await db.student.count({ where });
  
  const interestedGroups = await db.student.groupBy({
    by: ['futureInterest'],
    where: { ...where, futureInterest: { not: null } },
    _count: { _all: true }
  });
  
  const statusCounts = await db.student.groupBy({
    by: ['callStatus'],
    where,
    _count: { _all: true }
  });

  return { total, interestedGroups, statusCounts };
}

// 1. ACTION: Toggle User Role (Promote/Demote)

export async function updateUserRole(formData: FormData) {
  const session = await auth();
  const currentUserRole = (session?.user as any).role;

      // ONLY SUPER ADMIN CAN CHANGE ROLES
      if (currentUserRole !== Role.SUPER_ADMIN) {
        return { error: "Only Super Admin can change roles." };
      }

  const targetUserId = formData.get("id") as string;
  const newRole = formData.get("newRole") as Role;
  const currentUserId = session?.user?.id;

  if (targetUserId === currentUserId) return { error: "You cannot change your own role." };

  await db.user.update({
    where: { id: targetUserId },
    data: { role: newRole }
  });

  revalidatePath("/dashboard/faculty");
  return { success: true };
}

// 2. ACTION: Update Own Password (Self-Service)
export async function updateOwnPassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const newPassword = formData.get("newPassword") as string;

  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword }
  });

  revalidatePath("/");
  return { success: true };
}
