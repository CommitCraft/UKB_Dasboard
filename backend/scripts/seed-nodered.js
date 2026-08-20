const db = require('../src/config/db');

async function seedNodeRedPage() {
  try {
    const existing = await db.executeQuery("SELECT * FROM pages WHERE url IN ('/nodered', '/node-red')");
    let pageId;

    if (existing.length === 0) {
      const res = await db.executeQuery(
        `INSERT INTO pages (name, url, icon, type, parent_id, status, is_external, badge_label, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Node-RED', '/nodered', 'Workflow', 'menu', null, 'active', 0, 'Flow', 6]
      );
      pageId = res.insertId;
      console.log('Inserted Node-RED page with id:', pageId);
    } else {
      pageId = existing[0].id;
      console.log('Found existing Node-RED page with id:', pageId);
      await db.executeQuery("UPDATE pages SET icon = 'Workflow', name = 'Node-RED', status = 'active' WHERE id = ?", [pageId]);
    }

    // Assign to Super Admin (role_id 1) and Admin (role_id 2)
    for (const roleId of [1, 2]) {
      const rp = await db.executeQuery("SELECT * FROM role_pages WHERE role_id = ? AND page_id = ?", [roleId, pageId]);
      if (rp.length === 0) {
        await db.executeQuery("INSERT INTO role_pages (role_id, page_id, assigned_by) VALUES (?, ?, 1)", [roleId, pageId]);
        console.log(`Assigned page ${pageId} to role_id ${roleId}`);
      }
    }

    console.log('Node-RED page registration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedNodeRedPage();
