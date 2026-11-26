# LabKit

A lab calculator and gel editor for biomedical lab students. These are the words the app and its code use for organising work across tools (settled in the W1 interview, 2026-11-26).

## Language

**Project**:
A named container for one piece of a student's lab work: tool inputs, gels, notes and runs. Exactly one project is active at a time.
_Avoid_: session, map, folder

**Werkstroom**:
A recipe: an ordered list of tools to work through. It is built in, a course template, or one a student made.
_Avoid_: workflow template, protocol, run

**Course template**:
A werkstroom that ships with LabKit for a BML practical module. Students can copy it, not edit it.
_Avoid_: preset, standard workflow

**Run**:
One use of a werkstroom inside a project, with a name the student gives it (e.g. "PCR week 3") and its own copy of the inputs of its tools. A project can hold several runs; one is active. In the app it is shown by its name under *Mijn werkstromen*, never as "run".
_Avoid_: doorloop, session, instance (in the app)

**Losse invoer**:
The inputs of a project that belong to no run: what a tool shows when no run is active.
_Avoid_: default inputs, global inputs

**Mapping**:
A fixed rule that a value in one tool feeds a field in another (e.g. DNA concentration → PCR template volume). Mappings are part of LabKit, not made by students.
_Avoid_: link, binding, connection

**Auto value**:
A field value filled by a mapping inside the active run, which follows the source as it changes.
_Avoid_: default, linked value

**Eigen waarde**:
A value the student entered in a field that could be an auto value. It stays until the student switches the field back to auto.
_Avoid_: override, manual value

**Stuur door naar**:
A one-off button that copies one result into another tool, outside any run. It is not a mapping.
_Avoid_: send, transfer, data flow

## Relationships

- A **Project** holds **losse invoer**, gels, notes and any number of **Runs**.
- A **Run** follows one **Werkstroom**; the same werkstroom can have several runs in one project.
- **Mappings** only act between tools of the active **Run**, producing **auto values**; anything typed there is an **eigen waarde**.
