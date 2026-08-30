"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Truck, MapPin, Clock, Shield, ArrowRight, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  { icon: Truck,  label: "Fleet Management",  desc: "Manage riders & vehicles" },
  { icon: MapPin, label: "Live Tracking",      desc: "Real-time GPS monitoring" },
  { icon: Clock,  label: "Fast Delivery",      desc: "Optimised northern routes" },
  { icon: Shield, label: "Secure Platform",    desc: "Enterprise-grade security" },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
}

export default function SplashScreen() {
  const router  = useRouter()
  const [adminLoading, setAdminLoading] = useState(false)
  const [secLoading,   setSecLoading]   = useState(false)

  const handleAdmin = () => {
    setAdminLoading(true)
    router.push("/admin/login")
    setTimeout(() => setAdminLoading(false), 2000)
  }
  const handleSecretary = () => {
    setSecLoading(true)
    router.push("/secretary/login")
    setTimeout(() => setSecLoading(false), 2000)
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-background">

      {/* ── LEFT: Hero Image Panel ─────────────────────────── */}
      <motion.div
        className="relative hidden lg:flex lg:w-[55%] xl:w-[60%] items-end overflow-hidden"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' as const }}
      >
        {/* Background image */}
        <Image
          src="/images/hero-illustration.jpg"
          alt="SahelX delivery operations across Northern Nigeria"
          fill
          className="object-cover object-center"
          priority
          sizes="60vw"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Ambient red glow orb */}
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[#D93C3C]/20 blur-[120px] animate-pulse-glow pointer-events-none" />

        {/* Grid texture */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

        {/* Bottom-left brand text */}
        <div className="relative z-10 p-10 space-y-4 w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D93C3C]/20 border border-[#D93C3C]/30 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#D93C3C] animate-pulse" />
            <span className="text-xs font-semibold text-white/90 tracking-wider uppercase">Live Operations</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.6 }}
            className="font-heading text-3xl font-bold text-white leading-tight"
          >
            Powering Logistics<br />
            <span className="text-[#D93C3C]">Across Northern Nigeria</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-white/60 text-sm max-w-sm"
          >
            Real-time fleet tracking, delivery management, and analytics — all in one place.
          </motion.p>

          {/* Floating stat badges */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.5 }}
            className="flex gap-3 flex-wrap"
          >
            {[
              { value: "500+", label: "Daily Deliveries" },
              { value: "99.2%", label: "On-Time Rate" },
              { value: "12 Cities", label: "Coverage" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col px-4 py-3 rounded-xl bg-background/10 backdrop-blur-md border border-white/15"
              >
                <span className="font-heading text-lg font-bold text-white">{stat.value}</span>
                <span className="text-xs text-white/55">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── RIGHT: Content Panel ───────────────────────────── */}
      <motion.div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10 lg:px-14 xl:px-20 bg-background"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="mb-10">
          <Image
            src="/images/black1.png"
            alt="SahelX Logo"
            width={180}
            height={60}
            className="h-auto w-auto max-w-[180px] dark:invert"
            priority
          />
        </motion.div>

        {/* Headline */}
        <motion.div variants={itemVariants} className="text-center mb-10 max-w-xs">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Admin Portal
          </h1>
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
            Fast Moves, Northern Routes — Delivery Management System
          </p>
        </motion.div>

        {/* Feature Badges */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 gap-3 w-full max-w-xs mb-10"
        >
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border bg-card hover:border-[#D93C3C]/30 hover:shadow-md transition-all duration-300 group cursor-default"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#D93C3C]/10 group-hover:bg-[#D93C3C]/20 transition-colors">
                <Icon className="w-4 h-4 text-[#D93C3C]" />
              </div>
              <span className="text-xs font-semibold text-foreground leading-tight">{label}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">{desc}</span>
            </div>
          ))}
        </motion.div>

        {/* Login Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleAdmin}
            disabled={adminLoading}
            id="admin-login-btn"
            className="group relative flex items-center justify-center gap-2 w-full h-12 px-6 rounded-xl bg-[#D93C3C] hover:bg-[#B91C1C] text-white font-semibold text-sm shadow-[0_4px_20px_rgba(217,60,60,0.35)] hover:shadow-[0_6px_28px_rgba(217,60,60,0.45)] transition-all duration-300 disabled:opacity-60"
          >
            {adminLoading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <>Admin Login <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
            )}
          </button>

          <button
            onClick={handleSecretary}
            disabled={secLoading}
            id="secretary-login-btn"
            className="group flex items-center justify-center gap-2 w-full h-12 px-6 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-semibold text-sm transition-all duration-300 disabled:opacity-60"
          >
            {secLoading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <>Secretary Login <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
            )}
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('investor-loading');
              if (el) el.style.display = 'inline-block';
              router.push("/investor/login");
            }}
            id="investor-login-btn"
            className="group flex items-center justify-center gap-2 w-full h-12 px-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-sm transition-all duration-300"
          >
            <span id="investor-loading" className="hidden"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></span>
            <span>Investor Login</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          variants={itemVariants}
          className="mt-12 text-xs text-muted-foreground text-center"
        >
          © {new Date().getFullYear()} SahelX · All rights reserved
        </motion.p>
      </motion.div>
    </div>
  )
}
