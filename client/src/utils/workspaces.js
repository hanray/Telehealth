export const WORKSPACES = ['telehealth', 'homecare', 'myhealth'];

const WORKSPACE_SET = new Set(WORKSPACES);

const WORKSPACE_ALIASES = {
  telemedicine: 'telehealth',
};

const ROLE_ALIASES = {
  caregiver: 'psw',
  specialist: 'doctor',
  pharmacist: 'doctor',
};

const ROLE_DEFAULT_WORKSPACE = {
  patient: 'myhealth',
  psw: 'homecare',
  doctor: 'telehealth',
  nurse: 'telehealth',
};

const normalizeRole = (role) => ROLE_ALIASES[String(role || '').trim().toLowerCase()] || String(role || '').trim().toLowerCase();

export const normalizeWorkspace = (workspace) => {
  const normalized = WORKSPACE_ALIASES[String(workspace || '').trim().toLowerCase()] || String(workspace || '').trim().toLowerCase();
  return WORKSPACE_SET.has(normalized) ? normalized : null;
};

export const getAllowedWorkspacesForUser = (user) => {
  const role = normalizeRole(user?.role);

  if (role === 'admin') {
    const requested = Array.isArray(user?.allowedWorkspaces)
      ? user.allowedWorkspaces
        .map((workspace) => normalizeWorkspace(workspace))
        .filter(Boolean)
      : [];

    const resolved = requested.length ? requested : WORKSPACES;
    return Array.from(new Set(resolved));
  }

  const mapped = ROLE_DEFAULT_WORKSPACE[role] || 'telehealth';
  return [mapped];
};
