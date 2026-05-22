import type { SiteRow } from "@/components/protocol-search/types";

export const PROTOCOL_SEARCH_SUGGESTIONS = [
  "Phase III oncology biologic in NSCLC",
  "EGFR-mutant lung cancer second-line therapy",
  "Severe eosinophilic asthma biologic",
  "Heart failure with preserved ejection fraction",
] as const;

export const RESULTS_QUERY_TEXT =
  "Phase I/II first-in-human study investigating a novel fourth-generation, CNS-penetrant EGFR tyrosine kinase inhibitor in patients with locally advanced or metastatic EGFR-mutant NSCLC (exon 19 deletion or L858R) whose disease progressed on third-generation TKIs.";

export const RESULT_EXCLUSION_PREVIEW_ITEMS = [
  "Participant candidate for targeted therapies available to th…",
  "Participant with rapid progressive disease eligible to recei…",
] as const;

export const DETAIL_INCLUSION_ITEMS = [
  "Signed and dated informed consent for participation in the trial obtained according to International Council for Harmonisation of Technical Requirements of Pharmaceuticals for Human Use (ICH) Good Clinical Practice (GCP), and national/local regulations.",
  "Male or female ≥ 18 years of age at the time of signing informed consent.",
] as const;

export const DETAIL_EXCLUSION_ITEMS = [
  "Participant candidate for targeted therapies available to them (such as but not limited to therapies targeting ALK, BRAF, MET, NTRK, ROS1) as identified by local testing performed after progression to the last line of systemic therapy.",
  "Participant with rapid progressive disease eligible to receive a platinum-based chemotherapy.",
] as const;

export const DETAIL_ENROLLMENT = {
  enrolled: 54,
  target: 171,
} as const;

export const DETAIL_SITES: ReadonlyArray<SiteRow> = [
  {
    name: "Sarah Cannon Research Institute",
    country: "United States",
    target: 23,
    actual: 8,
    planned: 45,
    actualMo: 45,
    siteType: "Academic Medical Center",
    archetype: "Anchor",
  },
  {
    name: "Oncology Consultants (OC) — Houston",
    country: "United States",
    target: 14,
    actual: 4,
    planned: 45,
    actualMo: 45,
    siteType: "Community Hospital",
    archetype: "Emerging Partner",
  },
  {
    name: "Shanghai East Hospital, Tongji",
    country: "China",
    target: 20,
    actual: 6,
    planned: 45,
    actualMo: 45,
    siteType: "Research Network",
    archetype: "Competitive Battleground",
  },
  {
    name: "Tianjin Medical University Cancer Inst.",
    country: "China",
    target: 14,
    actual: 5,
    planned: 45,
    actualMo: 45,
    siteType: "Academic Medical Center",
    archetype: "Anchor",
  },
  {
    name: "Centre Léon Bérard",
    country: "France",
    target: 35,
    actual: 9,
    planned: 45,
    actualMo: 45,
    siteType: "Community Hospital",
    archetype: "Emerging Partner",
  },
  {
    name: "CHU Hôpital de la Timone",
    country: "France",
    target: 26,
    actual: 8,
    planned: 45,
    actualMo: 45,
    siteType: null,
    archetype: null,
  },
  {
    name: "Institut de Cancérologie de l'Ouest",
    country: "France",
    target: 26,
    actual: 10,
    planned: 45,
    actualMo: 45,
    siteType: null,
    archetype: null,
  },
  {
    name: "Institut Universitaire du Cancer",
    country: "France",
    target: 13,
    actual: 4,
    planned: 45,
    actualMo: 45,
    siteType: null,
    archetype: null,
  },
];