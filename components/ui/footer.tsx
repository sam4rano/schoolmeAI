import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇳🇬</span>
              <span className="text-lg font-bold">edurepoAI.xyz</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered educational repository and guidance system for Nigerian tertiary admissions.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/institutions" className="text-muted-foreground hover:text-primary">
                  Institutions
                </Link>
              </li>
              <li>
                <Link href="/calculator" className="text-muted-foreground hover:text-primary">
                  Calculator
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-muted-foreground hover:text-primary">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/comparison" className="text-muted-foreground hover:text-primary">
                  Comparison
                </Link>
              </li>
              <li>
                <Link href="/api/docs" className="text-muted-foreground hover:text-primary">
                  API Docs
                </Link>
              </li>
              <li>
                <Link href="/legal" className="text-muted-foreground hover:text-primary">
                  Legal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">About</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/sam4rano/edurepoAI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/sam4rano/edurepoAI/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© 2025 edurepoAI.xyz. Built with ❤️ for Nigerian students.</p>
        </div>
      </div>
    </footer>
  )
}


