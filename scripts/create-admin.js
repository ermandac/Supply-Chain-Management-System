db = db.getSiblingDB('megaion-scms');

db.users.insertOne({
  username: 'admin',
  email: 'admin@megaion.net',
  password: '$2a$10$XFxcZYg0FwQzxK3UQoJQZu3RzB6YVsQ9X3XQ4qY/9QX.4X4ZzqKfm', // hashed password for 'admin123'
  role: 'ADMIN',
  firstName: 'System',
  lastName: 'Administrator',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
