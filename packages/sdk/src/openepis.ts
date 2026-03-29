import { HttpClient, type OpenEpisClientConfig } from "./client.js";
import { ProjectsResource } from "./resources/projects.js";
import { FeaturesResource } from "./resources/features.js";
import { RepositoriesResource } from "./resources/repositories.js";
import { ContextResource } from "./resources/context.js";
import { TasksResource } from "./resources/tasks.js";
import { InitResource } from "./resources/init.js";

export class OpenEpisClient {
  readonly projects: ProjectsResource;
  readonly features: FeaturesResource;
  readonly repositories: RepositoriesResource;
  readonly context: ContextResource;
  readonly tasks: TasksResource;
  readonly init: InitResource;

  constructor(config: OpenEpisClientConfig) {
    const http = new HttpClient(config);
    this.projects = new ProjectsResource(http);
    this.features = new FeaturesResource(http);
    this.repositories = new RepositoriesResource(http);
    this.context = new ContextResource(http);
    this.tasks = new TasksResource(http);
    this.init = new InitResource(http);
  }
}
