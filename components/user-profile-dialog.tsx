'use client'

import { useState } from "react";
import { updateOwnPassword } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UserProfileDialog({ user, signOutAction }: { user: any, signOutAction: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const initials = user?.name?.substring(0, 2).toUpperCase() || "U";

  const handleSubmit = async (formData: FormData) => {
      try {
          await updateOwnPassword(formData);
          setIsOpen(false);
          toast({ title: "Success", description: "Your password has been changed." });
      } catch(e) {
          toast({ variant: "destructive", title: "Error", description: "Failed to update password." });
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="mt-auto p-4 border-t bg-slate-50">
             {/* TRIGGER: Clickable User Profile */}
             <DialogTrigger asChild>
                <div className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-slate-200 p-2 rounded-md transition-colors">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-blue-600 text-white text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5 text-xs text-left">
                        <span className="font-semibold text-slate-900">{user?.name}</span>
                        <span className="text-slate-500 truncate w-32">{user?.email}</span>
                    </div>
                    <Settings className="h-4 w-4 ml-auto text-slate-400" />
                </div>
             </DialogTrigger>

             {/* Sign Out Button */}
             <form action={signOutAction}>
                <button className="flex w-full items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-medium text-red-500 shadow-sm transition-colors hover:bg-red-50">
                    <LogOut className="h-3 w-3" /> Sign Out
                </button>
             </form>
        </div>

        {/* MODAL CONTENT */}
        <DialogContent>
            <DialogHeader>
                <DialogTitle>My Profile</DialogTitle>
                <DialogDescription>Manage your account settings</DialogDescription>
            </DialogHeader>
            
            <form action={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input disabled value={user?.email || ''} className="bg-gray-100" />
                </div>

                <div className="grid gap-2">
                    <Label>New Password</Label>
                    <Input name="newPassword" type="password" placeholder="Enter new password" required minLength={6} />
                </div>

                <DialogFooter>
                    <Button type="submit">Change Password</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
  );
}