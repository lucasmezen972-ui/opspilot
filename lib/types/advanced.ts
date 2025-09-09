// Types avancés pour le système LMS et audit ultra-poussé

export interface LearningPath {
  id: string
  organization_id: string
  name: string
  description: string
  target_roles: string[]
  estimated_duration_hours: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  prerequisites: string[]
  certifications_awarded: string[]
  auto_enroll_conditions: Record<string, any>
  is_mandatory: boolean
  completion_deadline_days?: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface LearningPathStep {
  id: string
  path_id: string
  training_id: string
  step_order: number
  is_mandatory: boolean
  unlock_conditions: Record<string, any>
  estimated_duration_minutes: number
}

export interface AdvancedTraining {
  id: string
  organization_id: string
  title: string
  description: string
  content_type: 'scorm' | 'video' | 'interactive' | 'document' | 'quiz' | 'simulation'
  content_data: Record<string, any>
  learning_objectives: string[]
  competencies: string[]
  assessment_required: boolean
  passing_score: number
  max_attempts: number
  validity_months?: number
  tags: string[]
  created_at: string
  updated_at: string
}

export interface UserCompetency {
  id: string
  user_id: string
  competency_name: string
  current_level: number
  target_level: number
  last_assessed: string
  evidence: string[]
  certified_until?: string
}

export interface Certificate {
  id: string
  user_id: string
  training_id?: string
  path_id?: string
  certificate_type: 'completion' | 'competency' | 'compliance'
  issued_date: string
  expires_date?: string
  verification_code: string
  pdf_url: string
}

export interface RiskAssessment {
  id: string
  audit_id: string
  risk_category: string
  probability: number // 1-5
  impact: number // 1-5
  risk_score: number // probability * impact
  mitigation_actions: string[]
  risk_owner: string
  review_date: string
}

export interface CAPA {
  id: string
  organization_id: string
  audit_id: string
  finding_id: string
  type: 'corrective' | 'preventive'
  description: string
  root_cause_analysis: string
  action_plan: string
  assigned_to: string
  due_date: string
  status: 'open' | 'in_progress' | 'pending_verification' | 'closed'
  effectiveness_verified: boolean
  verification_date?: string
  verified_by?: string
  created_at: string
  updated_at: string
}

export interface AuditFinding {
  id: string
  audit_id: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  evidence: string[]
  regulation_reference?: string
  immediate_action_taken: string
  capa_required: boolean
  created_at: string
}

export interface SmartRecommendation {
  id: string
  user_id: string
  type: 'training' | 'competency' | 'career_path'
  title: string
  description: string
  confidence_score: number
  data: Record<string, any>
  status: 'pending' | 'accepted' | 'dismissed'
  created_at: string
}

export interface AdvancedAnalytics {
  organization_id: string
  period_start: string
  period_end: string
  training_metrics: {
    completion_rate: number
    avg_score: number
    time_to_complete: number
    engagement_score: number
  }
  audit_metrics: {
    compliance_rate: number
    avg_findings_per_audit: number
    capa_closure_rate: number
    risk_trend: 'improving' | 'stable' | 'declining'
  }
  competency_gaps: Array<{
    competency: string
    gap_percentage: number
    affected_users: number
  }>
  predictive_insights: Array<{
    type: string
    prediction: string
    confidence: number
    recommended_actions: string[]
  }>
}