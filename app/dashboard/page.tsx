import { getDashboardStats } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  if (!stats) return <div>Loading...</div>;
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Students</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Interested</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
             {stats.statusCounts.find((s:any) => s.callStatus === 'INTERESTED')?._count._all || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
         <Card>
           <CardHeader><CardTitle>Interest Distribution</CardTitle></CardHeader>
           <CardContent><DashboardCharts data={stats.interestedGroups} type="interest" /></CardContent>
         </Card>
         <Card>
           <CardHeader><CardTitle>Call Status Distribution</CardTitle></CardHeader>
           <CardContent><DashboardCharts data={stats.statusCounts} type="status" /></CardContent>
         </Card>
      </div>
    </div>
  )
}