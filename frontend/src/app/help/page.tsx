'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  QuestionMarkCircleIcon,
  BookOpenIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function HelpPage() {
  const [faqs] = useState([
    {
      question: 'How do I verify a trade on blockchain?',
      answer: 'Every trade you make is automatically verified. Look for the ✓ badge next to your trades. Click it to view the transaction on the blockchain explorer.'
    },
    {
      question: 'What networks are supported?',
      answer: 'Currently supporting Ethereum local (Anvil) and Polygon Amoy testnet. Mainnet support coming soon.'
    },
    {
      question: 'How long do trades take to settle?',
      answer: 'Trades settle instantly on our platform, with blockchain verification typically completing within seconds.'
    },
    {
      question: 'Is my money safe?',
      answer: 'Yes! Every trade is cryptographically verified on-chain. You can independently verify all transactions.'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl p-8 ring-1 ring-white/10 text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-4">How can we help you?</h1>
        <div className="max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Search for help..."
            className="w-full bg-slate-700/50 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500"
          />
        </div>
      </motion.div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: BookOpenIcon, title: 'Getting Started', desc: 'New to trading? Start here' },
          { icon: DocumentTextIcon, title: 'Documentation', desc: 'Detailed API and platform docs' },
          { icon: ChatBubbleLeftRightIcon, title: 'Community', desc: 'Join our Discord community' },
        ].map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10 hover:bg-slate-700/30 cursor-pointer transition-all"
          >
            <item.icon className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-white font-semibold mb-1">{item.title}</h3>
            <p className="text-sm text-slate-400">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* FAQs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
      >
        <h2 className="text-xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-b border-white/10 last:border-0 pb-4 last:pb-0">
              <h3 className="text-white font-medium mb-2">{faq.question}</h3>
              <p className="text-slate-400 text-sm">{faq.answer}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Contact Support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Still need help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors">
            <EnvelopeIcon className="w-5 h-5 text-blue-400" />
            <span className="text-white">Email Support</span>
          </button>
          <button className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-emerald-400" />
            <span className="text-white">Live Chat</span>
          </button>
          <button className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors">
            <PhoneIcon className="w-5 h-5 text-purple-400" />
            <span className="text-white">Phone Support</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}