import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { WatchlistButton } from "@/components/watchlist-button"
import { ReviewForm } from "@/components/reviews/review-form"
import { ReviewList } from "@/components/reviews/review-list"
import Link from "next/link"
import {
  GraduationCap,
  Clock,
  BookOpen,
  TrendingUp,
  DollarSign,
  Briefcase,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react"

async function getProgram(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/programs/${id}`,
      { cache: "no-store" }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch (error) {
    console.error("Error fetching program:", error)
    return null
  }
}

export default async function ProgramDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const program = await getProgram(params.id)

  if (!program) {
    notFound()
  }

  const cutoffHistory = Array.isArray(program.cutoffHistory)
    ? program.cutoffHistory
    : []
  const admissionRequirements = program.admissionRequirements as any
  const tuitionFees = program.tuitionFees as any
  const careerProspects = program.careerProspects || []

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/programs">
            <Button variant="ghost" size="sm">
              ← Back to Programs
            </Button>
          </Link>
          <WatchlistButton programId={program.id} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{program.name}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground mt-1">
                      <span>{program.institution?.name}</span>
                      <Badge variant="outline">{program.institution?.type}</Badge>
                      <Badge variant="secondary">{program.institution?.state}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {program.description && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Description
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{program.description}</p>
                  </div>
                )}

                <Separator />

                {/* Program Details */}
                <div className="grid grid-cols-2 gap-4">
                  {program.degreeType && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <GraduationCap className="h-4 w-4" />
                        Degree Type
                      </h3>
                      <p className="text-muted-foreground">{program.degreeType}</p>
                    </div>
                  )}

                  {program.duration && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        Duration
                      </h3>
                      <p className="text-muted-foreground">{program.duration}</p>
                    </div>
                  )}

                  {program.faculty && (
                    <div>
                      <h3 className="font-semibold mb-2 text-sm">Faculty</h3>
                      <p className="text-muted-foreground">{program.faculty}</p>
                    </div>
                  )}

                  {program.department && (
                    <div>
                      <h3 className="font-semibold mb-2 text-sm">Department</h3>
                      <p className="text-muted-foreground">{program.department}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Application Deadline */}
                {program.applicationDeadline && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Application Deadline
                        </h3>
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                          {new Date(program.applicationDeadline).toLocaleDateString("en-NG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        {new Date(program.applicationDeadline) > new Date() ? (
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            {Math.ceil(
                              (new Date(program.applicationDeadline).getTime() - new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            days remaining
                          </p>
                        ) : (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            Deadline has passed
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Admission Requirements */}
                {(program.utmeSubjects?.length > 0 || admissionRequirements) && (
                  <div>
                    <h3 className="font-semibold mb-3">Admission Requirements</h3>
                    <div className="space-y-3">
                      {admissionRequirements?.jamb_score && (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <p className="text-sm font-medium">JAMB Score</p>
                          <p className="text-lg font-bold text-primary">
                            {admissionRequirements.jamb_score} and above
                          </p>
                        </div>
                      )}

                      {program.utmeSubjects && program.utmeSubjects.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Required UTME Subjects</p>
                          <div className="flex flex-wrap gap-2">
                            {program.utmeSubjects.map((subject: string, index: number) => (
                              <Badge key={index} variant="secondary">
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {program.olevelSubjects && program.olevelSubjects.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Required O-Level Subjects</p>
                          <div className="flex flex-wrap gap-2">
                            {program.olevelSubjects.map((subject: string, index: number) => (
                              <Badge key={index} variant="outline">
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {admissionRequirements?.olevel_requirements && (
                        <div>
                          <p className="text-sm font-medium mb-2">O-Level Requirements</p>
                          <p className="text-muted-foreground text-sm">
                            {admissionRequirements.olevel_requirements}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Cutoff History */}
                {cutoffHistory.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Cutoff History
                    </h3>
                    <div className="space-y-2">
                      {cutoffHistory
                        .sort((a: any, b: any) => b.year - a.year)
                        .map((cutoff: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 border rounded-md bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{cutoff.year}</span>
                              <span className="text-lg font-bold text-primary">
                                {cutoff.cutoff}
                              </span>
                            </div>
                            {cutoff.confidence && (
                              <p className="text-xs text-muted-foreground mt-1 capitalize">
                                Confidence: {cutoff.confidence}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Career Prospects */}
                {careerProspects.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Career Prospects
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {careerProspects.map((prospect: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {prospect}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Tuition Fees */}
                {tuitionFees && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Tuition Fees
                      </h3>
                      <div className="p-3 bg-muted/50 rounded-md">
                        {tuitionFees.amount && (
                          <p className="text-2xl font-bold text-primary">
                            {tuitionFees.currency || "₦"}{tuitionFees.amount.toLocaleString()}
                            {tuitionFees.per_year && " per year"}
                          </p>
                        )}
                        {tuitionFees.breakdown && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {JSON.stringify(tuitionFees.breakdown)}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {program.officialUrl && (
                  <>
                    <Separator />
                    <div>
                      <Link
                        href={program.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Official Program Page
                      </Link>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/calculator?programId=${program.id}`} className="w-full">
                  <Button className="w-full">Calculate Eligibility</Button>
                </Link>
                <Link href={`/watchlist?programId=${program.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    Add to Watchlist
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {program.accreditationStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Accreditation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="default" className="text-sm">
                    {program.accreditationStatus}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {program.dataQualityScore !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completeness</span>
                      <span className="text-sm font-medium">{program.dataQualityScore}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${program.dataQualityScore}%` }}
                      />
                    </div>
                    {program.missingFields && program.missingFields.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Missing:</p>
                        <div className="flex flex-wrap gap-1">
                          {program.missingFields.slice(0, 5).map((field: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Write a Review</CardTitle>
              <CardDescription>
                Share your experience with this program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewForm
                entityType="program"
                entityId={program.id}
                onSuccess={() => {
                  // Refresh reviews list
                  window.location.reload()
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <ReviewList entityType="program" entityId={program.id} />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}


