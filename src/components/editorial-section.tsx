"use client"

import Link from "next/link"
import { motion } from "framer-motion"



export function EditorialSection() {
  return (
    <section className="py-14 md:py-32 px-4 md:px-20 bg-[#1a1c1c] overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-16">
        <motion.div 
          className="md:col-span-7 relative"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-[#fcd020]/20 to-transparent rounded-lg blur-xl" />
          <img 
            className="w-full aspect-[16/9] object-cover rounded-lg relative z-10" 
            src="https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=1200&h=675&fit=crop" 
            alt="Artisan workshop" 
          />
        </motion.div>
        <motion.div 
          className="md:col-span-5"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="text-xs font-medium text-[#fcd020] uppercase tracking-[0.2em] block mb-6">Our Philosophy</span>
          <h2 className="text-5xl font-extrabold tracking-tighter mb-8 leading-tight text-white">THE REJECTION OF THE MASS-PRODUCED.</h2>
          <p className="text-white/70 body-lg mb-10 leading-relaxed">
            LoqMart exists as a direct response to the era of disposable objects. We curate tools and artifacts that possess both mathematical precision and the soul of the maker. Every item in our catalog undergoes a 12-point utility inspection before it reaches your door.
          </p>
          <motion.button 
            className="text-white font-bold text-sm uppercase tracking-widest border-b-4 border-[#fcd020] pb-1 hover:border-white transition-all"
            whileHover={{ x: 10 }}
            transition={{ duration: 0.2 }}
          >
            Explore the Process
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
