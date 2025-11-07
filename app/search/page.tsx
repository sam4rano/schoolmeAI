"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { Button } from "@/components/ui/button"
import { SearchAutocomplete } from "@/components/search-autocomplete"
import { useInstitutions } from "@/lib/hooks/use-institutions"
import { usePrograms } from "@/lib/hooks/use-programs"
import Link from "next/link"
import { Building2, GraduationCap } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [activeTab, setActiveTab] = useState("institutions")

  const { data: institutionsData, isLoading: institutionsLoading } = useInstitutions({
    query: query || undefined,
    limit: 10,
  })

  const { data: programsData, isLoading: programsLoading } = usePrograms({
    query: query || undefined,
    limit: 10,
  })

  const institutions = institutionsData?.data || []
  const programs = programsData?.data || []

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Search</h1>
          <p className="text-muted-foreground">
            Search for institutions and programs across Nigeria
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <SearchAutocomplete
              placeholder="Search institutions, programs, or courses..."
              showResults={true}
              className="w-full"
            />
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="institutions">
              <Building2 className="mr-2 h-4 w-4" />
              Institutions ({institutions.length})
            </TabsTrigger>
            <TabsTrigger value="programs">
              <GraduationCap className="mr-2 h-4 w-4" />
              Programs ({programs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="institutions" className="mt-6">
            {institutionsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-9 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : institutions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {query ? "No institutions found." : "Start typing to search..."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {institutions.map((institution: any) => (
                  <Card key={institution.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{institution.name}</CardTitle>
                          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{institution.type}</Badge>
                            <Badge variant="outline">{institution.ownership}</Badge>
                            <Badge variant="outline">{institution.state}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/institutions/${institution.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="programs" className="mt-6">
            {programsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-9 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : programs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {query ? "No programs found." : "Start typing to search..."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {programs.map((program: any) => (
                  <Card key={program.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{program.name}</CardTitle>
                          <CardDescription className="mt-2">
                            {program.institution?.name} • {program.institution?.type} • {program.institution?.state}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/programs/${program.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}


