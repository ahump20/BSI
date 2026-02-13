import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Hero() {
  const handleDownload = () => {
    toast.success('Resume downloading...');
  };
  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-charcoal via-midnight to-charcoal overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/10 via-transparent to-texas-soil/10" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-burnt-orange via-ember to-burnt-orange" />

      <div className="container-custom relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 id="hero-heading" className="text-6xl md:text-8xl font-bold uppercase tracking-wider text-white mb-4">
            John Austin<br />
            <span className="text-gradient-burnt bg-gradient-to-r from-burnt-orange to-ember bg-clip-text text-transparent">
              Humphrey
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-sand/90 font-sans font-light tracking-wide mb-8">
            Sports Intelligence · Product Strategy · AI-Assisted Analytics
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="max-w-3xl mx-auto"
          >
            <p className="text-lg md:text-xl text-sand/80 italic leading-relaxed mb-6">
              Born August 17, 1995 in Memphis, Tennessee — same day as Davy Crockett,
              the legendary folk hero who died defending the Alamo.
            </p>
            <p className="text-lg md:text-xl text-sand/80 italic leading-relaxed">
              My parents brought <span className="text-burnt-orange font-semibold">Texas soil</span> from
              West Columbia, birthplace of the Republic of Texas.
            </p>
            <p className="text-base md:text-lg text-sand/60 mt-4 font-mono">
              The doctor said: <br/>
              <span className="text-burnt-orange">"You know you ain't the first to do this,<br/>but they've ALL been from Texas."</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          >
            <a href="#about" className="btn-primary">
              Read the Story
            </a>
            <a href="#contact" className="btn-secondary">
              Get in Touch
            </a>
            <a
              href="/Austin_Humphrey_Resume_Executive_v2.pdf"
              download
              onClick={handleDownload}
              className="btn-secondary"
            >
              Download Resume
            </a>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mt-16"
          >
            <svg
              className="w-6 h-6 mx-auto text-burnt-orange"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
