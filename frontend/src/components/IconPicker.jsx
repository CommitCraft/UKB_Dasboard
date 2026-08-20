import React, { useState, useMemo } from 'react';
import { Search, X, Check, Sparkles } from 'lucide-react';
import { APP_ICONS, ICON_CATEGORIES, renderAppIcon } from '../utils/iconMap';

/**
 * Searchable Icon Picker Component with Live Preview & Categories
 * @param {string} value - Selected icon name
 * @param {function} onChange - Callback when icon changes (e.g. onChange(iconName))
 * @param {string} label - Form field label
 * @param {boolean} disabled - Whether picker is disabled
 * @param {string} className - Additional container styling
 */
const IconPicker = ({
  value = 'Globe',
  onChange,
  label = 'Select Menu / Page Icon',
  disabled = false,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter icons by category and search keyword
  const filteredIcons = useMemo(() => {
    let list = APP_ICONS;

    if (selectedCategory !== 'All') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.label.toLowerCase().includes(term) ||
          (item.keywords && item.keywords.toLowerCase().includes(term))
      );
    }

    return list;
  }, [selectedCategory, searchTerm]);

  const selectedItem = useMemo(() => {
    return (
      APP_ICONS.find(
        (item) => item.name.toLowerCase() === String(value || '').trim().toLowerCase()
      ) || { name: value || 'Globe', label: value || 'Globe' }
    );
  }, [value]);

  const handleSelectIcon = (iconName) => {
    if (onChange) {
      onChange(iconName);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with Selected Icon Preview */}
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-xs">
            <span className="text-gray-500 dark:text-gray-400 font-normal">Active:</span>
            {renderAppIcon(value, { className: 'h-4 w-4 text-indigo-600 dark:text-indigo-400' })}
            <span className="font-mono">{selectedItem.name}</span>
          </div>
        </div>
      </div>

      {/* Picker Card Box */}
      <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
        {/* Search Bar & Stats */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              disabled={disabled}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, label, purpose (e.g. dashboard, chart, admin)..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-60 shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] text-gray-500 dark:text-gray-400 shrink-0">
            <span className="font-mono px-2 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              {filteredIcons.length} available
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {ICON_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              disabled={disabled}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Icon Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-44 overflow-y-auto p-1.5 [scrollbar-width:thin]">
          {filteredIcons.length === 0 ? (
            <div className="col-span-full text-center py-6 text-xs text-gray-500 dark:text-gray-400">
              No icons found matching "{searchTerm}"
            </div>
          ) : (
            filteredIcons.map((item) => {
              const IconComp = item.icon;
              const isSelected =
                String(value || '').trim().toLowerCase() === item.name.toLowerCase();

              return (
                <button
                  key={item.name}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectIcon(item.name)}
                  title={`${item.label} (${item.name})`}
                  className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs ring-2 ring-indigo-500/20 scale-[1.03]'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-gray-700/60'
                  }`}
                >
                  <IconComp className={`h-4 w-4 mb-1 transition-transform group-hover:scale-110 ${
                    isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                  }`} />
                  <span className="text-[10px] truncate max-w-full text-center leading-tight">
                    {item.label}
                  </span>
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                      <Check className="h-2 w-2 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default IconPicker;
