function scheduleByPriority(jobs) {
  jobs.sort((a, b) => {
    probe({ firstPriority: a.priority, secondPriority: b.priority });
    return b.priority - a.priority;
  });
  return jobs.map((job) => job.id);
}
