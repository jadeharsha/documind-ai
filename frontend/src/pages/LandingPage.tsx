import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  ShieldCheck,
  Search,
  Database,
  FileCheck,
  Zap,
  ArrowRight,
  GitCompare,
  GraduationCap,
  Sparkles,
  Layers,
  Lock,
  CheckCircle2
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">DocuMind<span className="text-brand-500">.ai</span></span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block -mt-1">Enterprise Document Intelligence</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
          <a href="#features" className="hover:text-slate-100 transition-colors">Capabilities</a>
          <a href="#agent" className="hover:text-slate-100 transition-colors">Agentic AI</a>
          <a href="#architecture" className="hover:text-slate-100 transition-colors">Architecture</a>
          <a href="#security" className="hover:text-slate-100 transition-colors">Security</a>
          <a href="#pricing" className="hover:text-slate-100 transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2">
            Sign In
          </Link>
          <Link
            to="/register"
            className="text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-lg transition-all shadow-md shadow-brand-600/20 flex items-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-mono mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PRODUCTION-READY AGENTIC DOCUMENT INTELLIGENCE SAAS</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          Transform Complex Documents into <span className="bg-gradient-to-r from-teal-400 via-brand-500 to-emerald-400 bg-clip-text text-transparent">Actionable Intelligence</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Not just a basic PDF chat. DocuMind AI is a full-stack, enterprise-grade research platform with stateful LangGraph agents, page-level citation verification, Qdrant hybrid retrieval, and automated research synthesis.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-brand-600/25 flex items-center gap-2.5"
          >
            <span>Launch Your Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#architecture"
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm font-semibold px-6 py-3.5 rounded-xl transition-all"
          >
            Explore System Architecture
          </a>
        </div>

        {/* Feature Badges */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          {[
            { title: 'Zero Hallucinations', desc: 'Strict page-level citations & evidence bounds', icon: FileCheck },
            { title: 'LangGraph Orchestrator', desc: 'Stateful, bounded multi-step tool execution', icon: Bot },
            { title: 'Qdrant Hybrid Search', desc: 'Vector semantic + lexical keyword reranking', icon: Database },
            { title: 'Tenant Isolated', desc: 'Backend-enforced tenant boundaries in MySQL', icon: ShieldCheck },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <Icon className="w-5 h-5 text-brand-500 mb-2.5" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{item.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Agentic Workspace Deep Dive */}
      <section id="agent" className="py-20 border-t border-slate-800/80 bg-slate-900/30 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono font-bold text-brand-400 uppercase tracking-widest mb-3">Agentic AI Workflows</h2>
            <h3 className="text-3xl font-extrabold text-white">Autonomous, Tool-Using Intelligence Agent</h3>
            <p className="text-sm text-slate-400 mt-3">
              DocuMind AI doesn't simply pass questions to an LLM. It plans, validates resource budgets, calls vetted Python tools, and deterministically verifies outputs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Multi-Document Comparison',
                desc: 'Compares multiple PDF papers simultaneously to identify commonalities, methodological differences, conflicting results, and missing data.',
                icon: GitCompare
              },
              {
                title: 'Academic Research Deep Dive',
                desc: 'Automates literature reviews by extracting objectives, datasets, empirical metrics, limitations, and identifying genuine research gaps.',
                icon: GraduationCap
              },
              {
                title: 'Deterministic Math & Analytics',
                desc: 'Extracts tabular columns and computes statistical metrics using exact Python math rather than trusting LLM arithmetic hallucinations.',
                icon: Zap
              }
            ].map((col, i) => {
              const Icon = col.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{col.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed flex-1">{col.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-t border-slate-800/80 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-mono font-bold text-brand-400 uppercase tracking-widest mb-3">Transparent Tiering</h2>
          <h3 className="text-3xl font-extrabold text-white">Production-Ready SaaS Subscriptions</h3>
          <p className="text-sm text-slate-400 mt-3">Flexible plans engineered for students, academic researchers, and enterprise AI teams.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              tier: 'Starter Student',
              price: '$0',
              period: '/forever',
              features: ['5 Workspaces', '25MB Upload Max', 'Ollama Local LLM Support', 'Standard Grounded RAG', 'Community Support'],
              cta: 'Start Free',
              highlight: false
            },
            {
              tier: 'Pro Researcher',
              price: '$29',
              period: '/month',
              features: ['Unlimited Workspaces', '100MB File Uploads', 'LangGraph Autonomous Agent', 'Multi-Document Comparison', 'Research Gap Identifier', 'Priority Celery Ingestion'],
              cta: 'Start Pro Trial',
              highlight: true
            },
            {
              tier: 'Enterprise Lab',
              price: '$99',
              period: '/month',
              features: ['Dedicated Qdrant Cluster', 'MinIO Private S3 Storage', 'Deterministic Math Engine', 'Custom LLM Provider Keys', 'Full Audit Logging', 'SLA & Dedicated Support'],
              cta: 'Contact Sales',
              highlight: false
            }
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-2xl border flex flex-col justify-between ${
                plan.highlight
                  ? 'bg-slate-900 border-brand-500/50 shadow-2xl shadow-brand-500/10 relative'
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-slate-200">{plan.tier}</h4>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-xs text-slate-400">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/register"
                className={`mt-8 w-full py-2.5 rounded-xl text-xs font-bold text-center block transition-all ${
                  plan.highlight
                    ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-12 px-8 text-center text-xs text-slate-500">
        <p>© 2026 DocuMind AI. Built for advanced document intelligence, research analysis, and agentic workflows.</p>
        <p className="mt-1 font-mono text-[11px] text-slate-600">Django • MySQL • Qdrant • Celery • Redis • React • TypeScript • Vite • LangGraph</p>
      </footer>
    </div>
  );
};
