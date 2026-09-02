import { Question, Objective, Failure, LearningLevel, EntityType, Iteration } from '../types';

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    type: EntityType.QUESTION,
    title: 'How do I reduce hallucination in Zero-Shot prompts?',
    content: 'Using **Chain of Thought (CoT)** reasoning forces the model to explain its logic step-by-step before answering. Also, explicit constraints in the system prompt help.',
    level: LearningLevel.L0_TOOL,
    tags: ['Prompt Engineering', 'Reliability'],
    linkedQuestionIds: ['q-2'],
    linkedOKRIds: ['o-1'],
    status: 'Verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'q-2',
    type: EntityType.QUESTION,
    title: 'What is the ReAct pattern in Agent design?',
    content: 'ReAct stands for **Reason + Act**. It is a loop where the agent: 1. Observes 2. Thinks (Reason) 3. Acts (Tool Use) 4. Observes result. It is the foundation of autonomous agents.',
    level: LearningLevel.L1_PATTERN,
    tags: ['Architecture', 'Patterns'],
    linkedQuestionIds: ['q-1', 'q-3'],
    linkedOKRIds: ['o-1'],
    status: 'Answered',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'q-3',
    type: EntityType.QUESTION,
    title: 'How to design a shared memory system for multi-agent collaboration?',
    content: 'Shared memory requires a vector database for semantic retrieval and a structured context window manager. Agents need read/write permissions and a conflict resolution protocol.',
    level: LearningLevel.L2_SELF,
    tags: ['System Design', 'Memory'],
    linkedQuestionIds: ['q-2'],
    linkedOKRIds: ['o-2'],
    status: 'Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'q-4',
    type: EntityType.QUESTION,
    title: 'Analyze this Agent Architecture Diagram',
    content: 'The diagram shows a cyclic dependency between the Planner and the Executor without an intermediate validation step. This often leads to infinite retry loops.',
    level: LearningLevel.L1_PATTERN,
    tags: ['Visual Analysis', 'Architecture'],
    assets: ['https://mermaid.ink/img/pako:eNpVkM1qwzAQhF9F7LkF8gI-FNoSyuZgQyCXIsvaWAvZylIyxiG8e9V_2qTnHma-Wc1oZ0ZLCw6-Oayf1hX2yvD2IYeR_s4x_x4Xj2_vjzG8fTzG5XU8PcaEK2U44dmh0-6A87-W84B2o_14N9pYjC8w_oJ2o43F-Azjb2g32liMLzD-hnatDVU4-fB6yD7fO9joBw01lFhQ85QdFmTU0CJ35O4cM2rIqKHFjNwdY0YNGTW0mJG7Y8yoIaOGFjNyd4wZNWQs0eLw5D_XyL0uK6hRUiJ3yT-P3Z8fQ79lGg'],
    linkedQuestionIds: ['q-2'],
    linkedOKRIds: [],
    status: 'Answered',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_OKRS: Objective[] = [
  {
    id: 'o-1',
    type: EntityType.OBJECTIVE,
    title: 'Master Basic Agentic Patterns',
    description: 'Move from simple prompt engineering to building functional reasoning loops.',
    linkedQuestionIds: ['q-1', 'q-2'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    keyResults: [
      {
        id: 'kr-1-1',
        type: EntityType.KEY_RESULT,
        title: 'Implement a ReAct Loop from scratch in Python',
        metric: '1 working script',
        status: 'Completed',
        linkedQuestionIds: ['q-2'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'kr-1-2',
        type: EntityType.KEY_RESULT,
        title: 'Achieve >90% success rate on math extraction tasks',
        metric: '90% accuracy',
        status: 'In Progress',
        linkedQuestionIds: ['q-1'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'o-2',
    type: EntityType.OBJECTIVE,
    title: 'Design a Multi-Agent OS',
    description: 'Create a system where multiple specialized agents communicate via a message bus.',
    linkedQuestionIds: ['q-3'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    keyResults: [
      {
        id: 'kr-2-1',
        type: EntityType.KEY_RESULT,
        title: 'Define the inter-agent protocol schema',
        metric: '1 JSON Schema',
        status: 'Pending',
        linkedQuestionIds: ['q-3'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }
];

export const INITIAL_FAILURES: Failure[] = [
  {
    id: 'f-1',
    type: EntityType.FAILURE,
    description: 'Agent entered an infinite loop when tool execution failed.',
    analysis5W2H: 'Why: No max-iteration limit. How: Error exception wasn\'t caught in the reasoning trace.',
    relatedKRId: 'kr-1-1',
    status: 'Analyzed',
    convertedToQuestionId: 'q-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'f-2',
    type: EntityType.FAILURE,
    description: 'Context window overflowed during long conversation.',
    analysis5W2H: 'Needs a summarization mechanism or sliding window memory.',
    status: 'New',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_ITERATIONS: Iteration[] = [
  {
    id: 'it-1',
    hash: '8f3a21',
    timestamp: '2023-12-01 10:00',
    message: 'Initial System Architecture',
    changes: { added: 12, modified: 0, sedimented: 0 },
    contextSummary: '# Iteration 1: Genesis\n\n- **Focus**: Defined the dual-core data model (QA + OKR).\n- **Prompt**: "Design a system like a DNA Helix."\n- **Outcome**: Basic Rust structs defined for Nodes.'
  },
  {
    id: 'it-2',
    hash: '2b9c44',
    timestamp: '2023-12-02 14:30',
    message: 'Added Failure Sedimentation Protocol',
    changes: { added: 2, modified: 4, sedimented: 1 },
    contextSummary: '# Iteration 2: Entropy Control\n\n- **Focus**: Handling Agent failures.\n- **Problem**: Infinite loops in tool use.\n- **Solution**: Implemented 5W2H analysis queue.\n- **Sedimentation**: Transmuted failure f-1 into question q-2.'
  },
  {
    id: 'it-3',
    hash: '3c5d89',
    timestamp: '2023-12-03 16:45',
    message: 'Visualization Upgrade: Dense DNA Matrix',
    changes: { added: 0, modified: 1, sedimented: 0 },
    contextSummary: '# Iteration 3: Visual Density\n\n- **Problem**: The DNA Helix looked sparse ("not enough horizontal lines").\n- **Solution**: Implemented dynamic height scaling and procedural "structural rungs" independent of data nodes.\n- **Result**: Visual density now matches the biological metaphor.'
  },
  {
    id: 'it-4',
    hash: '4d2f11',
    timestamp: '2023-12-04 09:15',
    message: 'Visualization Upgrade: 3D Tilt Perspective',
    changes: { added: 0, modified: 2, sedimented: 0 },
    contextSummary: '# Iteration 4: 3D Physics\n\n- **Problem**: Horizontal lines were flat and lacked volume.\n- **Solution**: Implemented `TILT` factor in coordinate calculation.\n- **Result**: Helix rungs now slant organically based on depth (Z-axis), creating true 3D volume.'
  }
];
