'use client'

import { useState } from "react";
import * as XLSX from "xlsx";
import { uploadStudents, updateStudent } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast"; // Ensure this path matches your project structure
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export function StudentClient({ initialStudents, role }: any) {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const data = XLSX.utils.sheet_to_json(ws);
      const res = await uploadStudents(data);
      
      if(res?.success) {
          toast({ title: "Success", description: "Students uploaded successfully" });
          window.location.reload();
      } else {
          toast({ variant: "destructive", title: "Error", description: "Upload failed" });
      }
    };
    reader.readAsBinaryString(file);
  };

  // 1. FILTERING
  const filtered = students.filter((s:any) => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.phone.includes(search)
  );

  // 2. SORTING LOGIC
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStudents = [...filtered].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    // Handle null/undefined values safely
    const valA = (a[key] || "").toString().toLowerCase();
    const valB = (b[key] || "").toString().toLowerCase();

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Calling List</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <Input 
            placeholder="Search Name/Phone..." 
            className="w-full md:w-64" 
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="relative">
            <Input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept=".xlsx, .xls" />
            <Button variant="outline">Upload Excel</Button>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              {/* HEADER FOR PREVIOUS COURSE */}
              <TableHead>Previous Course</TableHead>
              
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('futureInterest')}
              >
                <div className="flex items-center gap-1">
                    Future Interest
                    {sortConfig?.key === 'futureInterest' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>
                    ) : <ArrowUpDown size={14} className="text-gray-400" />}
                </div>
              </TableHead>

              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('callStatus')}
              >
                <div className="flex items-center gap-1">
                    Status
                    {sortConfig?.key === 'callStatus' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>
                    ) : <ArrowUpDown size={14} className="text-gray-400" />}
                </div>
              </TableHead>

              <TableHead>Last Updated By</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStudents.length === 0 && <TableRow><TableCell colSpan={7} className="text-center p-4">No students found</TableCell></TableRow>}
            {sortedStudents.map((s:any) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.phone}</TableCell>
                
                {/* CELL FOR PREVIOUS COURSE */}
                <TableCell>{s.prevCourse || "-"}</TableCell>

                <TableCell>{s.futureInterest || "-"}</TableCell>
                <TableCell>
                  <Badge variant={s.callStatus === 'INTERESTED' ? 'default' : 'secondary'}>
                    {s.callStatus.replace('_', ' ')}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-sm text-gray-500">
                    {s.lastUpdatedBy || "-"}
                </TableCell>
                
                <TableCell>
                  <Button size="sm" onClick={() => setSelectedStudent(s)}>Update</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* UPDATE MODAL */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Call Details: {selectedStudent?.name}</DialogTitle>
          </DialogHeader>
          
              <form action={async (formData) => {
                  await updateStudent(selectedStudent.id, formData);
                  setSelectedStudent(null);
                  toast({ title: "Updated", description: "Student details saved." });
                  window.location.reload(); 
              }} className="space-y-4">

                  {/* 1. CALL STATUS */}
                  <div>
                      <label className="text-sm font-medium">Call Status</label>
                      <Select name="status" defaultValue={selectedStudent?.callStatus}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="NOT_CALLED">Not Called</SelectItem>
                              <SelectItem value="RINGING">Ringing</SelectItem>
                              <SelectItem value="CALL_BACK">Call Back</SelectItem>
                              <SelectItem value="INTERESTED">Interested</SelectItem>
                              <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                              <SelectItem value="ADMISSION_TAKEN">Admission Taken</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>

                  {/* 2. PREVIOUS COURSE INPUT */}
                  <div>
                      <label className="text-sm font-medium">Previous Course</label>
                      <Input 
                          name="prevCourse" 
                          defaultValue={selectedStudent?.prevCourse || ""} 
                          placeholder="e.g. 12th, BCA, B.Sc..." 
                      />
                  </div>

                  {/* 3. FUTURE INTEREST */}
                  <div>
                      <label className="text-sm font-medium">Future Interest</label>
                      <Select name="interest" defaultValue={selectedStudent?.futureInterest || "OTHER"}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="MCA">MCA</SelectItem>
                              <SelectItem value="MBA">MBA</SelectItem>
                              <SelectItem value="BCA">BCA</SelectItem>
                              <SelectItem value="BTECH">B.Tech</SelectItem>
                              <SelectItem value="NURSING">Nursing</SelectItem>
                              <SelectItem value="DIPLOMA">Diploma</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>

                  {/* 4. NOTES */}
                  <div>
                      <label className="text-sm font-medium">Notes</label>
                      <Input name="notes" defaultValue={selectedStudent?.notes} placeholder="Remarks..." />
                  </div>

                  <Button type="submit" className="w-full">Save Changes</Button>
              </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}