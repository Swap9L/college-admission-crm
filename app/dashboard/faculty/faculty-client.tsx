'use client'

import { useState } from "react";
import { deleteFaculty, adminResetPassword, updateUserRole } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function FacultyClient({ facultyList, currentUser }: { facultyList: any[], currentUser: any }) {
  
  // SAFETY CHECK: If currentUser is missing, don't render or render null
  if (!currentUser) return null;

  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const { toast } = useToast();

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
  const isAdmin = currentUser.role === "ADMIN";

  const handleRoleChange = async (userId: string, newRole: string) => {
    const formData = new FormData();
    formData.append("id", userId);
    formData.append("newRole", newRole);
    
    const res = await updateUserRole(formData);
    if(res?.error) {
        toast({ variant: "destructive", title: "Error", description: res.error });
    } else {
        toast({ title: "Updated", description: "User role changed." });
    }
  };

  const getRoleColor = (role: string) => {
      switch(role) {
          case 'SUPER_ADMIN': return "bg-purple-100 text-purple-700 hover:bg-purple-100";
          case 'ADMIN': return "bg-blue-100 text-blue-700 hover:bg-blue-100";
          default: return "bg-gray-100 text-gray-700 hover:bg-gray-100";
      }
  }

  return (
    <>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facultyList.map((f) => {
              const isMe = f.id === currentUser.id;
              const targetIsSuper = f.role === 'SUPER_ADMIN';
              const targetIsAdmin = f.role === 'ADMIN';

              // --- PERMISSION LOGIC ---

              // 1. Can I manage (Edit Role / Delete / Reset Pass) this person?
              // Super Admin can manage anyone (except self).
              // Admin can ONLY manage Faculty (not Super Admin, not other Admins).
              const canManage = !isMe && (
                  isSuperAdmin || 
                  (isAdmin && !targetIsSuper && !targetIsAdmin)
              );

              return (
              <TableRow key={f.id} className={isMe ? "bg-blue-50/50" : ""}>
                <TableCell className="font-medium">
                    {f.name} {isMe && <span className="text-xs text-gray-400">(You)</span>}
                </TableCell>
                <TableCell>{f.email}</TableCell>
                
                {/* ROLE COLUMN */}
                <TableCell>
                    {canManage ? (
                         <Select defaultValue={f.role} onValueChange={(val) => handleRoleChange(f.id, val)}>
                            <SelectTrigger className={`w-[130px] h-8 ${getRoleColor(f.role)} border-0`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FACULTY">Faculty</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                
                                {/* Only Super Admin can promote someone to Super Admin */}
                                {isSuperAdmin && (
                                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                )}
                            </SelectContent>
                         </Select>
                    ) : (
                        <Badge className={`${getRoleColor(f.role)} border-0 shadow-none`}>
                            {f.role.replace('_', ' ')}
                        </Badge>
                    )}
                </TableCell>

                <TableCell className="text-right flex justify-end gap-2">
                  
                  {/* RESET PASSWORD (Hidden if no permission) */}
                  {canManage && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setSelectedFaculty(f); setIsResetOpen(true); }}
                        title="Reset Password"
                      >
                        <KeyRound className="h-4 w-4 text-gray-400" />
                      </Button>
                  )}

                  {/* DELETE USER (Hidden if no permission) */}
                  {canManage && (
                      <form action={deleteFaculty}>
                        <input type="hidden" name="id" value={f.id} />
                        <Button variant="ghost" size="sm" type="submit" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                  )}

                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>

      {/* Password Reset Modal */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>For user: <b>{selectedFaculty?.name}</b></DialogDescription>
            </DialogHeader>
            <form action={async (formData) => {
                 try {
                    await adminResetPassword(formData);
                    setIsResetOpen(false);
                    toast({ title: "Success", description: "Password reset." });
                 } catch (e) {
                    toast({ variant: "destructive", title: "Error", description: "Failed to reset password." });
                 }
            }} className="space-y-4">
                <input type="hidden" name="id" value={selectedFaculty?.id || ''} />
                <Input name="newPassword" type="text" placeholder="New Password" required minLength={6} />
                <DialogFooter><Button type="submit">Update</Button></DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </>
  );
}