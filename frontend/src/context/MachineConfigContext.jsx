import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────
const MACHINES_KEY          = 'machine_config_list';
const ACTIVE_KEY            = 'machine_config_active_id';
const RECENT_ACTIVITIES_KEY = 'machine_recent_activities';

// ─────────────────────────────────────────────
// Default machines pre-seeded from .env
// ─────────────────────────────────────────────
const buildEnvMachine = () => {
  const host     = import.meta.env.VITE_NODE_RED_HOST     || '';
  const port     = import.meta.env.VITE_NODE_RED_PORT     || '1814';
  const protocol = import.meta.env.VITE_NODE_RED_PROTOCOL || 'http';
  if (!host) return null;
  return {
    id:          'env-default',
    name:        'Default (from .env)',
    host,
    port,
    protocol,
    path:        '',
    description: 'Auto-loaded from environment configuration',
    createdAt:   new Date().toISOString(),
    lastOpenedAt: null
  };
};

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const MachineConfigContext = createContext(null);

export const MachineConfigProvider = ({ children }) => {
  const [machines, setMachines]                 = useState([]);
  const [activeMachineId, setActiveMachineId]   = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  // ── Load from localStorage on mount ────────────────────────────
  useEffect(() => {
    try {
      const storedMachines   = localStorage.getItem(MACHINES_KEY);
      const storedActiveId   = localStorage.getItem(ACTIVE_KEY);
      const storedActivities = localStorage.getItem(RECENT_ACTIVITIES_KEY);

      let loadedMachines = storedMachines ? JSON.parse(storedMachines) : [];

      if (storedActivities) {
        setRecentActivities(JSON.parse(storedActivities) || []);
      }

      // If no saved machines, seed with .env defaults
      if (loadedMachines.length === 0) {
        const envMachine = buildEnvMachine();
        if (envMachine) {
          loadedMachines = [envMachine];
          localStorage.setItem(MACHINES_KEY, JSON.stringify(loadedMachines));
        }
      }

      setMachines(loadedMachines);

      // Set active ID: use stored one, or auto-select first machine
      if (storedActiveId && loadedMachines.find(m => m.id === storedActiveId)) {
        setActiveMachineId(storedActiveId);
      } else if (loadedMachines.length > 0) {
        setActiveMachineId(loadedMachines[0].id);
        localStorage.setItem(ACTIVE_KEY, loadedMachines[0].id);
      }
    } catch (e) {
      console.error('[MachineConfig] Failed to load config from localStorage:', e);
    }
  }, []);

  // ── Derived: currently active machine object ─────────────────
  const activeMachine = machines.find(m => m.id === activeMachineId) || null;

  // ── Helpers ──────────────────────────────────────────────────
  const generateId = () => `machine-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const persist = useCallback((updatedMachines, updatedActiveId) => {
    try {
      localStorage.setItem(MACHINES_KEY, JSON.stringify(updatedMachines));
      if (updatedActiveId !== undefined) {
        localStorage.setItem(ACTIVE_KEY, updatedActiveId || '');
      }
    } catch (e) {
      console.error('[MachineConfig] Failed to persist config:', e);
    }
  }, []);

  // ── Build URL from a machine object ──────────────────────────
  const buildUrl = useCallback((machine) => {
    if (!machine || !machine.host) return '';
    const cleanHost = machine.host.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const portPart  = machine.port ? `:${machine.port.toString().trim()}` : '';
    const cleanPath = machine.path
      ? machine.path.startsWith('/') ? machine.path : `/${machine.path}`
      : '';
    return `${machine.protocol || 'http'}://${cleanHost}${portPart}${cleanPath}`;
  }, []);

  // ── Record Machine Launch Activity ────────────────────────────
  const recordMachineOpen = useCallback((machine, userName = '') => {
    if (!machine) return;
    const now = new Date().toISOString();

    // 1. Update machine object's lastOpenedAt
    setMachines(prev => {
      const updated = prev.map(m => (m.id === machine.id ? { ...m, lastOpenedAt: now } : m));
      persist(updated, undefined);
      return updated;
    });

    // 2. Add to recent activities list
    const newActivity = {
      id:          `act-${Date.now()}`,
      machineId:   machine.id,
      name:        machine.name,
      host:        machine.host,
      port:        machine.port,
      protocol:    machine.protocol || 'http',
      url:         buildUrl(machine),
      openedAt:    now,
      userName:    userName || 'User'
    };

    setRecentActivities(prev => {
      // Remove any existing recent entry for the same machine to keep it fresh at the top
      const filtered = prev.filter(item => item.machineId !== machine.id);
      const updated = [newActivity, ...filtered].slice(0, 4); // Keep top 4 recent only
      try {
        localStorage.setItem(RECENT_ACTIVITIES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save recent activities:', err);
      }
      return updated;
    });
  }, [buildUrl, persist]);

  // ── Clear recent activities ──────────────────────────────────
  const clearRecentActivities = useCallback(() => {
    setRecentActivities([]);
    try {
      localStorage.removeItem(RECENT_ACTIVITIES_KEY);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ── Add a new machine ─────────────────────────────────────────
  const addMachine = useCallback((machineData) => {
    const newMachine = {
      id:          generateId(),
      name:        machineData.name       || 'Unnamed Machine',
      host:        machineData.host       || '',
      port:        machineData.port       || '1814',
      protocol:    machineData.protocol   || 'http',
      path:        machineData.path       || '',
      description: machineData.description || '',
      createdAt:   new Date().toISOString(),
      lastOpenedAt: null
    };

    setMachines(prev => {
      const updated = [...prev, newMachine];
      persist(updated, undefined);
      return updated;
    });

    return newMachine;
  }, [persist]);

  // ── Update an existing machine ────────────────────────────────
  const updateMachine = useCallback((id, updates) => {
    setMachines(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...updates, id } : m);
      persist(updated, undefined);
      return updated;
    });
  }, [persist]);

  // ── Delete a machine ──────────────────────────────────────────
  const deleteMachine = useCallback((id) => {
    setMachines(prev => {
      const updated = prev.filter(m => m.id !== id);
      let newActiveId = activeMachineId;
      if (activeMachineId === id) {
        newActiveId = updated.length > 0 ? updated[0].id : null;
        setActiveMachineId(newActiveId);
      }
      persist(updated, newActiveId);
      return updated;
    });

    // Also remove from recent activities
    setRecentActivities(prev => {
      const updated = prev.filter(item => item.machineId !== id);
      try {
        localStorage.setItem(RECENT_ACTIVITIES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  }, [activeMachineId, persist]);

  // ── Set active machine ────────────────────────────────────────
  const selectActiveMachine = useCallback((id) => {
    setActiveMachineId(id);
    try {
      localStorage.setItem(ACTIVE_KEY, id || '');
    } catch (e) {
      console.error('[MachineConfig] Failed to save active machine id:', e);
    }
  }, []);

  const activeUrl = buildUrl(activeMachine);

  return (
    <MachineConfigContext.Provider
      value={{
        machines,
        activeMachine,
        activeMachineId,
        activeUrl,
        recentActivities,
        recordMachineOpen,
        clearRecentActivities,
        addMachine,
        updateMachine,
        deleteMachine,
        selectActiveMachine,
        buildUrl
      }}
    >
      {children}
    </MachineConfigContext.Provider>
  );
};

// ── Custom hook ───────────────────────────────────────────────
export const useMachineConfig = () => {
  const ctx = useContext(MachineConfigContext);
  if (!ctx) {
    throw new Error('useMachineConfig must be used inside <MachineConfigProvider>');
  }
  return ctx;
};

export default MachineConfigContext;
