#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { featuresCommand } from "./commands/features.js";
import { bddCommand } from "./commands/bdd.js";
import { contextCommand } from "./commands/context.js";

const main = defineCommand({
  meta: {
    name: "openepis",
    description: "OpenEpis CLI — BDD requirements for developers",
  },
  subCommands: {
    features: featuresCommand,
    bdd: bddCommand,
    context: contextCommand,
  },
});

runMain(main);
