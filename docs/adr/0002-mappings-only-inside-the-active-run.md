# Mappings act live, but only inside the active run, and a click on the field stops them

Data flow between tools (S117) fills fields automatically and keeps them following the source, but only between tools of the active run. Outside a run every calculator behaves as before, and *Stuur door naar* stays a separate one-off button. A field filled by a mapping shows its auto value; as soon as the student clicks into it to edit, that field stops following and a small button next to it switches it back to auto. The choice is saved with the run.

## Considered Options

- **Offer values with a "Neem over" button:** rejected by the owner; too many clicks during a practical.
- **Fill once on opening the next tool:** rejected; changing an earlier step would leave stale numbers downstream.
- **Mappings between any tools, also outside a run:** rejected; a standalone calculator should never change by itself.
