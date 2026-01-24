'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchSchools } from '../../lib/fanbase/api-types';

export interface FanbaseSelectorProps {
  value: string | null;
  onChange: (schoolId: string) => void;
  placeholder?: string;
  className?: string;
}

export function FanbaseSelector({
  value,
  onChange,
  placeholder = 'Select a school...',
  className = '',
}: FanbaseSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['fanbase-schools'],
    queryFn: fetchSchools,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const selectedSchool = schools.find((s) => s.id === value);

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.location_city.toLowerCase().includes(search.toLowerCase()) ||
      s.location_state.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  function handleSelect(schoolId: string): void {
    onChange(schoolId);
    setIsOpen(false);
    setSearch('');
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-charcoal/60 border border-white/10 rounded-lg text-left transition-all hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-burnt-orange/50"
      >
        {selectedSchool ? (
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-8 rounded-sm"
              style={{ backgroundColor: selectedSchool.primary_color }}
            />
            <div>
              <p className="font-medium text-white">{selectedSchool.name}</p>
              <p className="text-xs text-white/50">
                {selectedSchool.location_city}, {selectedSchool.location_state}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-white/50">{isLoading ? 'Loading schools...' : placeholder}</span>
        )}
        <ChevronDown
          className={`w-5 h-5 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-midnight border border-white/10 rounded-lg shadow-2xl overflow-hidden"
          >
            {/* Search */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search schools..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-burnt-orange/50"
                />
              </div>
            </div>

            {/* School List */}
            <div className="max-h-72 overflow-y-auto">
              {filteredSchools.length === 0 ? (
                <div className="p-4 text-center text-white/50 text-sm">No schools found</div>
              ) : (
                filteredSchools.map((school) => (
                  <button
                    key={school.id}
                    type="button"
                    onClick={() => handleSelect(school.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                      school.id === value ? 'bg-burnt-orange/10' : ''
                    }`}
                  >
                    <div
                      className="w-2 h-10 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: school.primary_color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{school.name}</p>
                      <p className="flex items-center gap-1 text-xs text-white/50">
                        <MapPin className="w-3 h-3" />
                        {school.location_city}, {school.location_state}
                      </p>
                    </div>
                    {school.id === value && (
                      <div className="w-2 h-2 rounded-full bg-burnt-orange" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
