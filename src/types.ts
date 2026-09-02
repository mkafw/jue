// Domain Types

export enum LearningLevel {
  L0_TOOL = 0,    // Tool/Prompt Level
  L1_PATTERN = 1, // Mechanism/Principle Level
  L2_SELF = 2     // Architecture/Design Level
}

export enum EntityType {
  QUESTION = 'QUESTION',
  OBJECTIVE = 'OBJECTIVE',
  KEY_RESULT = 'KEY_RESULT',
  FAILURE = 'FAILURE'
}

export interface NodeBase {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// QA Core
export interface Question extends NodeBase {
  type: EntityType.QUESTION;
  title: string;
  content: string; // Markdown supported answer
  level: LearningLevel;
  tags: string[];
  // Assets managed by '@'
  assets?: string[]; // URLs to images
  // Bi-directional links managed by '[[]]'
  linkedQuestionIds: string[];
  linkedOKRIds: string[]; 
  status: 'Draft' | 'Answered' | 'Verified';
}

// OKR Core
export interface KeyResult extends NodeBase {
  type: EntityType.KEY_RESULT;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Failed';
  metric: string; // e.g., "3 working prototypes"
  linkedQuestionIds: string[]; // Questions blocking or related to this KR
}

export interface Objective extends NodeBase {
  type: EntityType.OBJECTIVE;
  title: string;
  description: string;
  keyResults: KeyResult[];
  linkedQuestionIds: string[]; // High-level questions this O addresses
}

// Failure Sedimentation
export interface Failure extends NodeBase {
  type: EntityType.FAILURE;
  description: string;
  analysis5W2H: string;
  relatedKRId?: string;
  convertedToQuestionId?: string; // If null, pending conversion
  status: 'New' | 'Analyzed' | 'Sedimented';
}

// Graph Visualization Types
export interface GraphNode {
  id: string;
  group: number; // 1: Question, 2: Objective, 3: KR
  label: string;
  level?: number;
  val: number; // Size
  type?: string; // 'QUESTION' | 'OBJECTIVE' | 'GHOST'
  // Enriched data for Popup/Card
  content?: string;
  assets?: string[];
  tags?: string[];
  // D3 Simulation properties
  yBase: number;
  strand: 'A' | 'B';
  x?: number;
  y?: number;
  z?: number; // 3D depth
  rawEntity?: Question | Objective;

  // Added properties for GraphView logic
  index?: number;
  linkedQuestionIds?: string[];
  linkedOKRIds?: string[];
  
  // Biological Properties
  isCrystallized?: boolean; // If linked to a Completed Objective
  isGhost?: boolean; // Dark Matter
}

// Visual Data Contract
export interface HelixStep {
  index: number;
  question?: GraphNode;
  objective?: GraphNode;
}

export interface IRepository {
  getQuestions(): Promise<Question[]>;
  addQuestion(question: Question): Promise<Question>;
  deleteQuestion(id: string): Promise<boolean>;
  getFailures(): Promise<Failure[]>;
  addFailure(failure: Failure): Promise<Failure>;
  updateFailure(id: string, updates: Partial<Failure>): Promise<Failure | null>;
  findFailure(id: string): Promise<Failure | undefined>;
  getObjectives(): Promise<Objective[]>;
  addObjective(objective: Objective): Promise<Objective>;
  deleteObjective(id: string): Promise<boolean>;
  updateKeyResult(objectiveId: string, krId: string, status: KeyResult['status']): Promise<void>;
}

export interface IVectorStore {
  upsertVector(id: string, text: string, metadata: Record<string, any>): Promise<void>;
  search(query: string, limit?: number): Promise<{id: string, score: number}[]>;
}

export interface Iteration {
  id: string;
  hash: string;
  timestamp: string;
  message: string;
  changes: {
    added: number;
    modified: number;
    sedimented: number;
  };
  contextSummary: string;
}

export enum ViewMode {
  QA_FIRST = 'QA_FIRST',
  OKR_FIRST = 'OKR_FIRST',
  GRAPH = 'GRAPH',
  THREE_D = 'THREE_D',
  FAILURE_QUEUE = 'FAILURE_QUEUE',
  DASHBOARD = 'DASHBOARD',
  SETTINGS = 'SETTINGS'
}
