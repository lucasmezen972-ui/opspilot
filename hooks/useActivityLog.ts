import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './useAuth';
import { DEMO_ORG_ID, DEMO_USER_ID, demoId } from '../lib/demoData';
import { updateDemoCollection, useDemoCollection } from '../lib/demoStore';
import {
  supabase,
  type ActivityEvent,
  type ActivityEventType,
} from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export type ActivityLogInput = {
  action: ActivityEventType;
  entityType: string;
  entityId?: string | null;
  label: string;
};

/**
 * Journal d'activité de gouvernance. Enregistre les actions sensibles (clôture
 * d'audit, résolution d'action, certification, export) et les expose en lecture.
 * Mode démo : store partagé. Mode connecté : table activity_log (RLS par org).
 */
export function useActivityLog() {
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;

  const demoEvents = useDemoCollection('activityLog');
  const [remoteEvents, setRemoteEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(!isLocalDemo);
  const [error, setError] = useState<string | null>(null);
  const events = isLocalDemo ? demoEvents : remoteEvents;

  useEffect(() => {
    if (isLocalDemo || !profile?.organization_id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('activity_log')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (fetchErr) {
        setError(
          mapSupabaseError("Erreur chargement journal d'activité", fetchErr),
        );
        setLoading(false);
        return;
      }
      setRemoteEvents(
        ((data ?? []) as Record<string, any>[]).map((r) => ({
          id: r.id,
          organization_id: r.organization_id,
          actor_id: r.actor_id,
          actor_name: r.metadata?.actor_name ?? null,
          action: r.action,
          entity_type: r.entity_type,
          entity_id: r.entity_id,
          label: r.metadata?.label ?? r.action,
          created_at: r.created_at,
        })),
      );
      setLoading(false);
    })().catch((err) => {
      if (!cancelled) {
        setError(mapSupabaseError("Erreur journal d'activité", err));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isLocalDemo, profile?.organization_id]);

  const logEvent = useCallback(
    (input: ActivityLogInput) => {
      const now = new Date().toISOString();

      if (isLocalDemo) {
        const event: ActivityEvent = {
          id: demoId('activity'),
          organization_id: DEMO_ORG_ID,
          actor_id: DEMO_USER_ID,
          actor_name: profile?.full_name ?? 'Vous',
          action: input.action,
          entity_type: input.entityType,
          entity_id: input.entityId ?? null,
          label: input.label,
          created_at: now,
        };
        updateDemoCollection('activityLog', (prev) => [event, ...prev]);
        return;
      }

      if (!profile?.organization_id) return;
      const optimistic: ActivityEvent = {
        id: `tmp-${now}-${Math.random().toString(36).slice(2, 8)}`,
        organization_id: profile.organization_id,
        actor_id: profile.id,
        actor_name: profile.full_name ?? null,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        label: input.label,
        created_at: now,
      };
      setRemoteEvents((prev) => [optimistic, ...prev]);
      supabase
        .from('activity_log')
        .insert({
          organization_id: profile.organization_id,
          actor_id: profile.id,
          action: input.action,
          entity_type: input.entityType,
          entity_id: input.entityId ?? null,
          metadata: { label: input.label, actor_name: profile.full_name },
        })
        .then(
          ({ error: insertErr }) => {
            if (insertErr) {
              setRemoteEvents((prev) =>
                prev.filter((event) => event.id !== optimistic.id),
              );
              setError(
                mapSupabaseError("Erreur enregistrement d'activité", insertErr),
              );
            }
          },
          (err) => {
            setRemoteEvents((prev) =>
              prev.filter((event) => event.id !== optimistic.id),
            );
            setError(mapSupabaseError("Erreur enregistrement d'activité", err));
          },
        );
    },
    [isLocalDemo, profile],
  );

  return { events, loading, error, logEvent };
}
