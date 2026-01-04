const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

async function ensureStore() {
  try {
    await fsp.access(USERS_FILE, fs.constants.F_OK);
  } catch (err) {
    await fsp.mkdir(path.dirname(USERS_FILE), { recursive: true });
    await fsp.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2), 'utf8');
  }
}

async function readUsers() {
  await ensureStore();
  try {
    const raw = await fsp.readFile(USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw || '{"users": []}');
    return Array.isArray(parsed) ? parsed : Array.isArray(parsed.users) ? parsed.users : [];
  } catch (err) {
    console.error('[userStore] Failed to read users.json', err);
    return [];
  }
}

async function writeUsers(users = []) {
  await ensureStore();
  await fsp.writeFile(USERS_FILE, JSON.stringify({ users }, null, 2), 'utf8');
}

function nextId() {
  return `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

async function findByEmail(email = '') {
  const users = await readUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

async function findById(id) {
  const users = await readUsers();
  return users.find((u) => u.id === id);
}

async function addUser(user) {
  const users = await readUsers();
  users.push(user);
  await writeUsers(users);
  return user;
}

async function updateUser(user) {
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx === -1) {
    users.push(user);
  } else {
    users[idx] = user;
  }
  await writeUsers(users);
  return user;
}

async function allUsers() {
  return readUsers();
}

module.exports = {
  ensureStore,
  readUsers,
  writeUsers,
  findByEmail,
  findById,
  addUser,
  updateUser,
  allUsers,
  nextId,
};
