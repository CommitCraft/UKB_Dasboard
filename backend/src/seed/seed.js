const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Drop and recreate database
    console.log('🗑️ Dropping and recreating database...');
    await db.dropDatabase();
    
    // Test database connection
    await db.testConnection();
    
    // Create tables
    console.log('📋 Creating tables...');
    await db.createTables();

    // Check if data already exists
    const existingUsers = await db.executeQuery('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count > 0) {
      console.log('📊 Database already has data. Skipping seed...');
      return;
    }

    console.log('🔐 Creating default roles...');
    await createDefaultRoles();

    console.log('📄 Creating default pages...');
    await createDefaultPages();

    console.log('👤 Creating default admin user...');
    await createDefaultUsers();

    console.log('🔗 Setting up role-page assignments...');
    await assignRolesToPages();

    console.log('👨‍💼 Assigning roles to users...');
    await assignRolesToUsers();

    console.log('📝 Creating sample activity logs...');
    await createSampleActivityLogs();

    console.log('✅ Database seeding completed successfully!');

    // Display default credentials
    console.log('\n🚀 Default Admin Credentials:');
    console.log(`Email: ${process.env.DEFAULT_ADMIN_EMAIL || 'admin@aplos_logix.com'}`);
    console.log(`Password: ${process.env.DEFAULT_ADMIN_PASS || 'Admin123!'}`);
    console.log('\n🔧 Manager Credentials:');
    console.log(`Email: ${process.env.DEFAULT_MANAGER_EMAIL || 'manager@aplos_logix.com'}`);
    console.log(`Password: ${process.env.DEFAULT_MANAGER_PASS || 'Manager123!'}`);
    console.log('\n👤 User Credentials:');
    console.log(`Email: ${process.env.DEFAULT_USER_EMAIL || 'user@aplos_logix.com'}`);
    console.log(`Password: ${process.env.DEFAULT_USER_PASS || 'User123!'}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

async function createDefaultRoles() {
  const roles = [
    {
      name: 'super_admin',
      description: 'Super Administrator with full system access'
    },
    {
      name: 'admin',
      description: 'Administrator with management access'
    },
    {
      name: 'manager',
      description: 'Manager with limited administrative access'
    },
    {
      name: 'user',
      description: 'Regular user with basic access'
    }
  ];

  for (const role of roles) {
    await db.executeQuery(
      'INSERT INTO roles (name, description) VALUES (?, ?)',
      [role.name, role.description]
    );
  }

  console.log(`✅ Created ${roles.length} default roles`);
}

async function createDefaultPages() {
  const pages = [
    // Admin Pages
    {
      name: 'Dashboard',
      url: '/dashboard',
      icon: null,
      is_external: false
    },
    {
      name: 'Users Management',
      url: '/users',
      icon: null,
      is_external: false
    },
    {
      name: 'Roles Management',
      url: '/roles',
      icon: null,
      is_external: false
    },
    {
      name: 'Pages Management',
      url: '/pages',
      icon: null,
      is_external: false
    },
    {
      name: 'Menu Management',
      url: '/menus',
      icon: 'FolderTree',
      is_external: false
    },
    {
      name: 'Activity Logs',
      url: '/activity',
      icon: null,
      is_external: false
    },
    {
      name: 'System Settings',
      url: '/settings',
      icon: null,
      is_external: false
    },
    {
      name: 'Reports',
      url: '/reports',
      icon: null,
      is_external: false
    },
    // User Pages
    {
      name: 'Profile',
      url: '/profile',
      icon: null,
      is_external: false
    },
    {
      name: 'Help Center',
      url: '/help',
      icon: null,
      is_external: false
    },
    // External Pages
    {
      name: 'Company Website',
      url: 'https://example.com',
      icon: null,
      is_external: true
    },
    {
      name: 'Documentation',
      url: 'https://docs.example.com',
      icon: null,
      is_external: true
    }
  ];

  for (const page of pages) {
    await db.executeQuery(
      'INSERT INTO pages (name, url, icon, is_external) VALUES (?, ?, ?, ?)',
      [page.name, page.url, page.icon, page.is_external]
    );
  }

  console.log(`✅ Created ${pages.length} default pages`);
}

async function createDefaultUsers() {
  const users = [
    {
      username: 'superadmin',
      email: process.env.DEFAULT_SUPERADMIN_EMAIL || 'superadmin@aplos_logix.com',
      password: process.env.DEFAULT_SUPERADMIN_PASS || 'SuperAdmin123!',
      status: 'active'
    },
    {
      username: 'admin',
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@aplos_logix.com',
      password: process.env.DEFAULT_ADMIN_PASS || 'Admin123!',
      status: 'active'
    },
    {
      username: 'manager',
      email: process.env.DEFAULT_MANAGER_EMAIL || 'manager@aplos_logix.com',
      password: process.env.DEFAULT_MANAGER_PASS || 'Manager123!',
      status: 'active'
    },
    {
      username: 'user',
      email: process.env.DEFAULT_USER_EMAIL || 'user@aplos_logix.com',
      password: process.env.DEFAULT_USER_PASS || 'User123!',
      status: 'active'
    },
    {
      username: 'testuser',
      email: 'test@aplos_logix.com',
      password: 'Test123!',
      status: 'inactive'
    }
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    await db.executeQuery(
      'INSERT INTO users (username, email, password_hash, status) VALUES (?, ?, ?, ?)',
      [user.username, user.email, hashedPassword, user.status]
    );
  }

  console.log(`✅ Created ${users.length} default users`);
}

async function assignRolesToPages() {
  // Get role and page IDs
  const roles = await db.executeQuery('SELECT id, name FROM roles');
  const pages = await db.executeQuery('SELECT id, name FROM pages');

  const roleMap = {};
  const pageMap = {};
  
  roles.forEach(role => roleMap[role.name] = role.id);
  pages.forEach(page => pageMap[page.name] = page.id);

  // Define role-page assignments
  const assignments = [
    // Super Admin - Access to everything
    { role: 'super_admin', pages: Object.keys(pageMap) },
    
    // Admin - Access to most admin functions
    { 
      role: 'admin', 
      pages: [
        'Dashboard', 'Users Management', 'Roles Management', 'Pages Management',
        'Activity Logs', 'Reports', 'Profile', 'Help Center'
      ]
    },
    
    // Manager - Limited admin access
    { 
      role: 'manager', 
      pages: [
        'Dashboard', 'Users Management', 'Reports', 'Profile', 'Help Center'
      ]
    },
    
    // User - Basic access
    { 
      role: 'user', 
      pages: [
        'Profile', 'Help Center', 'Company Website', 'Documentation'
      ]
    }
  ];

  for (const assignment of assignments) {
    const roleId = roleMap[assignment.role];
    for (const pageName of assignment.pages) {
      const pageId = pageMap[pageName];
      if (roleId && pageId) {
        await db.executeQuery(
          'INSERT INTO role_pages (role_id, page_id) VALUES (?, ?)',
          [roleId, pageId]
        );
      }
    }
  }

  console.log('✅ Assigned pages to roles');
}

async function assignRolesToUsers() {
  // Get user and role IDs
  const users = await db.executeQuery('SELECT id, username FROM users');
  const roles = await db.executeQuery('SELECT id, name FROM roles');

  const userMap = {};
  const roleMap = {};
  
  users.forEach(user => userMap[user.username] = user.id);
  roles.forEach(role => roleMap[role.name] = role.id);

  // Define user-role assignments
  const assignments = [
    { username: 'superadmin', roles: ['super_admin'] },
    { username: 'admin', roles: ['admin'] },
    { username: 'manager', roles: ['manager'] },
    { username: 'user', roles: ['user'] },
    { username: 'testuser', roles: ['user'] }
  ];

  for (const assignment of assignments) {
    const userId = userMap[assignment.username];
    for (const roleName of assignment.roles) {
      const roleId = roleMap[roleName];
      if (userId && roleId) {
        await db.executeQuery(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [userId, roleId]
        );
      }
    }
  }

  console.log('✅ Assigned roles to users');
}

async function createSampleActivityLogs() {
  // Get admin user ID
  const adminUser = await db.executeQuery(
    'SELECT id FROM users WHERE username = ? LIMIT 1',
    ['admin']
  );
  
  if (adminUser.length === 0) return;
  
  const adminUserId = adminUser[0].id;

  // Create sample activity logs
  const activities = [
    {
      user_id: adminUserId,
      username: 'admin',
      action: 'login',
      resource: 'system',
      ip_address: '127.0.0.1',
      details: JSON.stringify({ method: 'LOGIN', success: true })
    },
    {
      user_id: adminUserId,
      username: 'admin',
      action: 'create',
      resource: 'user',
      resource_id: 2,
      ip_address: '127.0.0.1',
      details: JSON.stringify({ username: 'manager', email: 'manager@aplos_logix.com' })
    },
    {
      user_id: adminUserId,
      username: 'admin',
      action: 'create',
      resource: 'role',
      resource_id: 1,
      ip_address: '127.0.0.1',
      details: JSON.stringify({ name: 'admin', description: 'Administrator role' })
    },
    {
      user_id: adminUserId,
      username: 'admin',
      action: 'view',
      resource: 'dashboard',
      ip_address: '127.0.0.1',
      details: JSON.stringify({ method: 'GET', path: '/api/stats/dashboard' })
    }
  ];

  for (const activity of activities) {
    await db.executeQuery(
      `INSERT INTO activity_logs (user_id, username, action, resource, resource_id, ip_address, user_agent, details) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activity.user_id,
        activity.username,
        activity.action,
        activity.resource,
        activity.resource_id || null,
        activity.ip_address,
        'Aplos_Logix Seeder/1.0',
        activity.details
      ]
    );
  }

  // Create sample login activities
  await db.executeQuery(
    `INSERT INTO login_activities (user_id, username, ip_address, user_agent, success, login_time) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [adminUserId, 'admin', '127.0.0.1', 'Aplos_Logix Seeder/1.0', true, new Date()]
  );

  console.log('✅ Created sample activity logs');
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n🎉 Database seeding completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Database seeding failed:', error);
      process.exit(1);
    });
}

module.exports = {
  seedDatabase,
  createDefaultRoles,
  createDefaultPages,
  createDefaultUsers,
  assignRolesToPages,
  assignRolesToUsers,
  createSampleActivityLogs
};