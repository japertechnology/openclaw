# GitHub Mode Architecture

## System Overview

GitHub Mode enables OpenClaw agents to execute in response to GitHub repository events, providing AI-powered code analysis, refactoring, testing, and review capabilities directly within your GitHub workflow.

## Event Flow Diagram

```mermaid
graph TB
    A[GitHub Event] --> B{Event Type}
    B -->|Issue Comment| C[github-mode-issue-comment.yml]
    B -->|PR Comment| D[github-mode-pr-comment.yml]
    B -->|Issue Label| E[github-mode-issue-opened.yml]
    B -->|Manual| F[github-mode-command.yml]

    C --> G[Parse Command]
    D --> G
    E --> G
    F --> G

    G --> H{Valid Command?}
    H -->|No| I[Skip Execution]
    H -->|Yes| J[Security Gates]

    J --> K[Activation Check]
    K --> L[Pre-Agent Gates]
    L --> M[Trust Authorization]
    M --> N[Policy Validation]
    N --> O[Provenance Check]

    O --> P{Gates Pass?}
    P -->|No| Q[Fail Workflow]
    P -->|Yes| R[Execute OpenClaw Agent]

    R --> S[pnpm openclaw agent]
    S --> T[Capture Output]
    T --> U[Upload Artifacts]
    U --> V{Changes Made?}

    V -->|No| W[End - Report Only]
    V -->|Yes| X[Create Bot Branch]
    X --> Y[Commit Changes]
    Y --> Z[Push Branch]
    Z --> AA{Create PR?}

    AA -->|No| AB[End - Branch Only]
    AA -->|Yes| AC[github-mode-bot-pr.yml]
    AC --> AD[Create Pull Request]
    AD --> AE[End - PR Created]

    style R fill:#90EE90
    style P fill:#FFB6C1
    style V fill:#87CEEB
    style AD fill:#FFD700
```

## Component Architecture

```mermaid
graph LR
    subgraph "Trigger Layer"
        T1[Issue Comments]
        T2[PR Comments]
        T3[Issue Labels]
        T4[Manual Dispatch]
    end

    subgraph "Parsing Layer"
        P1[Command Parser]
        P2[Context Extractor]
    end

    subgraph "Security Layer"
        S1[Activation Gate]
        S2[Trust Check]
        S3[Policy Gate]
        S4[Provenance]
    end

    subgraph "Execution Layer"
        E1[OpenClaw CLI]
        E2[Agent Runtime]
        E3[Output Capture]
    end

    subgraph "Result Layer"
        R1[Artifacts]
        R2[Bot Branch]
        R3[Pull Request]
        R4[Workflow Summary]
    end

    T1 --> P1
    T2 --> P1
    T3 --> P1
    T4 --> P1

    P1 --> P2
    P2 --> S1

    S1 --> S2
    S2 --> S3
    S3 --> S4

    S4 --> E1
    E1 --> E2
    E2 --> E3

    E3 --> R1
    E3 --> R2
    R2 --> R3
    E3 --> R4
```

## Security Gates Flow

```mermaid
sequenceDiagram
    participant Event as GitHub Event
    participant Parse as Parser
    participant Gates as Security Gates
    participant Agent as OpenClaw Agent
    participant Output as Result Handler

    Event->>Parse: Trigger workflow
    Parse->>Gates: Submit parsed command

    Gates->>Gates: 1. Check ACTIVE.md exists
    Gates->>Gates: 2. Run pre-agent gates
    Gates->>Gates: 3. Validate trust level
    Gates->>Gates: 4. Check policy compliance
    Gates->>Gates: 5. Validate provenance

    alt All Gates Pass
        Gates->>Agent: Execute command
        Agent->>Agent: pnpm openclaw agent
        Agent->>Output: Return results
        Output->>Output: Capture logs
        Output->>Output: Check for changes

        alt Has Changes
            Output->>Output: Create bot branch
            Output->>Output: Push changes
            Output->>Output: Create PR
        else No Changes
            Output->>Output: Upload artifacts only
        end
    else Any Gate Fails
        Gates->>Output: Block execution
        Output->>Output: Report failure
    end
```

## Data Flow

```mermaid
graph LR
    A[GitHub Event Data] --> B[Workflow Input]
    B --> C[Environment Variables]
    C --> D[OpenClaw CLI Args]
    D --> E[Agent Execution]
    E --> F[Agent Output]
    F --> G[Log Files]
    F --> H[File Changes]
    G --> I[Artifacts Upload]
    H --> J{Has Changes?}
    J -->|Yes| K[Git Operations]
    J -->|No| L[Skip Git]
    K --> M[Bot Branch]
    M --> N[Pull Request]
    I --> O[Workflow Summary]

    style E fill:#90EE90
    style J fill:#FFB6C1
    style N fill:#FFD700
```

## Command Translation

| User Input                  | Command Type | Agent Message Template                       | Expected Output       |
| --------------------------- | ------------ | -------------------------------------------- | --------------------- |
| `/openclaw explain <file>`  | `explain`    | "Explain the code in {file}..."              | Analysis in artifacts |
| `/openclaw refactor <file>` | `refactor`   | "Analyze {file} and suggest improvements..." | Code changes + PR     |
| `/openclaw test <file>`     | `test`       | "Review {file} and create tests..."          | Test files + PR       |
| `/openclaw diagram <file>`  | `diagram`    | "Create diagram of {file}..."                | Documentation + PR    |
| `/openclaw review` (on PR)  | `review`     | "Review PR #{number} changes..."             | Analysis + PR         |

## Artifact Storage

```
Workflow Run
├── github-mode-command-output/
│   └── agent-log.txt                 # Full agent output
├── github-mode-command-dispatch/
│   └── evidence.json                 # Execution metadata
├── github-mode-command-auth/
│   └── authorization-decision.json   # Trust check results
├── github-mode-command-policy-gate/
│   └── policy-decision.json          # Policy validation
└── github-mode-command-provenance/
    └── provenance-validation.json    # Audit trail
```

Retention: 90 days for all artifacts

## State Management

**Current (Stateless):**

- Each workflow run starts fresh
- No memory between runs
- Suitable for: one-shot commands, code review, analysis

**Future (Optional):**

- External storage for agent memory
- Checkpoint/restore for long tasks
- Cross-run context persistence

## Performance Considerations

- **Startup**: ~30-60s (install dependencies + build)
- **Agent Execution**: Varies by task (1-5 minutes typical)
- **Artifacts Upload**: ~5-10s
- **PR Creation**: ~10-20s

Total typical run time: **2-7 minutes**

## Scalability

- GitHub Actions concurrency limits apply
- Multiple workflows can run in parallel
- Each workflow is isolated
- Artifacts stored per-run, no shared state

## Security Boundaries

```
┌─────────────────────────────────────┐
│  Untrusted Context                  │
│  - Fork PRs                         │
│  - Public comments                  │
│  └─> Read-only access               │
│      No secret exposure             │
└─────────────────────────────────────┘
                 │
                 ▼
         [Trust Gate]
                 │
                 ▼
┌─────────────────────────────────────┐
│  Trusted Context                    │
│  - Repository members               │
│  - Internal PRs                     │
│  └─> Write access                   │
│      Can create branches/PRs        │
│      Policy-gated operations        │
└─────────────────────────────────────┘
```

## Failure Modes

| Scenario             | Detection         | Recovery                |
| -------------------- | ----------------- | ----------------------- |
| Agent timeout        | Workflow timeout  | Captured in logs        |
| No file changes      | git diff check    | Skip PR creation        |
| Gate failure         | Script exit code  | Block execution         |
| Invalid command      | Parser regex      | Skip execution          |
| Missing dependencies | pnpm install fail | Workflow fails          |
| Rate limits          | GitHub API        | Auto-retry with backoff |

## Monitoring Points

1. **Workflow Success Rate**: Actions → Workflows → Success %
2. **Average Runtime**: Check workflow duration trends
3. **Artifact Size**: Monitor storage usage
4. **PR Creation Rate**: Track bot PR frequency
5. **Gate Failures**: Review security gate logs

## Configuration Points

| Location                 | Purpose              | Example                |
| ------------------------ | -------------------- | ---------------------- |
| `.GITHUB-MODE/ACTIVE.md` | Master on/off switch | Rename to disable      |
| `.GITHUB-MODE/runtime/`  | Policy contracts     | Edit trust-levels.json |
| Workflow inputs          | Command options      | Add new commands       |
| Message templates        | Agent prompts        | Customize in workflow  |

## Integration Points

GitHub Mode can be called from other workflows:

```yaml
jobs:
  custom-check:
    uses: ./.github/workflows/github-mode-command.yml
    with:
      command: refactor
      target: src/changed-file.ts
      open_bot_pr: true
```

## Observability

**Workflow Summary includes:**

- Command details
- Gate results (✅ or ❌)
- Last 100 lines of agent output
- Bot PR link (if created)

**Artifacts contain:**

- Complete agent logs
- All gate decision records
- Execution metadata
- Provenance audit trail
