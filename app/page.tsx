import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import {
  Users,
  Calculator,
  Sparkles,
  BarChart3,
  Download,
  Code,
  TrendingUp,
  Clock,
  Award,
  ArrowRight,
} from "lucide-react"

async function getStats() {
  try {
    const [institutionsRes, programsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/institutions?limit=1`, {
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/programs?limit=1`, {
        cache: "no-store",
      }),
    ])

    const institutionsData = institutionsRes.ok ? await institutionsRes.json() : null
    const programsData = programsRes.ok ? await programsRes.json() : null

    return {
      institutions: institutionsData?.pagination?.total || 0,
      programs: programsData?.pagination?.total || 0,
    }
  } catch (error) {
    console.error("Error fetching stats:", error)
    return {
      institutions: 0,
      programs: 0,
    }
  }
}

export default async function HomePage() {
  const stats = await getStats()
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Highlights/Important Information Section */}
        <section className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">2025/2026 Admission Season</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                  <Award className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    {stats.institutions > 0 ? `${stats.institutions.toLocaleString()}+` : "800+"} Institutions Available
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Check Application Deadlines</span>
                </div>
              </div>
              <Link href="/recommendations">
                <Button size="sm" variant="default" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Get AI Recommendations
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5 py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm">
                <span className="text-2xl">🇳🇬</span>
                <span className="font-medium">Made for Nigerian Students</span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Your AI-Powered
                <span className="block text-primary">Admission Guide</span>
              </h1>

              <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:text-2xl">
                Calculate admission probability, discover the right institutions, and get
                personalized AI recommendations for your tertiary education journey.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/calculator">
                  <Button size="lg" className="w-full sm:w-auto">
                    Calculate Eligibility
                  </Button>
                </Link>
                <Link href="/institutions">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Browse Institutions
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Everything You Need for Admission Success
              </h2>
              <p className="text-lg text-muted-foreground">
                Comprehensive tools and data to help you make informed admission decisions
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Institution Registry</CardTitle>
                  <CardDescription>
                    Centralized database of all Nigerian higher institutions with verified data
                    and quality scoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/institutions">
                    <Button variant="ghost" className="w-full">
                      Explore Institutions →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Eligibility Calculator</CardTitle>
                  <CardDescription>
                    Calculate admission probability from JAMB + O-level scores with confidence
                    intervals and trend analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/calculator">
                    <Button variant="ghost" className="w-full">
                      Calculate Now →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>AI Guidance</CardTitle>
                  <CardDescription>
                    Personalized recommendations with explainable AI, helping you identify
                    safety, target, and reach schools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/calculator">
                    <Button variant="ghost" className="w-full">
                      Get Recommendations →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Historical Analytics</CardTitle>
                  <CardDescription>
                    Visualize trends in admission cutoffs over 5-10 years to understand
                    patterns and make better predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/analytics">
                    <Button variant="ghost" className="w-full">
                      View Analytics →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Data Export</CardTitle>
                  <CardDescription>
                    Download datasets in JSON or CSV formats for research and analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/analytics">
                    <Button variant="ghost" className="w-full">
                      Export Data →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Open API</CardTitle>
                  <CardDescription>
                    Developer-friendly REST API for building your own applications and
                    research tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/api/docs">
                    <Button variant="ghost" className="w-full">
                      View API Docs →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stats.institutions > 0 ? stats.institutions.toLocaleString() : "800+"}
                </div>
                <div className="text-sm text-muted-foreground">Institutions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stats.programs > 0 ? stats.programs.toLocaleString() : "180+"}
                </div>
                <div className="text-sm text-muted-foreground">Programs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">5+</div>
                <div className="text-sm text-muted-foreground">Years of Data</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">AI</div>
                <div className="text-sm text-muted-foreground">Powered</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl mb-4">Ready to Start Your Journey?</CardTitle>
                <CardDescription className="text-lg">
                  Calculate your admission probability and discover the best institutions for you
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/calculator">
                  <Button size="lg">Get Started Free</Button>
                </Link>
                <Link href="/institutions">
                  <Button size="lg" variant="outline">
                    Browse Institutions
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
