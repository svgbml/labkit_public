# Alignment fixtures

Test files for the alignment parsers (S170). They are copied from the Biopython test suite
(`Tests/Clustalw/opuntia.aln`, `Tests/Phylip/one.dat`, `Tests/Nexus/test_Nexus_input.nex`,
`Tests/msf/W_prot.msf`, `Tests/NBRF/clustalw.pir`), which is released under the Biopython
License Agreement / BSD 3-Clause License. `opuntia.fasta` was written from `opuntia.aln` with
Biopython's `AlignIO.convert`.

`biopython.json` holds the reference reading of each file by Biopython's `Bio.AlignIO`: the
number of sequences, the alignment length and the names. `tests/validate.py` compares LabKit's
reading against it.
