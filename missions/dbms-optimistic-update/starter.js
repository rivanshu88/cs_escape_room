function applyUpdate(record, expectedVersion, nextValue) {
  probe({ currentVersion: record.version, expectedVersion });
  if (record.version < expectedVersion) return null;
  return { ...record, version: record.version + 1, value: nextValue };
}
