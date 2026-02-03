"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Kanban,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  Github,
  Twitter,
  Keyboard,
  Users,
  LayoutGrid,
  Moon,
  Sun,
  Menu,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Mail,
  MapPin,
  Clock,
  Calendar,
  Timer,
  Mic,
  BarChart3,
  Target,
  Repeat,
  GitBranch,
  FileText,
  Star,
  Quote,
  Send,
  Linkedin,
  ArrowUpRight,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "next-themes";

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  
  const isLoggedIn = status === "authenticated" && session?.user;

  useEffect(() => setMounted(true), []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thanks for reaching out! We'll get back to you soon.");
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/welcome" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Kanban className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">TaskFlow</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
              <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</Link>
              <Link href="#blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
              <Link href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
              <Link href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </div>

            <div className="flex items-center gap-3">
              {mounted && (
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="hidden md:flex">
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              )}
              {isLoggedIn ? (
                <Link href="/" className="hidden md:block">
                  <Button size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden md:block"><Button variant="ghost" size="sm">Sign In</Button></Link>
                  <Link href="/login" className="hidden md:block"><Button size="sm">Get Started<ArrowRight className="h-4 w-4" /></Button></Link>
                </>
              )}
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-3">
              <Link href="#features" className="block text-sm text-muted-foreground">Features</Link>
              <Link href="#pricing" className="block text-sm text-muted-foreground">Pricing</Link>
              <Link href="#testimonials" className="block text-sm text-muted-foreground">Testimonials</Link>
              <Link href="#blog" className="block text-sm text-muted-foreground">Blog</Link>
              <Link href="#faq" className="block text-sm text-muted-foreground">FAQ</Link>
              <Link href="#contact" className="block text-sm text-muted-foreground">Contact</Link>
              <div className="pt-3 border-t border-border/40 flex flex-col gap-2">
                {isLoggedIn ? (
                  <Link href="/"><Button className="w-full"><LayoutDashboard className="h-4 w-4 mr-1" />Go to Dashboard</Button></Link>
                ) : (
                  <>
                    <Link href="/login"><Button variant="ghost" className="w-full justify-start">Sign In</Button></Link>
                    <Link href="/login"><Button className="w-full">Get Started</Button></Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-60" />
          <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[100px]" />
          <div className="absolute top-60 right-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-8">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Task Management</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6">
              The Kanban board<br />
              <span className="bg-gradient-to-r from-primary via-sky-500 to-indigo-400 bg-clip-text text-transparent">you&apos;ll actually love</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Fast, privacy-focused, and beautifully minimal. TaskFlow combines the speed of Linear with the flexibility of Trello—powered by AI that respects your data.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {isLoggedIn ? (
                <Link href="/"><Button size="lg" className="w-full sm:w-auto text-base px-8 h-12"><LayoutDashboard className="h-5 w-5" />Go to Dashboard</Button></Link>
              ) : (
                <Link href="/login"><Button size="lg" className="w-full sm:w-auto text-base px-8 h-12">Start for Free<ArrowRight className="h-5 w-5" /></Button></Link>
              )}
              <Link href="https://github.com" target="_blank"><Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 h-12"><Github className="h-5 w-5" />View on GitHub</Button></Link>
            </div>

            {/* App Preview */}
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
              <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden">
                <div className="bg-background/80 border-b border-border/50 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 text-center text-sm text-muted-foreground">TaskFlow — Project Board</div>
                </div>
                <div className="p-6 bg-gradient-to-br from-background to-muted/30">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                        <div className="w-2 h-2 rounded-full bg-slate-500" />To Do<span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">3</span>
                      </div>
                      <MockCard title="Design landing page" labels={["design"]} color="purple" />
                      <MockCard title="Set up CI/CD pipeline" labels={["devops"]} color="blue" />
                      <MockCard title="Write documentation" labels={["docs"]} color="green" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />In Progress<span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">2</span>
                      </div>
                      <MockCard title="Implement auth flow" labels={["feature"]} color="orange" hasAI />
                      <MockCard title="Add drag & drop" labels={["feature"]} color="orange" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                        <div className="w-2 h-2 rounded-full bg-green-500" />Done<span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">2</span>
                      </div>
                      <MockCard title="Project setup" labels={["setup"]} color="slate" done />
                      <MockCard title="Database schema" labels={["backend"]} color="cyan" done />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-8">Trusted by developers at</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 hover:opacity-80 transition-opacity">
            {/* Vercel */}
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 22.525H0l12-21.05 12 21.05z"/></svg>
              <span className="text-lg font-semibold">Vercel</span>
            </div>
            {/* Supabase */}
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z"/></svg>
              <span className="text-lg font-semibold">Supabase</span>
            </div>
            {/* Stripe */}
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg>
              <span className="text-lg font-semibold">Stripe</span>
            </div>
            {/* Notion */}
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.906c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.046-.747.326-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.746 0-.933-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.933.653.933 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.448-1.632z"/></svg>
              <span className="text-lg font-semibold">Notion</span>
            </div>
            {/* Linear */}
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2.886 10.77a11.2 11.2 0 0 1 .124-1.228 10.8 10.8 0 0 1 .332-1.197A10.1 10.1 0 0 1 5.31 5.13a9.45 9.45 0 0 1 1.122-1.07c.398-.33.82-.63 1.262-.897a10.74 10.74 0 0 1 2.848-1.328A11.1 11.1 0 0 1 11.77.516c.413-.066.83-.108 1.248-.128L15.174.33l-.008 2.156a8.88 8.88 0 0 0-2.248.283 8.7 8.7 0 0 0-2.096.772 8.5 8.5 0 0 0-1.832 1.218 8.25 8.25 0 0 0-1.44 1.59A8.45 8.45 0 0 0 6.52 8.4a8.7 8.7 0 0 0-.576 2.152 8.9 8.9 0 0 0 0 2.248L2.89 10.77zM8.83 23.66l-.004-3.056a8.88 8.88 0 0 0 2.248-.283 8.7 8.7 0 0 0 2.096-.772 8.5 8.5 0 0 0 1.832-1.218 8.25 8.25 0 0 0 1.44-1.59 8.45 8.45 0 0 0 1.03-2.052 8.7 8.7 0 0 0 .576-2.152 8.9 8.9 0 0 0 0-2.248l3.054 2.03a11.2 11.2 0 0 1-.124 1.228 10.8 10.8 0 0 1-.332 1.197A10.1 10.1 0 0 1 18.69 18.87a9.45 9.45 0 0 1-1.122 1.07c-.398.33-.82.63-1.262.897a10.74 10.74 0 0 1-2.848 1.328 11.1 11.1 0 0 1-1.228.318c-.413.066-.83.108-1.248.128z"/></svg>
              <span className="text-lg font-semibold">Linear</span>
            </div>
            {/* Figma */}
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 0 0-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.098-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h.098c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.098z"/></svg>
              <span className="text-lg font-semibold">Figma</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs text-primary mb-4">Features</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need,<br />nothing you don&apos;t</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Built for developers and teams who value speed, privacy, and simplicity.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <FeatureCard icon={<Zap className="h-6 w-6" />} title="Lightning Fast" description="Optimistic updates and local-first architecture means zero waiting." />
            <FeatureCard icon={<Shield className="h-6 w-6" />} title="Privacy First" description="Your data stays yours. Self-host with SQLite, use local AI with Ollama." />
            <FeatureCard icon={<Sparkles className="h-6 w-6" />} title="AI-Powered" description="Auto-generate subtasks, summarize descriptions. Works offline with Ollama." />
            <FeatureCard icon={<Keyboard className="h-6 w-6" />} title="Keyboard First" description="Navigate and manage tasks without touching your mouse." />
            <FeatureCard icon={<Users className="h-6 w-6" />} title="Team Collaboration" description="Share boards, assign tasks, and track progress together." />
            <FeatureCard icon={<LayoutGrid className="h-6 w-6" />} title="Flexible Views" description="Kanban, list, and calendar views. Filter and sort your way." />
          </div>

          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-2">New in TaskFlow 2.0</h3>
            <p className="text-muted-foreground">Innovative features that set us apart</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard icon={<Target className="h-6 w-6" />} title="Focus Mode" description="Daily view with only today's tasks. Plan your day visually." isNew />
            <FeatureCard icon={<Timer className="h-6 w-6" />} title="Time Tracking" description="Built-in Pomodoro timer with logged history." isNew />
            <FeatureCard icon={<Mic className="h-6 w-6" />} title="Voice-to-Task" description="Dictate tasks using speech recognition and AI parsing." isNew />
            <FeatureCard icon={<BarChart3 className="h-6 w-6" />} title="Analytics" description="Velocity charts, completion rates, bottleneck detection." isNew />
            <FeatureCard icon={<Calendar className="h-6 w-6" />} title="Calendar View" description="Visualize tasks by due date. Drag to reschedule." isNew />
            <FeatureCard icon={<Repeat className="h-6 w-6" />} title="Recurring Tasks" description="Auto-create tasks daily, weekly, or monthly." isNew />
            <FeatureCard icon={<GitBranch className="h-6 w-6" />} title="Dependencies" description="Link tasks as blocked-by relationships." isNew />
            <FeatureCard icon={<FileText className="h-6 w-6" />} title="AI Standup" description="One-click daily reports from your activity log." isNew />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-32 bg-muted/30 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs text-primary mb-4">How It Works</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple by design</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Get started in seconds. No complex setup, no learning curve.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <StepCard number="01" title="Create a Board" description="Start fresh with a new project board. Customize columns to match your workflow." />
            <StepCard number="02" title="Add Your Tasks" description="Quickly add tasks with keyboard shortcuts. Let AI generate subtasks automatically." />
            <StepCard number="03" title="Ship It" description="Drag tasks through your workflow. Archive completed work and celebrate wins." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-32 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs text-primary mb-4">Pricing</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Free forever. Seriously.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">TaskFlow is open source. Self-host for free, or use our hosted version.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard title="Free" price="$0" description="Perfect for individuals" features={["Unlimited boards & tasks", "AI subtask generation", "All views", "Time tracking", "Community support"]} cta="Get Started" href="/login" />
            <PricingCard title="Pro" price="$9" period="/month" description="For power users" features={["Everything in Free", "Priority AI processing", "Advanced analytics", "Custom integrations", "Email support"]} cta="Coming Soon" href="#" highlighted disabled />
            <PricingCard title="Team" price="$29" period="/month" description="For growing teams" features={["Everything in Pro", "Real-time collaboration", "Team analytics", "SSO & SAML", "Dedicated support"]} cta="Coming Soon" href="#" disabled />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-32 bg-muted/30 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs text-primary mb-4">Testimonials</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by developers</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">See what our users are saying about TaskFlow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard quote="Finally, a Kanban tool that doesn't feel like enterprise bloatware. TaskFlow is exactly what I needed." author="Sarah Chen" role="Senior Developer @ Vercel" avatar="SC" />
            <TestimonialCard quote="The AI subtask generation is a game-changer. I break down complex tasks in seconds now." author="Marcus Johnson" role="Tech Lead @ Stripe" avatar="MJ" />
            <TestimonialCard quote="Privacy-first and open source? Yes please. I self-host TaskFlow and it just works." author="Elena Rodriguez" role="Indie Hacker" avatar="ER" />
            <TestimonialCard quote="The keyboard shortcuts are incredible. I haven't touched my mouse in weeks." author="David Kim" role="Staff Engineer @ Linear" avatar="DK" />
            <TestimonialCard quote="Switched from Trello and never looked back. The speed difference is night and day." author="Priya Patel" role="Founder @ StartupXYZ" avatar="PP" />
            <TestimonialCard quote="The focus mode feature has transformed my daily planning. I'm shipping faster than ever." author="James Wilson" role="Freelance Developer" avatar="JW" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatCard value="10K+" label="Active Users" />
            <StatCard value="500K+" label="Tasks Created" />
            <StatCard value="99.9%" label="Uptime" />
            <StatCard value="<50ms" label="Response Time" />
          </div>
        </div>
      </section>

      {/* Blog */}
      <section id="blog" className="py-20 md:py-32 bg-muted/30 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs text-primary mb-4">Blog</div>
              <h2 className="text-3xl md:text-4xl font-bold">Latest updates</h2>
            </div>
            <Link href="/blog" className="hidden md:flex items-center gap-2 text-sm text-primary hover:underline">View all posts<ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <BlogCard slug="introducing-taskflow-2" title="Introducing TaskFlow 2.0: Focus Mode & Time Tracking" excerpt="We're excited to announce our biggest update yet with Focus Mode, built-in time tracking, and AI-powered standup reports." date="Jan 30, 2026" category="Product" readTime="5 min read" />
            <BlogCard slug="voice-to-task-local-ai" title="How We Built Voice-to-Task with Local AI" excerpt="A deep dive into implementing speech recognition and local LLM processing for privacy-first voice commands." date="Jan 25, 2026" category="Engineering" readTime="8 min read" />
            <BlogCard slug="privacy-first-productivity" title="The Case for Privacy-First Productivity Tools" excerpt="Why we built TaskFlow to work entirely offline and how local-first architecture benefits developers." date="Jan 20, 2026" category="Thoughts" readTime="4 min read" />
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">View all posts<ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-32 border-t border-border/40">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs text-primary mb-4">FAQ</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently asked questions</h2>
            <p className="text-muted-foreground text-lg">Everything you need to know about TaskFlow.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FaqItem key={index} question={faq.question} answer={faq.answer} isOpen={openFaq === index} onToggle={() => setOpenFaq(openFaq === index ? null : index)} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 md:py-32 bg-muted/30 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs text-primary mb-4">Contact</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Get in touch</h2>
              <p className="text-muted-foreground text-lg mb-8">Have a question or want to collaborate? We&apos;d love to hear from you.</p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Mail className="h-5 w-5" /></div>
                  <div><h4 className="font-medium">Email</h4><p className="text-muted-foreground">hello@taskflow.dev</p></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><MapPin className="h-5 w-5" /></div>
                  <div><h4 className="font-medium">Location</h4><p className="text-muted-foreground">San Francisco, CA (Remote-first)</p></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Clock className="h-5 w-5" /></div>
                  <div><h4 className="font-medium">Response Time</h4><p className="text-muted-foreground">Usually within 24 hours</p></div>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-border/40">
                <p className="text-sm text-muted-foreground mb-4">Follow us</p>
                <div className="flex gap-4">
                  <Link href="https://github.com" target="_blank" className="flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border hover:bg-muted transition-colors"><Github className="h-5 w-5" /></Link>
                  <Link href="https://twitter.com" target="_blank" className="flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border hover:bg-muted transition-colors"><Twitter className="h-5 w-5" /></Link>
                  <Link href="https://linkedin.com" target="_blank" className="flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border hover:bg-muted transition-colors"><Linkedin className="h-5 w-5" /></Link>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h3 className="text-xl font-semibold mb-6">Send us a message</h3>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div><label htmlFor="name" className="block text-sm font-medium mb-2">Name</label><Input id="name" placeholder="Your name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required /></div>
                <div><label htmlFor="email" className="block text-sm font-medium mb-2">Email</label><Input id="email" type="email" placeholder="you@example.com" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required /></div>
                <div><label htmlFor="message" className="block text-sm font-medium mb-2">Message</label><Textarea id="message" placeholder="How can we help?" rows={4} value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} required /></div>
                <Button type="submit" className="w-full"><Send className="h-4 w-4 mr-2" />Send Message</Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10 border border-primary/20 p-8 md:p-16 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] -z-10" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Ready to flow?</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">Join thousands of developers who&apos;ve ditched bloated tools for something that just works.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                <Link href="/"><Button size="lg" className="w-full sm:w-auto text-base px-8 h-12"><LayoutDashboard className="h-5 w-5" />Go to Dashboard</Button></Link>
              ) : (
                <Link href="/login"><Button size="lg" className="w-full sm:w-auto text-base px-8 h-12">Get Started — It&apos;s Free<ArrowRight className="h-5 w-5" /></Button></Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"><Kanban className="h-4 w-4 text-primary-foreground" /></div>
                <span className="font-semibold">TaskFlow</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Fast, privacy-focused Kanban for developers who ship.</p>
              <div className="flex gap-4">
                <Link href="https://github.com" target="_blank" className="text-muted-foreground hover:text-foreground"><Github className="h-5 w-5" /></Link>
                <Link href="https://twitter.com" target="_blank" className="text-muted-foreground hover:text-foreground"><Twitter className="h-5 w-5" /></Link>
                <Link href="https://linkedin.com" target="_blank" className="text-muted-foreground hover:text-foreground"><Linkedin className="h-5 w-5" /></Link>
              </div>
            </div>
            <div><h4 className="font-medium mb-4">Product</h4><ul className="space-y-2 text-sm text-muted-foreground"><li><Link href="#features" className="hover:text-foreground">Features</Link></li><li><Link href="#pricing" className="hover:text-foreground">Pricing</Link></li><li><Link href="#" className="hover:text-foreground">Changelog</Link></li><li><Link href="#" className="hover:text-foreground">Roadmap</Link></li></ul></div>
            <div><h4 className="font-medium mb-4">Resources</h4><ul className="space-y-2 text-sm text-muted-foreground"><li><Link href="#blog" className="hover:text-foreground">Blog</Link></li><li><Link href="#" className="hover:text-foreground">Documentation</Link></li><li><Link href="#" className="hover:text-foreground">API Reference</Link></li><li><Link href="#faq" className="hover:text-foreground">FAQ</Link></li></ul></div>
            <div><h4 className="font-medium mb-4">Company</h4><ul className="space-y-2 text-sm text-muted-foreground"><li><Link href="#" className="hover:text-foreground">About</Link></li><li><Link href="#contact" className="hover:text-foreground">Contact</Link></li><li><Link href="#" className="hover:text-foreground">Privacy</Link></li><li><Link href="#" className="hover:text-foreground">Terms</Link></li></ul></div>
          </div>
          <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} TaskFlow. Open source under MIT License.</p>
            <p>Built with ❤️ using Next.js, Tailwind CSS, and Drizzle ORM.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const faqs = [
  { question: "Is TaskFlow really free?", answer: "Yes! TaskFlow is open source and free forever. You can self-host it on your own infrastructure with no limitations." },
  { question: "How does the AI feature work without sending data to the cloud?", answer: "TaskFlow supports multiple AI providers. For privacy, you can use Ollama to run AI models locally. We also support Gemini and Groq APIs for convenience." },
  { question: "Can I import my data from Trello or other tools?", answer: "We're working on import/export functionality. Full import from Trello, Asana, and Notion is on our roadmap for Q2 2026." },
  { question: "Is there a mobile app?", answer: "TaskFlow is a Progressive Web App (PWA), which means you can install it on your phone. A dedicated mobile app is planned for later this year." },
  { question: "How do I self-host TaskFlow?", answer: "Clone the repository, run `npm install`, configure your environment variables, and run `npm run dev`. TaskFlow uses SQLite by default." },
  { question: "Do you offer support for teams?", answer: "Community support is available through GitHub. We're launching a Team plan with dedicated support soon." },
];

function MockCard({ title, labels, color, done = false, hasAI = false }: { title: string; labels: string[]; color: string; done?: boolean; hasAI?: boolean }) {
  const colorMap: Record<string, string> = { purple: "bg-purple-500/20 text-purple-400", blue: "bg-blue-500/20 text-blue-400", green: "bg-green-500/20 text-green-400", orange: "bg-orange-500/20 text-orange-400", slate: "bg-slate-500/20 text-slate-400", cyan: "bg-cyan-500/20 text-cyan-400" };
  return (
    <div className={`p-3 rounded-lg bg-card border border-border/50 ${done ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-2"><span className={`text-xs px-2 py-0.5 rounded-full ${colorMap[color]}`}>{labels[0]}</span>{hasAI && <Sparkles className="h-3 w-3 text-primary" />}</div>
      <p className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{title}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description, isNew = false }: { icon: React.ReactNode; title: string; description: string; isNew?: boolean }) {
  return (
    <div className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300">
      {isNew && <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">New</div>}
      <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center md:text-left">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary text-lg font-bold mb-4">{number}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return <div><div className="text-3xl md:text-4xl font-bold text-primary mb-1">{value}</div><div className="text-sm text-muted-foreground">{label}</div></div>;
}

function PricingCard({ title, price, period, description, features, cta, href, highlighted = false, disabled = false }: { title: string; price: string; period?: string; description: string; features: string[]; cta: string; href: string; highlighted?: boolean; disabled?: boolean }) {
  return (
    <div className={`relative p-6 rounded-2xl border ${highlighted ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
      {highlighted && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">Popular</div>}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <div className="flex items-baseline gap-1 mb-2"><span className="text-4xl font-bold">{price}</span>{period && <span className="text-muted-foreground">{period}</span>}</div>
      <p className="text-muted-foreground text-sm mb-6">{description}</p>
      <ul className="space-y-3 mb-6">{features.map((feature, index) => <li key={index} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />{feature}</li>)}</ul>
      <Link href={href}><Button className="w-full" variant={highlighted ? "default" : "outline"} disabled={disabled}>{cta}</Button></Link>
    </div>
  );
}

function TestimonialCard({ quote, author, role, avatar }: { quote: string; author: string; role: string; avatar: string }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card">
      <div className="flex gap-1 mb-4">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}</div>
      <Quote className="h-8 w-8 text-primary/20 mb-2" />
      <p className="text-sm leading-relaxed mb-4">{quote}</p>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">{avatar}</div>
        <div><p className="font-medium text-sm">{author}</p><p className="text-xs text-muted-foreground">{role}</p></div>
      </div>
    </div>
  );
}

function BlogCard({ slug, title, excerpt, date, category, readTime }: { slug: string; title: string; excerpt: string; date: string; category: string; readTime: string }) {
  return (
    <Link href={`/blog/${slug}`} className="group block p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all">
      <div className="flex items-center gap-2 mb-3"><span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{category}</span><span className="text-xs text-muted-foreground">{readTime}</span></div>
      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{excerpt}</p>
      <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{date}</span><ArrowUpRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" /></div>
    </Link>
  );
}

function FaqItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors">
        <span className="font-medium">{question}</span>
        {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>
      {isOpen && <div className="px-4 pb-4 text-sm text-muted-foreground">{answer}</div>}
    </div>
  );
}
