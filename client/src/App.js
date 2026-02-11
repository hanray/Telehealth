import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, ListGroup, Badge } from 'react-bootstrap';
import Navigation from './components/Navigation';
import ChatModule from './components/ChatModule';
import MedicalRecordModule from './components/MedicalRecordModule';
import PatientChart from './components/PatientChart';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LabResultModal from './components/LabResultModal';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import NurseDashboard from './components/NurseDashboard';
import PSWDashboard from './components/PSWDashboard';
import TelehealthWorkspace from './components/TelehealthWorkspace';
import TelehealthShell from './components/TelehealthShell';
import TelehealthVisitSummary from './components/TelehealthVisitSummary';
import AdminPortal from './components/AdminPortal';
import PatientAssignmentModule from './components/PatientAssignmentModule';
import PatientsModule from './components/PatientsModule';
import AppointmentModal from './components/AppointmentModal';
import InsuranceModal from './components/InsuranceModal';
import RefillModal from './components/RefillModal';
import ProductPicker, { PRODUCT_CATALOG } from './components/ProductPicker';
import { getClinicData, updateClinicData, getClinicConfig, onClinicConfigChange, ensureSubscriptionFresh, getSubscription, startProTrial, upgradeToProDemo, downgradeToFree, updateSubscription } from './config/dataStore';
import { createAppointment } from './utils/appointmentUtils';
import { canAccess } from './utils/entitlements';
import ProFeatureGateModal from './components/ProFeatureGateModal';
import SubscriptionSettingsModal from './components/SubscriptionSettingsModal';
import SubscriptionOnboarding from './components/SubscriptionOnboarding';

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { code: 'en-CA', label: 'English (Canada)', flag: '🇨🇦' },
  { code: 'en-AU', label: 'English (Australia)', flag: '🇦🇺' },
  { code: 'es-ES', label: 'Spanish (Spain)', flag: '🇪🇸' },
  { code: 'es-MX', label: 'Spanish (Mexico)', flag: '🇲🇽' },
  { code: 'fr-FR', label: 'French (France)', flag: '🇫🇷' },
  { code: 'fr-CA', label: 'French (Canada)', flag: '🇨🇦' },
  { code: 'de-DE', label: 'German', flag: '🇩🇪' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'pt-PT', label: 'Portuguese (Portugal)', flag: '🇵🇹' },
  { code: 'ar-SA', label: 'Arabic', flag: '🇸🇦' },
  { code: 'zh-CN', label: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'zh-TW', label: 'Chinese (Traditional)', flag: '🇹🇼' },
  { code: 'ja-JP', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', label: 'Korean', flag: '🇰🇷' },
  { code: 'hi-IN', label: 'Hindi', flag: '🇮🇳' },
  { code: 'bn-BD', label: 'Bengali', flag: '🇧🇩' },
  { code: 'id-ID', label: 'Indonesian', flag: '🇮🇩' },
  { code: 'vi-VN', label: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th-TH', label: 'Thai', flag: '🇹🇭' },
  { code: 'ru-RU', label: 'Russian', flag: '🇷🇺' },
  { code: 'tr-TR', label: 'Turkish', flag: '🇹🇷' },
  { code: 'it-IT', label: 'Italian', flag: '🇮🇹' },
  { code: 'nl-NL', label: 'Dutch', flag: '🇳🇱' },
  { code: 'sv-SE', label: 'Swedish', flag: '🇸🇪' },
  { code: 'pl-PL', label: 'Polish', flag: '🇵🇱' },
  { code: 'he-IL', label: 'Hebrew', flag: '🇮🇱' },
];

const DEFAULT_LANGUAGE = 'en-US';

const normalizeLanguage = (code) => {
  const match = SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
  if (match) return match.code;
  const short = (code || '').split('-')[0];
  const partial = SUPPORTED_LANGUAGES.find((lang) => lang.code.startsWith(short));
  return partial ? partial.code : DEFAULT_LANGUAGE;
};

// Lightweight, key-based translations for top-level chrome and auth flows.
const TRANSLATIONS = {
  es: {
    'Telehealth Console': 'Consola de Telemedicina',
    'Login': 'Iniciar sesión',
    'Logout': 'Cerrar sesión',
    'Settings': 'Configuración',
    'Create account': 'Crear cuenta',
    'Back to products': 'Volver a productos',
    'Email': 'Correo electrónico',
    'Password': 'Contraseña',
    'Sign in': 'Iniciar sesión',
    'Name (optional)': 'Nombre (opcional)',
    'Role': 'Rol',
    'Custom role': 'Rol personalizado',
    'Country': 'País',
    'Product (optional)': 'Producto (opcional)',
    'Select later': 'Seleccionar después',
    'Need an account? Create one': '¿Necesitas una cuenta? Crea una',
    'Already have an account? Sign in': '¿Ya tienes una cuenta? Inicia sesión',
    'Change workspace': 'Cambiar espacio de trabajo',
    'Quick actions': 'Acciones rápidas',
    'Workspace': 'Espacio de trabajo',
    'Login action': 'Iniciar sesión',
    'Doctors Workspace': 'Área de trabajo del médico',
    'Your patients and schedule': 'Tus pacientes y agenda',
    'Review charts, manage visits, and coordinate care.': 'Revisa historias, gestiona visitas y coordina la atención.',
    "Today's Appointments": 'Citas de hoy',
    'Total Patients': 'Pacientes totales',
    'Pending Labs': 'Laboratorios pendientes',
    'Patients': 'Pacientes',
    'Upcoming Visits': 'Próximas visitas',
    'No upcoming visits.': 'Sin visitas próximas.',
    'Patient Details': 'Detalles del paciente',
    'Patient Information': 'Información del paciente',
    'Lab Results': 'Resultados de laboratorio',
    'Recent Visits': 'Visitas recientes',
    'Write Prescription': 'Emitir receta',
    'Search drug': 'Buscar medicamento',
    'Search drug name, route, or strength': 'Buscar nombre, vía o dosis',
    'Sig / Strength': 'Dosis / Potencia',
    'Route': 'Vía',
    'Frequency': 'Frecuencia',
    'Duration': 'Duración',
    'Start time': 'Hora de inicio',
    'Instructions / Notes': 'Instrucciones / Notas',
    'No matches': 'Sin coincidencias',
    'Send Prescription': 'Enviar receta',
    'Cancel': 'Cancelar',
    'Start Video Call': 'Iniciar videollamada',
    'Close': 'Cerrar',
    'HomeCare Shiftboard': 'Tablero de turno domiciliario',
    'Unit of work: Shift / Route / Home visit tasks': 'Unidad de trabajo: turno, ruta y tareas de visita',
    'Work through tasks, document notes, and escalate to providers.': 'Completa tareas, documenta notas y escala al proveedor.',
    'Shift start / handoff': 'Inicio / entrega de turno',
    'Ended': 'Terminado',
    'Started': 'Iniciado',
    'Not started': 'No iniciado',
    'Mark shift start': 'Marcar inicio de turno',
    'Mark handoff / end': 'Marcar entrega / fin',
    "Route / today's homes": 'Ruta / domicilios de hoy',
    'Complete visit': 'Completar visita',
    'Client not home': 'Paciente no está',
    'Unable to complete': 'No se pudo completar',
    'Outcome recorded': 'Resultado registrado',
    'Scheduled': 'Programado',
    'Select an outcome per visit': 'Selecciona un resultado por visita',
    'Assigned Patients': 'Pacientes asignados',
    'Pending Medications': 'Medicamentos pendientes',
    'Overdue Medications': 'Medicamentos atrasados',
    'Stable Patients': 'Pacientes estables',
    'My Clients': 'Mis pacientes',
    'Address / window': 'Dirección / ventana',
    'Address': 'Dirección',
    'Focus': 'Enfoque',
    'Last Vitals': 'Últimos signos',
    'Vitals': 'Signos vitales',
    'Actions': 'Acciones',
  },
  fr: {
    'Telehealth Console': 'Console de télésanté',
    'Login': 'Connexion',
    'Logout': 'Déconnexion',
    'Settings': 'Paramètres',
    'Create account': 'Créer un compte',
    'Back to products': 'Retour aux produits',
    'Email': 'E-mail',
    'Password': 'Mot de passe',
    'Sign in': 'Se connecter',
    'Name (optional)': 'Nom (optionnel)',
    'Role': 'Rôle',
    'Custom role': 'Rôle personnalisé',
    'Country': 'Pays',
    'Product (optional)': 'Produit (optionnel)',
    'Select later': 'Sélectionner plus tard',
    'Need an account? Create one': 'Besoin d’un compte ? Créez-en un',
    'Already have an account? Sign in': 'Déjà un compte ? Connectez-vous',
    'Change workspace': 'Changer d’espace de travail',
    'Quick actions': 'Actions rapides',
    'Workspace': 'Espace de travail',
    'Login action': 'Connexion',
    'Doctors Workspace': 'Espace médecin',
    'Your patients and schedule': 'Vos patients et votre planning',
    'Review charts, manage visits, and coordinate care.': 'Consultez les dossiers, gérez les visites et coordonnez les soins.',
    "Today's Appointments": "Rendez-vous d'aujourd'hui",
    'Total Patients': 'Patients au total',
    'Pending Labs': 'Analyses en attente',
    'Patients': 'Patients',
    'Upcoming Visits': 'Visites à venir',
    'No upcoming visits.': 'Aucune visite à venir.',
    'Patient Details': 'Détails du patient',
    'Patient Information': 'Informations du patient',
    'Lab Results': 'Résultats de laboratoire',
    'Recent Visits': 'Visites récentes',
    'Write Prescription': 'Rédiger une ordonnance',
    'Search drug': 'Rechercher un médicament',
    'Search drug name, route, or strength': 'Rechercher nom, voie ou dosage',
    'Sig / Strength': 'Posologie / dosage',
    'Route': 'Voie',
    'Frequency': 'Fréquence',
    'Duration': 'Durée',
    'Start time': 'Heure de début',
    'Instructions / Notes': 'Instructions / Notes',
    'No matches': 'Aucune correspondance',
    'Send Prescription': 'Envoyer l’ordonnance',
    'Cancel': 'Annuler',
    'Start Video Call': 'Démarrer un appel vidéo',
    'Close': 'Fermer',
    'HomeCare Shiftboard': 'Tableau de tournée domicile',
    'Unit of work: Shift / Route / Home visit tasks': 'Unité de travail : poste, tournée, visites',
    'Work through tasks, document notes, and escalate to providers.': 'Traitez les tâches, notez et escaladez au médecin.',
    'Shift start / handoff': 'Début / relais de poste',
    'Ended': 'Terminé',
    'Started': 'Commencé',
    'Not started': 'Non démarré',
    'Mark shift start': 'Marquer le début du poste',
    'Mark handoff / end': 'Marquer le relais / fin',
    "Route / today's homes": 'Tournée / domiciles du jour',
    'Complete visit': 'Visite terminée',
    'Client not home': 'Patient absent',
    'Unable to complete': 'Impossible de terminer',
    'Outcome recorded': 'Résultat enregistré',
    'Scheduled': 'Planifié',
    'Select an outcome per visit': 'Sélectionnez un résultat par visite',
    'Assigned Patients': 'Patients assignés',
    'Pending Medications': 'Médicaments en attente',
    'Overdue Medications': 'Médicaments en retard',
    'Stable Patients': 'Patients stables',
    'My Clients': 'Mes patients',
    'Address / window': 'Adresse / créneau',
    'Address': 'Adresse',
    'Focus': 'Objectif',
    'Last Vitals': 'Derniers signes vitaux',
    'Vitals': 'Signes vitaux',
    'Actions': 'Actions',
  },
  pt: {
    'Telehealth Console': 'Console de Telemedicina',
    'Login': 'Entrar',
    'Logout': 'Sair',
    'Settings': 'Configurações',
    'Create account': 'Criar conta',
    'Back to products': 'Voltar aos produtos',
    'Email': 'E-mail',
    'Password': 'Senha',
    'Sign in': 'Entrar',
    'Name (optional)': 'Nome (opcional)',
    'Role': 'Função',
    'Custom role': 'Função personalizada',
    'Country': 'País',
    'Product (optional)': 'Produto (opcional)',
    'Select later': 'Selecionar depois',
    'Need an account? Create one': 'Precisa de uma conta? Crie agora',
    'Already have an account? Sign in': 'Já tem conta? Entre',
    'Change workspace': 'Trocar espaço de trabalho',
    'Quick actions': 'Ações rápidas',
    'Workspace': 'Espaço de trabalho',
    'Login action': 'Entrar',
    'Doctors Workspace': 'Espaço do médico',
    'Your patients and schedule': 'Seus pacientes e agenda',
    'Review charts, manage visits, and coordinate care.': 'Revise prontuários, gerencie visitas e coordene o cuidado.',
    "Today's Appointments": 'Consultas de hoje',
    'Total Patients': 'Pacientes totais',
    'Pending Labs': 'Exames pendentes',
    'Patients': 'Pacientes',
    'Upcoming Visits': 'Próximas visitas',
    'No upcoming visits.': 'Sem visitas agendadas.',
    'Patient Details': 'Detalhes do paciente',
    'Patient Information': 'Informações do paciente',
    'Lab Results': 'Resultados de exames',
    'Recent Visits': 'Visitas recentes',
    'Write Prescription': 'Prescrever',
    'Search drug': 'Buscar medicamento',
    'Search drug name, route, or strength': 'Buscar nome, via ou dosagem',
    'Sig / Strength': 'Posologia / dosagem',
    'Route': 'Via',
    'Frequency': 'Frequência',
    'Duration': 'Duração',
    'Start time': 'Hora de início',
    'Instructions / Notes': 'Instruções / Notas',
    'No matches': 'Nenhum resultado',
    'Send Prescription': 'Enviar prescrição',
    'Cancel': 'Cancelar',
    'Start Video Call': 'Iniciar videochamada',
    'Close': 'Fechar',
    'HomeCare Shiftboard': 'Painel de turno domiciliar',
    'Unit of work: Shift / Route / Home visit tasks': 'Unidade de trabalho: turno, rota e visitas',
    'Work through tasks, document notes, and escalate to providers.': 'Execute tarefas, documente e escale para o médico.',
    'Shift start / handoff': 'Início / entrega de turno',
    'Ended': 'Encerrado',
    'Started': 'Iniciado',
    'Not started': 'Não iniciado',
    'Mark shift start': 'Marcar início do turno',
    'Mark handoff / end': 'Marcar entrega / fim',
    "Route / today's homes": 'Rota / domicílios de hoje',
    'Complete visit': 'Concluir visita',
    'Client not home': 'Paciente ausente',
    'Unable to complete': 'Não foi possível concluir',
    'Outcome recorded': 'Resultado registrado',
    'Scheduled': 'Agendado',
    'Select an outcome per visit': 'Selecione um resultado por visita',
    'Assigned Patients': 'Pacientes atribuídos',
    'Pending Medications': 'Medicamentos pendentes',
    'Overdue Medications': 'Medicamentos atrasados',
    'Stable Patients': 'Pacientes estáveis',
    'My Clients': 'Meus pacientes',
    'Address / window': 'Endereço / horário',
    'Address': 'Endereço',
    'Focus': 'Foco',
    'Last Vitals': 'Últimos sinais',
    'Vitals': 'Sinais vitais',
    'Actions': 'Ações',
  },
  zh: {
    'Telehealth Console': '远程医疗控制台',
    'Login': '登录',
    'Logout': '退出登录',
    'Settings': '设置',
    'Create account': '创建账户',
    'Back to products': '返回产品',
    'Email': '邮箱',
    'Password': '密码',
    'Sign in': '登录',
    'Name (optional)': '姓名（可选）',
    'Role': '角色',
    'Custom role': '自定义角色',
    'Country': '国家',
    'Product (optional)': '产品（可选）',
    'Select later': '稍后选择',
    'Need an account? Create one': '需要账户？立即创建',
    'Already have an account? Sign in': '已有账户？登录',
    'Change workspace': '更换工作区',
    'Quick actions': '快速操作',
    'Workspace': '工作区',
    'Login action': '登录',
    'Doctors Workspace': '医生工作台',
    'Your patients and schedule': '您的患者和日程',
    'Review charts, manage visits, and coordinate care.': '查看病历、管理预约并协调护理。',
    "Today's Appointments": '今日预约',
    'Total Patients': '患者总数',
    'Pending Labs': '待审核化验',
    'Patients': '患者',
    'Upcoming Visits': '即将到访',
    'No upcoming visits.': '暂无即将到访。',
    'Patient Details': '患者详情',
    'Patient Information': '患者信息',
    'Lab Results': '化验结果',
    'Recent Visits': '近期就诊',
    'Write Prescription': '开具处方',
    'Search drug': '搜索药物',
    'Search drug name, route, or strength': '搜索药名、给药途径或剂量',
    'Sig / Strength': '剂量',
    'Route': '途径',
    'Frequency': '频率',
    'Duration': '疗程',
    'Start time': '开始时间',
    'Instructions / Notes': '说明 / 备注',
    'No matches': '无匹配',
    'Send Prescription': '发送处方',
    'Cancel': '取消',
    'Start Video Call': '开始视频通话',
    'Close': '关闭',
    'HomeCare Shiftboard': '居家护理班表',
    'Unit of work: Shift / Route / Home visit tasks': '工作单元：班次 / 路线 / 上门任务',
    'Work through tasks, document notes, and escalate to providers.': '完成任务、记录笔记并升级给医生。',
    'Shift start / handoff': '班次开始 / 交接',
    'Ended': '已结束',
    'Started': '已开始',
    'Not started': '未开始',
    'Mark shift start': '标记开始',
    'Mark handoff / end': '标记交接 / 结束',
    "Route / today's homes": '路线 / 今日上门',
    'Complete visit': '完成访问',
    'Client not home': '患者不在家',
    'Unable to complete': '无法完成',
    'Outcome recorded': '已记录结果',
    'Scheduled': '已安排',
    'Select an outcome per visit': '每次访问选择一个结果',
    'Assigned Patients': '分配患者',
    'Pending Medications': '待给药',
    'Overdue Medications': '逾期药物',
    'Stable Patients': '稳定患者',
    'My Clients': '我的患者',
    'Address / window': '地址 / 时间窗',
    'Address': '地址',
    'Focus': '重点',
    'Last Vitals': '上次生命体征',
    'Vitals': '生命体征',
    'Actions': '操作',
  },
};

const makeTranslator = (language) => {
  const normalized = normalizeLanguage(language);
  const short = (normalized || '').split('-')[0];
  const table = TRANSLATIONS[normalized] || TRANSLATIONS[short] || {};
  return (text) => table[text] || text;
};

const SUPPORTED_COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'AU', label: 'Australia' },
  { code: 'IN', label: 'India' },
  { code: 'SG', label: 'Singapore' },
  { code: 'PH', label: 'Philippines' },
  { code: 'BR', label: 'Brazil' },
  { code: 'MX', label: 'Mexico' },
  { code: 'ZA', label: 'South Africa' },
  { code: 'GH', label: 'Ghana' },
];

const API_BASE =
  process.env.NODE_ENV === 'production'
    ? window.location.origin
    : (process.env.REACT_APP_API_BASE || 'http://localhost:5000');

const DISPLAY_API_BASE =
  process.env.NODE_ENV === 'production'
    ? window.location.origin
    : (process.env.REACT_APP_API_BASE || 'http://localhost:5000');

const api = (path) => `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

const fetchJson = async (path, options = {}) => {
  const res = await fetch(api(path), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
};

const normalizeId = (item) => {
  if (!item) return item;
  const { _id, id, ...rest } = item;
  const normalizedId = (_id && _id.toString ? _id.toString() : _id) || id;
  return { id: normalizedId, ...rest };
};

const normalizeList = (items) => Array.isArray(items) ? items.map(normalizeId) : [];

const PRODUCT_KEYS = PRODUCT_CATALOG.map((p) => p.key);

const LEGACY_PRODUCT_ALIASES = {
  telemedicine: 'telehealth',
};

const normalizeProductKey = (product) => {
  const key = String(product || '').trim().toLowerCase();
  return LEGACY_PRODUCT_ALIASES[key] || key || null;
};

const getInitialProductFromPath = () => {
  if (typeof window === 'undefined') return null;
  const slug = window.location.pathname.replace(/^\/+/, '').split('/')[0];
  const normalized = normalizeProductKey(slug);
  return PRODUCT_KEYS.includes(normalized) ? normalized : null;
};

const getInitialLoginView = () => typeof window !== 'undefined' && window.location.pathname === '/login';
const getInitialSignupView = () => typeof window !== 'undefined' && window.location.pathname === '/signup';

const resolvePortalFromProduct = (product, user) => {
  const normalizedProduct = normalizeProductKey(product);
  const role = String(user?.role || '').trim().toLowerCase();
  const viewMode = String(user?.viewMode || '').trim().toLowerCase();

  if (!normalizedProduct && role) return role;
  if (normalizedProduct === 'admin') return 'admin';
  if (normalizedProduct === 'myhealth') return 'patient';

  if (normalizedProduct === 'telehealth') {
    if (role === 'patient') return 'patient';
    return 'telehealth';
  }

  if (normalizedProduct === 'homecare') {
    if (role === 'patient') return 'patient';
    if (role === 'psw') return 'psw';
    return 'nurse';
  }

  if (role === 'admin' && viewMode) return viewMode;
  return role || null;
};

const decorateUserForView = (rawUser) => {
  if (!rawUser) return rawUser;
  const role = String(rawUser.role || '').trim().toLowerCase();

  if (role === 'admin') {
    const viewMode = String(rawUser.viewMode || '').trim().toLowerCase();
    return { ...rawUser, role, viewMode: viewMode === 'nurse' ? 'nurse' : 'doctor' };
  }

  if (role === 'doctor' || role === 'specialist' || role === 'pharmacist') return { ...rawUser, role, viewMode: 'doctor' };
  if (role === 'nurse' || role === 'psw') return { ...rawUser, role, viewMode: 'nurse' };
  if (role) return { ...rawUser, role };
  return rawUser;
};

const getProductTitle = (product) => PRODUCT_CATALOG.find((p) => p.key === product)?.title || null;

const App = () => {
  const [user, setUser] = useState(null);
  const [activePortal, setActivePortal] = useState(null); // which dashboard to show after login
  const [loadingUser, setLoadingUser] = useState(true);
  const [authError, setAuthError] = useState('');

  const [desiredProduct, setDesiredProduct] = useState(() => {
    const fromPath = getInitialProductFromPath();
    if (fromPath) return fromPath;
    if (typeof window === 'undefined') return null;
    try {
      return normalizeProductKey(localStorage.getItem('desiredProduct'));
    } catch (err) {
      return null;
    }
  });
  const [showLogin, setShowLogin] = useState(() => getInitialLoginView() || getInitialSignupView() || Boolean(getInitialProductFromPath()));
  const [showSignup, setShowSignup] = useState(() => getInitialSignupView());
  const [showPasswordReset, setShowPasswordReset] = useState(() => typeof window !== 'undefined' && window.location.pathname === '/reset-password');
  const [passwordResetSubmitted, setPasswordResetSubmitted] = useState(false);
  const [passwordResetEmail, setPasswordResetEmail] = useState('');
  const [passwordResetSending, setPasswordResetSending] = useState(false);
  const [passwordResetLink, setPasswordResetLink] = useState('');
  const [selectedRole, setSelectedRole] = useState('patient');
  const [customRole, setCustomRole] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    try {
      const stored = localStorage.getItem('language');
      if (stored) return normalizeLanguage(stored);
      return normalizeLanguage(navigator.language || DEFAULT_LANGUAGE);
    } catch (err) {
      return DEFAULT_LANGUAGE;
    }
  });
  const t = useMemo(() => makeTranslator(selectedLanguage), [selectedLanguage]);
  const [signupCountry, setSignupCountry] = useState(() => {
    if (typeof window === 'undefined') return 'US';
    try {
      return localStorage.getItem('signupCountry') || 'US';
    } catch (err) {
      return 'US';
    }
  });

  const [clinicData, setClinicData] = useState(() => getClinicData());
  const [clinicConfig, setClinicConfig] = useState(() => getClinicConfig());
  const [subscription, setSubscription] = useState(() => getSubscription());
  const [prescriptions, setPrescriptions] = useState(() => getClinicData().prescriptions || []);
  const [pharmacies, setPharmacies] = useState(() => getClinicData().pharmacies || []);
  const [notifications, setNotifications] = useState(() => getClinicData().notifications || []);
  const [intakeStatusByPatientId, setIntakeStatusByPatientId] = useState(() => getClinicData().intakeStatusByPatientId || {});
  const [, setTransactions] = useState(() => getClinicData().transactions || []);
  const [, setPlans] = useState(() => getClinicData().plans || []);
  const [, setSubscriptions] = useState(() => getClinicData().subscriptions || []);

  const [showChat, setShowChat] = useState(false);
  const [chatRecipients, setChatRecipients] = useState(null);
  const [recordModal, setRecordModal] = useState(false);
  const [recordPatient, setRecordPatient] = useState(null);
  const [chartModal, setChartModal] = useState(false);
  const [chartPatient, setChartPatient] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [labModal, setLabModal] = useState(null);
  const [showAssignments, setShowAssignments] = useState(false);
  const [showPatients, setShowPatients] = useState(false);
  const [quickActionMessage, setQuickActionMessage] = useState('');
  const [quickActionVariant, setQuickActionVariant] = useState('info');
  const [showSettings, setShowSettings] = useState(false);
  const [showSubscriptionSettings, setShowSubscriptionSettings] = useState(false);
  const [showSubscriptionOnboarding, setShowSubscriptionOnboarding] = useState(false);
  const pendingPostAuthRef = React.useRef(null);
  const [proGate, setProGate] = useState({ show: false, featureKey: null });
  const pendingProActionRef = React.useRef(null);
  const [showApptModal, setShowApptModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [telehealthSummaryPatient, setTelehealthSummaryPatient] = useState(null);
  const [showTelehealthSummary, setShowTelehealthSummary] = useState(false);
  const [activeTelehealthVisit, setActiveTelehealthVisit] = useState(null);
  const [triageQueueOverride, setTriageQueueOverride] = useState(null);
  const [apptModalPrefill, setApptModalPrefill] = useState(null);
  const [chatContext, setChatContext] = useState({ type: null, id: null, threadKey: null });

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingUser(true);
        const sub = ensureSubscriptionFresh();
        setSubscription(sub);
        const data = await fetchJson('/api/auth/me');
        const nextUser = decorateUserForView(data.user);
        setUser(nextUser);
        const targetProduct = normalizeProductKey(desiredProduct) || (nextUser?.role === 'admin' ? 'telehealth' : null);
        if (targetProduct && targetProduct !== desiredProduct) {
          setDesiredProduct(targetProduct);
        }
        const portal = resolvePortalFromProduct(targetProduct, nextUser);
        setActivePortal(portal);
        setShowLogin(false);
        if (portal && targetProduct) {
          window.history.replaceState({}, '', `/${targetProduct}`);
        }
      } catch (err) {
        setUser(null);
        if (getInitialLoginView() || getInitialSignupView() || desiredProduct) {
          setShowLogin(true);
          setShowSignup(getInitialSignupView());
          setShowPasswordReset(typeof window !== 'undefined' && window.location.pathname === '/reset-password');
        }
      } finally {
        setLoadingUser(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return onClinicConfigChange((next) => {
      setClinicConfig(next);
      setSubscription(getSubscription());
    });
  }, []);

  const requireAccess = (featureKey, action) => {
    const fresh = ensureSubscriptionFresh();
    setSubscription(fresh);

    if (canAccess(featureKey, fresh)) {
      action?.();
      return true;
    }

    pendingProActionRef.current = action || null;
    setProGate({ show: true, featureKey });
    return false;
  };

  useEffect(() => {
    if (showSignup && showPasswordReset) {
      setShowPasswordReset(false);
      setPasswordResetSubmitted(false);
      setPasswordResetEmail('');
    }
  }, [showSignup, showPasswordReset]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!desiredProduct) {
      localStorage.removeItem('desiredProduct');
      return;
    }
    localStorage.setItem('desiredProduct', desiredProduct);
  }, [desiredProduct]);

  useEffect(() => {
    setQuickActionMessage('');
  }, [activePortal]);

  useEffect(() => {
    const loadPrescriptions = async () => {
      if (!user) return;
      try {
        const data = await fetchJson('/api/prescriptions');
        if (data?.prescriptions) {
          const normalized = normalizeList(data.prescriptions);
          setPrescriptions(normalized);
          setClinicData((prev) => ({ ...prev, prescriptions: normalized }));
          updateClinicData((prev) => ({ ...prev, prescriptions: normalized }));
        }
      } catch (err) {
        // Fallback to local seed
        const local = getClinicData().prescriptions || [];
        setPrescriptions(local);
        setClinicData((prev) => ({ ...prev, prescriptions: local }));
      }
    };
    loadPrescriptions();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadPharmacies = async () => {
      try {
        const data = await fetchJson('/api/pharmacies');
        const normalized = normalizeList(data?.pharmacies);
        const resolved = (normalized && normalized.length) ? normalized : (getClinicData().pharmacies || []);
        setPharmacies(resolved);
        setClinicData((prev) => ({ ...prev, pharmacies: resolved }));
        updateClinicData((prev) => ({ ...prev, pharmacies: resolved }));
      } catch (err) {
        const local = getClinicData().pharmacies || [];
        setPharmacies(local);
        setClinicData((prev) => ({ ...prev, pharmacies: local }));
      }
    };

    const loadPlans = async () => {
      try {
        const data = await fetchJson('/api/plans');
        const normalized = normalizeList(data?.plans);
        setPlans(normalized);
        setClinicData((prev) => ({ ...prev, plans: normalized }));
        updateClinicData((prev) => ({ ...prev, plans: normalized }));
      } catch (err) {
        const local = getClinicData().plans || [];
        setPlans(local);
        setClinicData((prev) => ({ ...prev, plans: local }));
      }
    };

    const loadSubscriptions = async () => {
      try {
        const data = await fetchJson('/api/subscriptions');
        const normalized = normalizeList(data?.subscriptions);
        setSubscriptions(normalized);
        setClinicData((prev) => ({ ...prev, subscriptions: normalized }));
        updateClinicData((prev) => ({ ...prev, subscriptions: normalized }));
      } catch (err) {
        const local = getClinicData().subscriptions || [];
        setSubscriptions(local);
        setClinicData((prev) => ({ ...prev, subscriptions: local }));
      }
    };

    loadPharmacies();
    loadPlans();
    loadSubscriptions();
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('language', selectedLanguage || 'en');
      localStorage.setItem('signupCountry', signupCountry || 'US');
    } catch (err) {
      // ignore persistence errors
    }
    if (typeof document !== 'undefined') {
      const langCode = selectedLanguage || DEFAULT_LANGUAGE;
      document.documentElement.lang = langCode;
    }
  }, [selectedLanguage, signupCountry]);

  const refreshStore = () => {
    const data = getClinicData();
    setClinicData(data);
    setPharmacies(data.pharmacies || []);
    setPrescriptions(data.prescriptions || []);
    setNotifications(data.notifications || []);
    setIntakeStatusByPatientId(data.intakeStatusByPatientId || {});
    setTriageQueueOverride(Array.isArray(data.cases) ? data.cases : null);
    setTransactions(data.transactions || []);
    setPlans(data.plans || []);
    setSubscriptions(data.subscriptions || []);
    setClinicConfig(getClinicConfig());
  };

  const normalizeRole = (role) => String(role || '').trim().toLowerCase();

  const normalizeCase = (raw, idx = 0) => {
    const allowed = new Set(['new', 'triage', 'assigned', 'in_progress', 'awaiting_provider', 'escalated', 'closed']);
    const caseId = raw?.caseId || raw?.id || `case_${Date.now()}_${idx}`;
    const status = allowed.has(raw?.status) ? raw.status : 'new';
    return {
      ...raw,
      caseId,
      patientId: raw?.patientId || raw?.patient?.id || raw?.patient,
      patientName: raw?.patientName || raw?.patient?.name || raw?.patientLabel,
      createdByUserId: raw?.createdByUserId || 'system',
      assignedProviders: Array.isArray(raw?.assignedProviders) ? raw.assignedProviders : [],
      assignmentRequests: Array.isArray(raw?.assignmentRequests) ? raw.assignmentRequests : [],
      escalations: Array.isArray(raw?.escalations) ? raw.escalations : [],
      status,
    };
  };

  const pushNotifications = (items = []) => {
    if (!items.length) return;
    setNotifications((prev) => {
      const next = [...prev, ...items];
      setClinicData((c) => ({ ...c, notifications: next }));
      updateClinicData((c) => ({ ...c, notifications: next }));
      return next;
    });
  };

  const addPrescription = async ({ patientId, draft }) => {
    if (!patientId || !draft) return;
    const patient = (clinicData.patients || []).find((p) => p.id === patientId);
    const resolvedPharmacyId = draft.pharmacyId || patient?.preferredPharmacyId || pharmacies[0]?.id || 'pharm1';
    const addRxNotifications = (rxId, doctorId, pharmacyId) => {
      const now = new Date().toISOString();
      pushNotifications([
        {
          id: `notif_${Date.now()}_patient`,
          recipientId: patientId,
          type: 'prescription_created',
          contextType: 'prescription',
          contextId: rxId,
          message: 'A new prescription was created for you.',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `notif_${Date.now()}_doctor`,
          recipientId: doctorId,
          type: 'prescription_created',
          contextType: 'prescription',
          contextId: rxId,
          message: 'Prescription sent.',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `notif_${Date.now()}_pharmacy`,
          recipientId: pharmacyId,
          type: 'prescription_created',
          contextType: 'prescription',
          contextId: rxId,
          message: 'New prescription received.',
          createdAt: now,
          updatedAt: now,
        },
      ]);
    };
    const payload = {
      patientId,
      pharmacyId: resolvedPharmacyId,
      rawText: draft.rawText,
      normalized: draft.normalized,
      appointmentId: draft.appointmentId,
      pharmacySnapshot: draft.pharmacyOtherText ? { name: draft.pharmacyOtherText } : undefined,
    };

    const updateRxDeliveryStatus = ({ rxId, deliveryStatus }) => {
      if (!rxId) return;
      const now = new Date().toISOString();
      setPrescriptions((prev) => {
        const next = prev.map((rx) => (
          (rx.id || rx._id) === rxId
            ? { ...rx, deliveryStatus, deliveryUpdatedAt: now, updatedAt: now }
            : rx
        ));
        setClinicData((c) => ({ ...c, prescriptions: next }));
        updateClinicData((c) => ({ ...c, prescriptions: next }));
        return next;
      });

      const doctorId = user?.id || 'doctor';
      pushNotifications([
        {
          id: `notif_${Date.now()}_rx_delivery_${rxId}`,
          recipientId: doctorId,
          type: 'prescription_delivery_update',
          contextType: 'prescription',
          contextId: rxId,
          message: `Prescription ${deliveryStatus}.`,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    };

    const scheduleSimulatedDelivery = (rxId) => {
      if (!rxId) return;
      // UI-only simulation (MVP): delivery always confirms successfully.
      setTimeout(() => {
        updateRxDeliveryStatus({ rxId, deliveryStatus: 'Delivered' });
      }, 1600);
    };

    const fallbackCreate = () => {
      const now = new Date();
      const id = `rx_local_${now.getTime()}`;
      const record = {
        id,
        patientId,
        doctorId: user?.id || 'doctor',
        pharmacyId: payload.pharmacyId,
        pharmacySnapshot: payload.pharmacySnapshot,
        rawText: payload.rawText,
        normalized: payload.normalized,
        status: 'Sent',
        deliveryStatus: 'Sent',
        deliveryUpdatedAt: now.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      setPrescriptions((prev) => {
        const next = [...prev, record];
        setClinicData((c) => ({ ...c, prescriptions: next }));
        updateClinicData((c) => ({ ...c, prescriptions: next }));
        return next;
      });
      addRxNotifications(record.id, record.doctorId, record.pharmacyId);
      scheduleSimulatedDelivery(record.id);
      return { id: record.id, deliveryStatus: record.deliveryStatus };
    };

    try {
      const res = await fetchJson('/api/prescriptions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const created = res?.prescription;
      if (created) {
        const normalizedCreated = normalizeId(created);
        const rxId = normalizedCreated?.id || created.id || created._id;
        setPrescriptions((prev) => {
          const now = new Date().toISOString();
          const next = [
            ...prev,
            {
              ...normalizedCreated,
              deliveryStatus: normalizedCreated.deliveryStatus || 'Sent',
              deliveryUpdatedAt: normalizedCreated.deliveryUpdatedAt || now,
            },
          ];
          setClinicData((c) => ({ ...c, prescriptions: next }));
          updateClinicData((c) => ({ ...c, prescriptions: next }));
          return next;
        });
        addRxNotifications(rxId, created.doctorId || (user?.id || 'doctor'), resolvedPharmacyId);
        scheduleSimulatedDelivery(rxId);
        return { id: rxId, deliveryStatus: 'Sent' };
      }
      return fallbackCreate();
    } catch (err) {
      return fallbackCreate();
    }
  };

  const updateMedStatus = ({ prescriptionId, status }) => {
    if (!prescriptionId) return;
    setPrescriptions((prev) => {
      const next = prev.map((p) => (p.id === prescriptionId ? { ...p, status, updatedAt: new Date().toISOString() } : p));
      setClinicData((c) => ({ ...c, prescriptions: next }));
      updateClinicData((c) => ({ ...c, prescriptions: next }));
      const target = next.find((p) => p.id === prescriptionId);
      if (target) {
        const now = new Date().toISOString();
        pushNotifications([
          {
            id: `notif_${Date.now()}_status`,
            recipientId: target.patientId,
            type: 'prescription_status',
            contextType: 'prescription',
            contextId: target.id,
            message: `Prescription status updated to ${status}.`,
            createdAt: now,
            updatedAt: now,
          },
        ]);
      }
      return next;
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const email = form.get('email');
    const password = form.get('password');
    try {
      setAuthError('');
      setLoadingUser(true);
      const data = await fetchJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const sub = ensureSubscriptionFresh();
      setSubscription(sub);
      const nextUser = decorateUserForView(data.user);
      setUser(nextUser);
      const targetProduct = normalizeProductKey(desiredProduct) || (nextUser?.role === 'admin' ? 'telehealth' : null);
      if (targetProduct && targetProduct !== desiredProduct) {
        setDesiredProduct(targetProduct);
      }
      const portal = resolvePortalFromProduct(targetProduct, nextUser);
      setActivePortal(portal);
      setShowLogin(false);
      setShowSignup(false);
      if (portal && targetProduct) {
        window.history.replaceState({}, '', `/${targetProduct}`);
      } else {
        window.history.replaceState({}, '', '/');
      }
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const name = form.get('name');
    const email = form.get('email');
    const password = form.get('password');
    const role = form.get('role');
    const customRoleValue = (form.get('customRole') || '').toString().trim();
    const country = (form.get('country') || signupCountry || 'US').toString();
    if (role === 'other' && !customRoleValue) {
      setAuthError('Please enter a role name when choosing Other.');
      return;
    }
    const productChoice = normalizeProductKey(form.get('product') || desiredProduct || '');
    try {
      setAuthError('');
      setLoadingUser(true);
      const data = await fetchJson('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          customRole: customRoleValue || null,
          country,
          product: productChoice || null,
        }),
      });
      const sub = ensureSubscriptionFresh();
      setSubscription(sub);
      const nextUser = decorateUserForView(data.user);
      setUser(nextUser);
      const targetProduct = productChoice || normalizeProductKey(desiredProduct) || (nextUser?.role === 'admin' ? 'telehealth' : null);
      if (targetProduct && targetProduct !== desiredProduct) {
        setDesiredProduct(targetProduct);
      }
      const portal = resolvePortalFromProduct(targetProduct, nextUser);
      // New flow: after signup, require a subscription choice (Free vs Pro) before entering the app.
      pendingPostAuthRef.current = { portal, targetProduct };
      setActivePortal(null);
      setShowLogin(false);
      setShowSignup(false);
      setShowSubscriptionOnboarding(true);
      window.history.replaceState({}, '', '/subscribe');
    } catch (err) {
      setAuthError(err.message || 'Signup failed');
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const finalizePostSignup = (nextSubscription) => {
    if (nextSubscription) setSubscription(nextSubscription);
    setShowSubscriptionOnboarding(false);

    const pending = pendingPostAuthRef.current || {};
    pendingPostAuthRef.current = null;
    const portal = pending.portal || null;
    const targetProduct = pending.targetProduct || null;

    if (portal && targetProduct) {
      setActivePortal(portal);
      window.history.replaceState({}, '', `/${targetProduct}`);
      return;
    }

    // If we don't have a destination (unexpected), fall back to normal picker.
    setActivePortal(null);
    window.history.replaceState({}, '', '/');
  };

  const handleLogout = async () => {
    try {
      await fetchJson('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // session might already be gone
    }
    setUser(null);
    setActivePortal(null);
    setShowLogin(false);
    setShowSignup(false);
    setShowPasswordReset(false);
    setPasswordResetSubmitted(false);
    setPasswordResetEmail('');
    setDesiredProduct(null);
    setSelectedRole('patient');
    setCustomRole('');
    setSignupCountry('US');
    setShowSubscriptionSettings(false);
    setProGate({ show: false, featureKey: null });
    window.history.replaceState({}, '', '/');
  };

  const openPasswordReset = () => {
    setShowPasswordReset(true);
    setPasswordResetSubmitted(false);
    setPasswordResetEmail('');
    setShowSignup(false);
    setShowLogin(true);
    setAuthError('');
    window.history.replaceState({}, '', '/reset-password');
  };

  const closePasswordReset = () => {
    setShowPasswordReset(false);
    setPasswordResetSubmitted(false);
    setPasswordResetEmail('');
    setPasswordResetLink('');
    setShowSignup(false);
    setShowLogin(true);
    setAuthError('');
    window.history.replaceState({}, '', '/login');
  };

  const handleProductSelect = (product) => {
    setPasswordResetLink('');
    const normalized = normalizeProductKey(product);
    setDesiredProduct(normalized);
    setActivePortal(null);
    if (!user) {
      setShowLogin(true);
      window.history.replaceState({}, '', '/login');
      return;
    }
    const portal = resolvePortalFromProduct(normalized, user);
    setActivePortal(portal);
    window.history.replaceState({}, '', `/${normalized}`);
  };

  const normalizePatient = (raw) => {
    if (!raw) return raw;
    const profile = raw.medicalRecord?.profile || {};
    const fullName = raw.fullName || profile.fullName || raw.name;
    const email = raw.email || profile.email;
    const phone = raw.phone || profile.phone;
    const address = raw.address || profile.address;
    const dob = raw.dob || profile.dob;
    const sex = raw.sex || profile.sex;
    const bloodType = raw.bloodType || profile.bloodType;
    return {
      ...raw,
      name: fullName || raw.name,
      fullName: fullName || raw.fullName,
      email: email || raw.email,
      phone: phone || raw.phone,
      address: address || raw.address,
      dob: dob || raw.dob,
      sex: sex || raw.sex,
      bloodType: bloodType || raw.bloodType,
    };
  };

  const upsertPatient = (updated) => {
    if (!updated) return;
    const now = Date.now();
    const normalized = normalizePatient({
      ...updated,
      id: updated.id || `patient_${now}`,
    });
    const next = updateClinicData((prev) => {
      const list = Array.isArray(prev.patients) ? prev.patients : [];
      const exists = list.some((p) => p.id === normalized.id);
      const patients = exists
        ? list.map((p) => (p.id === normalized.id ? normalized : p))
        : [normalized, ...list];
      return { ...prev, patients };
    });
    setClinicData(next);
  };

  const isOHIPCovered = (patient) => {
    if (!patient) return false;
    const provider = patient.medicalRecord?.insurance?.provider || '';
    const planType = patient.medicalRecord?.insurance?.planType || '';
    const country = (patient.country || patient.medicalRecord?.profile?.country || '').toUpperCase();
    return provider.toUpperCase().includes('OHIP') || planType.toUpperCase().includes('OHIP') || country === 'CA';
  };

  const handleRefillSubmit = async ({ patientId, prescriptionId, method = 'Card', amount = 0, autoApprove = process.env.NODE_ENV !== 'production' }) => {
    if (!prescriptionId) return null;
    const patient = (clinicData.patients || []).find((p) => p.id === patientId);
    const covered = method === 'OHIP' || isOHIPCovered(patient);
    const base = { prescriptionId, amount, currency: 'CAD', method, demoAutoApprove: autoApprove };

    const fallbackCreate = () => {
      const id = `txn_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const now = new Date().toISOString();
      const record = { id, userId: user?.id, prescriptionId, amount, currency: 'CAD', method, paymentStatus: autoApprove ? 'paid' : 'pending', transactionId: `demo_txn_${Date.now()}`, demoAutoApprove: autoApprove, createdAt: now, updatedAt: now };
      setTransactions((prev) => {
        const next = [...prev, record];
        setClinicData((c) => ({ ...c, transactions: next }));
        updateClinicData((c) => ({ ...c, transactions: next }));
        return next;
      });
      pushNotifications([
        {
          id: `notif_${Date.now()}_txn_local`,
          recipientId: user?.id,
          type: record.paymentStatus === 'paid' ? 'transaction_paid' : 'transaction_created',
          contextType: 'transaction',
          contextId: id,
          message: record.paymentStatus === 'paid' ? 'Payment confirmed.' : 'Payment pending.',
          createdAt: now,
          updatedAt: now,
        },
      ]);
      return record;
    };

    if (covered) {
      const now = new Date().toISOString();
      const record = {
        id: `txn_ohip_${Date.now()}`,
        userId: user?.id,
        prescriptionId,
        amount: 0,
        currency: 'CAD',
        method: 'OHIP',
        paymentStatus: 'paid',
        transactionId: `ohip_${Date.now()}`,
        demoAutoApprove: true,
        createdAt: now,
        updatedAt: now,
      };
      setTransactions((prev) => {
        const next = [...prev, record];
        setClinicData((c) => ({ ...c, transactions: next }));
        updateClinicData((c) => ({ ...c, transactions: next }));
        return next;
      });
      pushNotifications([
        {
          id: `notif_${Date.now()}_ohip`,
          recipientId: user?.id,
          type: 'transaction_paid',
          contextType: 'transaction',
          contextId: record.id,
          message: 'Covered by OHIP. No payment required.',
          createdAt: now,
          updatedAt: now,
        },
      ]);
      return record;
    }

    try {
      const res = await fetchJson('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(base),
      });
      const txn = normalizeId(res?.transaction);
      if (txn) {
        setTransactions((prev) => {
          const next = [...prev, txn];
          setClinicData((c) => ({ ...c, transactions: next }));
          updateClinicData((c) => ({ ...c, transactions: next }));
          return next;
        });
        pushNotifications([
          {
            id: `notif_${Date.now()}_txn`,
            recipientId: user?.id,
            type: txn.paymentStatus === 'paid' ? 'transaction_paid' : 'transaction_created',
            contextType: 'transaction',
            contextId: txn.id,
            message: txn.paymentStatus === 'paid' ? 'Payment confirmed.' : 'Payment pending.',
            createdAt: txn.createdAt || new Date().toISOString(),
            updatedAt: txn.updatedAt || new Date().toISOString(),
          },
        ]);

        if (txn.paymentStatus !== 'paid' && autoApprove) {
          try {
            const confirm = await fetchJson(`/api/transactions/${txn.id}/confirm`, { method: 'POST' });
            const confirmed = normalizeId(confirm?.transaction);
            if (confirmed) {
              setTransactions((prev) => {
                const next = prev.map((t) => (t.id === confirmed.id ? confirmed : t));
                setClinicData((c) => ({ ...c, transactions: next }));
                updateClinicData((c) => ({ ...c, transactions: next }));
                return next;
              });
            }
          } catch (err) {
            // ignore confirm failure in demo
          }
        }
        return txn;
      }
      return fallbackCreate();
    } catch (err) {
      return fallbackCreate();
    }
  };

  const addDemoAppointment = () => {
    const patient = clinicData.patients[0];
    const provider = clinicData.providers[0];
    if (!patient || !provider) return;
    const appt = createAppointment({
      patientId: patient.id,
      patientName: patient.name,
      providerId: provider.id,
      providerName: provider.name,
      dateISO: new Date().toISOString().slice(0, 10),
      time: '14:00',
    });
    const next = updateClinicData((prev) => ({
      ...prev,
      appointments: [...prev.appointments, appt],
    }));
    setClinicData(next);
  };

  const handleUpdatePreferredPharmacy = ({ patientId, preferredPharmacyId, preferredPharmacyOtherText }) => {
    if (!patientId) return;
    const next = updateClinicData((prev) => ({
      ...prev,
      patients: (prev.patients || []).map((p) => (
        p.id === patientId
          ? { ...p, preferredPharmacyId: preferredPharmacyId || '', preferredPharmacyOtherText: preferredPharmacyOtherText || '' }
          : p
      )),
    }));
    setClinicData(next);
  };

  const patientRecord = useMemo(() => {
    if (user?.role === 'patient') {
      return clinicData.patients.find((p) => p.id === user.patientId) || null;
    }
    if (activePortal === 'patient') {
      return clinicData.patients[0] || null;
    }
    return recordPatient;
  }, [user, clinicData.patients, recordPatient, activePortal]);

  const seedCases = useMemo(() => {
    const basePatients = clinicData.patients || [];
    const byName = (name) => basePatients.find((p) => p.name === name) || basePatients[0];
    const p1 = byName('Alex Carter');
    const p2 = byName('Jamie Rivera');
    const now = new Date().toISOString();
    return [
      {
        caseId: `case_${p1?.id || 'p1'}_001`,
        patientId: p1?.id,
        patientName: p1?.name || 'Patient',
        createdByUserId: 'nurse1',
        createdAt: now,
        assignedProviders: [],
        assignmentRequests: [],
        escalations: [],
        status: 'triage',
        title: 'Call back regarding dizziness',
        severity: 'high',
        specialistRequested: false,
      },
      {
        caseId: `case_${p2?.id || 'p2'}_001`,
        patientId: p2?.id,
        patientName: p2?.name || 'Patient',
        createdByUserId: 'nurse1',
        createdAt: now,
        assignedProviders: [],
        assignmentRequests: [],
        escalations: [],
        status: 'triage',
        title: 'Schedule follow-up for labs',
        severity: 'medium',
        specialistRequested: true,
        specialistRole: 'specialist',
      },
    ].map((c, idx) => normalizeCase(c, idx));
  }, [clinicData.patients]);

  useEffect(() => {
    if (!user) return;
    const hasCases = Array.isArray(clinicData.cases) && clinicData.cases.length;
    if (hasCases) {
      if (!triageQueueOverride) setTriageQueueOverride(clinicData.cases.map((c, idx) => normalizeCase(c, idx)));
      return;
    }
    // Initialize cases in local mock DB if missing.
    setClinicData((prev) => {
      const next = { ...prev, cases: seedCases };
      updateClinicData((c) => ({ ...c, cases: seedCases }));
      if (!triageQueueOverride) setTriageQueueOverride(seedCases);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, clinicData.cases, seedCases]);

  const telehealthTriage = useMemo(() => {
    const base = triageQueueOverride || clinicData.cases || seedCases;
    return (Array.isArray(base) ? base : []).map((c, idx) => normalizeCase(c, idx));
  }, [triageQueueOverride, clinicData.cases, seedCases]);

  const pendingLabs = useMemo(() => {
    const statuses = new Set(['requested', 'pending_review', 'in_review']);
    return (clinicData.labs || []).filter((lab) => statuses.has(lab.status));
  }, [clinicData.labs]);

  const patientNotifications = useMemo(() => {
    const id = patientRecord?.id;
    if (!id) return [];
    return (notifications || []).filter((n) => n.recipientId === id);
  }, [notifications, patientRecord]);

  const getTelehealthPatient = () => {
    const source = telehealthTriage[0] || {};
    const patient = clinicData.patients.find((p) => p.id === source.patientId) || clinicData.patients[0] || patientRecord;
    return {
      patientId: source.patientId || patient?.id || 'unknown-patient',
      patientName: source.patientName || patient?.name || 'Patient',
    };
  };

  const updateTriageQueue = (updater) => {
    const base = telehealthTriage;
    const next = updater([...base.map((item, idx) => ({ ...item, _idx: idx }))]).map((i) => {
      const clone = { ...i };
      delete clone._idx;
      return clone;
    });
    setTriageQueueOverride(next);
    setClinicData((c) => ({ ...c, cases: next }));
    updateClinicData((c) => ({ ...c, cases: next }));
  };

  const createCaseForPatient = ({ patientId, createdByUserId }) => {
    const patient = (clinicData.patients || []).find((p) => p.id === patientId);
    if (!patientId || !patient) return null;
    const now = new Date().toISOString();
    const caseId = `case_${patientId}_${Date.now()}`;
    return normalizeCase({
      caseId,
      patientId,
      patientName: patient.name || patient.fullName || patientId,
      createdByUserId: createdByUserId || user?.id || 'system',
      createdAt: now,
      assignedProviders: [],
      assignmentRequests: [],
      escalations: [],
      status: 'new',
      title: 'New encounter',
      severity: 'medium',
      triageStatus: 'open',
      specialistRequested: false,
    });
  };

  const handleStartEncounterForPatient = ({ patientId }) => {
    if (!patientId) return;
    const created = createCaseForPatient({ patientId, createdByUserId: user?.id });
    if (!created?.caseId) return;
    updateTriageQueue((items) => [created, ...items]);
    setActiveTelehealthVisit({ patientId: created.patientId, patientName: created.patientName, startedAt: new Date().toISOString() });
    setQuickActionVariant('success');
    setQuickActionMessage(`Encounter created for ${created.patientName}.`);
  };

  const handleCreateHomecareTask = ({ patientId, title, notes }) => {
    if (!patientId) return;
    const now = new Date().toISOString();
    const record = {
      id: `hct_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      patientId,
      title: String(title || 'Homecare visit').trim(),
      notes: String(notes || '').trim(),
      status: 'open',
      createdByUserId: user?.id || 'system',
      assignedToUserId: user?.role === 'psw'
        ? user?.id
        : (clinicData.providers || []).find((p) => p.role === 'psw')?.id || user?.id,
      assignedToRole: 'psw',
      createdAt: now,
      updatedAt: now,
    };

    const next = updateClinicData((prev) => {
      const list = Array.isArray(prev.homecareTasks) ? prev.homecareTasks : [];
      return { ...prev, homecareTasks: [record, ...list] };
    });
    setClinicData(next);
    setQuickActionVariant('success');
    setQuickActionMessage('Homecare task created.');
  };

  const updateHomecareTask = ({ taskId, updater }) => {
    if (!taskId) return;
    const next = updateClinicData((prev) => {
      const list = Array.isArray(prev.homecareTasks) ? prev.homecareTasks : [];
      const now = new Date().toISOString();
      const updated = list.map((t) => {
        if (t?.id !== taskId) return t;
        const nextTask = typeof updater === 'function' ? updater(t) : { ...t, ...(updater || {}) };
        return { ...nextTask, updatedAt: now };
      });
      return { ...prev, homecareTasks: updated };
    });
    setClinicData(next);
  };

  const handleStartTelehealthVisit = () => {
    const { patientId, patientName } = getTelehealthPatient();
    setActiveTelehealthVisit({ patientId, patientName, startedAt: new Date().toISOString() });
  };

  const handleCloseTelehealthVisit = () => {
    setActiveTelehealthVisit(null);
  };

  const handleAssignProvider = () => {
    const { patientId } = getTelehealthPatient();
    const match = (telehealthTriage || []).find((c) => c.patientId === patientId) || (telehealthTriage || [])[0];
    if (!match?.caseId) return;
    handleRequestProviderAssignment({
      caseId: match.caseId,
      requestedRole: 'doctor',
      requestedProviderId: null,
      priority: 'routine',
      reason: 'Provider assignment requested from workspace quick action.',
    });
  };

  const handleEscalate = () => {
    const { patientId } = getTelehealthPatient();
    const match = (telehealthTriage || []).find((c) => c.patientId === patientId) || (telehealthTriage || [])[0];
    if (!match?.caseId) return;
    handleCreateEscalation({
      caseId: match.caseId,
      toRole: 'doctor',
      toProviderId: null,
      urgency: 'urgent',
      message: 'Escalation raised from workspace quick action.',
    });
  };

  const notifyRoleOrProvider = ({ role, providerId, type, contextId, message }) => {
    const now = new Date().toISOString();
    if (providerId) {
      pushNotifications([
        {
          id: `notif_${Date.now()}_${type}`,
          recipientId: providerId,
          type,
          contextType: 'case',
          contextId,
          message,
          createdAt: now,
          updatedAt: now,
        },
      ]);
      return;
    }

    const normalizedRole = normalizeRole(role);
    const recipients = (clinicData.providers || []).filter((p) => normalizeRole(p.role) === normalizedRole);
    const items = recipients.map((p) => ({
      id: `notif_${Date.now()}_${type}_${p.id}`,
      recipientId: p.id,
      type,
      contextType: 'case',
      contextId,
      message,
      createdAt: now,
      updatedAt: now,
    }));
    pushNotifications(items);
  };

  const handleRequestProviderAssignment = (payload = {}) => {
    const now = new Date().toISOString();
    const caseId = payload.caseId;
    if (!caseId) return;
    const requestedRole = normalizeRole(payload.requestedRole);
    const requestedProviderId = payload.requestedProviderId || null;
    const priority = payload.priority === 'urgent' ? 'urgent' : 'routine';
    const reason = String(payload.reason || '').trim();
    if (!requestedRole) return;
    if (!reason) return;

    const request = {
      id: `ar_${Date.now()}`,
      caseId,
      requestedRole,
      requestedProviderId,
      priority,
      reason,
      status: 'pending',
      createdByUserId: user?.id || 'unknown',
      createdAt: now,
      resolvedAt: null,
      resolvedByUserId: null,
    };

    updateTriageQueue((items) => items.map((c) => {
      const current = normalizeCase(c);
      if (current.caseId !== caseId) return current;
      const assignedForRole = (current.assignedProviders || []).some((ap) => normalizeRole(ap?.role) === requestedRole && ap?.userId);
      const nextStatus = assignedForRole ? current.status : (current.status === 'awaiting_provider' ? current.status : 'awaiting_provider');
      return {
        ...current,
        assignmentRequests: [...(current.assignmentRequests || []), request],
        status: nextStatus,
      };
    }));

    const patientName = (telehealthTriage || []).find((c) => c.caseId === caseId)?.patientName || 'patient';
    notifyRoleOrProvider({
      role: requestedRole,
      providerId: requestedProviderId,
      type: 'assignment_request',
      contextId: caseId,
      message: `New assignment request (${priority}) for ${patientName}.`,
    });
  };

  const handleCancelAssignmentRequest = ({ caseId, requestId }) => {
    if (!caseId || !requestId) return;
    const now = new Date().toISOString();
    updateTriageQueue((items) => items.map((c) => {
      const current = normalizeCase(c);
      if (current.caseId !== caseId) return current;
      const nextRequests = (current.assignmentRequests || []).map((r) => {
        if (r?.id !== requestId) return r;
        if (r?.status !== 'pending') return r;
        if (r?.createdByUserId !== user?.id) return r;
        return { ...r, status: 'canceled', resolvedAt: now, resolvedByUserId: user?.id };
      });
      return { ...current, assignmentRequests: nextRequests };
    }));
  };

  const handleRespondToAssignmentRequest = ({ caseId, requestId, action }) => {
    if (!caseId || !requestId) return;
    const now = new Date().toISOString();
    const isAccept = action === 'accept';
    const isDecline = action === 'decline';
    if (!isAccept && !isDecline) return;

    let requesterId = null;
    let requestedRole = null;
    let patientName = null;

    updateTriageQueue((items) => items.map((c) => {
      const current = normalizeCase(c);
      if (current.caseId !== caseId) return current;

      const req = (current.assignmentRequests || []).find((r) => r?.id === requestId) || null;
      if (!req || req.status !== 'pending') return current;

      requestedRole = normalizeRole(req.requestedRole);
      patientName = current.patientName || 'patient';
      requesterId = req.createdByUserId;

      // eligibility
      const eligible = req.requestedProviderId
        ? req.requestedProviderId === user?.id
        : normalizeRole(user?.role) === requestedRole;
      if (!eligible) return current;

      const nextRequests = (current.assignmentRequests || []).map((r) => {
        if (r?.id !== requestId) return r;
        return {
          ...r,
          status: isAccept ? 'accepted' : 'declined',
          resolvedAt: now,
          resolvedByUserId: user?.id || 'unknown',
        };
      });

      const nextAssignedProviders = isAccept
        ? (() => {
          const role = requestedRole;
          const base = Array.isArray(current.assignedProviders) ? current.assignedProviders : [];
          const filtered = base.filter((ap) => normalizeRole(ap?.role) !== role);
          return [...filtered, { role, userId: user?.id, status: 'assigned' }];
        })()
        : current.assignedProviders;

      const inActiveVisit = activeTelehealthVisit?.patientId && activeTelehealthVisit.patientId === current.patientId;
      const nextStatus = isAccept
        ? (inActiveVisit || current.status === 'in_progress' ? 'in_progress' : 'assigned')
        : current.status;

      return {
        ...current,
        assignmentRequests: nextRequests,
        assignedProviders: nextAssignedProviders,
        status: nextStatus,
      };
    }));

    if (requesterId) {
      pushNotifications([
        {
          id: `notif_${Date.now()}_assignment_response`,
          recipientId: requesterId,
          type: 'assignment_response',
          contextType: 'case',
          contextId: caseId,
          message: `${normalizeRole(user?.role) || 'provider'} ${isAccept ? 'accepted' : 'declined'} assignment request for ${patientName}.`,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    if (requestedRole && patientName) {
      notifyRoleOrProvider({
        role: requestedRole,
        providerId: null,
        type: isAccept ? 'assignment_accepted' : 'assignment_declined',
        contextId: caseId,
        message: `Assignment request ${isAccept ? 'accepted' : 'declined'} for ${patientName}.`,
      });
    }
  };

  const handleCreateEscalation = (payload = {}) => {
    const now = new Date().toISOString();
    const caseId = payload.caseId;
    if (!caseId) return;
    const toRole = normalizeRole(payload.toRole);
    const toProviderId = payload.toProviderId || null;
    const urgency = payload.urgency === 'emergency' ? 'emergency' : 'urgent';
    const message = String(payload.message || '').trim();
    if (!toRole || !message) return;

    const escalation = {
      id: `esc_${Date.now()}`,
      caseId,
      toRole,
      toProviderId,
      urgency,
      message,
      status: 'sent',
      createdByUserId: user?.id || 'unknown',
      createdAt: now,
      acknowledgedAt: null,
      resolvedAt: null,
    };

    updateTriageQueue((items) => items.map((c) => {
      const current = normalizeCase(c);
      if (current.caseId !== caseId) return current;
      return {
        ...current,
        escalations: [...(current.escalations || []), escalation],
        status: 'escalated',
      };
    }));

    const patientName = (telehealthTriage || []).find((c) => c.caseId === caseId)?.patientName || 'patient';
    notifyRoleOrProvider({
      role: toRole,
      providerId: toProviderId,
      type: 'escalation',
      contextId: caseId,
      message: `Escalation (${urgency}) for ${patientName}: ${message.slice(0, 90)}${message.length > 90 ? '…' : ''}`,
    });
  };

  const handleAcknowledgeEscalation = ({ caseId, escalationId }) => {
    if (!caseId || !escalationId) return;
    const now = new Date().toISOString();
    updateTriageQueue((items) => items.map((c) => {
      const current = normalizeCase(c);
      if (current.caseId !== caseId) return current;
      const nextEscalations = (current.escalations || []).map((e) => {
        if (e?.id !== escalationId) return e;
        if (e?.status !== 'sent') return e;
        const eligible = e?.toProviderId
          ? e.toProviderId === user?.id
          : normalizeRole(user?.role) === normalizeRole(e?.toRole);
        if (!eligible) return e;
        return { ...e, status: 'acknowledged', acknowledgedAt: now };
      });
      return { ...current, escalations: nextEscalations };
    }));
  };

  const handleResolveEscalation = ({ caseId, escalationId }) => {
    if (!caseId || !escalationId) return;
    const now = new Date().toISOString();
    updateTriageQueue((items) => items.map((c) => {
      const current = normalizeCase(c);
      if (current.caseId !== caseId) return current;

      let changed = false;
      const nextEscalations = (current.escalations || []).map((e) => {
        if (e?.id !== escalationId) return e;
        if (e?.status === 'resolved') return e;
        const eligible = e?.toProviderId
          ? e.toProviderId === user?.id
          : normalizeRole(user?.role) === normalizeRole(e?.toRole);
        if (!eligible) return e;
        changed = true;
        return { ...e, status: 'resolved', resolvedAt: now };
      });

      if (!changed) return { ...current, escalations: nextEscalations };

      const anyOpen = nextEscalations.some((e) => e?.status !== 'resolved');
      if (anyOpen) return { ...current, escalations: nextEscalations, status: 'escalated' };

      const hasAssignments = Array.isArray(current.assignedProviders) && current.assignedProviders.some((ap) => ap?.userId);
      const inActiveVisit = activeTelehealthVisit?.patientId && activeTelehealthVisit.patientId === current.patientId;
      const nextStatus = hasAssignments ? (inActiveVisit ? 'in_progress' : 'assigned') : 'triage';

      return { ...current, escalations: nextEscalations, status: nextStatus };
    }));
  };

  const handleCreateFollowUp = () => {
    const { patientId, patientName } = getTelehealthPatient();
    setApptModalPrefill({ patientId, patientName, appointmentType: 'Follow-up' });
    setShowApptModal(true);
  };

  const getDefaultAssignee = (role = 'doctor') => {
    const list = clinicData.providers || [];
    return list.find((p) => p.role === role) || list.find((p) => p.role === 'doctor') || list[0] || null;
  };

  const handleOrderLab = (payload = {}) => {
    const fallback = getTelehealthPatient();
    const patientId = payload.patientId || fallback.patientId;
    const patientName = payload.patientName || fallback.patientName;
    const now = new Date().toISOString();

    const assigneeRole = payload.assignedToRole && payload.assignedToRole !== 'unassigned' ? payload.assignedToRole : 'doctor';
    const assignee = payload.assignedToUserId && payload.assignedToUserId !== 'unassigned'
      ? (clinicData.providers || []).find((p) => p.id === payload.assignedToUserId) || getDefaultAssignee(assigneeRole)
      : getDefaultAssignee(assigneeRole);

    const resolvedLabType = payload.labType === 'Other'
      ? (payload.labTypeOther ? `Other: ${payload.labTypeOther}` : 'Other')
      : (payload.labType || 'CBC');

    const newLab = {
      id: `lab_${Date.now()}`,
      patientId,
      patientName,
      requestedByUserId: user?.id || payload.requestedByUserId || 'nurse',
      requestedByRole: 'nurse',
      assignedToUserId: assignee?.id || 'unassigned',
      assignedToRole: assignee?.role || assigneeRole,
      labType: payload.labType || 'CBC',
      priority: payload.priority || 'Routine',
      status: 'requested',
      createdAt: now,
      updatedAt: now,
      notes: payload.notes || '',
      testName: resolvedLabType,
      date: now.slice(0, 10),
      summary: 'Requested',
    };

    setClinicData((prev) => {
      const nextLabs = [...(prev.labs || []), newLab];
      const next = { ...prev, labs: nextLabs };
      updateClinicData((c) => ({ ...c, labs: nextLabs }));
      return next;
    });

    const notifNow = now;
    if (newLab.assignedToUserId && newLab.assignedToUserId !== 'unassigned') {
      pushNotifications([
        {
          id: `notif_${Date.now()}_lab_assignee`,
          recipientId: newLab.assignedToUserId,
          type: 'lab_requested',
          contextType: 'lab',
          contextId: newLab.id,
          message: `New lab requested for ${patientName}.`,
          createdAt: notifNow,
          updatedAt: notifNow,
        },
      ]);
    }

    setLabModal(newLab);
  };

  const handleSendIntake = async (payload = {}) => {
    const fallback = getTelehealthPatient();
    const patientId = payload.patientId || fallback.patientId;
    const patient = (clinicData.patients || []).find((p) => p.id === patientId) || null;
    const patientName = payload.patientName || patient?.name || fallback.patientName;

    const now = new Date().toISOString();
    const body = [
      `INTAKE FORM`,
      `Patient: ${patientName} (${patientId})`,
      ``,
      `Reason for visit: ${payload.reasonForVisit || '—'}`,
      `Symptoms duration: ${payload.symptomsDuration || '—'}`,
      `Allergies: ${payload.allergies || '—'}`,
      `Current meds: ${payload.currentMeds || '—'}`,
      `Photos/files: Reply with details (files not required).`,
    ].join('\n');

    // Try to send via backend; if it fails, we still open chat with the patient/thread.
    try {
      await fetchJson('/api/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: patientId,
          recipientName: patientName,
          recipientRole: 'patient',
          message: body,
          messageType: 'text',
          priority: 'normal',
          contextType: 'intake',
          contextId: patientId,
        }),
      });
    } catch (err) {
      // Silent fallback (no alerts per requirements)
    }

    setIntakeStatusByPatientId((prev) => {
      const next = { ...(prev || {}), [patientId]: 'sent' };
      setClinicData((c) => {
        const merged = { ...c, intakeStatusByPatientId: next };
        updateClinicData((d) => ({ ...d, intakeStatusByPatientId: next }));
        return merged;
      });
      return next;
    });

    pushNotifications([
      {
        id: `notif_${Date.now()}_intake_patient`,
        recipientId: patientId,
        type: 'intake_sent',
        contextType: 'intake',
        contextId: patientId,
        message: `Intake form sent by Nurse for ${patientName}.`,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    setChatRecipients([{ id: patientId, name: patientName, role: 'patient' }]);
    setChatContext({ type: 'intake', id: patientId, threadKey: `intake:${patientId}` });
    setShowChat(true);
  };

  const handleMarkTriageComplete = (payload = {}) => {
    const fallback = getTelehealthPatient();
    const patientId = payload.patientId || fallback.patientId;
    const patientName = payload.patientName || fallback.patientName;
    const now = new Date().toISOString();

    const currentItem = (telehealthTriage || []).find((i) => i.patientId === patientId) || (telehealthTriage || []).find((i) => i.patientName === patientName) || null;
    const wantsSpecialist = Boolean(currentItem?.specialistRequested);
    const role = wantsSpecialist ? (currentItem?.specialistRole || 'specialist') : 'doctor';
    const assignee = getDefaultAssignee(role);

    updateTriageQueue((items) => {
      const next = [...items];
      const idx = next.findIndex((i) => i.patientId === patientId || i.patientName === patientName);
      if (idx === -1) return next;
      const current = next[idx] || {};

      next[idx] = {
        ...current,
        triageStatus: 'complete',
        triageCompletedAt: now,
        completedByUserId: user?.id || 'nurse',
        assignedToRole: role,
        assignedToUserId: assignee?.id || 'unassigned',
        assignedProviders: (() => {
          const baseAssigned = Array.isArray(current.assignedProviders) ? current.assignedProviders : [];
          const filtered = baseAssigned.filter((ap) => normalizeRole(ap?.role) !== role);
          if (!assignee?.id) return filtered;
          return [...filtered, { role, userId: assignee.id, status: 'assigned' }];
        })(),
        status: assignee?.id ? 'assigned' : 'awaiting_provider',
        readyForProvider: true,
      };

      // Keep completed items visible but separate in UI.
      return next;
    });

    if (activeTelehealthVisit?.patientId === patientId) {
      setActiveTelehealthVisit((prev) => prev ? ({ ...prev, status: 'ready_for_provider', updatedAt: now }) : prev);
    }
    pushNotifications([
      {
        id: `notif_${Date.now()}_triage_provider`,
        recipientId: assignee?.id || 'unassigned',
        type: 'triage_complete',
        contextType: 'triage',
        contextId: patientId,
        message: `Triage complete for ${patientName}, ready for ${role} review.`,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `notif_${Date.now()}_triage_patient`,
        recipientId: patientId,
        type: 'triage_complete',
        contextType: 'triage',
        contextId: patientId,
        message: `Triage complete for ${patientName}. Awaiting provider review.`,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  };

  const renderQuickActions = () => {
    const role = activePortal || user?.role;

    if (role === 'doctor') {
      const handleEmergency = () => {
        setQuickActionVariant('success');
        setQuickActionMessage('Emergency consultation started (UI only stub).');
      };

      const handleManagePatients = () => {
        setQuickActionMessage('');
        setShowAssignments(true);
      };

      const handleReviewLabs = () => {
        if (pendingLabs.length) {
          setQuickActionMessage('');
          setLabModal(pendingLabs[0]);
          return;
        }
        setQuickActionVariant('secondary');
        setQuickActionMessage('No pending labs to review.');
      };

      const handleScheduleAppt = () => {
    setQuickActionMessage('');
    setShowApptModal(true);
      };

      const handlePatientMessage = () => {
    setQuickActionMessage('');
    setChatRecipients((clinicData?.patients || []).map((p) => ({ ...p, role: 'patient' })));
    setShowChat(true);
      };

      return (
        <div className="d-grid gap-2">
          <Button variant="primary" onClick={handleEmergency}>Start Emergency Consultation</Button>
          <Button variant="outline-primary" onClick={handleManagePatients}>Manage Patients</Button>
          <Button variant="outline-primary" onClick={handleReviewLabs}>
            Review Pending Labs ({pendingLabs.length})
          </Button>
          <Button variant="outline-secondary" onClick={handleScheduleAppt}>Schedule Appointment</Button>
          <Button variant="light" onClick={handlePatientMessage}>Send Patient Message</Button>
        </div>
      );
    }

    if (role === 'patient') {
      const openChat = () => {
        setQuickActionMessage('');
        setChatRecipients(clinicData.providers);
        setShowChat(true);
      };

      const handleRefill = () => {
        setQuickActionMessage('');
        setRecordPatient(patientRecord);
        setShowRefillModal(true);
      };

      const handleInsurance = () => {
        setRecordPatient(patientRecord);
        setQuickActionVariant('info');
        setQuickActionMessage('');
        setShowInsuranceModal(true);
      };

      return (
        <div className="d-grid gap-2">
          <Button variant="success" onClick={() => { setQuickActionMessage(''); setShowApptModal(true); }}>Book Appointment</Button>
          <Button variant="outline-primary" onClick={openChat}>Message Provider</Button>
          <Button variant="outline-success" onClick={handleRefill}>Request Prescription Refill</Button>
          <Button variant="outline-secondary" onClick={() => { setQuickActionMessage(''); setRecordModal(true); }}>View Medical Records</Button>
          <Button variant="outline-dark" onClick={handleInsurance}>Update Insurance</Button>
        </div>
      );
    }

    return (
      <div className="d-grid gap-2">
        <Button variant="outline-primary" onClick={() => setShowChat(true)}>Open chat</Button>
        <Button variant="outline-secondary" onClick={() => setRecordModal(true)} disabled={!patientRecord}>
          Edit medical record
        </Button>
        <Button variant="outline-success" onClick={addDemoAppointment}>Add demo appointment</Button>
      </div>
    );
  };

  const renderDashboard = () => {
    if (!user) return null;
    const role = activePortal || user.role;
    switch (role) {
      case 'patient':
        return (
          <PatientDashboard
            patient={patientRecord || clinicData.patients[0]}
            appointments={clinicData.appointments}
            labs={clinicData.labs}
            prescriptions={prescriptions}
            pharmacies={pharmacies}
            notifications={notifications}
            currentUser={user}
            onUpdatePreferredPharmacy={handleUpdatePreferredPharmacy}
            onOpenRecords={() => setRecordModal(true)}
            onOpenLab={(lab) => setLabModal(lab)}
            onOpenChat={() => setShowChat(true)}
            t={t}
          />
        );
      case 'doctor':
        return (
          <DoctorDashboard
            patients={clinicData.patients}
            appointments={clinicData.appointments}
            labs={clinicData.labs}
            pharmacies={pharmacies}
            prescriptions={prescriptions}
            cases={telehealthTriage}
            currentUser={user}
            providers={clinicData.providers}
            hideDetailsButton={desiredProduct === 'telemedicine'}
            onOpenChart={(p) => {
              setChartPatient(p);
              setChartModal(true);
            }}
            onOpenRecords={(p) => {
              setRecordPatient(p);
              setRecordModal(true);
            }}
            onOpenAnalytics={() => requireAccess('analytics', () => setShowAnalytics(true))}
            onOpenPatients={() => setShowPatients(true)}
            onAddPrescription={addPrescription}
            drugList={clinicData.drugList || []}
            onRespondToAssignmentRequest={(args) => requireAccess('provider_assignment', () => handleRespondToAssignmentRequest(args))}
            onAcknowledgeEscalation={(args) => requireAccess('escalations', () => handleAcknowledgeEscalation(args))}
            onResolveEscalation={(args) => requireAccess('escalations', () => handleResolveEscalation(args))}
            t={t}
          />
        );
      case 'specialist':
      case 'pharmacist':
        return (
          <DoctorDashboard
            patients={clinicData.patients}
            appointments={clinicData.appointments}
            labs={clinicData.labs}
            pharmacies={pharmacies}
            prescriptions={prescriptions}
            cases={telehealthTriage}
            currentUser={user}
            providers={clinicData.providers}
            hideDetailsButton={true}
            onOpenChart={(p) => {
              setChartPatient(p);
              setChartModal(true);
            }}
            onOpenRecords={(p) => {
              setRecordPatient(p);
              setRecordModal(true);
            }}
            onOpenAnalytics={() => requireAccess('analytics', () => setShowAnalytics(true))}
            onOpenPatients={() => setShowPatients(true)}
            onAddPrescription={addPrescription}
            drugList={clinicData.drugList || []}
            onRespondToAssignmentRequest={(args) => requireAccess('provider_assignment', () => handleRespondToAssignmentRequest(args))}
            onAcknowledgeEscalation={(args) => requireAccess('escalations', () => handleAcknowledgeEscalation(args))}
            onResolveEscalation={(args) => requireAccess('escalations', () => handleResolveEscalation(args))}
            t={t}
          />
        );
      case 'nurse':
        return (
          <NurseDashboard
            patients={clinicData.patients}
            prescriptions={prescriptions}
            onOpenCarePlan={(p) => {
              setTelehealthSummaryPatient(p);
              setShowTelehealthSummary(true);
            }}
            onOpenChat={() => setShowChat(true)}
            onOpenPatients={() => setShowPatients(true)}
            onOpenAssignments={() => setShowAssignments(true)}
            onUpdateMedStatus={({ prescriptionId, status }) => updateMedStatus({ prescriptionId, status })}
            t={t}
          />
        );
      case 'psw':
        return (
          <PSWDashboard
            currentUser={user}
            patients={clinicData.patients}
            homecareTasks={clinicData.homecareTasks || []}
            onOpenPatients={() => setShowPatients(true)}
            onStartTask={({ taskId }) => updateHomecareTask({ taskId, updater: (t) => ({ ...t, status: 'in_progress' }) })}
            onCompleteTask={({ taskId }) => updateHomecareTask({ taskId, updater: (t) => ({ ...t, status: 'completed' }) })}
            t={t}
          />
        );
      case 'telehealth': {
        const doctorView = (
          <DoctorDashboard
            patients={clinicData.patients}
            appointments={clinicData.appointments}
            labs={clinicData.labs}
            pharmacies={pharmacies}
            prescriptions={prescriptions}
            cases={telehealthTriage}
            currentUser={user}
            providers={clinicData.providers}
            hideDetailsButton={false}
            onOpenChart={(p) => {
              setChartPatient(p);
              setChartModal(true);
            }}
            onOpenRecords={(p) => {
              setRecordPatient(p);
              setRecordModal(true);
            }}
            onOpenAnalytics={() => requireAccess('analytics', () => setShowAnalytics(true))}
            onOpenPatients={() => requireAccess('clinic_ops', () => setShowPatients(true))}
            onAddPrescription={addPrescription}
            drugList={clinicData.drugList || []}
            onRespondToAssignmentRequest={(args) => requireAccess('provider_assignment', () => handleRespondToAssignmentRequest(args))}
            onAcknowledgeEscalation={(args) => requireAccess('escalations', () => handleAcknowledgeEscalation(args))}
            onResolveEscalation={(args) => requireAccess('escalations', () => handleResolveEscalation(args))}
            t={t}
          />
        );

        const nurseView = (
          <TelehealthWorkspace
            patients={clinicData.patients}
            appointments={clinicData.appointments}
            labs={clinicData.labs}
            triageQueue={telehealthTriage}
            activeTelehealthVisit={activeTelehealthVisit}
            currentUser={user}
            providers={clinicData.providers}
            notifications={notifications}
            intakeStatusByPatientId={intakeStatusByPatientId}
            onCloseVisit={handleCloseTelehealthVisit}
            onOpenVisitSummary={(p) => {
              setTelehealthSummaryPatient(p);
              setShowTelehealthSummary(true);
            }}
            onOpenLab={(lab) => setLabModal(lab)}
            onOpenChat={() => setShowChat(true)}
            onOpenAssignments={() => setShowAssignments(true)}
            onStartVisit={handleStartTelehealthVisit}
            onAssignProvider={(payload) => requireAccess('provider_assignment', () => handleAssignProvider(payload))}
            onEscalate={() => requireAccess('escalations', () => handleEscalate())}
            onRequestProviderAssignment={(payload) => requireAccess('provider_assignment', () => handleRequestProviderAssignment(payload))}
            onCreateEscalation={(payload) => requireAccess('escalations', () => handleCreateEscalation(payload))}
            onCreateFollowUp={(payload) => requireAccess('follow_ups', () => handleCreateFollowUp(payload))}
            onOrderLab={(payload) => requireAccess('lab_ordering', () => handleOrderLab(payload))}
            onSendIntake={(payload) => requireAccess('intake_sending', () => handleSendIntake(payload))}
            onMarkTriageComplete={(payload) => requireAccess('triage_completion', () => handleMarkTriageComplete(payload))}
            t={t}
          />
        );

        return (
          <TelehealthShell
            currentUser={user}
            doctorView={doctorView}
            nurseView={nurseView}
            t={t}
          />
        );
      }
      case 'admin':
        if (canAccess('admin_config', subscription)) {
          return <AdminPortal t={t} />;
        }
        return (
          <Card className="card-plain">
            <Card.Body>
              <Card.Title>{t('Admin configuration')}</Card.Title>
              <Card.Text className="text-muted">{t('This feature requires a Pro subscription.')}</Card.Text>
              <div className="d-flex gap-2">
                <Button variant="primary" onClick={() => { setProGate({ show: true, featureKey: 'admin_config' }); }}>
                  {t('Unlock Pro features')}
                </Button>
                <Button variant="outline-secondary" onClick={() => setShowSubscriptionSettings(true)}>
                  {t('Subscription Settings')}
                </Button>
              </div>
            </Card.Body>
          </Card>
        );
      default:
        return (
          <Card className="card-plain">
            <Card.Body>
              <Card.Text>Unsupported role: {user.role}</Card.Text>
            </Card.Body>
          </Card>
        );
    }
  };

  const effectiveTelehealthView = (() => {
    if (!user) return null;
    const role = String(user.role || '').trim().toLowerCase();
    if (role === 'admin') return String(user.viewMode || 'doctor').trim().toLowerCase();
    if (role === 'doctor' || role === 'specialist' || role === 'pharmacist') return 'doctor';
    if (role === 'nurse' || role === 'psw') return 'nurse';
    return role || null;
  })();

  const shouldShowWorkspace = Boolean(user && activePortal);
  const shouldShowSubscriptionScreen = Boolean(user && showSubscriptionOnboarding);
  const shouldShowPicker = !shouldShowSubscriptionScreen && ((!user && !showLogin) || (user && !activePortal));
  const shouldShowLoginForm = !shouldShowSubscriptionScreen && !user && (showLogin || !!desiredProduct);

  const shouldUseNurseLayout = activePortal === 'nurse' || (activePortal === 'telehealth' && effectiveTelehealthView === 'nurse');

  return (
    <div className="app-shell">
      <Navigation
        user={user}
        onLogout={handleLogout}
        isAdmin={user?.role === 'admin'}
        onOpenSettings={() => setShowSettings(true)}
        onLogin={() => { setShowSignup(false); setShowLogin(true); window.history.replaceState({}, '', '/login'); }}
        showLoginAction={!user}
        languages={SUPPORTED_LANGUAGES}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        t={t}
      />

      {clinicConfig.banner && (
        <Alert variant="info" className="mb-0 rounded-0 text-center">
          {clinicConfig.banner}
        </Alert>
      )}

      <Container className="py-4">
        {shouldShowSubscriptionScreen && (
          <Row className="justify-content-center">
            <Col xl={8}>
              <SubscriptionOnboarding
                t={t}
                onCancel={() => {
                  // If they cancel here, we just log them out to avoid a half-created flow.
                  handleLogout();
                }}
                onChooseFree={() => {
                  const next = downgradeToFree();
                  finalizePostSignup(next);
                }}
                onStartProCheckout={() => {
                  // no-op hook (kept for future analytics)
                }}
                onConfirmProCheckout={() => {
                  const next = upgradeToProDemo();
                  finalizePostSignup(next);
                }}
              />
            </Col>
          </Row>
        )}

        {shouldShowPicker && (
          <Row className="justify-content-center mb-4">
            <Col xl={10}>
              <ProductPicker
                onSelectProduct={handleProductSelect}
                isAdmin={user?.role === 'admin'}
                selectedProduct={desiredProduct}
              />
            </Col>
          </Row>
        )}

        {shouldShowLoginForm && (
          <Row className="justify-content-center">
            <Col md={5}>
              <Card className="card-plain">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Card.Title className="mb-0">{showSignup ? t('Create account') : t('Login')}</Card.Title>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0"
                      onClick={() => {
                        setDesiredProduct(null);
                        setShowLogin(false);
                        setShowSignup(false);
                        setShowPasswordReset(false);
                        setPasswordResetSubmitted(false);
                        setPasswordResetEmail('');
                        setActivePortal(null);
                        setSelectedRole('patient');
                        setCustomRole('');
                        setSignupCountry('US');
                        window.history.replaceState({}, '', '/');
                      }}
                    >
                      ← {t('Back to products')}
                    </Button>
                  </div>
                  <hr className="mt-0" />
                  {getProductTitle(desiredProduct) && (
                    <Alert variant="light" className="border mb-3">
                      You selected {getProductTitle(desiredProduct)}. Sign in to enter its workspace.
                    </Alert>
                  )}
                  {authError && <Alert variant="danger">{authError}</Alert>}
                  {!showSignup && showPasswordReset && (
                    <>
                      <Alert variant="light" className="border">
                        {t('Enter your email and we will send a sign-in link.')}
                      </Alert>

                      {passwordResetSubmitted ? (
                        <>
                          <Alert variant="success" className="mb-2">
                            {t('If an account exists for that email, you will receive a sign-in link shortly.')}
                          </Alert>
                          {passwordResetLink ? (
                            <Alert variant="info" className="mb-0">
                              <div className="fw-semibold mb-1">Sign-in link</div>
                              <div className="small" style={{ wordBreak: 'break-all' }}>
                                <a href={passwordResetLink}>{passwordResetLink}</a>
                              </div>
                              <div className="mt-2 d-flex gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() => {
                                    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                                      navigator.clipboard.writeText(passwordResetLink).catch(() => {});
                                    }
                                  }}
                                >
                                  Copy link
                                </Button>
                              </div>
                            </Alert>
                          ) : null}
                        </>
                      ) : (
                        <Form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (passwordResetSending) return;

                            const email = String(passwordResetEmail || '').trim();
                            if (!email) return;

                            setPasswordResetSending(true);
                            setPasswordResetLink('');
                            fetchJson('/api/auth/forgot-password', {
                              method: 'POST',
                              body: JSON.stringify({ email }),
                            })
                              .then((data) => {
                                const link = typeof data?.link === 'string' ? data.link : '';
                                if (link) setPasswordResetLink(link);
                              })
                              .catch(() => {})
                              .finally(() => {
                                setPasswordResetSending(false);
                                setPasswordResetSubmitted(true);
                              });
                          }}
                        >
                          <Form.Group className="mb-3">
                            <Form.Label>{t('Email')}</Form.Label>
                            <Form.Control
                              type="email"
                              placeholder="user@example.com"
                              value={passwordResetEmail}
                              onChange={(e) => setPasswordResetEmail(e.target.value)}
                              required
                            />
                          </Form.Group>
                          <div className="d-grid">
                            <Button type="submit" disabled={loadingUser || passwordResetSending}>
                              {passwordResetSending ? t('Sending…') : t('Send sign-in link')}
                            </Button>
                          </div>
                        </Form>
                      )}

                      <div className="mt-3 text-center">
                        <Button variant="link" onClick={closePasswordReset}>
                          {t('Back to sign in')}
                        </Button>
                      </div>
                    </>
                  )}

                  {!showSignup && !showPasswordReset && (
                    <>
                      <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('Email')}</Form.Label>
                          <Form.Control name="email" type="email" placeholder="user@example.com" required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('Password')}</Form.Label>
                          <Form.Control name="password" type="password" placeholder="Password" required />
                        </Form.Group>
                        <div className="d-grid">
                          <Button type="submit" disabled={loadingUser}>{t('Sign in')}</Button>
                        </div>
                      </Form>

                      <div className="mt-2 text-center">
                        <Button variant="link" onClick={openPasswordReset}>
                          {t('Forgot password?')}
                        </Button>
                      </div>
                    </>
                  )}

                  {showSignup && (
                    <Form onSubmit={handleSignup}>
                      <Form.Group className="mb-3">
                        <Form.Label>{t('Name (optional)')}</Form.Label>
                        <Form.Control name="name" type="text" placeholder="Your name" />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>{t('Email')}</Form.Label>
                        <Form.Control name="email" type="email" placeholder="user@example.com" required />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>{t('Password')} (min 6)</Form.Label>
                        <Form.Control name="password" type="password" minLength={6} placeholder="Password" required />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>{t('Role')}</Form.Label>
                        <Form.Select
                          name="role"
                          value={selectedRole}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSelectedRole(value);
                            if (value !== 'other') setCustomRole('');
                          }}
                          required
                        >
                          <option value="patient">Patient</option>
                          <option value="nurse">Nurse</option>
                          <option value="doctor">Doctor</option>
                          <option value="admin">Admin (limited to 3)</option>
                          <option value="other">Other (enter a role)</option>
                        </Form.Select>
                      </Form.Group>
                      {selectedRole === 'other' && (
                        <Form.Group className="mb-3">
                          <Form.Label>{t('Custom role')}</Form.Label>
                          <Form.Control
                            name="customRole"
                            type="text"
                            placeholder="e.g., Care Coordinator"
                            value={customRole}
                            onChange={(e) => setCustomRole(e.target.value)}
                            required
                          />
                        </Form.Group>
                      )}
                      <Form.Group className="mb-3">
                        <Form.Label>{t('Country')}</Form.Label>
                        <Form.Select
                          name="country"
                          value={signupCountry}
                          onChange={(e) => setSignupCountry(e.target.value)}
                          required
                        >
                          {SUPPORTED_COUNTRIES.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>{t('Product (optional)')}</Form.Label>
                        <Form.Select name="product" defaultValue={desiredProduct || ''}>
                          <option value="">{t('Select later')}</option>
                          <option value="telehealth">Telehealth</option>
                          <option value="homecare">HomeCare</option>
                          <option value="admin">Admin</option>
                        </Form.Select>
                      </Form.Group>
                      <div className="d-grid">
                        <Button type="submit" disabled={loadingUser}>{t('Create account')}</Button>
                      </div>
                    </Form>
                  )}

                  <Alert variant="secondary" className="mt-3">
                    Choose a product first to set your destination. Sessions are cookie-based; keep the same origin when testing.
                  </Alert>

                  <div className="mt-3 text-center">
                    {!showSignup && (
                          <Button
                            variant="link"
                            onClick={() => {
                              setShowSignup(true);
                              setShowLogin(true);
                              setSelectedRole('patient');
                              setCustomRole('');
                              setSignupCountry('US');
                              window.history.replaceState({}, '', '/signup');
                            }}
                          >
                          {t('Need an account? Create one')}
                      </Button>
                    )}
                    {showSignup && (
                          <Button
                            variant="link"
                            onClick={() => {
                              setShowSignup(false);
                              setShowLogin(true);
                              setSelectedRole('patient');
                              setCustomRole('');
                              setSignupCountry('US');
                              window.history.replaceState({}, '', '/login');
                            }}
                          >
                          {t('Already have an account? Sign in')}
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {shouldShowWorkspace && (
          <>
            <Row className="mb-3">
              <Col>
                <Card className="card-plain">
                  <Card.Body className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div>
                      <div className="text-uppercase small text-muted fw-semibold">{t('Workspace')}</div>
                      <div className="fw-bold">{getProductTitle(desiredProduct) || t('Workspace')}</div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          setActivePortal(null);
                          setShowLogin(false);
                          window.history.replaceState({}, '', '/');
                        }}
                      >
                        {t('Change workspace')}
                      </Button>
                      {normalizeProductKey(desiredProduct) === 'telehealth' && (
                        <Button
                          variant="outline-dark"
                          size="sm"
                          onClick={() => requireAccess('analytics', () => setShowAnalytics(true))}
                        >
                          {t('Analytics')}
                        </Button>
                      )}
                      {user?.role === 'admin' && normalizeProductKey(desiredProduct) === 'telehealth' && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setUser((prev) => {
                              const nextMode = String(prev?.viewMode || 'doctor').trim().toLowerCase() === 'doctor' ? 'nurse' : 'doctor';
                              return { ...prev, viewMode: nextMode };
                            });
                          }}
                        >
                          {t('Change User View')}
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {shouldUseNurseLayout ? (
              <Row>
                <Col lg={12} className="mb-3">
                  {renderDashboard()}
                </Col>
              </Row>
            ) : (
              <Row>
                <Col lg={8} className="mb-3">
                  {renderDashboard()}
                </Col>
                <Col lg={4}>
                  <Card className="card-plain">
                    <Card.Body>
                      <Card.Title>{t('Quick actions')}</Card.Title>
                      {renderQuickActions()}
                      {quickActionMessage && (
                        <Alert
                          variant={quickActionVariant}
                          className="mt-3 mb-0"
                          dismissible
                          onClose={() => setQuickActionMessage('')}
                        >
                          {quickActionMessage}
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                  {(activePortal === 'patient' || user?.role === 'patient') && (
                    <Card className="card-plain mt-3">
                      <Card.Body>
                        <Card.Title>{t('Notifications')}</Card.Title>
                        <ListGroup variant="flush">
                          {patientNotifications.slice(-5).reverse().map((n) => (
                            <ListGroup.Item key={n.id} className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-semibold">{n.message || n.type}</div>
                                <div className="text-muted" style={{ fontSize: 12 }}>
                                  {n.type}
                                  {n.updatedAt ? ` • ${new Date(n.updatedAt).toLocaleString()}` : ''}
                                </div>
                              </div>
                              <Badge bg={n.read ? 'secondary' : 'primary'} className="text-uppercase">
                                {n.read ? t('Read') : t('New')}
                              </Badge>
                            </ListGroup.Item>
                          ))}
                          {!patientNotifications.length && (
                            <ListGroup.Item className="text-muted">{t('No notifications.')}</ListGroup.Item>
                          )}
                        </ListGroup>
                      </Card.Body>
                    </Card>
                  )}
                </Col>
              </Row>
            )}
          </>
        )}
      </Container>

      {user && (
        <PatientAssignmentModule
          show={showAssignments}
          onHide={() => setShowAssignments(false)}
          currentUser={{ id: user.id, role: user.role, name: user.email || 'User' }}
          onAssignmentUpdate={refreshStore}
          onViewDetails={(p) => {
            setRecordPatient(p);
            setRecordModal(true);
          }}
          onViewRecord={(p) => {
            setRecordPatient(p);
            setRecordModal(true);
          }}
          enableRecordQuickOpen
        />
      )}

      {user && (
        <PatientsModule
          show={showPatients}
          onHide={() => setShowPatients(false)}
          currentUser={user}
          patients={clinicData.patients}
          providers={clinicData.providers}
          homecareTasks={clinicData.homecareTasks || []}
          onSavePatient={(p) => upsertPatient(p)}
          onStartEncounter={(payload) => handleStartEncounterForPatient(payload)}
          onCreateHomecareTask={(payload) => handleCreateHomecareTask(payload)}
          onOpenChart={(p) => {
            setChartPatient(p);
            setChartModal(true);
          }}
          onOpenRecords={(p) => {
            setRecordPatient(p);
            setRecordModal(true);
          }}
          t={t}
        />
      )}

      <ChatModule
        show={showChat}
        onHide={() => { setShowChat(false); setChatRecipients(null); setChatContext({ type: null, id: null, threadKey: null }); }}
        currentUser={user}
        recipients={chatRecipients || clinicData.providers}
        contextType={chatContext.type || undefined}
        contextId={chatContext.id || undefined}
        threadKey={chatContext.threadKey || undefined}
      />

      <AppointmentModal
        show={showApptModal}
        onHide={() => { setShowApptModal(false); setApptModalPrefill(null); }}
        appointmentTypes={clinicConfig.appointmentTypes || []}
        prefill={apptModalPrefill}
        onScheduled={(appt) => {
          if (!appt) return;
          setClinicData((prev) => ({
            ...prev,
            appointments: [...(prev.appointments || []), { ...appt, id: appt.id || appt._id || appt.createdAt }],
          }));
        }}
      />

      <MedicalRecordModule
        show={recordModal}
        onHide={() => setRecordModal(false)}
        patients={(activePortal || user?.role) === 'patient'
          ? [patientRecord].filter(Boolean)
          : (recordPatient ? [recordPatient] : clinicData.patients)}
        initialPatientId={(recordPatient || patientRecord)?.id || null}
        onUpdatePatient={upsertPatient}
        readOnly={(activePortal || user?.role) === 'patient'}
        pharmacies={pharmacies}
        t={t}
      />

      <PatientChart
        show={chartModal}
        onHide={() => setChartModal(false)}
        patient={chartPatient || null}
        onUpdatePatient={upsertPatient}
        onOpenRecords={(p) => {
          setRecordPatient(p);
          setRecordModal(true);
        }}
        t={t}
      />

      <AnalyticsDashboard
        show={showAnalytics}
        onHide={() => setShowAnalytics(false)}
        appointments={clinicData.appointments}
        labs={clinicData.labs}
        t={t}
      />

      <InsuranceModal
        show={showInsuranceModal}
        onHide={() => setShowInsuranceModal(false)}
        patient={recordPatient || patientRecord}
        readOnly={false}
        onSave={(patientId, insurance) => {
          const patient = (clinicData.patients || []).find((p) => p.id === patientId);
          if (!patient) return;
          const updated = {
            ...patient,
            medicalRecord: {
              ...patient.medicalRecord,
              insurance,
            },
          };
          upsertPatient(updated);
          setShowInsuranceModal(false);
          setQuickActionVariant('success');
          setQuickActionMessage('Insurance updated and saved to medical record.');
        }}
      />

      <RefillModal
        show={showRefillModal}
        onHide={() => setShowRefillModal(false)}
        medications={(recordPatient || patientRecord)?.medicalRecord?.medications || []}
        prescriptions={prescriptions.filter((p) => p.patientId === (recordPatient || patientRecord)?.id)}
        patientId={(recordPatient || patientRecord)?.id}
        patient={(recordPatient || patientRecord) || null}
        currentUser={user}
        enableOHIP={user?.role === 'admin'}
        t={t}
        onSubmit={async (payload) => {
          const med = payload?.medication || payload;
          const txn = await handleRefillSubmit({ patientId: payload?.patientId, prescriptionId: payload?.prescriptionId, method: payload?.payment?.method || 'Card', amount: payload?.payment?.amount || 0, autoApprove: true });
          setReceiptData({
            medication: med,
            payment: txn ? { method: txn.method || payload?.payment?.method || 'Card', amount: txn.amount ?? payload?.payment?.amount ?? 0, status: txn.paymentStatus || 'approved', transactionId: txn.transactionId || txn.id } : payload?.payment,
            createdAt: new Date().toISOString(),
          });
          setShowRefillModal(false);
          setShowReceipt(true);
          setQuickActionVariant('success');
          setQuickActionMessage(`Refill request submitted for ${med?.name || 'prescription'}.`);
        }}
      />

      <Modal show={showReceipt} onHide={() => setShowReceipt(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Refill Receipt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-grid gap-3">
            <Alert variant="success" className="mb-0">
              Payment approved. Your refill request has been submitted.
            </Alert>
            <div className="p-3 border rounded">
              <div className="fw-semibold mb-2">Receipt</div>
              <div className="mb-1"><strong>Medication:</strong> {receiptData?.medication?.name || '—'}</div>
              <div className="mb-1"><strong>Dosage:</strong> {receiptData?.medication?.sig || '—'}</div>
              <div className="mb-1"><strong>Refills Remaining:</strong> {receiptData?.medication?.refillsRemaining ?? '—'}</div>
              <div className="mb-1"><strong>Prescribed By:</strong> {receiptData?.medication?.prescribedBy || '—'}</div>
              <div className="mb-1"><strong>Date Prescribed:</strong> {receiptData?.medication?.datePrescribed || '—'}</div>
              <div className="mb-1"><strong>Payment Method:</strong> {(receiptData?.payment?.method || 'card').toUpperCase()}</div>
              <div className="mb-1"><strong>Amount:</strong> ${receiptData?.payment?.amount || 15}</div>
              <div className="mb-1"><strong>Status:</strong> {receiptData?.payment?.status || 'approved'}</div>
              <div className="mb-1"><strong>Transaction ID:</strong> {receiptData?.payment?.transactionId || 'demo_txn'}</div>
              <div className="mb-1"><strong>Timestamp:</strong> {receiptData?.createdAt ? new Date(receiptData.createdAt).toLocaleString() : new Date().toLocaleString()}</div>
            </div>
            <Alert variant="light" className="border mb-0">
              For questions or concerns, please contact our support team at (555) 123-0000. This checkout is simulated for demonstration purposes only.
            </Alert>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => window.print()}>Print</Button>
          <Button variant="primary" onClick={() => setShowReceipt(false)}>Return to Dashboard</Button>
        </Modal.Footer>
      </Modal>

      <LabResultModal show={!!labModal} onHide={() => setLabModal(null)} lab={labModal} />

      <TelehealthVisitSummary
        show={showTelehealthSummary}
        onHide={() => setShowTelehealthSummary(false)}
        patient={telehealthSummaryPatient}
        appointments={clinicData.appointments}
        providers={clinicData.providers}
        triageQueue={telehealthTriage}
        currentUser={user}
        onRequestProviderAssignment={(payload) => requireAccess('provider_assignment', () => handleRequestProviderAssignment(payload))}
        onCancelAssignmentRequest={(payload) => requireAccess('provider_assignment', () => handleCancelAssignmentRequest(payload))}
        onCreateEscalation={(payload) => requireAccess('escalations', () => handleCreateEscalation(payload))}
        onAcknowledgeEscalation={(payload) => requireAccess('escalations', () => handleAcknowledgeEscalation(payload))}
        onResolveEscalation={(payload) => requireAccess('escalations', () => handleResolveEscalation(payload))}
      />

      {user?.role === 'admin' && (
        <Modal show={showSettings} onHide={() => setShowSettings(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Admin Tools</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <div className="fw-semibold">API</div>
              <div className="text-muted">{DISPLAY_API_BASE}</div>
            </div>
            <div className="d-grid gap-2">
              <Button variant="outline-primary" onClick={() => { refreshStore(); setShowSettings(false); }}>
                Refresh local data
              </Button>
              <Button variant="outline-secondary" onClick={() => { setShowSubscriptionSettings(true); setShowSettings(false); }}>
                Subscription Settings
              </Button>
              <Button variant="link" className="text-start ps-0" onClick={() => { setActivePortal(null); setShowSettings(false); }}>
                Change portal
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      )}

      <SubscriptionSettingsModal
        show={showSubscriptionSettings}
        onHide={() => setShowSubscriptionSettings(false)}
        subscription={subscription}
        isAdmin={user?.role === 'admin'}
        onUpgradeToPro={() => {
          const next = upgradeToProDemo();
          setSubscription(next);
        }}
        onDowngradeToFree={() => {
          const next = downgradeToFree();
          setSubscription(next);
        }}
        onSetTier={(tier) => {
          const tVal = String(tier || '').trim().toLowerCase() === 'pro' ? 'pro' : 'free';
          updateSubscription({ tier: tVal, status: 'active', startedAt: new Date().toISOString(), trialEndsAt: null, expiresAt: null });
          setSubscription(getSubscription());
        }}
        t={t}
      />

      <ProFeatureGateModal
        show={proGate.show}
        onHide={() => setProGate({ show: false, featureKey: null })}
        subscription={subscription}
        featureKey={proGate.featureKey}
        onStartTrial={() => {
          const next = startProTrial();
          setSubscription(next);
          setProGate({ show: false, featureKey: null });
          const action = pendingProActionRef.current;
          pendingProActionRef.current = null;
          action?.();
        }}
        onUpgrade={() => {
          const next = upgradeToProDemo();
          setSubscription(next);
          setProGate({ show: false, featureKey: null });
          const action = pendingProActionRef.current;
          pendingProActionRef.current = null;
          action?.();
        }}
        t={t}
      />
    </div>
  );
};

export default App;
