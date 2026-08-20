const db = require('../src/config/db');

async function seedExternalPages() {
  try {
    const pagesToAdd = [
      {
        name: 'Shift Master',
        url: 'http://192.168.1.37:1814/shift-master',
        icon: 'Clock',
        type: 'menu',
        parent_id: null,
        status: 'active',
        is_external: 1,
        badge_label: 'Shift',
        display_order: 8
      },
      {
        name: 'Shift Break Master',
        url: 'http://192.168.1.37:1814/shift-break-master',
        icon: 'Sliders',
        type: 'menu',
        parent_id: null,
        status: 'active',
        is_external: 1,
        badge_label: 'Break',
        display_order: 9
      },
      {
        name: 'Quality Check',
        url: 'http://192.168.1.37:1814/quality-check',
        icon: 'CheckSquare',
        type: 'menu',
        parent_id: null,
        status: 'active',
        is_external: 1,
        badge_label: 'QC',
        display_order: 10
      }
    ];

    for (const pageData of pagesToAdd) {
      const existing = await db.executeQuery("SELECT * FROM pages WHERE url = ?", [pageData.url]);
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
          `UPDATE pages SET name = ?, icon = ?, type = ?, status = 'active', is_external = 1, badge_label = ?, display_order = ?
           WHERE id = ?`,
          [pageData.name, pageData.icon, pageData.type, pageData.badge_label, pageData.display_order, pageId]
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

        // Also check role_pages_order table if exists
        try {
          const rpo = await db.executeQuery("SELECT * FROM role_pages_order WHERE role_id = ? AND page_id = ?", [roleId, pageId]);
          if (rpo.length === 0) {
            await db.executeQuery("INSERT INTO role_pages_order (role_id, page_id, display_order) VALUES (?, ?, ?)", [roleId, pageId, pageData.display_order]);
          }
        } catch (e) {
          // table optional
        }
      }
    }

    console.log('\n🎉 All external pages successfully added and permissions synced!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding external pages:', err);
    process.exit(1);
  }
}

seedExternalPages();
