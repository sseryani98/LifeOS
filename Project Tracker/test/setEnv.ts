// CAP reads this once, when its service-impl resolver loads, so only setupFiles
// runs early enough. Never set it per spec: a spec that omits it still passes,
// against generic CRUD, with the real handlers silently unregistered.
process.env.CDS_TYPESCRIPT = "true";
