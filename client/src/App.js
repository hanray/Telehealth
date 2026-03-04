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
import { getClinicData, updateClinicData, getClinicConfig, onClinicConfigChange, ensureSubscriptionFresh, getSubscription, setPlanIntent, startTrialForTier, startProTrial, upgradeToProDemo, purchaseTierDemo, downgradeToFree, updateSubscription } from './config/dataStore';
import { createAppointment } from './utils/appointmentUtils';
import { canAccess } from './utils/entitlements';
import ProFeatureGateModal from './components/ProFeatureGateModal';
import SubscriptionSettingsModal from './components/SubscriptionSettingsModal';
import SubscriptionOnboarding from './components/SubscriptionOnboarding';
import PricingPage from './components/PricingPage';
import CheckoutPage from './components/CheckoutPage';
import CountryOfOriginModal from './components/CountryOfOriginModal';
import { getCountryOptions, isOtherCountry, OTHER_COUNTRY_CODE } from './utils/countries';
import { getAllowedWorkspacesForUser, normalizeWorkspace } from './utils/workspaces';
import homecareLogo from './assets/my-homecare-online-logo.svg';

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

const EXTENDED_TRANSLATIONS = {
  de: {
    'Telehealth Console': 'Telemedizin-Konsole',
    'Login': 'Anmelden',
    'Logout': 'Abmelden',
    'Settings': 'Einstellungen',
    'Create account': 'Konto erstellen',
    'Back to products': 'Zurück zu Produkten',
    'Email': 'E-Mail',
    'Password': 'Passwort',
    'Sign in': 'Einloggen',
    'Name (optional)': 'Name (optional)',
    'Role': 'Rolle',
    'Country': 'Land',
    'Need an account? Create one': 'Noch kein Konto? Jetzt erstellen',
    'Already have an account? Sign in': 'Bereits ein Konto? Einloggen',
    'Change workspace': 'Arbeitsbereich wechseln',
    'Workspace': 'Arbeitsbereich',
    'Quick actions': 'Schnellaktionen',
    'Patients': 'Patienten',
    'Assignments': 'Zuweisungen',
    'Analytics': 'Analysen',
    'Pricing': 'Preise',
    'Dashboard': 'Dashboard',
    "Today's Appointments": 'Heutige Termine',
    'Total Patients': 'Gesamtpatienten',
    'Pending Reviews': 'Ausstehende Prüfungen',
    "Today's Actions": 'Heutige Aktionen',
    'Visit Queue': 'Besuchswarteschlange',
    'Appointments': 'Termine',
    'Care Snapshot': 'Pflegeübersicht',
    'Activity': 'Aktivität',
    'Notifications': 'Benachrichtigungen',
    'No upcoming visits.': 'Keine bevorstehenden Besuche.',
    'No appointments.': 'Keine Termine.',
    'No recent activity.': 'Keine aktuelle Aktivität.',
    'No notifications.': 'Keine Benachrichtigungen.',
    'Read': 'Gelesen',
    'New': 'Neu',
    'Close': 'Schließen',
    'Cancel': 'Abbrechen',
  },
  ar: {
    'Telehealth Console': 'لوحة التطبيب عن بُعد',
    'Login': 'تسجيل الدخول',
    'Logout': 'تسجيل الخروج',
    'Settings': 'الإعدادات',
    'Create account': 'إنشاء حساب',
    'Back to products': 'العودة إلى المنتجات',
    'Email': 'البريد الإلكتروني',
    'Password': 'كلمة المرور',
    'Sign in': 'دخول',
    'Name (optional)': 'الاسم (اختياري)',
    'Role': 'الدور',
    'Country': 'الدولة',
    'Need an account? Create one': 'تحتاج حسابًا؟ أنشئ حسابًا',
    'Already have an account? Sign in': 'لديك حساب؟ سجّل الدخول',
    'Change workspace': 'تغيير مساحة العمل',
    'Workspace': 'مساحة العمل',
    'Quick actions': 'إجراءات سريعة',
    'Patients': 'المرضى',
    'Assignments': 'المهام',
    'Analytics': 'التحليلات',
    'Pricing': 'الأسعار',
    'Dashboard': 'لوحة التحكم',
    "Today's Appointments": 'مواعيد اليوم',
    'Total Patients': 'إجمالي المرضى',
    'Pending Reviews': 'مراجعات معلّقة',
    "Today's Actions": 'إجراءات اليوم',
    'Visit Queue': 'قائمة الزيارات',
    'Appointments': 'المواعيد',
    'Care Snapshot': 'ملخص الرعاية',
    'Activity': 'النشاط',
    'Notifications': 'الإشعارات',
    'No upcoming visits.': 'لا توجد زيارات قادمة.',
    'No appointments.': 'لا توجد مواعيد.',
    'No recent activity.': 'لا يوجد نشاط حديث.',
    'No notifications.': 'لا توجد إشعارات.',
    'Read': 'مقروء',
    'New': 'جديد',
    'Close': 'إغلاق',
    'Cancel': 'إلغاء',
  },
  ja: {
    'Telehealth Console': '遠隔医療コンソール',
    'Login': 'ログイン',
    'Logout': 'ログアウト',
    'Settings': '設定',
    'Create account': 'アカウント作成',
    'Back to products': '製品に戻る',
    'Email': 'メール',
    'Password': 'パスワード',
    'Sign in': 'サインイン',
    'Name (optional)': '名前（任意）',
    'Role': '役割',
    'Country': '国',
    'Need an account? Create one': 'アカウントが必要ですか？作成する',
    'Already have an account? Sign in': '既にアカウントをお持ちですか？サインイン',
    'Change workspace': 'ワークスペースを変更',
    'Workspace': 'ワークスペース',
    'Quick actions': 'クイックアクション',
    'Patients': '患者',
    'Assignments': '割り当て',
    'Analytics': '分析',
    'Pricing': '料金',
    'Dashboard': 'ダッシュボード',
    "Today's Appointments": '本日の予約',
    'Total Patients': '患者総数',
    'Pending Reviews': '保留中レビュー',
    "Today's Actions": '本日のアクション',
    'Visit Queue': '診療待ちキュー',
    'Appointments': '予約',
    'Care Snapshot': 'ケア概要',
    'Activity': 'アクティビティ',
    'Notifications': '通知',
    'No upcoming visits.': '今後の来院はありません。',
    'No appointments.': '予約はありません。',
    'No recent activity.': '最近のアクティビティはありません。',
    'No notifications.': '通知はありません。',
    'Read': '既読',
    'New': '新規',
    'Close': '閉じる',
    'Cancel': 'キャンセル',
  },
  ko: {
    'Telehealth Console': '원격의료 콘솔',
    'Login': '로그인',
    'Logout': '로그아웃',
    'Settings': '설정',
    'Create account': '계정 만들기',
    'Back to products': '제품으로 돌아가기',
    'Email': '이메일',
    'Password': '비밀번호',
    'Sign in': '로그인',
    'Name (optional)': '이름(선택)',
    'Role': '역할',
    'Country': '국가',
    'Need an account? Create one': '계정이 필요하신가요? 만들기',
    'Already have an account? Sign in': '이미 계정이 있나요? 로그인',
    'Change workspace': '워크스페이스 변경',
    'Workspace': '워크스페이스',
    'Quick actions': '빠른 작업',
    'Patients': '환자',
    'Assignments': '배정',
    'Analytics': '분석',
    'Pricing': '요금',
    'Dashboard': '대시보드',
    "Today's Appointments": '오늘의 예약',
    'Total Patients': '총 환자 수',
    'Pending Reviews': '검토 대기',
    "Today's Actions": '오늘의 작업',
    'Visit Queue': '진료 대기열',
    'Appointments': '예약',
    'Care Snapshot': '케어 요약',
    'Activity': '활동',
    'Notifications': '알림',
    'No upcoming visits.': '예정된 방문이 없습니다.',
    'No appointments.': '예약이 없습니다.',
    'No recent activity.': '최근 활동이 없습니다.',
    'No notifications.': '알림이 없습니다.',
    'Read': '읽음',
    'New': '새 항목',
    'Close': '닫기',
    'Cancel': '취소',
  },
  hi: {
    'Telehealth Console': 'टेलीहेल्थ कंसोल',
    'Login': 'लॉग इन',
    'Logout': 'लॉग आउट',
    'Settings': 'सेटिंग्स',
    'Create account': 'खाता बनाएं',
    'Back to products': 'प्रोडक्ट्स पर वापस जाएं',
    'Email': 'ईमेल',
    'Password': 'पासवर्ड',
    'Sign in': 'साइन इन',
    'Name (optional)': 'नाम (वैकल्पिक)',
    'Role': 'भूमिका',
    'Country': 'देश',
    'Need an account? Create one': 'खाता चाहिए? नया बनाएं',
    'Already have an account? Sign in': 'पहले से खाता है? साइन इन करें',
    'Change workspace': 'वर्कस्पेस बदलें',
    'Workspace': 'वर्कस्पेस',
    'Quick actions': 'त्वरित कार्य',
    'Patients': 'मरीज',
    'Assignments': 'असाइनमेंट',
    'Analytics': 'एनालिटिक्स',
    'Pricing': 'मूल्य निर्धारण',
    'Dashboard': 'डैशबोर्ड',
    "Today's Appointments": 'आज की अपॉइंटमेंट्स',
    'Total Patients': 'कुल मरीज',
    'Pending Reviews': 'लंबित समीक्षा',
    "Today's Actions": 'आज के कार्य',
    'Visit Queue': 'विजिट कतार',
    'Appointments': 'अपॉइंटमेंट्स',
    'Care Snapshot': 'देखभाल सारांश',
    'Activity': 'गतिविधि',
    'Notifications': 'सूचनाएं',
    'No upcoming visits.': 'कोई आगामी विजिट नहीं।',
    'No appointments.': 'कोई अपॉइंटमेंट नहीं।',
    'No recent activity.': 'हाल की कोई गतिविधि नहीं।',
    'No notifications.': 'कोई सूचना नहीं।',
    'Read': 'पढ़ा गया',
    'New': 'नया',
    'Close': 'बंद करें',
    'Cancel': 'रद्द करें',
  },
  bn: {
    'Telehealth Console': 'টেলিহেলথ কনসোল',
    'Login': 'লগইন',
    'Logout': 'লগআউট',
    'Settings': 'সেটিংস',
    'Create account': 'অ্যাকাউন্ট তৈরি করুন',
    'Back to products': 'পণ্য পাতায় ফিরে যান',
    'Email': 'ইমেইল',
    'Password': 'পাসওয়ার্ড',
    'Sign in': 'সাইন ইন',
    'Name (optional)': 'নাম (ঐচ্ছিক)',
    'Role': 'ভূমিকা',
    'Country': 'দেশ',
    'Need an account? Create one': 'অ্যাকাউন্ট লাগবে? তৈরি করুন',
    'Already have an account? Sign in': 'আগে থেকেই অ্যাকাউন্ট আছে? সাইন ইন করুন',
    'Change workspace': 'ওয়ার্কস্পেস পরিবর্তন করুন',
    'Workspace': 'ওয়ার্কস্পেস',
    'Quick actions': 'দ্রুত কাজ',
    'Patients': 'রোগী',
    'Assignments': 'অ্যাসাইনমেন্ট',
    'Analytics': 'অ্যানালিটিক্স',
    'Pricing': 'মূল্য',
    'Dashboard': 'ড্যাশবোর্ড',
    "Today's Appointments": 'আজকের অ্যাপয়েন্টমেন্ট',
    'Total Patients': 'মোট রোগী',
    'Pending Reviews': 'অপেক্ষমাণ রিভিউ',
    "Today's Actions": 'আজকের কাজ',
    'Visit Queue': 'ভিজিট কিউ',
    'Appointments': 'অ্যাপয়েন্টমেন্ট',
    'Care Snapshot': 'যত্নের সারসংক্ষেপ',
    'Activity': 'কার্যকলাপ',
    'Notifications': 'নোটিফিকেশন',
    'No upcoming visits.': 'কোনো আসন্ন ভিজিট নেই।',
    'No appointments.': 'কোনো অ্যাপয়েন্টমেন্ট নেই।',
    'No recent activity.': 'সাম্প্রতিক কোনো কার্যকলাপ নেই।',
    'No notifications.': 'কোনো নোটিফিকেশন নেই।',
    'Read': 'পড়া',
    'New': 'নতুন',
    'Close': 'বন্ধ',
    'Cancel': 'বাতিল',
  },
  id: {
    'Telehealth Console': 'Konsol Telehealth',
    'Login': 'Masuk',
    'Logout': 'Keluar',
    'Settings': 'Pengaturan',
    'Create account': 'Buat akun',
    'Back to products': 'Kembali ke produk',
    'Email': 'Email',
    'Password': 'Kata sandi',
    'Sign in': 'Masuk',
    'Name (optional)': 'Nama (opsional)',
    'Role': 'Peran',
    'Country': 'Negara',
    'Need an account? Create one': 'Butuh akun? Buat sekarang',
    'Already have an account? Sign in': 'Sudah punya akun? Masuk',
    'Change workspace': 'Ganti workspace',
    'Workspace': 'Workspace',
    'Quick actions': 'Aksi cepat',
    'Patients': 'Pasien',
    'Assignments': 'Penugasan',
    'Analytics': 'Analitik',
    'Pricing': 'Harga',
    'Dashboard': 'Dasbor',
    "Today's Appointments": 'Janji temu hari ini',
    'Total Patients': 'Total pasien',
    'Pending Reviews': 'Tinjauan tertunda',
    "Today's Actions": 'Aksi hari ini',
    'Visit Queue': 'Antrian kunjungan',
    'Appointments': 'Janji temu',
    'Care Snapshot': 'Ringkasan perawatan',
    'Activity': 'Aktivitas',
    'Notifications': 'Notifikasi',
    'No upcoming visits.': 'Tidak ada kunjungan mendatang.',
    'No appointments.': 'Tidak ada janji temu.',
    'No recent activity.': 'Tidak ada aktivitas terbaru.',
    'No notifications.': 'Tidak ada notifikasi.',
    'Read': 'Dibaca',
    'New': 'Baru',
    'Close': 'Tutup',
    'Cancel': 'Batal',
  },
  vi: {
    'Telehealth Console': 'Bảng điều khiển Telehealth',
    'Login': 'Đăng nhập',
    'Logout': 'Đăng xuất',
    'Settings': 'Cài đặt',
    'Create account': 'Tạo tài khoản',
    'Back to products': 'Quay lại sản phẩm',
    'Email': 'Email',
    'Password': 'Mật khẩu',
    'Sign in': 'Đăng nhập',
    'Name (optional)': 'Tên (tùy chọn)',
    'Role': 'Vai trò',
    'Country': 'Quốc gia',
    'Need an account? Create one': 'Cần tài khoản? Tạo ngay',
    'Already have an account? Sign in': 'Đã có tài khoản? Đăng nhập',
    'Change workspace': 'Đổi không gian làm việc',
    'Workspace': 'Không gian làm việc',
    'Quick actions': 'Thao tác nhanh',
    'Patients': 'Bệnh nhân',
    'Assignments': 'Phân công',
    'Analytics': 'Phân tích',
    'Pricing': 'Bảng giá',
    'Dashboard': 'Bảng điều khiển',
    "Today's Appointments": 'Lịch hẹn hôm nay',
    'Total Patients': 'Tổng bệnh nhân',
    'Pending Reviews': 'Đánh giá chờ xử lý',
    "Today's Actions": 'Việc hôm nay',
    'Visit Queue': 'Hàng đợi khám',
    'Appointments': 'Lịch hẹn',
    'Care Snapshot': 'Tổng quan chăm sóc',
    'Activity': 'Hoạt động',
    'Notifications': 'Thông báo',
    'No upcoming visits.': 'Không có lượt khám sắp tới.',
    'No appointments.': 'Không có lịch hẹn.',
    'No recent activity.': 'Không có hoạt động gần đây.',
    'No notifications.': 'Không có thông báo.',
    'Read': 'Đã đọc',
    'New': 'Mới',
    'Close': 'Đóng',
    'Cancel': 'Hủy',
  },
  th: {
    'Telehealth Console': 'คอนโซลเทเลเฮลธ์',
    'Login': 'เข้าสู่ระบบ',
    'Logout': 'ออกจากระบบ',
    'Settings': 'การตั้งค่า',
    'Create account': 'สร้างบัญชี',
    'Back to products': 'กลับไปยังผลิตภัณฑ์',
    'Email': 'อีเมล',
    'Password': 'รหัสผ่าน',
    'Sign in': 'ลงชื่อเข้าใช้',
    'Name (optional)': 'ชื่อ (ไม่บังคับ)',
    'Role': 'บทบาท',
    'Country': 'ประเทศ',
    'Need an account? Create one': 'ต้องการบัญชี? สร้างเลย',
    'Already have an account? Sign in': 'มีบัญชีแล้ว? เข้าสู่ระบบ',
    'Change workspace': 'เปลี่ยนเวิร์กสเปซ',
    'Workspace': 'เวิร์กสเปซ',
    'Quick actions': 'การดำเนินการด่วน',
    'Patients': 'ผู้ป่วย',
    'Assignments': 'งานที่มอบหมาย',
    'Analytics': 'การวิเคราะห์',
    'Pricing': 'ราคา',
    'Dashboard': 'แดชบอร์ด',
    "Today's Appointments": 'นัดหมายวันนี้',
    'Total Patients': 'ผู้ป่วยทั้งหมด',
    'Pending Reviews': 'รอตรวจสอบ',
    "Today's Actions": 'งานวันนี้',
    'Visit Queue': 'คิวเข้าพบ',
    'Appointments': 'นัดหมาย',
    'Care Snapshot': 'สรุปการดูแล',
    'Activity': 'กิจกรรม',
    'Notifications': 'การแจ้งเตือน',
    'No upcoming visits.': 'ไม่มีการเข้าพบที่กำลังจะมาถึง',
    'No appointments.': 'ไม่มีนัดหมาย',
    'No recent activity.': 'ไม่มีกิจกรรมล่าสุด',
    'No notifications.': 'ไม่มีการแจ้งเตือน',
    'Read': 'อ่านแล้ว',
    'New': 'ใหม่',
    'Close': 'ปิด',
    'Cancel': 'ยกเลิก',
  },
  ru: {
    'Telehealth Console': 'Консоль телемедицины',
    'Login': 'Войти',
    'Logout': 'Выйти',
    'Settings': 'Настройки',
    'Create account': 'Создать аккаунт',
    'Back to products': 'Назад к продуктам',
    'Email': 'Эл. почта',
    'Password': 'Пароль',
    'Sign in': 'Войти',
    'Name (optional)': 'Имя (необязательно)',
    'Role': 'Роль',
    'Country': 'Страна',
    'Need an account? Create one': 'Нужен аккаунт? Создайте',
    'Already have an account? Sign in': 'Уже есть аккаунт? Войдите',
    'Change workspace': 'Сменить рабочее пространство',
    'Workspace': 'Рабочее пространство',
    'Quick actions': 'Быстрые действия',
    'Patients': 'Пациенты',
    'Assignments': 'Назначения',
    'Analytics': 'Аналитика',
    'Pricing': 'Тарифы',
    'Dashboard': 'Панель',
    "Today's Appointments": 'Приёмы на сегодня',
    'Total Patients': 'Всего пациентов',
    'Pending Reviews': 'Ожидают проверки',
    "Today's Actions": 'Действия на сегодня',
    'Visit Queue': 'Очередь визитов',
    'Appointments': 'Приёмы',
    'Care Snapshot': 'Сводка ухода',
    'Activity': 'Активность',
    'Notifications': 'Уведомления',
    'No upcoming visits.': 'Нет предстоящих визитов.',
    'No appointments.': 'Нет приёмов.',
    'No recent activity.': 'Нет недавней активности.',
    'No notifications.': 'Нет уведомлений.',
    'Read': 'Прочитано',
    'New': 'Новое',
    'Close': 'Закрыть',
    'Cancel': 'Отмена',
  },
  tr: {
    'Telehealth Console': 'Tele-sağlık Konsolu',
    'Login': 'Giriş yap',
    'Logout': 'Çıkış yap',
    'Settings': 'Ayarlar',
    'Create account': 'Hesap oluştur',
    'Back to products': 'Ürünlere dön',
    'Email': 'E-posta',
    'Password': 'Şifre',
    'Sign in': 'Oturum aç',
    'Name (optional)': 'Ad (isteğe bağlı)',
    'Role': 'Rol',
    'Country': 'Ülke',
    'Need an account? Create one': 'Hesaba mı ihtiyacın var? Oluştur',
    'Already have an account? Sign in': 'Zaten hesabın var mı? Giriş yap',
    'Change workspace': 'Çalışma alanını değiştir',
    'Workspace': 'Çalışma alanı',
    'Quick actions': 'Hızlı işlemler',
    'Patients': 'Hastalar',
    'Assignments': 'Atamalar',
    'Analytics': 'Analitik',
    'Pricing': 'Fiyatlandırma',
    'Dashboard': 'Panel',
    "Today's Appointments": 'Bugünkü randevular',
    'Total Patients': 'Toplam hasta',
    'Pending Reviews': 'Bekleyen incelemeler',
    "Today's Actions": 'Bugünkü işlemler',
    'Visit Queue': 'Ziyaret kuyruğu',
    'Appointments': 'Randevular',
    'Care Snapshot': 'Bakım özeti',
    'Activity': 'Etkinlik',
    'Notifications': 'Bildirimler',
    'No upcoming visits.': 'Yaklaşan ziyaret yok.',
    'No appointments.': 'Randevu yok.',
    'No recent activity.': 'Son etkinlik yok.',
    'No notifications.': 'Bildirim yok.',
    'Read': 'Okundu',
    'New': 'Yeni',
    'Close': 'Kapat',
    'Cancel': 'İptal',
  },
  it: {
    'Telehealth Console': 'Console di Telemedicina',
    'Login': 'Accedi',
    'Logout': 'Esci',
    'Settings': 'Impostazioni',
    'Create account': 'Crea account',
    'Back to products': 'Torna ai prodotti',
    'Email': 'Email',
    'Password': 'Password',
    'Sign in': 'Accedi',
    'Name (optional)': 'Nome (opzionale)',
    'Role': 'Ruolo',
    'Country': 'Paese',
    'Need an account? Create one': 'Hai bisogno di un account? Creane uno',
    'Already have an account? Sign in': 'Hai già un account? Accedi',
    'Change workspace': 'Cambia workspace',
    'Workspace': 'Workspace',
    'Quick actions': 'Azioni rapide',
    'Patients': 'Pazienti',
    'Assignments': 'Assegnazioni',
    'Analytics': 'Analisi',
    'Pricing': 'Prezzi',
    'Dashboard': 'Dashboard',
    "Today's Appointments": 'Appuntamenti di oggi',
    'Total Patients': 'Pazienti totali',
    'Pending Reviews': 'Revisioni in sospeso',
    "Today's Actions": 'Azioni di oggi',
    'Visit Queue': 'Coda visite',
    'Appointments': 'Appuntamenti',
    'Care Snapshot': 'Panoramica assistenza',
    'Activity': 'Attività',
    'Notifications': 'Notifiche',
    'No upcoming visits.': 'Nessuna visita imminente.',
    'No appointments.': 'Nessun appuntamento.',
    'No recent activity.': 'Nessuna attività recente.',
    'No notifications.': 'Nessuna notifica.',
    'Read': 'Letto',
    'New': 'Nuovo',
    'Close': 'Chiudi',
    'Cancel': 'Annulla',
  },
  nl: {
    'Telehealth Console': 'Telehealth-console',
    'Login': 'Inloggen',
    'Logout': 'Uitloggen',
    'Settings': 'Instellingen',
    'Create account': 'Account aanmaken',
    'Back to products': 'Terug naar producten',
    'Email': 'E-mail',
    'Password': 'Wachtwoord',
    'Sign in': 'Aanmelden',
    'Name (optional)': 'Naam (optioneel)',
    'Role': 'Rol',
    'Country': 'Land',
    'Need an account? Create one': 'Account nodig? Maak er één',
    'Already have an account? Sign in': 'Al een account? Meld je aan',
    'Change workspace': 'Werkruimte wijzigen',
    'Workspace': 'Werkruimte',
    'Quick actions': 'Snelle acties',
    'Patients': 'Patiënten',
    'Assignments': 'Toewijzingen',
    'Analytics': 'Analyses',
    'Pricing': 'Prijzen',
    'Dashboard': 'Dashboard',
    "Today's Appointments": 'Afspraken van vandaag',
    'Total Patients': 'Totaal patiënten',
    'Pending Reviews': 'Openstaande beoordelingen',
    "Today's Actions": 'Acties van vandaag',
    'Visit Queue': 'Bezoekwachtrij',
    'Appointments': 'Afspraken',
    'Care Snapshot': 'Zorgoverzicht',
    'Activity': 'Activiteit',
    'Notifications': 'Meldingen',
    'No upcoming visits.': 'Geen aankomende bezoeken.',
    'No appointments.': 'Geen afspraken.',
    'No recent activity.': 'Geen recente activiteit.',
    'No notifications.': 'Geen meldingen.',
    'Read': 'Gelezen',
    'New': 'Nieuw',
    'Close': 'Sluiten',
    'Cancel': 'Annuleren',
  },
  sv: {
    'Telehealth Console': 'Telehälsokonsol',
    'Login': 'Logga in',
    'Logout': 'Logga ut',
    'Settings': 'Inställningar',
    'Create account': 'Skapa konto',
    'Back to products': 'Tillbaka till produkter',
    'Email': 'E-post',
    'Password': 'Lösenord',
    'Sign in': 'Logga in',
    'Name (optional)': 'Namn (valfritt)',
    'Role': 'Roll',
    'Country': 'Land',
    'Need an account? Create one': 'Behöver du ett konto? Skapa ett',
    'Already have an account? Sign in': 'Har du redan ett konto? Logga in',
    'Change workspace': 'Byt arbetsyta',
    'Workspace': 'Arbetsyta',
    'Quick actions': 'Snabbåtgärder',
    'Patients': 'Patienter',
    'Assignments': 'Tilldelningar',
    'Analytics': 'Analys',
    'Pricing': 'Priser',
    'Dashboard': 'Översikt',
    "Today's Appointments": 'Dagens bokningar',
    'Total Patients': 'Totalt antal patienter',
    'Pending Reviews': 'Väntande granskningar',
    "Today's Actions": 'Dagens åtgärder',
    'Visit Queue': 'Besökskö',
    'Appointments': 'Bokningar',
    'Care Snapshot': 'Vårdöversikt',
    'Activity': 'Aktivitet',
    'Notifications': 'Aviseringar',
    'No upcoming visits.': 'Inga kommande besök.',
    'No appointments.': 'Inga bokningar.',
    'No recent activity.': 'Ingen nylig aktivitet.',
    'No notifications.': 'Inga aviseringar.',
    'Read': 'Läst',
    'New': 'Ny',
    'Close': 'Stäng',
    'Cancel': 'Avbryt',
  },
  pl: {
    'Telehealth Console': 'Konsola telemedyczna',
    'Login': 'Zaloguj',
    'Logout': 'Wyloguj',
    'Settings': 'Ustawienia',
    'Create account': 'Utwórz konto',
    'Back to products': 'Wróć do produktów',
    'Email': 'E-mail',
    'Password': 'Hasło',
    'Sign in': 'Zaloguj się',
    'Name (optional)': 'Imię (opcjonalnie)',
    'Role': 'Rola',
    'Country': 'Kraj',
    'Need an account? Create one': 'Potrzebujesz konta? Utwórz je',
    'Already have an account? Sign in': 'Masz już konto? Zaloguj się',
    'Change workspace': 'Zmień obszar roboczy',
    'Workspace': 'Obszar roboczy',
    'Quick actions': 'Szybkie akcje',
    'Patients': 'Pacjenci',
    'Assignments': 'Przydziały',
    'Analytics': 'Analityka',
    'Pricing': 'Cennik',
    'Dashboard': 'Panel',
    "Today's Appointments": 'Dzisiejsze wizyty',
    'Total Patients': 'Łącznie pacjentów',
    'Pending Reviews': 'Oczekujące przeglądy',
    "Today's Actions": 'Dzisiejsze działania',
    'Visit Queue': 'Kolejka wizyt',
    'Appointments': 'Wizyty',
    'Care Snapshot': 'Podsumowanie opieki',
    'Activity': 'Aktywność',
    'Notifications': 'Powiadomienia',
    'No upcoming visits.': 'Brak nadchodzących wizyt.',
    'No appointments.': 'Brak wizyt.',
    'No recent activity.': 'Brak ostatniej aktywności.',
    'No notifications.': 'Brak powiadomień.',
    'Read': 'Przeczytane',
    'New': 'Nowe',
    'Close': 'Zamknij',
    'Cancel': 'Anuluj',
  },
  he: {
    'Telehealth Console': 'קונסולת טלה-רפואה',
    'Login': 'התחברות',
    'Logout': 'התנתקות',
    'Settings': 'הגדרות',
    'Create account': 'יצירת חשבון',
    'Back to products': 'חזרה למוצרים',
    'Email': 'אימייל',
    'Password': 'סיסמה',
    'Sign in': 'כניסה',
    'Name (optional)': 'שם (אופציונלי)',
    'Role': 'תפקיד',
    'Country': 'מדינה',
    'Need an account? Create one': 'צריך חשבון? צור חשבון',
    'Already have an account? Sign in': 'כבר יש לך חשבון? התחבר',
    'Change workspace': 'שנה סביבת עבודה',
    'Workspace': 'סביבת עבודה',
    'Quick actions': 'פעולות מהירות',
    'Patients': 'מטופלים',
    'Assignments': 'הקצאות',
    'Analytics': 'אנליטיקה',
    'Pricing': 'תמחור',
    'Dashboard': 'לוח מחוונים',
    "Today's Appointments": 'התורים של היום',
    'Total Patients': 'סה״כ מטופלים',
    'Pending Reviews': 'סקירות ממתינות',
    "Today's Actions": 'משימות היום',
    'Visit Queue': 'תור ביקורים',
    'Appointments': 'תורים',
    'Care Snapshot': 'תמונת מצב טיפולית',
    'Activity': 'פעילות',
    'Notifications': 'התראות',
    'No upcoming visits.': 'אין ביקורים קרובים.',
    'No appointments.': 'אין תורים.',
    'No recent activity.': 'אין פעילות אחרונה.',
    'No notifications.': 'אין התראות.',
    'Read': 'נקרא',
    'New': 'חדש',
    'Close': 'סגור',
    'Cancel': 'ביטול',
  },
};

Object.assign(TRANSLATIONS, EXTENDED_TRANSLATIONS);

const EXTENDED_TRANSLATIONS_EXTRA = {
  de: {
    'Patient list': 'Patientenliste',
    'Search patients': 'Patienten suchen',
    'No patients found.': 'Keine Patienten gefunden.',
    'Selected': 'Ausgewählt',
    'Edit': 'Bearbeiten',
    'Open Records': 'Akte öffnen',
    'Time Range': 'Zeitraum',
    'Last 7 days': 'Letzte 7 Tage',
    'Last 30 days': 'Letzte 30 Tage',
    'Last 90 days': 'Letzte 90 Tage',
    'Active Encounters': 'Aktive Fälle',
    'Waiting Patients': 'Wartende Patienten',
    'Labs Pending': 'Ausstehende Labore',
    'Avg Response Time': 'Ø Antwortzeit',
    'Volume Over Time': 'Volumen im Zeitverlauf',
    'Visit Types': 'Besuchstypen',
  },
  ar: {
    'Patient list': 'قائمة المرضى',
    'Search patients': 'بحث المرضى',
    'No patients found.': 'لم يتم العثور على مرضى.',
    'Selected': 'المحدد',
    'Edit': 'تعديل',
    'Open Records': 'فتح السجلات',
    'Time Range': 'النطاق الزمني',
    'Last 7 days': 'آخر 7 أيام',
    'Last 30 days': 'آخر 30 يومًا',
    'Last 90 days': 'آخر 90 يومًا',
    'Active Encounters': 'الحالات النشطة',
    'Waiting Patients': 'المرضى المنتظرون',
    'Labs Pending': 'فحوصات قيد الانتظار',
    'Avg Response Time': 'متوسط وقت الاستجابة',
    'Volume Over Time': 'الحجم عبر الزمن',
    'Visit Types': 'أنواع الزيارات',
  },
  ja: {
    'Patient list': '患者一覧',
    'Search patients': '患者を検索',
    'No patients found.': '患者が見つかりません。',
    'Selected': '選択中',
    'Edit': '編集',
    'Open Records': '記録を開く',
    'Time Range': '期間',
    'Last 7 days': '過去7日',
    'Last 30 days': '過去30日',
    'Last 90 days': '過去90日',
    'Active Encounters': '進行中ケース',
    'Waiting Patients': '待機患者',
    'Labs Pending': '保留中の検査',
    'Avg Response Time': '平均応答時間',
    'Volume Over Time': '時間別件数',
    'Visit Types': '診療タイプ',
  },
  ko: {
    'Patient list': '환자 목록',
    'Search patients': '환자 검색',
    'No patients found.': '환자를 찾을 수 없습니다.',
    'Selected': '선택됨',
    'Edit': '수정',
    'Open Records': '기록 열기',
    'Time Range': '기간',
    'Last 7 days': '최근 7일',
    'Last 30 days': '최근 30일',
    'Last 90 days': '최근 90일',
    'Active Encounters': '활성 진료',
    'Waiting Patients': '대기 환자',
    'Labs Pending': '대기 검사',
    'Avg Response Time': '평균 응답 시간',
    'Volume Over Time': '기간별 건수',
    'Visit Types': '방문 유형',
  },
  hi: {
    'Patient list': 'मरीज सूची',
    'Search patients': 'मरीज खोजें',
    'No patients found.': 'कोई मरीज नहीं मिला।',
    'Selected': 'चयनित',
    'Edit': 'संपादित करें',
    'Open Records': 'रिकॉर्ड खोलें',
    'Time Range': 'समय सीमा',
    'Last 7 days': 'पिछले 7 दिन',
    'Last 30 days': 'पिछले 30 दिन',
    'Last 90 days': 'पिछले 90 दिन',
    'Active Encounters': 'सक्रिय केस',
    'Waiting Patients': 'प्रतीक्षारत मरीज',
    'Labs Pending': 'लंबित लैब',
    'Avg Response Time': 'औसत प्रतिक्रिया समय',
    'Volume Over Time': 'समय के अनुसार मात्रा',
    'Visit Types': 'विजिट प्रकार',
  },
  bn: {
    'Patient list': 'রোগীর তালিকা',
    'Search patients': 'রোগী খুঁজুন',
    'No patients found.': 'কোনো রোগী পাওয়া যায়নি।',
    'Selected': 'নির্বাচিত',
    'Edit': 'সম্পাদনা',
    'Open Records': 'রেকর্ড খুলুন',
    'Time Range': 'সময়ের পরিসর',
    'Last 7 days': 'গত ৭ দিন',
    'Last 30 days': 'গত ৩০ দিন',
    'Last 90 days': 'গত ৯০ দিন',
    'Active Encounters': 'সক্রিয় কেস',
    'Waiting Patients': 'অপেক্ষমাণ রোগী',
    'Labs Pending': 'অপেক্ষমাণ ল্যাব',
    'Avg Response Time': 'গড় সাড়া সময়',
    'Volume Over Time': 'সময়ের সাথে ভলিউম',
    'Visit Types': 'ভিজিটের ধরন',
  },
  id: {
    'Patient list': 'Daftar pasien',
    'Search patients': 'Cari pasien',
    'No patients found.': 'Tidak ada pasien ditemukan.',
    'Selected': 'Dipilih',
    'Edit': 'Ubah',
    'Open Records': 'Buka rekam medis',
    'Time Range': 'Rentang waktu',
    'Last 7 days': '7 hari terakhir',
    'Last 30 days': '30 hari terakhir',
    'Last 90 days': '90 hari terakhir',
    'Active Encounters': 'Kasus aktif',
    'Waiting Patients': 'Pasien menunggu',
    'Labs Pending': 'Lab tertunda',
    'Avg Response Time': 'Rata-rata waktu respons',
    'Volume Over Time': 'Volume dari waktu ke waktu',
    'Visit Types': 'Jenis kunjungan',
  },
  vi: {
    'Patient list': 'Danh sách bệnh nhân',
    'Search patients': 'Tìm bệnh nhân',
    'No patients found.': 'Không tìm thấy bệnh nhân.',
    'Selected': 'Đã chọn',
    'Edit': 'Chỉnh sửa',
    'Open Records': 'Mở hồ sơ',
    'Time Range': 'Khoảng thời gian',
    'Last 7 days': '7 ngày qua',
    'Last 30 days': '30 ngày qua',
    'Last 90 days': '90 ngày qua',
    'Active Encounters': 'Ca đang xử lý',
    'Waiting Patients': 'Bệnh nhân chờ',
    'Labs Pending': 'Xét nghiệm chờ',
    'Avg Response Time': 'Thời gian phản hồi TB',
    'Volume Over Time': 'Số lượng theo thời gian',
    'Visit Types': 'Loại lượt khám',
  },
  th: {
    'Patient list': 'รายชื่อผู้ป่วย',
    'Search patients': 'ค้นหาผู้ป่วย',
    'No patients found.': 'ไม่พบผู้ป่วย',
    'Selected': 'ที่เลือก',
    'Edit': 'แก้ไข',
    'Open Records': 'เปิดบันทึก',
    'Time Range': 'ช่วงเวลา',
    'Last 7 days': '7 วันที่ผ่านมา',
    'Last 30 days': '30 วันที่ผ่านมา',
    'Last 90 days': '90 วันที่ผ่านมา',
    'Active Encounters': 'เคสที่กำลังดำเนินการ',
    'Waiting Patients': 'ผู้ป่วยที่รอ',
    'Labs Pending': 'แล็บที่รอ',
    'Avg Response Time': 'เวลาเฉลี่ยในการตอบกลับ',
    'Volume Over Time': 'ปริมาณตามเวลา',
    'Visit Types': 'ประเภทการเข้ารับบริการ',
  },
  ru: {
    'Patient list': 'Список пациентов',
    'Search patients': 'Поиск пациентов',
    'No patients found.': 'Пациенты не найдены.',
    'Selected': 'Выбрано',
    'Edit': 'Изменить',
    'Open Records': 'Открыть карту',
    'Time Range': 'Период',
    'Last 7 days': 'Последние 7 дней',
    'Last 30 days': 'Последние 30 дней',
    'Last 90 days': 'Последние 90 дней',
    'Active Encounters': 'Активные случаи',
    'Waiting Patients': 'Ожидающие пациенты',
    'Labs Pending': 'Лабы в ожидании',
    'Avg Response Time': 'Среднее время ответа',
    'Volume Over Time': 'Объём по времени',
    'Visit Types': 'Типы визитов',
  },
  tr: {
    'Patient list': 'Hasta listesi',
    'Search patients': 'Hasta ara',
    'No patients found.': 'Hasta bulunamadı.',
    'Selected': 'Seçili',
    'Edit': 'Düzenle',
    'Open Records': 'Kayıtları aç',
    'Time Range': 'Zaman aralığı',
    'Last 7 days': 'Son 7 gün',
    'Last 30 days': 'Son 30 gün',
    'Last 90 days': 'Son 90 gün',
    'Active Encounters': 'Aktif vakalar',
    'Waiting Patients': 'Bekleyen hastalar',
    'Labs Pending': 'Bekleyen laboratuvarlar',
    'Avg Response Time': 'Ortalama yanıt süresi',
    'Volume Over Time': 'Zamana göre hacim',
    'Visit Types': 'Ziyaret türleri',
  },
  it: {
    'Patient list': 'Elenco pazienti',
    'Search patients': 'Cerca pazienti',
    'No patients found.': 'Nessun paziente trovato.',
    'Selected': 'Selezionato',
    'Edit': 'Modifica',
    'Open Records': 'Apri cartella',
    'Time Range': 'Intervallo di tempo',
    'Last 7 days': 'Ultimi 7 giorni',
    'Last 30 days': 'Ultimi 30 giorni',
    'Last 90 days': 'Ultimi 90 giorni',
    'Active Encounters': 'Casi attivi',
    'Waiting Patients': 'Pazienti in attesa',
    'Labs Pending': 'Esami in sospeso',
    'Avg Response Time': 'Tempo medio di risposta',
    'Volume Over Time': 'Volume nel tempo',
    'Visit Types': 'Tipi di visita',
  },
  nl: {
    'Patient list': 'Patiëntenlijst',
    'Search patients': 'Zoek patiënten',
    'No patients found.': 'Geen patiënten gevonden.',
    'Selected': 'Geselecteerd',
    'Edit': 'Bewerken',
    'Open Records': 'Dossiers openen',
    'Time Range': 'Tijdsbereik',
    'Last 7 days': 'Afgelopen 7 dagen',
    'Last 30 days': 'Afgelopen 30 dagen',
    'Last 90 days': 'Afgelopen 90 dagen',
    'Active Encounters': 'Actieve casussen',
    'Waiting Patients': 'Wachtende patiënten',
    'Labs Pending': 'Labs in afwachting',
    'Avg Response Time': 'Gem. reactietijd',
    'Volume Over Time': 'Volume over tijd',
    'Visit Types': 'Bezoektypen',
  },
  sv: {
    'Patient list': 'Patientlista',
    'Search patients': 'Sök patienter',
    'No patients found.': 'Inga patienter hittades.',
    'Selected': 'Vald',
    'Edit': 'Redigera',
    'Open Records': 'Öppna journaler',
    'Time Range': 'Tidsintervall',
    'Last 7 days': 'Senaste 7 dagarna',
    'Last 30 days': 'Senaste 30 dagarna',
    'Last 90 days': 'Senaste 90 dagarna',
    'Active Encounters': 'Aktiva ärenden',
    'Waiting Patients': 'Väntande patienter',
    'Labs Pending': 'Lab väntar',
    'Avg Response Time': 'Genomsnittlig svarstid',
    'Volume Over Time': 'Volym över tid',
    'Visit Types': 'Besökstyper',
  },
  pl: {
    'Patient list': 'Lista pacjentów',
    'Search patients': 'Szukaj pacjentów',
    'No patients found.': 'Nie znaleziono pacjentów.',
    'Selected': 'Wybrano',
    'Edit': 'Edytuj',
    'Open Records': 'Otwórz dokumentację',
    'Time Range': 'Zakres czasu',
    'Last 7 days': 'Ostatnie 7 dni',
    'Last 30 days': 'Ostatnie 30 dni',
    'Last 90 days': 'Ostatnie 90 dni',
    'Active Encounters': 'Aktywne przypadki',
    'Waiting Patients': 'Oczekujący pacjenci',
    'Labs Pending': 'Badania oczekujące',
    'Avg Response Time': 'Średni czas odpowiedzi',
    'Volume Over Time': 'Wolumen w czasie',
    'Visit Types': 'Typy wizyt',
  },
  he: {
    'Patient list': 'רשימת מטופלים',
    'Search patients': 'חיפוש מטופלים',
    'No patients found.': 'לא נמצאו מטופלים.',
    'Selected': 'נבחר',
    'Edit': 'עריכה',
    'Open Records': 'פתח רשומות',
    'Time Range': 'טווח זמן',
    'Last 7 days': '7 הימים האחרונים',
    'Last 30 days': '30 הימים האחרונים',
    'Last 90 days': '90 הימים האחרונים',
    'Active Encounters': 'מקרים פעילים',
    'Waiting Patients': 'מטופלים ממתינים',
    'Labs Pending': 'מעבדות ממתינות',
    'Avg Response Time': 'זמן תגובה ממוצע',
    'Volume Over Time': 'נפח לאורך זמן',
    'Visit Types': 'סוגי ביקורים',
  },
};

Object.keys(EXTENDED_TRANSLATIONS_EXTRA).forEach((locale) => {
  TRANSLATIONS[locale] = {
    ...(TRANSLATIONS[locale] || {}),
    ...EXTENDED_TRANSLATIONS_EXTRA[locale],
  };
});

const makeLocaleFallbackTranslator = (shortCode) => {
  const suffix = ` [${String(shortCode || '').toUpperCase()}]`;
  return (text) => {
    if (typeof text !== 'string' || !text.length) return text;
    return `${text}${suffix}`;
  };
};

const makeTranslator = (language) => {
  const normalized = normalizeLanguage(language);
  const short = (normalized || '').split('-')[0];
  const table = TRANSLATIONS[normalized] || TRANSLATIONS[short] || {};
  const hasExplicitTable = !!(TRANSLATIONS[normalized] || TRANSLATIONS[short]);
  const fallbackTranslator = !hasExplicitTable && short && short !== 'en'
    ? makeLocaleFallbackTranslator(short)
    : null;

  return (text) => {
    if (table[text]) return table[text];
    if (fallbackTranslator) return fallbackTranslator(text);
    return text;
  };
};

const normalizeCountryCode = (value) => {
  const v = String(value || '').trim().toUpperCase();
  if (!v) return 'US';
  if (v === OTHER_COUNTRY_CODE) return OTHER_COUNTRY_CODE;
  if (/^[A-Z]{2}$/.test(v)) return v;
  return 'US';
};

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

const LAST_SELECTED_WORKSPACE_KEY = 'lastSelectedWorkspace';

const getStoredWorkspace = () => {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeWorkspace(localStorage.getItem(LAST_SELECTED_WORKSPACE_KEY));
  } catch (err) {
    return null;
  }
};

const persistWorkspace = (workspace) => {
  const normalized = normalizeWorkspace(workspace);
  if (typeof window === 'undefined') return normalized;
  try {
    if (!normalized) {
      localStorage.removeItem(LAST_SELECTED_WORKSPACE_KEY);
      return null;
    }
    localStorage.setItem(LAST_SELECTED_WORKSPACE_KEY, normalized);
  } catch (err) {
    // ignore persistence errors
  }
  return normalized;
};

const resolveWorkspaceForUser = ({ nextUser, preferredWorkspace, useStoredWorkspace = true }) => {
  const allowedWorkspaces = getAllowedWorkspacesForUser(nextUser);
  const preferred = normalizeWorkspace(preferredWorkspace);
  if (preferred && allowedWorkspaces.includes(preferred)) {
    return { allowedWorkspaces, workspace: preferred };
  }

  if (useStoredWorkspace) {
    const stored = getStoredWorkspace();
    if (stored && allowedWorkspaces.includes(stored)) {
      return { allowedWorkspaces, workspace: stored };
    }
  }

  if (allowedWorkspaces.length === 1) {
    return { allowedWorkspaces, workspace: allowedWorkspaces[0] };
  }

  return { allowedWorkspaces, workspace: null };
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
  const allowedWorkspaces = useMemo(() => getAllowedWorkspacesForUser(user), [user]);
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
  const [showLogin, setShowLogin] = useState(() => true);
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
  const countryOptions = useMemo(() => getCountryOptions(selectedLanguage, t), [selectedLanguage, t]);
  const [signupCountry, setSignupCountry] = useState(() => {
    if (typeof window === 'undefined') return 'US';
    try {
      return normalizeCountryCode(localStorage.getItem('signupCountry') || 'US');
    } catch (err) {
      return 'US';
    }
  });
  const [signupCountryOtherText, setSignupCountryOtherText] = useState('');

  const [showCountryOnboarding, setShowCountryOnboarding] = useState(false);
  const pendingCountryRef = React.useRef(null);
  const [countrySaveError, setCountrySaveError] = useState('');

  const [profileCountryCode, setProfileCountryCode] = useState('US');
  const [profileCountryOtherText, setProfileCountryOtherText] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

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
  const [showPricing, setShowPricing] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location?.pathname === '/pricing';
  });
  const [pricingReturnPath, setPricingReturnPath] = useState(() => {
    if (typeof window === 'undefined') return '/';
    // If someone deep-links directly to /pricing, we default back to home.
    return '/';
  });
  const [showCheckout, setShowCheckout] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location?.pathname === '/checkout';
  });

  const openPricing = () => {
    const currentPath = typeof window !== 'undefined' ? (window.location?.pathname || '/') : '/';
    setPricingReturnPath(currentPath && currentPath !== '/pricing' ? currentPath : '/');
    setShowPricing(true);
    setShowCheckout(false);
    setShowSignup(false);
    setShowLogin(false);
    window.history.replaceState({}, '', '/pricing');
  };

  const closePricingTo = (targetPath) => {
    const path = String(targetPath || '/').trim() || '/';
    setShowPricing(false);

    if (path === '/checkout') {
      setShowCheckout(true);
      window.history.replaceState({}, '', '/checkout');
      return;
    }

    setShowCheckout(false);

    if (path === '/signup') {
      setShowSignup(true);
      setShowLogin(true);
      window.history.replaceState({}, '', '/signup');
      return;
    }

    if (path === '/login') {
      setShowSignup(false);
      setShowLogin(true);
      window.history.replaceState({}, '', '/login');
      return;
    }

    // Default: return to workspace if available, otherwise home (picker).
    setShowSignup(false);
    setShowLogin(false);
    if (user && activePortal) {
      window.history.replaceState({}, '', `/${activePortal}`);
      return;
    }
    window.history.replaceState({}, '', '/');
  };
  const [billingStatus, setBillingStatus] = useState({
    provider: 'none',
    configured: false,
    capabilities: { checkout: false, portal: false, webhook: false },
    error: '',
  });
  const [billingActionError, setBillingActionError] = useState('');
  const pendingPostAuthRef = React.useRef(null);
  const [proGate, setProGate] = useState({ show: false, featureKey: null });
  const pendingProActionRef = React.useRef(null);
  const [showApptModal, setShowApptModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [workspaceMainSection, setWorkspaceMainSection] = useState('dashboard');
  const [telehealthSummaryPatient, setTelehealthSummaryPatient] = useState(null);
  const [showTelehealthSummary, setShowTelehealthSummary] = useState(false);
  const [activeTelehealthVisit, setActiveTelehealthVisit] = useState(null);
  const [triageQueueOverride, setTriageQueueOverride] = useState(null);
  const [apptModalPrefill, setApptModalPrefill] = useState(null);
  const [chatContext, setChatContext] = useState({ type: null, id: null, threadKey: null });

  const closeExclusiveModal = () => {
    setShowChat(false);
    setChatRecipients(null);
    setChatContext({ type: null, id: null, threadKey: null });
    setRecordModal(false);
    setChartModal(false);
    setShowAnalytics(false);
    setLabModal(null);
    setShowAssignments(false);
    setShowPatients(false);
    setShowSettings(false);
    setShowSubscriptionSettings(false);
    setShowApptModal(false);
    setApptModalPrefill(null);
    setShowInsuranceModal(false);
    setShowRefillModal(false);
    setShowReceipt(false);
    setShowTelehealthSummary(false);
    setProGate({ show: false, featureKey: null });
  };

  const openExclusiveModal = (openFn) => {
    closeExclusiveModal();
    openFn?.();
  };

  const openSidebarMainSection = (section) => {
    closeExclusiveModal();
    setWorkspaceMainSection(section || 'dashboard');
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingUser(true);
        const sub = ensureSubscriptionFresh();
        setSubscription(sub);
        const data = await fetchJson('/api/auth/me');
        const nextUser = decorateUserForView(data.user);
        setUser(nextUser);
        const { workspace: targetWorkspace } = resolveWorkspaceForUser({
          nextUser,
          preferredWorkspace: desiredProduct,
          useStoredWorkspace: true,
        });

        if (targetWorkspace !== desiredProduct) {
          setDesiredProduct(targetWorkspace || null);
        }

        const portal = resolvePortalFromProduct(targetWorkspace, nextUser);

		// If user profile is missing required Country of Origin, block entry until completed.
		if (nextUser && !nextUser.hasCountryOfOrigin) {
			pendingCountryRef.current = { portal, targetWorkspace };
			setActivePortal(null);
			setShowLogin(false);
			setShowSignup(false);
			setShowCountryOnboarding(true);
			window.history.replaceState({}, '', '/country-of-origin');
			return;
		}

        setActivePortal(portal);
        setShowLogin(false);
        setShowSignup(false);
        if (portal && targetWorkspace) {
          persistWorkspace(targetWorkspace);
          window.history.replaceState({}, '', `/${targetWorkspace}`);
        } else {
          window.history.replaceState({}, '', '/');
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

  useEffect(() => {
    if (!showSettings || !user) return;
    const code = normalizeCountryCode(user?.countryOfOrigin?.countryCode || user?.country || 'US');
    setProfileCountryCode(code);
    setProfileCountryOtherText(user?.countryOfOrigin?.countryOtherText || '');
  }, [showSettings, user]);

  useEffect(() => {
    if (!showSubscriptionSettings || !user) return;
    let cancelled = false;
    setBillingActionError('');
    fetchJson('/api/billing/status')
      .then((data) => {
        if (cancelled) return;
        setBillingStatus({
          provider: data?.provider || 'none',
          configured: !!data?.configured,
          capabilities: data?.capabilities || { checkout: false, portal: false, webhook: false },
          error: '',
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setBillingStatus({
          provider: 'none',
          configured: false,
          capabilities: { checkout: false, portal: false, webhook: false },
          error: err?.message || 'Billing status unavailable',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [showSubscriptionSettings, user]);

  const requireAccess = (featureKey, action) => {
    const fresh = ensureSubscriptionFresh();
    setSubscription(fresh);

    if (canAccess(featureKey, fresh)) {
      action?.();
      return true;
    }

    pendingProActionRef.current = action || null;
    openExclusiveModal(() => setProGate({ show: true, featureKey }));
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
    if (!user || activePortal) return;
    if (allowedWorkspaces.length !== 1) return;
    if (showCountryOnboarding || showSubscriptionOnboarding || showPricing || showCheckout) return;

    const forcedWorkspace = allowedWorkspaces[0];
    const portal = resolvePortalFromProduct(forcedWorkspace, user);
    if (!portal) return;

    if (desiredProduct !== forcedWorkspace) {
      setDesiredProduct(forcedWorkspace);
    }
    setShowLogin(false);
    setShowSignup(false);
    setActivePortal(portal);
    persistWorkspace(forcedWorkspace);
    window.history.replaceState({}, '', `/${forcedWorkspace}`);
  }, [
    user,
    activePortal,
    allowedWorkspaces,
    showCountryOnboarding,
    showSubscriptionOnboarding,
    showPricing,
    showCheckout,
    desiredProduct,
  ]);

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
      localStorage.setItem('signupCountry', /^[A-Z]{2}$/.test(String(signupCountry || '').toUpperCase()) ? String(signupCountry).toUpperCase() : 'US');
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
      const { workspace: targetWorkspace } = resolveWorkspaceForUser({
        nextUser,
        preferredWorkspace: desiredProduct,
        useStoredWorkspace: true,
      });
      if (targetWorkspace !== desiredProduct) {
        setDesiredProduct(targetWorkspace || null);
      }
      const portal = resolvePortalFromProduct(targetWorkspace, nextUser);

      if (nextUser && !nextUser.hasCountryOfOrigin) {
        pendingCountryRef.current = { portal, targetWorkspace };
        setActivePortal(null);
        setShowLogin(false);
        setShowSignup(false);
        setShowCountryOnboarding(true);
        window.history.replaceState({}, '', '/country-of-origin');
        return;
      }

      setActivePortal(portal);
      setShowLogin(false);
      setShowSignup(false);
      if (portal && targetWorkspace) {
        persistWorkspace(targetWorkspace);
        window.history.replaceState({}, '', `/${targetWorkspace}`);
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
    const countryCode = normalizeCountryCode((form.get('countryCode') || signupCountry || 'US').toString());
    const countryOtherText = (form.get('countryOtherText') || '').toString();
    if (role === 'other' && !customRoleValue) {
      setAuthError('Please enter a role name when choosing Other.');
      return;
    }
    if (String(countryCode || '').toUpperCase() === OTHER_COUNTRY_CODE) {
      const cleaned = String(countryOtherText || '').trim();
      if (cleaned.length < 2 || cleaned.length > 64) {
        setAuthError('Please specify a country (2-64 characters).');
        return;
      }
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
          countryCode,
          countryOtherText: String(countryCode || '').toUpperCase() === OTHER_COUNTRY_CODE ? String(countryOtherText || '').trim() : null,
          countrySource: 'signup',
          product: productChoice || null,
        }),
      });
      const sub = ensureSubscriptionFresh();
      setSubscription(sub);
      const nextUser = decorateUserForView(data.user);
      setUser(nextUser);
      const { workspace: targetWorkspace } = resolveWorkspaceForUser({
        nextUser,
        preferredWorkspace: productChoice || desiredProduct,
        useStoredWorkspace: true,
      });
      if (targetWorkspace !== desiredProduct) {
        setDesiredProduct(targetWorkspace || null);
      }
      const portal = resolvePortalFromProduct(targetWorkspace, nextUser);
      // Typical UX: do not block entry after signup.
      setActivePortal(portal);
      setShowLogin(false);
      setShowSignup(false);
      if (portal && targetWorkspace) {
        persistWorkspace(targetWorkspace);
        window.history.replaceState({}, '', `/${targetWorkspace}`);
      } else {
        window.history.replaceState({}, '', '/');
      }
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

  const saveCountryOfOrigin = async ({ countryCode, countryOtherText, countrySource }) => {
    const payload = {
      countryCode,
      countryOtherText: isOtherCountry(countryCode) ? (String(countryOtherText || '').trim() || null) : null,
      countrySource: countrySource || 'profile',
    };
    const data = await fetchJson('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const nextUser = decorateUserForView(data.user);
    setUser(nextUser);
    return nextUser;
  };

  const completeCountryOnboarding = async ({ countryCode, countryOtherText }) => {
    try {
      setCountrySaveError('');
      const nextUser = await saveCountryOfOrigin({ countryCode, countryOtherText, countrySource: 'onboarding' });
      setShowCountryOnboarding(false);

      const pending = pendingCountryRef.current || {};
      pendingCountryRef.current = null;

      const portal = pending.portal || resolvePortalFromProduct(normalizeWorkspace(desiredProduct), nextUser);
      const targetWorkspace = pending.targetWorkspace || normalizeWorkspace(desiredProduct) || null;

      setActivePortal(portal);
      if (portal && targetWorkspace) {
        persistWorkspace(targetWorkspace);
        window.history.replaceState({}, '', `/${targetWorkspace}`);
      } else {
        window.history.replaceState({}, '', '/');
      }
    } catch (err) {
      setCountrySaveError(err.message || 'Failed to save country');
    }
  };

  const handleLogout = async () => {
    try {
      await fetchJson('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // session might already be gone
    }
    setUser(null);
    setActivePortal(null);
    setShowLogin(true);
    setShowSignup(false);
    setShowPasswordReset(false);
    setPasswordResetSubmitted(false);
    setPasswordResetEmail('');
    setDesiredProduct(null);
    setSelectedRole('patient');
    setCustomRole('');
    setSignupCountry('US');
    setSignupCountryOtherText('');
    setShowSubscriptionSettings(false);
    setShowPricing(false);
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
    const normalized = normalizeWorkspace(product);
    if (!normalized) return;

    setDesiredProduct(normalized);
    persistWorkspace(normalized);
    setActivePortal(null);

    if (!user) {
      setShowLogin(true);
      window.history.replaceState({}, '', '/login');
      return;
    }

    const allowed = getAllowedWorkspacesForUser(user);
    if (!allowed.includes(normalized)) {
      const fallback = allowed[0] || null;
      setDesiredProduct(fallback);
      if (!fallback) {
        window.history.replaceState({}, '', '/');
        return;
      }
      persistWorkspace(fallback);
      const fallbackPortal = resolvePortalFromProduct(fallback, user);
      setActivePortal(fallbackPortal);
      window.history.replaceState({}, '', `/${fallback}`);
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
    openExclusiveModal(() => setShowApptModal(true));
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

    openExclusiveModal(() => setLabModal(newLab));
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

    openExclusiveModal(() => {
      setChatRecipients([{ id: patientId, name: patientName, role: 'patient' }]);
      setChatContext({ type: 'intake', id: patientId, threadKey: `intake:${patientId}` });
      setShowChat(true);
    });
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
        openExclusiveModal(() => setShowAssignments(true));
      };

      const handleReviewLabs = () => {
        if (pendingLabs.length) {
          setQuickActionMessage('');
          openExclusiveModal(() => setLabModal(pendingLabs[0]));
          return;
        }
        setQuickActionVariant('secondary');
        setQuickActionMessage('No pending labs to review.');
      };

      const handleScheduleAppt = () => {
        setQuickActionMessage('');
        openExclusiveModal(() => setShowApptModal(true));
      };

      const handlePatientMessage = () => {
        setQuickActionMessage('');
        openExclusiveModal(() => {
          setChatRecipients((clinicData?.patients || []).map((p) => ({ ...p, role: 'patient' })));
          setShowChat(true);
        });
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
        openExclusiveModal(() => {
          setChatRecipients(clinicData.providers);
          setShowChat(true);
        });
      };

      const handleRefill = () => {
        setQuickActionMessage('');
        setRecordPatient(patientRecord);
        openExclusiveModal(() => setShowRefillModal(true));
      };

      const handleInsurance = () => {
        setRecordPatient(patientRecord);
        setQuickActionVariant('info');
        setQuickActionMessage('');
        openExclusiveModal(() => setShowInsuranceModal(true));
      };

      return (
        <div className="d-grid gap-2">
          <Button variant="success" onClick={() => { setQuickActionMessage(''); openExclusiveModal(() => setShowApptModal(true)); }}>Book Appointment</Button>
          <Button variant="outline-primary" onClick={openChat}>Message Provider</Button>
          <Button variant="outline-success" onClick={handleRefill}>Request Prescription Refill</Button>
          <Button variant="outline-secondary" onClick={() => { setQuickActionMessage(''); openExclusiveModal(() => setRecordModal(true)); }}>View Medical Records</Button>
          <Button variant="outline-dark" onClick={handleInsurance}>Update Insurance</Button>
        </div>
      );
    }

    return (
      <div className="d-grid gap-2">
        <Button variant="outline-primary" onClick={() => openExclusiveModal(() => setShowChat(true))}>Open chat</Button>
        <Button variant="outline-secondary" onClick={() => openExclusiveModal(() => setRecordModal(true))} disabled={!patientRecord}>
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
            onOpenRecords={() => openExclusiveModal(() => setRecordModal(true))}
            onOpenLab={(lab) => openExclusiveModal(() => setLabModal(lab))}
            onOpenChat={() => openExclusiveModal(() => setShowChat(true))}
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
              openExclusiveModal(() => setChartModal(true));
            }}
            onOpenRecords={(p) => {
              setRecordPatient(p);
              openExclusiveModal(() => setRecordModal(true));
            }}
            onOpenAnalytics={() => requireAccess('analytics', () => openExclusiveModal(() => setShowAnalytics(true)))}
            onOpenPatients={() => openExclusiveModal(() => setShowPatients(true))}
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
              openExclusiveModal(() => setChartModal(true));
            }}
            onOpenRecords={(p) => {
              setRecordPatient(p);
              openExclusiveModal(() => setRecordModal(true));
            }}
            onOpenAnalytics={() => requireAccess('analytics', () => openExclusiveModal(() => setShowAnalytics(true)))}
            onOpenPatients={() => openExclusiveModal(() => setShowPatients(true))}
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
              openExclusiveModal(() => setShowTelehealthSummary(true));
            }}
            onOpenChat={() => openExclusiveModal(() => setShowChat(true))}
            onOpenPatients={() => openExclusiveModal(() => setShowPatients(true))}
            onOpenAssignments={() => openExclusiveModal(() => setShowAssignments(true))}
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
            onOpenPatients={() => openExclusiveModal(() => setShowPatients(true))}
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
              openExclusiveModal(() => setChartModal(true));
            }}
            onOpenRecords={(p) => {
              setRecordPatient(p);
              openExclusiveModal(() => setRecordModal(true));
            }}
            onOpenAnalytics={() => requireAccess('analytics', () => openExclusiveModal(() => setShowAnalytics(true)))}
            onOpenPatients={() => requireAccess('clinic_ops', () => openExclusiveModal(() => setShowPatients(true)))}
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
              openExclusiveModal(() => setShowTelehealthSummary(true));
            }}
            onOpenLab={(lab) => openExclusiveModal(() => setLabModal(lab))}
            onOpenChat={() => openExclusiveModal(() => setShowChat(true))}
            onOpenAssignments={() => openExclusiveModal(() => setShowAssignments(true))}
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
              <Card.Text className="text-muted">{t('This feature requires a paid subscription tier.')}</Card.Text>
              <div className="d-flex gap-2">
                <Button variant="primary" onClick={() => { openExclusiveModal(() => setProGate({ show: true, featureKey: 'admin_config' })); }}>
                  {t('Unlock paid features')}
                </Button>
                <Button variant="outline-secondary" onClick={() => openExclusiveModal(() => setShowSubscriptionSettings(true))}>
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

  const shouldShowCountryScreen = Boolean(user && showCountryOnboarding);
  const shouldShowSubscriptionScreen = Boolean(user && showSubscriptionOnboarding);
  const shouldShowPricingScreen = Boolean(showPricing);
  const shouldShowCheckoutScreen = Boolean(showCheckout);
  const shouldShowWorkspace = Boolean(user && activePortal && !shouldShowCountryScreen && !shouldShowSubscriptionScreen && !shouldShowPricingScreen && !shouldShowCheckoutScreen);
  const shouldShowPicker = !shouldShowSubscriptionScreen
    && !shouldShowCountryScreen
    && !shouldShowPricingScreen
    && !shouldShowCheckoutScreen
    && (user && !activePortal && allowedWorkspaces.length > 1);
  const shouldShowLoginForm = !shouldShowSubscriptionScreen && !shouldShowCountryScreen && !shouldShowPricingScreen && !shouldShowCheckoutScreen && !user && (showLogin || !!desiredProduct);

  const workspaceVisitQueue = useMemo(() => {
    return (clinicData.appointments || [])
      .filter((appt) => appt?.status !== 'completed')
      .sort((a, b) => new Date(a?.startAt || 0) - new Date(b?.startAt || 0));
  }, [clinicData.appointments]);

  const workspaceActivity = useMemo(() => {
    return (notifications || [])
      .slice()
      .sort((a, b) => new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0))
      .slice(0, 20);
  }, [notifications]);

  const workspaceNotificationFeed = useMemo(() => {
    if (activePortal === 'patient' || user?.role === 'patient') {
      return patientNotifications.slice().reverse();
    }
    return workspaceActivity;
  }, [activePortal, user, patientNotifications, workspaceActivity]);

  const todayAppointmentsCount = useMemo(() => {
    const today = new Date().toDateString();
    return (clinicData.appointments || []).filter((appt) => {
      if (!appt?.startAt) return false;
      return new Date(appt.startAt).toDateString() === today;
    }).length;
  }, [clinicData.appointments]);

  const totalPatientsCount = (clinicData.patients || []).length;
  const pendingReviewsCount = pendingLabs.length;
  const isMyHealthWorkspace = normalizeWorkspace(desiredProduct) === 'myhealth';

  const myHealthMetrics = useMemo(() => {
    const targetPatientId = patientRecord?.id;
    const upcomingAppointments = (clinicData.appointments || []).filter((appt) => {
      if (!targetPatientId || appt?.patientId !== targetPatientId) return false;
      return String(appt?.status || '').toLowerCase() !== 'completed';
    }).length;

    const activePrescriptions = (prescriptions || []).filter((rx) => {
      if (!targetPatientId || rx?.patientId !== targetPatientId) return false;
      return !['completed', 'stopped'].includes(String(rx?.status || '').toLowerCase());
    }).length;

    const pendingTestResults = (clinicData.labs || []).filter((lab) => {
      if (!targetPatientId || lab?.patientId !== targetPatientId) return false;
      const status = String(lab?.status || '').toLowerCase();
      return status === 'pending' || status === 'pending_review';
    }).length;

    const unreadMessages = Array.isArray(patientRecord?.messages)
      ? patientRecord.messages.filter((msg) => msg?.unread).length
      : 0;

    return [
      { label: 'Upcoming Appointments', value: upcomingAppointments },
      { label: 'Active Prescriptions', value: activePrescriptions },
      { label: 'Pending Test Results', value: pendingTestResults },
      { label: 'Unread Messages', value: unreadMessages },
    ];
  }, [clinicData.appointments, clinicData.labs, prescriptions, patientRecord]);

  const userRole = String(user?.role || '').trim().toLowerCase();
  const isAdminUser = userRole === 'admin';
  const isDoctorOrNurse = userRole === 'doctor' || userRole === 'nurse';
  const workspaceKey = normalizeWorkspace(desiredProduct);
  const showAdminDashboard = isAdminUser;
  const showPatientsMenu = isAdminUser || isDoctorOrNurse;
  const showAssignmentsMenu = isAdminUser || isDoctorOrNurse;
  const showAnalyticsMenu = isAdminUser && normalizeProductKey(desiredProduct) === 'telehealth';
  const primaryMenuKey = workspaceMainSection;
  const topSummaryMetrics = isMyHealthWorkspace
    ? myHealthMetrics
    : [
      { label: "Today's Appointments", value: todayAppointmentsCount },
      { label: 'Total Patients', value: totalPatientsCount },
      { label: 'Pending Reviews', value: pendingReviewsCount },
    ];
  const workspaceBrandLabel = workspaceKey === 'telehealth'
    ? 'Telemedicine'
    : workspaceKey === 'homecare'
      ? 'HomeCare'
      : 'My HomeCare Online';
  const workspaceFooterLogoSrc = workspaceKey === 'myhealth' ? homecareLogo : '/WHSF.jpg';
  const workspaceFooterLogoAlt = workspaceKey === 'myhealth' ? 'My HomeCare Online' : 'WHS Foundation';
  const showCareTeamModeLabel = workspaceKey === 'homecare' && !['doctor', 'nurse'].includes(userRole);

  const renderWorkspaceMainPanel = () => {
    if (workspaceMainSection === 'patients') {
      return (
        <PatientsModule
          inline
          show
          onHide={() => setWorkspaceMainSection('dashboard')}
          currentUser={user}
          patients={clinicData.patients}
          providers={clinicData.providers}
          homecareTasks={clinicData.homecareTasks || []}
          onSavePatient={(payload) => upsertPatient(payload)}
          onStartEncounter={({ patientId }) => {
            setActiveTelehealthVisit({ patientId, startedAt: new Date().toISOString(), status: 'in_progress' });
            setQuickActionVariant('success');
            setQuickActionMessage('Encounter started.');
          }}
          onCreateHomecareTask={(payload) => handleCreateHomecareTask(payload)}
          onOpenChart={(p) => {
            setChartPatient(p);
            openExclusiveModal(() => setChartModal(true));
          }}
          onOpenRecords={(p) => {
            setRecordPatient(p);
            openExclusiveModal(() => setRecordModal(true));
          }}
          t={t}
        />
      );
    }

    if (workspaceMainSection === 'assignments') {
      return (
        <PatientAssignmentModule
          inline
          show
          onHide={() => setWorkspaceMainSection('dashboard')}
          currentUser={{ id: user?.id, role: user?.role, name: user?.email || 'User' }}
          onAssignmentUpdate={refreshStore}
          onViewDetails={(p) => {
            setRecordPatient(p);
            openExclusiveModal(() => setRecordModal(true));
          }}
          onViewRecord={(p) => {
            setRecordPatient(p);
            openExclusiveModal(() => setRecordModal(true));
          }}
          enableRecordQuickOpen
        />
      );
    }

    if (workspaceMainSection === 'analytics') {
      return (
        <AnalyticsDashboard
          inline
          show
          onHide={() => setWorkspaceMainSection('dashboard')}
          appointments={clinicData.appointments}
          labs={clinicData.labs}
          t={t}
        />
      );
    }

    return (
      <>
        <section className="TopSummaryBand mb-4">
          <Card className="card-plain workspace-topbar mb-3">
            <Card.Body className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <div className="text-uppercase small text-muted fw-semibold">{t('Workspace')}</div>
                <div className="fw-bold fs-5">{getProductTitle(desiredProduct) || t('Workspace')}</div>
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
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => requireAccess('analytics', () => openExclusiveModal(() => setShowAnalytics(true)))}
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

          <Card className="card-plain workspace-metrics">
            <Card.Body>
              <div className="workspace-metrics-grid">
                {topSummaryMetrics.map((metric) => (
                  <div key={metric.label} className="workspace-metric-item">
                    <div className="workspace-metric-label">{t(metric.label)}</div>
                    <div className="workspace-metric-value">{metric.value}</div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </section>

        <section className="PrimaryActionsPanel mb-4">
          <Card className="card-plain">
            <Card.Body>
              <Card.Title className="mb-0">{t("Today's Actions")}</Card.Title>
              <div className="workspace-primary-actions mt-3">
                {renderQuickActions()}
              </div>
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
        </section>

        <section className="WorkspaceGrid grid-desktop-2col">
          <div className="workspace-grid-left d-grid gap-3">
            {!isMyHealthWorkspace && (
              <Card className="card-plain">
                <Card.Body>
                  <Card.Title>{t('Visit Queue')}</Card.Title>
                  <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
                    <ListGroup variant="flush">
                      {workspaceVisitQueue.map((a) => (
                        <ListGroup.Item key={a.id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-semibold">{a.patientName || t('Patient')}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              {a.type || t('Visit')} • {a.startAt ? new Date(a.startAt).toLocaleString() : t('TBD')}
                            </div>
                          </div>
                          <Badge bg="secondary" className="text-uppercase">{a.status || t('scheduled')}</Badge>
                        </ListGroup.Item>
                      ))}
                      {!workspaceVisitQueue.length && <ListGroup.Item className="text-muted">{t('No upcoming visits.')}</ListGroup.Item>}
                    </ListGroup>
                  </div>
                </Card.Body>
              </Card>
            )}

            <Card className="card-plain">
              <Card.Body>
                <Card.Title>{t('Appointments')}</Card.Title>
                <div className="overflow-x-auto">
                  <ListGroup variant="flush">
                    {(clinicData.appointments || []).slice(0, 12).map((appt, idx) => (
                      <ListGroup.Item key={appt?.id || `${appt?.patientId || 'appt'}_${idx}`} className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">{appt?.patientName || t('Patient')}</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>{appt?.type || t('Appointment')}</div>
                        </div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{appt?.startAt ? new Date(appt.startAt).toLocaleString() : t('TBD')}</div>
                      </ListGroup.Item>
                    ))}
                    {!(clinicData.appointments || []).length && <ListGroup.Item className="text-muted">{t('No appointments.')}</ListGroup.Item>}
                  </ListGroup>
                </div>
              </Card.Body>
            </Card>

            <Card className="card-plain">
              <Card.Body>
                <Card.Title>{t('Care Snapshot')}</Card.Title>
                {renderDashboard()}
              </Card.Body>
            </Card>
          </div>

          <div className="workspace-grid-right d-grid gap-3">
            <Card className="card-plain">
              <Card.Body>
                <Card.Title>{t('Activity')}</Card.Title>
                <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
                  <ListGroup variant="flush">
                    {workspaceActivity.map((n) => (
                      <ListGroup.Item key={n.id}>
                        <div className="fw-semibold">{n.message || n.type}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {n.type}{n.updatedAt ? ` • ${new Date(n.updatedAt).toLocaleString()}` : ''}
                        </div>
                      </ListGroup.Item>
                    ))}
                    {!workspaceActivity.length && <ListGroup.Item className="text-muted">{t('No recent activity.')}</ListGroup.Item>}
                  </ListGroup>
                </div>
              </Card.Body>
            </Card>

            <Card className="card-plain">
              <Card.Body>
                <Card.Title>{t('Notifications')}</Card.Title>
                <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
                  <ListGroup variant="flush">
                    {workspaceNotificationFeed.map((n) => (
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
                    {!workspaceNotificationFeed.length && (
                      <ListGroup.Item className="text-muted">{t('No notifications.')}</ListGroup.Item>
                    )}
                  </ListGroup>
                </div>
              </Card.Body>
            </Card>
          </div>
        </section>

        <section className="WorkspaceFooterLogoRow mt-4">
          <div className="workspace-footer-logo-wrap">
            <img src={workspaceFooterLogoSrc} alt={workspaceFooterLogoAlt} className="workspace-footer-logo" />
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="app-shell">
      {!shouldShowWorkspace && (
        <Navigation
          user={user}
          onLogout={handleLogout}
          isAdmin={user?.role === 'admin'}
          onOpenSettings={() => openExclusiveModal(() => setShowSettings(true))}
          onLogin={() => { setShowSignup(false); setShowLogin(true); window.history.replaceState({}, '', '/login'); }}
          onOpenPricing={openPricing}
          showPricingAction
          showLoginAction={!user}
          languages={SUPPORTED_LANGUAGES}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          t={t}
        />
      )}

      {shouldShowWorkspace && (
        <div className="workspace-app-shell h-screen overflow-hidden">
          <div className="workspace-layout d-flex h-full">
            <aside className="workspace-sidebar shrink-0 border-end d-flex flex-column">
              <div className="workspace-sidebar-header">
                <div className="workspace-sidebar-brand">{workspaceBrandLabel}</div>
                <div className="workspace-sidebar-meta text-muted text-uppercase">{user?.role || 'user'}</div>
                <div className="workspace-sidebar-email text-muted">{user?.email || ''}</div>
              </div>
              <div className="workspace-sidebar-menu d-grid gap-2">
                {showAdminDashboard && (
                  <Button variant={primaryMenuKey === 'dashboard' ? 'primary' : 'outline-secondary'} size="sm" className="text-start" onClick={() => openSidebarMainSection('dashboard')}>Dashboard</Button>
                )}
                {showPatientsMenu && (
                  <Button variant={primaryMenuKey === 'patients' ? 'primary' : 'outline-secondary'} size="sm" className="text-start" onClick={() => openSidebarMainSection('patients')}>Patients</Button>
                )}
                {showAssignmentsMenu && (
                  <Button variant={primaryMenuKey === 'assignments' ? 'primary' : 'outline-secondary'} size="sm" className="text-start" onClick={() => openSidebarMainSection('assignments')}>Assignments</Button>
                )}
                {showAnalyticsMenu && (
                  <Button variant={primaryMenuKey === 'analytics' ? 'primary' : 'outline-secondary'} size="sm" className="text-start" onClick={() => requireAccess('analytics', () => openSidebarMainSection('analytics'))}>Analytics</Button>
                )}
                <Button variant="outline-secondary" size="sm" className="text-start" onClick={openPricing}>Pricing</Button>
                <Button variant={primaryMenuKey === 'settings' ? 'primary' : 'outline-secondary'} size="sm" className="text-start" onClick={() => openExclusiveModal(() => setShowSettings(true))}>Settings</Button>
                <Button variant="outline-danger" size="sm" className="text-start" onClick={handleLogout}>Logout</Button>
                <div className="workspace-sidebar-language workspace-sidebar-language-after-logout">
                  <Form.Select
                    size="sm"
                    aria-label="Language selector"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag ? `${lang.flag} ${lang.label}` : lang.label}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </div>
            </aside>

            <main className="workspace-main flex-1 overflow-y-auto">
              <div className="workspace-main-container max-w-[1440px] mx-auto px-6 py-6">
                {renderWorkspaceMainPanel()}
              </div>
            </main>
          </div>
        </div>
      )}

      {!shouldShowWorkspace && clinicConfig.banner && (
        <Alert variant="info" className="mb-0 rounded-0 text-center">
          {clinicConfig.banner}
        </Alert>
      )}

      {!shouldShowWorkspace && <Container className="py-4">
        {shouldShowSubscriptionScreen && (
          <Row className="justify-content-center">
            <Col xl={10}>
              <SubscriptionOnboarding
                t={t}
                onChooseTier={(tier) => {
                  const next = setPlanIntent(tier);
                  setSubscription(next);
                }}
                onStartTrial={(tier) => {
                  const next = startTrialForTier(tier);
                  setSubscription(next);
                  setShowSubscriptionOnboarding(false);
                  if (user && activePortal) {
                    window.history.replaceState({}, '', `/${activePortal}`);
                  } else {
                    window.history.replaceState({}, '', '/');
                  }
                }}
                onCancel={() => {
                  setShowSubscriptionOnboarding(false);
                  if (user && activePortal) {
                    window.history.replaceState({}, '', `/${activePortal}`);
                  } else {
                    window.history.replaceState({}, '', '/');
                  }
                }}
              />
            </Col>
          </Row>
        )}

        {shouldShowPricingScreen && (
          <Row className="justify-content-center">
            <Col xl={10}>
              <PricingPage
                t={t}
                planIntent={subscription?.planIntent || null}
                onChoosePlan={(tier) => {
                  const next = setPlanIntent(tier);
                  setSubscription(next);
                }}
                onStartTrial={(tier) => {
                  const next = startTrialForTier(tier);
                  setSubscription(next);
                }}
                onContinue={(tier) => {
                  const next = setPlanIntent(tier);
                  setSubscription(next);
                  closePricingTo('/checkout');
                }}
                onBack={() => closePricingTo(pricingReturnPath)}
              />
            </Col>
          </Row>
        )}

        {shouldShowCheckoutScreen && (
          <CheckoutPage
            user={user}
            planTier={subscription?.planIntent?.tier || subscription?.tier || 'premium'}
            onBack={() => closePricingTo('/pricing')}
            onConfirm={({ tier }) => {
              const next = purchaseTierDemo(tier);
              setSubscription(next);
              setShowCheckout(false);
              if (user && activePortal) {
                window.history.replaceState({}, '', `/${activePortal}`);
              } else {
                window.history.replaceState({}, '', '/');
              }
            }}
            t={t}
          />
        )}

        {shouldShowPicker && (
          <Row className="justify-content-center">
            <Col xl={10}>
              <ProductPicker
                onSelectProduct={handleProductSelect}
                isAdmin={user?.role === 'admin'}
                selectedProduct={desiredProduct}
                allowedWorkspaces={user ? allowedWorkspaces : null}
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
                          name="countryCode"
                          value={signupCountry}
                          onChange={(e) => {
                            const next = normalizeCountryCode(e.target.value);
                            setSignupCountry(next);
                            if (!isOtherCountry(next)) setSignupCountryOtherText('');
                          }}
                          required
                        >
                          {countryOptions.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      {isOtherCountry(signupCountry) && (
                        <Form.Group className="mb-3">
                          <Form.Label>{t('Specify country')}</Form.Label>
                          <Form.Control
                            name="countryOtherText"
                            value={signupCountryOtherText}
                            onChange={(e) => setSignupCountryOtherText(e.target.value)}
                            minLength={2}
                            maxLength={64}
                            placeholder={t('Enter your country')}
                            required
                          />
                        </Form.Group>
                      )}
                      <Form.Group className="mb-3">
                        <Form.Label>{t('Product (optional)')}</Form.Label>
                        <Form.Select name="product" defaultValue={desiredProduct || ''}>
                          <option value="">{t('Select later')}</option>
                          <option value="telehealth">Telehealth</option>
                          <option value="homecare">HomeCare</option>
                          <option value="myhealth">MyHealth</option>
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
                              setSignupCountryOtherText('');
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
                              setSignupCountryOtherText('');
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

      </Container>}

      {user && (
        <PatientAssignmentModule
          show={showAssignments}
          onHide={closeExclusiveModal}
          currentUser={{ id: user.id, role: user.role, name: user.email || 'User' }}
          onAssignmentUpdate={refreshStore}
          onViewDetails={(p) => {
            setRecordPatient(p);
            openExclusiveModal(() => setRecordModal(true));
          }}
          onViewRecord={(p) => {
            setRecordPatient(p);
            openExclusiveModal(() => setRecordModal(true));
          }}
          enableRecordQuickOpen
        />
      )}

      {user && (
        <PatientsModule
          show={showPatients}
          onHide={closeExclusiveModal}
          currentUser={user}
          patients={clinicData.patients}
          providers={clinicData.providers}
          homecareTasks={clinicData.homecareTasks || []}
          onSavePatient={(p) => upsertPatient(p)}
          onStartEncounter={(payload) => handleStartEncounterForPatient(payload)}
          onCreateHomecareTask={(payload) => handleCreateHomecareTask(payload)}
          onOpenChart={(p) => {
            setChartPatient(p);
            openExclusiveModal(() => setChartModal(true));
          }}
          onOpenRecords={(p) => {
            setRecordPatient(p);
            openExclusiveModal(() => setRecordModal(true));
          }}
          t={t}
        />
      )}

      <ChatModule
        show={showChat}
        onHide={closeExclusiveModal}
        currentUser={user}
        recipients={chatRecipients || clinicData.providers}
        contextType={chatContext.type || undefined}
        contextId={chatContext.id || undefined}
        threadKey={chatContext.threadKey || undefined}
      />

      <AppointmentModal
        show={showApptModal}
        onHide={closeExclusiveModal}
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
        onHide={closeExclusiveModal}
        patients={(activePortal || user?.role) === 'patient'
          ? [patientRecord].filter(Boolean)
          : (recordPatient ? [recordPatient] : clinicData.patients)}
        initialPatientId={(recordPatient || patientRecord)?.id || null}
        onUpdatePatient={upsertPatient}
        readOnly={(activePortal || user?.role) === 'patient'}
        showCareTeamModeLabel={showCareTeamModeLabel}
        pharmacies={pharmacies}
        t={t}
      />

      <PatientChart
        show={chartModal}
        onHide={closeExclusiveModal}
        patient={chartPatient || null}
        onUpdatePatient={upsertPatient}
        onOpenRecords={(p) => {
          setRecordPatient(p);
          openExclusiveModal(() => setRecordModal(true));
        }}
        t={t}
      />

      <AnalyticsDashboard
        show={showAnalytics}
        onHide={closeExclusiveModal}
        appointments={clinicData.appointments}
        labs={clinicData.labs}
        t={t}
      />

      <InsuranceModal
        show={showInsuranceModal}
        onHide={closeExclusiveModal}
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
          closeExclusiveModal();
          setQuickActionVariant('success');
          setQuickActionMessage('Insurance updated and saved to medical record.');
        }}
      />

      <RefillModal
        show={showRefillModal}
        onHide={closeExclusiveModal}
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
          openExclusiveModal(() => setShowReceipt(true));
          setQuickActionVariant('success');
          setQuickActionMessage(`Refill request submitted for ${med?.name || 'prescription'}.`);
        }}
      />

      <Modal show={showReceipt} onHide={closeExclusiveModal} centered size="lg">
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
          <Button variant="primary" onClick={closeExclusiveModal}>Return to Dashboard</Button>
        </Modal.Footer>
      </Modal>

      <LabResultModal show={!!labModal} onHide={closeExclusiveModal} lab={labModal} />

      <TelehealthVisitSummary
        show={showTelehealthSummary}
        onHide={closeExclusiveModal}
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

      {user && (
        <Modal show={showSettings} onHide={closeExclusiveModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>{user?.role === 'admin' ? 'Admin Tools' : t('Settings')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <div className="fw-semibold">{t('Profile')}</div>
              <div className="text-muted" style={{ fontSize: 13 }}>
                {t('Country of origin is used for reporting.')}
              </div>
            </div>

            <Form.Group className="mb-2">
              <Form.Label>{t('Country')}</Form.Label>
              <Form.Select
                value={profileCountryCode}
                onChange={(e) => {
                  const next = normalizeCountryCode(e.target.value);
                  setProfileCountryCode(next);
                  if (!isOtherCountry(next)) setProfileCountryOtherText('');
                }}
              >
                {countryOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {isOtherCountry(profileCountryCode) && (
              <Form.Group className="mb-2">
                <Form.Label>{t('Specify country')}</Form.Label>
                <Form.Control
                  value={profileCountryOtherText}
                  onChange={(e) => setProfileCountryOtherText(e.target.value)}
                  minLength={2}
                  maxLength={64}
                  placeholder={t('Enter your country')}
                />
              </Form.Group>
            )}

            <div className="d-grid mb-3">
              <Button
                variant="primary"
                disabled={profileSaving}
                onClick={async () => {
                  try {
                    setProfileSaving(true);
                    await saveCountryOfOrigin({
                      countryCode: profileCountryCode,
                      countryOtherText: profileCountryOtherText,
                      countrySource: 'profile',
                    });
                    closeExclusiveModal();
                  } catch (err) {
                    setAuthError(err.message || 'Failed to save profile');
                  } finally {
                    setProfileSaving(false);
                  }
                }}
              >
                {profileSaving ? t('Saving…') : t('Save')}
              </Button>
            </div>

            <hr />

            <div className="mb-2">
              <div className="fw-semibold">API</div>
              <div className="text-muted">{DISPLAY_API_BASE}</div>
            </div>

            <div className="d-grid gap-2">
              {user?.role === 'admin' && (
                <Button variant="outline-primary" onClick={() => { refreshStore(); closeExclusiveModal(); }}>
                  Refresh local data
                </Button>
              )}
              <Button variant="outline-secondary" onClick={() => { openExclusiveModal(() => setShowSubscriptionSettings(true)); }}>
                Subscription Settings
              </Button>
              <Button variant="link" className="text-start ps-0" onClick={() => { setActivePortal(null); closeExclusiveModal(); }}>
                Change portal
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      )}

      <SubscriptionSettingsModal
        show={showSubscriptionSettings}
        onHide={closeExclusiveModal}
        subscription={subscription}
        isAdmin={user?.role === 'admin'}
        billingStatus={billingStatus}
        billingActionError={billingActionError}
        onManageBilling={async () => {
          try {
            setBillingActionError('');
            if (!billingStatus?.configured || !billingStatus?.capabilities?.portal) {
              setBillingActionError(t('Billing not available yet.'));
              return;
            }
            const data = await fetchJson('/api/billing/portal');
            if (data?.url) {
              window.location.href = data.url;
              return;
            }
            setBillingActionError(t('Billing portal is unavailable.'));
          } catch (err) {
            setBillingActionError(err.message || t('Billing portal is unavailable.'));
          }
        }}
        onStartBillingUpgrade={async () => {
          try {
            setBillingActionError('');
            if (!billingStatus?.configured || !billingStatus?.capabilities?.checkout) {
              setBillingActionError(t('Billing not available yet.'));
              return;
            }
            const planId = (clinicData?.plans || []).find((p) => p?.active !== false)?.id || 'plan_plus';
            const base = window.location.origin;
            const data = await fetchJson('/api/billing/checkout-session', {
              method: 'POST',
              body: JSON.stringify({
                planId,
                successUrl: `${base}/?billing=success`,
                cancelUrl: `${base}/?billing=cancel`,
              }),
            });
            if (data?.url) {
              window.location.href = data.url;
              return;
            }
            setBillingActionError(t('Billing checkout is unavailable.'));
          } catch (err) {
            setBillingActionError(err.message || t('Billing checkout is unavailable.'));
          }
        }}
        onUpgradeToPro={() => {
          const next = upgradeToProDemo();
          setSubscription(next);
        }}
        onDowngradeToFree={() => {
          const next = downgradeToFree();
          setSubscription(next);
        }}
        onSetTier={(tier) => {
          const normalized = String(tier || '').trim().toLowerCase();
          const tVal = (normalized === 'gold' || normalized === 'premium' || normalized === 'basic' || normalized === 'free')
            ? normalized
            : (normalized === 'pro' ? 'premium' : 'free');
          updateSubscription({ tier: tVal, status: 'active', startedAt: new Date().toISOString(), trialEndsAt: null, expiresAt: null });
          setSubscription(getSubscription());
        }}
        t={t}
      />

      <ProFeatureGateModal
        show={proGate.show}
        onHide={closeExclusiveModal}
        subscription={subscription}
        featureKey={proGate.featureKey}
        onStartTrial={() => {
          const next = startProTrial();
          setSubscription(next);
          closeExclusiveModal();
          const action = pendingProActionRef.current;
          pendingProActionRef.current = null;
          action?.();
        }}
        onUpgrade={() => {
          const next = upgradeToProDemo();
          setSubscription(next);
          closeExclusiveModal();
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
