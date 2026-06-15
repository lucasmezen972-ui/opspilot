import { useSyncExternalStore } from 'react';

import {
  getDemoActivityLog,
  getDemoAudits,
  getDemoActions,
  getDemoAuditResponses,
  getDemoAuditTemplateItems,
  getDemoAuditTemplates,
  getDemoChannelMessages,
  getDemoChannels,
  getDemoProducts,
  getDemoSettings,
  getDemoTasks,
  getDemoTrainingChapters,
  getDemoTrainingQuizQuestions,
  getDemoTrainings,
  getDemoTrainingProgress,
  type DemoSettings,
} from './demoData';
import type {
  ActivityEvent,
  Audit,
  AuditResponse,
  AuditTemplate,
  AuditTemplateItem,
  Channel,
  ChannelMessage,
  CorrectiveAction,
  Product,
  Task,
  Training,
  TrainingCertificate,
  TrainingChapter,
  TrainingQuizQuestion,
  UserTrainingProgress,
} from './supabase';

/**
 * Store démo partagé entre tous les écrans (mode démo local uniquement).
 *
 * Avant, chaque instance de hook (useAudits, useCorrectiveActions…) gardait
 * sa propre copie useState des données démo : une action corrective créée
 * depuis l'écran Audits n'apparaissait ni dans l'écran Actions ni dans les
 * KPIs du dashboard. Ce store externe (useSyncExternalStore) est l'unique
 * source de vérité démo : toute mutation est visible partout immédiatement
 * et persiste pendant la session.
 */

export interface DemoState {
  audits: Audit[];
  auditTemplates: AuditTemplate[];
  auditTemplateItems: AuditTemplateItem[];
  auditResponses: AuditResponse[];
  actions: CorrectiveAction[];
  products: Product[];
  tasks: Task[];
  trainings: Training[];
  trainingChapters: TrainingChapter[];
  trainingQuizQuestions: TrainingQuizQuestion[];
  trainingProgress: UserTrainingProgress[];
  trainingCertificates: TrainingCertificate[];
  channels: Channel[];
  channelMessages: ChannelMessage[];
  activityLog: ActivityEvent[];
  settings: DemoSettings;
}

function seed(): DemoState {
  return {
    audits: getDemoAudits(),
    auditTemplates: getDemoAuditTemplates(),
    auditTemplateItems: getDemoAuditTemplateItems(),
    auditResponses: getDemoAuditResponses(),
    actions: getDemoActions(),
    products: getDemoProducts(),
    tasks: getDemoTasks(),
    trainings: getDemoTrainings(),
    trainingChapters: getDemoTrainingChapters(),
    trainingQuizQuestions: getDemoTrainingQuizQuestions(),
    trainingProgress: getDemoTrainingProgress(),
    trainingCertificates: [],
    channels: getDemoChannels(),
    channelMessages: getDemoChannelMessages(),
    activityLog: getDemoActivityLog(),
    settings: getDemoSettings(),
  };
}

let state: DemoState = seed();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeDemoStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDemoState(): DemoState {
  return state;
}

/** Mutation immutable d'une collection du store (notifie tous les abonnés). */
export function updateDemoCollection<K extends keyof DemoState>(
  key: K,
  updater: (current: DemoState[K]) => DemoState[K],
): void {
  state = { ...state, [key]: updater(state[key]) };
  emit();
}

/**
 * Réinitialise les données démo. À appeler uniquement lors d'une connexion
 * démo explicite (clic sur le bouton) — jamais au reload/deep-link, sinon
 * les modifications de la session démo seraient perdues (B3).
 */
export function resetDemoStore(): void {
  state = seed();
  emit();
}

/** Abonnement React à une collection du store démo. */
export function useDemoCollection<K extends keyof DemoState>(
  key: K,
): DemoState[K] {
  return useSyncExternalStore(
    subscribeDemoStore,
    () => getDemoState()[key],
    () => getDemoState()[key],
  );
}
