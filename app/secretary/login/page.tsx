"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { AlertCircle, Loader2, ArrowLeft, Eye, EyeOff, ClipboardList } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInSecretary } from "@/lib/firebase/secretaryAuth"

const panelVariants = {
  hidden: { opacity: 0, x: -30 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
}
const formVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}
const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
}

export default function SecretaryLoginPage() {
  const router   = useRouter()
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await signInSecretary(email, password)
      router.push("/secretary/dashboard")
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-background">

      {/* ── LEFT: Image Panel ──────────────────────────────── */}
      <motion.div
        className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-end overflow-hidden"
        variants={panelVariants}
        initial="hidden"
        animate="show"
      >
        <Image
          src="/images/secretary-login.jpg"
          alt="SahelX Secretary Operations Workspace"
          fill
          className="object-cover object-center"
          priority
          sizes="55vw"
        />
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        {/* Warm amber glow — distinct from admin's red */}
        <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] rounded-full bg-amber-500/20 blur-[100px] animate-pulse-glow pointer-events-none" />

        {/* Content overlay */}
        <div className="relative z-10 p-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 backdrop-blur-sm">
            <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-white/90 tracking-wider uppercase">Secretary Portal</span>
          </div>
          <h2 className="font-heading text-3xl font-bold text-white leading-tight">
            Operations &<br />
            <span className="text-amber-400">Coordination Hub</span>
          </h2>
          <p className="text-white/55 text-sm max-w-xs leading-relaxed">
            Manage delivery orders, coordinate with riders, track customers, and keep operations running smoothly.
          </p>
          <div className="flex gap-3 flex-wrap">
            {["Create Deliveries", "Manage Riders", "Customer Records", "Live Map"].map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium text-white/70 px-2.5 py-1 rounded-md bg-background/10 backdrop-blur-sm border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── RIGHT: Form Panel ──────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10 lg:px-14 xl:px-20 bg-background">
        <motion.div
          className="w-full max-w-sm"
          variants={formVariants}
          initial="hidden"
          animate="show"
        >
          {/* Back link */}
          <motion.div variants={fieldVariants} className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Home
            </Link>
          </motion.div>

          {/* Logo */}
          <motion.div variants={fieldVariants} className="mb-8">
            <Image
              src="/images/black1.png"
              alt="SahelX"
              width={150}
              height={50}
              className="h-auto w-auto max-w-[150px] dark:invert"
            />
          </motion.div>

          {/* Heading */}
          <motion.div variants={fieldVariants} className="mb-8">
            <h1 className="font-heading text-2xl font-bold text-foreground">Secretary Login</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to the operations portal</p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
            >
              <AlertCircle className="mt-0.5 w-4 h-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <motion.form variants={formVariants} onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={fieldVariants} className="space-y-1.5">
              <Label htmlFor="sec-email" className="text-sm font-medium text-foreground">Email</Label>
              <Input
                id="sec-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="secretary@sahelx.com"
                className="h-11 rounded-xl border-border bg-background focus-visible:ring-amber-400/30 focus-visible:border-amber-500"
                required
              />
            </motion.div>

            <motion.div variants={fieldVariants} className="space-y-1.5">
              <Label htmlFor="sec-password" className="text-sm font-medium text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="sec-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 rounded-xl border-border bg-background pr-10 focus-visible:ring-amber-400/30 focus-visible:border-amber-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={fieldVariants}>
              <button
                type="submit"
                disabled={isLoading}
                id="secretary-login-submit"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-[0_4px_20px_rgba(245,158,11,0.30)] hover:shadow-[0_6px_28px_rgba(245,158,11,0.40)] transition-all duration-300 disabled:opacity-60"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                ) : "Login to Portal"}
              </button>
            </motion.div>
          </motion.form>

          <motion.p variants={fieldVariants} className="mt-8 text-center text-xs text-muted-foreground">
            SahelX Secretary Portal · © {new Date().getFullYear()}
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
