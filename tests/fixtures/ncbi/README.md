Antwoorden van NCBI E-utilities, opgehaald op 2026-11-22 met `tool=labkit` en zonder e-mailadres
of sleutel. `tests/ncbi_check.py` speelt ze af met een vervangen `fetch`, zodat de test geen
internet nodig heeft.

| Bestand | Verzoek |
|---|---|
| `esummary_snp_1805007.json` | `esummary.fcgi?db=snp&id=1805007&retmode=json` (rs1805007, MC1R) |
| `esummary_snp_notfound.json` | `esummary.fcgi?db=snp&id=999999999999&retmode=json` |
| `esummary_nuccore_NM_002386.4.json` | `esummary.fcgi?db=nuccore&id=NM_002386.4&retmode=json` (slen 2111) |
| `esummary_nuccore_notfound.json` | `esummary.fcgi?db=nuccore&id=NM_999999999.1&retmode=json` |
| `efetch_NM_002386.4.fasta` | `efetch.fcgi?db=nuccore&id=NM_002386.4&rettype=fasta&retmode=text` |
| `efetch_NC_000016.10_89919609-89919809.fasta` | dezelfde met `id=NC_000016.10&seq_start=89919609&seq_stop=89919809` (±100 bp rond rs1805007; base 101 is de C van de SNP) |

Een onbekend accessienummer bij efetch geeft HTTP 400.
