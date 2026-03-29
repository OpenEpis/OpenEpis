import "reflect-metadata";
import { injectable } from "tsyringe";
import type { IStorageService } from "@openepis/storage";
import { createConnection } from "./connection.js";
import { PostgresUserStorage } from "./repositories/user-storage.js";
import { PostgresProjectStorage } from "./repositories/project-storage.js";
import { PostgresProjectMemberStorage } from "./repositories/project-member-storage.js";
import { PostgresRepositoryStorage } from "./repositories/repository-storage.js";
import { PostgresFeatureStorage } from "./repositories/feature-storage.js";
import { PostgresScenarioStorage } from "./repositories/scenario-storage.js";
import { PostgresFeatureRevisionStorage } from "./repositories/feature-revision-storage.js";
import { PostgresPrdDocumentStorage } from "./repositories/prd-document-storage.js";
import { PostgresConversationStorage } from "./repositories/conversation-storage.js";
import { PostgresAsyncTaskStorage } from "./repositories/async-task-storage.js";
import { PostgresLlmConfigStorage } from "./repositories/llm-config-storage.js";
import type postgres from "postgres";

@injectable()
export class PostgresStorageService implements IStorageService {
  public readonly users: PostgresUserStorage;
  public readonly projects: PostgresProjectStorage;
  public readonly projectMembers: PostgresProjectMemberStorage;
  public readonly repositories: PostgresRepositoryStorage;
  public readonly features: PostgresFeatureStorage;
  public readonly scenarios: PostgresScenarioStorage;
  public readonly featureRevisions: PostgresFeatureRevisionStorage;
  public readonly prdDocuments: PostgresPrdDocumentStorage;
  public readonly conversations: PostgresConversationStorage;
  public readonly asyncTasks: PostgresAsyncTaskStorage;
  public readonly llmConfigs: PostgresLlmConfigStorage;

  private client: postgres.Sql;

  constructor() {
    const { db, client } = createConnection();
    this.client = client;

    this.users = new PostgresUserStorage(db);
    this.projects = new PostgresProjectStorage(db);
    this.projectMembers = new PostgresProjectMemberStorage(db);
    this.repositories = new PostgresRepositoryStorage(db);
    this.features = new PostgresFeatureStorage(db);
    this.scenarios = new PostgresScenarioStorage(db);
    this.featureRevisions = new PostgresFeatureRevisionStorage(db);
    this.prdDocuments = new PostgresPrdDocumentStorage(db);
    this.conversations = new PostgresConversationStorage(db);
    this.asyncTasks = new PostgresAsyncTaskStorage(db);
    this.llmConfigs = new PostgresLlmConfigStorage(db);
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }
}
