import type { IUserStorage } from "./user-storage.js";
import type { IProjectStorage } from "./project-storage.js";
import type { IProjectMemberStorage } from "./project-member-storage.js";
import type { IRepositoryStorage } from "./repository-storage.js";
import type { IFeatureStorage } from "./feature-storage.js";
import type { IScenarioStorage } from "./scenario-storage.js";
import type { IFeatureRevisionStorage } from "./feature-revision-storage.js";
import type { IPrdDocumentStorage } from "./prd-document-storage.js";
import type { IConversationStorage } from "./conversation-storage.js";
import type { IAsyncTaskStorage } from "./async-task-storage.js";
import type { ILlmConfigStorage } from "./llm-config-storage.js";

export interface IStorageService {
  users: IUserStorage;
  projects: IProjectStorage;
  projectMembers: IProjectMemberStorage;
  repositories: IRepositoryStorage;
  features: IFeatureStorage;
  scenarios: IScenarioStorage;
  featureRevisions: IFeatureRevisionStorage;
  prdDocuments: IPrdDocumentStorage;
  conversations: IConversationStorage;
  asyncTasks: IAsyncTaskStorage;
  llmConfigs: ILlmConfigStorage;

  disconnect(): Promise<void>;
}
