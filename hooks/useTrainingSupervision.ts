import { useEffect, useMemo, useState } from 'react';

import { useAuth } from './useAuth';
import {
  deriveMatricule,
  type MemberTrainingStatus,
} from '../features/training/trainingModel';
import {
  getDemoOrgTrainingProgress,
  getDemoTeamMembers,
} from '../lib/demoData';
import { useDemoCollection } from '../lib/demoStore';
import {
  supabase,
  type Training,
  type UserTrainingProgress,
} from '../lib/supabase';

interface RemoteMember {
  id: string;
  full_name: string;
  role: string;
}

function buildEntries(
  members: { id: string; full_name: string; role: string }[],
  courses: Training[],
  orgProgress: UserTrainingProgress[],
): MemberTrainingStatus[] {
  return courses.flatMap((course) =>
    members.map((member) => {
      const prog = orgProgress.find(
        (p) => p.user_id === member.id && p.training_id === course.id,
      );
      return {
        memberId: member.id,
        memberName: member.full_name,
        memberRole: member.role,
        matricule: deriveMatricule(member.id),
        trainingId: course.id,
        trainingTitle: course.title,
        status: prog?.status ?? 'not_started',
        score: prog?.score ?? null,
        completedAt: prog?.completed_at ?? null,
        hasCertificate: prog?.status === 'completed',
      };
    }),
  );
}

export function useTrainingSupervision() {
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;

  const demoCourses = useDemoCollection('trainings');
  const [remoteMembers, setRemoteMembers] = useState<RemoteMember[]>([]);
  const [remoteOrgProgress, setRemoteOrgProgress] = useState<
    UserTrainingProgress[]
  >([]);
  const [remoteCourses, setRemoteCourses] = useState<Training[]>([]);
  const [loading, setLoading] = useState(!isLocalDemo);

  // Les sources démo sont des fonctions pures : on les mémoïse pour stabiliser
  // l'identité des tableaux entre les rendus.
  const members = useMemo(
    () => (isLocalDemo ? getDemoTeamMembers() : remoteMembers),
    [isLocalDemo, remoteMembers],
  );
  const orgProgress = useMemo(
    () => (isLocalDemo ? getDemoOrgTrainingProgress() : remoteOrgProgress),
    [isLocalDemo, remoteOrgProgress],
  );
  const courses = isLocalDemo ? demoCourses : remoteCourses;

  useEffect(() => {
    if (isLocalDemo) return;
    if (!profile?.organization_id) return;
    void fetchOrgData();
  }, [profile?.organization_id, isLocalDemo]);

  const fetchOrgData = async () => {
    if (!profile?.organization_id) return;
    setLoading(true);
    try {
      const [membersResult, coursesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('organization_id', profile.organization_id),
        supabase
          .from('trainings')
          .select('*')
          .eq('organization_id', profile.organization_id),
      ]);

      const fetchedMembers = (membersResult.data ?? []) as RemoteMember[];
      const fetchedCourses = (coursesResult.data ?? []) as Training[];
      setRemoteMembers(fetchedMembers);
      setRemoteCourses(fetchedCourses);

      const courseIds = fetchedCourses.map((c) => c.id);
      if (courseIds.length > 0) {
        const { data: progressData } = await supabase
          .from('user_training_progress')
          .select('*')
          .in('training_id', courseIds);
        setRemoteOrgProgress((progressData ?? []) as UserTrainingProgress[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const entries = useMemo(
    () => buildEntries(members, courses, orgProgress),
    [members, courses, orgProgress],
  );

  const sendReminder = (memberId: string, trainingId: string) => {
    const member = members.find((m) => m.id === memberId);
    const course = courses.find((c) => c.id === trainingId);
    return {
      memberName: member?.full_name ?? '',
      trainingTitle: course?.title ?? '',
    };
  };

  return {
    loading,
    courses,
    entries,
    sendReminder,
  };
}
