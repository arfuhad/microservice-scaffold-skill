# Microservice Scaffold Skill

This repository contains a Gemini CLI skill for scaffolding and configuring Node.js microservices with Express, Apollo Server, and Mongoose or PostgreSQL.

## Overview

Building microservices requires consistent patterns for database connections, API layers, and configuration management. This skill encapsulates those patterns into a reusable procedural guide for Gemini CLI.

## Contents

- **SKILL.md**: The core skill definition and workflows.
- **references/**: Detailed setup guides for Mongoose, PostgreSQL, and Apollo Express.
- **scripts/**: (Optional) Scaffolding scripts.
- **assets/**: (Optional) Templates and boilerplate.

## How to Install

To use this skill in your own Gemini CLI session:

1. Clone this repository.
2. Package the skill:
   ```bash
   node <path-to-skill-creator>/scripts/package_skill.cjs .
   ```
3. Install the generated `.skill` file:
   ```bash
   gemini skills install microservice-scaffold.skill --scope user
   ```
4. Reload skills in your Gemini CLI session:
   ```bash
   /skills reload
   ```

## Design Principles

- **Modular**: Logic is separated into reusable reference files.
- **Generic**: Works with any standard Node.js/Express environment.
- **Secure**: Emphasizes environment-based configuration over hardcoding.
