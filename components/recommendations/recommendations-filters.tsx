"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Info, Share2, Download, Copy } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { NIGERIAN_STATES_WITH_ABUJA } from "@/lib/constants/nigerian-states"

interface RecommendationsFiltersProps {
  filters: {
    state: string
    institutionType: string
    category: string
    minProbability: string
  }
  setFilters: (filters: any) => void
  showRankingExplanation: boolean
  setShowRankingExplanation: (show: boolean) => void
  onShare: () => void
  onCopyLink: () => void
  onExport: () => void
}

export function RecommendationsFilters({
  filters,
  setFilters,
  showRankingExplanation,
  setShowRankingExplanation,
  onShare,
  onCopyLink,
  onExport,
}: RecommendationsFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Filters & Actions
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={showRankingExplanation} onOpenChange={setShowRankingExplanation}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4 mr-2" />
                  How Ranking Works
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>How Recommendations Are Ranked</DialogTitle>
                  <DialogDescription>
                    Understanding how we calculate and rank program recommendations
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold mb-2">1. Composite Score Calculation</h3>
                    <p className="text-muted-foreground">
                      Your composite score combines your UTME score (60%), O-level grades (40%), and optionally Post-UTME score.
                      The formula: <code className="bg-muted px-1 rounded">Composite = 0.6 × UTME + 0.4 × O-level</code>
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">2. Probability Estimation</h3>
                    <p className="text-muted-foreground">
                      We use historical cutoff data and logistic regression to estimate your admission probability for each program.
                      Programs with more historical data provide more accurate estimates.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">3. Category Classification</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li><strong>Safe:</strong> High probability (≥70%) - Programs you&apos;re likely to get admitted to</li>
                      <li><strong>Target:</strong> Moderate probability (40-70%) - Programs that match your scores</li>
                      <li><strong>Reach:</strong> Lower probability (30-40%) - Programs that are challenging but possible</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">4. Ranking Order</h3>
                    <p className="text-muted-foreground">
                      Programs are sorted by:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                      <li>Admission probability (highest first)</li>
                      <li>Category (Safe → Target → Reach)</li>
                      <li>Institution reputation and data quality</li>
                    </ol>
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Note</AlertTitle>
                    <AlertDescription>
                      Recommendations are based on historical data and statistical models. Actual admission decisions depend on many factors including competition, quotas, and institutional policies.
                    </AlertDescription>
                  </Alert>
                </div>
              </DialogContent>
            </Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share via...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5">State</label>
            <Select
              value={filters.state || "all"}
              onValueChange={(value) => setFilters({ ...filters, state: value === "all" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {NIGERIAN_STATES_WITH_ABUJA.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Institution Type</label>
            <Select
              value={filters.institutionType || "all"}
              onValueChange={(value) => setFilters({ ...filters, institutionType: value === "all" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="university">University</SelectItem>
                <SelectItem value="polytechnic">Polytechnic</SelectItem>
                <SelectItem value="college">College</SelectItem>
                <SelectItem value="school_of_nursing">School of Nursing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Category</label>
            <Select
              value={filters.category || "all"}
              onValueChange={(value) => setFilters({ ...filters, category: value === "all" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
                <SelectItem value="target">Target</SelectItem>
                <SelectItem value="reach">Reach</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Min Probability (%)</label>
            <Select
              value={filters.minProbability || "all"}
              onValueChange={(value) => setFilters({ ...filters, minProbability: value === "all" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="30">30%</SelectItem>
                <SelectItem value="40">40%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="60">60%</SelectItem>
                <SelectItem value="70">70%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

