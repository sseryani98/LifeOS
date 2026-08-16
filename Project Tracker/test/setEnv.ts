// CAP reads this variable once, when its service-impl resolver is first loaded,
// to decide whether ".ts" belongs in the extension list it searches. Jest's
// setupFiles is the only hook that runs early enough; a beforeAll is too late.
// Never set it per spec — a spec that omits it still passes, against CAP's
// generic CRUD, with the real handlers silently unregistered.
process.env.CDS_TYPESCRIPT = "true";
