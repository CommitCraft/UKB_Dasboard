const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec, execFile } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const execFilePromise = util.promisify(execFile);
const pm2 = require('pm2');
const db = require('../config/db');
const backendPackage = require('../../package.json');

// Paths and Constants
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const PM2_SETUP_DIR = path.join(PROJECT_ROOT, 'PM2-Setup');
const ECOSYSTEM_FILE = path.join(PM2_SETUP_DIR, 'ecosystem.config.cjs');
const STARTUP_DIR = 'C:\\ProgramData\\Aplos_Logix';
const MAINTENANCE_FLAG = path.join(STARTUP_DIR, 'maintenance.flag');
const STARTUP_LOG = path.join(STARTUP_DIR, 'startup.log');
const HEALTH_LOG = path.join(STARTUP_DIR, 'health-check.log');
const STARTUP_TASK_NAME = 'Aplos_Logix-PM2-Startup';
const HEALTH_TASK_NAME = 'Aplos_Logix-PM2-HealthCheck';

const BACKEND_APP_NAME = 'aplos_logix-backend';
const FRONTEND_APP_NAME = 'aplos_logix-frontend-dev';

// Task status cache (cache for 60s to prevent frequent cmd execution)
const taskCache = {
  data: {},
  lastChecked: 0,
  CACHE_TTL_MS: 60 * 1000
};

// Helper to format uptime into human readable string
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0s';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.slice(0, 2).join(' ');
}

// Find pm2 command path
function getPm2Command() {
  const customPath = path.join(process.env.APPDATA || 'C:\\Users\\DELL\\AppData\\Roaming', 'npm', 'pm2.cmd');
  if (fs.existsSync(customPath)) {
    return `"${customPath}"`;
  }
  return 'pm2';
}

// PM2 Process List with fast caching and non-blocking execution
const pm2Cache = {
  data: [],
  lastChecked: 0,
  CACHE_TTL_MS: 3000 // 3 seconds cache
};

// Promisified PM2 list via CLI
async function getPm2ProcessList() {
  const now = Date.now();
  if (now - pm2Cache.lastChecked < pm2Cache.CACHE_TTL_MS && pm2Cache.data.length > 0) {
    return pm2Cache.data;
  }

  try {
    const pm2Cmd = getPm2Command();
    const { stdout } = await execPromise(`${pm2Cmd} jlist`, {
      shell: true,
      windowsHide: true,
      timeout: 2500,
      encoding: 'utf8'
    });

    if (stdout && stdout.trim()) {
      const parsed = JSON.parse(stdout.trim());
      if (Array.isArray(parsed)) {
        pm2Cache.data = parsed;
        pm2Cache.lastChecked = now;
        return parsed;
      }
    }
  } catch (err) {
    // Return cached data if available or empty list on timeout
  }

  return pm2Cache.data || [];
}

// Query Scheduled Task status silently via execFile with windowsHide: true
async function getScheduledTaskStatus(taskName) {
  const now = Date.now();
  if (taskCache.data[taskName] && (now - taskCache.lastChecked < taskCache.CACHE_TTL_MS)) {
    return taskCache.data[taskName];
  }

  try {
    const { stdout } = await execFilePromise(
      'schtasks.exe',
      ['/query', '/tn', taskName, '/fo', 'CSV', '/nh'],
      { windowsHide: true, timeout: 3000 }
    );

    if (stdout && stdout.trim()) {
      const parts = stdout.trim().split(',').map(s => s.replace(/"/g, '').trim());
      // format: "TaskName","Next Run Time","Status"
      const result = {
        configured: true,
        status: parts[2] || 'Ready',
        nextRun: parts[1] || 'N/A'
      };
      taskCache.data[taskName] = result;
      taskCache.lastChecked = now;
      return result;
    }
    const result = { configured: false, status: 'Not Configured', nextRun: 'N/A' };
    taskCache.data[taskName] = result;
    return result;
  } catch {
    const result = { configured: false, status: 'Not Configured', nextRun: 'N/A' };
    taskCache.data[taskName] = result;
    return result;
  }
}

class ControlController {
  /**
   * Get full live status for project, PM2, DB, OS, and tasks
   */
  async getProjectStatus(req, res) {
    try {
      // 1. Database Connection Test
      let dbConnected = false;
      let dbLatencyMs = 0;
      const dbStart = Date.now();
      try {
        const testRes = await db.executeQuery('SELECT 1 as ping');
        if (testRes && testRes.length > 0) {
          dbConnected = true;
          dbLatencyMs = Date.now() - dbStart;
        }
      } catch (err) {
        dbConnected = false;
      }

      // 2. PM2 Processes info
      const rawProcesses = await getPm2ProcessList();
      const processes = rawProcesses.map((proc) => {
        const pm2Env = proc.pm2_env || {};
        const monit = proc.monit || {};
        const uptimeSeconds = pm2Env.pm_uptime ? Math.floor((Date.now() - pm2Env.pm_uptime) / 1000) : 0;

        return {
          name: proc.name,
          pid: proc.pid,
          pm_id: proc.pm_id,
          status: pm2Env.status || 'stopped',
          cpu: monit.cpu || 0,
          memoryBytes: monit.memory || 0,
          memoryMB: monit.memory ? Math.round(monit.memory / (1024 * 1024)) : 0,
          uptimeSeconds,
          uptimeFormatted: formatDuration(uptimeSeconds),
          restartCount: pm2Env.restart_time || 0,
          unstableRestarts: pm2Env.unstable_restarts || 0,
          createdAt: pm2Env.created_at ? new Date(pm2Env.created_at).toISOString() : null,
          lastRestartTime: pm2Env.pm_uptime ? new Date(pm2Env.pm_uptime).toLocaleString() : 'N/A'
        };
      });

      const backendProc = processes.find(p => p.name === BACKEND_APP_NAME);
      const frontendProc = processes.find(p => p.name === FRONTEND_APP_NAME);

      // 3. Maintenance Flag Check
      const isMaintenanceMode = fs.existsSync(MAINTENANCE_FLAG);

      // 4. System OS Metrics
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memPercentage = Math.round((usedMem / totalMem) * 100);

      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      cpus.forEach((cpu) => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });
      const cpuUsagePercent = totalTick > 0 ? Math.max(0, Math.min(100, Math.round(100 - (100 * totalIdle / totalTick)))) : 0;

      // 5. Windows Scheduled Tasks Status (cached & executed silently with windowsHide)
      const [autoStartTask, healthCheckTask] = await Promise.all([
        getScheduledTaskStatus(STARTUP_TASK_NAME),
        getScheduledTaskStatus(HEALTH_TASK_NAME)
      ]);

      // 6. Overall Application State Determination
      let appStatus = 'OFFLINE';
      let pm2Status = 'STOPPED';

      if (backendProc && backendProc.status === 'online') {
        if (frontendProc && frontendProc.status === 'online') {
          appStatus = 'ONLINE';
          pm2Status = 'ONLINE';
        } else {
          appStatus = 'DEGRADED';
          pm2Status = 'DEGRADED';
        }
      } else if (backendProc && backendProc.status === 'errored') {
        appStatus = 'ERROR';
        pm2Status = 'ERROR';
      }

      if (isMaintenanceMode) {
        appStatus = 'MAINTENANCE';
      }

      let systemHealth = 'HEALTHY';
      if (appStatus === 'ERROR' || !dbConnected) {
        systemHealth = 'UNHEALTHY';
      } else if (appStatus === 'DEGRADED' || appStatus === 'MAINTENANCE' || memPercentage > 90 || cpuUsagePercent > 85) {
        systemHealth = 'WARNING';
      }

      // 7. Aggregate Total PM2 Memory and Restart Count
      const totalPm2MemoryMB = processes.reduce((acc, p) => acc + (p.memoryMB || 0), 0);
      const totalRestartCount = processes.reduce((acc, p) => acc + (p.restartCount || 0), 0);
      const longestPm2Uptime = processes.reduce((max, p) => Math.max(max, p.uptimeSeconds || 0), 0);

      // 8. Health log metadata
      let lastHealthCheckTime = null;
      try {
        if (fs.existsSync(HEALTH_LOG)) {
          const stats = fs.statSync(HEALTH_LOG);
          lastHealthCheckTime = stats.mtime.toLocaleString();
        }
      } catch {}

      return res.status(200).json({
        success: true,
        data: {
          summary: {
            systemHealth,
            appStatus,
            dbStatus: dbConnected ? 'CONNECTED' : 'DISCONNECTED',
            dbLatencyMs,
            pm2Status,
            cpuUsagePercent,
            memoryUsedMB: Math.round(usedMem / (1024 * 1024)),
            memoryTotalMB: Math.round(totalMem / (1024 * 1024)),
            memoryPercent: memPercentage,
            serverUptimeFormatted: formatDuration(os.uptime()),
            serverUptimeSeconds: os.uptime(),
            isMaintenanceMode,
            version: backendPackage.version || '1.0.0'
          },
          pm2: {
            processes,
            totalMemoryMB: totalPm2MemoryMB,
            totalRestarts: totalRestartCount,
            uptimeFormatted: formatDuration(longestPm2Uptime),
            backend: backendProc || null,
            frontend: frontendProc || null
          },
          database: {
            connected: dbConnected,
            latencyMs: dbLatencyMs,
            host: process.env.DB_HOST || '127.0.0.1',
            database: process.env.DB_NAME || 'aplos_logix'
          },
          system: {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            processUptimeFormatted: formatDuration(process.uptime()),
            cpuCores: cpus.length,
            cpuModel: cpus[0]?.model || 'Generic CPU',
            freeMemoryMB: Math.round(freeMem / (1024 * 1024))
          },
          windows: {
            autoStart: autoStartTask,
            healthCheck: healthCheckTask,
            maintenanceFlag: isMaintenanceMode,
            lastHealthCheckTime,
            startupDir: STARTUP_DIR
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting project status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve project status: ' + error.message
      });
    }
  }

  /**
   * Execute predefined project actions: start, stop, restart, status
   * Strictly validates allowed actions — NO arbitrary commands.
   * Runs hidden with windowsHide: true so no terminal flashes.
   */
  async executeControlAction(req, res) {
    const { action } = req.body;
    const allowedActions = ['start', 'stop', 'restart', 'status'];

    if (!action || !allowedActions.includes(action.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid action "${action}". Allowed actions: ${allowedActions.join(', ')}`
      });
    }

    const pm2Cmd = getPm2Command();
    const actionClean = action.toLowerCase();
    const execOpts = { windowsHide: true };

    try {
      if (actionClean === 'status') {
        return this.getProjectStatus(req, res);
      }

      if (actionClean === 'stop') {
        // 1. Ensure startup directory exists and set maintenance flag
        if (!fs.existsSync(STARTUP_DIR)) {
          fs.mkdirSync(STARTUP_DIR, { recursive: true });
        }
        fs.writeFileSync(MAINTENANCE_FLAG, `MAINTENANCE SET AT ${new Date().toISOString()}`);

        // 2. Stop PM2 processes safely and silently
        await execPromise(`${pm2Cmd} stop "${BACKEND_APP_NAME}" "${FRONTEND_APP_NAME}" 2>nul || ${pm2Cmd} stop all`, execOpts);
        
        return res.status(200).json({
          success: true,
          message: 'Applications stopped successfully and maintenance mode enabled.',
          action: 'stop'
        });
      }

      if (actionClean === 'start') {
        // 1. Remove maintenance flag if present
        if (fs.existsSync(MAINTENANCE_FLAG)) {
          try { fs.unlinkSync(MAINTENANCE_FLAG); } catch {}
        }

        // 2. Start or reload applications idempotently from ecosystem config silently
        const cmd = `cd /d "${PM2_SETUP_DIR}" && ${pm2Cmd} startOrReload "${ECOSYSTEM_FILE}" --update-env && ${pm2Cmd} save --force`;
        await execPromise(cmd, execOpts);

        return res.status(200).json({
          success: true,
          message: 'Applications started successfully and PM2 state saved.',
          action: 'start'
        });
      }

      if (actionClean === 'restart') {
        // 1. Remove maintenance flag
        if (fs.existsSync(MAINTENANCE_FLAG)) {
          try { fs.unlinkSync(MAINTENANCE_FLAG); } catch {}
        }

        // 2. Restart both apps safely and silently
        const cmd = `cd /d "${PM2_SETUP_DIR}" && ${pm2Cmd} restart "${BACKEND_APP_NAME}" "${FRONTEND_APP_NAME}" 2>nul || ${pm2Cmd} startOrReload "${ECOSYSTEM_FILE}" --update-env`;
        await execPromise(cmd, execOpts);

        return res.status(200).json({
          success: true,
          message: 'Applications restarted successfully.',
          action: 'restart'
        });
      }
    } catch (error) {
      console.error(`Error executing control action "${actionClean}":`, error);
      return res.status(500).json({
        success: false,
        message: `Action "${actionClean}" failed: ${error.message || 'Execution error'}`
      });
    }
  }
}

module.exports = new ControlController();
