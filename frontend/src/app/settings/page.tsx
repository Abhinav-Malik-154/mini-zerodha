'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, Shield, Moon, Sun, Globe,
  Lock, Key, Mail, Phone, CreditCard,
  Wallet, History, LogOut, ChevronRight,
  AlertTriangle, Check, Copy, RefreshCw,
  Download, Upload, Eye, EyeOff, Smartphone,
  Laptop, MonitorSmartphone, MoonStar,
  Palette, Brush, Layout, Sliders,
  Wifi, WifiOff, Database, Cloud,
  Award, Gift, Zap, Sparkles, Server,
  Share2, Fingerprint, Clock, Calendar,
  FileText, Settings as SettingsIcon,
  HelpCircle, Download as DownloadIcon,
  Trash2, Edit, Plus, X, CheckCircle,
  AlertCircle, Info, Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'profile' | 'security' | 'notifications' | 'appearance' | 'privacy' | 'api' | 'billing' | 'preferences' | 'backup' | 'advanced';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
  priceAlerts: boolean;
  tradeConfirmations: boolean;
  weeklyReport: boolean;
  securityAlerts: boolean;
  loginAlerts: boolean;
  withdrawalAlerts: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sms2FA: boolean;
  email2FA: boolean;
  authenticator2FA: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
  deviceVerification: boolean;
  whitelistEnabled: boolean;
  whitelistIps: string[];
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  createdAt: string;
  lastUsed: string;
  permissions: ('read' | 'trade' | 'withdraw')[];
  status: 'active' | 'inactive' | 'expired';
}

interface BillingInfo {
  plan: 'free' | 'pro' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
  nextBilling: string;
  paymentMethod: {
    type: 'card' | 'crypto' | 'bank';
    last4?: string;
    brand?: string;
    expiry?: string;
  };
  invoices: {
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    downloadUrl: string;
  }[];
}

interface Backup {
  id: string;
  name: string;
  size: string;
  createdAt: string;
  type: 'automatic' | 'manual';
  status: 'completed' | 'pending' | 'failed';
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; data?: any } | null>(null);

  // Profile State
  const [profile, setProfile] = useState({
    name: 'Abhinav Malik',
    email: 'abhinav.malik@example.com',
    phone: '9876543210',
    countryCode: '+91',
    username: 'abhinav_malik',
    bio: 'Crypto trader & blockchain enthusiast',
    avatar: null as string | null,
    coverImage: null as string | null,
    dateOfBirth: '1995-06-15',
    gender: 'male',
    timezone: 'Asia/Kolkata',
    language: 'en',
    currency: 'USD',
  });

  // Notification Settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    marketing: false,
    priceAlerts: true,
    tradeConfirmations: true,
    weeklyReport: true,
    securityAlerts: true,
    loginAlerts: true,
    withdrawalAlerts: true,
  });

  // Security Settings
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sms2FA: false,
    email2FA: true,
    authenticator2FA: false,
    sessionTimeout: 30,
    loginNotifications: true,
    deviceVerification: true,
    whitelistEnabled: false,
    whitelistIps: ['103.77.186.53'],
  });

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Trading Bot',
      key: 'tk_8a7f6e5d4c3b2a1n',
      secret: 'sk_••••••••••••••••',
      createdAt: '2026-02-15',
      lastUsed: '2026-02-19',
      permissions: ['read', 'trade'],
      status: 'active',
    },
    {
      id: '2',
      name: 'Analytics Dashboard',
      key: 'tk_1a2b3c4d5e6f7g8h',
      secret: 'sk_••••••••••••••••',
      createdAt: '2026-02-10',
      lastUsed: '2026-02-18',
      permissions: ['read'],
      status: 'active',
    },
  ]);

  // Billing Info
  const [billing, setBilling] = useState<BillingInfo>({
    plan: 'pro',
    billingCycle: 'monthly',
    nextBilling: '2026-03-15',
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiry: '05/28',
    },
    invoices: [
      {
        id: 'INV-2026-001',
        date: '2026-02-15',
        amount: 29.99,
        status: 'paid',
        downloadUrl: '#',
      },
      {
        id: 'INV-2026-002',
        date: '2026-01-15',
        amount: 29.99,
        status: 'paid',
        downloadUrl: '#',
      },
    ],
  });

  // Backups
  const [backups, setBackups] = useState<Backup[]>([
    {
      id: '1',
      name: 'Automatic Backup',
      size: '2.4 GB',
      createdAt: '2026-02-19 03:00',
      type: 'automatic',
      status: 'completed',
    },
    {
      id: '2',
      name: 'Manual Backup',
      size: '2.4 GB',
      createdAt: '2026-02-18 15:30',
      type: 'manual',
      status: 'completed',
    },
  ]);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [accentColor, setAccentColor] = useState('blue');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [compactMode, setCompactMode] = useState(false);

  // Privacy State
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showBalance: true,
    showTrades: false,
    analytics: true,
    thirdPartyCookies: false,
    dataSharing: false,
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    defaultChart: 'candlestick',
    defaultTimeframe: '1D',
    showVolume: true,
    showGrid: true,
    soundEnabled: true,
    desktopNotifications: true,
    autoLogout: 30,
    defaultSlippage: 0.5,
  });

  // Advanced Settings
  const [advanced, setAdvanced] = useState({
    developerMode: false,
    debugLogging: false,
    experimentalFeatures: false,
    nodeUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc-amoy.polygon.technology',
    wsUrl: process.env.NEXT_PUBLIC_WS_RPC_URL || 'wss://ws-amoy.polygon.technology',
    gasMultiplier: 1.1,
    maxConcurrentTrades: 5,
  });

  // Connected Devices
  const [devices, setDevices] = useState([
    { id: 1, name: 'Windows PC', type: 'desktop', icon: MonitorSmartphone, lastActive: 'Now', location: 'Mumbai, IN', current: true },
    { id: 2, name: 'iPhone 14 Pro', type: 'mobile', icon: Smartphone, lastActive: '2 hours ago', location: 'Mumbai, IN', current: false },
    { id: 3, name: 'MacBook Pro', type: 'laptop', icon: Laptop, lastActive: 'Yesterday', location: 'Delhi, IN', current: false },
  ]);

  // Activity Log
  const [activityLog, setActivityLog] = useState([
    { id: 1, action: 'Login', device: 'Chrome on Windows', location: 'Mumbai, IN', time: '2 min ago', ip: '103.77.186.53' },
    { id: 2, action: 'Password changed', device: 'Safari on iPhone', location: 'Mumbai, IN', time: '2 days ago', ip: '103.77.186.53' },
    { id: 3, action: 'API key created', device: 'Firefox on MacOS', location: 'Delhi, IN', time: '1 week ago', ip: '203.45.67.89' },
    { id: 4, action: '2FA enabled', device: 'Chrome on Android', location: 'Pune, IN', time: '2 weeks ago', ip: '203.45.67.89' },
  ]);

  // Handlers
  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsEditing(false);
      toast.success('Settings saved successfully!');
    }, 1500);
  };

  const handleCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const handleToggle = <T extends object>(setter: React.Dispatch<React.SetStateAction<T>>, field: keyof T) => {
    setter(prev => ({ ...prev, [field]: !prev[field] as any }));
    toast.success('Setting updated');
  };

  const handleConfirmAction = (action: { type: string; data?: any }) => {
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;

    switch (confirmAction.type) {
      case 'delete-account':
        toast.error('Account deletion requested. Check your email to confirm.');
        break;
      case 'disable-2fa':
        setSecurity({ ...security, twoFactorEnabled: false });
        toast.success('2FA disabled');
        break;
      case 'revoke-api':
        setApiKeys(apiKeys.filter(k => k.id !== confirmAction.data));
        toast.success('API key revoked');
        break;
      case 'logout-device':
        setDevices(devices.filter(d => d.id !== confirmAction.data));
        toast.success('Device logged out');
        break;
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const renderProfile = () => (
    <motion.div className="space-y-6">
      {/* Profile Header */}
      <div className="relative bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl p-8 border border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
              {profile.avatar ? <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover rounded-3xl" /> : profile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <button 
              onClick={() => toast.success('Avatar upload coming soon')}
              className="absolute -bottom-2 -right-2 p-2 bg-blue-500 rounded-xl text-white hover:bg-blue-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
            <p className="text-slate-400">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs">Verified</span>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs">Premium</span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs">Trader Level 12</span>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors border border-white/10 flex items-center gap-2"
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Username</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Phone</label>
                <div className="flex gap-2">
                  <select 
                    value={profile.countryCode}
                    onChange={(e) => setProfile({ ...profile, countryCode: e.target.value })}
                    disabled={!isEditing}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white disabled:opacity-50"
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                  </select>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!isEditing}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Gender</label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Bio & Social</h3>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              disabled={!isEditing}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Timezone</label>
                <select
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white disabled:opacity-50"
                >
                  <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                  <option value="America/New_York">EST (UTC-5)</option>
                  <option value="Europe/London">GMT (UTC+0)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Language</label>
                <select
                  value={profile.language}
                  onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white disabled:opacity-50"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Currency</label>
                <select
                  value={profile.currency}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white disabled:opacity-50"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Account Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Member Since</span>
                <span className="text-white">Feb 15, 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Trades</span>
                <span className="text-white">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Success Rate</span>
                <span className="text-green-400">94%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsEditing(false)}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </motion.div>
  );

  const renderSecurity = () => (
    <motion.div className="space-y-6">
      {/* Security Score */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Security Score', value: '98%', color: 'green', icon: Shield },
          { label: '2FA Status', value: security.twoFactorEnabled ? 'Enabled' : 'Disabled', color: security.twoFactorEnabled ? 'green' : 'yellow', icon: Fingerprint },
          { label: 'Active Sessions', value: devices.length.toString(), color: 'blue', icon: MonitorSmartphone },
          { label: 'API Keys', value: apiKeys.length.toString(), color: 'purple', icon: Key },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className={`text-2xl font-bold text-${stat.color}-400 mt-1`}>{stat.value}</p>
              </div>
              <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
            </div>
          </div>
        ))}
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
            <p className="text-sm text-slate-400">Add an extra layer of security to your account</p>
          </div>
          <button
            onClick={() => handleToggle(setSecurity, 'twoFactorEnabled')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${security.twoFactorEnabled ? 'bg-blue-500' : 'bg-white/10'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {security.twoFactorEnabled && (
          <div className="space-y-4 mt-4 pt-4 border-t border-white/10">
            <h4 className="text-white font-medium">2FA Methods</h4>
            {[
              { label: 'Authenticator App', key: 'authenticator2FA', description: 'Google Authenticator, Authy' },
              { label: 'SMS Authentication', key: 'sms2FA', description: 'Receive codes via SMS' },
              { label: 'Email Authentication', key: 'email2FA', description: 'Receive codes via email' },
            ].map((method) => (
              <div key={method.key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white">{method.label}</p>
                  <p className="text-xs text-slate-400">{method.description}</p>
                </div>
                <button
                  onClick={() => handleToggle(setSecurity, method.key as keyof SecuritySettings)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${security[method.key as keyof SecuritySettings] ? 'bg-blue-500' : 'bg-white/10'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${security[method.key as keyof SecuritySettings] ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password Change */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">New Password</label>
            <input type="password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Confirm Password</label>
            <input type="password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all">
            Update Password
          </button>
        </div>
      </div>

      {/* Session Management */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Active Sessions</h3>
        <div className="space-y-4">
          {devices.map((device) => (
            <div key={device.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="p-2 bg-white/5 rounded-xl">
                <device.icon className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium flex items-center gap-2">
                  {device.name}
                  {device.current && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Current</span>}
                </p>
                <p className="text-xs text-slate-400">{device.location}</p>
              </div>
              <p className="text-xs text-green-400">{device.lastActive}</p>
              {!device.current && (
                <button
                  onClick={() => handleConfirmAction({ type: 'logout-device', data: device.id })}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {activityLog.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="p-2 bg-white/5 rounded-xl">
                <Shield className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{activity.action}</p>
                <p className="text-xs text-slate-400">{activity.device} • {activity.location} • {activity.ip}</p>
              </div>
              <p className="text-xs text-slate-400">{activity.time}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderNotifications = () => (
    <motion.div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-6">Notification Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
              <div>
                <p className="text-white capitalize font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {value ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <button
                onClick={() => handleToggle(setNotifications, key as keyof NotificationSettings)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-white/10'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderAppearance = () => (
    <motion.div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { mode: 'dark', icon: Moon, label: 'Dark Mode', desc: 'Easy on the eyes at night' },
          { mode: 'light', icon: Sun, label: 'Light Mode', desc: 'Bright and clean' },
          { mode: 'system', icon: MonitorSmartphone, label: 'System', desc: 'Follow device settings' },
        ].map(({ mode, icon: Icon, label, desc }) => (
          <button
            key={mode}
            onClick={() => setTheme(mode as any)}
            className={`p-6 rounded-2xl border transition-all ${
              theme === mode
                ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-xl scale-105'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Icon className="w-8 h-8 mb-3" />
            <p className="font-semibold mb-1">{label}</p>
            <p className="text-xs opacity-80">{desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Accent Color</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {['blue', 'purple', 'green', 'red', 'orange', 'pink', 'indigo', 'teal'].map((color) => (
            <button
              key={color}
              onClick={() => setAccentColor(color)}
              className={`h-12 rounded-xl bg-gradient-to-br from-${color}-500 to-${color}-600 hover:scale-105 transition-transform ${
                accentColor === color ? 'ring-2 ring-white scale-110' : ''
              }`}
            />
          ))}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Display Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div>
              <p className="text-white">Font Size</p>
              <p className="text-xs text-slate-400">Adjust text size throughout the app</p>
            </div>
            <div className="flex gap-2">
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size as any)}
                  className={`px-3 py-1 rounded-lg text-sm capitalize ${
                    fontSize === size ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div>
              <p className="text-white">Compact Mode</p>
              <p className="text-xs text-slate-400">Show more content in less space</p>
            </div>
            <button
              onClick={() => setCompactMode(!compactMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${compactMode ? 'bg-blue-500' : 'bg-white/10'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${compactMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderApi = () => (
    <motion.div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">API Keys</h3>
            <p className="text-sm text-slate-400">Manage your API access keys for automated trading</p>
          </div>
          <button
            onClick={() => toast.success('API key creation wizard opened')}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Key
          </button>
        </div>

        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    {apiKey.name}
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      apiKey.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {apiKey.status}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">Created: {apiKey.createdAt} • Last used: {apiKey.lastUsed}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(apiKey.key, 'API Key copied')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleConfirmAction({ type: 'revoke-api', data: apiKey.id })}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {apiKey.permissions.map((perm) => (
                  <span key={perm} className="px-2 py-1 bg-white/5 rounded-lg text-xs text-slate-300 capitalize">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Webhook Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Webhook URL</label>
            <input
              type="url"
              placeholder="https://your-server.com/webhook"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Secret Key</label>
            <div className="relative">
              <input
                type="password"
                value="whsec_••••••••••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                readOnly
              />
              <button
                onClick={() => handleCopy('whsec_••••••••••••••••', 'Secret copied')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg">
            Save Webhook
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderBilling = () => (
    <motion.div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-2">Current Plan</p>
            <h2 className="text-3xl font-bold text-white capitalize">{billing.plan} Plan</h2>
            <p className="text-slate-400 mt-2">Billed {billing.billingCycle} • Next payment {billing.nextBilling}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400 mb-1">Price</p>
            <p className="text-4xl font-bold text-white">$29.99</p>
            <p className="text-sm text-slate-400">per month</p>
          </div>
        </div>
      </div>

      {/* Plan Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['free', 'pro', 'enterprise'].map((plan) => (
          <div
            key={plan}
            className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 border ${
              billing.plan === plan ? 'border-blue-500 shadow-xl' : 'border-white/10'
            }`}
          >
            <h3 className="text-xl font-bold text-white capitalize mb-2">{plan}</h3>
            <p className="text-2xl font-bold text-white mb-4">
              {plan === 'free' ? '$0' : plan === 'pro' ? '$29.99' : '$99.99'}
              <span className="text-sm text-slate-400 font-normal">/mo</span>
            </p>
            <ul className="space-y-2 mb-6">
              {plan === 'free' && (
                <>
                  <li className="text-sm text-slate-300 flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Basic trading</li>
                  <li className="text-sm text-slate-300 flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 10 trades/day</li>
                  <li className="text-sm text-slate-300 flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Basic support</li>
                </>
              )}
              {plan === 'pro' && (
                <>
                  <li className="text-sm text-slate-300 flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Advanced trading</li>
                  <li className="text-sm text-slate-300 flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Unlimited trades</li>
                  <li className="text-sm text-slate-300 flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Priority support</li>
                  <li className="text-sm text-slate-300 flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> API access</li>
                </>
              )}
              {plan === 'enterprise' && (
                <>
                  <li className="text-sm text-slate-300 flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Institutional trading</li>
                  <li className="text-sm text-slate-300 flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Dedicated server</li>
                  <li className="text-sm text-slate-300 flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 24/7 phone support</li>
                  <li className="text-sm text-slate-300 flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Custom features</li>
                </>
              )}
            </ul>
            <button
              onClick={() => billing.plan !== plan && setBilling({ ...billing, plan: plan as any })}
              className={`w-full py-2 rounded-xl transition-all ${
                billing.plan === plan
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {billing.plan === plan ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Method */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">{billing.paymentMethod.brand} •••• {billing.paymentMethod.last4}</p>
            <p className="text-sm text-slate-400">Expires {billing.paymentMethod.expiry}</p>
          </div>
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors">
            Update
          </button>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Billing History</h3>
        <div className="space-y-3">
          {billing.invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
              <div>
                <p className="text-white font-medium">{invoice.id}</p>
                <p className="text-xs text-slate-400">{invoice.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-white font-medium">${invoice.amount}</p>
                <span className={`px-2 py-1 rounded-lg text-xs ${
                  invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {invoice.status}
                </span>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <DownloadIcon className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderPreferences = () => (
    <motion.div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Trading Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div>
              <p className="text-white">Default Chart Type</p>
              <p className="text-xs text-slate-400">Choose your preferred chart style</p>
            </div>
            <select
              value={preferences.defaultChart}
              onChange={(e) => setPreferences({ ...preferences, defaultChart: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            >
              <option value="candlestick">Candlestick</option>
              <option value="line">Line</option>
              <option value="bar">Bar</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div>
              <p className="text-white">Default Timeframe</p>
              <p className="text-xs text-slate-400">Default chart timeframe</p>
            </div>
            <select
              value={preferences.defaultTimeframe}
              onChange={(e) => setPreferences({ ...preferences, defaultTimeframe: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            >
              <option value="1H">1 Hour</option>
              <option value="1D">1 Day</option>
              <option value="1W">1 Week</option>
              <option value="1M">1 Month</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div>
              <p className="text-white">Show Volume</p>
              <p className="text-xs text-slate-400">Display volume bars on chart</p>
            </div>
            <button
              onClick={() => setPreferences({ ...preferences, showVolume: !preferences.showVolume })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.showVolume ? 'bg-blue-500' : 'bg-white/10'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.showVolume ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div>
              <p className="text-white">Sound Effects</p>
              <p className="text-xs text-slate-400">Play sounds on trade execution</p>
            </div>
            <button
              onClick={() => setPreferences({ ...preferences, soundEnabled: !preferences.soundEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.soundEnabled ? 'bg-blue-500' : 'bg-white/10'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Advanced Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Auto Logout (minutes)</label>
            <input
              type="number"
              value={preferences.autoLogout}
              onChange={(e) => setPreferences({ ...preferences, autoLogout: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
              min="5"
              max="120"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Default Slippage (%)</label>
            <input
              type="number"
              value={preferences.defaultSlippage}
              onChange={(e) => setPreferences({ ...preferences, defaultSlippage: parseFloat(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
              step="0.1"
              min="0.1"
              max="5"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderBackup = () => (
    <motion.div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Data Backup</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">Automatic Backups</p>
                <p className="text-xs text-slate-400">Daily at 03:00 AM</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs">Enabled</span>
          </div>

          <div className="space-y-3">
            {backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  {backup.type === 'automatic' ? (
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                  <div>
                    <p className="text-white">{backup.name}</p>
                    <p className="text-xs text-slate-400">{backup.createdAt} • {backup.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-xs ${
                    backup.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {backup.status}
                  </span>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Download className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            Create Manual Backup
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderAdvanced = () => (
    <motion.div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Developer Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div>
              <p className="text-white">Developer Mode</p>
              <p className="text-xs text-slate-400">Enable advanced features for development</p>
            </div>
            <button
              onClick={() => setAdvanced({ ...advanced, developerMode: !advanced.developerMode })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${advanced.developerMode ? 'bg-blue-500' : 'bg-white/10'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${advanced.developerMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div>
              <p className="text-white">Debug Logging</p>
              <p className="text-xs text-slate-400">Log detailed debug information</p>
            </div>
            <button
              onClick={() => setAdvanced({ ...advanced, debugLogging: !advanced.debugLogging })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${advanced.debugLogging ? 'bg-blue-500' : 'bg-white/10'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${advanced.debugLogging ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div>
              <p className="text-white">Experimental Features</p>
              <p className="text-xs text-slate-400">Try out new features (may be unstable)</p>
            </div>
            <button
              onClick={() => setAdvanced({ ...advanced, experimentalFeatures: !advanced.experimentalFeatures })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${advanced.experimentalFeatures ? 'bg-blue-500' : 'bg-white/10'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${advanced.experimentalFeatures ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Network Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">RPC URL</label>
            <input
              type="url"
              value={advanced.nodeUrl}
              onChange={(e) => setAdvanced({ ...advanced, nodeUrl: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">WebSocket URL</label>
            <input
              type="url"
              value={advanced.wsUrl}
              onChange={(e) => setAdvanced({ ...advanced, wsUrl: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Gas Multiplier</label>
            <input
              type="number"
              value={advanced.gasMultiplier}
              onChange={(e) => setAdvanced({ ...advanced, gasMultiplier: parseFloat(e.target.value) })}
              step="0.1"
              min="1"
              max="2"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <button
            onClick={() => handleConfirmAction({ type: 'delete-account' })}
            className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </div>
    </motion.div>
  );

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, component: renderProfile },
    { id: 'security', label: 'Security', icon: Shield, component: renderSecurity },
    { id: 'notifications', label: 'Notifications', icon: Bell, component: renderNotifications },
    { id: 'appearance', label: 'Appearance', icon: Palette, component: renderAppearance },
    { id: 'preferences', label: 'Preferences', icon: Sliders, component: renderPreferences },
    { id: 'api', label: 'API & Keys', icon: Key, component: renderApi },
    { id: 'billing', label: 'Billing', icon: CreditCard, component: renderBilling },
    { id: 'backup', label: 'Backup', icon: Database, component: renderBackup },
    { id: 'advanced', label: 'Advanced', icon: SettingsIcon, component: renderAdvanced },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-slate-400 mt-1">Manage your account preferences and security</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-white">Premium Account</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto pb-2 mb-8 scrollbar-hide">
          <div className="flex gap-2 min-w-max p-1 bg-white/5 rounded-2xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {tabs.find(t => t.id === activeTab)?.component()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-3xl p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Confirm Action</h3>
              </div>
              <p className="text-slate-400 mb-6">
                Are you sure you want to proceed? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmAction}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}