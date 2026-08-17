const db = require('../config/db');
const ActivityLog = require('../models/activityLog');

class MenuController {
  // Get full hierarchical menu tree (Section -> Menu -> Sub Menu -> Child Menu)
  static async getMenuTree(req, res) {
    try {
      const query = `
        SELECT * FROM pages
        ORDER BY display_order ASC, name ASC
      `;
      const pages = await db.executeQuery(query);

      // Build hierarchical tree
      const pageMap = {};
      const sectionsAndRoots = [];

      // First pass: create node objects
      pages.forEach(p => {
        pageMap[p.id] = {
          ...p,
          children: []
        };
      });

      // Second pass: link parents and children
      pages.forEach(p => {
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
          flat: pages
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

  // Create menu item (Section / Menu / Sub Menu / Child Menu)
  static async createMenuItem(req, res) {
    try {
      const {
        name,
        url = '',
        icon = 'Globe',
        type = 'menu',
        parent_id = null,
        display_order = 0,
        status = 'active',
        is_external = false
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Menu item name is required'
        });
      }

      // Default URL if empty
      const targetUrl = url.trim() || `/${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      const query = `
        INSERT INTO pages (name, url, icon, type, parent_id, display_order, status, is_external, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const result = await db.executeQuery(query, [
        name.trim(),
        targetUrl,
        icon,
        type,
        parent_id ? parseInt(parent_id) : null,
        parseInt(display_order) || 0,
        status,
        is_external ? 1 : 0,
        req.user?.id || null
      ]);

      const newItemQuery = `SELECT * FROM pages WHERE id = ?`;
      const newItems = await db.executeQuery(newItemQuery, [result.insertId]);

      if (req.user) {
        await ActivityLog.logUserAction(
          req.user.id,
          req.user.username,
          ActivityLog.ACTIONS.CREATE,
          ActivityLog.RESOURCES.PAGE,
          result.insertId,
          { name, type, parent_id },
          req
        );
      }

      res.status(201).json({
        success: true,
        message: 'Menu item created successfully',
        data: { item: newItems[0] }
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
      const {
        name,
        url,
        icon,
        type,
        parent_id,
        display_order,
        status,
        is_external
      } = req.body;

      const existingQuery = `SELECT * FROM pages WHERE id = ?`;
      const existing = await db.executeQuery(existingQuery, [id]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      const updates = [];
      const params = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name.trim());
      }
      if (url !== undefined) {
        updates.push('url = ?');
        params.push(url.trim());
      }
      if (icon !== undefined) {
        updates.push('icon = ?');
        params.push(icon);
      }
      if (type !== undefined) {
        updates.push('type = ?');
        params.push(type);
      }
      if (parent_id !== undefined) {
        updates.push('parent_id = ?');
        params.push(parent_id ? parseInt(parent_id) : null);
      }
      if (display_order !== undefined) {
        updates.push('display_order = ?');
        params.push(parseInt(display_order) || 0);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }
      if (is_external !== undefined) {
        updates.push('is_external = ?');
        params.push(is_external ? 1 : 0);
      }

      if (updates.length > 0) {
        const updateQuery = `UPDATE pages SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        params.push(id);
        await db.executeQuery(updateQuery, params);
      }

      const updatedItem = await db.executeQuery(existingQuery, [id]);

      if (req.user) {
        await ActivityLog.logUserAction(
          req.user.id,
          req.user.username,
          ActivityLog.ACTIONS.UPDATE,
          ActivityLog.RESOURCES.PAGE,
          parseInt(id),
          { name, type, parent_id },
          req
        );
      }

      res.status(200).json({
        success: true,
        message: 'Menu item updated successfully',
        data: { item: updatedItem[0] }
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

      // Check if item has children
      const childrenQuery = `SELECT COUNT(*) as count FROM pages WHERE parent_id = ?`;
      const childrenRes = await db.executeQuery(childrenQuery, [id]);
      if (childrenRes[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete menu item because it has sub-menu items assigned to it. Please reassign or delete sub-menu items first.'
        });
      }

      const deleteQuery = `DELETE FROM pages WHERE id = ?`;
      await db.executeQuery(deleteQuery, [id]);

      if (req.user) {
        await ActivityLog.logUserAction(
          req.user.id,
          req.user.username,
          ActivityLog.ACTIONS.DELETE,
          ActivityLog.RESOURCES.PAGE,
          parseInt(id),
          { id },
          req
        );
      }

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

  // Reorder menu items (Batch reordering)
  static async reorderMenuItems(req, res) {
    try {
      const { items } = req.body; // Array of { id, parent_id, display_order }
      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: 'Items array is required'
        });
      }

      for (const item of items) {
        const query = `
          UPDATE pages 
          SET display_order = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        await db.executeQuery(query, [
          parseInt(item.display_order) || 0,
          item.parent_id ? parseInt(item.parent_id) : null,
          parseInt(item.id)
        ]);
      }

      res.status(200).json({
        success: true,
        message: 'Menu items reordered successfully'
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

  // Toggle active/inactive status
  static async toggleMenuItemStatus(req, res) {
    try {
      const { id } = req.params;
      const selectQuery = `SELECT id, status FROM pages WHERE id = ?`;
      const items = await db.executeQuery(selectQuery, [id]);

      if (!items || items.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      const newStatus = items[0].status === 'active' ? 'inactive' : 'active';
      const updateQuery = `UPDATE pages SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await db.executeQuery(updateQuery, [newStatus, id]);

      res.status(200).json({
        success: true,
        message: `Menu item status updated to ${newStatus}`,
        data: { id: parseInt(id), status: newStatus }
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
