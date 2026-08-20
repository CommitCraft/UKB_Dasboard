const db = require('../src/config/db');

async function organizeMenuGroups() {
  try {
    console.log('🔄 Starting Menu Hierarchy Grouping reorganization...');

    // 1. Define groups and their children
    const groupDefinitions = [
      {
        group: {
          name: 'Master Management',
          url: '',
          icon: 'FolderTree',
          type: 'menu',
          parent_id: null,
          status: 'active',
          is_external: 0,
          badge_label: 'Masters',
          display_order: 2
        },
        children: [
          { url: 'http://192.168.1.37:1814/line-master', name: 'Line Master', icon: 'Workflow', badge: 'Line', order: 1 },
          { url: 'http://192.168.1.37:1814/shift-master', name: 'Shift Master', icon: 'Clock', badge: 'Shift', order: 2 },
          { url: 'http://192.168.1.37:1814/shift-break-master', name: 'Shift Break Master', icon: 'Sliders', badge: 'Break', order: 3 },
          { url: 'http://192.168.1.37:1814/downtime-reasons', name: 'Downtime Reasons', icon: 'Clock', badge: 'Downtime', order: 4 }
        ]
      },
      {
        group: {
          name: 'Production & Operations',
          url: '',
          icon: 'ClipboardList',
          type: 'menu',
          parent_id: null,
          status: 'active',
          is_external: 0,
          badge_label: 'Prod',
          display_order: 3
        },
        children: [
          { url: 'http://192.168.1.37:1814/production-plan', name: 'Production Plan', icon: 'Calendar', badge: 'Plan', order: 1 },
          { url: 'http://192.168.1.37:1814/production-log', name: 'Production Log', icon: 'FileSpreadsheet', badge: 'Prod', order: 2 },
          { url: 'http://192.168.1.37:1814/quality-check', name: 'Quality Check', icon: 'CheckSquare', badge: 'QC', order: 3 },
          { url: 'http://192.168.1.37:1814/quality-log', name: 'Quality Log', icon: 'CheckCircle2', badge: 'Quality', order: 4 },
          { url: 'http://192.168.1.37:1814/addon?lineId=1', name: 'Addon (Line 1)', icon: 'Boxes', badge: 'Addon', order: 5 }
        ]
      },
      {
        group: {
          name: 'Analytics & Monitoring',
          url: '',
          icon: 'BarChart2',
          type: 'menu',
          parent_id: null,
          status: 'active',
          is_external: 0,
          badge_label: 'Stats',
          display_order: 4
        },
        children: [
          { url: 'http://192.168.1.37:1814/oee-dashboard?lineId=1', name: 'OEE Dashboard (Line 1)', icon: 'BarChart2', badge: 'OEE', order: 1 },
          { url: '/nodered', name: 'Flow Editor', icon: 'Workflow', badge: 'Flow', order: 2 }
        ]
      },
      {
        group: {
          name: 'System Administration',
          url: '',
          icon: 'Shield',
          type: 'menu',
          parent_id: null,
          status: 'active',
          is_external: 0,
          badge_label: 'Admin',
          display_order: 5
        },
        children: [
          { url: '/users', name: 'Users Management', icon: 'Users', badge: null, order: 1 },
          { url: '/roles', name: 'Roles Management', icon: 'Shield', badge: null, order: 2 },
          { url: '/pages', name: 'Pages Management', icon: 'FileText', badge: null, order: 3 },
          { url: '/menus', name: 'Menu Management', icon: 'FolderTree', badge: null, order: 4 },
          { url: '/activity', name: 'Activity Logs', icon: 'Activity', badge: null, order: 5 }
        ]
      }
    ];

    // Ensure Dashboard is root item at order 1
    await db.executeQuery("UPDATE pages SET display_order = 1, parent_id = NULL, type = 'menu' WHERE url = '/dashboard'");
    console.log('✅ Dashboard updated as root Level 1 item (order 1)');

    for (const item of groupDefinitions) {
      // Find or create the parent group
      let parentPage = await db.executeQuery("SELECT * FROM pages WHERE name = ? AND (url = '' OR url IS NULL)", [item.group.name]);
      let parentId;

      if (parentPage.length === 0) {
        const insertRes = await db.executeQuery(
          `INSERT INTO pages (name, url, icon, type, parent_id, status, is_external, badge_label, display_order)
           VALUES (?, '', ?, 'menu', NULL, 'active', 0, ?, ?)`,
          [item.group.name, item.group.icon, item.group.badge_label, item.group.display_order]
        );
        parentId = insertRes.insertId;
        console.log(`✅ Created parent group "${item.group.name}" with ID: ${parentId}`);
      } else {
        parentId = parentPage[0].id;
        await db.executeQuery(
          `UPDATE pages SET icon = ?, type = 'menu', parent_id = NULL, status = 'active', badge_label = ?, display_order = ?
           WHERE id = ?`,
          [item.group.icon, item.group.badge_label, item.group.display_order, parentId]
        );
        console.log(`ℹ️ Updated parent group "${item.group.name}" (ID: ${parentId})`);
      }

      // Assign Parent Group to Super Admin (1) and Admin (2)
      for (const roleId of [1, 2]) {
        const rp = await db.executeQuery("SELECT * FROM role_pages WHERE role_id = ? AND page_id = ?", [roleId, parentId]);
        if (rp.length === 0) {
          await db.executeQuery("INSERT INTO role_pages (role_id, page_id, assigned_by) VALUES (?, ?, 1)", [roleId, parentId]);
        }
      }

      // Update and attach children
      for (const child of item.children) {
        const matched = await db.executeQuery("SELECT * FROM pages WHERE url = ?", [child.url]);
        if (matched.length > 0) {
          const childId = matched[0].id;
          await db.executeQuery(
            `UPDATE pages SET name = ?, icon = ?, type = 'submenu', parent_id = ?, badge_label = ?, display_order = ?
             WHERE id = ?`,
            [child.name, child.icon, parentId, child.badge, child.order, childId]
          );
          console.log(`   ↳ Nested child "${child.name}" (ID: ${childId}) under parent ID ${parentId} (Order: ${child.order})`);

          // Ensure roles are assigned for children
          for (const roleId of [1, 2]) {
            const rp = await db.executeQuery("SELECT * FROM role_pages WHERE role_id = ? AND page_id = ?", [roleId, childId]);
            if (rp.length === 0) {
              await db.executeQuery("INSERT INTO role_pages (role_id, page_id, assigned_by) VALUES (?, ?, 1)", [roleId, childId]);
            }
          }
        } else {
          console.warn(`   ⚠️ Child URL not found: ${child.url}`);
        }
      }
    }

    console.log('\n🎉 Menu hierarchy grouping completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Reorganization error:', err);
    process.exit(1);
  }
}

organizeMenuGroups();
