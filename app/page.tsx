import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"

export const dynamic = 'force-dynamic'
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
  Newspaper,
} from "lucide-react"

async function getStats() {
  try {
    const [institutionsRes, programsRes, reviewsRes, newsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/institutions?limit=1`, {
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/programs?limit=1`, {
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/reviews?limit=1`, {
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/news?limit=6&featured=true`, {
        cache: "no-store",
      }),
    ])

    const institutionsData = institutionsRes.ok ? await institutionsRes.json() : null
    const programsData = programsRes.ok ? await programsRes.json() : null
    const reviewsData = reviewsRes.ok ? await reviewsRes.json() : null
    const newsData = newsRes.ok ? await newsRes.json() : null

    return {
      institutions: institutionsData?.pagination?.total || 0,
      programs: programsData?.pagination?.total || 0,
      reviews: reviewsData?.pagination?.total || 0,
      news: newsData?.data || [],
    }
  } catch (error) {
    console.error("Error fetching stats:", error)
    return {
      institutions: 0,
      programs: 0,
      reviews: 0,
      news: [],
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
        <section className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 py-3 sm:py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary/20 border border-primary/30">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-primary whitespace-nowrap">2025/2026 Admission Season</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                  <Award className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400 whitespace-nowrap">
                    {stats.institutions > 0 ? `${stats.institutions.toLocaleString()}+` : "800+"} Institutions
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap hidden sm:inline">Check Deadlines</span>
                  <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap sm:hidden">Deadlines</span>
                </div>
              </div>
              <Link href="/recommendations" className="w-full sm:w-auto">
                <Button size="sm" variant="default" className="gap-2 w-full sm:w-auto">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Get AI Recommendations</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:inline" />
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

              <h1 className="mb-4 sm:mb-6 text-3xl sm:text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl xl:text-7xl">
                Your AI-Powered
                <span className="block text-primary">Admission Guide</span>
              </h1>

              <p className="mb-6 sm:mb-8 text-base sm:text-lg text-muted-foreground md:text-xl lg:text-2xl px-4 sm:px-0">
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

        {/* How It Works Section - Horizontal Timeline Style */}
        <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
              <Badge className="mb-4" variant="outline">Simple Process</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight md:text-5xl mb-4">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Get personalized admission guidance in three simple steps
              </p>
            </div>
            <div className="max-w-5xl mx-auto">
              {/* Step 1 */}
              <div className="flex flex-col md:flex-row items-center gap-8 mb-12 md:mb-16">
                <div className="flex-shrink-0 w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                  <span className="text-5xl font-bold text-white">1</span>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-3">Enter Your Scores</h3>
                  <p className="text-muted-foreground text-lg">
                    Input your UTME score and O-level grades. Our system will calculate your composite score automatically.
                  </p>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="flex flex-col md:flex-row-reverse items-center gap-8 mb-12 md:mb-16">
                <div className="flex-shrink-0 w-32 h-32 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <span className="text-5xl font-bold text-white">2</span>
                </div>
                <div className="flex-1 text-center md:text-right">
                  <h3 className="text-2xl font-bold mb-3">Get AI Recommendations</h3>
                  <p className="text-muted-foreground text-lg">
                    Our AI analyzes your scores and recommends suitable institutions categorized as safety, target, or reach schools.
                  </p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0 w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-5xl font-bold text-white">3</span>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-3">Make Informed Decisions</h3>
                  <p className="text-muted-foreground text-lg">
                    Compare programs, track deadlines, and use historical data to make the best admission choices.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Asymmetric Grid */}
        <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-background via-muted/20 to-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight md:text-5xl mb-4">
                Everything You Need for Admission Success
              </h2>
              <p className="text-lg text-muted-foreground">
                Comprehensive tools and data to help you make informed admission decisions
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
              {/* Feature 1 - Large Card */}
              <Card className="sm:col-span-2 lg:col-span-1 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <CardHeader>
                  <div className="mb-4 h-16 w-16 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-2">Institution Registry</CardTitle>
                  <CardDescription className="text-base">
                    Centralized database of all Nigerian higher institutions with verified data and quality scoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/institutions">
                    <Button className="w-full" size="lg">
                      Explore Institutions →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="mb-4 h-14 w-14 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Calculator className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-lg">Eligibility Calculator</CardTitle>
                  <CardDescription>
                    Calculate admission probability from JAMB + O-level scores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/calculator">
                    <Button variant="outline" className="w-full border-green-500/30">
                      Calculate Now →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="mb-4 h-14 w-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Sparkles className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-lg">AI Guidance</CardTitle>
                  <CardDescription>
                    Personalized recommendations with explainable AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/calculator">
                    <Button variant="outline" className="w-full border-purple-500/30">
                      Get Recommendations →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="mb-4 h-14 w-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <BarChart3 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-lg">Historical Analytics</CardTitle>
                  <CardDescription>
                    Visualize trends in admission cutoffs over years
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/analytics">
                    <Button variant="outline" className="w-full border-blue-500/30">
                      View Analytics →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="mb-4 h-14 w-14 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Download className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle className="text-lg">Data Export</CardTitle>
                  <CardDescription>
                    Download datasets in JSON or CSV formats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/analytics">
                    <Button variant="outline" className="w-full border-orange-500/30">
                      Export Data →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="sm:col-span-2 lg:col-span-1 border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="mb-4 h-14 w-14 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <Code className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-lg">Open API</CardTitle>
                  <CardDescription>
                    Developer-friendly REST API for building applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/api/docs">
                    <Button variant="outline" className="w-full border-indigo-500/30">
                      View API Docs →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section - Quote Style */}
        <section className="py-16 sm:py-24 lg:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
              <Badge className="mb-4" variant="secondary">Student Reviews</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight md:text-5xl mb-4">
                What Students Say
              </h2>
              <p className="text-lg text-muted-foreground">
                Real feedback from students who used our platform
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-6xl mx-auto">
              <div className="bg-background border-2 border-primary/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">A</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Adebayo T.</h3>
                    <p className="text-xs text-muted-foreground">Lagos State</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic leading-relaxed">
                  &quot;This platform helped me find the perfect program for my UTME score. The AI recommendations were spot-on, and I got admitted to my target school!&quot;
                </p>
              </div>
              <div className="bg-background border-2 border-green-500/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">C</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Chinwe O.</h3>
                    <p className="text-xs text-muted-foreground">Abia State</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic leading-relaxed">
                  &quot;The eligibility calculator is so accurate! It gave me confidence in my application choices. The comparison feature helped me weigh my options.&quot;
                </p>
              </div>
              <div className="bg-background border-2 border-blue-500/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">I</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Ibrahim M.</h3>
                    <p className="text-xs text-muted-foreground">Kano State</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic leading-relaxed">
                  &quot;I love how comprehensive the database is. Found programs I never knew existed. The historical cutoff data was invaluable for planning.&quot;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Card Style */}
        <section className="py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-5 max-w-6xl mx-auto">
              <div className="bg-background/80 backdrop-blur-sm border-2 border-primary/20 rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all hover:scale-105">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent mb-2">
                  {stats.institutions > 0 ? stats.institutions.toLocaleString() : "800+"}
                </div>
                <div className="text-sm font-medium text-muted-foreground">Institutions</div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm border-2 border-green-500/20 rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all hover:scale-105">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-br from-green-600 to-green-500 bg-clip-text text-transparent mb-2">
                  {stats.programs > 0 ? stats.programs.toLocaleString() : "1,800+"}
                </div>
                <div className="text-sm font-medium text-muted-foreground">Programs</div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm border-2 border-blue-500/20 rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all hover:scale-105">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-br from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">
                  {stats.reviews > 0 ? stats.reviews.toLocaleString() : "100+"}
                </div>
                <div className="text-sm font-medium text-muted-foreground">Reviews</div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm border-2 border-purple-500/20 rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all hover:scale-105">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-br from-purple-600 to-purple-500 bg-clip-text text-transparent mb-2">5+</div>
                <div className="text-sm font-medium text-muted-foreground">Years of Data</div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm border-2 border-orange-500/20 rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all hover:scale-105">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-br from-orange-600 to-orange-500 bg-clip-text text-transparent mb-2">AI</div>
                <div className="text-sm font-medium text-muted-foreground">Powered</div>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories Section - Highlight Cards */}
        <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-muted/30 via-background to-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
              <Badge className="mb-4" variant="default">Success Stories</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight md:text-5xl mb-4">
                Real Students, Real Results
              </h2>
              <p className="text-lg text-muted-foreground">
                Students who achieved their admission goals using our platform
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-2xl font-bold text-white">AT</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Adebayo T.</h3>
                    <p className="text-sm text-muted-foreground">University of Lagos</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  &quot;Used the eligibility calculator and got admitted to my dream program. The AI recommendations were spot-on!&quot;
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-primary/20 text-primary border-primary/30">Computer Science</Badge>
                  <span className="text-xs text-muted-foreground font-medium">UTME: 280</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-2 border-green-500/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-2xl font-bold text-white">CO</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Chinwe O.</h3>
                    <p className="text-sm text-muted-foreground">University of Ibadan</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  &quot;The comparison feature helped me choose between multiple programs. Got admitted to my target school!&quot;
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">Medicine</Badge>
                  <span className="text-xs text-muted-foreground font-medium">UTME: 320</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-2 border-blue-500/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 md:col-span-2 lg:col-span-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-2xl font-bold text-white">IM</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Ibrahim M.</h3>
                    <p className="text-sm text-muted-foreground">Ahmadu Bello University</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  &quot;The historical cutoff data was invaluable. Helped me make informed decisions and I got admitted!&quot;
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30">Engineering</Badge>
                  <span className="text-xs text-muted-foreground font-medium">UTME: 265</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Latest News Section - Magazine Style */}
        {stats.news && stats.news.length > 0 && (
          <section className="py-16 sm:py-24 lg:py-32 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
              <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-primary/30 bg-primary/10 px-5 py-2 text-sm font-medium">
                  <Newspaper className="h-4 w-4 text-primary" />
                  <span>Latest News</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight md:text-5xl mb-4">
                  Stay Updated
                </h2>
                <p className="text-lg text-muted-foreground">
                  Get the latest news about JAMB, Post UTME, admissions, NYSC, and more
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto mb-10">
                {stats.news.slice(0, 3).map((article: any, index: number) => (
                  <div
                    key={article.id}
                    className={`bg-background border-2 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 ${
                      index === 0
                        ? "md:col-span-2 lg:col-span-1 border-primary/30"
                        : "border-muted-foreground/20"
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge variant="default" className="text-xs">
                          {article.category}
                        </Badge>
                        {article.featured && (
                          <Badge variant="secondary" className="text-xs">Featured</Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-3 line-clamp-2">{article.title}</h3>
                      {article.excerpt && (
                        <p className="text-muted-foreground mb-4 line-clamp-3">
                          {article.excerpt}
                        </p>
                      )}
                      <Link href={`/news/${article.slug}`}>
                        <Button variant="outline" className="w-full">
                          Read More
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Link href="/news">
                  <Button size="lg" variant="default">
                    View All News
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section - Bold Design */}
        <section className="py-20 sm:py-28 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/60" />
          <div 
            className="absolute inset-0 opacity-20" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-xl sm:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
                Calculate your admission probability and discover the best institutions for you
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/calculator">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-14 px-8 text-lg font-semibold">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/institutions">
                  <Button size="lg" variant="outline" className="border-2 border-white text-primary hover:bg-white/10 hover:text-black h-12 sm:h-14 px-8 text-lg font-semibold">
                    Browse Institutions
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
