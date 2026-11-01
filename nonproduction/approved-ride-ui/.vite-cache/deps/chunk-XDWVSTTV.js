// ../../node_modules/@datadog/browser-rum/esm/domain/replayStats.js
var MAX_STATS_HISTORY = 1e3;
var statsPerView;
function getSegmentsCount(viewId) {
  return getOrCreateReplayStats(viewId).segments_count;
}
function addSegment(viewId) {
  getOrCreateReplayStats(viewId).segments_count += 1;
}
function addRecord(viewId) {
  getOrCreateReplayStats(viewId).records_count += 1;
}
function addWroteData(viewId, additionalBytesCount) {
  getOrCreateReplayStats(viewId).segments_total_raw_size += additionalBytesCount;
}
function getReplayStats(viewId) {
  return statsPerView === null || statsPerView === void 0 ? void 0 : statsPerView.get(viewId);
}
function getOrCreateReplayStats(viewId) {
  if (!statsPerView) {
    statsPerView = /* @__PURE__ */ new Map();
  }
  let replayStats;
  if (statsPerView.has(viewId)) {
    replayStats = statsPerView.get(viewId);
  } else {
    replayStats = {
      records_count: 0,
      segments_count: 0,
      segments_total_raw_size: 0
    };
    statsPerView.set(viewId, replayStats);
    if (statsPerView.size > MAX_STATS_HISTORY) {
      deleteOldestStats();
    }
  }
  return replayStats;
}
function deleteOldestStats() {
  if (!statsPerView) {
    return;
  }
  const toDelete = statsPerView.keys().next().value;
  if (toDelete) {
    statsPerView.delete(toDelete);
  }
}

export {
  getSegmentsCount,
  addSegment,
  addRecord,
  addWroteData,
  getReplayStats
};
//# sourceMappingURL=chunk-XDWVSTTV.js.map
