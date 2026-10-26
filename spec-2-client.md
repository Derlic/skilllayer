# Context
I am continuing development on my "Final Year Project: SkillLayer - An adaptive AI assistance governor for software development that balances developer productivity, code quality and developer skill formation."[cite: 2]

We have already built the Node.js/Express backend (the Policy Engine) and the Supabase database. We are now building the **VS Code Extension Client** using TypeScript. We are currently on **Phase 2: The Context Extractor**[cite: 2].

The goal of this phase is to intercept the user's request for AI assistance, extract their current IDE state, and send it to our local backend to determine their permitted assistance level based on their capability scores. 

# Task 1: Extension Scaffolding & API Types
I have initialized a basic VS Code extension. Please create a `src/types.ts` file that shares the exact API contract with my backend:
1. `AssistRequest`: Contains `userId` (string), `context` (object with `language`, `currentFileContext`, `selectedCode`, `userPrompt`), and `requestedAssistanceLevel` (number)[cite: 1].
2. `AssistResponse`: Contains `permittedAssistanceLevel` (number), `primaryStruggleLayer` (string), `requiresCheckpoint` (boolean), and `checkpointData` (optional object with `checkpointId`, `type`, `prompt`)[cite: 1].

# Task 2: The Context Extractor Logic
Please update `src/extension.ts` to register a new command called `skilllayer.requestAssist`.
When this command is triggered, it should:
1. Prompt the user for an input (e.g., "What do you need help with?").
2. Use the `vscode` API to extract the active text editor's state:
   - The programming language (e.g., "typescript" or "python")[cite: 1].
   - The entire file content (`currentFileContext`)[cite: 1].
   - The currently highlighted code block (`selectedCode`), if any[cite: 1].
3. If no editor is active, show an error message.

# Task 3: Backend Communication
Inside the same command, after extracting the context:
1. Use `axios` or native `fetch` to send a `POST` request to `http://localhost:3000/api/v1/assist`.
2. The payload must match the `AssistRequest` interface. Hardcode a dummy UUID for `userId` for now, and set `requestedAssistanceLevel` to 6.
3. Await the `AssistResponse`. 
4. For this MVP step, simply use `vscode.window.showInformationMessage` to display the `permittedAssistanceLevel` and whether it `requiresCheckpoint` returned by the server. (We will build the actual Webview UI for the checkpoints in Phase 3).