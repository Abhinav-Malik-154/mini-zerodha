'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  UserIcon, 
  BellIcon, 
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    email: 'user@example.com',
    notifications: true,
    twoFactor: false,
    defaultSlippage: 0.5,
    theme: 'dark',
    currency: 'USD'
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
      >
        <h2 className="text-xl font-semibold text-white mb-6">Settings</h2>
        
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-400" />
              Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Email Address</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({...settings, email: e.target.value})}
                  className="w-full bg-slate-700/50 border border-white/10 rounded-xl p-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Display Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                  className="w-full bg-slate-700/50 border border-white/10 rounded-xl p-3 text-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <BellIcon className="w-5 h-5 text-yellow-400" />
              Notifications
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Push Notifications</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Security Section */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-green-400" />
              Security
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Two-Factor Authentication</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.twoFactor}
                    onChange={(e) => setSettings({...settings, twoFactor: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </div>
              </label>
              <button className="text-sm text-blue-400 hover:text-blue-300 mt-2">
                Change Password →
              </button>
            </div>
          </div>

          {/* Trading Preferences */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" />
              Trading Preferences
            </h3>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Default Slippage Tolerance (%)</label>
              <input
                type="number"
                value={settings.defaultSlippage}
                onChange={(e) => setSettings({...settings, defaultSlippage: parseFloat(e.target.value)})}
                step="0.1"
                min="0.1"
                max="5"
                className="w-full bg-slate-700/50 border border-white/10 rounded-xl p-3 text-white"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all">
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}