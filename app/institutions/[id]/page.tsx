import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { Separator } from "@/components/ui/separator"
import { ReviewForm } from "@/components/reviews/review-form"
import { ReviewList } from "@/components/reviews/review-list"
import { InstitutionProgramsList } from "@/components/institutions/institution-programs-list"
import { InstitutionStatistics } from "@/components/institutions/institution-statistics"
import { InstitutionMap } from "@/components/institutions/institution-map"
import { InstitutionContact } from "@/components/institutions/institution-contact"
import { InstitutionWatchlistButton } from "@/components/institution-watchlist-button"
import Link from "next/link"
import { DollarSign, Calendar, Info } from "lucide-react"

function FeesScheduleDisplay({ fees, website }: { fees: any; website?: string | null }) {
  if (!fees) return null

  const schedule = fees.schedule || []
  const lastUpdated = fees.lastUpdated
  const source = fees.source
  const currency = fees.currency || "NGN"

  if (schedule.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Fees schedule information is not available at this time.</p>
        {website && (
          <p className="text-sm mt-2">
            Please check the{" "}
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              official website
            </a>{" "}
            for current fees information.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {lastUpdated && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Last updated: {new Date(lastUpdated).toLocaleDateString()}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-semibold">Program/Level</th>
              <th className="text-left p-3 font-semibold">Amount</th>
              <th className="text-left p-3 font-semibold">Period</th>
              {schedule.some((item: any) => item.breakdown) && (
                <th className="text-left p-3 font-semibold">Breakdown</th>
              )}
            </tr>
          </thead>
          <tbody>
            {schedule.map((item: any, index: number) => (
              <tr key={index} className="border-b hover:bg-muted/50">
                <td className="p-3">
                  <div>
                    {item.program && (
                      <div className="font-medium">{item.program}</div>
                    )}
                    {item.level && (
                      <div className="text-sm text-muted-foreground">
                        Level {item.level}
                      </div>
                    )}
                    {item.degreeType && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {item.degreeType}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-semibold">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: item.currency || currency,
                      minimumFractionDigits: 0,
                    }).format(item.amount || 0)}
                  </div>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {item.per_year ? "Per Year" : item.period || "One-time"}
                </td>
                {schedule.some((i: any) => i.breakdown) && (
                  <td className="p-3">
                    {item.breakdown ? (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-primary hover:underline">
                          View breakdown
                        </summary>
                        <div className="mt-2 space-y-1 pl-4">
                          {typeof item.breakdown === "object" ? (
                            Object.entries(item.breakdown).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-medium">
                                  {new Intl.NumberFormat("en-NG", {
                                    style: "currency",
                                    currency: item.currency || currency,
                                    minimumFractionDigits: 0,
                                  }).format(value)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span>{item.breakdown}</span>
                          )}
                        </div>
                      </details>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {source && (
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>
            Source:{" "}
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {source.name || source.url}
              </a>
            ) : (
              source.name || "Official website"
            )}
          </p>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">Important Note:</p>
            <p>
              Fees are subject to change. Please verify current fees with the institution before
              making any payments. This information is provided for reference only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

async function getInstitution(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/institutions/${id}`,
      { cache: "no-store" }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch (error) {
    console.error("Error fetching institution:", error)
    return null
  }
}

export default async function InstitutionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const institution = await getInstitution(params.id)

  if (!institution) {
    notFound()
  }

  const contact = institution.contact as any
  const socialMedia = contact?.socialMedia || null

  return (
    <div className="flex min-h-screen flex-col">
      <div className="no-print">
        <Navbar />
      </div>
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-8 no-print">
          <Link href="/institutions">
            <Button variant="ghost" size="sm">
              ← Back to Institutions
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl">{institution.name}</CardTitle>
                    <CardDescription>
                      {institution.type} • {institution.ownership} • {institution.state}
                    </CardDescription>
                  </div>
                  <InstitutionWatchlistButton institutionId={institution.id} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {institution.accreditationStatus && (
                  <div>
                    <h3 className="font-semibold mb-2">Accreditation Status</h3>
                    <Badge
                      variant={
                        institution.accreditationStatus === "Full"
                          ? "default"
                          : institution.accreditationStatus === "Interim"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {institution.accreditationStatus}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Programs List */}
            <InstitutionProgramsList
              institutionId={institution.id}
              institutionName={institution.name}
            />

            {/* Statistics */}
            <InstitutionStatistics institutionId={institution.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <InstitutionContact
              name={institution.name}
              website={institution.website}
              email={contact?.email}
              phone={contact?.phone}
              address={contact?.address}
              city={institution.city}
              state={institution.state}
              socialMedia={socialMedia}
            />

            {/* Map */}
            <InstitutionMap
              name={institution.name}
              city={institution.city}
              state={institution.state}
              address={contact?.address}
            />
          </div>
        </div>

        {/* Fees Schedule Section */}
        <div id="fees" className="mt-6">
          {(institution.tuitionFees || institution.feesSchedule) ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <CardTitle>Tuition Fees Schedule</CardTitle>
                </div>
                <CardDescription>
                  School fees and charges for {institution.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeesScheduleDisplay 
                  fees={institution.tuitionFees || institution.feesSchedule} 
                  website={institution.website}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Tuition Fees Schedule</CardTitle>
                </div>
                <CardDescription>
                  Fees information for {institution.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Fees schedule information is not available at this time.</p>
                  {institution.website && (
                    <p className="text-sm mt-2">
                      Please check the{" "}
                      <a
                        href={institution.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        official website
                      </a>{" "}
                      for current fees information.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mt-8 space-y-6 no-print">
          <Card>
            <CardHeader>
              <CardTitle>Write a Review</CardTitle>
              <CardDescription>
                Share your experience with this institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewForm
                entityType="institution"
                entityId={institution.id}
                onSuccess={() => {
                  // Refresh reviews list
                  if (typeof window !== "undefined") {
                    window.location.reload()
                  }
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <ReviewList entityType="institution" entityId={institution.id} />
            </CardContent>
          </Card>
        </div>
      </main>
      <div className="no-print">
        <Footer />
      </div>
    </div>
  )
}

