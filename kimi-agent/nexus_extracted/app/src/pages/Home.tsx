import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import HeroSection from '@/sections/HeroSection';
import NeuralDatastream from '@/sections/NeuralDatastream';
import { Hexagon, ArrowRight, Sparkles, Zap, Brain, Globe, Shield } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    icon: Brain,
    title: 'Intent Analysis',
    description: 'Natural language is parsed into structured intent with confidence scoring and context extraction.',
    color: '#BE123C',
  },
  {
    icon: Sparkles,
    title: 'Generative UI',
    description: 'Dynamic layouts are generated in real-time — dashboards, timelines, comparisons, and forms.',
    color: '#0F766E',
  },
  {
    icon: Zap,
    title: 'Predictive UX',
    description: 'The system anticipates your next move, showing suggestions before you even ask.',
    color: '#B45309',
  },
  {
    icon: Globe,
    title: 'Multimodal Input',
    description: 'Text, voice, file uploads — interact however feels natural. The AI adapts to you.',
    color: '#15803D',
  },
  {
    icon: Shield,
    title: 'Transparent AI',
    description: 'Every decision shows its reasoning. Confidence scores and source attribution build trust.',
    color: '#44403C',
  },
  {
    icon: Hexagon,
    title: 'Smart Travel Planner',
    description: 'Our showcase use case — plan trips with auto-generated itineraries, flights, hotels, and budgets.',
    color: '#78716C',
  },
];

export default function Home() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.feature-card').forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: i * 0.1,
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div style={{ background: '#FDFCF8' }} className="min-h-screen paper-texture">
      {/* Hero Section */}
      <HeroSection />

      {/* Neural Datastream */}
      <NeuralDatastream />

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span
              className="nexus-stamp nexus-stamp-teal mb-4 inline-flex"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Core Capabilities
            </span>
            <h2
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 600,
                color: '#1C1917',
                marginBottom: '16px',
              }}
            >
              Beyond the Chatbot
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: '#78716C', fontSize: '18px', lineHeight: 1.7 }}>
              Nexus is not a chatbot. It's an Intent-Driven Generative UI system that creates the interface you need, when you need it.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="feature-card nexus-card p-6 group cursor-pointer"
                  style={{
                    borderLeft: `3px solid ${feature.color}20`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: `${feature.color}10` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <h3
                    className="text-lg font-semibold mb-2 transition-colors"
                    style={{ color: '#292524' }}
                  >
                    {feature.title}
                  </h3>
                  <p style={{ color: '#78716C', fontSize: '14px', lineHeight: 1.6 }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Smart Travel Planner Showcase */}
      <section className="py-24 px-6" style={{ borderTop: '1px solid #E7E5E4', borderBottom: '1px solid #E7E5E4' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span
                className="nexus-stamp nexus-stamp-teal mb-4 inline-flex"
              >
                <Globe className="w-3.5 h-3.5" />
                Featured Use Case
              </span>
              <h2
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  fontWeight: 600,
                  color: '#1C1917',
                  marginBottom: '16px',
                }}
              >
                Smart Travel Planner
              </h2>
              <p className="mb-6" style={{ color: '#78716C', fontSize: '16px', lineHeight: 1.7 }}>
                Say "I need to organize a business trip to Paris next week" and watch as Nexus generates a complete trip interface — flights, hotels, itinerary timeline, budget breakdown, and weather forecast — all in real-time.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Auto-generated flight comparison cards',
                  'Hotel recommendations with ratings and pricing',
                  'Day-by-day itinerary timeline',
                  'Budget tracker with visual breakdown',
                  'Predictive suggestions for next steps',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm" style={{ color: '#78716C' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#15803D' }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/workspace"
                className="nexus-btn nexus-btn-primary"
              >
                Try the Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Mock UI */}
              <div
                className="relative rounded-2xl overflow-hidden nexus-card"
                style={{ border: '1px solid #E7E5E4' }}
              >
                {/* Mock Header */}
                <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #E7E5E4', background: '#FAF9F6' }}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(153, 27, 27, 0.5)' }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(180, 83, 9, 0.5)' }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(21, 128, 61, 0.5)' }} />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="nexus-label" style={{ fontSize: 10 }}>Nexus Workspace</span>
                  </div>
                </div>

                {/* Mock Content */}
                <div className="p-4 space-y-3" style={{ background: '#FFFFFF' }}>
                  {/* Intent bar */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(190, 18, 60, 0.06)', border: '1px solid rgba(190, 18, 60, 0.15)' }}
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: '#BE123C' }} />
                    <span className="text-xs" style={{ color: '#78716C' }}>Business trip to Paris next week</span>
                    <span className="ml-auto text-[10px] font-medium" style={{ color: '#15803D' }}>94%</span>
                  </div>

                  {/* Mock Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg" style={{ background: '#FAF9F6', border: '1px solid #E7E5E4' }}>
                      <div className="nexus-label mb-1" style={{ fontSize: 10 }}>Trip Overview</div>
                      <div className="text-xs font-medium" style={{ color: '#292524' }}>Paris, France</div>
                      <div className="text-[10px]" style={{ color: '#A8A29E' }}>Mar 15-22, 2026</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: '#FAF9F6', border: '1px solid #E7E5E4' }}>
                      <div className="nexus-label mb-1" style={{ fontSize: 10 }}>Budget</div>
                      <div className="text-xs font-medium" style={{ color: '#292524' }}>$5,200</div>
                      <div className="nexus-ink-progress mt-1">
                        <div className="nexus-ink-progress-bar" style={{ width: '75%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Mock Flights */}
                  <div className="space-y-2">
                    {['Air France', 'Emirates'].map((airline, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2.5 rounded-lg"
                        style={{ background: '#FAF9F6', border: '1px solid #E7E5E4' }}
                      >
                        <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'rgba(190, 18, 60, 0.08)' }}>
                          <Zap className="w-3.5 h-3.5" style={{ color: '#BE123C' }} />
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] font-medium" style={{ color: '#292524' }}>{airline}</div>
                          <div className="text-[9px] flex items-center gap-1" style={{ color: '#A8A29E' }}>
                            8h 30m · Direct
                          </div>
                        </div>
                        <div className="text-xs font-medium" style={{ color: '#B45309' }}>${1200 + i * 180}</div>
                      </div>
                    ))}
                  </div>

                  {/* Predictive chip */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-medium" style={{ color: '#0F766E' }}>Predicted:</span>
                    <span
                      className="nexus-stamp nexus-stamp-teal"
                      style={{ fontSize: 9, padding: '0.125rem 0.5rem' }}
                    >
                      + Book meeting room
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div
                className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: 'rgba(190, 18, 60, 0.06)', filter: 'blur(20px)' }}
              />
              <div
                className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: 'rgba(15, 118, 110, 0.06)', filter: 'blur(20px)' }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: '#1C1917' }}
          >
            <Hexagon className="w-8 h-8 text-white" />
          </div>
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 600,
              color: '#1C1917',
              marginBottom: '16px',
            }}
          >
            Ready to Experience the Future?
          </h2>
          <p className="mb-8" style={{ color: '#78716C', fontSize: '18px', lineHeight: 1.7 }}>
            Enter the Nexus workspace and discover how AI can generate the perfect interface for your every need.
          </p>
          <Link
            to="/workspace"
            className="nexus-btn nexus-btn-primary"
            style={{ padding: '0.875rem 2rem', fontSize: '16px' }}
          >
            Enter Nexus Workspace
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ borderTop: '1px solid #E7E5E4' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: '#1C1917' }}
            >
              <Hexagon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: '#292524', fontFamily: 'Playfair Display, serif' }}>
              NEXUS
            </span>
            <span className="text-[10px]" style={{ color: '#A8A29E' }}>Adaptive AI Workspace</span>
          </div>
          <div className="text-xs" style={{ color: '#A8A29E' }}>
            DOO Builders League 2026 — Beyond the Chatbot Challenge
          </div>
        </div>
      </footer>
    </div>
  );
}
