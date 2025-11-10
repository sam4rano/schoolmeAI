"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { Skeleton } from "@/components/ui/skeleton"
import { GraduationCap, Calendar, TrendingUp, Trash2, Download, Filter } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Calculation {
  id: string
  programId: string
  utme: number
  olevels: Record<string, string>
  compositeScore: number
  probability: number | null
  category: string
  rationale: string | null
  result: any
  createdAt: string
  program: {
    id: string
    name: string
    institution: {
      id: string
      name: string
      type: string
      state: string
    }
  }
}

export default function CalculationsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProgram, setFilterProgram] = useState<string>("all")
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (session?.user) {
      fetchCalculations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, filterProgram])

  const fetchCalculations = async () => {
    try {
      setLoading(true)
      const url =
        filterProgram !== "all"
          ? `/api/calculations?programId=${filterProgram}`
          : "/api/calculations"
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json() as { data: Calculation[] }
        const calculationsData = data.data || []
        setCalculations(calculationsData)

        // Extract unique programs for filter
        const uniquePrograms: Array<{ id: string; name: string }> = Array.from(
          new Map(
            calculationsData.map((calc) => [
              calc.program.id,
              { id: calc.program.id, name: calc.program.name },
            ])
          ).values()
        )
        setPrograms(uniquePrograms)
      }
    } catch (error) {
      console.error("Error fetching calculations:", error)
      toast({
        title: "Error",
        description: "Failed to load calculation history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this calculation?")) {
      return
    }

    try {
      const response = await fetch(`/api/calculations/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Calculation deleted successfully",
        })
        fetchCalculations()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete calculation",
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    const data = calculations.map((calc) => ({
      Program: calc.program.name,
      Institution: calc.program.institution.name,
      UTME: calc.utme,
      "O-Level Subjects": Object.entries(calc.olevels)
        .map(([subject, grade]) => `${subject}: ${grade}`)
        .join(", "),
      "Composite Score": calc.compositeScore,
      Probability: calc.probability ? `${(calc.probability * 100).toFixed(1)}%` : "N/A",
      Category: calc.category,
      Date: new Date(calc.createdAt).toLocaleDateString(),
    }))

    const csv = [
      Object.keys(data[0] || {}),
      ...data.map((row) => Object.values(row).map((cell) => `"${String(cell).replace(/"/g, '""')}"`)),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `calculations-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                Calculation History
              </h1>
              <p className="text-muted-foreground">
                View and manage your eligibility calculations
              </p>
            </div>
            <div className="flex gap-2">
              {calculations.length > 0 && (
                <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : calculations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No calculations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start calculating your eligibility to see your history here
                </p>
                <Link href="/calculator">
                  <Button>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Calculate Eligibility
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filter */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Program:</label>
                    <Select value={filterProgram} onValueChange={setFilterProgram}>
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Calculations Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Calculations ({calculations.length})</CardTitle>
                  <CardDescription>
                    Your eligibility calculation history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Program</TableHead>
                        <TableHead>Institution</TableHead>
                        <TableHead>UTME</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Probability</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculations.map((calc) => (
                        <TableRow key={calc.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/programs/${calc.program.id}`}
                              className="text-primary hover:underline"
                            >
                              {calc.program.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/institutions/${calc.program.institution.id}`}
                              className="text-muted-foreground hover:underline"
                            >
                              {calc.program.institution.name}
                            </Link>
                          </TableCell>
                          <TableCell>{calc.utme}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{calc.compositeScore.toFixed(1)}</Badge>
                          </TableCell>
                          <TableCell>
                            {calc.probability ? (
                              <Badge
                                variant={
                                  calc.probability >= 0.7
                                    ? "default"
                                    : calc.probability >= 0.4
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {(calc.probability * 100).toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                calc.category === "safe"
                                  ? "default"
                                  : calc.category === "target"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {calc.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(calc.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(calc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}

