'use client';

import React, { useState } from 'react';
import {
  ArrowLeft, Sparkles, Play, Mail, MapPin, Globe, Users, BarChart3,
  Target, Eye, Rocket, Zap, ChevronDown, ChevronUp,
  Briefcase, DollarSign, Heart, Shield, BookOpen, Coins,
  Instagram, Linkedin, Send, CheckCircle2, Star, Clock, Tag, ArrowRight,
} from 'lucide-react';
import { useNychIQStore } from '@/lib/store';
import { XIcon } from '@/components/ui/x-icon';
import { toast } from 'sonner';

/* ────────────────────────────── Config ────────────────────────────── */

const PAGE_CONFIG: Record<string, { title: string; subtitle: string }> = {
  about: { title: 'About NychIQ', subtitle: 'YouTube Intelligence Platform' },
  blog: { title: 'NychIQ Blog', subtitle: 'Insights, tips, and updates for creators' },
  contact: { title: 'Contact Us', subtitle: "We'd love to hear from you" },
  careers: { title: 'Careers', subtitle: 'Join the NychIQ team' },
  changelog: { title: 'Changelog', subtitle: 'Latest updates and improvements' },
};

/* ────────────────────────────── Blog Data ────────────────────────────── */

const BLOG_POSTS = [
  {
    title: 'How to Get Your First 1,000 Subscribers in 2026',
    date: 'Jan 15, 2026',
    excerpt: 'A step-by-step roadmap for new creators looking to hit their first major milestone. Learn the exact strategies that worked for top Nigerian creators.',
    category: 'Growth Tips',
    categoryColor: '#10B981',
    readTime: '6 min read',
  },
  {
    title: 'YouTube Algorithm Update: What Changed in January 2026',
    date: 'Jan 8, 2026',
    excerpt: 'YouTube rolled out a significant algorithm update affecting Shorts discoverability and long-form recommendations. Here\'s what creators need to know.',
    category: 'Algorithm Updates',
    categoryColor: '#9B72CF',
    readTime: '4 min read',
  },
  {
    title: 'From 0 to 100K: The Story of TechWithTimi',
    date: 'Dec 22, 2025',
    excerpt: 'How one Nigerian tech creator grew from zero to 100K subscribers in under 8 months using data-driven content strategy and AI tools.',
    category: 'Creator Stories',
    categoryColor: '#4A9EFF',
    readTime: '8 min read',
  },
  {
    title: 'Introducing NychIQ Studio: Your Creative Suite',
    date: 'Dec 15, 2025',
    excerpt: 'NychIQ Studio is here! A complete creative suite with AI-powered tools for thumbnails, scripts, hooks, and content optimization — all in one place.',
    category: 'Product News',
    categoryColor: '#FDBA2D',
    readTime: '3 min read',
  },
  {
    title: '5 Thumbnail Mistakes Killing Your Click-Through Rate',
    date: 'Dec 5, 2025',
    excerpt: 'Your thumbnail is the first thing viewers see. Avoid these common mistakes that are costing you thousands of potential clicks every single upload.',
    category: 'Growth Tips',
    categoryColor: '#10B981',
    readTime: '5 min read',
  },
  {
    title: 'How African Creators Can Monetize Beyond AdSense',
    date: 'Nov 28, 2025',
    excerpt: 'AdSense isn\'t the only way to make money on YouTube. Discover sponsorships, merch, courses, and other revenue streams perfect for African creators.',
    category: 'Creator Stories',
    categoryColor: '#4A9EFF',
    readTime: '7 min read',
  },
];

/* ────────────────────────────── Data ────────────────────────────── */

const STATS = [
  { value: '40+', label: 'AI Tools', icon: Zap, color: '#FDBA2D' },
  { value: '10M+', label: 'Videos Analyzed', icon: BarChart3, color: '#4A9EFF' },
  { value: '50K+', label: 'Creators', icon: Users, color: '#9B72CF' },
  { value: '15+', label: 'African Markets', icon: Globe, color: '#34D399' },
];

const TEAM = [
  {
    name: 'Adewale A.',
    role: 'CEO & Founder',
    bio: 'Former YouTube strategist turned entrepreneur. Founded NychIQ after seeing firsthand how African creators were underserved by existing analytics tools. Passionate about building technology that levels the playing field for content creators across the continent.',
    color: '#FDBA2D',
  },
  {
    name: 'Chioma N.',
    role: 'CTO',
    bio: 'Full-stack engineer with 10+ years of experience scaling consumer products. Previously led engineering teams at two Nigerian fintech unicorns. Architect of NychIQ\'s real-time data pipeline and AI infrastructure.',
    color: '#4A9EFF',
  },
  {
    name: 'Emeka O.',
    role: 'Head of AI',
    bio: 'PhD in Machine Learning from Stanford. Specializes in NLP, recommendation systems, and large language models. Leads the team behind Saku AI, Deep Chat, and NychIQ\'s predictive intelligence engine.',
    color: '#9B72CF',
  },
  {
    name: 'Fatima K.',
    role: 'Growth Lead',
    bio: 'Growth strategist with deep roots in the African creator economy. Previously scaled a creator community from 5K to 200K members. Drives NychIQ\'s partnerships, creator programs, and market expansion across West and East Africa.',
    color: '#34D399',
  },
];

const CONTACT_EMAILS = [
  { email: 'hello@nychiq.com', label: 'General Inquiries', icon: Mail, color: '#FDBA2D' },
  { email: 'billing@nychiq.com', label: 'Billing & Subscriptions', icon: DollarSign, color: '#4A9EFF' },
  { email: 'partnerships@nychiq.com', label: 'Partnerships', icon: Heart, color: '#9B72CF' },
  { email: 'support@nychiq.com', label: 'Technical Support', icon: Shield, color: '#34D399' },
];

const SOCIAL_LINKS = [
  { platform: 'X (Twitter)', handle: '@nychiq', icon: XIcon, color: '#E8E8E8' },
  { platform: 'Instagram', handle: '@nychiq', icon: Instagram, color: '#E8E8E8' },
  { platform: 'LinkedIn', handle: '/company/nychiq', icon: Linkedin, color: '#4A9EFF' },
];

const FAQS = [
  {
    q: 'What plans does NychIQ offer?',
    a: 'We offer five plans: Trial (free with 100 tokens), Starter (₦15K/mo), Pro (₦35K/mo), Elite (₦70K/mo with unlimited tokens), and Agency (₦150K/mo with team features). All paid plans include a 7-day free trial.',
  },
  {
    q: 'How do NychIQ tokens work?',
    a: 'Tokens are the currency used to run AI-powered tools on the platform. Each tool has a specific token cost (from 1 to 20 tokens per use). Higher plans come with more monthly tokens. Elite plan members get unlimited tokens.',
  },
  {
    q: 'Is NychIQ only for Nigerian creators?',
    a: 'While NychIQ was built with African creators in mind, our tools work for YouTube creators worldwide. We have active users across 15+ African markets including Nigeria, Kenya, South Africa, Ghana, and Tanzania.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Absolutely. You can cancel your subscription at any time from your account settings. You\'ll continue to have access until the end of your current billing period. We also offer a refund within 48 hours of purchase.',
  },
];

const JOBS = [
  {
    title: 'Senior ML Engineer',
    location: 'Remote',
    type: 'Full-time',
    color: '#FDBA2D',
    description:
      'Join our AI team to build and scale the machine learning models that power NychIQ\'s intelligence engine. You\'ll work on viral prediction algorithms, NLP pipelines for content analysis, and real-time recommendation systems that serve tens of thousands of creators daily.',
    requirements: [
      '5+ years of experience in machine learning and production ML systems',
      'Strong proficiency in Python, PyTorch, and/or TensorFlow',
      'Hands-on experience with NLP, LLMs, and transformer architectures',
      'Experience deploying models at scale with low-latency requirements',
      'Strong problem-solving skills and ability to work in a fast-paced startup',
    ],
  },
  {
    title: 'Senior Frontend Developer',
    location: 'Remote',
    type: 'Full-time',
    color: '#4A9EFF',
    description:
      'Lead the development of NychIQ\'s web platform, building intuitive and performant interfaces that make complex YouTube analytics accessible to creators. You\'ll work closely with design and product teams to ship features that our users love.',
    requirements: [
      '4+ years of experience with React and Next.js in production environments',
      'Expert-level TypeScript with strong typing practices',
      'Deep experience with Tailwind CSS and component libraries (shadcn/ui preferred)',
      'Experience with real-time data visualization and complex dashboard layouts',
      'Familiarity with Zustand, TanStack Query, and modern state management patterns',
    ],
  },
  {
    title: 'Growth Marketing Manager',
    location: 'Lagos / Remote',
    type: 'Full-time',
    color: '#9B72CF',
    description:
      'Drive user acquisition, engagement, and retention for NychIQ across African markets. You\'ll own the full marketing funnel—from brand awareness campaigns to creator community building—and work with our team to scale from 50K to 500K creators.',
    requirements: [
      '3+ years of experience in growth or performance marketing, preferably in SaaS',
      'Deep understanding of YouTube, social media platforms, and the creator economy',
      'Strong analytical skills with experience in marketing analytics tools',
      'Proven track record of running campaigns that drive measurable user growth',
      'Experience in the African tech ecosystem is a strong plus',
    ],
  },
];

const BENEFITS = [
  { label: 'Competitive Salary', icon: DollarSign, color: '#FDBA2D' },
  { label: 'Remote-First', icon: Globe, color: '#4A9EFF' },
  { label: 'Learning Budget', icon: BookOpen, color: '#9B72CF' },
  { label: 'Health Insurance', icon: Heart, color: '#34D399' },
  { label: 'Token Bonuses', icon: Coins, color: '#FDBA2D' },
];

const CHANGELOG: {
  ver: string;
  date: string;
  description: string;
  features: string[];
  highlight?: boolean;
}[] = [
  {
    ver: 'v4.0.0',
    date: 'Mar 2026',
    description: 'Major UI overhaul introducing the Command Bar, mobile bottom navigation, and the completion of our 40+ tool suite.',
    features: [
      'New Command Bar (⌘K) for instant tool access',
      'Mobile bottom navigation for improved UX on small screens',
      '40+ AI tools fully shipped and production-ready',
      'Complete UI redesign with improved dark theme',
      'Faster page loads and optimized bundle size',
    ],
    highlight: true,
  },
  {
    ver: 'v3.5.0',
    date: 'Jan 2026',
    description: 'Advanced scouting and content safety tools for professional creators and agencies.',
    features: [
      'Outlier Scout — discover breakout channels before they go viral',
      'Safe Content Checker — scan scripts and thumbnails for policy risks',
      'Advanced Keyword Explorer with search volume and competition data',
    ],
  },
  {
    ver: 'v3.0.0',
    date: 'Nov 2025',
    description: 'The automation era. Batch processing, sponsorship analytics, and historical channel intelligence.',
    features: [
      'Automation Master — schedule and batch-run multiple tools automatically',
      'Sponsorship ROI calculator for brand deal negotiations',
      'VPH (Views Per Hour) Tracker for real-time upload performance',
      'History Intel — analyze a channel\'s full upload history for patterns',
    ],
  },
  {
    ver: 'v2.5.0',
    date: 'Sep 2025',
    description: 'Agency-tier tools and deep performance analytics for professional users.',
    features: [
      'Agency Dashboard with multi-channel management',
      'GoffViral integration for cross-platform viral tracking',
      'Performance Forensics — diagnose why videos underperformed',
    ],
  },
  {
    ver: 'v2.0.0',
    date: 'Jul 2025',
    description: 'Introducing NychIQ Studio — a creative suite with AI-powered content production tools.',
    features: [
      'NychIQ Studio launch with integrated creative workflow',
      'Thumbnail Lab — AI-generated thumbnail concepts and A/B variants',
      'A/B Tester for thumbnails, titles, and descriptions',
      'Script Writer AI with tone customization and SEO optimization',
    ],
  },
  {
    ver: 'v1.5.0',
    date: 'May 2025',
    description: 'Social intelligence expansion with cross-platform trend tracking and conversational AI.',
    features: [
      'Social Intelligence suite: Cross-Platform Trends, Channel Mentions, Comment Sentiment',
      'Deep Chat AI — conversational assistant powered by LLMs',
      'Real-time social trend alerts across YouTube, TikTok, and Instagram',
    ],
  },
  {
    ver: 'v1.0.0',
    date: 'Apr 2025',
    description: 'The founding release of NychIQ — core YouTube intelligence features and AI-powered tools.',
    features: [
      'Core intelligence dashboard with trending data and rankings',
      'Saku AI — your personal YouTube strategy assistant',
      'Viral Predictor for upload timing and topic scoring',
      'Niche Spy, Algorithm decoder, and CPM Estimator',
      'Token-based usage system with trial and paid plans',
    ],
  },
];

/* ──────────────────────────── Component ──────────────────────────── */

interface CompanyPageProps {
  type: string;
}

export function CompanyPage({ type }: CompanyPageProps) {
  const { setPage, isLoggedIn } = useNychIQStore();
  const config = PAGE_CONFIG[type] || { title: 'NychIQ', subtitle: '' };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1E1E1E]">
        <button
          onClick={() => isLoggedIn ? setPage('app') : setPage('welcome')}
          className="p-1.5 rounded-md text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[3px] bg-[#FDBA2D] flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M10 6L18 12L10 18V6Z" fill="white"/>
              <rect x="5" y="5" width="2.5" height="14" rx="1" fill="white"/>
            </svg>
          </div>
          <span className="text-sm font-black tracking-[1.5px] uppercase">NY<span className="text-[#FDBA2D]">CHIQ</span></span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
        {/* Page header */}
        <h1 className="text-3xl font-bold text-[#E8E8E8] mb-2">{config.title}</h1>
        <p className="text-[#888888] mb-10">{config.subtitle}</p>

        {/* ── ABOUT ── */}
        {type === 'about' && <AboutSection />}

        {/* ── BLOG ── */}
        {type === 'blog' && <BlogSection />}

        {/* ── CONTACT ── */}
        {type === 'contact' && <ContactSection />}

        {/* ── CAREERS ── */}
        {type === 'careers' && <CareersSection />}

        {/* ── CHANGELOG ── */}
        {type === 'changelog' && <ChangelogSection />}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1E1E1E] px-6 py-6 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs text-[#444444]">
          <span>© {new Date().getFullYear()} NychIQ</span>
          <button onClick={() => setPage('privacy')} className="hover:text-[#888888] transition-colors">Privacy</button>
          <button onClick={() => setPage('terms')} className="hover:text-[#888888] transition-colors">Terms</button>
          <button onClick={() => setPage('contact')} className="hover:text-[#888888] transition-colors">Contact</button>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════ ABOUT ═══════════════════════════ */

function AboutSection() {
  const { setPage, isLoggedIn } = useNychIQStore();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="nychiq-card p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#FDBA2D] mb-3">
          YouTube Intelligence Platform
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-[#E8E8E8] mb-4 leading-tight">
          YouTube Intelligence for the<br />Next Generation of Creators
        </h2>
        <p className="text-sm text-[#888888] leading-relaxed max-w-xl mx-auto">
          NychIQ is the first AI-powered YouTube intelligence platform built specifically for
          Nigerian and African creators. We give you the data, insights, and tools to grow
          your channel faster, earn more revenue, and outperform the algorithm — all in one place.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="nychiq-card p-5 text-center">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold text-[#E8E8E8]">{stat.value}</p>
              <p className="text-xs text-[#888888] mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Why NychIQ */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-[#E8E8E8]">Why NychIQ</h3>

        <div className="nychiq-card p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[rgba(253,186,45,0.1)] flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-[#FDBA2D]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#E8E8E8] mb-1">The Problem</h4>
            <p className="text-sm text-[#888888] leading-relaxed">
              African creators are among the fastest-growing on YouTube, yet the tools available
              to them are designed for Western markets. Existing analytics platforms ignore
              African audience behavior, regional trends, and the unique economics of content
              creation on the continent. Creators are forced to guess what works, losing views,
              revenue, and sponsorship opportunities every day.
            </p>
          </div>
        </div>

        <div className="nychiq-card p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[rgba(74,158,255,0.1)] flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-[#4A9EFF]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#E8E8E8] mb-1">Our Solution</h4>
            <p className="text-sm text-[#888888] leading-relaxed">
              NychIQ provides AI-powered YouTube intelligence tailored for African creators.
              Our platform analyzes millions of videos across 15+ African markets to deliver
              actionable insights on trending topics, optimal posting times, viral potential,
              audience demographics, and revenue optimization. With 40+ specialized tools and
              our AI assistant Saku, creators get enterprise-grade analytics at a fraction of the cost.
            </p>
          </div>
        </div>

        <div className="nychiq-card p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[rgba(155,114,207,0.1)] flex items-center justify-center shrink-0">
            <Rocket className="w-5 h-5 text-[#9B72CF]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#E8E8E8] mb-1">Our Vision</h4>
            <p className="text-sm text-[#888888] leading-relaxed">
              We envision a world where every African creator has access to the same caliber of
              data-driven tools as creators in New York or London. By 2027, our goal is to
              empower 500,000+ creators across the continent with intelligence that helps them
              turn YouTube from a hobby into a sustainable career. NychIQ isn&apos;t just a tool —
              it&apos;s a movement to democratize YouTube success.
            </p>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-[#E8E8E8]">The Team</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEAM.map((member) => (
            <div key={member.name} className="nychiq-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-[#0D0D0D]"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#E8E8E8]">{member.name}</p>
                  <p className="text-xs" style={{ color: member.color }}>
                    {member.role}
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#888888] leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="nychiq-card p-8 text-center">
        <p className="text-sm text-[#888888] mb-4">
          Ready to unlock YouTube intelligence for your channel?
        </p>
        <button
          onClick={() => isLoggedIn ? setPage('app') : setPage('login')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-[#FDBA2D] text-[#0D0D0D] hover:bg-[#e6961a] transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          {isLoggedIn ? 'Go to Dashboard' : 'Start Free Trial'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════ BLOG ═══════════════════════════ */

function BlogSection() {
  const handleBlogClick = () => {
    toast.info('Blog post coming soon!', {
      description: 'We\'re working on publishing full blog content. Stay tuned!',
    });
  };

  return (
    <div className="space-y-8">
      {/* Featured post */}
      <button
        onClick={handleBlogClick}
        className="w-full text-left nychiq-card overflow-hidden group cursor-pointer"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                color: BLOG_POSTS[0].categoryColor,
                backgroundColor: `${BLOG_POSTS[0].categoryColor}15`,
                border: `1px solid ${BLOG_POSTS[0].categoryColor}30`,
              }}
            >
              {BLOG_POSTS[0].category}
            </span>
            <span className="text-[11px] text-[#555]">{BLOG_POSTS[0].date}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#E8E8E8] mb-3 group-hover:text-[#FDBA2D] transition-colors leading-tight">
            {BLOG_POSTS[0].title}
          </h2>
          <p className="text-sm text-[#888888] leading-relaxed mb-4 max-w-2xl">
            {BLOG_POSTS[0].excerpt}
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-[#666]">
              <Clock className="w-3 h-3" /> {BLOG_POSTS[0].readTime}
            </span>
            <span className="flex items-center gap-1 text-xs text-[#FDBA2D] group-hover:gap-2 transition-all">
              Read article <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </button>

      {/* Post grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BLOG_POSTS.slice(1).map((post, i) => (
          <button
            key={i}
            onClick={handleBlogClick}
            className="text-left nychiq-card p-5 group cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  color: post.categoryColor,
                  backgroundColor: `${post.categoryColor}15`,
                  border: `1px solid ${post.categoryColor}30`,
                }}
              >
                {post.category}
              </span>
              <span className="text-[10px] text-[#555]">{post.date}</span>
            </div>
            <h3 className="text-sm font-semibold text-[#E8E8E8] mb-2 group-hover:text-[#FDBA2D] transition-colors leading-snug">
              {post.title}
            </h3>
            <p className="text-xs text-[#888888] leading-relaxed mb-3 line-clamp-2">
              {post.excerpt}
            </p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] text-[#555]">
                <Clock className="w-2.5 h-2.5" /> {post.readTime}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#FDBA2D] group-hover:gap-1.5 transition-all">
                Read <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Subscribe CTA */}
      <div className="nychiq-card p-6 text-center">
        <h3 className="text-lg font-bold text-[#E8E8E8] mb-2">Stay Updated</h3>
        <p className="text-sm text-[#888888] mb-4">
          Get the latest YouTube tips and NychIQ news delivered to your inbox.
        </p>
        <button
          onClick={() => toast.success('Subscribed!', { description: 'You\'ll receive our weekly newsletter.' })}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-[#FDBA2D] text-[#0D0D0D] hover:bg-[#D9A013] transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Subscribe to Newsletter
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════ CONTACT ═══════════════════════════ */

function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent!', {
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="space-y-10">
      {/* Email cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#E8E8E8] mb-4">Get in Touch</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONTACT_EMAILS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.email} className="nychiq-card p-5 flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#E8E8E8]">{item.label}</h4>
                  <p className="text-sm text-[#888888] mt-0.5">{item.email}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Social links */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#E8E8E8]">Follow Us</h3>
        <div className="flex flex-wrap gap-4">
          {SOCIAL_LINKS.map((social) => {
            const Icon = social.icon;
            return (
              <div key={social.platform} className="nychiq-card px-5 py-4 flex items-center gap-3">
                <Icon className="w-5 h-5 text-[#888888]" />
                <div>
                  <p className="text-xs text-[#888888]">{social.platform}</p>
                  <p className="text-sm font-semibold text-[#E8E8E8]">{social.handle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#E8E8E8]">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = expandedFaq === i;
            return (
              <div key={i} className="nychiq-card overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-sm font-semibold text-[#E8E8E8] pr-4">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#888888] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#888888] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-[#888888] leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact form */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#E8E8E8]">Send Us a Message</h3>
        <form onSubmit={handleSubmit} className="nychiq-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#888888]">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#1E1E1E] text-sm text-[#E8E8E8] placeholder:text-[#555] focus:outline-none focus:border-[#FDBA2D] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#888888]">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#1E1E1E] text-sm text-[#E8E8E8] placeholder:text-[#555] focus:outline-none focus:border-[#FDBA2D] transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#888888]">Subject</label>
            <select
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#1E1E1E] text-sm text-[#E8E8E8] focus:outline-none focus:border-[#FDBA2D] transition-colors appearance-none"
            >
              <option value="" disabled>
                Select a subject
              </option>
              <option value="general">General Inquiry</option>
              <option value="billing">Billing Question</option>
              <option value="partnership">Partnership Opportunity</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#888888]">Message</label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell us how we can help..."
              className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#1E1E1E] text-sm text-[#E8E8E8] placeholder:text-[#555] focus:outline-none focus:border-[#FDBA2D] transition-colors resize-none"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-[#FDBA2D] text-[#0D0D0D] hover:bg-[#e6961a] transition-colors"
          >
            <Send className="w-4 h-4" />
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════ CAREERS ═══════════════════════════ */

function CareersSection() {
  const [expandedJob, setExpandedJob] = useState<number | null>(null);

  const handleApply = (title: string) => {
    toast.success(`Application for ${title}`, {
      description: 'Please send your CV and portfolio to careers@nychiq.com',
    });
  };

  return (
    <div className="space-y-10">
      {/* Intro */}
      <div className="nychiq-card p-6">
        <p className="text-sm text-[#888888] leading-relaxed">
          We&apos;re building the future of YouTube intelligence for African creators, and
          we&apos;re looking for passionate people to join us. NychIQ is a remote-first team with
          members across Nigeria, Kenya, and beyond. We value curiosity, ownership, and a
          genuine desire to empower creators across the continent. If that sounds like you,
          check out our open positions below.
        </p>
      </div>

      {/* Open positions */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#E8E8E8]">Open Positions</h3>
        <div className="space-y-4">
          {JOBS.map((job, i) => {
            const isOpen = expandedJob === i;
            return (
              <div key={job.title} className="nychiq-card overflow-hidden">
                {/* Job header */}
                <button
                  onClick={() => setExpandedJob(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="text-sm font-semibold text-[#E8E8E8]">{job.title}</h4>
                      <span className="text-[11px] text-[#888888] bg-[#1A1A1A] px-2 py-0.5 rounded">
                        {job.location}
                      </span>
                      <span className="text-[11px] text-[#888888] bg-[#1A1A1A] px-2 py-0.5 rounded">
                        {job.type}
                      </span>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#888888] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#888888] shrink-0" />
                  )}
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div className="px-5 pb-5 space-y-4">
                    <p className="text-sm text-[#888888] leading-relaxed">{job.description}</p>
                    <div>
                      <p className="text-xs font-semibold text-[#E8E8E8] mb-2">Key Requirements</p>
                      <ul className="space-y-1.5">
                        {job.requirements.map((req, ri) => (
                          <li key={ri} className="flex items-start gap-2 text-sm text-[#888888]">
                            <CheckCircle2
                              className="w-3.5 h-3.5 mt-0.5 shrink-0"
                              style={{ color: job.color }}
                            />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => handleApply(job.title)}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-[#0D0D0D] transition-colors"
                      style={{ backgroundColor: job.color }}
                    >
                      <Briefcase className="w-4 h-4" />
                      Apply Now
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#E8E8E8]">Benefits & Perks</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.label} className="nychiq-card p-4 text-center">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2"
                  style={{ backgroundColor: `${b.color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color: b.color }} />
                </div>
                <p className="text-xs text-[#888888]">{b.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ CHANGELOG ═══════════════════════════ */

function ChangelogSection() {
  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[#1E1E1E]" />

        <div className="space-y-4">
          {CHANGELOG.map((entry) => (
            <div key={entry.ver} className="relative pl-10">
              {/* Dot */}
              <div
                className="absolute left-[11px] top-5 w-[9px] h-[9px] rounded-full border-2"
                style={{
                  borderColor: entry.highlight ? '#FDBA2D' : '#333',
                  backgroundColor: entry.highlight ? '#FDBA2D' : '#0D0D0D',
                }}
              />

              <div
                className={`nychiq-card p-5 ${entry.highlight ? 'border-[#FDBA2D33]' : ''}`}
              >
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      entry.highlight
                        ? 'text-[#0D0D0D] bg-[#FDBA2D]'
                        : 'text-[#FDBA2D] bg-[rgba(253,186,45,0.1)]'
                    }`}
                  >
                    {entry.ver}
                  </span>
                  <span className="text-[11px] text-[#444444]">{entry.date}</span>
                  {entry.highlight && (
                    <span className="text-[10px] font-semibold text-[#FDBA2D] bg-[rgba(253,186,45,0.1)] px-2 py-0.5 rounded">
                      Latest
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#E8E8E8] mb-3 leading-relaxed">
                  {entry.description}
                </p>
                <ul className="space-y-1.5">
                  {entry.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm text-[#888888]">
                      <Star className="w-3 h-3 mt-0.5 text-[#555] shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
