import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Library,
  FileText,
  Search,
  Users,
  Shield,
  ArrowRight,
} from "lucide-react";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-md">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">HeroStack</span>
          </Link>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Button asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Your Knowledge,
            <br />
            <span className="text-primary">Beautifully Organized</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            HeroStack is a self-hosted documentation platform that helps teams
            organize, write, and share knowledge with ease.
          </p>
          <div className="flex gap-4 justify-center">
            {isLoggedIn ? (
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/register">
                    Start for Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need for documentation
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg border">
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-4">
                <Library className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Hierarchical Organization
              </h3>
              <p className="text-muted-foreground">
                Organize content into Shelves, Books, Chapters, and Pages for
                intuitive navigation and structure.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg border">
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rich Text Editor</h3>
              <p className="text-muted-foreground">
                Write beautiful documentation with our WYSIWYG editor supporting
                Markdown, code blocks, and images.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg border">
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Powerful Search
              </h3>
              <p className="text-muted-foreground">
                Find anything instantly with full-text search across all your
                documentation.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg border">
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Work together with role-based permissions for admins, editors,
                and viewers.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg border">
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Self-Hosted</h3>
              <p className="text-muted-foreground">
                Keep full control of your data. Deploy on your own
                infrastructure with Docker.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg border">
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Revision History</h3>
              <p className="text-muted-foreground">
                Track changes with full revision history. Never lose important
                updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {isLoggedIn ? "Continue where you left off" : "Ready to get started?"}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            {isLoggedIn
              ? "Head back to your dashboard and keep building your knowledge base."
              : "Create your account and start organizing your knowledge today."}
          </p>
          <Button size="lg" asChild>
            <Link href={isLoggedIn ? "/dashboard" : "/register"}>
              {isLoggedIn ? "Go to Dashboard" : "Create Free Account"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 HeroStack. Open source documentation platform.</p>
        </div>
      </footer>
    </div>
  );
}
