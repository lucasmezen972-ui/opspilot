import * as Crypto from 'expo-crypto';
import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { TrainingVideoFilePicker } from './TrainingVideoFilePicker';
import { isTrainingMediaUrl } from './video';
import { demoId } from '../../lib/demoData';
import { updateDemoCollection } from '../../lib/demoStore';
import { supabase, type Training } from '../../lib/supabase';
import { AppButton } from '../../shared/components/AppButton';
import { AppModal } from '../../shared/components/AppModal';
import { colors } from '../../shared/styles/tokens';
import { mapSupabaseError } from '../../utils/error';

function Field({
  label,
  value,
  set,
  multiline = false,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={{ color: colors.textStrong }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={set}
        multiline={multiline}
        style={{
          padding: 12,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          color: colors.textStrong,
          minHeight: multiline ? 80 : 44,
        }}
      />
    </View>
  );
}
export function TrainingVideoEditor({
  visible,
  courses,
  organizationId,
  isLocalDemo,
  onClose,
  onSaved,
}: {
  visible: boolean;
  courses: Training[];
  organizationId: string;
  isLocalDemo: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { height } = useWindowDimensions();
  const [courseId, setCourseId] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [captions, setCaptions] = useState('');
  const [minutes, setMinutes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [answerA, setAnswerA] = useState('');
  const [answerB, setAnswerB] = useState('');
  const [correct, setCorrect] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const guard = useRef(false);
  const operation = useRef<{
    courseChoice: string;
    file: File | null;
    courseId: string;
    chapterId: string;
    path: string | null;
    uploaded: boolean;
    dispatched: boolean;
  } | null>(null);
  useEffect(() => {
    if (visible) {
      operation.current = null;
      setCourseId('');
      setCourseTitle('');
      setTitle('');
      setBody('');
      setUrl('');
      setCaptions('');
      setMinutes('');
      setFile(null);
      setQuestion('');
      setAnswerA('');
      setAnswerB('');
      setCorrect(0);
      setError('');
    }
  }, [visible]);
  const save = async () => {
    if (guard.current) return;
    const duration = Math.round(Number(minutes.replace(',', '.')) * 60);
    if (
      !title.trim() ||
      title.length > 200 ||
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 7200 ||
      (!file && !isTrainingMediaUrl(url)) ||
      (captions && !isTrainingMediaUrl(captions, 'vtt'))
    ) {
      setError(
        'Indiquez un titre, une durée valide et un fichier ou lien MP4. Les sous-titres doivent être au format VTT.',
      );
      return;
    }
    if (
      !courseId &&
      (!courseTitle.trim() ||
        !question.trim() ||
        !answerA.trim() ||
        !answerB.trim() ||
        answerA.trim() === answerB.trim())
    ) {
      setError(
        'Renseignez le titre de la formation, sa question finale et deux réponses différentes.',
      );
      return;
    }
    if (isLocalDemo && file) {
      setError(
        'Les fichiers privés s’importent dans un compte connecté. Pour essayer la démo, utilisez un lien MP4.',
      );
      return;
    }
    guard.current = true;
    setBusy(true);
    setError('');
    if (
      !operation.current ||
      operation.current.courseChoice !== courseId ||
      operation.current.file !== file
    ) {
      const target =
        courseId ||
        (isLocalDemo ? demoId('video-course') : Crypto.randomUUID());
      const chapter = isLocalDemo
        ? demoId('video-chapter')
        : Crypto.randomUUID();
      operation.current = {
        courseChoice: courseId,
        file,
        courseId: target,
        chapterId: chapter,
        path: file
          ? `${organizationId}/${target}/${chapter}/${Crypto.randomUUID()}.mp4`
          : null,
        uploaded: false,
        dispatched: false,
      };
    }
    const attempt = operation.current;
    const targetCourse = attempt.courseId,
      chapterId = attempt.chapterId,
      path = attempt.path;
    let saved = false;
    try {
      if (file && path && !attempt.uploaded) {
        const { error: uploadError } = await supabase.storage
          .from('training-videos')
          .upload(path, file, { contentType: 'video/mp4', upsert: false });
        if (uploadError) throw uploadError;
        attempt.uploaded = true;
      }
      if (isLocalDemo) {
        const now = new Date().toISOString();
        if (!courseId) {
          updateDemoCollection('trainings', (xs) => [
            ...xs,
            {
              id: targetCourse,
              organization_id: organizationId,
              title: courseTitle.trim(),
              content: body,
              category: 'Formation vidéo',
              difficulty: 'beginner',
              duration_minutes: Math.ceil(duration / 60),
              xp_reward: 20,
              is_active: true,
              min_score: 70,
              created_at: now,
              updated_at: now,
            },
          ]);
          updateDemoCollection('trainingQuizQuestions', (xs) => [
            ...xs,
            {
              id: demoId('video-question'),
              training_id: targetCourse,
              question: question.trim(),
              options: [answerA.trim(), answerB.trim()],
              correct_index: correct,
              sort_order: 0,
            },
          ]);
        }
        updateDemoCollection('trainingChapters', (xs) => [
          ...xs,
          {
            id: chapterId,
            training_id: targetCourse,
            title: title.trim(),
            body,
            sort_order: xs.filter((x) => x.training_id === targetCourse).length,
            video_url: url,
            video_duration_seconds: duration,
            captions_url: captions || null,
          },
        ]);
      } else {
        attempt.dispatched = true;
        const { error: saveError } = await supabase.rpc(
          'save_training_video_lesson',
          {
            p_course_id: targetCourse,
            p_chapter_id: chapterId,
            p_new_course: !courseId,
            p_payload: {
              course_title: courseTitle.trim(),
              title: title.trim(),
              body,
              video_url: path ? null : url,
              video_storage_path: path,
              video_duration_seconds: duration,
              captions_url: captions || null,
              question: question.trim(),
              options: [answerA.trim(), answerB.trim()],
              correct_index: correct,
            },
          },
        );
        if (saveError) throw saveError;
      }
      saved = true;
      await onSaved();
      onClose();
    } catch (issue) {
      setError(
        saved
          ? 'La vidéo est publiée. Fermez cette fenêtre puis actualisez le catalogue.'
          : mapSupabaseError('La vidéo n’a pas pu être publiée', issue),
      );
    } finally {
      try {
        // A lost RPC response may have committed. Keep its private object and
        // stable identifiers for the next attempt; never delete it speculatively.
        if (path && !saved && !attempt.dispatched)
          await supabase.storage.from('training-videos').remove([path]);
      } finally {
        guard.current = false;
        setBusy(false);
      }
    }
  };
  return (
    <AppModal
      visible={visible}
      onClose={() => {
        if (!busy) onClose();
      }}
      title="Ajouter une formation vidéo"
      testID="training-video-editor"
      maxWidth={640}
    >
      <ScrollView
        style={{ maxHeight: Math.max(120, height - 200) }}
        contentContainerStyle={{ gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text>Formation de destination</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[{ id: '', title: 'Nouvelle formation' }, ...courses].map((c) => (
              <TouchableOpacity
                key={c.id}
                accessibilityRole="button"
                accessibilityState={{ selected: courseId === c.id }}
                onPress={() => setCourseId(c.id)}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor:
                    courseId === c.id ? colors.primarySoft : colors.background,
                }}
              >
                <Text style={{ color: colors.textStrong }}>{c.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {!courseId && (
          <Field
            label="Titre de la formation"
            value={courseTitle}
            set={setCourseTitle}
          />
        )}
        <Field label="Titre du chapitre vidéo" value={title} set={setTitle} />
        <Field
          label="Résumé et transcription"
          value={body}
          set={setBody}
          multiline
        />
        <TrainingVideoFilePicker
          onChoose={(chosen, duration) => {
            setFile(chosen);
            setUrl('');
            setMinutes(String(duration / 60));
            setError('');
          }}
          onError={setError}
        />
        {file && <Text>{file.name}</Text>}
        <Field
          label="Ou lien direct MP4 (https)"
          value={url}
          set={(value) => {
            setUrl(value);
            setFile(null);
          }}
        />
        <Field
          label="Durée de la vidéo en minutes"
          value={minutes}
          set={setMinutes}
        />
        <Field
          label="Sous-titres VTT — lien facultatif"
          value={captions}
          set={setCaptions}
        />
        {!courseId && (
          <>
            <Text>Question de validation</Text>
            <Field label="Question finale" value={question} set={setQuestion} />
            <Field label="Réponse A" value={answerA} set={setAnswerA} />
            <Field label="Réponse B" value={answerB} set={setAnswerB} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[0, 1].map((i) => (
                <TouchableOpacity
                  key={i}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: correct === i }}
                  onPress={() => setCorrect(i)}
                  style={{
                    padding: 12,
                    backgroundColor:
                      correct === i ? colors.primarySoft : colors.background,
                  }}
                >
                  <Text>Bonne réponse : {i === 0 ? 'A' : 'B'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        {error && (
          <Text
            accessibilityRole="alert"
            style={{ color: colors.dangerStrong }}
          >
            {error}
          </Text>
        )}
        <AppButton
          label={busy ? 'Publication en cours…' : 'Publier le chapitre vidéo'}
          onPress={save}
          loading={busy}
          testID="training-video-save"
        />
      </ScrollView>
    </AppModal>
  );
}
