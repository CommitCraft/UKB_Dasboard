const db = require('../src/config/db');

async function seedMoreExternalPages() {
  try {
    const pagesToAdd = [
      {
        name: 'Production Log',
        url: 'http://192.168.1.37:1814/production-log',
        icon: 'ClipboardList',
        type: 'menu',
        parent_id: null,
        status: 'active',
        is_external: 1,
        badge_label: 'Prod',
        display_order: 11
      },
      {
        name: 'Quality Log',
        url: 'http://192.168.1.37:1814/quality-log',
        icon: 'CheckCircle2',
        type: 'menu',
        parent_id: null,
        status: 'active',
        is_external: 1,
        badge_label: 'Quality',
        display_order: 12
      },
      {
        name: 'Production Plan',
        url: 'http://192.168.1.37:1814/production-plan',
        icon: 'Calendar',
        type: 'menu',
        parent_id: null,
        status: 'active',
        is_external: 1,
        badge_label: 'Plan',
        display_order: 13
      },
      {
        name: 'Downtime Reasons',
        url: 'http://192.168.1.37:1814/downtime-reasons',
        icon: 'Clock',
        type: 'menu',
        parent_id: null,
        status: 'active',
        is_external: 1,
        badge_label: 'Downtime',
        display_order: 14
      },
      {
        name: 'Addon (Line 1)',
        url: 'http://192.168.1.37:1814/addon?lineId=1',
        icon: 'Boxes',
        type: 'menu',
        parent_id: null,
        status: 'active',
        is_external: 1,
        badge_label: 'Addon',
        display_order: 15
      },
      {
        name: 'OEE Dashboard (Line 1)',
        url: 'http://192.168.1.37:1814/oee-dashboard?lineId=1',
        icon: 'BarChart2',
        type: 'menu',
        parent_id: null,
        status: 'active',
        is_external: 1,
        badge_label: 'OEE',
        display_order: 16
      }
    ];

    for (const pageData of pagesToAdd) {
      // Check both exact url and possible variants (like lineId-1)
      const existing = await db.executeQuery("SELECT * FROM pages WHERE url = ? OR url = ?", [
        pageData.url,
        pageData.url.replace('lineId=1', 'lineId-1')
      ]);
      let pageId;

      if (existing.length === 0) {
        const res = await db.executeQuery(
          `INSERT INTO pages (name, url, icon, type, parent_id, status, is_external, badge_label, display_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pageData.name,
            pageData.url,
            pageData.icon,
            pageData.type,
            pageData.parent_id,
            pageData.status,
            pageData.is_external,
            pageData.badge_label,
            pageData.display_order
          ]
        );
        pageId = res.insertId;
        console.log(`✅ Inserted page "${pageData.name}" with ID: ${pageId}`);
      } else {
        pageId = existing[0].id;
        console.log(`ℹ️ Page "${pageData.name}" already exists with ID: ${pageId}`);
        await db.executeQuery(
          `UPDATE pages SET name = ?, url = ?, icon = ?, type = ?, status = 'active', is_external = 1, badge_label = ?, display_order = ?
           WHERE id = ?`,
          [pageData.name, pageData.url, pageData.icon, pageData.type, pageData.badge_label, pageData.display_order, pageId]
        );
      }

      // Assign to Super Admin (role_id 1) and Admin (role_id 2)
      for (const roleId of [1, 2]) {
        const rp = await db.executeQuery("SELECT * FROM role_pages WHERE role_id = ? AND page_id = ?", [roleId, pageId]);
        if (rp.length === 0) {
          await db.executeQuery("INSERT INTO role_pages (role_id, page_id, assigned_by) VALUES (?, ?, 1)", [roleId, pageId]);
          console.log(`  ➕ Assigned page ${pageId} (${pageData.name}) to role_id ${roleId}`);
        } else {
          console.log(`  ✔ Already assigned to role_id ${roleId}`);
        }

        try {
          const rpo = await db.executeQuery("SELECT * FROM role_pages_order WHERE role_id = ? AND page_id = ?", [roleId, pageId]);
          if (rpo.length === 0) {
            await db.executeQuery("INSERT INTO role_pages_order (role_id, page_id, display_order) VALUES (?, ?, ?)", [roleId, pageId, pageData.display_order]);
          }
        } catch (e) {
          // Table optional
        }
      }
    }

    console.log('\n🎉 All requested production & OEE external pages successfully added!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding external pages:', err);
    process.exit(1);
  }
}

seedMoreExternalPages();
