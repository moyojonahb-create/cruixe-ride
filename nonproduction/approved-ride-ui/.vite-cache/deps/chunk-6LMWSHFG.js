import {
  AbstractLifeCycle,
  ConsoleApiName,
  ContextManagerMethod,
  CustomerContextKey,
  DISCARDED,
  DefaultPrivacyLevel,
  ErrorSource,
  ExperimentalFeature,
  INTAKE_SITE_EU1,
  INTAKE_SITE_STAGING,
  INTAKE_SITE_US1,
  ONE_KIBI_BYTE,
  ONE_MINUTE,
  ONE_SECOND,
  Observable,
  PageExitReason,
  RawReportType,
  RequestType,
  ResourceType,
  SESSION_TIME_OUT_DELAY,
  SKIPPED,
  TraceContextInjection,
  abstractHooks,
  addDuration,
  addEventListener,
  addEventListeners,
  addTelemetryConfiguration,
  addTelemetryDebug,
  addTelemetryError,
  addTelemetryMetrics,
  addTelemetryUsage,
  bridgeSupports,
  buildAccountContextManager,
  buildEndpointHost,
  buildGlobalContextManager,
  buildTags,
  buildUrl,
  buildUserContextManager,
  callMonitored,
  canUseEventBridge,
  clearInterval,
  clearTimeout,
  clocksNow,
  clocksOrigin,
  combine,
  computeRawError,
  computeStackTrace,
  createBatch,
  createBoundedBuffer,
  createContextManager,
  createEventRateLimiter,
  createFlushController,
  createHandlingStack,
  createHttpRequest,
  createIdentityEncoder,
  createPageMayExitObservable,
  createTaskQueue,
  createTrackingConsentState,
  createValueHistory,
  currentDrift,
  dateNow,
  deepClone,
  defineContextMethod,
  display,
  displayAlreadyInitializedError,
  elapsed,
  fetch,
  findCommaSeparatedValue,
  findLast,
  generateUUID,
  getConnectivity,
  getCookie,
  getEventBridge,
  getInitCookie,
  getPathName,
  getRelativeTime,
  getSyntheticsContext,
  getTimeZone,
  getType,
  getZoneJsOriginalValue,
  initConsoleObservable,
  initFeatureFlags,
  initFetchObservable,
  initReportObservable,
  initXhrObservable,
  instrumentMethod,
  isEmptyObject,
  isExperimentalFeatureEnabled,
  isIndexableObject,
  isIntakeUrl,
  isMatchOption,
  isNonEmptyArray,
  isNumber,
  isSampleRate,
  isSyntheticsTest,
  isValidUrl,
  jsonStringify,
  looksLikeRelativeTime,
  makePublicApi,
  mapValues,
  matchList,
  mockable,
  monitor,
  monitorError,
  noop,
  objectEntries,
  objectHasValue,
  performDraw,
  relativeNow,
  relativeToClocks,
  round,
  runOnReadyState,
  safeTruncate,
  sanitize,
  sendToExtension,
  serializeConfiguration,
  setInterval,
  setTimeout,
  shallowClone,
  startAccountContext,
  startBufferingData,
  startGlobalContext,
  startSessionManager,
  startTelemetry,
  startUserContext,
  throttle,
  timeStampNow,
  timeStampToClocks,
  toServerDuration,
  tryJsonParse,
  validateAndBuildConfiguration,
  willSyntheticsInjectRum
} from "./chunk-4TAEVATQ.js";

// ../../node_modules/@datadog/browser-rum-core/esm/rawRumEvent.types.js
var RumEventType = {
  ACTION: "action",
  ERROR: "error",
  LONG_TASK: "long_task",
  VIEW: "view",
  RESOURCE: "resource",
  VITAL: "vital"
};
var RumLongTaskEntryType = {
  LONG_TASK: "long-task",
  LONG_ANIMATION_FRAME: "long-animation-frame"
};
var ViewLoadingType = {
  INITIAL_LOAD: "initial_load",
  ROUTE_CHANGE: "route_change",
  BF_CACHE: "bf_cache"
};
var ActionType = {
  CLICK: "click",
  CUSTOM: "custom",
  TAP: "tap",
  SCROLL: "scroll",
  SWIPE: "swipe",
  APPLICATION_START: "application_start",
  BACK: "back"
};
var FrustrationType = {
  RAGE_CLICK: "rage_click",
  ERROR_CLICK: "error_click",
  DEAD_CLICK: "dead_click"
};
var VitalType = {
  DURATION: "duration",
  OPERATION_STEP: "operation_step"
};

// ../../node_modules/@datadog/browser-rum-core/esm/domain/vital/vitalCollection.js
function createCustomVitalsState() {
  const vitalsByName = /* @__PURE__ */ new Map();
  const vitalsByReference = /* @__PURE__ */ new WeakMap();
  return { vitalsByName, vitalsByReference };
}
function startVitalCollection(lifeCycle, pageStateHistory, customVitalsState) {
  function isValid(vital) {
    return !pageStateHistory.wasInPageStateDuringPeriod("frozen", vital.startClocks.relative, vital.duration);
  }
  function addDurationVital(vital) {
    if (isValid(vital)) {
      lifeCycle.notify(12, processVital(vital));
    }
  }
  function addOperationStepVital(name, stepType, options, failureReason) {
    if (!isExperimentalFeatureEnabled(ExperimentalFeature.FEATURE_OPERATION_VITAL)) {
      return;
    }
    const { operationKey, context, description, handlingStack } = options || {};
    const vital = {
      name,
      type: VitalType.OPERATION_STEP,
      operationKey,
      failureReason,
      stepType,
      startClocks: clocksNow(),
      context: sanitize(context),
      description,
      handlingStack
    };
    lifeCycle.notify(12, processVital(vital));
  }
  return {
    addOperationStepVital,
    addDurationVital,
    startDurationVital: (name, options = {}) => {
      const ref = startDurationVital(customVitalsState, name, options);
      const vitalState = customVitalsState.vitalsByReference.get(ref);
      if (vitalState) {
        lifeCycle.notify(16, vitalState);
      }
      return ref;
    },
    stopDurationVital: (nameOrRef, options = {}) => {
      stopDurationVital(addDurationVital, customVitalsState, nameOrRef, options);
    }
  };
}
function startDurationVital({ vitalsByName, vitalsByReference }, name, options = {}) {
  const vital = {
    id: generateUUID(),
    name,
    startClocks: clocksNow(),
    ...options
  };
  const reference = { __dd_vital_reference: true };
  vitalsByName.set(name, vital);
  vitalsByReference.set(reference, vital);
  return reference;
}
function stopDurationVital(stopCallback, { vitalsByName, vitalsByReference }, nameOrRef, options = {}) {
  const vitalStart = typeof nameOrRef === "string" ? vitalsByName.get(nameOrRef) : vitalsByReference.get(nameOrRef);
  if (!vitalStart) {
    return;
  }
  stopCallback(buildDurationVital(vitalStart, vitalStart.startClocks, options, clocksNow()));
  if (typeof nameOrRef === "string") {
    vitalsByName.delete(nameOrRef);
  } else {
    vitalsByReference.delete(nameOrRef);
  }
}
function buildDurationVital(vitalStart, startClocks, stopOptions, stopClocks) {
  var _a;
  return {
    id: vitalStart.id,
    name: vitalStart.name,
    type: VitalType.DURATION,
    startClocks,
    duration: elapsed(startClocks.timeStamp, stopClocks.timeStamp),
    context: combine(vitalStart.context, stopOptions.context),
    description: (_a = stopOptions.description) !== null && _a !== void 0 ? _a : vitalStart.description,
    handlingStack: vitalStart.handlingStack
  };
}
function processVital(vital) {
  const { startClocks, type, name, description, context, handlingStack } = vital;
  const vitalId = vital.type === VitalType.DURATION ? vital.id : void 0;
  const vitalData = {
    id: vitalId !== null && vitalId !== void 0 ? vitalId : generateUUID(),
    type,
    name,
    description,
    ...type === VitalType.DURATION ? { duration: toServerDuration(vital.duration) } : {
      step_type: vital.stepType,
      operation_key: vital.operationKey,
      failure_reason: vital.failureReason
    }
  };
  return {
    rawRumEvent: {
      date: startClocks.timeStamp,
      vital: vitalData,
      type: RumEventType.VITAL,
      context
    },
    startClocks,
    duration: type === VitalType.DURATION ? vital.duration : void 0,
    domainContext: handlingStack ? { handlingStack } : {}
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/plugins.js
function callPluginsMethod(plugins, methodName, parameter) {
  if (!plugins) {
    return;
  }
  for (const plugin of plugins) {
    const method = plugin[methodName];
    if (method) {
      method(parameter);
    }
  }
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/hooks.js
var createHooks = abstractHooks;

// ../../node_modules/@datadog/browser-rum-core/esm/domain/configuration/configuration.js
var DEFAULT_PROPAGATOR_TYPES = ["tracecontext", "datadog"];
function validateAndBuildRumConfiguration(initConfiguration, errorStack) {
  var _a, _b, _c, _d, _e, _f, _g;
  if (initConfiguration.trackFeatureFlagsForEvents !== void 0 && !Array.isArray(initConfiguration.trackFeatureFlagsForEvents)) {
    display.warn("trackFeatureFlagsForEvents should be an array");
  }
  if (!initConfiguration.applicationId) {
    display.error("Application ID is not configured, no RUM data will be collected.");
    return;
  }
  if (!isSampleRate(initConfiguration.sessionReplaySampleRate, "Session Replay") || !isSampleRate(initConfiguration.traceSampleRate, "Trace")) {
    return;
  }
  if (initConfiguration.excludedActivityUrls !== void 0 && !Array.isArray(initConfiguration.excludedActivityUrls)) {
    display.error("Excluded Activity Urls should be an array");
    return;
  }
  const allowedTracingUrls = validateAndBuildTracingOptions(initConfiguration);
  if (!allowedTracingUrls) {
    return;
  }
  const baseConfiguration = validateAndBuildConfiguration(initConfiguration, errorStack);
  const allowedGraphQlUrls = validateAndBuildGraphQlOptions(initConfiguration);
  if (!baseConfiguration) {
    return;
  }
  const sessionReplaySampleRate = (_a = initConfiguration.sessionReplaySampleRate) !== null && _a !== void 0 ? _a : 0;
  return {
    applicationId: initConfiguration.applicationId,
    actionNameAttribute: initConfiguration.actionNameAttribute,
    betaTrackActionsInShadowDom: !!initConfiguration.betaTrackActionsInShadowDom,
    sessionReplaySampleRate,
    startSessionReplayRecordingManually: initConfiguration.startSessionReplayRecordingManually !== void 0 ? !!initConfiguration.startSessionReplayRecordingManually : sessionReplaySampleRate === 0,
    traceSampleRate: (_b = initConfiguration.traceSampleRate) !== null && _b !== void 0 ? _b : 100,
    rulePsr: isNumber(initConfiguration.traceSampleRate) ? initConfiguration.traceSampleRate / 100 : void 0,
    allowedTracingUrls,
    excludedActivityUrls: (_c = initConfiguration.excludedActivityUrls) !== null && _c !== void 0 ? _c : [],
    workerUrl: initConfiguration.workerUrl,
    compressIntakeRequests: !!initConfiguration.compressIntakeRequests,
    trackUserInteractions: !!((_d = initConfiguration.trackUserInteractions) !== null && _d !== void 0 ? _d : true),
    trackViewsManually: !!initConfiguration.trackViewsManually,
    trackResources: !!((_e = initConfiguration.trackResources) !== null && _e !== void 0 ? _e : true),
    trackLongTasks: !!((_f = initConfiguration.trackLongTasks) !== null && _f !== void 0 ? _f : true),
    trackBfcacheViews: !!initConfiguration.trackBfcacheViews,
    trackEarlyRequests: !!initConfiguration.trackEarlyRequests,
    subdomain: initConfiguration.subdomain,
    defaultPrivacyLevel: objectHasValue(DefaultPrivacyLevel, initConfiguration.defaultPrivacyLevel) ? initConfiguration.defaultPrivacyLevel : DefaultPrivacyLevel.MASK,
    enablePrivacyForActionName: !!initConfiguration.enablePrivacyForActionName,
    traceContextInjection: objectHasValue(TraceContextInjection, initConfiguration.traceContextInjection) ? initConfiguration.traceContextInjection : TraceContextInjection.SAMPLED,
    plugins: initConfiguration.plugins || [],
    trackFeatureFlagsForEvents: initConfiguration.trackFeatureFlagsForEvents || [],
    profilingSampleRate: (_g = initConfiguration.profilingSampleRate) !== null && _g !== void 0 ? _g : 0,
    propagateTraceBaggage: !!initConfiguration.propagateTraceBaggage,
    allowedGraphQlUrls,
    ...baseConfiguration
  };
}
function validateAndBuildTracingOptions(initConfiguration) {
  if (initConfiguration.allowedTracingUrls === void 0) {
    return [];
  }
  if (!Array.isArray(initConfiguration.allowedTracingUrls)) {
    display.error("Allowed Tracing URLs should be an array");
    return;
  }
  if (initConfiguration.allowedTracingUrls.length !== 0 && initConfiguration.service === void 0) {
    display.error("Service needs to be configured when tracing is enabled");
    return;
  }
  const tracingOptions = [];
  initConfiguration.allowedTracingUrls.forEach((option) => {
    const normalizedOption = normalizeTracingOption(option);
    if (normalizedOption) {
      tracingOptions.push(normalizedOption);
    } else {
      display.warn("Allowed Tracing Urls parameters should be a string, RegExp, function, or an object. Ignoring parameter", option);
    }
  });
  return tracingOptions;
}
function getSelectedTracingPropagators(configuration) {
  const usedTracingPropagators = /* @__PURE__ */ new Set();
  if (isNonEmptyArray(configuration.allowedTracingUrls)) {
    configuration.allowedTracingUrls.forEach((option) => {
      var _a;
      (_a = normalizeTracingOption(option)) === null || _a === void 0 ? void 0 : _a.propagatorTypes.forEach((propagatorType) => usedTracingPropagators.add(propagatorType));
    });
  }
  return Array.from(usedTracingPropagators);
}
function normalizeTracingOption(option) {
  if (isMatchOption(option)) {
    return { match: option, propagatorTypes: DEFAULT_PROPAGATOR_TYPES };
  }
  if (isIndexableObject(option) && isMatchOption(option.match) && (option.propagatorTypes === null || option.propagatorTypes === void 0 || Array.isArray(option.propagatorTypes))) {
    return {
      match: option.match,
      propagatorTypes: option.propagatorTypes || DEFAULT_PROPAGATOR_TYPES
    };
  }
}
function validateAndBuildGraphQlOptions(initConfiguration) {
  if (!initConfiguration.allowedGraphQlUrls) {
    return [];
  }
  if (!Array.isArray(initConfiguration.allowedGraphQlUrls)) {
    display.warn("allowedGraphQlUrls should be an array");
    return [];
  }
  const graphQlOptions = [];
  initConfiguration.allowedGraphQlUrls.forEach((option) => {
    if (isMatchOption(option)) {
      graphQlOptions.push({ match: option, trackPayload: false, trackResponseErrors: false });
    } else if (isIndexableObject(option) && isMatchOption(option.match)) {
      graphQlOptions.push({
        match: option.match,
        trackPayload: !!option.trackPayload,
        trackResponseErrors: !!option.trackResponseErrors
      });
    }
  });
  return graphQlOptions;
}
function hasGraphQlPayloadTracking(allowedGraphQlUrls) {
  return isNonEmptyArray(allowedGraphQlUrls) && allowedGraphQlUrls.some((option) => isIndexableObject(option) && option.trackPayload);
}
function hasGraphQlResponseErrorsTracking(allowedGraphQlUrls) {
  return isNonEmptyArray(allowedGraphQlUrls) && allowedGraphQlUrls.some((option) => isIndexableObject(option) && option.trackResponseErrors);
}
function serializeRumConfiguration(configuration) {
  var _a;
  const baseSerializedConfiguration = serializeConfiguration(configuration);
  return {
    session_replay_sample_rate: configuration.sessionReplaySampleRate,
    start_session_replay_recording_manually: configuration.startSessionReplayRecordingManually,
    trace_sample_rate: configuration.traceSampleRate,
    trace_context_injection: configuration.traceContextInjection,
    propagate_trace_baggage: configuration.propagateTraceBaggage,
    action_name_attribute: configuration.actionNameAttribute,
    use_allowed_tracing_urls: isNonEmptyArray(configuration.allowedTracingUrls),
    use_allowed_graph_ql_urls: isNonEmptyArray(configuration.allowedGraphQlUrls),
    use_track_graph_ql_payload: hasGraphQlPayloadTracking(configuration.allowedGraphQlUrls),
    use_track_graph_ql_response_errors: hasGraphQlResponseErrorsTracking(configuration.allowedGraphQlUrls),
    selected_tracing_propagators: getSelectedTracingPropagators(configuration),
    default_privacy_level: configuration.defaultPrivacyLevel,
    enable_privacy_for_action_name: configuration.enablePrivacyForActionName,
    use_excluded_activity_urls: isNonEmptyArray(configuration.excludedActivityUrls),
    use_worker_url: !!configuration.workerUrl,
    compress_intake_requests: configuration.compressIntakeRequests,
    track_views_manually: configuration.trackViewsManually,
    track_user_interactions: configuration.trackUserInteractions,
    track_resources: configuration.trackResources,
    track_long_task: configuration.trackLongTasks,
    track_bfcache_views: configuration.trackBfcacheViews,
    track_early_requests: configuration.trackEarlyRequests,
    plugins: (_a = configuration.plugins) === null || _a === void 0 ? void 0 : _a.map((plugin) => {
      var _a2;
      return {
        name: plugin.name,
        ...(_a2 = plugin.getConfigurationTelemetry) === null || _a2 === void 0 ? void 0 : _a2.call(plugin)
      };
    }),
    track_feature_flags_for_events: configuration.trackFeatureFlagsForEvents,
    remote_configuration_id: configuration.remoteConfigurationId,
    profiling_sample_rate: configuration.profilingSampleRate,
    use_remote_configuration_proxy: !!configuration.remoteConfigurationProxy,
    ...baseSerializedConfiguration
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/configuration/jsonPathParser.js
function parseJsonPath(path) {
  const selectors = [];
  let previousToken = 0;
  let currentToken;
  const parsingContext = { quote: void 0, escapeSequence: void 0 };
  let currentSelector = "";
  for (const char of path) {
    currentToken = ALLOWED_NEXT_TOKENS[previousToken].find((token) => TOKEN_PREDICATE[token](char, parsingContext));
    if (!currentToken) {
      return [];
    }
    if (parsingContext.escapeSequence !== void 0 && currentToken !== 12) {
      if (!isValidEscapeSequence(parsingContext.escapeSequence)) {
        return [];
      }
      currentSelector += resolveEscapeSequence(parsingContext.escapeSequence);
      parsingContext.escapeSequence = void 0;
    }
    if (ALLOWED_SELECTOR_TOKENS.includes(currentToken)) {
      currentSelector += char;
    } else if (ALLOWED_SELECTOR_DELIMITER_TOKENS.includes(currentToken) && currentSelector !== "") {
      selectors.push(currentSelector);
      currentSelector = "";
    } else if (currentToken === 12) {
      parsingContext.escapeSequence = parsingContext.escapeSequence ? `${parsingContext.escapeSequence}${char}` : char;
    } else if (currentToken === 8) {
      parsingContext.quote = char;
    } else if (currentToken === 9) {
      parsingContext.quote = void 0;
    }
    previousToken = currentToken;
  }
  if (!ALLOWED_NEXT_TOKENS[previousToken].includes(
    1
    /* Token.END */
  )) {
    return [];
  }
  if (currentSelector !== "") {
    selectors.push(currentSelector);
  }
  return selectors;
}
var NAME_SHORTHAND_FIRST_CHAR_REGEX = /[a-zA-Z_$]/;
var NAME_SHORTHAND_CHAR_REGEX = /[a-zA-Z0-9_$]/;
var DIGIT_REGEX = /[0-9]/;
var UNICODE_CHAR_REGEX = /[a-fA-F0-9]/;
var QUOTE_CHARS = `'"`;
var TOKEN_PREDICATE = {
  // no char should match to START or END
  [
    0
    /* Token.START */
  ]: () => false,
  [
    1
    /* Token.END */
  ]: () => false,
  [
    2
    /* Token.NAME_SHORTHAND_FIRST_CHAR */
  ]: (char) => NAME_SHORTHAND_FIRST_CHAR_REGEX.test(char),
  [
    3
    /* Token.NAME_SHORTHAND_CHAR */
  ]: (char) => NAME_SHORTHAND_CHAR_REGEX.test(char),
  [
    4
    /* Token.DOT */
  ]: (char) => char === ".",
  [
    5
    /* Token.BRACKET_START */
  ]: (char) => char === "[",
  [
    6
    /* Token.BRACKET_END */
  ]: (char) => char === "]",
  [
    7
    /* Token.DIGIT */
  ]: (char) => DIGIT_REGEX.test(char),
  [
    8
    /* Token.QUOTE_START */
  ]: (char) => QUOTE_CHARS.includes(char),
  [
    9
    /* Token.QUOTE_END */
  ]: (char, parsingContext) => char === parsingContext.quote,
  [
    10
    /* Token.NAME_SELECTOR_CHAR */
  ]: () => true,
  // any char can be used in name selector
  [
    11
    /* Token.ESCAPE */
  ]: (char) => char === "\\",
  [
    12
    /* Token.ESCAPE_SEQUENCE_CHAR */
  ]: (char, parsingContext) => {
    if (parsingContext.escapeSequence === void 0) {
      return `${parsingContext.quote}/\\bfnrtu`.includes(char);
    } else if (parsingContext.escapeSequence.startsWith("u") && parsingContext.escapeSequence.length < 5) {
      return UNICODE_CHAR_REGEX.test(char);
    }
    return false;
  }
};
var ALLOWED_NEXT_TOKENS = {
  [
    0
    /* Token.START */
  ]: [
    2,
    5
    /* Token.BRACKET_START */
  ],
  [
    1
    /* Token.END */
  ]: [],
  [
    2
    /* Token.NAME_SHORTHAND_FIRST_CHAR */
  ]: [
    3,
    4,
    5,
    1
    /* Token.END */
  ],
  [
    3
    /* Token.NAME_SHORTHAND_CHAR */
  ]: [
    3,
    4,
    5,
    1
    /* Token.END */
  ],
  [
    4
    /* Token.DOT */
  ]: [
    2
    /* Token.NAME_SHORTHAND_FIRST_CHAR */
  ],
  [
    5
    /* Token.BRACKET_START */
  ]: [
    8,
    7
    /* Token.DIGIT */
  ],
  [
    6
    /* Token.BRACKET_END */
  ]: [
    4,
    5,
    1
    /* Token.END */
  ],
  [
    7
    /* Token.DIGIT */
  ]: [
    7,
    6
    /* Token.BRACKET_END */
  ],
  [
    8
    /* Token.QUOTE_START */
  ]: [
    11,
    9,
    10
    /* Token.NAME_SELECTOR_CHAR */
  ],
  [
    9
    /* Token.QUOTE_END */
  ]: [
    6
    /* Token.BRACKET_END */
  ],
  [
    10
    /* Token.NAME_SELECTOR_CHAR */
  ]: [
    11,
    9,
    10
    /* Token.NAME_SELECTOR_CHAR */
  ],
  [
    11
    /* Token.ESCAPE */
  ]: [
    12
    /* Token.ESCAPE_SEQUENCE_CHAR */
  ],
  [
    12
    /* Token.ESCAPE_SEQUENCE_CHAR */
  ]: [
    12,
    11,
    9,
    10
    /* Token.NAME_SELECTOR_CHAR */
  ]
};
var ALLOWED_SELECTOR_TOKENS = [
  2,
  3,
  7,
  10
];
var ALLOWED_SELECTOR_DELIMITER_TOKENS = [
  4,
  5,
  6
  /* Token.BRACKET_END */
];
function isValidEscapeSequence(escapeSequence) {
  return `"'/\\bfnrt`.includes(escapeSequence) || escapeSequence.startsWith("u") && escapeSequence.length === 5;
}
var ESCAPED_CHARS = {
  '"': '"',
  "'": "'",
  "/": "/",
  "\\": "\\",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "	"
};
function resolveEscapeSequence(escapeSequence) {
  if (escapeSequence.startsWith("u")) {
    return String.fromCharCode(parseInt(escapeSequence.slice(1), 16));
  }
  return ESCAPED_CHARS[escapeSequence];
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/configuration/remoteConfiguration.js
var REMOTE_CONFIGURATION_VERSION = "v1";
var SUPPORTED_FIELDS = [
  "applicationId",
  "service",
  "env",
  "version",
  "sessionSampleRate",
  "sessionReplaySampleRate",
  "defaultPrivacyLevel",
  "enablePrivacyForActionName",
  "traceSampleRate",
  "trackSessionAcrossSubdomains",
  "allowedTracingUrls",
  "allowedTrackingOrigins"
];
async function fetchAndApplyRemoteConfiguration(initConfiguration, supportedContextManagers) {
  let rumInitConfiguration;
  const metrics = initMetrics();
  const fetchResult = await fetchRemoteConfiguration(initConfiguration);
  if (!fetchResult.ok) {
    metrics.increment("fetch", "failure");
    display.error(fetchResult.error);
  } else {
    metrics.increment("fetch", "success");
    rumInitConfiguration = applyRemoteConfiguration(initConfiguration, fetchResult.value, supportedContextManagers, metrics);
  }
  addTelemetryMetrics("remote configuration metrics", { metrics: metrics.get() });
  return rumInitConfiguration;
}
function applyRemoteConfiguration(initConfiguration, rumRemoteConfiguration, supportedContextManagers, metrics) {
  const appliedConfiguration = { ...initConfiguration };
  SUPPORTED_FIELDS.forEach((option) => {
    if (option in rumRemoteConfiguration) {
      appliedConfiguration[option] = resolveConfigurationProperty(rumRemoteConfiguration[option]);
    }
  });
  Object.keys(supportedContextManagers).forEach((context) => {
    if (rumRemoteConfiguration[context] !== void 0) {
      resolveContextProperty(supportedContextManagers[context], rumRemoteConfiguration[context]);
    }
  });
  return appliedConfiguration;
  function resolveConfigurationProperty(property) {
    if (Array.isArray(property)) {
      return property.map(resolveConfigurationProperty);
    }
    if (isIndexableObject(property)) {
      if (isSerializedOption(property)) {
        const type = property.rcSerializedType;
        switch (type) {
          case "string":
            return property.value;
          case "regex":
            return resolveRegex(property.value);
          case "dynamic":
            return resolveDynamicOption(property);
          default:
            display.error(`Unsupported remote configuration: "rcSerializedType": "${type}"`);
            return;
        }
      }
      return mapValues(property, resolveConfigurationProperty);
    }
    return property;
  }
  function resolveContextProperty(contextManager, contextItems) {
    contextItems.forEach(({ key, value }) => {
      contextManager.setContextProperty(key, resolveConfigurationProperty(value));
    });
  }
  function resolveDynamicOption(property) {
    const strategy = property.strategy;
    let resolvedValue;
    switch (strategy) {
      case "cookie":
        resolvedValue = resolveCookieValue(property);
        break;
      case "dom":
        resolvedValue = resolveDomValue(property);
        break;
      case "js":
        resolvedValue = resolveJsValue(property);
        break;
      case "localStorage":
        resolvedValue = resolveLocalStorageValue(property);
        break;
      default:
        display.error(`Unsupported remote configuration: "strategy": "${strategy}"`);
        return;
    }
    const extractor = property.extractor;
    if (extractor !== void 0 && typeof resolvedValue === "string") {
      return extractValue(extractor, resolvedValue);
    }
    return resolvedValue;
  }
  function resolveCookieValue({ name }) {
    const value = getCookie(name);
    metrics.increment("cookie", value !== void 0 ? "success" : "missing");
    return value;
  }
  function resolveLocalStorageValue({ key }) {
    let value;
    try {
      value = localStorage.getItem(key);
    } catch (_a) {
      metrics.increment("localStorage", "failure");
      return;
    }
    metrics.increment("localStorage", value !== null ? "success" : "missing");
    return value !== null && value !== void 0 ? value : void 0;
  }
  function resolveDomValue({ selector, attribute }) {
    let element;
    try {
      element = document.querySelector(selector);
    } catch (_a) {
      display.error(`Invalid selector in the remote configuration: '${selector}'`);
      metrics.increment("dom", "failure");
      return;
    }
    if (!element) {
      metrics.increment("dom", "missing");
      return;
    }
    if (isForbidden(element, attribute)) {
      display.error(`Forbidden element selected by the remote configuration: '${selector}'`);
      metrics.increment("dom", "failure");
      return;
    }
    const domValue = attribute !== void 0 ? element.getAttribute(attribute) : element.textContent;
    if (domValue === null) {
      metrics.increment("dom", "missing");
      return;
    }
    metrics.increment("dom", "success");
    return domValue;
  }
  function isForbidden(element, attribute) {
    return element.getAttribute("type") === "password" && attribute === "value";
  }
  function resolveJsValue({ path }) {
    let current = window;
    const pathParts = parseJsonPath(path);
    if (pathParts.length === 0) {
      display.error(`Invalid JSON path in the remote configuration: '${path}'`);
      metrics.increment("js", "failure");
      return;
    }
    for (const pathPart of pathParts) {
      if (!(pathPart in current)) {
        metrics.increment("js", "missing");
        return;
      }
      try {
        current = current[pathPart];
      } catch (e) {
        display.error(`Error accessing: '${path}'`, e);
        metrics.increment("js", "failure");
        return;
      }
    }
    metrics.increment("js", "success");
    return current;
  }
}
function initMetrics() {
  const metrics = { fetch: {} };
  return {
    get: () => metrics,
    increment: (metricName, type) => {
      if (!metrics[metricName]) {
        metrics[metricName] = {};
      }
      if (!metrics[metricName][type]) {
        metrics[metricName][type] = 0;
      }
      metrics[metricName][type] = metrics[metricName][type] + 1;
    }
  };
}
function isSerializedOption(value) {
  return "rcSerializedType" in value;
}
function resolveRegex(pattern) {
  try {
    return new RegExp(pattern);
  } catch (_a) {
    display.error(`Invalid regex in the remote configuration: '${pattern}'`);
  }
}
function extractValue(extractor, candidate) {
  const resolvedExtractor = resolveRegex(extractor.value);
  if (resolvedExtractor === void 0) {
    return;
  }
  const regexResult = resolvedExtractor.exec(candidate);
  if (regexResult === null) {
    return;
  }
  const [match, capture] = regexResult;
  return capture ? capture : match;
}
async function fetchRemoteConfiguration(configuration) {
  let response;
  try {
    response = await fetch(buildEndpoint(configuration));
  } catch (_a) {
    response = void 0;
  }
  if (!response || !response.ok) {
    return {
      ok: false,
      error: new Error("Error fetching the remote configuration.")
    };
  }
  const remoteConfiguration = await response.json();
  if (remoteConfiguration.rum) {
    return {
      ok: true,
      value: remoteConfiguration.rum
    };
  }
  return {
    ok: false,
    error: new Error("No remote configuration for RUM.")
  };
}
function buildEndpoint(configuration) {
  if (configuration.remoteConfigurationProxy) {
    return configuration.remoteConfigurationProxy;
  }
  return `https://sdk-configuration.${buildEndpointHost("rum", configuration)}/${REMOTE_CONFIGURATION_VERSION}/${encodeURIComponent(configuration.remoteConfigurationId)}.json`;
}

// ../../node_modules/@datadog/browser-rum-core/esm/boot/preStartRum.js
function createPreStartStrategy({ ignoreInitIfSyntheticsWillInjectRum = true, startDeflateWorker }, trackingConsentState, customVitalsState, doStartRum) {
  const bufferApiCalls = createBoundedBuffer();
  const globalContext = buildGlobalContextManager();
  bufferContextCalls(globalContext, CustomerContextKey.globalContext, bufferApiCalls);
  const userContext = buildUserContextManager();
  bufferContextCalls(userContext, CustomerContextKey.userContext, bufferApiCalls);
  const accountContext = buildAccountContextManager();
  bufferContextCalls(accountContext, CustomerContextKey.accountContext, bufferApiCalls);
  let firstStartViewCall;
  let deflateWorker;
  let cachedInitConfiguration;
  let cachedConfiguration;
  let telemetry;
  const hooks = createHooks();
  const trackingConsentStateSubscription = trackingConsentState.observable.subscribe(tryStartRum);
  const emptyContext = {};
  function tryStartRum() {
    if (!cachedInitConfiguration || !cachedConfiguration || !trackingConsentState.isGranted()) {
      return;
    }
    if (!telemetry) {
      telemetry = mockable(startTelemetry)("browser-rum-sdk", cachedConfiguration, hooks);
    }
    trackingConsentStateSubscription.unsubscribe();
    let initialViewOptions;
    if (cachedConfiguration.trackViewsManually) {
      if (!firstStartViewCall) {
        return;
      }
      bufferApiCalls.remove(firstStartViewCall.callback);
      initialViewOptions = firstStartViewCall.options;
    }
    const startRumResult = doStartRum(cachedConfiguration, deflateWorker, initialViewOptions, telemetry, hooks);
    bufferApiCalls.drain(startRumResult);
  }
  function doInit(initConfiguration, errorStack) {
    const eventBridgeAvailable = canUseEventBridge();
    if (eventBridgeAvailable) {
      initConfiguration = overrideInitConfigurationForBridge(initConfiguration);
    }
    cachedInitConfiguration = initConfiguration;
    addTelemetryConfiguration(serializeRumConfiguration(initConfiguration));
    if (cachedConfiguration) {
      displayAlreadyInitializedError("DD_RUM", initConfiguration);
      return;
    }
    const configuration = validateAndBuildRumConfiguration(initConfiguration, errorStack);
    if (!configuration) {
      return;
    }
    if (!eventBridgeAvailable && !configuration.sessionStoreStrategyType) {
      display.warn("No storage available for session. We will not send any data.");
      return;
    }
    if (configuration.compressIntakeRequests && !eventBridgeAvailable && startDeflateWorker) {
      deflateWorker = startDeflateWorker(
        configuration,
        "Datadog RUM",
        // Worker initialization can fail asynchronously, especially in Firefox where even CSP
        // issues are reported asynchronously. For now, the SDK will continue its execution even if
        // data won't be sent to Datadog. We could improve this behavior in the future.
        noop
      );
      if (!deflateWorker) {
        return;
      }
    }
    cachedConfiguration = configuration;
    initFetchObservable().subscribe(noop);
    trackingConsentState.tryToInit(configuration.trackingConsent);
    tryStartRum();
  }
  const addDurationVital = (vital) => {
    bufferApiCalls.add((startRumResult) => startRumResult.addDurationVital(vital));
  };
  const addOperationStepVital = (name, stepType, options, failureReason) => {
    bufferApiCalls.add((startRumResult) => startRumResult.addOperationStepVital(sanitize(name), stepType, sanitize(options), sanitize(failureReason)));
  };
  const strategy = {
    init(initConfiguration, publicApi, errorStack) {
      if (!initConfiguration) {
        display.error("Missing configuration");
        return;
      }
      initFeatureFlags(initConfiguration.enableExperimentalFeatures);
      cachedInitConfiguration = initConfiguration;
      if (ignoreInitIfSyntheticsWillInjectRum && willSyntheticsInjectRum()) {
        return;
      }
      callPluginsMethod(initConfiguration.plugins, "onInit", { initConfiguration, publicApi });
      if (initConfiguration.remoteConfigurationId) {
        fetchAndApplyRemoteConfiguration(initConfiguration, { user: userContext, context: globalContext }).then((initConfiguration2) => {
          if (initConfiguration2) {
            doInit(initConfiguration2, errorStack);
          }
        }).catch(monitorError);
      } else {
        doInit(initConfiguration, errorStack);
      }
    },
    get initConfiguration() {
      return cachedInitConfiguration;
    },
    getInternalContext: noop,
    stopSession: noop,
    addTiming(name, time = timeStampNow()) {
      bufferApiCalls.add((startRumResult) => startRumResult.addTiming(name, time));
    },
    setLoadingTime: (callTimestamp) => {
      bufferApiCalls.add((startRumResult) => startRumResult.setLoadingTime(callTimestamp));
    },
    startView(options, startClocks = clocksNow()) {
      const callback = (startRumResult) => {
        startRumResult.startView(options, startClocks);
      };
      bufferApiCalls.add(callback);
      if (!firstStartViewCall) {
        firstStartViewCall = { options, callback };
        tryStartRum();
      }
    },
    setViewName(name) {
      bufferApiCalls.add((startRumResult) => startRumResult.setViewName(name));
    },
    // View context APIs
    setViewContext(context) {
      bufferApiCalls.add((startRumResult) => startRumResult.setViewContext(context));
    },
    setViewContextProperty(key, value) {
      bufferApiCalls.add((startRumResult) => startRumResult.setViewContextProperty(key, value));
    },
    getViewContext: () => emptyContext,
    globalContext,
    userContext,
    accountContext,
    addAction(action) {
      bufferApiCalls.add((startRumResult) => startRumResult.addAction(action));
    },
    startAction(name, options) {
      const startClocks = clocksNow();
      bufferApiCalls.add((startRumResult) => startRumResult.startAction(name, options, startClocks));
    },
    stopAction(name, options) {
      const stopClocks = clocksNow();
      bufferApiCalls.add((startRumResult) => startRumResult.stopAction(name, options, stopClocks));
    },
    startResource(url, options) {
      const startClocks = clocksNow();
      bufferApiCalls.add((startRumResult) => startRumResult.startResource(url, options, startClocks));
    },
    stopResource(url, options) {
      const stopClocks = clocksNow();
      bufferApiCalls.add((startRumResult) => startRumResult.stopResource(url, options, stopClocks));
    },
    addError(providedError) {
      bufferApiCalls.add((startRumResult) => startRumResult.addError(providedError));
    },
    addFeatureFlagEvaluation(key, value) {
      bufferApiCalls.add((startRumResult) => startRumResult.addFeatureFlagEvaluation(key, value));
    },
    startDurationVital(name, options) {
      return startDurationVital(customVitalsState, name, options);
    },
    stopDurationVital(name, options) {
      stopDurationVital(addDurationVital, customVitalsState, name, options);
    },
    addDurationVital,
    addOperationStepVital
  };
  return strategy;
}
function overrideInitConfigurationForBridge(initConfiguration) {
  var _a, _b;
  return {
    ...initConfiguration,
    applicationId: "00000000-aaaa-0000-aaaa-000000000000",
    clientToken: "empty",
    sessionSampleRate: 100,
    defaultPrivacyLevel: (_a = initConfiguration.defaultPrivacyLevel) !== null && _a !== void 0 ? _a : (_b = getEventBridge()) === null || _b === void 0 ? void 0 : _b.getPrivacyLevel()
  };
}
function bufferContextCalls(preStartContextManager, name, bufferApiCalls) {
  preStartContextManager.changeObservable.subscribe(() => {
    const context = preStartContextManager.getContext();
    bufferApiCalls.add((startRumResult) => startRumResult[name].setContext(context));
  });
}

// ../../node_modules/@datadog/browser-rum-core/esm/browser/domMutationObservable.js
function createDOMMutationObservable() {
  const MutationObserver = getMutationObserverConstructor();
  return new Observable((observable) => {
    if (!MutationObserver) {
      return;
    }
    const observer2 = new MutationObserver(monitor((records) => observable.notify(records)));
    observer2.observe(document, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true
    });
    return () => observer2.disconnect();
  });
}
function getMutationObserverConstructor() {
  let constructor;
  const browserWindow = window;
  if (browserWindow.Zone) {
    constructor = getZoneJsOriginalValue(browserWindow, "MutationObserver");
    if (browserWindow.MutationObserver && constructor === browserWindow.MutationObserver) {
      const patchedInstance = new browserWindow.MutationObserver(noop);
      const originalInstance = getZoneJsOriginalValue(patchedInstance, "originalInstance");
      constructor = originalInstance && originalInstance.constructor;
    }
  }
  if (!constructor) {
    constructor = browserWindow.MutationObserver;
  }
  return constructor;
}

// ../../node_modules/@datadog/browser-rum-core/esm/browser/windowOpenObservable.js
function createWindowOpenObservable() {
  const observable = new Observable();
  const { stop } = instrumentMethod(window, "open", () => observable.notify());
  return { observable, stop };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/contexts/internalContext.js
function startInternalContext(applicationId, sessionManager, viewHistory, actionContexts, urlContexts) {
  return {
    get: (startTime) => {
      const viewContext = viewHistory.findView(startTime);
      const urlContext = urlContexts.findUrl(startTime);
      const session = sessionManager.findTrackedSession(startTime);
      if (session && viewContext && urlContext) {
        const actionId = actionContexts.findActionId(startTime);
        return {
          application_id: applicationId,
          session_id: session.id,
          user_action: actionId ? { id: actionId } : void 0,
          view: { id: viewContext.id, name: viewContext.name, referrer: urlContext.referrer, url: urlContext.url }
        };
      }
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/lifeCycle.js
var LifeCycle = AbstractLifeCycle;

// ../../node_modules/@datadog/browser-rum-core/esm/domain/contexts/viewHistory.js
var VIEW_CONTEXT_TIME_OUT_DELAY = SESSION_TIME_OUT_DELAY;
function startViewHistory(lifeCycle) {
  const viewValueHistory = createValueHistory({ expireDelay: VIEW_CONTEXT_TIME_OUT_DELAY });
  lifeCycle.subscribe(1, (view) => {
    viewValueHistory.add(buildViewHistoryEntry(view), view.startClocks.relative);
  });
  lifeCycle.subscribe(6, ({ endClocks }) => {
    viewValueHistory.closeActive(endClocks.relative);
  });
  lifeCycle.subscribe(3, (viewUpdate) => {
    const currentView = viewValueHistory.find(viewUpdate.startClocks.relative);
    if (!currentView) {
      return;
    }
    if (viewUpdate.name) {
      currentView.name = viewUpdate.name;
    }
    if (viewUpdate.context) {
      currentView.context = viewUpdate.context;
    }
    currentView.sessionIsActive = viewUpdate.sessionIsActive;
  });
  lifeCycle.subscribe(10, () => {
    viewValueHistory.reset();
  });
  function buildViewHistoryEntry(view) {
    return {
      service: view.service,
      version: view.version,
      context: view.context,
      id: view.id,
      name: view.name,
      startClocks: view.startClocks
    };
  }
  return {
    findView: (startTime) => viewValueHistory.find(startTime),
    stop: () => {
      viewValueHistory.stop();
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/resource/resourceUtils.js
var FAKE_INITIAL_DOCUMENT = "initial_document";
var RESOURCE_TYPES = [
  [ResourceType.DOCUMENT, (initiatorType) => FAKE_INITIAL_DOCUMENT === initiatorType],
  [ResourceType.XHR, (initiatorType) => "xmlhttprequest" === initiatorType],
  [ResourceType.FETCH, (initiatorType) => "fetch" === initiatorType],
  [ResourceType.BEACON, (initiatorType) => "beacon" === initiatorType],
  [ResourceType.CSS, (_, path) => /\.css$/i.test(path)],
  [ResourceType.JS, (_, path) => /\.js$/i.test(path)],
  [
    ResourceType.IMAGE,
    (initiatorType, path) => ["image", "img", "icon"].includes(initiatorType) || /\.(gif|jpg|jpeg|tiff|png|svg|ico)$/i.exec(path) !== null
  ],
  [ResourceType.FONT, (_, path) => /\.(woff|eot|woff2|ttf)$/i.exec(path) !== null],
  [
    ResourceType.MEDIA,
    (initiatorType, path) => ["audio", "video"].includes(initiatorType) || /\.(mp3|mp4)$/i.exec(path) !== null
  ]
];
function computeResourceEntryType(entry) {
  const url = entry.name;
  if (!isValidUrl(url)) {
    return ResourceType.OTHER;
  }
  const path = getPathName(url);
  for (const [type, isType] of RESOURCE_TYPES) {
    if (isType(entry.initiatorType, path)) {
      return type;
    }
  }
  return ResourceType.OTHER;
}
function areInOrder(...numbers) {
  for (let i = 1; i < numbers.length; i += 1) {
    if (numbers[i - 1] > numbers[i]) {
      return false;
    }
  }
  return true;
}
function isResourceEntryRequestType(entry) {
  return entry.initiatorType === "xmlhttprequest" || entry.initiatorType === "fetch";
}
function computeResourceEntryDuration(entry) {
  const { duration, startTime, responseEnd } = entry;
  if (duration === 0 && startTime < responseEnd) {
    return elapsed(startTime, responseEnd);
  }
  return duration;
}
function computeResourceEntryDetails(entry) {
  if (!hasValidResourceEntryTimings(entry)) {
    return void 0;
  }
  const { startTime, fetchStart, workerStart, redirectStart, redirectEnd, domainLookupStart, domainLookupEnd, connectStart, secureConnectionStart, connectEnd, requestStart, responseStart, responseEnd } = entry;
  const details = {
    download: formatTiming(startTime, responseStart, responseEnd),
    first_byte: formatTiming(startTime, requestStart, responseStart)
  };
  if (0 < workerStart && workerStart < fetchStart) {
    details.worker = formatTiming(startTime, workerStart, fetchStart);
  }
  if (fetchStart < connectEnd) {
    details.connect = formatTiming(startTime, connectStart, connectEnd);
    if (connectStart <= secureConnectionStart && secureConnectionStart <= connectEnd) {
      details.ssl = formatTiming(startTime, secureConnectionStart, connectEnd);
    }
  }
  if (fetchStart < domainLookupEnd) {
    details.dns = formatTiming(startTime, domainLookupStart, domainLookupEnd);
  }
  if (startTime < redirectEnd) {
    details.redirect = formatTiming(startTime, redirectStart, redirectEnd);
  }
  return details;
}
function hasValidResourceEntryDuration(entry) {
  return entry.duration >= 0;
}
function hasValidResourceEntryTimings(entry) {
  const areCommonTimingsInOrder = areInOrder(entry.startTime, entry.fetchStart, entry.domainLookupStart, entry.domainLookupEnd, entry.connectStart, entry.connectEnd, entry.requestStart, entry.responseStart, entry.responseEnd);
  const areRedirectionTimingsInOrder = hasRedirection(entry) ? areInOrder(entry.startTime, entry.redirectStart, entry.redirectEnd, entry.fetchStart) : true;
  return areCommonTimingsInOrder && areRedirectionTimingsInOrder;
}
function hasRedirection(entry) {
  return entry.redirectEnd > entry.startTime;
}
function formatTiming(origin, start, end) {
  if (origin <= start && start <= end) {
    return {
      duration: toServerDuration(elapsed(start, end)),
      start: toServerDuration(elapsed(origin, start))
    };
  }
}
function computeResourceEntryProtocol(entry) {
  return entry.nextHopProtocol === "" ? void 0 : entry.nextHopProtocol;
}
function computeResourceEntryDeliveryType(entry) {
  return entry.deliveryType === "" ? "other" : entry.deliveryType;
}
function computeResourceEntrySize(entry) {
  if (entry.startTime < entry.responseStart) {
    const { encodedBodySize, decodedBodySize, transferSize } = entry;
    return {
      size: decodedBodySize,
      encoded_body_size: encodedBodySize,
      decoded_body_size: decodedBodySize,
      transfer_size: transferSize
    };
  }
  return {
    size: void 0,
    encoded_body_size: void 0,
    decoded_body_size: void 0,
    transfer_size: void 0
  };
}
function isAllowedRequestUrl(url) {
  return url && (!isIntakeUrl(url) || isExperimentalFeatureEnabled(ExperimentalFeature.TRACK_INTAKE_REQUESTS));
}
var DATA_URL_REGEX = /data:(.+)?(;base64)?,/g;
var MAX_RESOURCE_VALUE_CHAR_LENGTH = 24e3;
function sanitizeIfLongDataUrl(url, lengthLimit = MAX_RESOURCE_VALUE_CHAR_LENGTH) {
  if (url.length <= lengthLimit || !url.startsWith("data:")) {
    return url;
  }
  const dataUrlMatchArray = url.substring(0, 100).match(DATA_URL_REGEX);
  if (!dataUrlMatchArray) {
    return url;
  }
  return `${dataUrlMatchArray[0]}[...]`;
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/sampler/sampler.js
var sampleDecisionCache = /* @__PURE__ */ new Map();
function isSampled(sessionId, sampleRate) {
  if (sampleRate === 100) {
    return true;
  }
  if (sampleRate === 0) {
    return false;
  }
  const cachedDecision = sampleDecisionCache.get(sampleRate);
  if (cachedDecision && sessionId === cachedDecision.sessionId) {
    return cachedDecision.decision;
  }
  let decision;
  if (window.BigInt) {
    decision = sampleUsingKnuthFactor(BigInt(`0x${sessionId.split("-")[4]}`), sampleRate);
  } else {
    decision = performDraw(sampleRate);
  }
  sampleDecisionCache.set(sampleRate, { sessionId, decision });
  return decision;
}
function sampleUsingKnuthFactor(identifier, sampleRate) {
  const knuthFactor = BigInt("1111111111111111111");
  const twoPow64 = BigInt("0x10000000000000000");
  const hash = identifier * knuthFactor % twoPow64;
  return Number(hash) <= sampleRate / 100 * Number(twoPow64);
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/tracing/identifier.js
function createTraceIdentifier() {
  return createIdentifier(64);
}
function createSpanIdentifier() {
  return createIdentifier(63);
}
function createIdentifier(bits) {
  const buffer = crypto.getRandomValues(new Uint32Array(2));
  if (bits === 63) {
    buffer[buffer.length - 1] >>>= 1;
  }
  return {
    toString(radix = 10) {
      let high = buffer[1];
      let low = buffer[0];
      let str = "";
      do {
        const mod = high % radix * 4294967296 + low;
        high = Math.floor(high / radix);
        low = Math.floor(mod / radix);
        str = (mod % radix).toString(radix) + str;
      } while (high || low);
      return str;
    }
  };
}
function toPaddedHexadecimalString(id) {
  return id.toString(16).padStart(16, "0");
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/tracing/tracer.js
function clearTracingIfNeeded(context) {
  if (context.status === 0 && !context.isAborted) {
    context.traceId = void 0;
    context.spanId = void 0;
    context.traceSampled = void 0;
  }
}
function startTracer(configuration, sessionManager, userContext, accountContext) {
  return {
    clearTracingIfNeeded,
    traceFetch: (context) => injectHeadersIfTracingAllowed(configuration, context, sessionManager, userContext, accountContext, (tracingHeaders) => {
      var _a;
      if (context.input instanceof Request && !((_a = context.init) === null || _a === void 0 ? void 0 : _a.headers)) {
        context.input = new Request(context.input);
        Object.keys(tracingHeaders).forEach((key) => {
          ;
          context.input.headers.append(key, tracingHeaders[key]);
        });
      } else {
        context.init = shallowClone(context.init);
        const headers = [];
        if (context.init.headers instanceof Headers) {
          context.init.headers.forEach((value, key) => {
            headers.push([key, value]);
          });
        } else if (Array.isArray(context.init.headers)) {
          context.init.headers.forEach((header) => {
            headers.push(header);
          });
        } else if (context.init.headers) {
          Object.keys(context.init.headers).forEach((key) => {
            headers.push([key, context.init.headers[key]]);
          });
        }
        context.init.headers = headers.concat(objectEntries(tracingHeaders));
      }
    }),
    traceXhr: (context, xhr) => injectHeadersIfTracingAllowed(configuration, context, sessionManager, userContext, accountContext, (tracingHeaders) => {
      Object.keys(tracingHeaders).forEach((name) => {
        xhr.setRequestHeader(name, tracingHeaders[name]);
      });
    })
  };
}
function injectHeadersIfTracingAllowed(configuration, context, sessionManager, userContext, accountContext, inject) {
  const session = sessionManager.findTrackedSession();
  if (!session) {
    return;
  }
  const tracingOption = configuration.allowedTracingUrls.find((tracingOption2) => matchList([tracingOption2.match], context.url, true));
  if (!tracingOption) {
    return;
  }
  const traceSampled = isSampled(session.id, configuration.traceSampleRate);
  const shouldInjectHeaders = traceSampled || configuration.traceContextInjection === TraceContextInjection.ALL;
  if (!shouldInjectHeaders) {
    return;
  }
  context.traceSampled = traceSampled;
  context.traceId = createTraceIdentifier();
  context.spanId = createSpanIdentifier();
  inject(makeTracingHeaders(context.traceId, context.spanId, context.traceSampled, session.id, tracingOption.propagatorTypes, userContext, accountContext, configuration));
}
function makeTracingHeaders(traceId, spanId, traceSampled, sessionId, propagatorTypes, userContext, accountContext, configuration) {
  const tracingHeaders = {};
  propagatorTypes.forEach((propagatorType) => {
    switch (propagatorType) {
      case "datadog": {
        Object.assign(tracingHeaders, {
          "x-datadog-origin": "rum",
          "x-datadog-parent-id": spanId.toString(),
          "x-datadog-sampling-priority": traceSampled ? "1" : "0",
          "x-datadog-trace-id": traceId.toString()
        });
        break;
      }
      case "tracecontext": {
        Object.assign(tracingHeaders, {
          traceparent: `00-0000000000000000${toPaddedHexadecimalString(traceId)}-${toPaddedHexadecimalString(spanId)}-0${traceSampled ? "1" : "0"}`,
          tracestate: `dd=s:${traceSampled ? "1" : "0"};o:rum`
        });
        break;
      }
      case "b3": {
        Object.assign(tracingHeaders, {
          b3: `${toPaddedHexadecimalString(traceId)}-${toPaddedHexadecimalString(spanId)}-${traceSampled ? "1" : "0"}`
        });
        break;
      }
      case "b3multi": {
        Object.assign(tracingHeaders, {
          "X-B3-TraceId": toPaddedHexadecimalString(traceId),
          "X-B3-SpanId": toPaddedHexadecimalString(spanId),
          "X-B3-Sampled": traceSampled ? "1" : "0"
        });
        break;
      }
    }
  });
  if (configuration.propagateTraceBaggage) {
    const baggageItems = {
      "session.id": sessionId
    };
    const userId = userContext.getContext().id;
    if (typeof userId === "string") {
      baggageItems["user.id"] = userId;
    }
    const accountId = accountContext.getContext().id;
    if (typeof accountId === "string") {
      baggageItems["account.id"] = accountId;
    }
    const baggageHeader = Object.entries(baggageItems).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join(",");
    if (baggageHeader) {
      tracingHeaders["baggage"] = baggageHeader;
    }
  }
  return tracingHeaders;
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/resource/graphql.js
var GRAPHQL_PAYLOAD_LIMIT = 32 * ONE_KIBI_BYTE;
function extractGraphQlMetadata(request, graphQlConfig) {
  const metadata = extractGraphQlRequestMetadata(request, graphQlConfig.trackPayload);
  if (!metadata) {
    return;
  }
  if (graphQlConfig.trackResponseErrors && request.responseBody) {
    const responseErrors = parseGraphQlResponse(request.responseBody);
    if (responseErrors) {
      metadata.error_count = responseErrors.length;
      metadata.errors = responseErrors;
    }
  }
  return metadata;
}
function parseGraphQlResponse(responseText) {
  const response = tryJsonParse(responseText);
  if (!response || typeof response !== "object") {
    return;
  }
  const responseObj = response;
  if (!isNonEmptyArray(responseObj.errors)) {
    return;
  }
  const errors = responseObj.errors.map((error) => {
    var _a;
    const graphqlError = {
      message: error.message,
      path: error.path,
      locations: error.locations,
      code: (_a = error.extensions) === null || _a === void 0 ? void 0 : _a.code
    };
    return graphqlError;
  });
  return errors;
}
function findGraphQlConfiguration(url, configuration) {
  return configuration.allowedGraphQlUrls.find((graphQlOption) => matchList([graphQlOption.match], url));
}
function extractGraphQlRequestMetadata(request, trackPayload = false) {
  let rawMetadata;
  if (request.method === "POST") {
    rawMetadata = extractFromBody(request.requestBody);
  } else if (request.method === "GET") {
    rawMetadata = extractFromUrlQueryParams(request.url);
  }
  if (!rawMetadata) {
    return;
  }
  return sanitizeGraphQlMetadata(rawMetadata, trackPayload);
}
function extractFromBody(requestBody) {
  if (!requestBody || typeof requestBody !== "string") {
    return;
  }
  const graphqlBody = tryJsonParse(requestBody);
  if (!graphqlBody) {
    return;
  }
  return {
    query: graphqlBody.query,
    operationName: graphqlBody.operationName,
    variables: graphqlBody.variables ? JSON.stringify(graphqlBody.variables) : void 0
  };
}
function extractFromUrlQueryParams(url) {
  const searchParams = buildUrl(url).searchParams;
  const variablesParam = searchParams.get("variables");
  const variables = variablesParam && tryJsonParse(variablesParam) !== void 0 ? variablesParam : void 0;
  return {
    query: searchParams.get("query") || void 0,
    operationName: searchParams.get("operationName") || void 0,
    variables
  };
}
function sanitizeGraphQlMetadata(rawMetadata, trackPayload) {
  let operationType;
  let payload;
  let variables;
  if (rawMetadata.query) {
    const trimmedQuery = rawMetadata.query.trim();
    operationType = getOperationType(trimmedQuery);
    if (trackPayload) {
      payload = safeTruncate(trimmedQuery, GRAPHQL_PAYLOAD_LIMIT, "...");
    }
  }
  if (rawMetadata.variables) {
    variables = rawMetadata.variables;
  }
  return {
    operationType,
    operationName: rawMetadata.operationName,
    variables,
    payload
  };
}
function getOperationType(query) {
  var _a;
  return (_a = query.match(/^\s*(query|mutation|subscription)\b/i)) === null || _a === void 0 ? void 0 : _a[1];
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/requestCollection.js
var nextRequestIndex = 1;
function startRequestCollection(lifeCycle, configuration, sessionManager, userContext, accountContext) {
  const tracer = startTracer(configuration, sessionManager, userContext, accountContext);
  trackXhr(lifeCycle, configuration, tracer);
  trackFetch(lifeCycle, configuration, tracer);
}
function trackXhr(lifeCycle, configuration, tracer) {
  const subscription = initXhrObservable(configuration).subscribe((rawContext) => {
    const context = rawContext;
    if (!isAllowedRequestUrl(context.url)) {
      return;
    }
    switch (context.state) {
      case "start":
        tracer.traceXhr(context, context.xhr);
        context.requestIndex = getNextRequestIndex();
        lifeCycle.notify(7, {
          requestIndex: context.requestIndex,
          url: context.url
        });
        break;
      case "complete":
        tracer.clearTracingIfNeeded(context);
        lifeCycle.notify(8, {
          ...context,
          type: RequestType.XHR,
          isAbortedOnStart: false
        });
        break;
    }
  });
  return { stop: () => subscription.unsubscribe() };
}
function trackFetch(lifeCycle, configuration, tracer) {
  const subscription = initFetchObservable({
    responseBodyAction: (context) => {
      var _a;
      if ((_a = findGraphQlConfiguration(context.url, configuration)) === null || _a === void 0 ? void 0 : _a.trackResponseErrors) {
        return 2;
      }
      return 1;
    }
  }).subscribe((rawContext) => {
    var _a;
    const context = rawContext;
    if (!isAllowedRequestUrl(context.url)) {
      return;
    }
    switch (context.state) {
      case "start":
        tracer.traceFetch(context);
        context.requestIndex = getNextRequestIndex();
        lifeCycle.notify(7, {
          requestIndex: context.requestIndex,
          url: context.url
        });
        break;
      case "resolve":
        tracer.clearTracingIfNeeded(context);
        lifeCycle.notify(8, {
          ...context,
          duration: elapsed(context.startClocks.timeStamp, timeStampNow()),
          type: RequestType.FETCH,
          requestBody: (_a = context.init) === null || _a === void 0 ? void 0 : _a.body
        });
        break;
    }
  });
  return { stop: () => subscription.unsubscribe() };
}
function getNextRequestIndex() {
  const result = nextRequestIndex;
  nextRequestIndex += 1;
  return result;
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/discardNegativeDuration.js
function discardNegativeDuration(duration) {
  return isNumber(duration) && duration < 0 ? void 0 : duration;
}

// ../../node_modules/@datadog/browser-rum-core/esm/browser/htmlDomUtils.js
function isTextNode(node) {
  return node.nodeType === Node.TEXT_NODE;
}
function isCommentNode(node) {
  return node.nodeType === Node.COMMENT_NODE;
}
function isElementNode(node) {
  return node.nodeType === Node.ELEMENT_NODE;
}
function isNodeShadowHost(node) {
  return isElementNode(node) && Boolean(node.shadowRoot);
}
function isNodeShadowRoot(node) {
  const shadowRoot = node;
  return !!shadowRoot.host && shadowRoot.nodeType === Node.DOCUMENT_FRAGMENT_NODE && isElementNode(shadowRoot.host);
}
function hasChildNodes(node) {
  return node.childNodes.length > 0 || isNodeShadowHost(node);
}
function forEachChildNodes(node, callback) {
  let child = node.firstChild;
  while (child) {
    callback(child);
    child = child.nextSibling;
  }
  if (isNodeShadowHost(node)) {
    callback(node.shadowRoot);
  }
}
function getParentNode(node) {
  return isNodeShadowRoot(node) ? node.host : node.parentNode;
}
function getParentElement(element) {
  if (element.parentElement) {
    return element.parentElement;
  }
  const parentNode = element.parentNode;
  if (parentNode && isNodeShadowRoot(parentNode)) {
    return parentNode.host;
  }
  return null;
}

// ../../node_modules/@datadog/browser-rum-core/esm/browser/firstInputPolyfill.js
function retrieveFirstInputTiming(configuration, callback) {
  const startTimeStamp = dateNow();
  let timingSent = false;
  const { stop: removeEventListeners } = addEventListeners(configuration, window, [
    "click",
    "mousedown",
    "keydown",
    "touchstart",
    "pointerdown"
    /* DOM_EVENT.POINTER_DOWN */
  ], (evt) => {
    if (!evt.cancelable) {
      return;
    }
    const timing = {
      entryType: "first-input",
      processingStart: relativeNow(),
      processingEnd: relativeNow(),
      startTime: evt.timeStamp,
      duration: 0,
      // arbitrary value to avoid nullable duration and simplify INP logic
      name: "",
      cancelable: false,
      target: null,
      toJSON: () => ({})
    };
    if (evt.type === "pointerdown") {
      sendTimingIfPointerIsNotCancelled(configuration, timing);
    } else {
      sendTiming(timing);
    }
  }, { passive: true, capture: true });
  return { stop: removeEventListeners };
  function sendTimingIfPointerIsNotCancelled(configuration2, timing) {
    addEventListeners(configuration2, window, [
      "pointerup",
      "pointercancel"
      /* DOM_EVENT.POINTER_CANCEL */
    ], (event) => {
      if (event.type === "pointerup") {
        sendTiming(timing);
      }
    }, { once: true });
  }
  function sendTiming(timing) {
    if (!timingSent) {
      timingSent = true;
      removeEventListeners();
      const delay = timing.processingStart - timing.startTime;
      if (delay >= 0 && delay < dateNow() - startTimeStamp) {
        callback(timing);
      }
    }
  }
}

// ../../node_modules/@datadog/browser-rum-core/esm/browser/performanceObservable.js
var RumPerformanceEntryType;
(function(RumPerformanceEntryType2) {
  RumPerformanceEntryType2["EVENT"] = "event";
  RumPerformanceEntryType2["FIRST_INPUT"] = "first-input";
  RumPerformanceEntryType2["LARGEST_CONTENTFUL_PAINT"] = "largest-contentful-paint";
  RumPerformanceEntryType2["LAYOUT_SHIFT"] = "layout-shift";
  RumPerformanceEntryType2["LONG_TASK"] = "longtask";
  RumPerformanceEntryType2["LONG_ANIMATION_FRAME"] = "long-animation-frame";
  RumPerformanceEntryType2["NAVIGATION"] = "navigation";
  RumPerformanceEntryType2["PAINT"] = "paint";
  RumPerformanceEntryType2["RESOURCE"] = "resource";
  RumPerformanceEntryType2["VISIBILITY_STATE"] = "visibility-state";
})(RumPerformanceEntryType || (RumPerformanceEntryType = {}));
function createPerformanceObservable(configuration, options) {
  return new Observable((observable) => {
    if (!window.PerformanceObserver) {
      return;
    }
    const handlePerformanceEntries = (entries) => {
      const rumPerformanceEntries = filterRumPerformanceEntries(entries);
      if (rumPerformanceEntries.length > 0) {
        observable.notify(rumPerformanceEntries);
      }
    };
    let timeoutId;
    let isObserverInitializing = true;
    const observer2 = new PerformanceObserver(monitor((entries) => {
      if (isObserverInitializing) {
        timeoutId = setTimeout(() => handlePerformanceEntries(entries.getEntries()));
      } else {
        handlePerformanceEntries(entries.getEntries());
      }
    }));
    try {
      observer2.observe(options);
    } catch (_a) {
      const fallbackSupportedEntryTypes = [
        RumPerformanceEntryType.RESOURCE,
        RumPerformanceEntryType.NAVIGATION,
        RumPerformanceEntryType.LONG_TASK,
        RumPerformanceEntryType.PAINT
      ];
      if (fallbackSupportedEntryTypes.includes(options.type)) {
        if (options.buffered) {
          timeoutId = setTimeout(() => handlePerformanceEntries(performance.getEntriesByType(options.type)));
        }
        try {
          observer2.observe({ entryTypes: [options.type] });
        } catch (_b) {
          return;
        }
      }
    }
    isObserverInitializing = false;
    manageResourceTimingBufferFull(configuration);
    let stopFirstInputTiming;
    if (!supportPerformanceTimingEvent(RumPerformanceEntryType.FIRST_INPUT) && options.type === RumPerformanceEntryType.FIRST_INPUT) {
      ;
      ({ stop: stopFirstInputTiming } = retrieveFirstInputTiming(configuration, (timing) => {
        handlePerformanceEntries([timing]);
      }));
    }
    return () => {
      observer2.disconnect();
      if (stopFirstInputTiming) {
        stopFirstInputTiming();
      }
      clearTimeout(timeoutId);
    };
  });
}
var resourceTimingBufferFullListener;
function manageResourceTimingBufferFull(configuration) {
  if (!resourceTimingBufferFullListener && supportPerformanceObject() && "addEventListener" in performance) {
    resourceTimingBufferFullListener = addEventListener(configuration, performance, "resourcetimingbufferfull", () => {
      performance.clearResourceTimings();
    });
  }
  return () => {
    resourceTimingBufferFullListener === null || resourceTimingBufferFullListener === void 0 ? void 0 : resourceTimingBufferFullListener.stop();
  };
}
function supportPerformanceObject() {
  return window.performance !== void 0 && "getEntries" in performance;
}
function supportPerformanceTimingEvent(entryType) {
  return window.PerformanceObserver && PerformanceObserver.supportedEntryTypes !== void 0 && PerformanceObserver.supportedEntryTypes.includes(entryType);
}
function filterRumPerformanceEntries(entries) {
  return entries.filter((entry) => !isForbiddenResource(entry));
}
function isForbiddenResource(entry) {
  return entry.entryType === RumPerformanceEntryType.RESOURCE && (!isAllowedRequestUrl(entry.name) || !hasValidResourceEntryDuration(entry));
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/waitPageActivityEnd.js
var PAGE_ACTIVITY_VALIDATION_DELAY = 100;
var PAGE_ACTIVITY_END_DELAY = 100;
var EXCLUDED_MUTATIONS_ATTRIBUTE = "data-dd-excluded-activity-mutations";
function waitPageActivityEnd(lifeCycle, domMutationObservable, windowOpenObservable, configuration, pageActivityEndCallback, maxDuration) {
  const pageActivityObservable = mockable(createPageActivityObservable)(lifeCycle, domMutationObservable, windowOpenObservable, configuration);
  let pageActivityEndTimeoutId;
  let hasCompleted = false;
  const validationTimeoutId = setTimeout(monitor(() => complete({ hadActivity: false })), PAGE_ACTIVITY_VALIDATION_DELAY);
  const maxDurationTimeoutId = maxDuration !== void 0 ? setTimeout(monitor(() => complete({ hadActivity: true, end: timeStampNow() })), maxDuration) : void 0;
  const pageActivitySubscription = pageActivityObservable.subscribe(({ isBusy }) => {
    clearTimeout(validationTimeoutId);
    clearTimeout(pageActivityEndTimeoutId);
    const lastChangeTime = timeStampNow();
    if (!isBusy) {
      pageActivityEndTimeoutId = setTimeout(monitor(() => complete({ hadActivity: true, end: lastChangeTime })), PAGE_ACTIVITY_END_DELAY);
    }
  });
  const stop = () => {
    hasCompleted = true;
    clearTimeout(validationTimeoutId);
    clearTimeout(pageActivityEndTimeoutId);
    clearTimeout(maxDurationTimeoutId);
    pageActivitySubscription.unsubscribe();
  };
  function complete(event) {
    if (hasCompleted) {
      return;
    }
    stop();
    pageActivityEndCallback(event);
  }
  return { stop };
}
function createPageActivityObservable(lifeCycle, domMutationObservable, windowOpenObservable, configuration) {
  return new Observable((observable) => {
    const subscriptions = [];
    let firstRequestIndex;
    let pendingRequestsCount = 0;
    subscriptions.push(domMutationObservable.subscribe((mutations) => {
      if (!mutations.every(isExcludedMutation)) {
        notifyPageActivity();
      }
    }), windowOpenObservable.subscribe(notifyPageActivity), createPerformanceObservable(configuration, { type: RumPerformanceEntryType.RESOURCE }).subscribe((entries) => {
      if (entries.some((entry) => !isExcludedUrl(configuration, entry.name))) {
        notifyPageActivity();
      }
    }), lifeCycle.subscribe(7, (startEvent) => {
      if (isExcludedUrl(configuration, startEvent.url)) {
        return;
      }
      if (firstRequestIndex === void 0) {
        firstRequestIndex = startEvent.requestIndex;
      }
      pendingRequestsCount += 1;
      notifyPageActivity();
    }), lifeCycle.subscribe(8, (request) => {
      if (isExcludedUrl(configuration, request.url) || firstRequestIndex === void 0 || // If the request started before the tracking start, ignore it
      request.requestIndex < firstRequestIndex) {
        return;
      }
      pendingRequestsCount -= 1;
      notifyPageActivity();
    }));
    return () => {
      subscriptions.forEach((s) => s.unsubscribe());
    };
    function notifyPageActivity() {
      observable.notify({ isBusy: pendingRequestsCount > 0 });
    }
  });
}
function isExcludedUrl(configuration, requestUrl) {
  return matchList(configuration.excludedActivityUrls, requestUrl);
}
function isExcludedMutation(mutation) {
  const targetElement = mutation.type === "characterData" ? mutation.target.parentElement : mutation.target;
  return Boolean(targetElement && isElementNode(targetElement) && targetElement.matches(`[${EXCLUDED_MUTATIONS_ATTRIBUTE}], [${EXCLUDED_MUTATIONS_ATTRIBUTE}] *`));
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/action/actionNameConstants.js
var DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE = "data-dd-action-name";
var ACTION_NAME_PLACEHOLDER = "Masked Element";

// ../../node_modules/@datadog/browser-rum-core/esm/domain/getSelectorFromElement.js
var SHADOW_DOM_MARKER = "::shadow ";
var STABLE_ATTRIBUTES = [
  DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE,
  // Common test attributes (list provided by google recorder)
  "data-testid",
  "data-test",
  "data-qa",
  "data-cy",
  "data-test-id",
  "data-qa-id",
  "data-testing",
  // FullStory decorator attributes:
  "data-component",
  "data-element",
  "data-source-file"
];
var GLOBALLY_UNIQUE_SELECTOR_GETTERS = [getStableAttributeSelector, getIDSelector];
var UNIQUE_AMONG_CHILDREN_SELECTOR_GETTERS = [
  getStableAttributeSelector,
  getClassSelector,
  getTagNameSelector
];
function getSelectorFromElement(targetElement, actionNameAttribute) {
  if (!targetElement.isConnected) {
    return;
  }
  const subtrees = getAllSubtreeTargets(targetElement);
  const selectorParts = [];
  for (const { rootNode, target } of subtrees) {
    const selector = getSelectorFromElementWithinSubtree(target, rootNode, actionNameAttribute);
    if (!selector) {
      return void 0;
    }
    selectorParts.push(selector);
  }
  return selectorParts.join(SHADOW_DOM_MARKER);
}
function getAllSubtreeTargets(element) {
  const result = [];
  let currentTarget = element;
  while (currentTarget) {
    const rootNode = currentTarget.getRootNode();
    result.push({ rootNode, target: currentTarget });
    if (isNodeShadowRoot(rootNode)) {
      currentTarget = rootNode.host;
    } else {
      break;
    }
  }
  return result.reverse();
}
function getSelectorFromElementWithinSubtree(targetElement, rootNode, actionNameAttribute) {
  let currentSelector;
  let currentElement = targetElement;
  while (currentElement && currentElement.nodeName !== "HTML") {
    const globallyUniqueSelector = findSelector(currentElement, rootNode, GLOBALLY_UNIQUE_SELECTOR_GETTERS, isSelectorUniqueWithinRoot, actionNameAttribute, currentSelector);
    if (globallyUniqueSelector) {
      return combineSelector(globallyUniqueSelector, currentSelector);
    }
    const uniqueSelectorAmongChildren = findSelector(currentElement, rootNode, UNIQUE_AMONG_CHILDREN_SELECTOR_GETTERS, isSelectorUniqueAmongSiblings, actionNameAttribute, currentSelector);
    const elementSelector = uniqueSelectorAmongChildren || getPositionSelector(currentElement);
    currentSelector = combineSelector(elementSelector, currentSelector);
    currentElement = currentElement.parentElement;
  }
  return currentSelector;
}
function isGeneratedValue(value) {
  return /[0-9]/.test(value);
}
function getIDSelector(element) {
  if (element.id && !isGeneratedValue(element.id)) {
    return `#${CSS.escape(element.id)}`;
  }
}
function getClassSelector(element) {
  if (element.tagName === "BODY") {
    return;
  }
  const classList = element.classList;
  for (let i = 0; i < classList.length; i += 1) {
    const className = classList[i];
    if (isGeneratedValue(className)) {
      continue;
    }
    return `${CSS.escape(element.tagName)}.${CSS.escape(className)}`;
  }
}
function getTagNameSelector(element) {
  return CSS.escape(element.tagName);
}
function getStableAttributeSelector(element, actionNameAttribute) {
  if (actionNameAttribute) {
    const selector = getAttributeSelector(actionNameAttribute);
    if (selector) {
      return selector;
    }
  }
  for (const attributeName of STABLE_ATTRIBUTES) {
    const selector = getAttributeSelector(attributeName);
    if (selector) {
      return selector;
    }
  }
  function getAttributeSelector(attributeName) {
    if (element.hasAttribute(attributeName)) {
      return `${CSS.escape(element.tagName)}${getAttributeValueSelector(attributeName, element.getAttribute(attributeName))}`;
    }
  }
}
function getAttributeValueSelector(attributeName, attributeValue) {
  return `[${attributeName}="${CSS.escape(attributeValue)}"]`;
}
function getPositionSelector(element) {
  const nthOfType = getNthOfTypeSelector(element);
  return `${CSS.escape(element.tagName)}:nth-of-type(${nthOfType})`;
}
function getNthOfTypeSelector(element) {
  const parent = element.parentNode;
  let sibling = parent.firstElementChild;
  let nthOfType = 1;
  while (sibling && sibling !== element) {
    if (sibling.tagName === element.tagName) {
      nthOfType += 1;
    }
    sibling = sibling.nextElementSibling;
  }
  return nthOfType;
}
function findSelector(element, rootNode, selectorGetters, predicate, actionNameAttribute, childSelector) {
  for (const selectorGetter of selectorGetters) {
    const elementSelector = selectorGetter(element, actionNameAttribute);
    if (!elementSelector) {
      continue;
    }
    if (predicate(element, rootNode, elementSelector, childSelector)) {
      return elementSelector;
    }
  }
}
function isSelectorUniqueWithinRoot(_element, rootNode, elementSelector, childSelector) {
  return rootNode.querySelectorAll(combineSelector(elementSelector, childSelector)).length === 1;
}
function isSelectorUniqueAmongSiblings(currentElement, _rootNode, currentElementSelector, childSelector) {
  let isSiblingMatching;
  if (childSelector === void 0) {
    isSiblingMatching = (sibling2) => sibling2.matches(currentElementSelector);
  } else {
    const scopedSelector = combineSelector(`${currentElementSelector}:scope`, childSelector);
    isSiblingMatching = (sibling2) => sibling2.querySelector(scopedSelector) !== null;
  }
  let sibling = currentElement.previousElementSibling;
  while (sibling) {
    if (isSiblingMatching(sibling)) {
      return false;
    }
    sibling = sibling.previousElementSibling;
  }
  sibling = currentElement.nextElementSibling;
  while (sibling) {
    if (isSiblingMatching(sibling)) {
      return false;
    }
    sibling = sibling.nextElementSibling;
  }
  return true;
}
function combineSelector(parent, child) {
  return child ? `${parent}>${child}` : parent;
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/privacyConstants.js
var NodePrivacyLevel = {
  IGNORE: "ignore",
  HIDDEN: "hidden",
  ALLOW: DefaultPrivacyLevel.ALLOW,
  MASK: DefaultPrivacyLevel.MASK,
  MASK_USER_INPUT: DefaultPrivacyLevel.MASK_USER_INPUT,
  MASK_UNLESS_ALLOWLISTED: DefaultPrivacyLevel.MASK_UNLESS_ALLOWLISTED
};
var PRIVACY_ATTR_NAME = "data-dd-privacy";
var PRIVACY_ATTR_VALUE_HIDDEN = "hidden";
var PRIVACY_CLASS_PREFIX = "dd-privacy-";
var CENSORED_STRING_MARK = "***";
var CENSORED_IMG_MARK = "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";
var FORM_PRIVATE_TAG_NAMES = {
  INPUT: true,
  OUTPUT: true,
  TEXTAREA: true,
  SELECT: true,
  OPTION: true,
  DATALIST: true,
  OPTGROUP: true
};
var TEXT_MASKING_CHAR = "x";
function getPrivacySelector(privacyLevel) {
  return `[${PRIVACY_ATTR_NAME}="${privacyLevel}"], .${PRIVACY_CLASS_PREFIX}${privacyLevel}`;
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/privacy.js
function getNodePrivacyLevel(node, defaultPrivacyLevel, cache) {
  if (cache && cache.has(node)) {
    return cache.get(node);
  }
  const parentNode = getParentNode(node);
  const parentNodePrivacyLevel = parentNode ? getNodePrivacyLevel(parentNode, defaultPrivacyLevel, cache) : defaultPrivacyLevel;
  const selfNodePrivacyLevel = getNodeSelfPrivacyLevel(node);
  const nodePrivacyLevel = reducePrivacyLevel(selfNodePrivacyLevel, parentNodePrivacyLevel);
  if (cache) {
    cache.set(node, nodePrivacyLevel);
  }
  return nodePrivacyLevel;
}
function reducePrivacyLevel(childPrivacyLevel, parentNodePrivacyLevel) {
  switch (parentNodePrivacyLevel) {
    case NodePrivacyLevel.HIDDEN:
    case NodePrivacyLevel.IGNORE:
      return parentNodePrivacyLevel;
  }
  switch (childPrivacyLevel) {
    case NodePrivacyLevel.ALLOW:
    case NodePrivacyLevel.MASK:
    case NodePrivacyLevel.MASK_USER_INPUT:
    case NodePrivacyLevel.MASK_UNLESS_ALLOWLISTED:
    case NodePrivacyLevel.HIDDEN:
    case NodePrivacyLevel.IGNORE:
      return childPrivacyLevel;
    default:
      return parentNodePrivacyLevel;
  }
}
function getNodeSelfPrivacyLevel(node) {
  if (!isElementNode(node)) {
    return;
  }
  if (node.tagName === "BASE") {
    return NodePrivacyLevel.ALLOW;
  }
  if (node.tagName === "INPUT") {
    const inputElement = node;
    if (inputElement.type === "password" || inputElement.type === "email" || inputElement.type === "tel") {
      return NodePrivacyLevel.MASK;
    }
    if (inputElement.type === "hidden") {
      return NodePrivacyLevel.MASK;
    }
    const autocomplete = inputElement.getAttribute("autocomplete");
    if (autocomplete && (autocomplete.startsWith("cc-") || autocomplete.endsWith("-password"))) {
      return NodePrivacyLevel.MASK;
    }
  }
  if (node.matches(getPrivacySelector(NodePrivacyLevel.HIDDEN))) {
    return NodePrivacyLevel.HIDDEN;
  }
  if (node.matches(getPrivacySelector(NodePrivacyLevel.MASK))) {
    return NodePrivacyLevel.MASK;
  }
  if (node.matches(getPrivacySelector(NodePrivacyLevel.MASK_UNLESS_ALLOWLISTED))) {
    return NodePrivacyLevel.MASK_UNLESS_ALLOWLISTED;
  }
  if (node.matches(getPrivacySelector(NodePrivacyLevel.MASK_USER_INPUT))) {
    return NodePrivacyLevel.MASK_USER_INPUT;
  }
  if (node.matches(getPrivacySelector(NodePrivacyLevel.ALLOW))) {
    return NodePrivacyLevel.ALLOW;
  }
  if (shouldIgnoreElement(node)) {
    return NodePrivacyLevel.IGNORE;
  }
}
function shouldMaskNode(node, privacyLevel) {
  switch (privacyLevel) {
    case NodePrivacyLevel.MASK:
    case NodePrivacyLevel.HIDDEN:
    case NodePrivacyLevel.IGNORE:
      return true;
    case NodePrivacyLevel.MASK_UNLESS_ALLOWLISTED:
      if (isTextNode(node)) {
        return isFormElement(node.parentNode) ? true : !isAllowlisted(node.textContent || "");
      }
      return isFormElement(node);
    case NodePrivacyLevel.MASK_USER_INPUT:
      return isTextNode(node) ? isFormElement(node.parentNode) : isFormElement(node);
    default:
      return false;
  }
}
function shouldMaskAttribute(tagName, attributeName, attributeValue, nodePrivacyLevel, configuration) {
  if (nodePrivacyLevel !== NodePrivacyLevel.MASK && nodePrivacyLevel !== NodePrivacyLevel.MASK_UNLESS_ALLOWLISTED) {
    return false;
  }
  if (attributeName === PRIVACY_ATTR_NAME || STABLE_ATTRIBUTES.includes(attributeName) || attributeName === configuration.actionNameAttribute) {
    return false;
  }
  switch (attributeName) {
    case "title":
    case "alt":
    case "placeholder":
    case "aria-label":
    case "name":
      return true;
  }
  if (tagName === "A" && attributeName === "href") {
    return true;
  }
  if (tagName === "IFRAME" && attributeName === "srcdoc") {
    return true;
  }
  if (attributeValue && attributeName.startsWith("data-")) {
    return true;
  }
  if ((tagName === "IMG" || tagName === "SOURCE") && (attributeName === "src" || attributeName === "srcset")) {
    return true;
  }
  return false;
}
function isFormElement(node) {
  if (!node || node.nodeType !== node.ELEMENT_NODE) {
    return false;
  }
  const element = node;
  if (element.tagName === "INPUT") {
    switch (element.type) {
      case "button":
      case "color":
      case "reset":
      case "submit":
        return false;
    }
  }
  return !!FORM_PRIVATE_TAG_NAMES[element.tagName];
}
var censorText = (text) => text.replace(/\S/g, TEXT_MASKING_CHAR);
function getTextContent(textNode, parentNodePrivacyLevel) {
  var _a;
  const parentTagName = (_a = textNode.parentElement) === null || _a === void 0 ? void 0 : _a.tagName;
  let textContent = textNode.textContent || "";
  const shouldIgnoreWhiteSpace = parentTagName === "HEAD";
  if (shouldIgnoreWhiteSpace && !textContent.trim()) {
    return;
  }
  const nodePrivacyLevel = parentNodePrivacyLevel;
  const isScript = parentTagName === "SCRIPT";
  if (isScript) {
    textContent = CENSORED_STRING_MARK;
  } else if (nodePrivacyLevel === NodePrivacyLevel.HIDDEN) {
    textContent = CENSORED_STRING_MARK;
  } else if (shouldMaskNode(textNode, nodePrivacyLevel)) {
    if (
      // Scrambling the child list breaks text nodes for DATALIST/SELECT/OPTGROUP
      parentTagName === "DATALIST" || parentTagName === "SELECT" || parentTagName === "OPTGROUP"
    ) {
      if (!textContent.trim()) {
        return;
      }
    } else if (parentTagName === "OPTION") {
      textContent = CENSORED_STRING_MARK;
    } else if (nodePrivacyLevel === NodePrivacyLevel.MASK_UNLESS_ALLOWLISTED) {
      textContent = maskDisallowedTextContent(textContent);
    } else {
      textContent = censorText(textContent);
    }
  }
  return textContent;
}
function shouldIgnoreElement(element) {
  if (element.nodeName === "SCRIPT") {
    return true;
  }
  if (element.nodeName === "LINK") {
    const relAttribute = getLowerCaseAttribute("rel");
    return (
      // Link as script - Ignore only when rel=preload, modulepreload or prefetch
      /preload|prefetch/i.test(relAttribute) && getLowerCaseAttribute("as") === "script" || // Favicons
      relAttribute === "shortcut icon" || relAttribute === "icon"
    );
  }
  if (element.nodeName === "META") {
    const nameAttribute = getLowerCaseAttribute("name");
    const relAttribute = getLowerCaseAttribute("rel");
    const propertyAttribute = getLowerCaseAttribute("property");
    return (
      // Favicons
      /^msapplication-tile(image|color)$/.test(nameAttribute) || nameAttribute === "application-name" || relAttribute === "icon" || relAttribute === "apple-touch-icon" || relAttribute === "shortcut icon" || // Description
      nameAttribute === "keywords" || nameAttribute === "description" || // Social
      /^(og|twitter|fb):/.test(propertyAttribute) || /^(og|twitter):/.test(nameAttribute) || nameAttribute === "pinterest" || // Robots
      nameAttribute === "robots" || nameAttribute === "googlebot" || nameAttribute === "bingbot" || // Http headers. Ex: X-UA-Compatible, Content-Type, Content-Language, cache-control,
      // X-Translated-By
      element.hasAttribute("http-equiv") || // Authorship
      nameAttribute === "author" || nameAttribute === "generator" || nameAttribute === "framework" || nameAttribute === "publisher" || nameAttribute === "progid" || /^article:/.test(propertyAttribute) || /^product:/.test(propertyAttribute) || // Verification
      nameAttribute === "google-site-verification" || nameAttribute === "yandex-verification" || nameAttribute === "csrf-token" || nameAttribute === "p:domain_verify" || nameAttribute === "verify-v1" || nameAttribute === "verification" || nameAttribute === "shopify-checkout-api-token"
    );
  }
  function getLowerCaseAttribute(name) {
    return (element.getAttribute(name) || "").toLowerCase();
  }
  return false;
}
function isAllowlisted(text) {
  var _a;
  if (!text || !text.trim()) {
    return true;
  }
  return ((_a = window.$DD_ALLOW) === null || _a === void 0 ? void 0 : _a.has(text.toLocaleLowerCase())) || false;
}
function maskDisallowedTextContent(text, fixedMask) {
  if (isAllowlisted(text)) {
    return text;
  }
  return fixedMask || censorText(text);
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/trackEventCounts.js
function trackEventCounts({ lifeCycle, isChildEvent, onChange: callback = noop }) {
  const eventCounts = {
    errorCount: 0,
    longTaskCount: 0,
    resourceCount: 0,
    actionCount: 0,
    frustrationCount: 0
  };
  const subscription = lifeCycle.subscribe(13, (event) => {
    var _a;
    if (event.type === "view" || event.type === "vital" || !isChildEvent(event)) {
      return;
    }
    switch (event.type) {
      case RumEventType.ERROR:
        eventCounts.errorCount += 1;
        callback();
        break;
      case RumEventType.ACTION:
        eventCounts.actionCount += 1;
        if (event.action.frustration) {
          eventCounts.frustrationCount += event.action.frustration.type.length;
        }
        callback();
        break;
      case RumEventType.LONG_TASK:
        eventCounts.longTaskCount += 1;
        callback();
        break;
      case RumEventType.RESOURCE:
        if (!((_a = event._dd) === null || _a === void 0 ? void 0 : _a.discarded)) {
          eventCounts.resourceCount += 1;
          callback();
        }
        break;
    }
  });
  return {
    stop: () => {
      subscription.unsubscribe();
    },
    eventCounts
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/eventTracker.js
var EVENT_CONTEXT_TIME_OUT_DELAY = 5 * ONE_MINUTE;
function startEventTracker(lifeCycle) {
  const history2 = createValueHistory({ expireDelay: EVENT_CONTEXT_TIME_OUT_DELAY });
  const keyedEvents = /* @__PURE__ */ new Map();
  function cleanUpEvent(event) {
    var _a;
    keyedEvents.delete(event.key);
    (_a = event.eventCounts) === null || _a === void 0 ? void 0 : _a.stop();
  }
  function discardAll() {
    keyedEvents.forEach((event) => {
      cleanUpEvent(event);
    });
    history2.reset();
  }
  const sessionRenewalSubscription = lifeCycle.subscribe(10, discardAll);
  function start(key, startClocks, data, options) {
    const id = generateUUID();
    const historyEntry = history2.add(id, startClocks.relative);
    const existing = keyedEvents.get(key);
    if (existing) {
      cleanUpEvent(existing);
    }
    const eventCounts = (options === null || options === void 0 ? void 0 : options.isChildEvent) ? trackEventCounts({
      lifeCycle,
      isChildEvent: options.isChildEvent(id)
    }) : void 0;
    const trackedEventData = {
      id,
      key,
      startClocks,
      data,
      historyEntry,
      eventCounts
    };
    keyedEvents.set(key, trackedEventData);
    return trackedEventData;
  }
  function stop(key, stopClocks, extraData) {
    var _a;
    const event = keyedEvents.get(key);
    if (!event) {
      return void 0;
    }
    const finalData = extraData ? combine(event.data, extraData) : event.data;
    event.historyEntry.close(stopClocks.relative);
    const duration = elapsed(event.startClocks.timeStamp, stopClocks.timeStamp);
    const counts = (_a = event.eventCounts) === null || _a === void 0 ? void 0 : _a.eventCounts;
    cleanUpEvent(event);
    return {
      ...finalData,
      id: event.id,
      startClocks: event.startClocks,
      duration,
      counts
    };
  }
  function discard(key) {
    var _a;
    const event = keyedEvents.get(key);
    if (!event) {
      return void 0;
    }
    const counts = (_a = event.eventCounts) === null || _a === void 0 ? void 0 : _a.eventCounts;
    cleanUpEvent(event);
    event.historyEntry.remove();
    return {
      ...event.data,
      id: event.id,
      startClocks: event.startClocks,
      counts
    };
  }
  function findId(startTime) {
    return history2.findAll(startTime);
  }
  function getCounts(key) {
    var _a, _b;
    return (_b = (_a = keyedEvents.get(key)) === null || _a === void 0 ? void 0 : _a.eventCounts) === null || _b === void 0 ? void 0 : _b.eventCounts;
  }
  function stopTracker() {
    sessionRenewalSubscription.unsubscribe();
    discardAll();
    history2.stop();
  }
  return {
    start,
    stop,
    discard,
    getCounts,
    findId,
    stopAll: stopTracker
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/getComposedPathSelector.js
var FILTERED_TAGNAMES = ["HTML", "BODY"];
var CHARACTER_LIMIT = 2 * ONE_KIBI_BYTE;
var SAFE_ATTRIBUTES = STABLE_ATTRIBUTES.concat([
  "role",
  "type",
  "disabled",
  "readonly",
  "tabindex",
  "draggable",
  "target",
  "rel",
  "download",
  "method",
  "action",
  "enctype",
  "autocomplete"
]);
function getComposedPathSelector(composedPath, actionNameAttribute) {
  const elements = composedPath.filter((el) => el instanceof Element && !FILTERED_TAGNAMES.includes(el.tagName));
  if (elements.length === 0) {
    return "";
  }
  const allowedAttributes = actionNameAttribute ? [actionNameAttribute].concat(SAFE_ATTRIBUTES) : SAFE_ATTRIBUTES;
  let result = "";
  for (const element of elements) {
    const part = getSelectorStringFromElement(element, allowedAttributes);
    result += part;
    if (result.length >= CHARACTER_LIMIT) {
      return safeTruncate(result, CHARACTER_LIMIT);
    }
  }
  return result;
}
function getSelectorStringFromElement(element, allowedAttributes) {
  const tagName = getTagNameSelector(element);
  const id = getIDSelector(element);
  const classes = getElementClassesString(element);
  const attributes = extractSafeAttributesString(element, allowedAttributes);
  const positionData = computePositionDataString(element);
  return `${tagName}${id || ""}${attributes}${classes}${positionData};`;
}
function getElementClassesString(element) {
  return Array.from(element.classList).filter((c) => !isGeneratedValue(c)).sort().map((c) => `.${CSS.escape(c)}`).join("");
}
function computePositionDataString(element) {
  const siblings = Array.from(element.parentNode.children);
  if (siblings.length <= 1) {
    return "";
  }
  const sameTypeSiblings = siblings.filter((sibling) => sibling.tagName === element.tagName);
  const nthChild = siblings.indexOf(element);
  const nthOfType = getNthOfTypeSelector(element);
  return `:nth-child(${nthChild + 1})${sameTypeSiblings.length > 1 ? `:nth-of-type(${nthOfType})` : ""}`;
}
function extractSafeAttributesString(element, allowedAttributes) {
  const result = [];
  const attributes = Array.from(element.attributes);
  for (const attribute of attributes) {
    if (allowedAttributes.includes(attribute.name)) {
      result.push(getAttributeValueSelector(attribute.name, attribute.value));
    }
  }
  return result.sort().join("");
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/action/clickChain.js
var MAX_DURATION_BETWEEN_CLICKS = ONE_SECOND;
var MAX_DISTANCE_BETWEEN_CLICKS = 100;
function createClickChain(firstClick, onFinalize) {
  const bufferedClicks = [];
  let status = 0;
  let maxDurationBetweenClicksTimeoutId;
  appendClick(firstClick);
  function appendClick(click) {
    click.stopObservable.subscribe(tryFinalize);
    bufferedClicks.push(click);
    clearTimeout(maxDurationBetweenClicksTimeoutId);
    maxDurationBetweenClicksTimeoutId = setTimeout(dontAcceptMoreClick, MAX_DURATION_BETWEEN_CLICKS);
  }
  function tryFinalize() {
    if (status === 1 && bufferedClicks.every((click) => click.isStopped())) {
      status = 2;
      onFinalize(bufferedClicks);
    }
  }
  function dontAcceptMoreClick() {
    clearTimeout(maxDurationBetweenClicksTimeoutId);
    if (status === 0) {
      status = 1;
      tryFinalize();
    }
  }
  return {
    tryAppend: (click) => {
      if (status !== 0) {
        return false;
      }
      if (bufferedClicks.length > 0 && !areEventsSimilar(bufferedClicks[bufferedClicks.length - 1].event, click.event)) {
        dontAcceptMoreClick();
        return false;
      }
      appendClick(click);
      return true;
    },
    stop: () => {
      dontAcceptMoreClick();
    }
  };
}
function areEventsSimilar(first, second) {
  return first.target === second.target && mouseEventDistance(first, second) <= MAX_DISTANCE_BETWEEN_CLICKS && first.timeStamp - second.timeStamp <= MAX_DURATION_BETWEEN_CLICKS;
}
function mouseEventDistance(origin, other) {
  return Math.sqrt(Math.pow(origin.clientX - other.clientX, 2) + Math.pow(origin.clientY - other.clientY, 2));
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/action/getActionNameFromElement.js
function getActionNameFromElement(element, rumConfiguration, nodePrivacyLevel = NodePrivacyLevel.ALLOW) {
  const nodePrivacyLevelCache = /* @__PURE__ */ new Map();
  const { actionNameAttribute: userProgrammaticAttribute } = rumConfiguration;
  const defaultActionName = getActionNameFromElementProgrammatically(element, DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE) || userProgrammaticAttribute && getActionNameFromElementProgrammatically(element, userProgrammaticAttribute);
  if (defaultActionName) {
    return {
      name: defaultActionName,
      nameSource: "custom_attribute"
      /* ActionNameSource.CUSTOM_ATTRIBUTE */
    };
  } else if (nodePrivacyLevel === NodePrivacyLevel.MASK) {
    return {
      name: ACTION_NAME_PLACEHOLDER,
      nameSource: "mask_placeholder"
      /* ActionNameSource.MASK_PLACEHOLDER */
    };
  }
  return getActionNameFromElementForStrategies(element, priorityStrategies, rumConfiguration, nodePrivacyLevelCache) || getActionNameFromElementForStrategies(element, fallbackStrategies, rumConfiguration, nodePrivacyLevelCache) || {
    name: "",
    nameSource: "blank"
  };
}
function getActionNameFromElementProgrammatically(targetElement, programmaticAttribute) {
  const elementWithAttribute = closestShadowAware(targetElement, `[${programmaticAttribute}]`);
  if (!elementWithAttribute) {
    return;
  }
  const name = elementWithAttribute.getAttribute(programmaticAttribute);
  return truncate(normalizeWhitespace(name.trim()));
}
function closestShadowAware(element, selector) {
  let current = element;
  while (current) {
    if (current.matches(selector)) {
      return current;
    }
    current = getParentElement(current);
  }
  return null;
}
var priorityStrategies = [
  // associated LABEL text
  (element, rumConfiguration, nodePrivacyLevelCache) => {
    if ("labels" in element && element.labels && element.labels.length > 0) {
      return getActionNameFromTextualContent(element.labels[0], rumConfiguration, nodePrivacyLevelCache);
    }
  },
  // INPUT button (and associated) value
  (element) => {
    if (element.nodeName === "INPUT") {
      const input = element;
      const type = input.getAttribute("type");
      if (type === "button" || type === "submit" || type === "reset") {
        return {
          name: input.value,
          nameSource: "text_content"
          /* ActionNameSource.TEXT_CONTENT */
        };
      }
    }
  },
  // BUTTON, LABEL or button-like element text
  (element, rumConfiguration, nodePrivacyLevelCache) => {
    if (element.nodeName === "BUTTON" || element.nodeName === "LABEL" || element.getAttribute("role") === "button") {
      return getActionNameFromTextualContent(element, rumConfiguration, nodePrivacyLevelCache);
    }
  },
  (element, rumConfiguration, nodePrivacyLevelCache) => getActionNameFromStandardAttribute(element, "aria-label", rumConfiguration, nodePrivacyLevelCache),
  // associated element text designated by the aria-labelledby attribute
  (element, rumConfiguration, nodePrivacyLevelCache) => {
    const labelledByAttribute = element.getAttribute("aria-labelledby");
    if (labelledByAttribute) {
      return {
        name: labelledByAttribute.split(/\s+/).map((id) => getElementById(element, id)).filter((label) => Boolean(label)).map((element2) => getTextualContent(element2, rumConfiguration, nodePrivacyLevelCache)).join(" "),
        nameSource: "text_content"
      };
    }
  },
  (element, rumConfiguration, nodePrivacyLevelCache) => getActionNameFromStandardAttribute(element, "alt", rumConfiguration, nodePrivacyLevelCache),
  (element, rumConfiguration, nodePrivacyLevelCache) => getActionNameFromStandardAttribute(element, "name", rumConfiguration, nodePrivacyLevelCache),
  (element, rumConfiguration, nodePrivacyLevelCache) => getActionNameFromStandardAttribute(element, "title", rumConfiguration, nodePrivacyLevelCache),
  (element, rumConfiguration, nodePrivacyLevelCache) => getActionNameFromStandardAttribute(element, "placeholder", rumConfiguration, nodePrivacyLevelCache),
  // SELECT first OPTION text
  (element, rumConfiguration, nodePrivacyLevelCache) => {
    if ("options" in element && element.options.length > 0) {
      return getActionNameFromTextualContent(element.options[0], rumConfiguration, nodePrivacyLevelCache);
    }
  }
];
var fallbackStrategies = [
  (element, rumConfiguration, nodePrivacyLevelCache) => getActionNameFromTextualContent(element, rumConfiguration, nodePrivacyLevelCache)
];
var MAX_PARENTS_TO_CONSIDER = 10;
function getActionNameFromElementForStrategies(targetElement, strategies, rumConfiguration, nodePrivacyLevelCache) {
  let element = targetElement;
  let recursionCounter = 0;
  while (recursionCounter <= MAX_PARENTS_TO_CONSIDER && element && element.nodeName !== "BODY" && element.nodeName !== "HTML" && element.nodeName !== "HEAD") {
    for (const strategy of strategies) {
      const actionName = strategy(element, rumConfiguration, nodePrivacyLevelCache);
      if (actionName) {
        const { name, nameSource } = actionName;
        const trimmedName = name && name.trim();
        if (trimmedName) {
          return { name: truncate(normalizeWhitespace(trimmedName)), nameSource };
        }
      }
    }
    if (element.nodeName === "FORM") {
      break;
    }
    element = getParentElement(element);
    recursionCounter += 1;
  }
}
function normalizeWhitespace(s) {
  return s.replace(/\s+/g, " ");
}
function truncate(s) {
  return s.length > 100 ? `${safeTruncate(s, 100)} [...]` : s;
}
function getElementById(refElement, id) {
  const rootNode = refElement.getRootNode();
  if (rootNode instanceof ShadowRoot) {
    const shadowElement = rootNode.getElementById(id);
    if (shadowElement) {
      return shadowElement;
    }
  }
  return refElement.ownerDocument ? refElement.ownerDocument.getElementById(id) : null;
}
function getActionNameFromStandardAttribute(element, attribute, rumConfiguration, nodePrivacyLevelCache) {
  const { enablePrivacyForActionName, defaultPrivacyLevel } = rumConfiguration;
  let attributeValue = element.getAttribute(attribute);
  if (attributeValue && enablePrivacyForActionName) {
    const nodePrivacyLevel = getNodePrivacyLevel(element, defaultPrivacyLevel, nodePrivacyLevelCache);
    if (shouldMaskAttribute(element.tagName, attribute, attributeValue, nodePrivacyLevel, rumConfiguration)) {
      attributeValue = maskDisallowedTextContent(attributeValue, ACTION_NAME_PLACEHOLDER);
    }
  } else if (!attributeValue) {
    attributeValue = "";
  }
  return {
    name: attributeValue,
    nameSource: "standard_attribute"
  };
}
function getActionNameFromTextualContent(element, rumConfiguration, nodePrivacyLevelCache) {
  return {
    name: getTextualContent(element, rumConfiguration, nodePrivacyLevelCache) || "",
    nameSource: "text_content"
  };
}
function getTextualContent(element, rumConfiguration, nodePrivacyLevelCache) {
  if (element.isContentEditable) {
    return;
  }
  const { enablePrivacyForActionName, actionNameAttribute: userProgrammaticAttribute, defaultPrivacyLevel } = rumConfiguration;
  if (isExperimentalFeatureEnabled(ExperimentalFeature.USE_TREE_WALKER_FOR_ACTION_NAME)) {
    return getTextualContentWithTreeWalker(element, userProgrammaticAttribute, enablePrivacyForActionName, defaultPrivacyLevel, nodePrivacyLevelCache);
  }
  if ("innerText" in element) {
    let text = element.innerText;
    const removeTextFromElements = (query) => {
      const list = element.querySelectorAll(query);
      for (let index = 0; index < list.length; index += 1) {
        const element2 = list[index];
        if ("innerText" in element2) {
          const textToReplace = element2.innerText;
          if (textToReplace && textToReplace.trim().length > 0) {
            text = text.replace(textToReplace, "");
          }
        }
      }
    };
    removeTextFromElements(`[${DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE}]`);
    if (userProgrammaticAttribute) {
      removeTextFromElements(`[${userProgrammaticAttribute}]`);
    }
    if (enablePrivacyForActionName) {
      removeTextFromElements(`${getPrivacySelector(NodePrivacyLevel.HIDDEN)}, ${getPrivacySelector(NodePrivacyLevel.MASK)}`);
    }
    return text;
  }
  return element.textContent;
}
function getTextualContentWithTreeWalker(element, userProgrammaticAttribute, privacyEnabledActionName, defaultPrivacyLevel, nodePrivacyLevelCache) {
  const walker = document.createTreeWalker(
    element,
    // eslint-disable-next-line no-bitwise
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    rejectInvisibleOrMaskedElementsFilter
  );
  let text = "";
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (isElementNode(node)) {
      if (
        // Following InnerText rendering spec https://html.spec.whatwg.org/multipage/dom.html#rendered-text-collection-steps
        node.nodeName === "BR" || node.nodeName === "P" || ["block", "flex", "grid", "list-item", "table", "table-caption"].includes(getComputedStyle(node).display)
      ) {
        text += " ";
      }
      continue;
    }
    text += node.textContent || "";
  }
  return text.replace(/\s+/g, " ").trim();
  function rejectInvisibleOrMaskedElementsFilter(node) {
    const nodeSelfPrivacyLevel = getNodePrivacyLevel(node, defaultPrivacyLevel, nodePrivacyLevelCache);
    if (privacyEnabledActionName && nodeSelfPrivacyLevel && shouldMaskNode(node, nodeSelfPrivacyLevel)) {
      return NodeFilter.FILTER_REJECT;
    }
    if (isElementNode(node)) {
      if (node.hasAttribute(DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE) || userProgrammaticAttribute && node.hasAttribute(userProgrammaticAttribute)) {
        return NodeFilter.FILTER_REJECT;
      }
      const style = getComputedStyle(node);
      if (style.visibility !== "visible" || style.display === "none" || style.contentVisibility && style.contentVisibility !== "visible") {
        return NodeFilter.FILTER_REJECT;
      }
    }
    return NodeFilter.FILTER_ACCEPT;
  }
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/action/listenActionEvents.js
function listenActionEvents(configuration, { onPointerDown, onPointerUp }) {
  let selectionEmptyAtPointerDown;
  let userActivity = {
    selection: false,
    input: false,
    scroll: false
  };
  let clickContext;
  const listeners = [
    addEventListener(configuration, window, "pointerdown", (event) => {
      if (isValidPointerEvent(event)) {
        selectionEmptyAtPointerDown = isSelectionEmpty();
        userActivity = {
          selection: false,
          input: false,
          scroll: false
        };
        clickContext = onPointerDown(event);
      }
    }, { capture: true }),
    addEventListener(configuration, window, "selectionchange", () => {
      if (!selectionEmptyAtPointerDown || !isSelectionEmpty()) {
        userActivity.selection = true;
      }
    }, { capture: true }),
    addEventListener(configuration, window, "scroll", () => {
      userActivity.scroll = true;
    }, { capture: true, passive: true }),
    addEventListener(configuration, window, "pointerup", (event) => {
      if (isValidPointerEvent(event) && clickContext) {
        const localUserActivity = userActivity;
        onPointerUp(clickContext, event, () => localUserActivity);
        clickContext = void 0;
      }
    }, { capture: true }),
    addEventListener(configuration, window, "input", () => {
      userActivity.input = true;
    }, { capture: true })
  ];
  return {
    stop: () => {
      listeners.forEach((listener) => listener.stop());
    }
  };
}
function isSelectionEmpty() {
  const selection = window.getSelection();
  return !selection || selection.isCollapsed;
}
function isValidPointerEvent(event) {
  return event.target instanceof Element && // Only consider 'primary' pointer events for now. Multi-touch support could be implemented in
  // the future.
  event.isPrimary !== false;
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/action/computeFrustration.js
var MIN_CLICKS_PER_SECOND_TO_CONSIDER_RAGE = 3;
function computeFrustration(clicks, rageClick) {
  if (isRage(clicks)) {
    rageClick.addFrustration(FrustrationType.RAGE_CLICK);
    if (clicks.some(isDead)) {
      rageClick.addFrustration(FrustrationType.DEAD_CLICK);
    }
    if (rageClick.hasError) {
      rageClick.addFrustration(FrustrationType.ERROR_CLICK);
    }
    return { isRage: true };
  }
  const hasSelectionChanged = clicks.some((click) => click.getUserActivity().selection);
  clicks.forEach((click) => {
    if (click.hasError) {
      click.addFrustration(FrustrationType.ERROR_CLICK);
    }
    if (isDead(click) && // Avoid considering clicks part of a double-click or triple-click selections as dead clicks
    !hasSelectionChanged) {
      click.addFrustration(FrustrationType.DEAD_CLICK);
    }
  });
  return { isRage: false };
}
function isRage(clicks) {
  if (clicks.some((click) => click.getUserActivity().selection || click.getUserActivity().scroll)) {
    return false;
  }
  for (let i = 0; i < clicks.length - (MIN_CLICKS_PER_SECOND_TO_CONSIDER_RAGE - 1); i += 1) {
    if (clicks[i + MIN_CLICKS_PER_SECOND_TO_CONSIDER_RAGE - 1].event.timeStamp - clicks[i].event.timeStamp <= ONE_SECOND) {
      return true;
    }
  }
  return false;
}
var DEAD_CLICK_EXCLUDE_SELECTOR = (
  // inputs that don't trigger a meaningful event like "input" when clicked, including textual
  // inputs (using a negative selector is shorter here)
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="range"]),textarea,select,[contenteditable],[contenteditable] *,canvas,a[href],a[href] *'
);
function isDead(click) {
  if (click.hasPageActivity || click.getUserActivity().input || click.getUserActivity().scroll) {
    return false;
  }
  let target = click.event.target;
  if (target.tagName === "LABEL" && target.hasAttribute("for")) {
    target = document.getElementById(target.getAttribute("for"));
  }
  return !target || !target.matches(DEAD_CLICK_EXCLUDE_SELECTOR);
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/action/interactionSelectorCache.js
var CLICK_ACTION_MAX_DURATION = 10 * ONE_SECOND;
var interactionSelectorCache = /* @__PURE__ */ new Map();
function getInteractionSelector(relativeTimestamp) {
  const selector = interactionSelectorCache.get(relativeTimestamp);
  interactionSelectorCache.delete(relativeTimestamp);
  return selector;
}
function updateInteractionSelector(relativeTimestamp, selector) {
  interactionSelectorCache.set(relativeTimestamp, selector);
  interactionSelectorCache.forEach((_, relativeTimestamp2) => {
    if (elapsed(relativeTimestamp2, relativeNow()) > CLICK_ACTION_MAX_DURATION) {
      interactionSelectorCache.delete(relativeTimestamp2);
    }
  });
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/action/isActionChildEvent.js
function isActionChildEvent(id) {
  return (event) => event.action !== void 0 && event.action.id !== void 0 && event.action.id.includes(id);
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/action/trackClickActions.js
function trackClickActions(lifeCycle, domMutationObservable, windowOpenObservable, configuration) {
  const actionTracker = startEventTracker(lifeCycle);
  const stopObservable = new Observable();
  let currentClickChain;
  lifeCycle.subscribe(5, stopClickChain);
  lifeCycle.subscribe(11, stopClickChain);
  const { stop: stopActionEventsListener } = listenActionEvents(configuration, {
    onPointerDown: (pointerDownEvent) => processPointerDown(configuration, lifeCycle, domMutationObservable, pointerDownEvent, windowOpenObservable),
    onPointerUp: ({ clickActionBase, hadActivityOnPointerDown }, startEvent, getUserActivity) => {
      startClickAction(configuration, lifeCycle, domMutationObservable, windowOpenObservable, actionTracker, stopObservable, appendClickToClickChain, clickActionBase, startEvent, getUserActivity, hadActivityOnPointerDown);
    }
  });
  return {
    stop: () => {
      stopClickChain();
      stopObservable.notify();
      stopActionEventsListener();
      actionTracker.stopAll();
    },
    findActionId: actionTracker.findId
  };
  function appendClickToClickChain(click) {
    if (!currentClickChain || !currentClickChain.tryAppend(click)) {
      const rageClick = click.clone();
      currentClickChain = createClickChain(click, (clicks) => {
        finalizeClicks(clicks, rageClick);
        currentClickChain = void 0;
      });
    }
  }
  function stopClickChain() {
    if (currentClickChain) {
      currentClickChain.stop();
    }
  }
}
function processPointerDown(configuration, lifeCycle, domMutationObservable, pointerDownEvent, windowOpenObservable) {
  const targetForPrivacy = configuration.betaTrackActionsInShadowDom ? getEventTarget(pointerDownEvent) : pointerDownEvent.target;
  let nodePrivacyLevel;
  if (configuration.enablePrivacyForActionName) {
    nodePrivacyLevel = getNodePrivacyLevel(targetForPrivacy, configuration.defaultPrivacyLevel);
  } else {
    nodePrivacyLevel = NodePrivacyLevel.ALLOW;
  }
  if (nodePrivacyLevel === NodePrivacyLevel.HIDDEN) {
    return void 0;
  }
  const clickActionBase = computeClickActionBase(pointerDownEvent, nodePrivacyLevel, configuration);
  let hadActivityOnPointerDown = false;
  waitPageActivityEnd(
    lifeCycle,
    domMutationObservable,
    windowOpenObservable,
    configuration,
    (pageActivityEndEvent) => {
      hadActivityOnPointerDown = pageActivityEndEvent.hadActivity;
    },
    // We don't care about the activity duration, we just want to know whether an activity did happen
    // within the "validation delay" or not. Limit the duration so the callback is called sooner.
    PAGE_ACTIVITY_VALIDATION_DELAY
  );
  return { clickActionBase, hadActivityOnPointerDown: () => hadActivityOnPointerDown };
}
function startClickAction(configuration, lifeCycle, domMutationObservable, windowOpenObservable, actionTracker, stopObservable, appendClickToClickChain, clickActionBase, startEvent, getUserActivity, hadActivityOnPointerDown) {
  var _a;
  const click = newClick(lifeCycle, actionTracker, getUserActivity, clickActionBase, startEvent);
  appendClickToClickChain(click);
  const selector = (_a = clickActionBase === null || clickActionBase === void 0 ? void 0 : clickActionBase.target) === null || _a === void 0 ? void 0 : _a.selector;
  if (selector) {
    updateInteractionSelector(startEvent.timeStamp, selector);
  }
  const { stop: stopWaitPageActivityEnd } = waitPageActivityEnd(lifeCycle, domMutationObservable, windowOpenObservable, configuration, (pageActivityEndEvent) => {
    if (pageActivityEndEvent.hadActivity && pageActivityEndEvent.end < click.startClocks.timeStamp) {
      click.discard();
    } else {
      if (pageActivityEndEvent.hadActivity) {
        click.stop(pageActivityEndEvent.end);
      } else if (hadActivityOnPointerDown()) {
        click.stop(
          // using the click start as activity end, so the click will have some activity but its
          // duration will be 0 (as the activity started before the click start)
          click.startClocks.timeStamp
        );
      } else {
        click.stop();
      }
    }
  }, CLICK_ACTION_MAX_DURATION);
  const viewEndedSubscription = lifeCycle.subscribe(5, ({ endClocks }) => {
    click.stop(endClocks.timeStamp);
  });
  const pageMayExitSubscription = lifeCycle.subscribe(11, () => {
    click.stop(timeStampNow());
  });
  const stopSubscription = stopObservable.subscribe(() => {
    click.stop();
  });
  click.stopObservable.subscribe(() => {
    pageMayExitSubscription.unsubscribe();
    viewEndedSubscription.unsubscribe();
    stopWaitPageActivityEnd();
    stopSubscription.unsubscribe();
  });
}
function computeClickActionBase(event, nodePrivacyLevel, configuration) {
  const target = configuration.betaTrackActionsInShadowDom ? getEventTarget(event) : event.target;
  const rect = target.getBoundingClientRect();
  const selector = getSelectorFromElement(target, configuration.actionNameAttribute);
  const composedPathSelector = isExperimentalFeatureEnabled(ExperimentalFeature.COMPOSED_PATH_SELECTOR) && typeof event.composedPath === "function" ? getComposedPathSelector(event.composedPath(), configuration.actionNameAttribute) : void 0;
  if (selector) {
    updateInteractionSelector(event.timeStamp, selector);
  }
  const { name, nameSource } = getActionNameFromElement(target, configuration, nodePrivacyLevel);
  return {
    type: ActionType.CLICK,
    target: {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      selector,
      composedPathSelector: composedPathSelector || void 0
    },
    position: {
      // Use clientX and Y because for SVG element offsetX and Y are relatives to the <svg> element
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top)
    },
    name,
    nameSource
  };
}
function getEventTarget(event) {
  if (event.composed && isNodeShadowHost(event.target) && typeof event.composedPath === "function") {
    const composedPath = event.composedPath();
    if (composedPath.length > 0 && composedPath[0] instanceof Element) {
      return composedPath[0];
    }
  }
  return event.target;
}
function newClick(lifeCycle, actionTracker, getUserActivity, clickActionBase, startEvent) {
  const clickKey = generateUUID();
  const startClocks = relativeToClocks(startEvent.timeStamp);
  const startedClickAction = actionTracker.start(clickKey, startClocks, clickActionBase, {
    isChildEvent: isActionChildEvent
  });
  lifeCycle.notify(15, startedClickAction);
  let status = 0;
  let actionTrackerFinishedEvent;
  const frustrationTypes = [];
  const stopObservable = new Observable();
  function stop(activityEndTime) {
    if (status !== 0) {
      return;
    }
    status = 1;
    actionTrackerFinishedEvent = activityEndTime ? actionTracker.stop(clickKey, timeStampToClocks(activityEndTime)) : actionTracker.discard(clickKey);
    stopObservable.notify();
  }
  return {
    event: startEvent,
    stop,
    stopObservable,
    get hasError() {
      var _a;
      const currentCounts = (_a = actionTrackerFinishedEvent === null || actionTrackerFinishedEvent === void 0 ? void 0 : actionTrackerFinishedEvent.counts) !== null && _a !== void 0 ? _a : actionTracker.getCounts(clickKey);
      return currentCounts ? currentCounts.errorCount > 0 : false;
    },
    get hasPageActivity() {
      return actionTrackerFinishedEvent && "duration" in actionTrackerFinishedEvent;
    },
    getUserActivity,
    addFrustration: (frustrationType) => {
      frustrationTypes.push(frustrationType);
    },
    get startClocks() {
      return startClocks;
    },
    isStopped: () => status === 1 || status === 2,
    clone: () => newClick(lifeCycle, actionTracker, getUserActivity, clickActionBase, startEvent),
    validate: (domEvents) => {
      stop();
      if (status !== 1) {
        return;
      }
      if (!actionTrackerFinishedEvent) {
        return;
      }
      const clickAction = {
        frustrationTypes,
        events: domEvents !== null && domEvents !== void 0 ? domEvents : [startEvent],
        event: startEvent,
        ...actionTrackerFinishedEvent,
        counts: actionTrackerFinishedEvent.counts
        // This is needed to satisfy the type checker
      };
      lifeCycle.notify(0, clickAction);
      status = 2;
    },
    discard: () => {
      stop();
      status = 2;
    }
  };
}
function finalizeClicks(clicks, rageClick) {
  const { isRage: isRage2 } = computeFrustration(clicks, rageClick);
  if (isRage2) {
    clicks.forEach((click) => click.discard());
    rageClick.stop(timeStampNow());
    rageClick.validate(clicks.map((click) => click.event));
  } else {
    rageClick.discard();
    clicks.forEach((click) => click.validate());
  }
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/action/trackManualActions.js
function trackManualActions(lifeCycle, onManualActionCompleted) {
  const actionTracker = startEventTracker(lifeCycle);
  function startManualAction(name, options = {}, startClocks = clocksNow()) {
    var _a;
    const lookupKey = (_a = options.actionKey) !== null && _a !== void 0 ? _a : name;
    const startedManualAction = actionTracker.start(lookupKey, startClocks, {
      name,
      ...options
    }, { isChildEvent: isActionChildEvent });
    lifeCycle.notify(15, startedManualAction);
  }
  function stopManualAction(name, options = {}, stopClocks = clocksNow()) {
    var _a;
    const lookupKey = (_a = options.actionKey) !== null && _a !== void 0 ? _a : name;
    const stopped = actionTracker.stop(lookupKey, stopClocks, options);
    if (!stopped) {
      return;
    }
    const frustrationTypes = [];
    if (stopped.counts && stopped.counts.errorCount > 0) {
      frustrationTypes.push(FrustrationType.ERROR_CLICK);
    }
    const manualAction = {
      ...stopped,
      type: stopped.type || ActionType.CUSTOM,
      frustrationTypes
    };
    onManualActionCompleted(manualAction);
  }
  function addInstantAction(action) {
    onManualActionCompleted({ id: generateUUID(), frustrationTypes: [], ...action });
  }
  return {
    addAction: addInstantAction,
    startAction: startManualAction,
    stopAction: stopManualAction,
    findActionId: actionTracker.findId,
    stop: actionTracker.stopAll
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/action/actionCollection.js
var LONG_TASK_START_TIME_CORRECTION = 1;
function startActionCollection(lifeCycle, hooks, domMutationObservable, windowOpenObservable, configuration) {
  const { unsubscribe: unsubscribeAutoAction } = lifeCycle.subscribe(0, (action) => {
    lifeCycle.notify(12, processAction(action));
  });
  const stopClickActions = noop;
  let clickActions;
  if (configuration.trackUserInteractions) {
    clickActions = trackClickActions(lifeCycle, domMutationObservable, windowOpenObservable, configuration);
  }
  const manualActions = trackManualActions(lifeCycle, (action) => {
    lifeCycle.notify(12, processAction(action));
  });
  const actionContexts = {
    findActionId: (startTime) => {
      var _a;
      const manualActionId = manualActions.findActionId(startTime);
      const clickActionId = (_a = clickActions === null || clickActions === void 0 ? void 0 : clickActions.findActionId(startTime)) !== null && _a !== void 0 ? _a : [];
      return manualActionId.concat(clickActionId);
    }
  };
  hooks.register(0, ({ startTime, eventType }) => {
    if (eventType !== RumEventType.ERROR && eventType !== RumEventType.RESOURCE && eventType !== RumEventType.LONG_TASK) {
      return SKIPPED;
    }
    const correctedStartTime = eventType === RumEventType.LONG_TASK ? addDuration(startTime, LONG_TASK_START_TIME_CORRECTION) : startTime;
    const actionId = actionContexts.findActionId(correctedStartTime);
    if (!actionId.length) {
      return SKIPPED;
    }
    return {
      type: eventType,
      action: { id: actionId }
    };
  });
  hooks.register(1, ({ startTime }) => ({
    // todo: fix telemetry event type
    action: { id: actionContexts.findActionId(startTime) }
  }));
  return {
    addAction: manualActions.addAction,
    startAction: manualActions.startAction,
    stopAction: manualActions.stopAction,
    actionContexts,
    stop: () => {
      unsubscribeAutoAction();
      stopClickActions();
      manualActions.stop();
      clickActions === null || clickActions === void 0 ? void 0 : clickActions.stop();
    }
  };
}
function processAction(action) {
  var _a, _b, _c, _d;
  const isAuto = isAutoAction(action);
  const loadingTime = discardNegativeDuration(toServerDuration(action.duration));
  return {
    rawRumEvent: {
      type: RumEventType.ACTION,
      date: action.startClocks.timeStamp,
      action: {
        id: action.id,
        target: { name: action.name },
        type: action.type,
        ...loadingTime !== void 0 && { loading_time: loadingTime },
        ...action.counts && {
          error: { count: action.counts.errorCount },
          long_task: { count: action.counts.longTaskCount },
          resource: { count: action.counts.resourceCount }
        },
        frustration: { type: action.frustrationTypes }
      },
      ...isAuto ? {
        _dd: {
          action: {
            target: {
              selector: ((_a = action.target) === null || _a === void 0 ? void 0 : _a.selector) || void 0,
              width: ((_b = action.target) === null || _b === void 0 ? void 0 : _b.width) || void 0,
              height: ((_c = action.target) === null || _c === void 0 ? void 0 : _c.height) || void 0,
              composed_path_selector: (_d = action.target) === null || _d === void 0 ? void 0 : _d.composedPathSelector
            },
            position: action.position,
            name_source: action.nameSource
          }
        }
      } : { context: action.context }
    },
    duration: action.duration,
    startClocks: action.startClocks,
    domainContext: isAuto ? { events: action.events } : { handlingStack: action.handlingStack }
  };
}
function isAutoAction(action) {
  return "events" in action;
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/error/trackConsoleError.js
function trackConsoleError(errorObservable) {
  const subscription = initConsoleObservable([ConsoleApiName.error]).subscribe((consoleLog) => errorObservable.notify(consoleLog.error));
  return {
    stop: () => {
      subscription.unsubscribe();
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/error/trackReportError.js
function trackReportError(configuration, errorObservable) {
  const subscription = initReportObservable(configuration, [
    RawReportType.cspViolation,
    RawReportType.intervention
  ]).subscribe((rawError) => errorObservable.notify(rawError));
  return {
    stop: () => {
      subscription.unsubscribe();
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/error/errorCollection.js
function startErrorCollection(lifeCycle, configuration, bufferedDataObservable) {
  const errorObservable = new Observable();
  bufferedDataObservable.subscribe((bufferedData) => {
    if (bufferedData.type === 0) {
      errorObservable.notify(bufferedData.error);
    }
  });
  trackConsoleError(errorObservable);
  trackReportError(configuration, errorObservable);
  errorObservable.subscribe((error) => lifeCycle.notify(14, { error }));
  return doStartErrorCollection(lifeCycle);
}
function doStartErrorCollection(lifeCycle) {
  lifeCycle.subscribe(14, ({ error }) => {
    lifeCycle.notify(12, processError(error));
  });
  return {
    addError: ({ error, handlingStack, componentStack, startClocks, context }) => {
      const rawError = computeRawError({
        originalError: error,
        handlingStack,
        componentStack,
        startClocks,
        nonErrorPrefix: "Provided",
        source: ErrorSource.CUSTOM,
        handling: "handled"
      });
      rawError.context = combine(rawError.context, context);
      lifeCycle.notify(14, { error: rawError });
    }
  };
}
function processError(error) {
  const rawRumEvent = {
    date: error.startClocks.timeStamp,
    error: {
      id: generateUUID(),
      message: error.message,
      source: error.source,
      stack: error.stack,
      handling_stack: error.handlingStack,
      component_stack: error.componentStack,
      type: error.type,
      handling: error.handling,
      causes: error.causes,
      source_type: "browser",
      fingerprint: error.fingerprint,
      csp: error.csp
    },
    type: RumEventType.ERROR,
    context: error.context
  };
  const domainContext = {
    error: error.originalError,
    handlingStack: error.handlingStack
  };
  return {
    rawRumEvent,
    startClocks: error.startClocks,
    domainContext
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/resource/matchRequestResourceEntry.js
var alreadyMatchedEntries = /* @__PURE__ */ new WeakSet();
function matchRequestResourceEntry(request) {
  if (!performance || !("getEntriesByName" in performance)) {
    return;
  }
  const sameNameEntries = performance.getEntriesByName(request.url, "resource");
  if (!sameNameEntries.length || !("toJSON" in sameNameEntries[0])) {
    return;
  }
  const candidates = sameNameEntries.filter((entry) => !alreadyMatchedEntries.has(entry)).filter((entry) => hasValidResourceEntryDuration(entry) && hasValidResourceEntryTimings(entry)).filter((entry) => isBetween(entry, request.startClocks.relative, endTime({ startTime: request.startClocks.relative, duration: request.duration })));
  if (candidates.length === 1) {
    alreadyMatchedEntries.add(candidates[0]);
    return candidates[0].toJSON();
  }
  return;
}
function endTime(timing) {
  return addDuration(timing.startTime, timing.duration);
}
function isBetween(timing, start, end) {
  const errorMargin = 1;
  return timing.startTime >= start - errorMargin && endTime(timing) <= addDuration(end, errorMargin);
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/tracing/getDocumentTraceId.js
var INITIAL_DOCUMENT_OUTDATED_TRACE_ID_THRESHOLD = 2 * ONE_MINUTE;
function getDocumentTraceId(document2) {
  const data = getDocumentTraceDataFromMeta(document2) || getDocumentTraceDataFromComment(document2);
  if (!data || data.traceTime <= dateNow() - INITIAL_DOCUMENT_OUTDATED_TRACE_ID_THRESHOLD) {
    return void 0;
  }
  return data.traceId;
}
function getDocumentTraceDataFromMeta(document2) {
  const traceIdMeta = document2.querySelector("meta[name=dd-trace-id]");
  const traceTimeMeta = document2.querySelector("meta[name=dd-trace-time]");
  return createDocumentTraceData(traceIdMeta && traceIdMeta.content, traceTimeMeta && traceTimeMeta.content);
}
function getDocumentTraceDataFromComment(document2) {
  const comment = findTraceComment(document2);
  if (!comment) {
    return void 0;
  }
  return createDocumentTraceData(findCommaSeparatedValue(comment, "trace-id"), findCommaSeparatedValue(comment, "trace-time"));
}
function createDocumentTraceData(traceId, rawTraceTime) {
  const traceTime = rawTraceTime && Number(rawTraceTime);
  if (!traceId || !traceTime) {
    return void 0;
  }
  return {
    traceId,
    traceTime
  };
}
function findTraceComment(document2) {
  for (let i = 0; i < document2.childNodes.length; i += 1) {
    const comment = getTraceCommentFromNode(document2.childNodes[i]);
    if (comment) {
      return comment;
    }
  }
  if (document2.body) {
    for (let i = document2.body.childNodes.length - 1; i >= 0; i -= 1) {
      const node = document2.body.childNodes[i];
      const comment = getTraceCommentFromNode(node);
      if (comment) {
        return comment;
      }
      if (!isTextNode(node)) {
        break;
      }
    }
  }
}
function getTraceCommentFromNode(node) {
  if (node && isCommentNode(node)) {
    const match = /^\s*DATADOG;(.*?)\s*$/.exec(node.data);
    if (match) {
      return match[1];
    }
  }
}

// ../../node_modules/@datadog/browser-rum-core/esm/browser/performanceUtils.js
function getNavigationEntry() {
  if (supportPerformanceTimingEvent(RumPerformanceEntryType.NAVIGATION)) {
    const navigationEntry = performance.getEntriesByType(RumPerformanceEntryType.NAVIGATION)[0];
    if (navigationEntry) {
      return navigationEntry;
    }
  }
  const timings = computeTimingsFromDeprecatedPerformanceTiming();
  const entry = {
    entryType: RumPerformanceEntryType.NAVIGATION,
    initiatorType: "navigation",
    name: window.location.href,
    startTime: 0,
    duration: timings.loadEventEnd,
    decodedBodySize: 0,
    encodedBodySize: 0,
    transferSize: 0,
    workerStart: 0,
    toJSON: () => ({ ...entry, toJSON: void 0 }),
    ...timings
  };
  return entry;
}
function computeTimingsFromDeprecatedPerformanceTiming() {
  const result = {};
  const timing = performance.timing;
  for (const key in timing) {
    if (isNumber(timing[key])) {
      const numberKey = key;
      const timingElement = timing[numberKey];
      result[numberKey] = timingElement === 0 ? 0 : getRelativeTime(timingElement);
    }
  }
  return result;
}
function sanitizeFirstByte(entry) {
  return entry.responseStart >= 0 && entry.responseStart <= relativeNow() ? entry.responseStart : void 0;
}
function getResourceEntries() {
  if (supportPerformanceTimingEvent(RumPerformanceEntryType.RESOURCE)) {
    return performance.getEntriesByType(RumPerformanceEntryType.RESOURCE);
  }
  return void 0;
}
function findLcpResourceEntry(resourceUrl, lcpStartTime) {
  const entries = getResourceEntries();
  if (!entries) {
    return void 0;
  }
  return findLast(entries, (entry) => entry.name === resourceUrl && entry.startTime <= lcpStartTime);
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/resource/retrieveInitialDocumentResourceTiming.js
function retrieveInitialDocumentResourceTiming(configuration, callback) {
  runOnReadyState(configuration, "interactive", () => {
    const navigationEntry = mockable(getNavigationEntry)();
    const entry = Object.assign(navigationEntry.toJSON(), {
      entryType: RumPerformanceEntryType.RESOURCE,
      initiatorType: FAKE_INITIAL_DOCUMENT,
      // The ResourceTiming duration entry should be `responseEnd - startTime`. With
      // NavigationTiming entries, `startTime` is always 0, so set it to `responseEnd`.
      duration: navigationEntry.responseEnd,
      traceId: getDocumentTraceId(document),
      toJSON: () => ({ ...entry, toJSON: void 0 })
    });
    callback(entry);
  });
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/resource/requestRegistry.js
var MAX_REQUESTS = 1e3;
function createRequestRegistry(lifeCycle) {
  const requests = /* @__PURE__ */ new Set();
  let tooManyRequestsReported = false;
  const subscription = lifeCycle.subscribe(8, (request) => {
    requests.add(request);
    if (requests.size > MAX_REQUESTS) {
      const oldestRequest = requests.values().next().value;
      if (!tooManyRequestsReported) {
        tooManyRequestsReported = true;
        let debugContext;
        if (isExperimentalFeatureEnabled(ExperimentalFeature.TOO_MANY_REQUESTS_INVESTIGATION)) {
          let abortedCount = 0;
          let abortedOnStartCount = 0;
          let xhrCount = 0;
          let withoutMatchingEntryCount = 0;
          for (const r of requests) {
            if (r.isAborted) {
              abortedCount++;
            }
            if (r.isAbortedOnStart) {
              abortedOnStartCount++;
            }
            if (r.type === RequestType.XHR) {
              xhrCount++;
            }
            const entries = performance.getEntriesByName(r.url, "resource");
            const hasMatchingEntry = entries.some((e) => e.startTime >= r.startClocks.relative);
            if (!hasMatchingEntry) {
              withoutMatchingEntryCount++;
            }
          }
          const oldestRequestAge = timeStampNow() - oldestRequest.startClocks.timeStamp;
          debugContext = {
            abortedCount,
            abortedOnStartCount,
            xhrCount,
            fetchCount: requests.size - xhrCount,
            oldestRequestAge,
            oldestRequestEndAge: oldestRequestAge - oldestRequest.duration,
            withoutMatchingEntryCount
          };
        }
        addTelemetryDebug("Too many requests", debugContext);
      }
      requests.delete(oldestRequest);
    }
  });
  return {
    getMatchingRequest(entry) {
      let minTimeDifference = Infinity;
      let closestRequest;
      for (const request of requests) {
        const timeDifference = entry.startTime - request.startClocks.relative;
        if (0 <= timeDifference && timeDifference < minTimeDifference && request.url === entry.name) {
          minTimeDifference = Math.abs(timeDifference);
          closestRequest = request;
        }
      }
      if (closestRequest) {
        requests.delete(closestRequest);
      }
      return closestRequest;
    },
    stop() {
      subscription.unsubscribe();
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/resource/trackManualResources.js
function trackManualResources(lifeCycle, resourceTracker) {
  function startManualResource(url, options = {}, startClocks = clocksNow()) {
    var _a;
    const lookupKey = (_a = options.resourceKey) !== null && _a !== void 0 ? _a : url;
    resourceTracker.start(lookupKey, startClocks, {
      url,
      ...options
    });
  }
  function stopManualResource(url, options = {}, stopClocks = clocksNow()) {
    var _a;
    const lookupKey = (_a = options.resourceKey) !== null && _a !== void 0 ? _a : url;
    const stopped = resourceTracker.stop(lookupKey, stopClocks, {
      context: options.context,
      type: options.type
    });
    if (!stopped) {
      return;
    }
    const duration = elapsed(stopped.startClocks.relative, stopClocks.relative);
    const rawRumEvent = {
      date: stopped.startClocks.timeStamp,
      type: RumEventType.RESOURCE,
      resource: {
        id: stopped.id,
        type: stopped.type || ResourceType.OTHER,
        url: sanitizeIfLongDataUrl(stopped.url),
        duration: toServerDuration(duration),
        method: stopped.method,
        status_code: options.statusCode,
        size: options.size
      },
      _dd: {},
      context: stopped.context
    };
    lifeCycle.notify(12, {
      rawRumEvent,
      startClocks: stopped.startClocks,
      duration,
      domainContext: { isManual: true }
    });
  }
  return {
    startResource: startManualResource,
    stopResource: stopManualResource
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/resource/resourceCollection.js
function startResourceCollection(lifeCycle, configuration, pageStateHistory) {
  const taskQueue = mockable(createTaskQueue)();
  let requestRegistry;
  const isEarlyRequestCollectionEnabled = configuration.trackEarlyRequests;
  if (isEarlyRequestCollectionEnabled) {
    requestRegistry = createRequestRegistry(lifeCycle);
  } else {
    lifeCycle.subscribe(8, (request) => {
      handleResource(() => processRequest(request, configuration, pageStateHistory));
    });
  }
  const performanceResourceSubscription = createPerformanceObservable(configuration, {
    type: RumPerformanceEntryType.RESOURCE,
    buffered: true
  }).subscribe((entries) => {
    for (const entry of entries) {
      if (isEarlyRequestCollectionEnabled || !isResourceEntryRequestType(entry)) {
        handleResource(() => processResourceEntry(entry, configuration, pageStateHistory, requestRegistry));
      }
    }
  });
  mockable(retrieveInitialDocumentResourceTiming)(configuration, (timing) => {
    handleResource(() => processResourceEntry(timing, configuration, pageStateHistory, requestRegistry));
  });
  function handleResource(computeRawEvent) {
    taskQueue.push(() => {
      const rawEvent = computeRawEvent();
      if (rawEvent) {
        lifeCycle.notify(12, rawEvent);
      }
    });
  }
  const resourceTracker = startEventTracker(lifeCycle);
  const manualResources = trackManualResources(lifeCycle, resourceTracker);
  return {
    startResource: manualResources.startResource,
    stopResource: manualResources.stopResource,
    stop: () => {
      taskQueue.stop();
      performanceResourceSubscription.unsubscribe();
      resourceTracker.stopAll();
    }
  };
}
function processRequest(request, configuration, pageStateHistory) {
  const matchingTiming = matchRequestResourceEntry(request);
  return assembleResource(matchingTiming, request, pageStateHistory, configuration);
}
function processResourceEntry(entry, configuration, pageStateHistory, requestRegistry) {
  const matchingRequest = isResourceEntryRequestType(entry) && requestRegistry ? requestRegistry.getMatchingRequest(entry) : void 0;
  return assembleResource(entry, matchingRequest, pageStateHistory, configuration);
}
function assembleResource(entry, request, pageStateHistory, configuration) {
  if (!entry && !request) {
    return;
  }
  const tracingInfo = request ? computeRequestTracingInfo(request, configuration) : computeResourceEntryTracingInfo(entry, configuration);
  if (!configuration.trackResources && !tracingInfo) {
    return;
  }
  const startClocks = entry ? relativeToClocks(entry.startTime) : request.startClocks;
  const duration = entry ? computeResourceEntryDuration(entry) : computeRequestDuration(pageStateHistory, startClocks, request.duration);
  const graphql = request && computeGraphQlMetaData(request, configuration);
  const response = entry && computeResourceResponse(entry);
  const resourceEvent = combine({
    date: startClocks.timeStamp,
    resource: {
      id: generateUUID(),
      duration: toServerDuration(duration),
      // TODO: in the future when `entry` is required, we can probably only rely on `computeResourceEntryType`
      type: request ? request.type === RequestType.XHR ? ResourceType.XHR : ResourceType.FETCH : computeResourceEntryType(entry),
      method: request ? request.method : void 0,
      status_code: request ? request.status : discardZeroStatus(entry.responseStatus),
      url: request ? sanitizeIfLongDataUrl(request.url) : entry.name,
      protocol: entry && computeResourceEntryProtocol(entry),
      delivery_type: entry && computeResourceEntryDeliveryType(entry),
      graphql,
      response
    },
    type: RumEventType.RESOURCE,
    _dd: {
      discarded: !configuration.trackResources
    }
  }, tracingInfo, entry && computeResourceEntryMetrics(entry));
  return {
    startClocks,
    duration,
    rawRumEvent: resourceEvent,
    domainContext: getResourceDomainContext(entry, request)
  };
}
function computeGraphQlMetaData(request, configuration) {
  const graphQlConfig = findGraphQlConfiguration(request.url, configuration);
  if (!graphQlConfig) {
    return;
  }
  return extractGraphQlMetadata(request, graphQlConfig);
}
function computeResourceResponse(entry) {
  const contentType = entry.contentType;
  if (contentType) {
    return {
      headers: {
        "content-type": contentType
      }
    };
  }
  return void 0;
}
function getResourceDomainContext(entry, request) {
  if (request) {
    const baseDomainContext = {
      performanceEntry: entry,
      isAborted: request.isAborted,
      handlingStack: request.handlingStack
    };
    if (request.type === RequestType.XHR) {
      return {
        xhr: request.xhr,
        ...baseDomainContext
      };
    }
    return {
      requestInput: request.input,
      requestInit: request.init,
      response: request.response,
      error: request.error,
      ...baseDomainContext
    };
  }
  return {
    // Currently, at least one of `entry` or `request` must be defined when calling this function.
    // So `entry` is guaranteed to be defined here. In the future, when `entry` is required, we can
    // remove the `!` assertion.
    performanceEntry: entry
  };
}
function computeResourceEntryMetrics(entry) {
  const { renderBlockingStatus } = entry;
  return {
    resource: {
      render_blocking_status: renderBlockingStatus,
      ...computeResourceEntrySize(entry),
      ...computeResourceEntryDetails(entry)
    }
  };
}
function computeRequestTracingInfo(request, configuration) {
  const hasBeenTraced = request.traceSampled && request.traceId && request.spanId;
  if (!hasBeenTraced) {
    return void 0;
  }
  return {
    _dd: {
      span_id: request.spanId.toString(),
      trace_id: request.traceId.toString(),
      rule_psr: configuration.rulePsr
    }
  };
}
function computeResourceEntryTracingInfo(entry, configuration) {
  const hasBeenTraced = entry.traceId;
  if (!hasBeenTraced) {
    return void 0;
  }
  return {
    _dd: {
      trace_id: entry.traceId,
      span_id: createSpanIdentifier().toString(),
      rule_psr: configuration.rulePsr
    }
  };
}
function computeRequestDuration(pageStateHistory, startClocks, duration) {
  return !pageStateHistory.wasInPageStateDuringPeriod("frozen", startClocks.relative, duration) ? duration : void 0;
}
function discardZeroStatus(statusCode) {
  return statusCode === 0 ? void 0 : statusCode;
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/trackViewEventCounts.js
function trackViewEventCounts(lifeCycle, viewId, onChange) {
  const { stop, eventCounts } = trackEventCounts({
    lifeCycle,
    isChildEvent: (event) => event.view.id === viewId,
    onChange
  });
  return {
    stop,
    eventCounts
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/trackFirstContentfulPaint.js
var FCP_MAXIMUM_DELAY = 10 * ONE_MINUTE;
function trackFirstContentfulPaint(configuration, firstHidden, callback) {
  const performanceSubscription = createPerformanceObservable(configuration, {
    type: RumPerformanceEntryType.PAINT,
    buffered: true
  }).subscribe((entries) => {
    const fcpEntry = entries.find((entry) => entry.name === "first-contentful-paint" && entry.startTime < firstHidden.timeStamp && entry.startTime < FCP_MAXIMUM_DELAY);
    if (fcpEntry) {
      callback(fcpEntry.startTime);
    }
  });
  return {
    stop: performanceSubscription.unsubscribe
  };
}
function trackRestoredFirstContentfulPaint(viewStartRelative, callback) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      callback(elapsed(viewStartRelative, relativeNow()));
    });
  });
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/trackFirstInput.js
function trackFirstInput(configuration, firstHidden, callback) {
  const performanceFirstInputSubscription = createPerformanceObservable(configuration, {
    type: RumPerformanceEntryType.FIRST_INPUT,
    buffered: true
  }).subscribe((entries) => {
    const firstInputEntry = entries.find((entry) => entry.startTime < firstHidden.timeStamp);
    if (firstInputEntry) {
      const firstInputDelay = elapsed(firstInputEntry.startTime, firstInputEntry.processingStart);
      let firstInputTargetSelector;
      if (firstInputEntry.target && isElementNode(firstInputEntry.target)) {
        firstInputTargetSelector = getSelectorFromElement(firstInputEntry.target, configuration.actionNameAttribute);
      }
      callback({
        // Ensure firstInputDelay to be positive, see
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1185815
        delay: firstInputDelay >= 0 ? firstInputDelay : 0,
        time: firstInputEntry.startTime,
        targetSelector: firstInputTargetSelector
      });
    }
  });
  return {
    stop: () => {
      performanceFirstInputSubscription.unsubscribe();
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/trackNavigationTimings.js
function trackNavigationTimings(configuration, callback) {
  return waitAfterLoadEvent(configuration, () => {
    const entry = mockable(getNavigationEntry)();
    if (!isIncompleteNavigation(entry)) {
      callback(processNavigationEntry(entry));
    }
  });
}
function processNavigationEntry(entry) {
  return {
    domComplete: entry.domComplete,
    domContentLoaded: entry.domContentLoadedEventEnd,
    domInteractive: entry.domInteractive,
    loadEvent: entry.loadEventEnd,
    firstByte: sanitizeFirstByte(entry)
  };
}
function isIncompleteNavigation(entry) {
  return entry.loadEventEnd <= 0;
}
function waitAfterLoadEvent(configuration, callback) {
  let timeoutId;
  const { stop: stopOnReadyState } = runOnReadyState(configuration, "complete", () => {
    timeoutId = setTimeout(() => callback());
  });
  return {
    stop: () => {
      stopOnReadyState();
      clearTimeout(timeoutId);
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/trackLargestContentfulPaint.js
var LCP_MAXIMUM_DELAY = 10 * ONE_MINUTE;
function trackLargestContentfulPaint(configuration, firstHidden, eventTarget, callback) {
  let firstInteractionTimestamp = Infinity;
  const { stop: stopEventListener } = addEventListeners(configuration, eventTarget, [
    "pointerdown",
    "keydown"
    /* DOM_EVENT.KEY_DOWN */
  ], (event) => {
    firstInteractionTimestamp = event.timeStamp;
  }, { capture: true, once: true });
  let biggestLcpSize = 0;
  const performanceLcpSubscription = createPerformanceObservable(configuration, {
    type: RumPerformanceEntryType.LARGEST_CONTENTFUL_PAINT,
    buffered: true
  }).subscribe((entries) => {
    const lcpEntry = findLast(entries, (entry) => entry.entryType === RumPerformanceEntryType.LARGEST_CONTENTFUL_PAINT && entry.startTime < firstInteractionTimestamp && entry.startTime < firstHidden.timeStamp && entry.startTime < LCP_MAXIMUM_DELAY && // Ensure to get the LCP entry with the biggest size, see
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1516655
    entry.size > biggestLcpSize);
    if (lcpEntry) {
      let lcpTargetSelector;
      if (lcpEntry.element) {
        lcpTargetSelector = getSelectorFromElement(lcpEntry.element, configuration.actionNameAttribute);
      }
      const resourceUrl = computeLcpEntryUrl(lcpEntry);
      const lcpValue = lcpEntry.startTime;
      const subParts = computeLcpSubParts(resourceUrl, lcpValue);
      callback({
        value: lcpValue,
        targetSelector: lcpTargetSelector,
        resourceUrl,
        subParts
      });
      biggestLcpSize = lcpEntry.size;
    }
  });
  return {
    stop: () => {
      stopEventListener();
      performanceLcpSubscription.unsubscribe();
    }
  };
}
function computeLcpEntryUrl(entry) {
  return entry.url === "" ? void 0 : entry.url;
}
function computeLcpSubParts(resourceUrl, lcpValue) {
  const firstByte = sanitizeFirstByte(getNavigationEntry());
  if (firstByte === void 0) {
    return void 0;
  }
  const lcpResourceEntry = resourceUrl ? findLcpResourceEntry(resourceUrl, lcpValue) : void 0;
  const lcpRequestStart = lcpResourceEntry ? Math.max(firstByte, lcpResourceEntry.requestStart || lcpResourceEntry.startTime) : firstByte;
  const lcpResponseEnd = Math.min(lcpValue, Math.max(lcpRequestStart, (lcpResourceEntry === null || lcpResourceEntry === void 0 ? void 0 : lcpResourceEntry.responseEnd) || 0));
  return {
    loadDelay: lcpRequestStart - firstByte,
    loadTime: lcpResponseEnd - lcpRequestStart,
    renderDelay: lcpValue - lcpResponseEnd
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/trackFirstHidden.js
function trackFirstHidden(configuration, viewStart, eventTarget = window) {
  if (document.visibilityState === "hidden") {
    return { timeStamp: 0, stop: noop };
  }
  if (supportPerformanceTimingEvent(RumPerformanceEntryType.VISIBILITY_STATE)) {
    const firstHiddenEntry = performance.getEntriesByType(RumPerformanceEntryType.VISIBILITY_STATE).filter((entry) => entry.name === "hidden").find((entry) => entry.startTime >= viewStart.relative);
    if (firstHiddenEntry) {
      return { timeStamp: firstHiddenEntry.startTime, stop: noop };
    }
  }
  let timeStamp = Infinity;
  const { stop } = addEventListeners(configuration, eventTarget, [
    "pagehide",
    "visibilitychange"
    /* DOM_EVENT.VISIBILITY_CHANGE */
  ], (event) => {
    if (event.type === "pagehide" || document.visibilityState === "hidden") {
      timeStamp = event.timeStamp;
      stop();
    }
  }, { capture: true });
  return {
    get timeStamp() {
      return timeStamp;
    },
    stop
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/trackInitialViewMetrics.js
function trackInitialViewMetrics(configuration, viewStart, setLoadEvent, scheduleViewUpdate) {
  const initialViewMetrics = {};
  const { stop: stopNavigationTracking } = trackNavigationTimings(configuration, (navigationTimings) => {
    setLoadEvent(navigationTimings.loadEvent);
    initialViewMetrics.navigationTimings = navigationTimings;
    scheduleViewUpdate();
  });
  const firstHidden = trackFirstHidden(configuration, viewStart);
  const { stop: stopFCPTracking } = trackFirstContentfulPaint(configuration, firstHidden, (firstContentfulPaint) => {
    initialViewMetrics.firstContentfulPaint = firstContentfulPaint;
    scheduleViewUpdate();
  });
  const { stop: stopLCPTracking } = trackLargestContentfulPaint(configuration, firstHidden, window, (largestContentfulPaint) => {
    initialViewMetrics.largestContentfulPaint = largestContentfulPaint;
    scheduleViewUpdate();
  });
  const { stop: stopFIDTracking } = trackFirstInput(configuration, firstHidden, (firstInput) => {
    initialViewMetrics.firstInput = firstInput;
    scheduleViewUpdate();
  });
  function stop() {
    stopNavigationTracking();
    stopFCPTracking();
    stopLCPTracking();
    stopFIDTracking();
    firstHidden.stop();
  }
  return {
    stop,
    initialViewMetrics
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/getClsAttributionImpactedArea.js
var calculateArea = (width, height) => width * height;
var calculateIntersectionArea = (rect1, rect2) => {
  const left = Math.max(rect1.left, rect2.left);
  const top = Math.max(rect1.top, rect2.top);
  const right = Math.min(rect1.right, rect2.right);
  const bottom = Math.min(rect1.bottom, rect2.bottom);
  if (left >= right || top >= bottom) {
    return 0;
  }
  return calculateArea(right - left, bottom - top);
};
var getClsAttributionImpactedArea = (source) => {
  const previousArea = calculateArea(source.previousRect.width, source.previousRect.height);
  const currentArea = calculateArea(source.currentRect.width, source.currentRect.height);
  const intersectionArea = calculateIntersectionArea(source.previousRect, source.currentRect);
  return previousArea + currentArea - intersectionArea;
};

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/trackCumulativeLayoutShift.js
function trackCumulativeLayoutShift(configuration, viewStart, callback) {
  if (!isLayoutShiftSupported()) {
    return {
      stop: noop
    };
  }
  let maxClsValue = 0;
  let biggestShift;
  callback({
    value: 0
  });
  const slidingWindow = slidingSessionWindow();
  const performanceSubscription = createPerformanceObservable(configuration, {
    type: RumPerformanceEntryType.LAYOUT_SHIFT,
    buffered: true
  }).subscribe((entries) => {
    var _a;
    for (const entry of entries) {
      if (entry.hadRecentInput || entry.startTime < viewStart) {
        continue;
      }
      const { cumulatedValue, isMaxValue } = slidingWindow.update(entry);
      if (isMaxValue) {
        const attribution = getTopImpactedElement(entry.sources);
        biggestShift = {
          target: (attribution === null || attribution === void 0 ? void 0 : attribution.node) ? new WeakRef(attribution.node) : void 0,
          time: elapsed(viewStart, entry.startTime),
          previousRect: attribution === null || attribution === void 0 ? void 0 : attribution.previousRect,
          currentRect: attribution === null || attribution === void 0 ? void 0 : attribution.currentRect,
          devicePixelRatio: window.devicePixelRatio
        };
      }
      if (cumulatedValue > maxClsValue) {
        maxClsValue = cumulatedValue;
        const target = (_a = biggestShift === null || biggestShift === void 0 ? void 0 : biggestShift.target) === null || _a === void 0 ? void 0 : _a.deref();
        callback({
          value: round(maxClsValue, 4),
          targetSelector: target && getSelectorFromElement(target, configuration.actionNameAttribute),
          time: biggestShift === null || biggestShift === void 0 ? void 0 : biggestShift.time,
          previousRect: (biggestShift === null || biggestShift === void 0 ? void 0 : biggestShift.previousRect) ? asRumRect(biggestShift.previousRect) : void 0,
          currentRect: (biggestShift === null || biggestShift === void 0 ? void 0 : biggestShift.currentRect) ? asRumRect(biggestShift.currentRect) : void 0,
          devicePixelRatio: biggestShift === null || biggestShift === void 0 ? void 0 : biggestShift.devicePixelRatio
        });
      }
    }
  });
  return {
    stop: () => {
      performanceSubscription.unsubscribe();
    }
  };
}
function getTopImpactedElement(sources) {
  let topImpactedSource;
  for (const source of sources) {
    if (source.node && isElementNode(source.node)) {
      const currentImpactedArea = getClsAttributionImpactedArea(source);
      if (!topImpactedSource || getClsAttributionImpactedArea(topImpactedSource) < currentImpactedArea) {
        topImpactedSource = source;
      }
    }
  }
  return topImpactedSource;
}
function asRumRect({ x, y, width, height }) {
  return { x, y, width, height };
}
var MAX_WINDOW_DURATION = 5 * ONE_SECOND;
var MAX_UPDATE_GAP = ONE_SECOND;
function slidingSessionWindow() {
  let cumulatedValue = 0;
  let startTime;
  let endTime2;
  let maxValue = 0;
  return {
    update: (entry) => {
      const shouldCreateNewWindow = startTime === void 0 || entry.startTime - endTime2 >= MAX_UPDATE_GAP || entry.startTime - startTime >= MAX_WINDOW_DURATION;
      let isMaxValue;
      if (shouldCreateNewWindow) {
        startTime = endTime2 = entry.startTime;
        maxValue = cumulatedValue = entry.value;
        isMaxValue = true;
      } else {
        cumulatedValue += entry.value;
        endTime2 = entry.startTime;
        isMaxValue = entry.value > maxValue;
        if (isMaxValue) {
          maxValue = entry.value;
        }
      }
      return {
        cumulatedValue,
        isMaxValue
      };
    }
  };
}
function isLayoutShiftSupported() {
  return supportPerformanceTimingEvent(RumPerformanceEntryType.LAYOUT_SHIFT) && "WeakRef" in window;
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/interactionCountPolyfill.js
var observer;
var interactionCountEstimate = 0;
var minKnownInteractionId = Infinity;
var maxKnownInteractionId = 0;
function initInteractionCountPolyfill() {
  if ("interactionCount" in performance || observer) {
    return;
  }
  observer = new window.PerformanceObserver(monitor((entries) => {
    entries.getEntries().forEach((e) => {
      const entry = e;
      if (entry.interactionId) {
        minKnownInteractionId = Math.min(minKnownInteractionId, entry.interactionId);
        maxKnownInteractionId = Math.max(maxKnownInteractionId, entry.interactionId);
        interactionCountEstimate = (maxKnownInteractionId - minKnownInteractionId) / 7 + 1;
      }
    });
  }));
  observer.observe({ type: "event", buffered: true, durationThreshold: 0 });
}
var getInteractionCount = () => observer ? interactionCountEstimate : window.performance.interactionCount || 0;

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/trackInteractionToNextPaint.js
var MAX_INTERACTION_ENTRIES = 10;
var MAX_INP_VALUE = 1 * ONE_MINUTE;
var RENDER_TIME_GROUPING_THRESHOLD = 8;
function trackInteractionToNextPaint(configuration, viewStart, viewLoadingType) {
  if (!isInteractionToNextPaintSupported()) {
    return {
      getInteractionToNextPaint: () => void 0,
      setViewEnd: noop,
      stop: noop
    };
  }
  let viewEnd = Infinity;
  let currentInp;
  const { getViewInteractionCount, stopViewInteractionCount } = trackViewInteractionCount(viewLoadingType);
  const longestInteractions = trackLongestInteractions(getViewInteractionCount);
  const subPartsTracker = isExperimentalFeatureEnabled(ExperimentalFeature.INP_SUBPARTS) ? createSubPartsTracker(longestInteractions) : null;
  const firstInputSubscription = createPerformanceObservable(configuration, {
    type: RumPerformanceEntryType.FIRST_INPUT,
    buffered: true
  }).subscribe(handleEntries);
  const eventSubscription = createPerformanceObservable(configuration, {
    type: RumPerformanceEntryType.EVENT,
    // durationThreshold only impact PerformanceEventTiming entries used for INP computation which requires a threshold at 40 (default is 104ms)
    // cf: https://github.com/GoogleChrome/web-vitals/blob/3806160ffbc93c3c4abf210a167b81228172b31c/src/onINP.ts#L202-L210
    durationThreshold: 40,
    buffered: true
  }).subscribe(handleEntries);
  function handleEntries(entries) {
    for (const entry of entries) {
      if (entry.interactionId && // Check the entry start time is inside the view bounds because some view interactions can be reported after the view end (if long duration).
      entry.startTime >= viewStart && entry.startTime <= viewEnd) {
        longestInteractions.process(entry);
        subPartsTracker === null || subPartsTracker === void 0 ? void 0 : subPartsTracker.process(entry);
      }
    }
    subPartsTracker === null || subPartsTracker === void 0 ? void 0 : subPartsTracker.pruneUntracked();
    const candidate = longestInteractions.estimateP98Interaction();
    if (candidate) {
      updateCurrentInp(candidate);
    }
  }
  function updateCurrentInp(candidate) {
    const newStartTime = elapsed(viewStart, candidate.startTime);
    if (!currentInp || candidate.duration !== currentInp.duration || newStartTime !== currentInp.startTime) {
      let targetSelector = getInteractionSelector(candidate.startTime);
      if (!targetSelector && candidate.target && isElementNode(candidate.target)) {
        targetSelector = getSelectorFromElement(candidate.target, configuration.actionNameAttribute);
      }
      currentInp = {
        duration: candidate.duration,
        startTime: newStartTime,
        targetSelector
      };
    }
    if (subPartsTracker) {
      currentInp.subParts = subPartsTracker.computeSubParts(candidate, sanitizeInpValue(currentInp.duration));
    }
  }
  return {
    getInteractionToNextPaint: () => {
      if (currentInp) {
        return {
          value: sanitizeInpValue(currentInp.duration),
          targetSelector: currentInp.targetSelector,
          time: currentInp.startTime,
          subParts: currentInp.subParts
        };
      } else if (getViewInteractionCount()) {
        return {
          value: 0
        };
      }
    },
    setViewEnd: (viewEndTime) => {
      viewEnd = viewEndTime;
      stopViewInteractionCount();
    },
    stop: () => {
      eventSubscription.unsubscribe();
      firstInputSubscription.unsubscribe();
      subPartsTracker === null || subPartsTracker === void 0 ? void 0 : subPartsTracker.stop();
    }
  };
}
function trackLongestInteractions(getViewInteractionCount) {
  const longestInteractions = [];
  function sortAndTrimLongestInteractions() {
    longestInteractions.sort((a, b) => b.duration - a.duration).splice(MAX_INTERACTION_ENTRIES);
  }
  return {
    /**
     * Process the performance entry:
     * - if its duration is long enough, add the performance entry to the list of worst interactions
     * - if an entry with the same interaction id exists and its duration is lower than the new one, then replace it in the list of worst interactions
     */
    process(entry) {
      const interactionIndex = longestInteractions.findIndex((interaction) => entry.interactionId === interaction.interactionId);
      const minLongestInteraction = longestInteractions[longestInteractions.length - 1];
      if (interactionIndex !== -1) {
        if (entry.duration > longestInteractions[interactionIndex].duration) {
          longestInteractions[interactionIndex] = entry;
          sortAndTrimLongestInteractions();
        }
      } else if (longestInteractions.length < MAX_INTERACTION_ENTRIES || entry.duration > minLongestInteraction.duration) {
        longestInteractions.push(entry);
        sortAndTrimLongestInteractions();
      }
    },
    /**
     * Compute the p98 longest interaction.
     * For better performance the computation is based on 10 longest interactions and the interaction count of the current view.
     */
    estimateP98Interaction() {
      const interactionIndex = Math.min(longestInteractions.length - 1, Math.floor(getViewInteractionCount() / 50));
      return longestInteractions[interactionIndex];
    },
    isTracked(interactionId) {
      return longestInteractions.some((i) => i.interactionId === interactionId);
    }
  };
}
function trackViewInteractionCount(viewLoadingType) {
  initInteractionCountPolyfill();
  const previousInteractionCount = viewLoadingType === ViewLoadingType.INITIAL_LOAD ? 0 : getInteractionCount();
  let state = { stopped: false };
  function computeViewInteractionCount() {
    return getInteractionCount() - previousInteractionCount;
  }
  return {
    getViewInteractionCount: () => {
      if (state.stopped) {
        return state.interactionCount;
      }
      return computeViewInteractionCount();
    },
    stopViewInteractionCount: () => {
      state = { stopped: true, interactionCount: computeViewInteractionCount() };
    }
  };
}
function createSubPartsTracker(longestInteractions) {
  const groupsByInteractionId = /* @__PURE__ */ new Map();
  function updateGroupWithEntry(group, entry) {
    group.startTime = Math.min(entry.startTime, group.startTime);
    group.processingStart = Math.min(entry.processingStart, group.processingStart);
    group.processingEnd = Math.max(entry.processingEnd, group.processingEnd);
  }
  return {
    process(entry) {
      if (entry.interactionId === void 0 || !entry.processingStart || !entry.processingEnd) {
        return;
      }
      const renderTime = entry.startTime + entry.duration;
      const existingGroup = groupsByInteractionId.get(entry.interactionId);
      if (existingGroup) {
        updateGroupWithEntry(existingGroup, entry);
        return;
      }
      for (const [, group] of groupsByInteractionId.entries()) {
        if (Math.abs(renderTime - group.referenceRenderTime) <= RENDER_TIME_GROUPING_THRESHOLD) {
          updateGroupWithEntry(group, entry);
          groupsByInteractionId.set(entry.interactionId, group);
          return;
        }
      }
      groupsByInteractionId.set(entry.interactionId, {
        startTime: entry.startTime,
        processingStart: entry.processingStart,
        processingEnd: entry.processingEnd,
        referenceRenderTime: renderTime
      });
    },
    // Prune after all entries are grouped: groups not in longestInteractions can never affect p98 subparts.
    // Keeps groupsByInteractionId capped at MAX_INTERACTION_ENTRIES
    pruneUntracked() {
      for (const [interactionId] of groupsByInteractionId) {
        if (!longestInteractions.isTracked(interactionId)) {
          groupsByInteractionId.delete(interactionId);
        }
      }
    },
    computeSubParts(entry, inpDuration) {
      if (!entry.processingStart || !entry.processingEnd || entry.interactionId === void 0) {
        return void 0;
      }
      const group = groupsByInteractionId.get(entry.interactionId);
      if (!group) {
        return void 0;
      }
      const nextPaintTime = Math.max(group.startTime + inpDuration, group.processingStart);
      const processingEnd = Math.min(group.processingEnd, nextPaintTime);
      return {
        inputDelay: elapsed(group.startTime, group.processingStart),
        processingDuration: elapsed(group.processingStart, processingEnd),
        presentationDelay: elapsed(processingEnd, nextPaintTime)
      };
    },
    stop() {
      groupsByInteractionId.clear();
    }
  };
}
function isInteractionToNextPaintSupported() {
  return supportPerformanceTimingEvent(RumPerformanceEntryType.EVENT) && window.PerformanceEventTiming && "interactionId" in PerformanceEventTiming.prototype;
}
function sanitizeInpValue(inpValue) {
  return Math.min(inpValue, MAX_INP_VALUE);
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/trackLoadingTime.js
function trackLoadingTime(lifeCycle, domMutationObservable, windowOpenObservable, configuration, loadType, viewStart, callback) {
  let isWaitingForLoadEvent = loadType === ViewLoadingType.INITIAL_LOAD;
  let isWaitingForActivityLoadingTime = true;
  const loadingTimeCandidates = [];
  const firstHidden = trackFirstHidden(configuration, viewStart);
  function invokeCallbackIfAllCandidatesAreReceived() {
    if (!isWaitingForActivityLoadingTime && !isWaitingForLoadEvent && loadingTimeCandidates.length > 0) {
      const loadingTime = Math.max(...loadingTimeCandidates);
      if (loadingTime < firstHidden.timeStamp - viewStart.relative) {
        callback(loadingTime);
      }
    }
  }
  const { stop } = waitPageActivityEnd(lifeCycle, domMutationObservable, windowOpenObservable, configuration, (event) => {
    if (isWaitingForActivityLoadingTime) {
      isWaitingForActivityLoadingTime = false;
      if (event.hadActivity) {
        loadingTimeCandidates.push(elapsed(viewStart.timeStamp, event.end));
      }
      invokeCallbackIfAllCandidatesAreReceived();
    }
  });
  return {
    stop: () => {
      stop();
      firstHidden.stop();
    },
    setLoadEvent: (loadEvent) => {
      if (isWaitingForLoadEvent) {
        isWaitingForLoadEvent = false;
        loadingTimeCandidates.push(loadEvent);
        invokeCallbackIfAllCandidatesAreReceived();
      }
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/browser/scroll.js
function getScrollX() {
  let scrollX;
  const visual = window.visualViewport;
  if (visual) {
    scrollX = visual.pageLeft - visual.offsetLeft;
  } else if (window.scrollX !== void 0) {
    scrollX = window.scrollX;
  } else {
    scrollX = window.pageXOffset || 0;
  }
  return Math.round(scrollX);
}
function getScrollY() {
  let scrollY;
  const visual = window.visualViewport;
  if (visual) {
    scrollY = visual.pageTop - visual.offsetTop;
  } else if (window.scrollY !== void 0) {
    scrollY = window.scrollY;
  } else {
    scrollY = window.pageYOffset || 0;
  }
  return Math.round(scrollY);
}

// ../../node_modules/@datadog/browser-rum-core/esm/browser/viewportObservable.js
var viewportObservable;
function initViewportObservable(configuration) {
  if (!viewportObservable) {
    viewportObservable = createViewportObservable(configuration);
  }
  return viewportObservable;
}
function createViewportObservable(configuration) {
  return new Observable((observable) => {
    const { throttled: updateDimension } = throttle(() => {
      observable.notify(getViewportDimension());
    }, 200);
    return addEventListener(configuration, window, "resize", updateDimension, { capture: true, passive: true }).stop;
  });
}
function getViewportDimension() {
  const visual = window.visualViewport;
  if (visual) {
    return {
      width: Number(visual.width * visual.scale),
      height: Number(visual.height * visual.scale)
    };
  }
  return {
    width: Number(window.innerWidth || 0),
    height: Number(window.innerHeight || 0)
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/trackScrollMetrics.js
var THROTTLE_SCROLL_DURATION = ONE_SECOND;
function trackScrollMetrics(configuration, viewStart, callback, scrollValues = createScrollValuesObservable(configuration)) {
  let maxScrollDepth = 0;
  let maxScrollHeight = 0;
  let maxScrollHeightTime = 0;
  const subscription = scrollValues.subscribe(({ scrollDepth, scrollTop, scrollHeight }) => {
    let shouldUpdate = false;
    if (scrollDepth > maxScrollDepth) {
      maxScrollDepth = scrollDepth;
      shouldUpdate = true;
    }
    if (scrollHeight > maxScrollHeight) {
      maxScrollHeight = scrollHeight;
      const now = relativeNow();
      maxScrollHeightTime = elapsed(viewStart.relative, now);
      shouldUpdate = true;
    }
    if (shouldUpdate) {
      callback({
        maxDepth: Math.min(maxScrollDepth, maxScrollHeight),
        maxDepthScrollTop: scrollTop,
        maxScrollHeight,
        maxScrollHeightTime
      });
    }
  });
  return {
    stop: () => subscription.unsubscribe()
  };
}
function computeScrollValues() {
  const scrollTop = getScrollY();
  const { height } = getViewportDimension();
  const scrollHeight = Math.round((document.scrollingElement || document.documentElement).scrollHeight);
  const scrollDepth = Math.round(height + scrollTop);
  return {
    scrollHeight,
    scrollDepth,
    scrollTop
  };
}
function createScrollValuesObservable(configuration, throttleDuration = THROTTLE_SCROLL_DURATION) {
  return new Observable((observable) => {
    function notify() {
      observable.notify(computeScrollValues());
    }
    if (window.ResizeObserver) {
      const throttledNotify = throttle(notify, throttleDuration, {
        leading: false,
        trailing: true
      });
      const observerTarget = document.scrollingElement || document.documentElement;
      const resizeObserver = new ResizeObserver(monitor(throttledNotify.throttled));
      if (observerTarget) {
        resizeObserver.observe(observerTarget);
      }
      const eventListener = addEventListener(configuration, window, "scroll", throttledNotify.throttled, {
        passive: true
      });
      return () => {
        throttledNotify.cancel();
        resizeObserver.disconnect();
        eventListener.stop();
      };
    }
  });
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/trackCommonViewMetrics.js
function trackCommonViewMetrics(lifeCycle, domMutationObservable, windowOpenObservable, configuration, scheduleViewUpdate, loadingType, viewStart) {
  const commonViewMetrics = {};
  let hasManualLoadingTime = false;
  let viewEnded = false;
  const { stop: stopLoadingTimeTracking, setLoadEvent } = trackLoadingTime(lifeCycle, domMutationObservable, windowOpenObservable, configuration, loadingType, viewStart, (newLoadingTime) => {
    if (!hasManualLoadingTime) {
      commonViewMetrics.loadingTime = newLoadingTime;
      scheduleViewUpdate();
    }
  });
  const { stop: stopScrollMetricsTracking } = trackScrollMetrics(configuration, viewStart, (newScrollMetrics) => {
    commonViewMetrics.scroll = newScrollMetrics;
  });
  const { stop: stopCLSTracking } = trackCumulativeLayoutShift(configuration, viewStart.relative, (cumulativeLayoutShift) => {
    commonViewMetrics.cumulativeLayoutShift = cumulativeLayoutShift;
    scheduleViewUpdate();
  });
  const { stop: stopINPTracking, getInteractionToNextPaint, setViewEnd: setINPViewEnd } = trackInteractionToNextPaint(configuration, viewStart.relative, loadingType);
  return {
    stop: () => {
      stopLoadingTimeTracking();
      stopCLSTracking();
      stopScrollMetricsTracking();
    },
    stopINPTracking,
    setLoadEvent,
    setViewEnd: (viewEndTime) => {
      viewEnded = true;
      setINPViewEnd(viewEndTime);
    },
    getCommonViewMetrics: () => {
      commonViewMetrics.interactionToNextPaint = getInteractionToNextPaint();
      return commonViewMetrics;
    },
    setLoadingTime: (callTimestamp) => {
      if (viewEnded) {
        return;
      }
      const loadingTime = elapsed(viewStart.timeStamp, callTimestamp !== null && callTimestamp !== void 0 ? callTimestamp : timeStampNow());
      if (!hasManualLoadingTime) {
        stopLoadingTimeTracking();
      }
      hasManualLoadingTime = true;
      commonViewMetrics.loadingTime = loadingTime;
      scheduleViewUpdate();
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/bfCacheSupport.js
function onBFCacheRestore(configuration, callback) {
  const { stop } = addEventListener(configuration, window, "pageshow", (event) => {
    if (event.persisted) {
      callback(event);
    }
  }, { capture: true });
  return stop;
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/trackBfcacheMetrics.js
function trackBfcacheMetrics(viewStart, metrics, scheduleViewUpdate) {
  trackRestoredFirstContentfulPaint(viewStart.relative, (paintTime) => {
    metrics.firstContentfulPaint = paintTime;
    metrics.largestContentfulPaint = { value: paintTime };
    scheduleViewUpdate();
  });
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/trackViews.js
var THROTTLE_VIEW_UPDATE_PERIOD = 3e3;
var SESSION_KEEP_ALIVE_INTERVAL = 5 * ONE_MINUTE;
var KEEP_TRACKING_AFTER_VIEW_DELAY = 5 * ONE_MINUTE;
function trackViews(lifeCycle, domMutationObservable, windowOpenObservable, configuration, locationChangeObservable, areViewsTrackedAutomatically, initialViewOptions) {
  const activeViews = /* @__PURE__ */ new Set();
  let currentView = startNewView(ViewLoadingType.INITIAL_LOAD, clocksOrigin(), initialViewOptions);
  let stopOnBFCacheRestore;
  startViewLifeCycle();
  let locationChangeSubscription;
  if (areViewsTrackedAutomatically) {
    locationChangeSubscription = renewViewOnLocationChange(locationChangeObservable);
    if (configuration.trackBfcacheViews) {
      stopOnBFCacheRestore = onBFCacheRestore(configuration, (pageshowEvent) => {
        currentView.end();
        const startClocks = relativeToClocks(pageshowEvent.timeStamp);
        currentView = startNewView(ViewLoadingType.BF_CACHE, startClocks, void 0);
      });
    }
  }
  function startNewView(loadingType, startClocks, viewOptions) {
    const newlyCreatedView = newView(lifeCycle, domMutationObservable, windowOpenObservable, configuration, loadingType, startClocks, viewOptions);
    activeViews.add(newlyCreatedView);
    newlyCreatedView.stopObservable.subscribe(() => {
      activeViews.delete(newlyCreatedView);
    });
    return newlyCreatedView;
  }
  function startViewLifeCycle() {
    lifeCycle.subscribe(10, () => {
      currentView = startNewView(ViewLoadingType.ROUTE_CHANGE, void 0, {
        name: currentView.name,
        service: currentView.service,
        version: currentView.version,
        context: currentView.contextManager.getContext()
      });
    });
    lifeCycle.subscribe(9, () => {
      currentView.end({ sessionIsActive: false });
    });
  }
  function renewViewOnLocationChange(locationChangeObservable2) {
    return locationChangeObservable2.subscribe(({ oldLocation, newLocation }) => {
      if (areDifferentLocation(oldLocation, newLocation)) {
        currentView.end();
        currentView = startNewView(ViewLoadingType.ROUTE_CHANGE);
      }
    });
  }
  return {
    addTiming: (name, time = timeStampNow()) => {
      currentView.addTiming(name, time);
    },
    setLoadingTime: (callTimestamp) => currentView.setLoadingTime(callTimestamp),
    startView: (options, startClocks) => {
      currentView.end({ endClocks: startClocks });
      currentView = startNewView(ViewLoadingType.ROUTE_CHANGE, startClocks, options);
    },
    setViewContext: (context) => {
      currentView.contextManager.setContext(context);
    },
    setViewContextProperty: (key, value) => {
      currentView.contextManager.setContextProperty(key, value);
    },
    setViewName: (name) => {
      currentView.setViewName(name);
    },
    getViewContext: () => currentView.contextManager.getContext(),
    stop: () => {
      if (locationChangeSubscription) {
        locationChangeSubscription.unsubscribe();
      }
      if (stopOnBFCacheRestore) {
        stopOnBFCacheRestore();
      }
      currentView.end();
      activeViews.forEach((view) => view.stop());
    }
  };
}
function newView(lifeCycle, domMutationObservable, windowOpenObservable, configuration, loadingType, startClocks = clocksNow(), viewOptions) {
  const id = generateUUID();
  const stopObservable = new Observable();
  const customTimings = {};
  let documentVersion = 0;
  let endClocks;
  const location2 = shallowClone(mockable(window.location));
  const contextManager = createContextManager();
  let sessionIsActive = true;
  let name = viewOptions === null || viewOptions === void 0 ? void 0 : viewOptions.name;
  const service = (viewOptions === null || viewOptions === void 0 ? void 0 : viewOptions.service) || configuration.service;
  const version = (viewOptions === null || viewOptions === void 0 ? void 0 : viewOptions.version) || configuration.version;
  const context = viewOptions === null || viewOptions === void 0 ? void 0 : viewOptions.context;
  const handlingStack = viewOptions === null || viewOptions === void 0 ? void 0 : viewOptions.handlingStack;
  if (context) {
    contextManager.setContext(context);
  }
  const viewCreatedEvent = {
    id,
    name,
    startClocks,
    service,
    version,
    context,
    url: viewOptions === null || viewOptions === void 0 ? void 0 : viewOptions.url
  };
  lifeCycle.notify(1, viewCreatedEvent);
  lifeCycle.notify(2, viewCreatedEvent);
  const { throttled, cancel: cancelScheduleViewUpdate } = throttle(triggerViewUpdate, THROTTLE_VIEW_UPDATE_PERIOD, {
    leading: false
  });
  const { setLoadEvent, setViewEnd, stop: stopCommonViewMetricsTracking, stopINPTracking, getCommonViewMetrics, setLoadingTime } = trackCommonViewMetrics(lifeCycle, domMutationObservable, windowOpenObservable, configuration, scheduleViewUpdate, loadingType, startClocks);
  const { stop: stopInitialViewMetricsTracking, initialViewMetrics } = loadingType === ViewLoadingType.INITIAL_LOAD ? trackInitialViewMetrics(configuration, startClocks, setLoadEvent, scheduleViewUpdate) : { stop: noop, initialViewMetrics: {} };
  if (loadingType === ViewLoadingType.BF_CACHE) {
    trackBfcacheMetrics(startClocks, initialViewMetrics, scheduleViewUpdate);
  }
  const { stop: stopEventCountsTracking, eventCounts } = trackViewEventCounts(lifeCycle, id, scheduleViewUpdate);
  const keepAliveIntervalId = setInterval(triggerViewUpdate, SESSION_KEEP_ALIVE_INTERVAL);
  const pageMayExitSubscription = lifeCycle.subscribe(11, (pageMayExitEvent) => {
    if (pageMayExitEvent.reason === PageExitReason.UNLOADING) {
      triggerViewUpdate();
    }
  });
  triggerViewUpdate();
  contextManager.changeObservable.subscribe(scheduleViewUpdate);
  function triggerBeforeViewUpdate() {
    lifeCycle.notify(3, {
      id,
      name,
      context: contextManager.getContext(),
      startClocks,
      sessionIsActive
    });
  }
  function scheduleViewUpdate() {
    triggerBeforeViewUpdate();
    throttled();
  }
  function triggerViewUpdate() {
    cancelScheduleViewUpdate();
    triggerBeforeViewUpdate();
    documentVersion += 1;
    const currentEnd = endClocks === void 0 ? timeStampNow() : endClocks.timeStamp;
    lifeCycle.notify(4, {
      customTimings,
      documentVersion,
      id,
      name,
      service,
      version,
      context: contextManager.getContext(),
      loadingType,
      location: location2,
      handlingStack,
      startClocks,
      commonViewMetrics: getCommonViewMetrics(),
      initialViewMetrics,
      duration: elapsed(startClocks.timeStamp, currentEnd),
      isActive: endClocks === void 0,
      sessionIsActive,
      eventCounts
    });
  }
  return {
    get name() {
      return name;
    },
    service,
    version,
    contextManager,
    stopObservable,
    end(options = {}) {
      var _a, _b;
      if (endClocks) {
        return;
      }
      endClocks = (_a = options.endClocks) !== null && _a !== void 0 ? _a : clocksNow();
      sessionIsActive = (_b = options.sessionIsActive) !== null && _b !== void 0 ? _b : true;
      lifeCycle.notify(5, { endClocks });
      lifeCycle.notify(6, { endClocks });
      clearInterval(keepAliveIntervalId);
      setViewEnd(endClocks.relative);
      stopCommonViewMetricsTracking();
      pageMayExitSubscription.unsubscribe();
      triggerViewUpdate();
      setTimeout(() => {
        this.stop();
      }, KEEP_TRACKING_AFTER_VIEW_DELAY);
    },
    stop() {
      stopInitialViewMetricsTracking();
      stopEventCountsTracking();
      stopINPTracking();
      stopObservable.notify();
    },
    addTiming(name2, time) {
      if (endClocks) {
        return;
      }
      const relativeTime = looksLikeRelativeTime(time) ? time : elapsed(startClocks.timeStamp, time);
      customTimings[sanitizeTiming(name2)] = relativeTime;
      scheduleViewUpdate();
    },
    setLoadingTime,
    setViewName(updatedName) {
      name = updatedName;
      triggerViewUpdate();
    }
  };
}
function sanitizeTiming(name) {
  const sanitized = name.replace(/[^a-zA-Z0-9-_.@$]/g, "_");
  if (sanitized !== name) {
    display.warn(`Invalid timing name: ${name}, sanitized to: ${sanitized}`);
  }
  return sanitized;
}
function areDifferentLocation(currentLocation, otherLocation) {
  return currentLocation.pathname !== otherLocation.pathname || !isHashAnAnchor(otherLocation.hash) && getPathFromHash(otherLocation.hash) !== getPathFromHash(currentLocation.hash);
}
function isHashAnAnchor(hash) {
  const correspondingId = hash.substring(1);
  return correspondingId !== "" && !!document.getElementById(correspondingId);
}
function getPathFromHash(hash) {
  const index = hash.indexOf("?");
  return index < 0 ? hash : hash.slice(0, index);
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewCollection.js
function startViewCollection(lifeCycle, hooks, configuration, domMutationObservable, pageOpenObservable, locationChangeObservable, recorderApi, viewHistory, initialViewOptions) {
  lifeCycle.subscribe(4, (view) => lifeCycle.notify(12, processViewUpdate(view, configuration, recorderApi)));
  hooks.register(0, ({ startTime, eventType }) => {
    const view = viewHistory.findView(startTime);
    if (!view) {
      return DISCARDED;
    }
    return {
      type: eventType,
      service: view.service,
      version: view.version,
      context: view.context,
      view: {
        id: view.id,
        name: view.name
      }
    };
  });
  hooks.register(1, ({ startTime }) => {
    var _a;
    return {
      view: {
        id: (_a = viewHistory.findView(startTime)) === null || _a === void 0 ? void 0 : _a.id
      }
    };
  });
  return trackViews(lifeCycle, domMutationObservable, pageOpenObservable, configuration, locationChangeObservable, !configuration.trackViewsManually, initialViewOptions);
}
function processViewUpdate(view, configuration, recorderApi) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
  const replayStats = recorderApi.getReplayStats(view.id);
  const clsDevicePixelRatio = (_b = (_a = view.commonViewMetrics) === null || _a === void 0 ? void 0 : _a.cumulativeLayoutShift) === null || _b === void 0 ? void 0 : _b.devicePixelRatio;
  const viewEvent = {
    _dd: {
      document_version: view.documentVersion,
      replay_stats: replayStats,
      cls: clsDevicePixelRatio ? {
        device_pixel_ratio: clsDevicePixelRatio
      } : void 0,
      configuration: {
        start_session_replay_recording_manually: configuration.startSessionReplayRecordingManually
      }
    },
    date: view.startClocks.timeStamp,
    type: RumEventType.VIEW,
    view: {
      action: {
        count: view.eventCounts.actionCount
      },
      frustration: {
        count: view.eventCounts.frustrationCount
      },
      cumulative_layout_shift: (_c = view.commonViewMetrics.cumulativeLayoutShift) === null || _c === void 0 ? void 0 : _c.value,
      cumulative_layout_shift_time: toServerDuration((_d = view.commonViewMetrics.cumulativeLayoutShift) === null || _d === void 0 ? void 0 : _d.time),
      cumulative_layout_shift_target_selector: (_e = view.commonViewMetrics.cumulativeLayoutShift) === null || _e === void 0 ? void 0 : _e.targetSelector,
      first_byte: toServerDuration((_f = view.initialViewMetrics.navigationTimings) === null || _f === void 0 ? void 0 : _f.firstByte),
      dom_complete: toServerDuration((_g = view.initialViewMetrics.navigationTimings) === null || _g === void 0 ? void 0 : _g.domComplete),
      dom_content_loaded: toServerDuration((_h = view.initialViewMetrics.navigationTimings) === null || _h === void 0 ? void 0 : _h.domContentLoaded),
      dom_interactive: toServerDuration((_j = view.initialViewMetrics.navigationTimings) === null || _j === void 0 ? void 0 : _j.domInteractive),
      error: {
        count: view.eventCounts.errorCount
      },
      first_contentful_paint: toServerDuration(view.initialViewMetrics.firstContentfulPaint),
      first_input_delay: toServerDuration((_k = view.initialViewMetrics.firstInput) === null || _k === void 0 ? void 0 : _k.delay),
      first_input_time: toServerDuration((_l = view.initialViewMetrics.firstInput) === null || _l === void 0 ? void 0 : _l.time),
      first_input_target_selector: (_m = view.initialViewMetrics.firstInput) === null || _m === void 0 ? void 0 : _m.targetSelector,
      interaction_to_next_paint: toServerDuration((_o = view.commonViewMetrics.interactionToNextPaint) === null || _o === void 0 ? void 0 : _o.value),
      interaction_to_next_paint_time: toServerDuration((_p = view.commonViewMetrics.interactionToNextPaint) === null || _p === void 0 ? void 0 : _p.time),
      interaction_to_next_paint_target_selector: (_q = view.commonViewMetrics.interactionToNextPaint) === null || _q === void 0 ? void 0 : _q.targetSelector,
      is_active: view.isActive,
      name: view.name,
      largest_contentful_paint: toServerDuration((_r = view.initialViewMetrics.largestContentfulPaint) === null || _r === void 0 ? void 0 : _r.value),
      largest_contentful_paint_target_selector: (_s = view.initialViewMetrics.largestContentfulPaint) === null || _s === void 0 ? void 0 : _s.targetSelector,
      load_event: toServerDuration((_t = view.initialViewMetrics.navigationTimings) === null || _t === void 0 ? void 0 : _t.loadEvent),
      loading_time: discardNegativeDuration(toServerDuration(view.commonViewMetrics.loadingTime)),
      loading_type: view.loadingType,
      long_task: {
        count: view.eventCounts.longTaskCount
      },
      performance: computeViewPerformanceData(view.commonViewMetrics, view.initialViewMetrics),
      resource: {
        count: view.eventCounts.resourceCount
      },
      time_spent: toServerDuration(view.duration)
    },
    display: view.commonViewMetrics.scroll ? {
      scroll: {
        max_depth: view.commonViewMetrics.scroll.maxDepth,
        max_depth_scroll_top: view.commonViewMetrics.scroll.maxDepthScrollTop,
        max_scroll_height: view.commonViewMetrics.scroll.maxScrollHeight,
        max_scroll_height_time: toServerDuration(view.commonViewMetrics.scroll.maxScrollHeightTime)
      }
    } : void 0,
    privacy: {
      replay_level: configuration.defaultPrivacyLevel
    },
    device: {
      locale: navigator.language,
      locales: navigator.languages,
      time_zone: getTimeZone()
    }
  };
  if (!isEmptyObject(view.customTimings)) {
    viewEvent.view.custom_timings = mapValues(view.customTimings, toServerDuration);
  }
  return {
    rawRumEvent: viewEvent,
    startClocks: view.startClocks,
    duration: view.duration,
    domainContext: {
      location: view.location,
      handlingStack: view.handlingStack
    }
  };
}
function computeViewPerformanceData({ cumulativeLayoutShift, interactionToNextPaint }, { firstContentfulPaint, firstInput, largestContentfulPaint }) {
  return {
    cls: cumulativeLayoutShift && {
      score: cumulativeLayoutShift.value,
      timestamp: toServerDuration(cumulativeLayoutShift.time),
      target_selector: cumulativeLayoutShift.targetSelector,
      previous_rect: cumulativeLayoutShift.previousRect,
      current_rect: cumulativeLayoutShift.currentRect
    },
    fcp: firstContentfulPaint && { timestamp: toServerDuration(firstContentfulPaint) },
    fid: firstInput && {
      duration: toServerDuration(firstInput.delay),
      timestamp: toServerDuration(firstInput.time),
      target_selector: firstInput.targetSelector
    },
    inp: interactionToNextPaint && {
      duration: toServerDuration(interactionToNextPaint.value),
      timestamp: toServerDuration(interactionToNextPaint.time),
      target_selector: interactionToNextPaint.targetSelector,
      sub_parts: interactionToNextPaint.subParts ? {
        input_delay: toServerDuration(interactionToNextPaint.subParts.inputDelay),
        processing_duration: toServerDuration(interactionToNextPaint.subParts.processingDuration),
        presentation_delay: toServerDuration(interactionToNextPaint.subParts.presentationDelay)
      } : void 0
    },
    lcp: largestContentfulPaint && {
      timestamp: toServerDuration(largestContentfulPaint.value),
      target_selector: largestContentfulPaint.targetSelector,
      resource_url: largestContentfulPaint.resourceUrl,
      sub_parts: largestContentfulPaint.subParts ? {
        load_delay: toServerDuration(largestContentfulPaint.subParts.loadDelay),
        load_time: toServerDuration(largestContentfulPaint.subParts.loadTime),
        render_delay: toServerDuration(largestContentfulPaint.subParts.renderDelay)
      } : void 0
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/rumSessionManager.js
var RUM_SESSION_KEY = "rum";
function startRumSessionManager(configuration, lifeCycle, trackingConsentState) {
  const sessionManager = startSessionManager(configuration, RUM_SESSION_KEY, (rawTrackingType) => computeTrackingType(configuration, rawTrackingType), trackingConsentState);
  sessionManager.expireObservable.subscribe(() => {
    lifeCycle.notify(
      9
      /* LifeCycleEventType.SESSION_EXPIRED */
    );
  });
  sessionManager.renewObservable.subscribe(() => {
    lifeCycle.notify(
      10
      /* LifeCycleEventType.SESSION_RENEWED */
    );
  });
  sessionManager.sessionStateUpdateObservable.subscribe(({ previousState, newState }) => {
    if (!previousState.forcedReplay && newState.forcedReplay) {
      const sessionEntity = sessionManager.findSession();
      if (sessionEntity) {
        sessionEntity.isReplayForced = true;
      }
    }
  });
  return {
    findTrackedSession: (startTime) => {
      const session = sessionManager.findSession(startTime);
      if (!session || session.trackingType === "0") {
        return;
      }
      return {
        id: session.id,
        sessionReplay: session.trackingType === "1" ? 1 : session.isReplayForced ? 2 : 0,
        anonymousId: session.anonymousId
      };
    },
    expire: sessionManager.expire,
    expireObservable: sessionManager.expireObservable,
    setForcedReplay: () => sessionManager.updateSessionState({ forcedReplay: "1" })
  };
}
function startRumSessionManagerStub() {
  const session = {
    id: "00000000-aaaa-0000-aaaa-000000000000",
    sessionReplay: bridgeSupports(
      "records"
      /* BridgeCapability.RECORDS */
    ) ? 1 : 0
  };
  return {
    findTrackedSession: () => session,
    expire: noop,
    expireObservable: new Observable(),
    setForcedReplay: noop
  };
}
function computeTrackingType(configuration, rawTrackingType) {
  if (hasValidRumSession(rawTrackingType)) {
    return rawTrackingType;
  }
  if (!performDraw(configuration.sessionSampleRate)) {
    return "0";
  }
  if (!performDraw(configuration.sessionReplaySampleRate)) {
    return "2";
  }
  return "1";
}
function hasValidRumSession(trackingType) {
  return trackingType === "0" || trackingType === "1" || trackingType === "2";
}

// ../../node_modules/@datadog/browser-rum-core/esm/transport/startRumBatch.js
function startRumBatch(configuration, lifeCycle, reportError, pageMayExitObservable, sessionExpireObservable, createEncoder) {
  const endpoints = [configuration.rumEndpointBuilder];
  if (configuration.replica) {
    endpoints.push(configuration.replica.rumEndpointBuilder);
  }
  const batch = createBatch({
    encoder: createEncoder(
      2
      /* DeflateEncoderStreamId.RUM */
    ),
    request: createHttpRequest(endpoints, reportError),
    flushController: createFlushController({
      pageMayExitObservable,
      sessionExpireObservable
    })
  });
  lifeCycle.subscribe(13, (serverRumEvent) => {
    if (serverRumEvent.type === RumEventType.VIEW) {
      batch.upsert(serverRumEvent, serverRumEvent.view.id);
    } else {
      batch.add(serverRumEvent);
    }
  });
  return batch;
}

// ../../node_modules/@datadog/browser-rum-core/esm/transport/startRumEventBridge.js
function startRumEventBridge(lifeCycle) {
  const bridge = getEventBridge();
  lifeCycle.subscribe(13, (serverRumEvent) => {
    bridge.send("rum", serverRumEvent);
  });
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/contexts/urlContexts.js
var URL_CONTEXT_TIME_OUT_DELAY = SESSION_TIME_OUT_DELAY;
function startUrlContexts(lifeCycle, hooks, locationChangeObservable) {
  const urlContextHistory = createValueHistory({ expireDelay: URL_CONTEXT_TIME_OUT_DELAY });
  let previousViewUrl;
  lifeCycle.subscribe(1, ({ startClocks, url }) => {
    const locationHref = mockable(location).href;
    const viewUrl = url !== void 0 ? buildUrl(url, locationHref).href : locationHref;
    urlContextHistory.add(buildUrlContext({
      url: viewUrl,
      referrer: !previousViewUrl ? document.referrer : previousViewUrl
    }), startClocks.relative);
    previousViewUrl = viewUrl;
  });
  lifeCycle.subscribe(6, ({ endClocks }) => {
    urlContextHistory.closeActive(endClocks.relative);
  });
  const locationChangeSubscription = locationChangeObservable.subscribe(({ newLocation }) => {
    const current = urlContextHistory.find();
    if (current) {
      const changeTime = relativeNow();
      urlContextHistory.closeActive(changeTime);
      urlContextHistory.add(buildUrlContext({
        url: newLocation.href,
        referrer: current.referrer
      }), changeTime);
    }
  });
  function buildUrlContext({ url, referrer }) {
    return {
      url,
      referrer
    };
  }
  hooks.register(0, ({ startTime, eventType }) => {
    const urlContext = urlContextHistory.find(startTime);
    if (!urlContext) {
      return DISCARDED;
    }
    return {
      type: eventType,
      view: {
        url: urlContext.url,
        referrer: urlContext.referrer
      }
    };
  });
  return {
    findUrl: (startTime) => urlContextHistory.find(startTime),
    stop: () => {
      locationChangeSubscription.unsubscribe();
      urlContextHistory.stop();
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/browser/locationChangeObservable.js
function createLocationChangeObservable(configuration) {
  let currentLocation = shallowClone(location);
  return new Observable((observable) => {
    const { stop: stopHistoryTracking } = trackHistory(configuration, onLocationChange);
    const { stop: stopHashTracking } = trackHash(configuration, onLocationChange);
    function onLocationChange() {
      if (currentLocation.href === location.href) {
        return;
      }
      const newLocation = shallowClone(location);
      observable.notify({
        newLocation,
        oldLocation: currentLocation
      });
      currentLocation = newLocation;
    }
    return () => {
      stopHistoryTracking();
      stopHashTracking();
    };
  });
}
function trackHistory(configuration, onHistoryChange) {
  const { stop: stopInstrumentingPushState } = instrumentMethod(getHistoryInstrumentationTarget("pushState"), "pushState", ({ onPostCall }) => {
    onPostCall(onHistoryChange);
  });
  const { stop: stopInstrumentingReplaceState } = instrumentMethod(getHistoryInstrumentationTarget("replaceState"), "replaceState", ({ onPostCall }) => {
    onPostCall(onHistoryChange);
  });
  const { stop: removeListener } = addEventListener(configuration, window, "popstate", onHistoryChange);
  return {
    stop: () => {
      stopInstrumentingPushState();
      stopInstrumentingReplaceState();
      removeListener();
    }
  };
}
function trackHash(configuration, onHashChange) {
  return addEventListener(configuration, window, "hashchange", onHashChange);
}
function getHistoryInstrumentationTarget(methodName) {
  return Object.prototype.hasOwnProperty.call(history, methodName) ? history : History.prototype;
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/contexts/featureFlagContext.js
var FEATURE_FLAG_CONTEXT_TIME_OUT_DELAY = SESSION_TIME_OUT_DELAY;
function startFeatureFlagContexts(lifeCycle, hooks, configuration) {
  const featureFlagContexts = createValueHistory({
    expireDelay: FEATURE_FLAG_CONTEXT_TIME_OUT_DELAY
  });
  lifeCycle.subscribe(1, ({ startClocks }) => {
    featureFlagContexts.add({}, startClocks.relative);
  });
  lifeCycle.subscribe(6, ({ endClocks }) => {
    featureFlagContexts.closeActive(endClocks.relative);
  });
  hooks.register(0, ({ startTime, eventType }) => {
    const trackFeatureFlagsForEvents = configuration.trackFeatureFlagsForEvents.concat([
      RumEventType.VIEW,
      RumEventType.ERROR
    ]);
    if (!trackFeatureFlagsForEvents.includes(eventType)) {
      return SKIPPED;
    }
    const featureFlagContext = featureFlagContexts.find(startTime);
    if (!featureFlagContext || isEmptyObject(featureFlagContext)) {
      return SKIPPED;
    }
    return {
      type: eventType,
      feature_flags: featureFlagContext
    };
  });
  return {
    addFeatureFlagEvaluation: (key, value) => {
      const currentContext = featureFlagContexts.find();
      if (currentContext) {
        currentContext[key] = value;
      }
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/startCustomerDataTelemetry.js
var MEASURES_PERIOD_DURATION = 10 * ONE_SECOND;
var currentPeriodMeasures;
var batchHasRumEvent;
function startCustomerDataTelemetry(telemetry, lifeCycle, batchFlushObservable) {
  if (!telemetry.metricsEnabled) {
    return;
  }
  initCurrentPeriodMeasures();
  batchHasRumEvent = false;
  lifeCycle.subscribe(13, () => {
    batchHasRumEvent = true;
  });
  batchFlushObservable.subscribe(({ bytesCount, messagesCount }) => {
    if (!batchHasRumEvent) {
      return;
    }
    batchHasRumEvent = false;
    currentPeriodMeasures.batchCount += 1;
    updateMeasure(currentPeriodMeasures.batchBytesCount, bytesCount);
    updateMeasure(currentPeriodMeasures.batchMessagesCount, messagesCount);
  });
  setInterval(sendCurrentPeriodMeasures, MEASURES_PERIOD_DURATION);
}
function sendCurrentPeriodMeasures() {
  if (currentPeriodMeasures.batchCount === 0) {
    return;
  }
  addTelemetryMetrics("Customer data measures", currentPeriodMeasures);
  initCurrentPeriodMeasures();
}
function createMeasure() {
  return { min: Infinity, max: 0, sum: 0 };
}
function updateMeasure(measure, value) {
  measure.sum += value;
  measure.min = Math.min(measure.min, value);
  measure.max = Math.max(measure.max, value);
}
function initCurrentPeriodMeasures() {
  currentPeriodMeasures = {
    batchCount: 0,
    batchBytesCount: createMeasure(),
    batchMessagesCount: createMeasure()
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/contexts/pageStateHistory.js
var MAX_PAGE_STATE_ENTRIES = 4e3;
var MAX_PAGE_STATE_ENTRIES_SELECTABLE = 500;
var PAGE_STATE_CONTEXT_TIME_OUT_DELAY = SESSION_TIME_OUT_DELAY;
function startPageStateHistory(hooks, configuration, maxPageStateEntriesSelectable = MAX_PAGE_STATE_ENTRIES_SELECTABLE) {
  const pageStateEntryHistory = createValueHistory({
    expireDelay: PAGE_STATE_CONTEXT_TIME_OUT_DELAY,
    maxEntries: MAX_PAGE_STATE_ENTRIES
  });
  let currentPageState;
  if (supportPerformanceTimingEvent(RumPerformanceEntryType.VISIBILITY_STATE)) {
    const visibilityEntries = performance.getEntriesByType(RumPerformanceEntryType.VISIBILITY_STATE);
    visibilityEntries.forEach((entry) => {
      const state = entry.name === "hidden" ? "hidden" : "active";
      addPageState(state, entry.startTime);
    });
  }
  addPageState(getPageState(), relativeNow());
  const { stop: stopEventListeners } = addEventListeners(configuration, window, [
    "pageshow",
    "focus",
    "blur",
    "visibilitychange",
    "resume",
    "freeze",
    "pagehide"
  ], (event) => {
    addPageState(computePageState(event), event.timeStamp);
  }, { capture: true });
  function addPageState(nextPageState, startTime = relativeNow()) {
    if (nextPageState === currentPageState) {
      return;
    }
    currentPageState = nextPageState;
    pageStateEntryHistory.closeActive(startTime);
    pageStateEntryHistory.add({ state: currentPageState, startTime }, startTime);
  }
  function wasInPageStateDuringPeriod(state, startTime, duration) {
    return pageStateEntryHistory.findAll(startTime, duration).some((pageState) => pageState.state === state);
  }
  hooks.register(0, ({ startTime, duration = 0, eventType }) => {
    if (eventType === RumEventType.VIEW) {
      const pageStates = pageStateEntryHistory.findAll(startTime, duration);
      return {
        type: eventType,
        _dd: { page_states: processPageStates(pageStates, startTime, maxPageStateEntriesSelectable) }
      };
    }
    if (eventType === RumEventType.ACTION || eventType === RumEventType.ERROR) {
      return {
        type: eventType,
        view: { in_foreground: wasInPageStateDuringPeriod("active", startTime, 0) }
      };
    }
    return SKIPPED;
  });
  return {
    wasInPageStateDuringPeriod,
    addPageState,
    stop: () => {
      stopEventListeners();
      pageStateEntryHistory.stop();
    }
  };
}
function processPageStates(pageStateEntries, eventStartTime, maxPageStateEntriesSelectable) {
  if (pageStateEntries.length === 0) {
    return;
  }
  return pageStateEntries.slice(-maxPageStateEntriesSelectable).reverse().map(({ state, startTime }) => ({
    state,
    start: toServerDuration(elapsed(eventStartTime, startTime))
  }));
}
function computePageState(event) {
  if (event.type === "freeze") {
    return "frozen";
  } else if (event.type === "pagehide") {
    return event.persisted ? "frozen" : "terminated";
  }
  return getPageState();
}
function getPageState() {
  if (document.visibilityState === "hidden") {
    return "hidden";
  }
  if (document.hasFocus()) {
    return "active";
  }
  return "passive";
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/contexts/displayContext.js
function startDisplayContext(hooks, configuration) {
  let viewport;
  const animationFrameId = requestAnimationFrame(monitor(() => {
    viewport = getViewportDimension();
  }));
  const unsubscribeViewport = initViewportObservable(configuration).subscribe((viewportDimension) => {
    viewport = viewportDimension;
  }).unsubscribe;
  hooks.register(0, ({ eventType }) => ({
    type: eventType,
    display: viewport ? { viewport } : void 0
  }));
  return {
    stop: () => {
      unsubscribeViewport();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/browser/cookieObservable.js
function createCookieObservable(configuration, cookieName) {
  const detectCookieChangeStrategy = window.cookieStore ? listenToCookieStoreChange(configuration) : watchCookieFallback;
  return new Observable((observable) => detectCookieChangeStrategy(cookieName, (event) => observable.notify(event)));
}
function listenToCookieStoreChange(configuration) {
  return (cookieName, callback) => {
    const listener = addEventListener(configuration, window.cookieStore, "change", (event) => {
      const changeEvent = event.changed.find((event2) => event2.name === cookieName) || event.deleted.find((event2) => event2.name === cookieName);
      if (changeEvent) {
        callback(changeEvent.value);
      }
    });
    return listener.stop;
  };
}
var WATCH_COOKIE_INTERVAL_DELAY = ONE_SECOND;
function watchCookieFallback(cookieName, callback) {
  let previousCookieValue = findCommaSeparatedValue(document.cookie, cookieName);
  const watchCookieIntervalId = setInterval(() => {
    const cookieValue = findCommaSeparatedValue(document.cookie, cookieName);
    if (cookieValue !== previousCookieValue) {
      previousCookieValue = cookieValue;
      callback(cookieValue);
    }
  }, WATCH_COOKIE_INTERVAL_DELAY);
  return () => {
    clearInterval(watchCookieIntervalId);
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/contexts/ciVisibilityContext.js
var CI_VISIBILITY_TEST_ID_COOKIE_NAME = "datadog-ci-visibility-test-execution-id";
function startCiVisibilityContext(configuration, hooks, cookieObservable = createCookieObservable(configuration, CI_VISIBILITY_TEST_ID_COOKIE_NAME)) {
  var _a;
  let testExecutionId = getInitCookie(CI_VISIBILITY_TEST_ID_COOKIE_NAME) || ((_a = window.Cypress) === null || _a === void 0 ? void 0 : _a.env("traceId"));
  const cookieObservableSubscription = cookieObservable.subscribe((value) => {
    testExecutionId = value;
  });
  hooks.register(0, ({ eventType }) => {
    if (typeof testExecutionId !== "string") {
      return SKIPPED;
    }
    return {
      type: eventType,
      session: {
        type: "ci_test"
      },
      ci_test: {
        test_execution_id: testExecutionId
      }
    };
  });
  return {
    stop: () => {
      cookieObservableSubscription.unsubscribe();
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/longTask/longTaskCollection.js
function startLongTaskCollection(lifeCycle, configuration) {
  const entryType = supportPerformanceTimingEvent(RumPerformanceEntryType.LONG_ANIMATION_FRAME) ? RumPerformanceEntryType.LONG_ANIMATION_FRAME : RumPerformanceEntryType.LONG_TASK;
  const subscription = createPerformanceObservable(configuration, {
    type: entryType,
    buffered: true
  }).subscribe((entries) => {
    for (const entry of entries) {
      if (!configuration.trackLongTasks) {
        break;
      }
      const startClocks = relativeToClocks(entry.startTime);
      const rawRumEvent = processEntry(entry, startClocks);
      lifeCycle.notify(12, {
        rawRumEvent,
        startClocks,
        duration: entry.duration,
        domainContext: { performanceEntry: entry }
      });
    }
  });
  return {
    stop: () => subscription.unsubscribe()
  };
}
function processEntry(entry, startClocks) {
  const id = generateUUID();
  const duration = toServerDuration(entry.duration);
  const baseEvent = {
    date: startClocks.timeStamp,
    type: RumEventType.LONG_TASK,
    _dd: { discarded: false }
  };
  if (entry.entryType === RumPerformanceEntryType.LONG_TASK) {
    return {
      ...baseEvent,
      long_task: {
        id,
        entry_type: RumLongTaskEntryType.LONG_TASK,
        duration
      }
    };
  }
  return {
    ...baseEvent,
    long_task: {
      id,
      entry_type: RumLongTaskEntryType.LONG_ANIMATION_FRAME,
      duration,
      blocking_duration: toServerDuration(entry.blockingDuration),
      first_ui_event_timestamp: toServerDuration(entry.firstUIEventTimestamp),
      render_start: toServerDuration(entry.renderStart),
      style_and_layout_start: toServerDuration(entry.styleAndLayoutStart),
      start_time: toServerDuration(entry.startTime),
      scripts: entry.scripts.map((script) => ({
        duration: toServerDuration(script.duration),
        pause_duration: toServerDuration(script.pauseDuration),
        forced_style_and_layout_duration: toServerDuration(script.forcedStyleAndLayoutDuration),
        start_time: toServerDuration(script.startTime),
        execution_start: toServerDuration(script.executionStart),
        source_url: script.sourceURL,
        source_function_name: script.sourceFunctionName,
        source_char_position: script.sourceCharPosition,
        invoker: script.invoker,
        invoker_type: script.invokerType,
        window_attribution: script.windowAttribution
      }))
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/contexts/syntheticsContext.js
function startSyntheticsContext(hooks) {
  hooks.register(0, ({ eventType }) => {
    if (!isSyntheticsTest()) {
      return SKIPPED;
    }
    return {
      type: eventType,
      session: {
        type: "synthetics"
      },
      synthetics: {
        ...getSyntheticsContext(),
        injected: willSyntheticsInjectRum()
      }
    };
  });
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/limitModification.js
function limitModification(object, modifiableFieldPaths, modifier) {
  const clone = deepClone(object);
  const result = modifier(clone);
  objectEntries(modifiableFieldPaths).forEach(([fieldPath, fieldType]) => (
    // Traverse both object and clone simultaneously up to the path and apply the modification from the clone to the original object when the type is valid
    setValueAtPath(object, clone, fieldPath.split(/\.|(?=\[\])/), fieldType)
  ));
  return result;
}
function setValueAtPath(object, clone, pathSegments, fieldType) {
  const [field, ...restPathSegments] = pathSegments;
  if (field === "[]") {
    if (Array.isArray(object) && Array.isArray(clone)) {
      object.forEach((item, i) => setValueAtPath(item, clone[i], restPathSegments, fieldType));
    }
    return;
  }
  if (!isValidObject(object) || !isValidObject(clone)) {
    return;
  }
  if (restPathSegments.length > 0) {
    return setValueAtPath(object[field], clone[field], restPathSegments, fieldType);
  }
  setNestedValue(object, field, clone[field], fieldType);
}
function setNestedValue(object, field, value, fieldType) {
  if (object[field] === value) {
    return;
  }
  const newType = getType(value);
  if (newType === fieldType) {
    object[field] = sanitize(value);
  } else if (fieldType === "object" && (newType === "undefined" || newType === "null")) {
    object[field] = {};
  }
}
function isValidObject(object) {
  return getType(object) === "object";
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/assembly.js
var VIEW_MODIFIABLE_FIELD_PATHS = {
  "view.name": "string",
  "view.url": "string",
  "view.referrer": "string"
};
var USER_CUSTOMIZABLE_FIELD_PATHS = {
  context: "object"
};
var ROOT_MODIFIABLE_FIELD_PATHS = {
  service: "string",
  version: "string"
};
var modifiableFieldPathsByEvent;
function startRumAssembly(configuration, lifeCycle, hooks, reportError, eventRateLimit) {
  modifiableFieldPathsByEvent = {
    [RumEventType.VIEW]: {
      "view.performance.lcp.resource_url": "string",
      ...USER_CUSTOMIZABLE_FIELD_PATHS,
      ...VIEW_MODIFIABLE_FIELD_PATHS,
      ...ROOT_MODIFIABLE_FIELD_PATHS
    },
    [RumEventType.ERROR]: {
      "error.message": "string",
      "error.stack": "string",
      "error.handling_stack": "string",
      "error.resource.url": "string",
      "error.fingerprint": "string",
      ...USER_CUSTOMIZABLE_FIELD_PATHS,
      ...VIEW_MODIFIABLE_FIELD_PATHS,
      ...ROOT_MODIFIABLE_FIELD_PATHS
    },
    [RumEventType.RESOURCE]: {
      "resource.url": "string",
      "resource.graphql.variables": "string",
      ...USER_CUSTOMIZABLE_FIELD_PATHS,
      ...VIEW_MODIFIABLE_FIELD_PATHS,
      ...ROOT_MODIFIABLE_FIELD_PATHS
    },
    [RumEventType.ACTION]: {
      "action.target.name": "string",
      ...USER_CUSTOMIZABLE_FIELD_PATHS,
      ...VIEW_MODIFIABLE_FIELD_PATHS,
      ...ROOT_MODIFIABLE_FIELD_PATHS
    },
    [RumEventType.LONG_TASK]: {
      "long_task.scripts[].source_url": "string",
      "long_task.scripts[].invoker": "string",
      ...USER_CUSTOMIZABLE_FIELD_PATHS,
      ...VIEW_MODIFIABLE_FIELD_PATHS,
      ...ROOT_MODIFIABLE_FIELD_PATHS
    },
    [RumEventType.VITAL]: {
      ...USER_CUSTOMIZABLE_FIELD_PATHS,
      ...VIEW_MODIFIABLE_FIELD_PATHS,
      ...ROOT_MODIFIABLE_FIELD_PATHS
    }
  };
  const eventRateLimiters = {
    [RumEventType.ERROR]: createEventRateLimiter(RumEventType.ERROR, reportError, eventRateLimit),
    [RumEventType.ACTION]: createEventRateLimiter(RumEventType.ACTION, reportError, eventRateLimit),
    [RumEventType.VITAL]: createEventRateLimiter(RumEventType.VITAL, reportError, eventRateLimit)
  };
  lifeCycle.subscribe(12, ({ startClocks, duration, rawRumEvent, domainContext }) => {
    const defaultRumEventAttributes = hooks.triggerHook(0, {
      eventType: rawRumEvent.type,
      rawRumEvent,
      domainContext,
      startTime: startClocks.relative,
      duration
    });
    if (defaultRumEventAttributes === DISCARDED) {
      return;
    }
    const serverRumEvent = combine(defaultRumEventAttributes, rawRumEvent, {
      ddtags: buildTags(configuration).join(",")
    });
    if (shouldSend(serverRumEvent, configuration.beforeSend, domainContext, eventRateLimiters)) {
      if (isEmptyObject(serverRumEvent.context)) {
        delete serverRumEvent.context;
      }
      lifeCycle.notify(13, serverRumEvent);
    }
  });
}
function shouldSend(event, beforeSend, domainContext, eventRateLimiters) {
  var _a;
  if (beforeSend) {
    const result = limitModification(event, modifiableFieldPathsByEvent[event.type], (event2) => beforeSend(event2, domainContext));
    if (result === false && event.type !== RumEventType.VIEW) {
      return false;
    }
    if (result === false) {
      display.warn("Can't dismiss view events using beforeSend!");
    }
  }
  const rateLimitReached = (_a = eventRateLimiters[event.type]) === null || _a === void 0 ? void 0 : _a.isLimitReached();
  return !rateLimitReached;
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/contexts/sessionContext.js
function startSessionContext(hooks, sessionManager, recorderApi, viewHistory) {
  hooks.register(0, ({ eventType, startTime }) => {
    const session = sessionManager.findTrackedSession(startTime);
    const view = viewHistory.findView(startTime);
    if (!session || !view) {
      return DISCARDED;
    }
    let hasReplay;
    let sampledForReplay;
    let isActive;
    if (eventType === RumEventType.VIEW) {
      hasReplay = recorderApi.getReplayStats(view.id) ? true : void 0;
      sampledForReplay = session.sessionReplay === 1;
      isActive = view.sessionIsActive ? void 0 : false;
    } else {
      hasReplay = recorderApi.isRecording() ? true : void 0;
    }
    return {
      type: eventType,
      session: {
        id: session.id,
        type: "user",
        has_replay: hasReplay,
        sampled_for_replay: sampledForReplay,
        is_active: isActive
      }
    };
  });
  hooks.register(1, ({ startTime }) => {
    const session = sessionManager.findTrackedSession(startTime);
    if (!session) {
      return SKIPPED;
    }
    return {
      session: {
        id: session.id
      }
    };
  });
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/contexts/connectivityContext.js
function startConnectivityContext(hooks) {
  hooks.register(0, ({ eventType }) => ({
    type: eventType,
    connectivity: getConnectivity()
  }));
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/contexts/defaultContext.js
function startDefaultContext(hooks, configuration, sdkName) {
  hooks.register(0, ({ eventType }) => {
    const source = configuration.source;
    return {
      type: eventType,
      _dd: {
        format_version: 2,
        drift: currentDrift(),
        configuration: {
          session_sample_rate: round(configuration.sessionSampleRate, 3),
          session_replay_sample_rate: round(configuration.sessionReplaySampleRate, 3),
          profiling_sample_rate: round(configuration.profilingSampleRate, 3),
          trace_sample_rate: round(configuration.traceSampleRate, 3),
          beta_encode_cookie_options: configuration.betaEncodeCookieOptions
        },
        browser_sdk_version: canUseEventBridge() ? "6.32.0" : void 0,
        sdk_name: sdkName
      },
      application: {
        id: configuration.applicationId
      },
      date: timeStampNow(),
      source
    };
  });
  hooks.register(1, () => ({
    application: { id: configuration.applicationId }
  }));
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/contexts/trackingConsentContext.js
function startTrackingConsentContext(hooks, trackingConsentState) {
  hooks.register(1, () => {
    const wasConsented = trackingConsentState.isGranted();
    if (!wasConsented) {
      return DISCARDED;
    }
    return SKIPPED;
  });
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/event/eventCollection.js
var allowedEventTypes = [
  RumEventType.ACTION,
  RumEventType.ERROR,
  RumEventType.LONG_TASK,
  RumEventType.RESOURCE,
  RumEventType.VITAL
];
function startEventCollection(lifeCycle) {
  return {
    addEvent: (startTime, event, domainContext, duration) => {
      if (!allowedEventTypes.includes(event.type)) {
        return;
      }
      lifeCycle.notify(12, {
        startClocks: relativeToClocks(startTime),
        rawRumEvent: event,
        domainContext,
        duration
      });
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/view/viewMetrics/startInitialViewMetricsTelemetry.js
function startInitialViewMetricsTelemetry(lifeCycle, telemetry) {
  if (!telemetry.metricsEnabled) {
    return { stop: noop };
  }
  const { unsubscribe } = lifeCycle.subscribe(4, ({ initialViewMetrics }) => {
    if (!initialViewMetrics.largestContentfulPaint || !initialViewMetrics.navigationTimings) {
      return;
    }
    addTelemetryMetrics("Initial view metrics", {
      metrics: createCoreInitialViewMetrics(initialViewMetrics.largestContentfulPaint, initialViewMetrics.navigationTimings)
    });
    unsubscribe();
  });
  return {
    stop: unsubscribe
  };
}
function createCoreInitialViewMetrics(lcp, navigation) {
  return {
    lcp: {
      value: lcp.value
    },
    navigation: {
      domComplete: navigation.domComplete,
      domContentLoaded: navigation.domContentLoaded,
      domInteractive: navigation.domInteractive,
      firstByte: navigation.firstByte,
      loadEvent: navigation.loadEvent
    }
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/contexts/sourceCodeContext.js
function startSourceCodeContext(hooks) {
  const browserWindow = window;
  const contextByFile = /* @__PURE__ */ new Map();
  function buildContextByFile() {
    if (!browserWindow.DD_SOURCE_CODE_CONTEXT) {
      return;
    }
    objectEntries(browserWindow.DD_SOURCE_CODE_CONTEXT).forEach(([stack, context]) => {
      const stackTrace = computeStackTrace({ stack });
      const firstFrame = stackTrace.stack[0];
      if (!firstFrame.url) {
        addTelemetryError("Source code context: missing frame url", { stack });
        return;
      }
      if (!contextByFile.has(firstFrame.url)) {
        contextByFile.set(firstFrame.url, context);
      }
    });
    browserWindow.DD_SOURCE_CODE_CONTEXT = {};
  }
  buildContextByFile();
  hooks.register(0, ({ domainContext, rawRumEvent }) => {
    buildContextByFile();
    if (contextByFile.size === 0) {
      return SKIPPED;
    }
    const url = getSourceUrl(domainContext, rawRumEvent);
    const context = url && contextByFile.get(url);
    if (!context) {
      return SKIPPED;
    }
    return {
      type: rawRumEvent.type,
      service: context.service,
      version: context.version
    };
  });
}
function getSourceUrl(domainContext, rawRumEvent) {
  var _a, _b;
  if (rawRumEvent.type === "long_task" && rawRumEvent.long_task.entry_type === "long-animation-frame") {
    return (_a = rawRumEvent.long_task.scripts[0]) === null || _a === void 0 ? void 0 : _a.source_url;
  }
  let stack;
  if ("handlingStack" in domainContext) {
    stack = domainContext.handlingStack;
  }
  if (rawRumEvent.type === "error" && rawRumEvent.error.stack) {
    stack = rawRumEvent.error.stack;
  }
  const stackTrace = computeStackTrace({ stack });
  return (_b = stackTrace.stack[0]) === null || _b === void 0 ? void 0 : _b.url;
}

// ../../node_modules/@datadog/browser-rum-core/esm/boot/startRum.js
function startRum(configuration, recorderApi, profilerApi, initialViewOptions, createEncoder, trackingConsentState, customVitalsState, bufferedDataObservable, telemetry, hooks, sdkName) {
  const cleanupTasks = [];
  const lifeCycle = new LifeCycle();
  lifeCycle.subscribe(13, (event) => sendToExtension("rum", event));
  const reportError = (error) => {
    lifeCycle.notify(14, { error });
    addTelemetryDebug("Error reported to customer", { "error.message": error.message });
  };
  const pageMayExitObservable = createPageMayExitObservable(configuration);
  const pageMayExitSubscription = pageMayExitObservable.subscribe((event) => {
    lifeCycle.notify(11, event);
  });
  cleanupTasks.push(() => pageMayExitSubscription.unsubscribe());
  const session = !canUseEventBridge() ? startRumSessionManager(configuration, lifeCycle, trackingConsentState) : startRumSessionManagerStub();
  if (!canUseEventBridge()) {
    const batch = startRumBatch(configuration, lifeCycle, reportError, pageMayExitObservable, session.expireObservable, createEncoder);
    cleanupTasks.push(() => batch.stop());
    startCustomerDataTelemetry(telemetry, lifeCycle, batch.flushController.flushObservable);
  } else {
    startRumEventBridge(lifeCycle);
  }
  startTrackingConsentContext(hooks, trackingConsentState);
  const { stop: stopInitialViewMetricsTelemetry } = startInitialViewMetricsTelemetry(lifeCycle, telemetry);
  cleanupTasks.push(stopInitialViewMetricsTelemetry);
  const { stop: stopRumEventCollection, ...startRumEventCollectionResult } = startRumEventCollection(lifeCycle, hooks, configuration, session, recorderApi, initialViewOptions, customVitalsState, bufferedDataObservable, sdkName, reportError);
  cleanupTasks.push(stopRumEventCollection);
  bufferedDataObservable.unbuffer();
  cleanupTasks.push(() => profilerApi.stop());
  return {
    ...startRumEventCollectionResult,
    lifeCycle,
    session,
    stopSession: () => session.expire(),
    telemetry,
    stop: () => {
      cleanupTasks.forEach((task) => task());
    },
    hooks
  };
}
function startRumEventCollection(lifeCycle, hooks, configuration, session, recorderApi, initialViewOptions, customVitalsState, bufferedDataObservable, sdkName, reportError) {
  const cleanupTasks = [];
  const domMutationObservable = createDOMMutationObservable();
  const locationChangeObservable = createLocationChangeObservable(configuration);
  const { observable: windowOpenObservable, stop: stopWindowOpen } = createWindowOpenObservable();
  cleanupTasks.push(stopWindowOpen);
  startDefaultContext(hooks, configuration, sdkName);
  const pageStateHistory = startPageStateHistory(hooks, configuration);
  cleanupTasks.push(() => pageStateHistory.stop());
  const viewHistory = startViewHistory(lifeCycle);
  cleanupTasks.push(() => viewHistory.stop());
  const urlContexts = startUrlContexts(lifeCycle, hooks, locationChangeObservable);
  cleanupTasks.push(() => urlContexts.stop());
  const featureFlagContexts = startFeatureFlagContexts(lifeCycle, hooks, configuration);
  startSessionContext(hooks, session, recorderApi, viewHistory);
  startConnectivityContext(hooks);
  const globalContext = startGlobalContext(hooks, configuration, "rum", true);
  const userContext = startUserContext(hooks, configuration, session, "rum");
  const accountContext = startAccountContext(hooks, configuration, "rum");
  const actionCollection = startActionCollection(lifeCycle, hooks, domMutationObservable, windowOpenObservable, configuration);
  cleanupTasks.push(actionCollection.stop);
  const eventCollection = startEventCollection(lifeCycle);
  const displayContext = startDisplayContext(hooks, configuration);
  cleanupTasks.push(displayContext.stop);
  const ciVisibilityContext = startCiVisibilityContext(configuration, hooks);
  cleanupTasks.push(ciVisibilityContext.stop);
  startSyntheticsContext(hooks);
  startRumAssembly(configuration, lifeCycle, hooks, reportError);
  const { addTiming, setLoadingTime, startView, setViewName, setViewContext, setViewContextProperty, getViewContext, stop: stopViewCollection } = startViewCollection(lifeCycle, hooks, configuration, domMutationObservable, windowOpenObservable, locationChangeObservable, recorderApi, viewHistory, initialViewOptions);
  startSourceCodeContext(hooks);
  cleanupTasks.push(stopViewCollection);
  const resourceCollection = startResourceCollection(lifeCycle, configuration, pageStateHistory);
  cleanupTasks.push(resourceCollection.stop);
  const { stop: stopLongTaskCollection } = startLongTaskCollection(lifeCycle, configuration);
  cleanupTasks.push(stopLongTaskCollection);
  const { addError } = startErrorCollection(lifeCycle, configuration, bufferedDataObservable);
  startRequestCollection(lifeCycle, configuration, session, userContext, accountContext);
  const vitalCollection = startVitalCollection(lifeCycle, pageStateHistory, customVitalsState);
  const internalContext = startInternalContext(configuration.applicationId, session, viewHistory, actionCollection.actionContexts, urlContexts);
  return {
    addAction: actionCollection.addAction,
    startAction: actionCollection.startAction,
    stopAction: actionCollection.stopAction,
    startResource: resourceCollection.startResource,
    stopResource: resourceCollection.stopResource,
    addEvent: eventCollection.addEvent,
    addError,
    addTiming,
    setLoadingTime,
    addFeatureFlagEvaluation: featureFlagContexts.addFeatureFlagEvaluation,
    startView,
    setViewContext,
    setViewContextProperty,
    getViewContext,
    setViewName,
    viewHistory,
    getInternalContext: internalContext.get,
    startDurationVital: vitalCollection.startDurationVital,
    stopDurationVital: vitalCollection.stopDurationVital,
    addDurationVital: vitalCollection.addDurationVital,
    addOperationStepVital: vitalCollection.addOperationStepVital,
    globalContext,
    userContext,
    accountContext,
    stop: () => cleanupTasks.forEach((task) => task())
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/boot/rumPublicApi.js
function makeRumPublicApi(recorderApi, profilerApi, options = {}) {
  const trackingConsentState = createTrackingConsentState();
  const customVitalsState = createCustomVitalsState();
  const bufferedDataObservable = startBufferingData().observable;
  let strategy = createPreStartStrategy(options, trackingConsentState, customVitalsState, (configuration, deflateWorker, initialViewOptions, telemetry, hooks) => {
    const createEncoder = deflateWorker && options.createDeflateEncoder ? (streamId) => options.createDeflateEncoder(configuration, deflateWorker, streamId) : createIdentityEncoder;
    const startRumResult = mockable(startRum)(configuration, recorderApi, profilerApi, initialViewOptions, createEncoder, trackingConsentState, customVitalsState, bufferedDataObservable, telemetry, hooks, options.sdkName);
    recorderApi.onRumStart(startRumResult.lifeCycle, configuration, startRumResult.session, startRumResult.viewHistory, deflateWorker, startRumResult.telemetry);
    profilerApi.onRumStart(startRumResult.lifeCycle, startRumResult.hooks, configuration, startRumResult.session, startRumResult.viewHistory, createEncoder);
    strategy = createPostStartStrategy(strategy, startRumResult);
    callPluginsMethod(configuration.plugins, "onRumStart", {
      strategy,
      // TODO: remove this in the next major release
      addEvent: startRumResult.addEvent,
      addError: startRumResult.addError
    });
    return startRumResult;
  });
  const getStrategy = () => strategy;
  const startView = (options2) => {
    const handlingStack = createHandlingStack("view");
    callMonitored(() => {
      const sanitizedOptions = typeof options2 === "object" ? options2 : { name: options2 };
      strategy.startView({ ...sanitizedOptions, handlingStack });
      addTelemetryUsage({ feature: "start-view" });
    });
  };
  const rumPublicApi = makePublicApi({
    init: (initConfiguration) => {
      const errorStack = new Error().stack;
      callMonitored(() => strategy.init(initConfiguration, rumPublicApi, errorStack));
    },
    setTrackingConsent: monitor((trackingConsent) => {
      trackingConsentState.update(trackingConsent);
      addTelemetryUsage({ feature: "set-tracking-consent", tracking_consent: trackingConsent });
    }),
    setViewName: monitor((name) => {
      strategy.setViewName(name);
      addTelemetryUsage({ feature: "set-view-name" });
    }),
    setViewContext: monitor((context) => {
      strategy.setViewContext(context);
      addTelemetryUsage({ feature: "set-view-context" });
    }),
    setViewContextProperty: monitor((key, value) => {
      strategy.setViewContextProperty(key, value);
      addTelemetryUsage({ feature: "set-view-context-property" });
    }),
    getViewContext: monitor(() => {
      addTelemetryUsage({ feature: "set-view-context-property" });
      return strategy.getViewContext();
    }),
    getInternalContext: monitor((startTime) => strategy.getInternalContext(startTime)),
    getInitConfiguration: monitor(() => deepClone(strategy.initConfiguration)),
    addAction: (name, context) => {
      const handlingStack = createHandlingStack("action");
      callMonitored(() => {
        strategy.addAction({
          name: sanitize(name),
          context: sanitize(context),
          startClocks: clocksNow(),
          type: ActionType.CUSTOM,
          handlingStack
        });
        addTelemetryUsage({ feature: "add-action" });
      });
    },
    startAction: monitor((name, options2) => {
      if (strategy.initConfiguration && !isExperimentalFeatureEnabled(ExperimentalFeature.START_STOP_ACTION)) {
        return;
      }
      strategy.startAction(sanitize(name), {
        type: sanitize(options2 && options2.type),
        context: sanitize(options2 && options2.context),
        actionKey: options2 && options2.actionKey
      });
    }),
    stopAction: monitor((name, options2) => {
      if (strategy.initConfiguration && !isExperimentalFeatureEnabled(ExperimentalFeature.START_STOP_ACTION)) {
        return;
      }
      strategy.stopAction(sanitize(name), {
        type: sanitize(options2 && options2.type),
        context: sanitize(options2 && options2.context),
        actionKey: options2 && options2.actionKey
      });
    }),
    startResource: monitor((url, options2) => {
      if (strategy.initConfiguration && !isExperimentalFeatureEnabled(ExperimentalFeature.START_STOP_RESOURCE)) {
        return;
      }
      strategy.startResource(sanitize(url), {
        type: sanitize(options2 && options2.type),
        method: sanitize(options2 && options2.method),
        context: sanitize(options2 && options2.context),
        resourceKey: options2 && options2.resourceKey
      });
    }),
    stopResource: monitor((url, options2) => {
      if (strategy.initConfiguration && !isExperimentalFeatureEnabled(ExperimentalFeature.START_STOP_RESOURCE)) {
        return;
      }
      strategy.stopResource(sanitize(url), {
        type: sanitize(options2 && options2.type),
        statusCode: options2 && options2.statusCode,
        size: options2 && options2.size,
        context: sanitize(options2 && options2.context),
        resourceKey: options2 && options2.resourceKey
      });
    }),
    addError: (error, context) => {
      const handlingStack = createHandlingStack("error");
      callMonitored(() => {
        strategy.addError({
          error,
          // Do not sanitize error here, it is needed unserialized by computeRawError()
          handlingStack,
          context: sanitize(context),
          startClocks: clocksNow()
        });
        addTelemetryUsage({ feature: "add-error" });
      });
    },
    addTiming: monitor((name, time) => {
      strategy.addTiming(sanitize(name), time);
    }),
    setViewLoadingTime: monitor(() => {
      const callTimestamp = timeStampNow();
      strategy.setLoadingTime(callTimestamp);
      addTelemetryUsage({
        feature: "addViewLoadingTime"
      });
    }),
    setGlobalContext: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.setContext, "set-global-context"),
    getGlobalContext: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.getContext, "get-global-context"),
    setGlobalContextProperty: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.setContextProperty, "set-global-context-property"),
    removeGlobalContextProperty: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.removeContextProperty, "remove-global-context-property"),
    clearGlobalContext: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.clearContext, "clear-global-context"),
    setUser: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.setContext, "set-user"),
    getUser: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.getContext, "get-user"),
    setUserProperty: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.setContextProperty, "set-user-property"),
    removeUserProperty: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.removeContextProperty, "remove-user-property"),
    clearUser: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.clearContext, "clear-user"),
    setAccount: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.setContext, "set-account"),
    getAccount: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.getContext, "get-account"),
    setAccountProperty: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.setContextProperty, "set-account-property"),
    removeAccountProperty: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.removeContextProperty, "remove-account-property"),
    clearAccount: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.clearContext, "clear-account"),
    startView,
    stopSession: monitor(() => {
      strategy.stopSession();
      addTelemetryUsage({ feature: "stop-session" });
    }),
    addFeatureFlagEvaluation: monitor((key, value) => {
      strategy.addFeatureFlagEvaluation(sanitize(key), sanitize(value));
      addTelemetryUsage({ feature: "add-feature-flag-evaluation" });
    }),
    getSessionReplayLink: monitor(() => recorderApi.getSessionReplayLink()),
    startSessionReplayRecording: monitor((options2) => {
      recorderApi.start(options2);
      addTelemetryUsage({ feature: "start-session-replay-recording", force: options2 && options2.force });
    }),
    stopSessionReplayRecording: monitor(() => recorderApi.stop()),
    addDurationVital: (name, options2) => {
      const handlingStack = createHandlingStack("vital");
      callMonitored(() => {
        addTelemetryUsage({ feature: "add-duration-vital" });
        strategy.addDurationVital({
          id: generateUUID(),
          name: sanitize(name),
          type: VitalType.DURATION,
          startClocks: timeStampToClocks(options2.startTime),
          duration: options2.duration,
          context: sanitize(options2 && options2.context),
          description: sanitize(options2 && options2.description),
          handlingStack
        });
      });
    },
    startDurationVital: (name, options2) => {
      const handlingStack = createHandlingStack("vital");
      return callMonitored(() => {
        addTelemetryUsage({ feature: "start-duration-vital" });
        return strategy.startDurationVital(sanitize(name), {
          context: sanitize(options2 && options2.context),
          description: sanitize(options2 && options2.description),
          handlingStack
        });
      });
    },
    stopDurationVital: monitor((nameOrRef, options2) => {
      addTelemetryUsage({ feature: "stop-duration-vital" });
      strategy.stopDurationVital(typeof nameOrRef === "string" ? sanitize(nameOrRef) : nameOrRef, {
        context: sanitize(options2 && options2.context),
        description: sanitize(options2 && options2.description)
      });
    }),
    startFeatureOperation: (name, options2) => {
      const handlingStack = createHandlingStack("vital");
      callMonitored(() => {
        addTelemetryUsage({ feature: "add-operation-step-vital", action_type: "start" });
        strategy.addOperationStepVital(name, "start", { ...options2, handlingStack });
      });
    },
    succeedFeatureOperation: monitor((name, options2) => {
      addTelemetryUsage({ feature: "add-operation-step-vital", action_type: "succeed" });
      strategy.addOperationStepVital(name, "end", options2);
    }),
    failFeatureOperation: monitor((name, failureReason, options2) => {
      addTelemetryUsage({ feature: "add-operation-step-vital", action_type: "fail" });
      strategy.addOperationStepVital(name, "end", options2, failureReason);
    })
  });
  return rumPublicApi;
}
function createPostStartStrategy(preStartStrategy, startRumResult) {
  return {
    init: (initConfiguration) => {
      displayAlreadyInitializedError("DD_RUM", initConfiguration);
    },
    initConfiguration: preStartStrategy.initConfiguration,
    ...startRumResult
  };
}

// ../../node_modules/@datadog/browser-rum-core/esm/transport/formDataTransport.js
function createFormDataTransport(configuration, lifeCycle, createEncoder, streamId) {
  const reportError = (error) => {
    lifeCycle.notify(14, { error });
    addTelemetryDebug("Error reported to customer", { "error.message": error.message });
  };
  const httpRequest = createHttpRequest([configuration.profilingEndpointBuilder], reportError);
  const encoder = createEncoder(streamId);
  return {
    async send({ event, ...attachments }) {
      const formData = new FormData();
      const serializedEvent = jsonStringify(event);
      if (!serializedEvent) {
        throw new Error("Failed to serialize event");
      }
      formData.append("event", new Blob([serializedEvent], { type: "application/json" }), "event.json");
      let bytesCount = serializedEvent.length;
      for (const [key, value] of objectEntries(attachments)) {
        const serializedValue = jsonStringify(value);
        if (!serializedValue) {
          throw new Error("Failed to serialize attachment");
        }
        const result = await encode(encoder, serializedValue);
        bytesCount += result.outputBytesCount;
        formData.append(key, new Blob([result.output]), key);
      }
      httpRequest.send({
        data: formData,
        bytesCount
      });
    }
  };
}
function encode(encoder, data) {
  return new Promise((resolve) => {
    encoder.write(data);
    encoder.finish((encoderResult) => {
      resolve(encoderResult);
    });
  });
}

// ../../node_modules/@datadog/browser-rum-core/esm/domain/getSessionReplayUrl.js
function getSessionReplayUrl(configuration, { session, viewContext, errorType }) {
  const sessionId = session ? session.id : "no-session-id";
  const parameters = [];
  if (errorType !== void 0) {
    parameters.push(`error-type=${errorType}`);
  }
  if (viewContext) {
    parameters.push(`seed=${viewContext.id}`);
    parameters.push(`from=${viewContext.startClocks.timeStamp}`);
  }
  const origin = getDatadogSiteUrl(configuration);
  const path = `/rum/replay/sessions/${sessionId}`;
  return `${origin}${path}?${parameters.join("&")}`;
}
function getDatadogSiteUrl(rumConfiguration) {
  const site = rumConfiguration.site;
  const subdomain = rumConfiguration.subdomain || getSiteDefaultSubdomain(rumConfiguration);
  return `https://${subdomain ? `${subdomain}.` : ""}${site}`;
}
function getSiteDefaultSubdomain(configuration) {
  switch (configuration.site) {
    case INTAKE_SITE_US1:
    case INTAKE_SITE_EU1:
      return "app";
    case INTAKE_SITE_STAGING:
      return "dd";
    default:
      return void 0;
  }
}

export {
  RumEventType,
  RumLongTaskEntryType,
  getMutationObserverConstructor,
  sanitizeIfLongDataUrl,
  isSampled,
  isElementNode,
  isNodeShadowHost,
  isNodeShadowRoot,
  hasChildNodes,
  forEachChildNodes,
  getParentNode,
  RumPerformanceEntryType,
  NodePrivacyLevel,
  PRIVACY_ATTR_NAME,
  PRIVACY_ATTR_VALUE_HIDDEN,
  CENSORED_STRING_MARK,
  CENSORED_IMG_MARK,
  getNodePrivacyLevel,
  reducePrivacyLevel,
  getNodeSelfPrivacyLevel,
  shouldMaskNode,
  shouldMaskAttribute,
  getTextContent,
  getScrollX,
  getScrollY,
  initViewportObservable,
  getViewportDimension,
  makeRumPublicApi,
  getSessionReplayUrl,
  createFormDataTransport
};
//# sourceMappingURL=chunk-6LMWSHFG.js.map
