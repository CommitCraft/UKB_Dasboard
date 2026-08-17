const db = require('../config/db');
const ActivityLog = require('../models/activityLog');

class MenuController {
  // Get hierarchical menu tree (Filtered by assigned user roles for standard users, full tree for super_admin or all=true)
  static async getMenuTree(req, res) {
    try {
      const user = req.user;
      const isSuperAdmin = Array.isArray(user?.roles) && user.roles.includes('super_admin');
      const showAll = req.query.all === 'true' || isSuperAdmin;

      const queryAll = `
        SELECT * FROM pages
        ORDER BY display_order ASC, name ASC
      `;
      const allPages = await db.executeQuery(queryAll);

      let visiblePages = [];

      if (showAll) {
        visiblePages = allPages;
      } else {
        const userId = user?.id;
        const assignedSet = new Set();

        // 1. Get assigned pages from role_pages
        if (userId) {
          const assignedQuery = `
            SELECT DISTINCT p.id
            FROM pages p
            JOIN role_pages rp ON p.id = rp.page_id
            JOIN user_roles ur ON rp.role_id = ur.role_id
            WHERE ur.user_id = ? AND p.status = 'active'
          `;
          const assignedRows = await db.executeQuery(assignedQuery, [userId]);
          assignedRows.forEach(r => assignedSet.add(r.id));

          // 2. Also check role_pages_order table
          try {
            const orderQuery = `
              SELECT DISTINCT p.id
              FROM pages p
              JOIN role_pages_order rpo ON p.id = rpo.page_id
              JOIN user_roles ur ON rpo.role_id = ur.role_id
              WHERE ur.user_id = ? AND p.status = 'active'
            `;
            const orderRows = await db.executeQuery(orderQuery, [userId]);
            orderRows.forEach(r => assignedSet.add(r.id));
          } catch (e) {
            // Table optional
          }
        }

        // Build parent map to ensure parent container nodes remain visible for assigned children
        const pageById = {};
        allPages.forEach(p => { pageById[p.id] = p; });

        const allowedSet = new Set();
        assignedSet.forEach(id => {
          let curr = pageById[id];
          while (curr) {
            allowedSet.add(curr.id);
            curr = curr.parent_id ? pageById[curr.parent_id] : null;
          }
        });

        visiblePages = allPages.filter(p => allowedSet.has(p.id) && p.status === 'active');
      }

      // Build hierarchical tree
      const pageMap = {};
      const sectionsAndRoots = [];

      // First pass: create node objects
      visiblePages.forEach(p => {
        pageMap[p.id] = {
          ...p,
          children: []
        };
      });

      // Second pass: link parents and children
      visiblePages.forEach(p => {
        const item = pageMap[p.id];
        if (p.parent_id && pageMap[p.parent_id]) {
          pageMap[p.parent_id].children.push(item);
        } else {
          sectionsAndRoots.push(item);
        }
      });

      res.status(200).json({
        success: true,
        message: 'Menu tree retrieved successfully',
        data: {
          items: sectionsAndRoots,
          flat: visiblePages
        }
      });
    } catch (error) {
      console.error('Get menu tree error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve menu tree',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create menu item
  static async createMenuItem(req, res) {
    try {
      const { name, url, icon, type = 'menu', parent_id = null, status = 'active', is_external = false } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }

      const countResult = await db.executeQuery('SELECT MAX(display_order) as max_order FROM pages');
      const maxOrder = (countResult[0]?.max_order || 0) + 1;

      const insertQuery = `
        INSERT INTO pages (name, url, icon, type, parent_id, status, is_external, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const result = await db.executeQuery(insertQuery, [
        name,
        url || '',
        icon || 'Globe',
        type,
        parent_id || null,
        status,
        is_external ? 1 : 0,
        maxOrder
      ]);

      const newId = result.insertId;

      // Auto assign newly created menu item to Super Admin role
      try {
        const superAdminRole = await db.executeQuery('SELECT id FROM roles WHERE name = "super_admin" LIMIT 1');
        if (superAdminRole.length > 0) {
          const roleId = superAdminRole[0].id;
          await db.executeQuery('INSERT IGNORE INTO role_pages (role_id, page_id) VALUES (?, ?)', [roleId, newId]);
        }
      } catch (e) {
        console.error('Auto assign super_admin error:', e);
      }

      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.CREATE,
        ActivityLog.RESOURCES.PAGE,
        newId,
        { name, url, type, parent_id },
        req
      );

      res.status(201).json({
        success: true,
        message: 'Menu item created successfully',
        data: { id: newId, name, url, type, parent_id }
      });
    } catch (error) {
      console.error('Create menu item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create menu item',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update menu item
  static async updateMenuItem(req, res) {
    try {
      const { id } = req.params;
      const { name, url, icon, type, parent_id, status, is_external } = req.body;

      const updateQuery = `
        UPDATE pages
        SET name = COALESCE(?, name),
            url = COALESCE(?, url),
            icon = COALESCE(?, icon),
            type = COALESCE(?, type),
            parent_id = ?,
            status = COALESCE(?, status),
            is_external = COALESCE(?, is_external)
        WHERE id = ?
      `;

      await db.executeQuery(updateQuery, [
        name,
        url,
        icon,
        type,
        parent_id || null,
        status,
        is_external !== undefined ? (is_external ? 1 : 0) : null,
        id
      ]);

      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.UPDATE,
        ActivityLog.RESOURCES.PAGE,
        parseInt(id),
        { name, url, type, parent_id },
        req
      );

      res.status(200).json({
        success: true,
        message: 'Menu item updated successfully'
      });
    } catch (error) {
      console.error('Update menu item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update menu item',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete menu item
  static async deleteMenuItem(req, res) {
    try {
      const { id } = req.params;

      const childCheck = await db.executeQuery('SELECT id FROM pages WHERE parent_id = ? LIMIT 1', [id]);
      if (childCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete item because it has sub-menu items assigned to it'
        });
      }

      await db.executeQuery('DELETE FROM role_pages WHERE page_id = ?', [id]);
      await db.executeQuery('DELETE FROM role_pages_order WHERE page_id = ?', [id]);
      await db.executeQuery('DELETE FROM pages WHERE id = ?', [id]);

      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.DELETE,
        ActivityLog.RESOURCES.PAGE,
        parseInt(id),
        {},
        req
      );

      res.status(200).json({
        success: true,
        message: 'Menu item deleted successfully'
      });
    } catch (error) {
      console.error('Delete menu item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete menu item',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Reorder items
  static async reorderMenuItems(req, res) {
    try {
      const { items } = req.body; // Array of { id, parent_id, display_order }
      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, message: 'Invalid payload' });
      }

      for (const item of items) {
        await db.executeQuery(
          'UPDATE pages SET display_order = ?, parent_id = ? WHERE id = ?',
          [item.display_order, item.parent_id || null, item.id]
        );
      }

      res.status(200).json({
        success: true,
        message: 'Menu order updated successfully'
      });
    } catch (error) {
      console.error('Reorder menu items error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reorder menu items',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Toggle status
  static async toggleMenuItemStatus(req, res) {
    try {
      const { id } = req.params;
      await db.executeQuery(
        "UPDATE pages SET status = IF(status = 'active', 'inactive', 'active') WHERE id = ?",
        [id]
      );

      res.status(200).json({
        success: true,
        message: 'Status updated successfully'
      });
    } catch (error) {
      console.error('Toggle status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = MenuController;
