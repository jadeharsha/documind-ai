export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  profile?: {
    bio: string;
    avatar_url: string;
    organization: string;
    job_title: string;
  };
  settings?: {
    theme: string;
    preferred_llm_provider: string;
    preferred_model_name: string;
    temperature: number;
    max_tokens_per_response: number;
    citation_style: string;
    email_notifications: boolean;
  };
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_default: boolean;
  member_count: number;
  document_count: number;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  workspace: string;
  title: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_extension: string;
  status: 'PENDING' | 'PROCESSING' | 'INDEXED' | 'FAILED';
  error_message: string;
  page_count: number;
  word_count: number;
  chunk_count: number;
  processing_time_ms: number;
  collection?: string | null;
  collection_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  source_index: number;
  document_id: string;
  document_title: string;
  page_number: number;
  passage_excerpt: string;
  score: number;
}

export interface Message {
  id: string;
  conversation: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  confidence_score: number;
  citations: Citation[];
  created_at: string;
}

export interface Conversation {
  id: string;
  workspace: string;
  title: string;
  selected_documents?: Document[];
  last_message?: Message;
  created_at: string;
  updated_at: string;
}

export interface AgentExecutionStep {
  id: string;
  step_number: number;
  name: string;
  description: string;
  tool_name: string;
  tool_arguments: Record<string, any>;
  tool_output: Record<string, any>;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  execution_time_ms: number;
  created_at: string;
}

export interface AgentTask {
  id: string;
  workspace: string;
  task_description: string;
  intent: string;
  selected_documents: Document[];
  status: 'PENDING' | 'PLANNING' | 'EXECUTING' | 'WAITING_APPROVAL' | 'VERIFYING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  execution_plan: Array<{ name: string; description: string; tool_name: string }>;
  current_step_index: number;
  requires_approval: boolean;
  approval_status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  approval_reason: string;
  final_report?: string;
  findings?: string[];
  evidence?: any[];
  citations?: any[];
  verification_summary?: Record<string, any>;
  total_tokens_used: number;
  execution_time_ms: number;
  error_message: string;
  step_count: number;
  steps?: AgentExecutionStep[];
  created_at: string;
  updated_at: string;
}

export interface DocumentSummary {
  id: string;
  document: string;
  document_title: string;
  summary_type: string;
  content: string;
  key_findings: string[];
  source_pages: number[];
  created_at: string;
}

export interface DocumentComparison {
  id: string;
  workspace: string;
  title: string;
  compared_documents: Document[];
  similarities: string[];
  differences: string[];
  contradictions: string[];
  missing_information: string[];
  narrative_report: string;
  created_at: string;
}

export interface ResearchAnalysis {
  id: string;
  document: string;
  document_title: string;
  title: string;
  objectives: string;
  methodology: string;
  datasets: string[];
  results: string;
  limitations: string;
  findings: string[];
  research_gaps: string[];
  literature_review_draft: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question_type: 'MCQ' | 'SHORT_ANSWER' | 'TRUE_FALSE';
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  source_page: number;
}

export interface Quiz {
  id: string;
  document: string;
  document_title: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  total_questions: number;
  questions: QuizQuestion[];
  created_at: string;
}

export interface Flashcard {
  id: string;
  front_question: string;
  back_answer: string;
  topic: string;
  source_page: number;
  mastery_level: 'NEW' | 'LEARNING' | 'REVIEWING' | 'MASTERED';
  created_at: string;
}

export interface FlashcardDeck {
  id: string;
  document: string;
  document_title: string;
  title: string;
  description: string;
  card_count: number;
  cards: Flashcard[];
  created_at: string;
}

export interface DashboardStats {
  summary: {
    total_documents: number;
    total_workspaces: number;
    total_conversations: number;
    total_agent_tasks: number;
    indexed_documents: number;
    processing_documents: number;
    failed_documents: number;
    success_rate: number;
  };
  recent_documents: Document[];
  recent_conversations: Conversation[];
  recent_tasks: AgentTask[];
}
