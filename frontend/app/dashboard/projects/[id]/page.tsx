"use client"

import { useEffect, useState, Fragment } from 'react';
import { t } from '@/lib/i18n';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import Link from 'next/link';
import { Tab } from '@headlessui/react';
import {
  Edit,
  Users,
  Calendar,
  Folder,
  BadgeInfo,
  UserCircle,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  CalendarCheck,
} from 'lucide-react';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const projectId = params.id;
  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [plannings, setPlannings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    fetchProject();
    fetchPlannings();
  }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setProject(data.project);
      setMembers(data.members || []);
    }
    setLoading(false);
  };

  const fetchPlannings = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/poker-planning?projectId=${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setPlannings(data.sessions || []);
    }
  };

  if (!user) return null;
  if (loading) return <DashboardLayout><div>{t('loading', settings.language)}</div></DashboardLayout>;
  if (!project) return <DashboardLayout><div>{t('projectNotFound', settings.language)}</div></DashboardLayout>;

  const otherType = project.type === 'other' ? project.custom_type : null;
  const projectType = otherType ? otherType : t(`projectTypes.${project.type}`, settings.language);
  const statusIcons: any = {
    planning: Clock,
    active: CheckCircle,
    onHold: Pause,
    completed: CheckCircle,
    cancelled: XCircle
  };
  const StatusIcon = statusIcons[project.status] || BadgeInfo;

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Folder className="inline h-6 w-6 text-primary-600" />
            {project.name}
            <button onClick={() => setShowEditModal(true)} className="ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title={t('editProject', settings.language)}>
              <Edit className="h-5 w-5 text-blue-600" />
            </button>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
            <BadgeInfo className="h-4 w-4 text-gray-400" /> {project.description}
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="badge flex items-center gap-1"><Folder className="h-4 w-4" /> {t('projectType', settings.language)}: {projectType}</span>
            <span className="badge flex items-center gap-1"><StatusIcon className="h-4 w-4" /> {t('projectStatus', settings.language)}: {t(`projectStatuses.${project.status}`, settings.language)}</span>
            <span className="badge flex items-center gap-1"><Calendar className="h-4 w-4" /> {t('startDate', settings.language)}: {project.start_date}</span>
            <span className="badge flex items-center gap-1"><CalendarCheck className="h-4 w-4" /> {t('endDate', settings.language)}: {project.end_date || t('on_going', settings.language)}</span>
          </div>
        </div>
      </div>

      <Tab.Group>
        <Tab.List className="flex gap-2 border-b mb-6">
          <Tab as={Fragment}>{({ selected }: { selected: boolean }) => <button className={selected ? 'tab tab-active' : 'tab'}>{t('teamMembers', settings.language)}</button>}</Tab>
          <Tab as={Fragment}>{({ selected }: { selected: boolean }) => <button className={selected ? 'tab tab-active' : 'tab'}>{t('planningSessions', settings.language)}</button>}</Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="h-5 w-5" />{t('teamMembers', settings.language)}</h2>
                <Link href={`/dashboard/projects/${projectId}/add-member`} className="btn-primary btn-sm">{t('addProjectMember', settings.language)}</Link>
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {members.map((m) => (
                  <li key={m.user_id} className="flex items-center gap-3 py-2">
                    {m.profile_picture ? (
                      <img src={m.profile_picture} alt={m.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold">
                        {m.name ? m.name[0] : <UserCircle className="h-6 w-6" />}
                      </span>
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">{m.name}</span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{t(`participantRole_${m.role}`, settings.language)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Calendar className="h-5 w-5" />{t('planningSessions', settings.language)}</h2>
                <Link href={`/dashboard/sessions/create?projectId=${projectId}`} className="btn-primary btn-sm">{t('addPlanningSession', settings.language)}</Link>
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {plannings.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2">
                    <Calendar className="h-4 w-4 text-primary-600" />
                    <span className="font-medium text-gray-900 dark:text-white">{p.name || t('session', settings.language)}</span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{p.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Edit Project Modal (simplified placeholder) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2"><Edit className="h-5 w-5" />{t('editProject', settings.language)}</h3>
            {/* TODO: Add edit form here */}
            <button onClick={() => setShowEditModal(false)} className="btn-outline btn-md mt-4 w-full">{t('close', settings.language)}</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 