/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import TrustedByLogos from './TrustedByLogos';
import FeaturedPullQuotes from './FeaturedPullQuotes';

export default function LandingTrustBar() {
  return (
    <section className="border-b border-slate-800 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5 md:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <TrustedByLogos />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <FeaturedPullQuotes />
        </motion.div>
      </div>
    </section>
  );
}
