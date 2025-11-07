import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Building2,
  GraduationCap,
  AlertCircle,
  TrendingUp,
  Clock,
  ExternalLink,
} from "lucide-react"

async function getAdminStats() {
  const [
    totalInstitutions,
    totalPrograms,
    institutionsWithoutWebsite,
    programsWithoutCutoff,
    recentChanges,
  ] = await Promise.all([
    prisma.institution.count(),
    prisma.program.count(),
    prisma.institution.count({
      where: {
        OR: [
          { website: null },
          { website: "" },
        ],
      },
    }),
    prisma.program.count({
      where: {
        cutoffHistory: null as any,
      },
    }),
    prisma.auditEvent.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    }),
  ])

  const dataQualityScore = Math.round(
    ((totalInstitutions - institutionsWithoutWebsite) / totalInstitutions) * 50 +
    ((totalPrograms - programsWithoutCutoff) / totalPrograms) * 50
  )

  return {
    totalInstitutions,
    totalPrograms,
    institutionsWithoutWebsite,
    programsWithoutCutoff,
    dataQualityScore,
    recentChanges,
  }
}

export default async function AdminDashboardPage() {
  await requireAdmin()
  const stats = await getAdminStats()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage institutions, programs, and data quality
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Institutions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInstitutions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">In database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrograms.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">In database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dataQualityScore}%</div>
            <p className="text-xs text-muted-foreground">Overall quality</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.institutionsWithoutWebsite + stats.programsWithoutCutoff}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data Quality Issues</CardTitle>
            <CardDescription>Institutions and programs needing updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Institutions without websites</p>
                <p className="text-sm text-muted-foreground">
                  {stats.institutionsWithoutWebsite} institutions need website URLs
                </p>
              </div>
              <Link href="/admin/data-quality">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Programs without cutoff data</p>
                <p className="text-sm text-muted-foreground">
                  {stats.programsWithoutCutoff} programs need cutoff history
                </p>
              </div>
              <Link href="/admin/data-quality">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/institutions/new">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Add New Institution
              </Button>
            </Link>
            <Link href="/admin/programs/new">
              <Button variant="outline" className="w-full justify-start">
                <GraduationCap className="mr-2 h-4 w-4" />
                Add New Program
              </Button>
            </Link>
            <Link href="/admin/institutions">
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Institutions
              </Button>
            </Link>
            <Link href="/admin/programs">
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Programs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Changes</CardTitle>
          <CardDescription>Latest audit log entries</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentChanges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent changes</p>
          ) : (
            <div className="space-y-2">
              {stats.recentChanges.map((change) => (
                <div
                  key={change.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {change.action} {change.entityType} {change.entityId.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {change.user?.email || "System"} • {new Date(change.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Link href="/admin/audit">
              <Button variant="outline" size="sm">
                View All Audit Logs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

