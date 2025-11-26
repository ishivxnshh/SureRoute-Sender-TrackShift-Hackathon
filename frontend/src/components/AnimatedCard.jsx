import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      whileHover={{
        y: -4,
        boxShadow: '0 18px 35px rgba(15, 23, 42, 0.45)',
        transition: { duration: 0.18 },
      }}
      style={{ borderRadius: 16, overflow: 'hidden' }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;


