import { useState } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  formatVideoDuration,
  programRequirementLabel,
} from './internalPrograms';
import type { TrainingProgramMetadata } from '../../lib/supabase';
import { colors, radius } from '../../shared/styles/tokens';

export function TrainingProgramOverview({
  program,
  expanded = false,
}: {
  program: TrainingProgramMetadata;
  expanded?: boolean;
}) {
  const [open, setOpen] = useState(expanded);
  const [linkError, setLinkError] = useState('');
  return (
    <View style={styles.card} testID="training-program-overview">
      <Text style={styles.badge}>
        {programRequirementLabel(program.requirement)}
      </Text>
      <Text style={styles.text}>{program.applicability}</Text>
      <Text style={styles.duration}>
        Vidéo {formatVideoDuration(program.video_seconds)} · lecture env.{' '}
        {program.reading_minutes} min · activité env. {program.activity_minutes}{' '}
        min
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={styles.toggle}
      >
        <Text style={styles.toggleText}>
          {open
            ? 'Réduire le programme'
            : 'Objectifs, positionnement et pratique au poste'}
        </Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.details}>
          <Text style={styles.heading}>Pour qui et avec quels prérequis ?</Text>
          <Text style={styles.text}>{program.audience}</Text>
          <Text style={styles.text}>{program.prerequisites}</Text>
          <Text style={styles.heading}>Ce que vous saurez faire</Text>
          {program.objectives.map((objective) => (
            <Text style={styles.text} key={objective}>
              • {objective}
            </Text>
          ))}
          <Text style={styles.heading}>
            Avant de commencer, faites le point
          </Text>
          <Text style={styles.text}>
            Pour chaque question : à découvrir, à consolider ou je sais faire.
            Échangez avec le responsable sur les points à travailler ; ce
            repérage ne donne pas de score.
          </Text>
          {program.positioning.map((question) => (
            <Text style={styles.text} key={question}>
              • {question}
            </Text>
          ))}
          <Text style={styles.heading}>Mise en pratique à organiser</Text>
          <Text style={styles.text}>{program.onsite}</Text>
          <Text style={styles.heading}>Accompagnement et évaluation</Text>
          <Text style={styles.text}>
            Demandez au responsable du site une explication ou une adaptation si
            nécessaire. Le texte et les sous-titres complètent la narration
            synthétique. Le quiz exige 80 % et la réussite des questions
            critiques ; l’attestation reste interne. Les durées de lecture et
            d’activité sont indicatives, sans mesure de présence.
          </Text>
          {program.sources.length > 0 && (
            <Text style={styles.heading}>
              Sources du programme · version {program.version}
            </Text>
          )}
          {program.sources.map((source) => (
            <TouchableOpacity
              key={source.url}
              accessibilityRole="link"
              accessibilityLabel={source.label}
              style={styles.source}
              onPress={() => {
                setLinkError('');
                Linking.openURL(source.url).catch(() =>
                  setLinkError('La source n’a pas pu être ouverte. Réessayez.'),
                );
              }}
            >
              <Text style={styles.toggleText}>{source.label}</Text>
            </TouchableOpacity>
          ))}
          {linkError && (
            <Text accessibilityRole="alert" style={styles.text}>
              {linkError}
            </Text>
          )}
          <Text style={styles.credit}>
            Voix synthétique Piper / SIWIS · données vocales CC BY 4.0. Les
            exemples du cours sont fictifs.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  badge: { fontSize: 12, fontWeight: '700', color: colors.primaryInk },
  text: { fontSize: 14, lineHeight: 22, color: colors.text },
  duration: { fontSize: 13, lineHeight: 21, color: colors.text },
  toggle: { minHeight: 44, justifyContent: 'center' },
  toggleText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  details: { gap: 10 },
  heading: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textStrong,
    marginTop: 6,
  },
  source: { minHeight: 44, justifyContent: 'center', paddingVertical: 8 },
  credit: {
    fontSize: 12,
    lineHeight: 19,
    color: colors.textMuted,
    marginTop: 8,
  },
});
