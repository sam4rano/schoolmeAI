"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { usePrograms } from "@/lib/hooks/use-programs"
import { useInstitutions } from "@/lib/hooks/use-institutions"
import Link from "next/link"
import { Trash2, Plus, Bookmark, GraduationCap, Search, Building2, X, GitCompare, Calendar, Download, FileText, Share2, Bell, CheckSquare } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { WatchlistNotes } from "@/components/watchlist/watchlist-notes"
import { WatchlistShare } from "@/components/watchlist/watchlist-share"
import { WatchlistAnalytics } from "@/components/watchlist/watchlist-analytics"
import { DeadlineReminders } from "@/components/watchlist/deadline-reminders"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface WatchlistItem {
  id: string
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
  priority: string | null
  notes: string | null
  createdAt: string
}

interface InstitutionWatchlistItem {
  id: string
  institution: {
    id: string
    name: string
    type: string
    ownership: string
    state: string
    city: string
  }
  priority: string | null
  notes: string | null
  createdAt: string
}

export default function WatchlistPage() {
  const sessionResult = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [institutionWatchlist, setInstitutionWatchlist] = useState<InstitutionWatchlistItem[]>([])
  const [activeTab, setActiveTab] = useState<"programs" | "institutions">("programs")
  const [loading, setLoading] = useState(true)
  const [programId, setProgramId] = useState("")
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [programSearch, setProgramSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [showProgramDropdown, setShowProgramDropdown] = useState(false)
  const [priority, setPriority] = useState<string>("medium")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedInstitutionItems, setSelectedInstitutionItems] = useState<Set<string>>(new Set())
  const [bulkPrograms, setBulkPrograms] = useState<any[]>([])
  const programDropdownRef = useRef<HTMLDivElement>(null)
  
  // Institution watchlist state
  const [institutionId, setInstitutionId] = useState("")
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null)
  const [institutionSearch, setInstitutionSearch] = useState("")
  const [debouncedInstitutionSearch, setDebouncedInstitutionSearch] = useState("")
  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false)
  const [institutionDialogOpen, setInstitutionDialogOpen] = useState(false)
  const institutionDropdownRef = useRef<HTMLDivElement>(null)

  // Debounce program search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(programSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [programSearch])

  // Debounce institution search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInstitutionSearch(institutionSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [institutionSearch])

  // Fetch programs based on search
  const { data: programsData, isLoading: programsLoading } = usePrograms({
    query: debouncedSearch || undefined,
    limit: 10,
  })

  // Fetch institutions based on search
  const { data: institutionsData, isLoading: institutionsLoading } = useInstitutions({
    query: debouncedInstitutionSearch || undefined,
    limit: 10,
  })

  const programs = programsData?.data || []
  const institutions = institutionsData?.data || []

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        programDropdownRef.current &&
        !programDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProgramDropdown(false)
      }
      if (
        institutionDropdownRef.current &&
        !institutionDropdownRef.current.contains(event.target as Node)
      ) {
        setShowInstitutionDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelectProgram = (program: any) => {
    setSelectedProgram(program)
    setProgramId(program.id)
    setProgramSearch(`${program.name} - ${program.institution?.name}`)
    setShowProgramDropdown(false)
  }

  const handleClearProgram = () => {
    setSelectedProgram(null)
    setProgramId("")
    setProgramSearch("")
  }

  const handleSelectInstitution = (institution: any) => {
    setSelectedInstitution(institution)
    setInstitutionId(institution.id)
    setInstitutionSearch(institution.name)
    setShowInstitutionDropdown(false)
  }

  const handleClearInstitution = () => {
    setSelectedInstitution(null)
    setInstitutionId("")
    setInstitutionSearch("")
  }

  const { data: session, status } = sessionResult || { data: null, status: "loading" }

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchWatchlist()
    } else if (status === "unauthenticated") {
      setLoading(false)
    }
  }, [session, status])

  const fetchWatchlist = async () => {
    try {
      const [programsRes, institutionsRes] = await Promise.all([
        fetch("/api/watchlist"),
        fetch("/api/watchlist/institutions"),
      ])
      
      if (programsRes.ok) {
        const data = await programsRes.json()
        setWatchlist(data.data || [])
      }
      
      if (institutionsRes.ok) {
        const data = await institutionsRes.json()
        setInstitutionWatchlist(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!programId) return

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId, priority }),
      })

      if (response.ok) {
        handleClearProgram()
        setPriority("medium")
        setDialogOpen(false)
        fetchWatchlist()
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/watchlist/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchWatchlist()
      }
    } catch (error) {
      console.error("Error deleting from watchlist:", error)
    }
  }

  const handleCompareSelected = () => {
    const selectedIds = watchlist
      .filter((item) => item.program)
      .map((item) => item.program.id)
      .slice(0, 5)
    if (selectedIds.length >= 2) {
      router.push(`/comparison?programs=${selectedIds.join(",")}`)
    }
  }

  const handleExportWatchlist = () => {
    const data = watchlist.map((item) => ({
      program: item.program.name,
      institution: item.program.institution.name,
      location: item.program.institution.state,
      priority: item.priority || "medium",
      notes: item.notes || "",
      deadline: (item.program as any).applicationDeadline || "N/A",
      added: item.createdAt,
    }))

    const csv = [
      ["Program", "Institution", "Location", "Priority", "Notes", "Deadline", "Added"],
      ...data.map((item) => [
        item.program,
        item.institution,
        item.location,
        item.priority,
        item.notes,
        item.deadline === "N/A" ? "N/A" : new Date(item.deadline).toLocaleDateString(),
        new Date(item.added).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `watchlist-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleBulkAdd = async () => {
    if (bulkPrograms.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one program",
        variant: "destructive",
      })
      return
    }

    try {
      const programIds = bulkPrograms.map((p) => p.id)
      const response = await fetch("/api/watchlist/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programIds, priority }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Added ${bulkPrograms.length} program(s) to watchlist`,
        })
        setBulkPrograms([])
        setBulkDialogOpen(false)
        fetchWatchlist()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add programs to watchlist",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one item",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedItems.size} item(s)?`)) {
      return
    }

    try {
      await Promise.all(
        Array.from(selectedItems).map((id) =>
          fetch(`/api/watchlist/${id}`, { method: "DELETE" })
        )
      )
      toast({
        title: "Success",
        description: `Deleted ${selectedItems.size} item(s) from watchlist`,
      })
      setSelectedItems(new Set())
      fetchWatchlist()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete items",
        variant: "destructive",
      })
    }
  }

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === watchlist.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(watchlist.map((item) => item.id)))
    }
  }

  const handleAddInstitution = async () => {
    if (!institutionId) return

    try {
      const response = await fetch("/api/watchlist/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionId, priority }),
      })

      if (response.ok) {
        handleClearInstitution()
        setPriority("medium")
        setInstitutionDialogOpen(false)
        fetchWatchlist()
        toast({
          title: "Success",
          description: "Institution added to watchlist",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add institution to watchlist",
        variant: "destructive",
      })
    }
  }

  const handleDeleteInstitution = async (id: string) => {
    try {
      const response = await fetch(`/api/watchlist/institutions/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchWatchlist()
        toast({
          title: "Success",
          description: "Institution removed from watchlist",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove institution from watchlist",
        variant: "destructive",
      })
    }
  }

  const handleToggleSelectInstitution = (id: string) => {
    const newSelected = new Set(selectedInstitutionItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedInstitutionItems(newSelected)
  }

  const handleSelectAllInstitutions = () => {
    if (selectedInstitutionItems.size === institutionWatchlist.length) {
      setSelectedInstitutionItems(new Set())
    } else {
      setSelectedInstitutionItems(new Set(institutionWatchlist.map((item) => item.id)))
    }
  }

  const handleBulkDeleteInstitutions = async () => {
    if (selectedInstitutionItems.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one item",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedInstitutionItems.size} item(s)?`)) {
      return
    }

    try {
      await Promise.all(
        Array.from(selectedInstitutionItems).map((id) =>
          fetch(`/api/watchlist/institutions/${id}`, { method: "DELETE" })
        )
      )
      toast({
        title: "Success",
        description: `Deleted ${selectedInstitutionItems.size} item(s) from watchlist`,
      })
      setSelectedInstitutionItems(new Set())
      fetchWatchlist()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete items",
        variant: "destructive",
      })
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
                <Bookmark className="h-8 w-8 text-primary" />
                My Watchlist
              </h1>
              <p className="text-muted-foreground">
                Track programs and institutions you&apos;re interested in
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "programs" | "institutions")} className="space-y-6">
            <TabsList>
              <TabsTrigger value="programs">
                <GraduationCap className="mr-2 h-4 w-4" />
                Programs ({watchlist.length})
              </TabsTrigger>
              <TabsTrigger value="institutions">
                <Building2 className="mr-2 h-4 w-4" />
                Institutions ({institutionWatchlist.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="programs" className="space-y-6">
              <div className="flex gap-2 flex-wrap justify-end">
                {watchlist.length >= 2 && (
                  <Button
                    variant="outline"
                    onClick={handleCompareSelected}
                  >
                    <GitCompare className="mr-2 h-4 w-4" />
                    Compare Programs
                  </Button>
                )}
                {watchlist.length > 0 && (
                  <>
                    <WatchlistShare watchlistItems={watchlist} />
                    <Button
                      variant="outline"
                      onClick={handleExportWatchlist}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </>
                )}
                {selectedItems.size > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedItems.size})
                  </Button>
                )}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Program
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Program to Watchlist</DialogTitle>
                  <DialogDescription>
                    Search and add a program to track
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2 relative" ref={programDropdownRef}>
                    <label className="text-sm font-medium">Select Program</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={programSearch}
                        onChange={(e) => {
                          setProgramSearch(e.target.value)
                          setShowProgramDropdown(true)
                          if (!e.target.value) {
                            handleClearProgram()
                          }
                        }}
                        onFocus={() => setShowProgramDropdown(true)}
                        placeholder="Search for a program (e.g., Computer Science, Medicine, Law...)"
                        className="pl-10 pr-10"
                      />
                      {selectedProgram && (
                        <button
                          onClick={handleClearProgram}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {showProgramDropdown && programSearch && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                        {programsLoading ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Searching...
                          </div>
                        ) : programs.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No programs found. Try a different search term.
                          </div>
                        ) : (
                          <div className="p-1">
                            {programs.map((program: any) => (
                              <button
                                key={program.id}
                                onClick={() => handleSelectProgram(program)}
                                className="w-full text-left p-3 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                <div className="flex items-start gap-2">
                                  <GraduationCap className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{program.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                      <p className="text-xs text-muted-foreground truncate">
                                        {program.institution?.name}
                                      </p>
                                    </div>
                                    {program.degreeType && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {program.degreeType}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedProgram && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{selectedProgram.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedProgram.institution?.name} • {selectedProgram.institution?.state}
                            </p>
                          </div>
                          <Link
                            href={`/programs/${selectedProgram.id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAdd} disabled={!programId} className="w-full">
                    Add to Watchlist
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Bulk Add Dialog */}
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Bulk Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Add Programs</DialogTitle>
                  <DialogDescription>
                    Search and select multiple programs to add to your watchlist
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2 relative" ref={programDropdownRef}>
                    <label className="text-sm font-medium">Search Programs</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={programSearch}
                        onChange={(e) => {
                          setProgramSearch(e.target.value)
                          setShowProgramDropdown(true)
                        }}
                        onFocus={() => setShowProgramDropdown(true)}
                        placeholder="Search for programs..."
                        className="pl-10"
                      />
                    </div>

                    {showProgramDropdown && programSearch && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                        {programsLoading ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Searching...
                          </div>
                        ) : programs.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No programs found
                          </div>
                        ) : (
                          <div className="p-1">
                            {programs.map((program: any) => {
                              const isSelected = bulkPrograms.some((p) => p.id === program.id)
                              return (
                                <button
                                  key={program.id}
                                  onClick={() => {
                                    if (isSelected) {
                                      setBulkPrograms(bulkPrograms.filter((p) => p.id !== program.id))
                                    } else {
                                      setBulkPrograms([...bulkPrograms, program])
                                    }
                                  }}
                                  className={`w-full text-left p-3 rounded-sm hover:bg-accent transition-colors ${
                                    isSelected ? "bg-accent" : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <Checkbox checked={isSelected} />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{program.name}</p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {program.institution?.name}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {bulkPrograms.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Selected Programs ({bulkPrograms.length})
                      </label>
                      <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                        {bulkPrograms.map((program) => (
                          <div
                            key={program.id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{program.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {program.institution?.name}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setBulkPrograms(bulkPrograms.filter((p) => p.id !== program.id))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleBulkAdd}
                    disabled={bulkPrograms.length === 0}
                    className="w-full"
                  >
                    Add {bulkPrograms.length > 0 ? `${bulkPrograms.length} ` : ""}Program(s)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
          ) : watchlist.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No programs in watchlist</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking programs you&apos;re interested in
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Program
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Analytics */}
                <div className="lg:col-span-2">
                  <WatchlistAnalytics watchlistItems={watchlist} />
                </div>

                {/* Deadline Reminders */}
                <div>
                  <DeadlineReminders watchlistItems={watchlist} />
                </div>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Tracked Programs ({watchlist.length})</CardTitle>
                      <CardDescription>
                        Programs you&apos;re monitoring for admission
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        <CheckSquare className="h-4 w-4 mr-2" />
                        {selectedItems.size === watchlist.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedItems.size === watchlist.length && watchlist.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Institution</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {watchlist.map((item) => {
                      const deadline = (item.program as any).applicationDeadline
                      const daysRemaining = deadline
                        ? Math.ceil(
                            (new Date(deadline).getTime() - new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        : null
                      const isOverdue = deadline && new Date(deadline) < new Date()
                      const isUrgent = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7

                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={() => handleToggleSelect(item.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <Link
                              href={`/programs/${item.program.id}`}
                              className="text-primary hover:underline"
                            >
                              {item.program.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/institutions/${item.program.institution.id}`}
                              className="text-muted-foreground hover:underline"
                            >
                              {item.program.institution.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.program.institution.state}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {deadline ? (
                              <div className="flex items-center gap-2">
                                <Calendar className={`h-4 w-4 ${isUrgent ? "text-red-500" : isOverdue ? "text-muted-foreground" : "text-muted-foreground"}`} />
                                <div>
                                  <p className={`text-sm ${isUrgent ? "font-semibold text-red-600" : isOverdue ? "text-muted-foreground line-through" : ""}`}>
                                    {new Date(deadline).toLocaleDateString("en-NG", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </p>
                                  {isOverdue ? (
                                    <p className="text-xs text-red-600">Overdue</p>
                                  ) : daysRemaining !== null && daysRemaining > 0 ? (
                                    <p className={`text-xs ${isUrgent ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                                      {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.priority === "high"
                                  ? "destructive"
                                  : item.priority === "medium"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {item.priority || "medium"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.notes ? (
                              <div className="max-w-xs">
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {item.notes}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <WatchlistNotes
                                watchlistItemId={item.id}
                                currentNotes={item.notes}
                                onUpdate={fetchWatchlist}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            </>
          )}
            </TabsContent>

            <TabsContent value="institutions" className="space-y-6">
              <div className="flex gap-2 flex-wrap justify-end">
                {selectedInstitutionItems.size > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleBulkDeleteInstitutions}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedInstitutionItems.size})
                  </Button>
                )}
                <Dialog open={institutionDialogOpen} onOpenChange={setInstitutionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Institution
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Institution to Watchlist</DialogTitle>
                      <DialogDescription>
                        Search and add an institution to track
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2 relative" ref={institutionDropdownRef}>
                        <label className="text-sm font-medium">Select Institution</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            value={institutionSearch}
                            onChange={(e) => {
                              setInstitutionSearch(e.target.value)
                              setShowInstitutionDropdown(true)
                              if (!e.target.value) {
                                handleClearInstitution()
                              }
                            }}
                            onFocus={() => setShowInstitutionDropdown(true)}
                            placeholder="Search for an institution (e.g., University of Lagos, UNN...)"
                            className="pl-10 pr-10"
                          />
                          {selectedInstitution && (
                            <button
                              onClick={handleClearInstitution}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {showInstitutionDropdown && institutionSearch && (
                          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                            {institutionsLoading ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                Searching...
                              </div>
                            ) : institutions.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No institutions found. Try a different search term.
                              </div>
                            ) : (
                              <div className="p-1">
                                {institutions.map((institution: any) => (
                                  <button
                                    key={institution.id}
                                    onClick={() => handleSelectInstitution(institution)}
                                    className="w-full text-left p-3 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                  >
                                    <div className="flex items-start gap-2">
                                      <Building2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{institution.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="outline" className="text-xs">
                                            {institution.type}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            {institution.ownership}
                                          </Badge>
                                          <p className="text-xs text-muted-foreground truncate">
                                            {institution.state}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {selectedInstitution && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{selectedInstitution.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {selectedInstitution.type} • {selectedInstitution.ownership} • {selectedInstitution.state}
                                </p>
                              </div>
                              <Link
                                href={`/institutions/${selectedInstitution.id}`}
                                className="text-xs text-primary hover:underline"
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Priority</label>
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddInstitution} disabled={!institutionId} className="w-full">
                        Add to Watchlist
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
              ) : institutionWatchlist.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No institutions in watchlist</h3>
                    <p className="text-muted-foreground mb-4">
                      Start tracking institutions you&apos;re interested in
                    </p>
                    <Button onClick={() => setInstitutionDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Institution
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Tracked Institutions ({institutionWatchlist.length})</CardTitle>
                        <CardDescription>
                          Institutions you&apos;re monitoring
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllInstitutions}
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          {selectedInstitutionItems.size === institutionWatchlist.length ? "Deselect All" : "Select All"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedInstitutionItems.size === institutionWatchlist.length && institutionWatchlist.length > 0}
                              onCheckedChange={handleSelectAllInstitutions}
                            />
                          </TableHead>
                          <TableHead>Institution</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Ownership</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Added</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {institutionWatchlist.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedInstitutionItems.has(item.id)}
                                onCheckedChange={() => handleToggleSelectInstitution(item.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <Link
                                href={`/institutions/${item.institution.id}`}
                                className="text-primary hover:underline"
                              >
                                {item.institution.name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.institution.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {item.institution.ownership}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.institution.state}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.priority === "high"
                                    ? "destructive"
                                    : item.priority === "medium"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {item.priority || "medium"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.notes ? (
                                <div className="max-w-xs">
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {item.notes}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <WatchlistNotes
                                  watchlistItemId={item.id}
                                  currentNotes={item.notes}
                                  onUpdate={fetchWatchlist}
                                  isInstitution={true}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteInstitution(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}

