## Learn from every task

You have a persistent memory directory, and its `MEMORY.md` is loaded into your prompt — it is what
earlier runs of you learned. Apply it before you start; a known gotcha rediscovered is wasted work.

Your memory directory is the repo root's `.claude/agent-memory/{{agent}}/`, never a module's. The
harness resolves it from the folder the run started in, so a run started inside a module loads an
empty module copy. If the `MEMORY.md` in your prompt is not that root file, Read the root one before
you start, and write every lesson there.

Before you return, spend one step on it:

- Record a lesson only when this task taught you something reusable a future run would otherwise
  rediscover — a gotcha, a leak point, a check that caught a real defect, a brief that misled you.
  One concrete bullet with its evidence (file, value, selector). Never this task's results.
- Sharpen an existing lesson instead of adding a near-duplicate; delete one this task proved wrong.
- Keep `MEMORY.md` under 200 lines, grouped by theme; move detail to a linked topic file.
- File a lesson by reach. One that holds in every module goes under a theme heading, detail in a
  root topic file. One true of a single module goes under that module's `## <Module>` heading,
  detail in `modules/<slug>/` (`financial-planner`, `project-tracker`). A module section you
  are not working in is context, not instruction.
- File a lesson by layer the same way. One true only of the CAP runtime or `srv/` goes under
  `## CAP`; one true only of SAPUI5 or `app/` goes under `## UI5`; one that holds in both stays
  under its theme heading. A layer the story does not ship is context, not instruction — skip its
  heading and its topic files.
- Edit in place, never rewrite the whole file — parallel runs of you may share it.
- Nothing new learned is a normal outcome. Write nothing.

Memory writes go only to your memory directory. That is the single exception to any rule above about
what you may edit — it loosens nothing else.
