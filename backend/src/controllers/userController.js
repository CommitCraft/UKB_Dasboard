const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const Role = require('../models/role');
const { UserRole } = require('../models/userRole');
const ActivityLog = require('../models/activityLog');
const { handleValidationError, AppError } = require('../middleware/errorHandler');

class UserController {
  // Get all users
  static async getUsers(req, res) {
    try {
      const { page = 1, limit = 1000, search = '', status = '' } = req.query;

      const result = await User.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status
      });

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Remove password from response
      const { password_hash, ...userResponse } = user;

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: {
          user: userResponse
        }
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create new user
  static async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { username, email, password, roles = [], status = 'active' } = req.body;
      const createdBy = req.user.id;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 12);

      // Create user
      const userData = {
        username,
        email,
        password_hash,
        status,
        created_by: createdBy
      };

      const newUser = await User.create(userData);

      // Assign roles if provided
      if (roles && roles.length > 0) {
        for (const roleId of roles) {
          // Verify role exists
          const role = await Role.findById(roleId);
          if (role) {
            await User.assignRole(newUser.id, roleId, createdBy);
          }
        }
      }

      // Get created user with roles
      const createdUser = await User.findById(newUser.id);
      const { password_hash: _, ...userResponse } = createdUser;

      // Log activity
      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.CREATE,
        ActivityLog.RESOURCES.USER,
        newUser.id,
        { username, email, roles, status },
        req
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: userResponse
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update user
  static async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { id } = req.params;
      const { username, email, password, roles, status } = req.body;
      const updatedBy = req.user.id;

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updateData = {};
      
      // Update basic fields
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (status !== undefined) updateData.status = status;

      // Update password if provided
      if (password) {
        updateData.password_hash = await bcrypt.hash(password, 12);
      }

      // Update user basic info
      let updatedUser = existingUser;
      if (Object.keys(updateData).length > 0) {
        updatedUser = await User.update(id, updateData);
      }

      // Update roles if provided
      if (roles !== undefined) {
        // Remove existing roles
        await UserRole.deleteAllByUser(id);
        
        // Assign new roles
        if (roles.length > 0) {
          for (const roleId of roles) {
            // Verify role exists
            const role = await Role.findById(roleId);
            if (role) {
              await User.assignRole(id, roleId, updatedBy);
            }
          }
        }
      }

      // Get updated user with roles
      const finalUser = await User.findById(id);
      const { password_hash: _, ...userResponse } = finalUser;

      // Log activity
      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.UPDATE,
        ActivityLog.RESOURCES.USER,
        parseInt(id),
        { username, email, roles, status },
        req
      );

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: {
          user: userResponse
        }
      });
    } catch (error) {
      console.error('Update user error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent self-deletion
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account'
        });
      }

      // Delete user (this will cascade delete user roles)
      const deleted = await User.delete(id);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete user'
        });
      }

      // Log activity
      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.DELETE,
        ActivityLog.RESOURCES.USER,
        parseInt(id),
        { username: existingUser.username, email: existingUser.email },
        req
      );

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Assign role to user
  static async assignRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { userId, roleId } = req.body;
      const assignedBy = req.user.id;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if role exists
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Assign role
      await User.assignRole(userId, roleId, assignedBy);

      // Log activity
      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.ROLE_ASSIGN,
        ActivityLog.RESOURCES.USER,
        userId,
        { role_name: role.name, role_id: roleId },
        req
      );

      res.status(200).json({
        success: true,
        message: `Role "${role.name}" assigned successfully`
      });
    } catch (error) {
      console.error('Assign role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign role',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Remove role from user
  static async removeRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { userId, roleId } = req.body;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if role exists
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Remove role
      const removed = await User.removeRole(userId, roleId);
      
      if (!removed) {
        return res.status(404).json({
          success: false,
          message: 'Role assignment not found'
        });
      }

      // Log activity
      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.ROLE_REMOVE,
        ActivityLog.RESOURCES.USER,
        userId,
        { role_name: role.name, role_id: roleId },
        req
      );

      res.status(200).json({
        success: true,
        message: `Role "${role.name}" removed successfully`
      });
    } catch (error) {
      console.error('Remove role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove role',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user roles
  static async getUserRoles(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const roles = await User.getUserRoles(id);

      res.status(200).json({
        success: true,
        message: 'User roles retrieved successfully',
        data: {
          user_id: parseInt(id),
          username: user.username,
          roles
        }
      });
    } catch (error) {
      console.error('Get user roles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user roles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user's assigned pages
  static async getUserPages(req, res) {
    try {
      const { id } = req.params;
      const { hierarchy = 'false' } = req.query;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const db = require('../config/db');
      const isSuperAdmin = Array.isArray(user.roles) && user.roles.includes('super_admin');

      let pages = [];
      if (isSuperAdmin) {
        const query = `
          SELECT p.id as page_id, p.id, p.name, p.url, p.icon, p.type, p.parent_id, p.is_external, p.status, p.display_order
          FROM pages p
          WHERE p.status = 'active'
          ORDER BY p.display_order ASC, p.name ASC
        `;
        pages = await db.executeQuery(query);
      } else {
        const query = `
          SELECT DISTINCT 
            p.id as page_id,
            p.id,
            p.name,
            p.url,
            p.icon,
            p.type,
            p.parent_id,
            p.is_external,
            p.status,
            p.display_order
          FROM pages p
          JOIN role_pages rp ON p.id = rp.page_id
          JOIN user_roles ur ON rp.role_id = ur.role_id
          WHERE ur.user_id = ? AND p.status = 'active'
          ORDER BY p.display_order ASC, p.name ASC
        `;
        pages = await db.executeQuery(query, [id]);
      }

      if (hierarchy === 'true') {
        const pageById = {};
        pages.forEach((p) => { pageById[p.id] = { ...p, children: [] }; });

        const rootPages = [];
        pages.forEach((p) => {
          const item = pageById[p.id];
          if (p.parent_id && pageById[p.parent_id]) {
            pageById[p.parent_id].children.push(item);
          } else {
            rootPages.push(item);
          }
        });

        return res.status(200).json({
          success: true,
          message: 'User pages retrieved successfully',
          data: { pages: rootPages, flat: pages }
        });
      }

      res.status(200).json({
        success: true,
        message: 'User pages retrieved successfully',
        data: { pages }
      });
    } catch (error) {
      console.error('Get user pages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user pages',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user statistics
  static async getUserStats(req, res) {
    try {
      const stats = await User.getStats();

      res.status(200).json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Export User Access Role-Wise Excel Report
  static async exportUserAccessExcel(req, res) {
    try {
      const ExcelJS = require('exceljs');
      const db = require('../config/db');

      const resolveInitialPassword = (username) => {
        const name = String(username || '').toLowerCase();
        if (name.includes('superadmin')) return 'SuperAdmin123!';
        if (name.includes('admin')) return 'Admin123!';
        if (name.includes('manager')) return 'Manager123!';
        if (name.includes('user')) return 'User123!';
        if (name.includes('test')) return 'Test123!';
        return `${username}123!`;
      };

      const usersQuery = `
        SELECT 
          u.id AS user_id,
          u.username,
          u.email,
          u.password_hash,
          u.status,
          u.created_at,
          u.last_login,
          GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') AS roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        GROUP BY u.id
        ORDER BY u.id ASC
      `;
      const users = await db.executeQuery(usersQuery);

      const rolePagesQuery = `
        SELECT 
          r.id AS role_id,
          r.name AS role_name,
          r.description AS role_description,
          p.id AS page_id,
          p.name AS page_name,
          p.url AS page_url,
          p.is_external
        FROM roles r
        LEFT JOIN role_pages rp ON r.id = rp.role_id
        LEFT JOIN pages p ON rp.page_id = p.id
        ORDER BY r.name ASC, p.name ASC
      `;
      const rolePages = await db.executeQuery(rolePagesQuery);

      const rolePagesMap = {};
      rolePages.forEach((rp) => {
        if (!rolePagesMap[rp.role_name]) {
          rolePagesMap[rp.role_name] = [];
        }
        if (rp.page_name) {
          rolePagesMap[rp.role_name].push(rp);
        }
      });

      const userAccessList = users.map((u) => {
        const roleList = u.roles ? u.roles.split(', ') : [];
        let pageSet = new Set();
        roleList.forEach((roleName) => {
          if (rolePagesMap[roleName]) {
            rolePagesMap[roleName].forEach((p) => pageSet.add(p.page_name));
          }
        });

        return {
          user_id: u.user_id,
          username: u.username,
          email: u.email || 'N/A',
          status: (u.status || 'active').toUpperCase(),
          roles: u.roles || 'No Role',
          initial_password: resolveInitialPassword(u.username),
          password_hash: u.password_hash || 'N/A',
          assigned_pages_count: pageSet.size,
          assigned_pages: Array.from(pageSet).join(', ') || 'No Assigned Pages',
          created_at: u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : 'N/A',
          last_login: u.last_login ? new Date(u.last_login).toLocaleString('en-GB') : 'Never'
        };
      });

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'CMSCRM System';
      workbook.created = new Date();

      const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E40AF' } };
      const headerFont = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      const dataFont = { name: 'Segoe UI', size: 10 };
      const borderStyle = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } }
      };

      // Sheet 1: User Access Role-Wise & Credentials
      const accessSheet = workbook.addWorksheet('User Access & Credentials');
      const accessHeaders = [
        'User ID',
        'Username',
        'Email Address',
        'Account Status',
        'Assigned Roles',
        'Initial / Default Password',
        'Bcrypt Password Hash',
        'Total Pages',
        'Accessible Pages List',
        'Created Date',
        'Last Login'
      ];
      const accessHeaderRow = accessSheet.addRow(accessHeaders);
      accessHeaderRow.font = headerFont;
      accessHeaderRow.height = 28;
      accessHeaderRow.eachCell((cell) => { cell.fill = headerFill; cell.alignment = { vertical: 'middle', horizontal: 'center' }; });

      userAccessList.forEach((item) => {
        const row = accessSheet.addRow([
          item.user_id,
          item.username,
          item.email,
          item.status,
          item.roles,
          item.initial_password,
          item.password_hash,
          item.assigned_pages_count,
          item.assigned_pages,
          item.created_at,
          item.last_login
        ]);
        row.font = dataFont;
        row.eachCell((cell) => { cell.border = borderStyle; cell.alignment = { vertical: 'middle' }; });
      });

      // Sheet 2: Role Permissions Matrix
      const matrixSheet = workbook.addWorksheet('Role Permissions Matrix');
      const matrixHeaderRow = matrixSheet.addRow(['Role Name', 'Page ID', 'Page Name', 'URL Route', 'External Page']);
      matrixHeaderRow.font = headerFont;
      matrixHeaderRow.height = 26;
      matrixHeaderRow.eachCell((cell) => { cell.fill = headerFill; cell.alignment = { vertical: 'middle', horizontal: 'center' }; });

      rolePages.forEach((rp) => {
        const row = matrixSheet.addRow([
          rp.role_name || 'N/A', rp.page_id || 'N/A', rp.page_name || 'N/A', rp.page_url || 'N/A', rp.is_external ? 'YES' : 'NO'
        ]);
        row.font = dataFont;
        row.eachCell((cell) => { cell.border = borderStyle; cell.alignment = { vertical: 'middle' }; });
      });

      [accessSheet, matrixSheet].forEach((sheet) => {
        sheet.columns.forEach((column) => {
          let maxLen = 12;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const len = cell.value ? String(cell.value).length : 0;
            if (len > maxLen) maxLen = len;
          });
          column.width = Math.min(maxLen + 4, 50);
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="User_Access_Role_Wise_Report.xlsx"');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Export user access excel error:', error);
      res.status(500).json({ success: false, message: 'Failed to export user access report' });
    }
  }
}

module.exports = UserController;