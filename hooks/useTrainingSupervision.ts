import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from './useAuth';
import {
  deriveMatricule,
  type MemberTrainingStatus,
} from '../features/training/trainingModel';
import {
  getDemoOrgTrainingProgress,
  getDemoTeamMembers,
  getDemoTrainingCertificates,
} from '../lib/demoData';
import { useDemoCollection } from '../lib/demoStore';
import {
  supabase,
  type Training,
  type UserTrainingProgress,
} from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

interface RemoteMember {
  id: string;
  full_name: string;
  role: string;
}

function buildEntries(
  members: { id: string; full_name: string; role: string }[],
  courses: Training[],
  orgProgress: UserTrainingProgress[],
  certificates: {
    user_id: string;
    training_id: string;
    employee_id?: string | null;
  }[],
  localDemo: boolean,
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
        matricule:
          certificates.find(
            (c) => c.user_id === member.id && c.training_id === course.id,
          )?.employee_id ?? (localDemo ? deriveMatricule(member.id) : '—'),
        trainingId: course.id,
        trainingTitle: course.title,
        status:
          !localDemo && prog?.status === 'completed' && !prog.server_verified_at
            ? 'needs_review'
            : (prog?.status ?? 'not_started'),
        score:
          localDemo || prog?.server_verified_at ? (prog?.score ?? null) : null,
        completedAt:
          localDemo || prog?.server_verified_at
            ? (prog?.completed_at ?? null)
            : null,
        hasCertificate:
          certificates.some(
            (c) => c.user_id === member.id && c.training_id === course.id,
          ) &&
          (localDemo || Boolean(prog?.server_verified_at)),
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
  const [remoteCertificates, setRemoteCertificates] = useState<
    { user_id: string; training_id: string; employee_id?: string | null }[]
  >([]);
  const [loading, setLoading] = useState(!isLocalDemo);
  const [error, setError] = useState<string | null>(null);

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

  const fetchOrgData = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }
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

      if (membersResult.error) {
        setError(
          mapSupabaseError('Erreur chargement membres', membersResult.error),
        );
        return;
      }
      if (coursesResult.error) {
        setError(
          mapSupabaseError('Erreur chargement formations', coursesResult.error),
        );
        return;
      }

      const fetchedMembers = (membersResult.data ?? []) as RemoteMember[];
      const fetchedCourses = (coursesResult.data ?? []) as Training[];
      setRemoteMembers(fetchedMembers);
      setRemoteCourses(fetchedCourses);

      const courseIds = fetchedCourses.map((c) => c.id);
      if (courseIds.length > 0) {
        const [
          { data: progressData, error: progressError },
          certificateResult,
        ] = await Promise.all([
          supabase
            .from('user_training_progress')
            .select('*')
            .in('training_id', courseIds),
          supabase
            .from('training_certificates')
            .select('user_id,training_id,employee_id')
            .eq('organization_id', profile.organization_id)
            .in('training_id', courseIds)
            .order('issued_at', { ascending: false }),
        ]);
        if (progressError) {
          setError(
            mapSupabaseError('Erreur chargement progression', progressError),
          );
          return;
        }
        setRemoteOrgProgress((progressData ?? []) as UserTrainingProgress[]);
        if (certificateResult.error) {
          setRemoteCertificates([]);
          setError('Les attestations ne peuvent pas être vérifiées.');
        } else setRemoteCertificates(certificateResult.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    if (isLocalDemo) return;
    if (!profile?.organization_id) return;
    fetchOrgData().catch((err) => {
      setError(mapSupabaseError('Erreur supervision formations', err));
      setLoading(false);
    });
  }, [profile?.organization_id, isLocalDemo, fetchOrgData]);

  const entries = useMemo(
    () =>
      buildEntries(
        members,
        courses,
        orgProgress,
        isLocalDemo ? getDemoTrainingCertificates() : remoteCertificates,
        isLocalDemo,
      ),
    [members, courses, orgProgress, remoteCertificates, isLocalDemo],
  );

  const sendReminder = async (memberId: string, trainingId: string) => {
    const member = members.find((m) => m.id === memberId);
    const course = courses.find((c) => c.id === trainingId);
    const memberName = member?.full_name ?? '';
    const trainingTitle = course?.title ?? '';

    if (!isLocalDemo && profile?.organization_id) {
      try {
        await supabase.from('notifications').insert({
          user_id: memberId,
          organization_id: profile.organization_id,
          type: 'training_reminder',
          title: 'Rappel formation',
          body: `Vous n'avez pas encore terminé la formation « ${trainingTitle} ».`,
          is_read: false,
        });
      } catch {
        // Best-effort: the UI alert still informs the manager.
      }
    }

    return { memberName, trainingTitle };
  };

  return {
    loading,
    error,
    courses,
    entries,
    sendReminder,
  };
}
