#!/usr/bin/env node

const bcrypt = require('bcryptjs');

const { readUsers, writeUsers, findByEmail, addUser, updateUser, nextId } = require('../utils/userStore');

const parseArgs = (argv) => {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];
    const isFlag = !next || next.startsWith('--');

    if (isFlag) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
};

const uniqPatientSeedId = (existingUsers) => {
  const used = new Set(
    (existingUsers || [])
      .map((u) => (u && typeof u.patientId === 'string' ? u.patientId.trim() : null))
      .filter(Boolean)
  );

  for (let i = 1; i <= 999; i += 1) {
    const candidate = `patient-seed-${String(i).padStart(3, '0')}`;
    if (!used.has(candidate)) return candidate;
  }

  return `patient-seed-${Date.now()}`;
};

const normalizeRole = (value) => String(value || '').trim().toLowerCase();

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const ROLE_DEFAULTS = {
  patient: { name: 'Demo Patient', product: 'telehealth' },
  doctor: { name: 'Demo Doctor', product: 'telehealth' },
  nurse: { name: 'Demo Nurse', product: 'telehealth' },
  pharmacy: { name: 'Demo Pharmacy', product: 'telehealth' },
  psw: { name: 'Demo PSW', product: 'homecare' },
};

const main = async () => {
  const args = parseArgs(process.argv);

  const prefix = String(args.prefix || 'admin').trim();
  const domain = String(args.domain || 'gmail.com').trim().replace(/^@/, '');
  const separator = typeof args.separator === 'string' ? args.separator : '_';
  const password = String(args.password || 'test1234');
  const force = args.force === true || String(args.force || '').toLowerCase() === 'true';
  const purge = args.purge !== false && String(args.purge || '').toLowerCase() !== 'false';
  const countryCode = String(args.country || 'US').trim().toUpperCase();

  const rolesArg = String(args.roles || 'patient,doctor,nurse,psw,pharmacy');
  const roles = rolesArg
    .split(',')
    .map((r) => normalizeRole(r))
    .filter(Boolean);

  if (!prefix) {
    console.error('Missing required --prefix');
    process.exitCode = 1;
    return;
  }

  if (!domain || !domain.includes('.')) {
    console.error('Invalid --domain (example: example.com)');
    process.exitCode = 1;
    return;
  }

  if (!password || password.length < 6) {
    console.error('Password must be at least 6 characters (use --password)');
    process.exitCode = 1;
    return;
  }

  let existingUsers = await readUsers();

  const targetEmails = new Set(
    roles
      .filter((r) => r && r !== 'admin')
      .flatMap((role) => {
        // Support multiple historical formats so we can clean up older seeds.
        const prefixRoleUnderscore = `${prefix}${separator}${role}@${domain}`;
        const rolePrefixDot = `${role}.${prefix}@${domain}`;
        const prefixRoleDot = `${prefix}.${role}@${domain}`;
        return [
          normalizeEmail(prefixRoleUnderscore),
          normalizeEmail(rolePrefixDot),
          normalizeEmail(prefixRoleDot),
        ];
      })
  );

  if (purge) {
    const before = existingUsers.length;
    existingUsers = existingUsers.filter((u) => {
      const email = normalizeEmail(u?.email);
      const countrySource = String(u?.countryOfOrigin?.countrySource || '').trim().toLowerCase();

      // Purge only obvious dummy users:
      // - any user whose email matches this seed's target email set, OR
      // - any user explicitly marked as countrySource=seed.
      if (targetEmails.has(email)) return false;
      if (countrySource === 'seed') return false;
      return true;
    });

    const removed = before - existingUsers.length;
    if (removed > 0) {
      await writeUsers(existingUsers);
      console.log(`Purged ${removed} previously-seeded user(s).`);
    }
  }

  const patientIdSeed = uniqPatientSeedId(existingUsers);

  const nowIso = new Date().toISOString();
  const summary = [];

  for (const role of roles) {
    if (role === 'admin') continue; // explicitly excluded

    const defaults = ROLE_DEFAULTS[role] || { name: `Demo ${role}`, product: 'telehealth' };
    // Prefix_role format, per request (e.g., admin_doctor@gmail.com).
    const email = `${prefix}${separator}${role}@${domain}`.toLowerCase();

    const existing = await findByEmail(email);
    if (existing && !force) {
      summary.push({ email, role, action: 'skipped (exists)' });
      continue;
    }

    const password_hash = await bcrypt.hash(password, 10);

    const baseUser = {
      id: existing?.id || nextId(),
      email,
      role,
      name: defaults.name,
      product: defaults.product,
      password_hash,
      org_id: existing?.org_id || null,
      patientId: role === 'patient' ? (existing?.patientId || patientIdSeed) : null,
      country: countryCode,
      countryOfOrigin: {
        countryCode,
        countryName: null,
        countryOtherText: null,
        countrySource: 'seed',
        countryUpdatedAt: nowIso,
      },
    };

    if (existing) {
      await updateUser({ ...existing, ...baseUser });
      summary.push({ email, role, action: 'updated' });
    } else {
      await addUser(baseUser);
      summary.push({ email, role, action: 'created' });
    }
  }

  console.log('Seed complete. Credentials:');
  console.log(`  password: ${password}`);
  console.log('Accounts:');
  for (const row of summary) {
    console.log(`  - ${row.email} (${row.role}) -> ${row.action}`);
  }

  console.log('\nTip: pass options via npm as:');
  console.log('  npm run seed:dummy -- --prefix admin --password test1234 --domain gmail.com');
  console.log('  npm run seed:dummy -- --separator _');
  console.log('  npm run seed:dummy -- --purge=false   (to avoid deleting old dummy users)');
};

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exitCode = 1;
});
