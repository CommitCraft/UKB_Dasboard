import React from 'react';
import {
  Activity,
  Award,
  BarChart2,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Clock,
  Code,
  Cpu,
  CreditCard,
  Crown,
  Database,
  DollarSign,
  ExternalLink,
  Eye,
  Feather,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  FolderTree,
  Globe,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Key,
  Layers,
  LayoutDashboard,
  Link as LinkIcon,
  Lock,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Monitor,
  Package,
  PieChart,
  Server,
  Settings,
  Shield,
  ShoppingCart,
  Sliders,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Target,
  Terminal,
  TrendingUp,
  Truck,
  User,
  UserCheck,
  Users,
  Workflow,
  Network,
  Boxes
} from 'lucide-react';

/**
 * Master List of Application Icons with category metadata and search keywords
 */
export const APP_ICONS = [
  // Navigation & Core
  { name: 'LayoutDashboard', icon: LayoutDashboard, label: 'Dashboard', category: 'Navigation', keywords: 'home main overview stats summary' },
  { name: 'FolderTree', icon: FolderTree, label: 'Menu Tree', category: 'Navigation', keywords: 'menus structure hierarchy navigation sitemap' },
  { name: 'FileText', icon: FileText, label: 'Pages / Documents', category: 'Navigation', keywords: 'page content article form document' },
  { name: 'Folder', icon: Folder, label: 'Folder', category: 'Navigation', keywords: 'directory files group container' },
  { name: 'FolderOpen', icon: FolderOpen, label: 'Open Folder', category: 'Navigation', keywords: 'projects active folder files' },
  { name: 'Globe', icon: Globe, label: 'Website / Public', category: 'Navigation', keywords: 'web url internet portal global' },
  { name: 'Home', icon: Home, label: 'Home Page', category: 'Navigation', keywords: 'house start landing' },
  { name: 'Layers', icon: Layers, label: 'Modules / Layers', category: 'Navigation', keywords: 'components sections stacks' },
  { name: 'ExternalLink', icon: ExternalLink, label: 'External Page', category: 'Navigation', keywords: 'link new tab url external' },
  { name: 'Eye', icon: Eye, label: 'Viewer / Preview', category: 'Navigation', keywords: 'look inspect preview watch' },

  // User & Security
  { name: 'Users', icon: Users, label: 'Users Management', category: 'User & Security', keywords: 'accounts people members team staff' },
  { name: 'User', icon: User, label: 'User Profile', category: 'User & Security', keywords: 'account person profile avatar' },
  { name: 'UserCheck', icon: UserCheck, label: 'User Access', category: 'User & Security', keywords: 'verified active approved authorized' },
  { name: 'Shield', icon: Shield, label: 'Roles & Security', category: 'User & Security', keywords: 'protection permissions security firewall' },
  { name: 'Lock', icon: Lock, label: 'Permissions', category: 'User & Security', keywords: 'auth restricted secure access key' },
  { name: 'Key', icon: Key, label: 'API / Auth Key', category: 'User & Security', keywords: 'password secret token access' },
  { name: 'Crown', icon: Crown, label: 'Super Admin', category: 'User & Security', keywords: 'king master root owner' },
  { name: 'Award', icon: Award, label: 'Manager / Role', category: 'User & Security', keywords: 'badge ribbon lead ranking' },
  { name: 'Star', icon: Star, label: 'Favorites / Special', category: 'User & Security', keywords: 'bookmark starred feature rating' },
  { name: 'Target', icon: Target, label: 'Audits / Targets', category: 'User & Security', keywords: 'goal focus bullseye mission' },

  // System & Tech
  { name: 'Workflow', icon: Workflow, label: 'Node-RED / Workflow', category: 'System & Tech', keywords: 'nodered flows automation pipeline iot logic diagram' },
  { name: 'Network', icon: Network, label: 'Network / IoT', category: 'System & Tech', keywords: 'ip lan wan connection mesh nodes' },
  { name: 'Boxes', icon: Boxes, label: 'Services / Containers', category: 'System & Tech', keywords: 'docker modules microservices' },
  { name: 'Activity', icon: Activity, label: 'Activity Logs', category: 'System & Tech', keywords: 'audit pulse health monitoring telemetry history' },
  { name: 'Settings', icon: Settings, label: 'Settings', category: 'System & Tech', keywords: 'config gear preferences options setup' },
  { name: 'Sliders', icon: Sliders, label: 'Configuration', category: 'System & Tech', keywords: 'controls parameters adjustment filters' },
  { name: 'Database', icon: Database, label: 'Database', category: 'System & Tech', keywords: 'mysql sql storage records tables' },
  { name: 'Server', icon: Server, label: 'Server / Node', category: 'System & Tech', keywords: 'host backend cloud instance' },
  { name: 'Cpu', icon: Cpu, label: 'CPU / System', category: 'System & Tech', keywords: 'processor chip hardware load' },
  { name: 'Terminal', icon: Terminal, label: 'Terminal / CLI', category: 'System & Tech', keywords: 'console bash command developer' },
  { name: 'Code', icon: Code, label: 'Code / Developer', category: 'System & Tech', keywords: 'api scripting programming' },
  { name: 'Monitor', icon: Monitor, label: 'Display / Screen', category: 'System & Tech', keywords: 'desktop tv display screen' },
  { name: 'Smartphone', icon: Smartphone, label: 'Mobile App', category: 'System & Tech', keywords: 'phone tablet responsive app' },
  { name: 'Clock', icon: Clock, label: 'History / Time', category: 'System & Tech', keywords: 'timer schedule recent duration' },
  { name: 'Calendar', icon: Calendar, label: 'Calendar / Events', category: 'System & Tech', keywords: 'date planner schedule agenda' },

  // Business & Analytics
  { name: 'BarChart2', icon: BarChart2, label: 'Analytics', category: 'Business & Analytics', keywords: 'graph stats reports metrics chart' },
  { name: 'BarChart3', icon: BarChart3, label: 'Bar Analytics', category: 'Business & Analytics', keywords: 'statistics visual bars comparison' },
  { name: 'PieChart', icon: PieChart, label: 'Pie Reports', category: 'Business & Analytics', keywords: 'breakdown distribution share' },
  { name: 'TrendingUp', icon: TrendingUp, label: 'Growth / Trends', category: 'Business & Analytics', keywords: 'increase profit performance success' },
  { name: 'Briefcase', icon: Briefcase, label: 'Business / Jobs', category: 'Business & Analytics', keywords: 'work company corporate enterprise' },
  { name: 'ShoppingCart', icon: ShoppingCart, label: 'Orders / Sales', category: 'Business & Analytics', keywords: 'store buy shop commerce' },
  { name: 'DollarSign', icon: DollarSign, label: 'Finance', category: 'Business & Analytics', keywords: 'money revenue price currency payment' },
  { name: 'CreditCard', icon: CreditCard, label: 'Billing', category: 'Business & Analytics', keywords: 'invoice subscription card payment' },
  { name: 'Package', icon: Package, label: 'Inventory / Items', category: 'Business & Analytics', keywords: 'box stock goods products' },
  { name: 'Truck', icon: Truck, label: 'Logistics', category: 'Business & Analytics', keywords: 'shipping delivery transport fleet' },
  { name: 'FileSpreadsheet', icon: FileSpreadsheet, label: 'Spreadsheet / Excel', category: 'Business & Analytics', keywords: 'csv sheets data table export' },
  { name: 'ClipboardList', icon: ClipboardList, label: 'Task List', category: 'Business & Analytics', keywords: 'todos checklist assignments' },
  { name: 'CheckSquare', icon: CheckSquare, label: 'Approvals', category: 'Business & Analytics', keywords: 'tasks completed verified checked' },
  { name: 'CheckCircle2', icon: CheckCircle2, label: 'Success / Status', category: 'Business & Analytics', keywords: 'ok verified green done' },

  // Communication & Media
  { name: 'BookOpen', icon: BookOpen, label: 'Documentation', category: 'Communication & Media', keywords: 'manual guide docs help handbook' },
  { name: 'Mail', icon: Mail, label: 'Email / Messages', category: 'Communication & Media', keywords: 'inbox letter contact send' },
  { name: 'MessageSquare', icon: MessageSquare, label: 'Chat / Support', category: 'Communication & Media', keywords: 'conversation comments discussion' },
  { name: 'Bell', icon: Bell, label: 'Notifications', category: 'Communication & Media', keywords: 'alerts reminders updates ring' },
  { name: 'HelpCircle', icon: HelpCircle, label: 'Help / FAQ', category: 'Communication & Media', keywords: 'support question info assistance' },
  { name: 'MapPin', icon: MapPin, label: 'Location', category: 'Communication & Media', keywords: 'address map site place' },
  { name: 'ImageIcon', icon: ImageIcon, label: 'Media / Images', category: 'Communication & Media', keywords: 'photo picture gallery banner' },
  { name: 'Feather', icon: Feather, label: 'Editor / Blog', category: 'Communication & Media', keywords: 'author write pen creative' },
  { name: 'Sparkles', icon: Sparkles, label: 'Special Features', category: 'Communication & Media', keywords: 'magic premium new ai' },
  { name: 'Tag', icon: Tag, label: 'Tags / Labels', category: 'Communication & Media', keywords: 'category badge label keyword' }
];

/**
 * Fast lookup dictionary by name and normalized lowercase key
 */
export const ICON_MAP = APP_ICONS.reduce((acc, item) => {
  acc[item.name] = item.icon;
  acc[item.name.toLowerCase()] = item.icon;
  return acc;
}, {
  // Aliases
  Image: ImageIcon,
  image: ImageIcon,
  link: LinkIcon,
  Link: LinkIcon
});

export const ICON_CATEGORIES = [
  'All',
  'Navigation',
  'User & Security',
  'System & Tech',
  'Business & Analytics',
  'Communication & Media'
];

/**
 * Resolves a React Icon Component given an icon name or URL string.
 * @param {string|function|object} iconNameOrUrl 
 * @param {React.Component} defaultIcon 
 * @returns {React.Component}
 */
export const getIconComponent = (iconNameOrUrl, defaultIcon = Globe) => {
  if (!iconNameOrUrl) return defaultIcon;

  // Already a component function/object
  if (typeof iconNameOrUrl === 'function' || typeof iconNameOrUrl === 'object') {
    return iconNameOrUrl;
  }

  if (typeof iconNameOrUrl === 'string') {
    const trimmed = iconNameOrUrl.trim();
    if (!trimmed) return defaultIcon;

    // Image path or web URL
    if (
      trimmed.startsWith('/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:')
    ) {
      const DynamicImgIcon = ({ className = 'h-4 w-4 shrink-0', ...props }) => (
        <img
          src={trimmed}
          alt="icon"
          className={`${className} object-contain rounded`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          {...props}
        />
      );
      return DynamicImgIcon;
    }

    // Direct lookup
    if (ICON_MAP[trimmed]) return ICON_MAP[trimmed];
    const lowerKey = trimmed.toLowerCase();
    if (ICON_MAP[lowerKey]) return ICON_MAP[lowerKey];

    // Heuristic keyword fallback
    if (lowerKey.includes('dash')) return LayoutDashboard;
    if (lowerKey.includes('menu') || lowerKey.includes('tree')) return FolderTree;
    if (lowerKey.includes('user') || lowerKey.includes('member')) return Users;
    if (lowerKey.includes('role') || lowerKey.includes('shield') || lowerKey.includes('sec')) return Shield;
    if (lowerKey.includes('page') || lowerKey.includes('doc') || lowerKey.includes('form')) return FileText;
    if (lowerKey.includes('act') || lowerKey.includes('log')) return Activity;
    if (lowerKey.includes('set') || lowerKey.includes('config')) return Settings;
    if (lowerKey.includes('data') || lowerKey.includes('db')) return Database;
    if (lowerKey.includes('serv') || lowerKey.includes('host')) return Server;
    if (lowerKey.includes('cpu') || lowerKey.includes('proc')) return Cpu;
    if (lowerKey.includes('chart') || lowerKey.includes('report') || lowerKey.includes('stat')) return BarChart2;
    if (lowerKey.includes('order') || lowerKey.includes('shop') || lowerKey.includes('cart')) return ShoppingCart;
    if (lowerKey.includes('help') || lowerKey.includes('faq')) return HelpCircle;
    if (lowerKey.includes('mail') || lowerKey.includes('msg')) return Mail;
  }

  return defaultIcon;
};

/**
 * Helper to render an icon directly with consistent classes and default fallback.
 * @param {string|function|object} iconNameOrUrl 
 * @param {object} options 
 * @returns {JSX.Element}
 */
export const renderAppIcon = (iconNameOrUrl, { className = 'h-4 w-4 shrink-0', defaultIcon = Globe, ...props } = {}) => {
  const IconComp = getIconComponent(iconNameOrUrl, defaultIcon);
  return <IconComp className={className} {...props} />;
};

export default {
  APP_ICONS,
  ICON_MAP,
  ICON_CATEGORIES,
  getIconComponent,
  renderAppIcon
};
