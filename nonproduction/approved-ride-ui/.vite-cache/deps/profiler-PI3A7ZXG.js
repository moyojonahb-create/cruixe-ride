import {
  RumLongTaskEntryType,
  RumPerformanceEntryType,
  createFormDataTransport
} from "./chunk-6LMWSHFG.js";
import {
  SESSION_TIME_OUT_DELAY,
  addDuration,
  addEventListener,
  buildTags,
  clearTimeout,
  clocksNow,
  clocksOrigin,
  createValueHistory,
  currentDrift,
  display,
  elapsed,
  getGlobalObject,
  mockable,
  monitorError,
  setTimeout
} from "./chunk-4TAEVATQ.js";
import "./chunk-WOOG5QLI.js";

// ../../node_modules/@datadog/browser-rum/esm/domain/profiling/utils/getNumberOfSamples.js
function getNumberOfSamples(samples) {
  let numberOfSamples = 0;
  for (const sample of samples) {
    if (sample.stackId !== void 0) {
      numberOfSamples++;
    }
  }
  return numberOfSamples;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/profiling/utils/getDefaultViewName.js
var PATH_MIXED_ALPHANUMERICS = /\/(?![vV]\d{1,2}\/)([^/\d?]*\d+[^/?]*)/g;
function getDefaultViewName(viewPathUrl) {
  if (!viewPathUrl) {
    return "/";
  }
  return viewPathUrl.replace(PATH_MIXED_ALPHANUMERICS, "/?");
}

// ../../node_modules/@datadog/browser-rum/esm/domain/profiling/utils/getCustomOrDefaultViewName.js
var getCustomOrDefaultViewName = (customViewName, viewPathUrl) => customViewName || getDefaultViewName(viewPathUrl);

// ../../node_modules/@datadog/browser-rum/esm/domain/profiling/transport/buildProfileEventAttributes.js
function buildProfileEventAttributes(profilerTrace, applicationId, sessionId) {
  var _a, _b;
  const { ids, names } = extractViewIdsAndNames(profilerTrace.views);
  const longTaskIds = profilerTrace.longTasks.map((longTask) => longTask.id).filter((id) => id !== void 0);
  const actionIds = (_b = (_a = profilerTrace.actions) === null || _a === void 0 ? void 0 : _a.map((longTask) => longTask.id).filter((id) => id !== void 0)) !== null && _b !== void 0 ? _b : [];
  const { ids: vitalIds, labels: vitalLabels } = extractVitalIdsAndLabels(profilerTrace.vitals);
  const attributes = { application: { id: applicationId } };
  if (sessionId) {
    attributes.session = { id: sessionId };
  }
  if (ids.length) {
    attributes.view = { id: ids, name: names };
  }
  if (longTaskIds.length) {
    attributes.long_task = { id: longTaskIds };
  }
  if (actionIds.length) {
    attributes.action = { id: actionIds, label: [] };
  }
  if (vitalIds.length) {
    attributes.vital = { id: vitalIds, label: vitalLabels };
  }
  return attributes;
}
function extractViewIdsAndNames(views) {
  const result = { ids: [], names: [] };
  for (const view of views) {
    result.ids.push(view.viewId);
    if (view.viewName) {
      result.names.push(view.viewName);
    }
  }
  result.names = Array.from(new Set(result.names));
  return result;
}
function extractVitalIdsAndLabels(vitals) {
  const result = { ids: [], labels: [] };
  if (!vitals) {
    return result;
  }
  for (const vital of vitals) {
    result.ids.push(vital.id);
    result.labels.push(vital.label);
  }
  result.labels = Array.from(new Set(result.labels));
  return result;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/profiling/transport/assembly.js
function assembleProfilingPayload(profilerTrace, configuration, sessionId) {
  const event = buildProfileEvent(profilerTrace, configuration, sessionId);
  return {
    event,
    "wall-time.json": profilerTrace
  };
}
function buildProfileEvent(profilerTrace, configuration, sessionId) {
  const tags = buildTags(configuration);
  const profileAttributes = buildProfileEventAttributes(profilerTrace, configuration.applicationId, sessionId);
  const profileEventTags = buildProfileEventTags(tags);
  const profileEvent = {
    ...profileAttributes,
    attachments: ["wall-time.json"],
    start: new Date(profilerTrace.startClocks.timeStamp).toISOString(),
    end: new Date(profilerTrace.endClocks.timeStamp).toISOString(),
    family: "chrome",
    runtime: "chrome",
    format: "json",
    version: 4,
    // Ingestion event version (not the version application tag)
    tags_profiler: profileEventTags.join(","),
    _dd: {
      clock_drift: currentDrift()
    }
  };
  return profileEvent;
}
function buildProfileEventTags(tags) {
  const profileEventTags = tags.concat(["language:javascript", "runtime:chrome", "family:chrome", "host:browser"]);
  return profileEventTags;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/profiling/longTaskHistory.js
var LONG_TASK_ID_HISTORY_EXPIRE_DELAY = SESSION_TIME_OUT_DELAY;
function createLongTaskHistory(lifeCycle) {
  const history = createValueHistory({
    expireDelay: LONG_TASK_ID_HISTORY_EXPIRE_DELAY
  });
  lifeCycle.subscribe(12, ({ rawRumEvent, startClocks, duration }) => {
    if (rawRumEvent.type === "long_task") {
      history.add({
        id: rawRumEvent.long_task.id,
        startClocks,
        duration,
        entryType: rawRumEvent.long_task.entry_type === RumLongTaskEntryType.LONG_TASK ? RumPerformanceEntryType.LONG_TASK : RumPerformanceEntryType.LONG_ANIMATION_FRAME
      }, startClocks.relative).close(addDuration(startClocks.relative, duration));
    }
  });
  return history;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/profiling/actionHistory.js
var ACTION_ID_HISTORY_TIME_OUT_DELAY = SESSION_TIME_OUT_DELAY;
function createActionHistory(lifeCycle) {
  const history = createValueHistory({
    expireDelay: ACTION_ID_HISTORY_TIME_OUT_DELAY
  });
  lifeCycle.subscribe(15, (actionStart) => {
    history.add({
      id: actionStart.id,
      // The label is temporarily empty since we need to account for customers that might
      // redact the action name in the beforeSend callback. We will either try to do patch this
      // behavior, or remove the label field entirely.
      label: "",
      startClocks: actionStart.startClocks,
      duration: void 0
    }, actionStart.startClocks.relative);
  });
  lifeCycle.subscribe(12, ({ rawRumEvent, startClocks, duration }) => {
    if (rawRumEvent.type === "action") {
      const historyEntry = history.getEntries(startClocks.relative).find((entry) => entry.value.id === rawRumEvent.action.id);
      const durationForEntry = duration !== null && duration !== void 0 ? duration : 0;
      if (historyEntry) {
        historyEntry.value.duration = durationForEntry;
        historyEntry.close(addDuration(startClocks.relative, durationForEntry));
      } else {
        history.add({
          id: rawRumEvent.action.id,
          // The label is temporarily empty since we need to account for customers that might
          // redact the action name in the beforeSend callback. We will either try to do patch this
          // behavior, or remove the label field entirely.
          label: "",
          startClocks,
          duration
        }, startClocks.relative).close(addDuration(startClocks.relative, durationForEntry));
      }
    }
  });
  return history;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/profiling/vitalHistory.js
var VITAL_ID_HISTORY_TIME_OUT_DELAY = SESSION_TIME_OUT_DELAY;
function createVitalHistory(lifeCycle) {
  const history = createValueHistory({
    expireDelay: VITAL_ID_HISTORY_TIME_OUT_DELAY
  });
  lifeCycle.subscribe(16, (vitalStart) => {
    history.add({
      id: vitalStart.id,
      startClocks: vitalStart.startClocks,
      duration: void 0,
      label: vitalStart.name
    }, vitalStart.startClocks.relative);
  });
  lifeCycle.subscribe(12, ({ rawRumEvent, startClocks, duration }) => {
    if (rawRumEvent.type === "vital") {
      const historyEntry = history.getEntries(startClocks.relative).find((entry) => entry.value.id === rawRumEvent.vital.id);
      if (historyEntry) {
        historyEntry.value.duration = duration;
        historyEntry.close(addDuration(startClocks.relative, duration));
      } else {
        history.add({
          id: rawRumEvent.vital.id,
          startClocks,
          duration,
          label: rawRumEvent.vital.name
        }, startClocks.relative).close(addDuration(startClocks.relative, duration));
      }
    }
  });
  return history;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/profiling/profiler.js
var DEFAULT_RUM_PROFILER_CONFIGURATION = {
  sampleIntervalMs: 10,
  // Sample stack trace every 10ms
  collectIntervalMs: 6e4,
  // Collect data every minute
  minProfileDurationMs: 5e3,
  // Require at least 5 seconds of profile data to reduce noise and cost
  minNumberOfSamples: 50
  // Require at least 50 samples (~500 ms) to report a profile to reduce noise and cost
};
function createRumProfiler(configuration, lifeCycle, session, profilingContextManager, createEncoder, viewHistory, profilerConfiguration = DEFAULT_RUM_PROFILER_CONFIGURATION) {
  const transport = createFormDataTransport(
    configuration,
    lifeCycle,
    createEncoder,
    6
    /* DeflateEncoderStreamId.PROFILING */
  );
  let lastViewEntry;
  const globalCleanupTasks = [];
  const longTaskHistory = mockable(createLongTaskHistory)(lifeCycle);
  const actionHistory = mockable(createActionHistory)(lifeCycle);
  const vitalHistory = mockable(createVitalHistory)(lifeCycle);
  let instance = { state: "stopped", stateReason: "initializing" };
  lifeCycle.subscribe(9, () => {
    stopProfiling("session-expired");
  });
  lifeCycle.subscribe(10, () => {
    if (instance.state === "stopped" && instance.stateReason === "session-expired") {
      start();
    }
  });
  function start() {
    if (instance.state === "running") {
      return;
    }
    const viewEntry = viewHistory.findView();
    lastViewEntry = viewEntry ? {
      startClocks: viewEntry.startClocks,
      viewId: viewEntry.id,
      viewName: getCustomOrDefaultViewName(viewEntry.name, document.location.pathname)
    } : void 0;
    globalCleanupTasks.push(addEventListener(configuration, window, "visibilitychange", handleVisibilityChange).stop, addEventListener(configuration, window, "beforeunload", handleBeforeUnload).stop);
    startNextProfilerInstance();
  }
  function stop() {
    stopProfiling("stopped-by-user");
  }
  function stopProfiling(reason) {
    stopProfilerInstance(reason);
    globalCleanupTasks.forEach((task) => task());
    globalCleanupTasks.length = 0;
    profilingContextManager.set({ status: "stopped", error_reason: void 0 });
  }
  function addEventListeners(existingInstance) {
    if (existingInstance.state === "running") {
      return {
        cleanupTasks: existingInstance.cleanupTasks
      };
    }
    const cleanupTasks = [];
    const viewUpdatedSubscription = lifeCycle.subscribe(2, (view) => {
      const viewEntry = {
        viewId: view.id,
        // Note: `viewName` is only filled when users use manual view creation via `startView` method.
        viewName: getCustomOrDefaultViewName(view.name, document.location.pathname),
        startClocks: view.startClocks
      };
      collectViewEntry(viewEntry);
      lastViewEntry = viewEntry;
    });
    cleanupTasks.push(viewUpdatedSubscription.unsubscribe);
    return {
      cleanupTasks
    };
  }
  function startNextProfilerInstance() {
    const globalThisProfiler = getGlobalObject().Profiler;
    if (!globalThisProfiler) {
      profilingContextManager.set({ status: "error", error_reason: "not-supported-by-browser" });
      throw new Error("RUM Profiler is not supported in this browser.");
    }
    if (instance.state === "running") {
      collectProfilerInstance(instance);
    }
    const { cleanupTasks } = addEventListeners(instance);
    let profiler;
    try {
      profiler = new globalThisProfiler({
        sampleInterval: profilerConfiguration.sampleIntervalMs,
        // Keep buffer size at 1.5 times of minimum required to collect data for a profiling instance
        maxBufferSize: Math.round(profilerConfiguration.collectIntervalMs * 1.5 / profilerConfiguration.sampleIntervalMs)
      });
    } catch (e) {
      if (e instanceof Error && e.message.includes("disabled by Document Policy")) {
        display.warn("[DD_RUM] Profiler startup failed. Ensure your server includes the `Document-Policy: js-profiling` response header when serving HTML pages.", e);
        profilingContextManager.set({ status: "error", error_reason: "missing-document-policy-header" });
      } else {
        profilingContextManager.set({ status: "error", error_reason: "unexpected-exception" });
      }
      return;
    }
    profilingContextManager.set({ status: "running", error_reason: void 0 });
    instance = {
      state: "running",
      startClocks: clocksNow(),
      profiler,
      timeoutId: setTimeout(startNextProfilerInstance, profilerConfiguration.collectIntervalMs),
      views: [],
      cleanupTasks,
      longTasks: []
    };
    collectViewEntry(lastViewEntry);
    profiler.addEventListener("samplebufferfull", handleSampleBufferFull);
  }
  function collectProfilerInstance(runningInstance) {
    clearTimeout(runningInstance.timeoutId);
    runningInstance.profiler.removeEventListener("samplebufferfull", handleSampleBufferFull);
    const { startClocks, views } = runningInstance;
    runningInstance.profiler.stop().then((trace) => {
      const endClocks = clocksNow();
      const duration = elapsed(startClocks.relative, endClocks.relative);
      const longTasks = longTaskHistory.findAll(startClocks.relative, duration);
      const actions = actionHistory.findAll(startClocks.relative, duration);
      const vitals = vitalHistory.findAll(startClocks.relative, duration);
      const isBelowDurationThreshold = duration < profilerConfiguration.minProfileDurationMs;
      const isBelowSampleThreshold = getNumberOfSamples(trace.samples) < profilerConfiguration.minNumberOfSamples;
      if (longTasks.length === 0 && (isBelowDurationThreshold || isBelowSampleThreshold)) {
        return;
      }
      handleProfilerTrace(
        // Enrich trace with time and instance data
        Object.assign(trace, {
          startClocks,
          endClocks,
          clocksOrigin: clocksOrigin(),
          longTasks,
          actions,
          vitals,
          views,
          sampleInterval: profilerConfiguration.sampleIntervalMs
        })
      );
    }).catch(monitorError);
  }
  function stopProfilerInstance(stateReason) {
    if (instance.state !== "running") {
      if (
        // If paused, profiler data was already collected during pause, just update state
        instance.state === "paused" || // Update stateReason when already stopped and the user explicitly stops the profiler,
        // so that SESSION_RENEWED does not override the user's intent.
        instance.state === "stopped" && stateReason === "stopped-by-user"
      ) {
        instance = { state: "stopped", stateReason };
      }
      return;
    }
    const runningInstance = instance;
    instance = { state: "stopped", stateReason };
    runningInstance.cleanupTasks.forEach((cleanupTask) => cleanupTask());
    collectProfilerInstance(runningInstance);
  }
  function pauseProfilerInstance() {
    if (instance.state !== "running") {
      return;
    }
    const runningInstance = instance;
    instance = { state: "paused" };
    runningInstance.cleanupTasks.forEach((cleanupTask) => cleanupTask());
    collectProfilerInstance(runningInstance);
  }
  function collectViewEntry(viewEntry) {
    if (instance.state !== "running" || !viewEntry) {
      return;
    }
    instance.views.push(viewEntry);
  }
  function handleProfilerTrace(trace) {
    var _a;
    const sessionId = (_a = session.findTrackedSession()) === null || _a === void 0 ? void 0 : _a.id;
    const payload = assembleProfilingPayload(trace, configuration, sessionId);
    void transport.send(payload);
  }
  function handleSampleBufferFull() {
    startNextProfilerInstance();
  }
  function handleVisibilityChange() {
    if (document.visibilityState === "hidden" && instance.state === "running") {
      pauseProfilerInstance();
    } else if (document.visibilityState === "visible" && instance.state === "paused") {
      startNextProfilerInstance();
    }
  }
  function handleBeforeUnload() {
    startNextProfilerInstance();
  }
  function isStopped() {
    return instance.state === "stopped";
  }
  function isRunning() {
    return instance.state === "running";
  }
  function isPaused() {
    return instance.state === "paused";
  }
  return { start, stop, isStopped, isRunning, isPaused };
}
export {
  DEFAULT_RUM_PROFILER_CONFIGURATION,
  createRumProfiler
};
//# sourceMappingURL=profiler-PI3A7ZXG.js.map
