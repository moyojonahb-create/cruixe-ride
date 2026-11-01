// ../../node_modules/@datadog/browser-core/esm/tools/display.js
var ConsoleApiName = {
  log: "log",
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error"
};
var globalConsole = console;
var originalConsoleMethods = {};
Object.keys(ConsoleApiName).forEach((name) => {
  originalConsoleMethods[name] = globalConsole[name];
});
var PREFIX = "Datadog Browser SDK:";
var display = {
  debug: originalConsoleMethods.debug.bind(globalConsole, PREFIX),
  log: originalConsoleMethods.log.bind(globalConsole, PREFIX),
  info: originalConsoleMethods.info.bind(globalConsole, PREFIX),
  warn: originalConsoleMethods.warn.bind(globalConsole, PREFIX),
  error: originalConsoleMethods.error.bind(globalConsole, PREFIX)
};
var DOCS_ORIGIN = "https://docs.datadoghq.com";
var DOCS_TROUBLESHOOTING = `${DOCS_ORIGIN}/real_user_monitoring/browser/troubleshooting`;
var MORE_DETAILS = "More details:";

// ../../node_modules/@datadog/browser-core/esm/tools/globalObject.js
function getGlobalObject() {
  if (typeof globalThis === "object") {
    return globalThis;
  }
  Object.defineProperty(Object.prototype, "_dd_temp_", {
    get() {
      return this;
    },
    configurable: true
  });
  let globalObject2 = _dd_temp_;
  delete Object.prototype._dd_temp_;
  if (typeof globalObject2 !== "object") {
    if (typeof self === "object") {
      globalObject2 = self;
    } else if (typeof window === "object") {
      globalObject2 = window;
    } else {
      globalObject2 = {};
    }
  }
  return globalObject2;
}
var globalObject = getGlobalObject();
var isWorkerEnvironment = "WorkerGlobalScope" in globalObject;

// ../../node_modules/@datadog/browser-core/esm/tools/monitor.js
var onMonitorErrorCollected;
var debugMode = false;
function startMonitorErrorCollection(newOnMonitorErrorCollected) {
  onMonitorErrorCollected = newOnMonitorErrorCollected;
}
function setDebugMode(newDebugMode) {
  debugMode = newDebugMode;
}
function monitor(fn) {
  return function(...args) {
    return callMonitored(fn, this, args);
  };
}
function callMonitored(fn, context, args) {
  try {
    return fn.apply(context, args);
  } catch (e) {
    monitorError(e);
  }
}
function monitorError(e) {
  displayIfDebugEnabled(e);
  if (onMonitorErrorCollected) {
    try {
      onMonitorErrorCollected(e);
    } catch (e2) {
      displayIfDebugEnabled(e2);
    }
  }
}
function displayIfDebugEnabled(...args) {
  if (debugMode) {
    display.error("[MONITOR]", ...args);
  }
}

// ../../node_modules/@datadog/browser-core/esm/tools/getZoneJsOriginalValue.js
function getZoneJsOriginalValue(target, name) {
  const browserWindow = getGlobalObject();
  let original;
  if (browserWindow.Zone && typeof browserWindow.Zone.__symbol__ === "function") {
    original = target[browserWindow.Zone.__symbol__(name)];
  }
  if (!original) {
    original = target[name];
  }
  return original;
}

// ../../node_modules/@datadog/browser-core/esm/tools/timer.js
function setTimeout(callback, delay) {
  return getZoneJsOriginalValue(getGlobalObject(), "setTimeout")(monitor(callback), delay);
}
function clearTimeout(timeoutId) {
  getZoneJsOriginalValue(getGlobalObject(), "clearTimeout")(timeoutId);
}
function setInterval(callback, delay) {
  return getZoneJsOriginalValue(getGlobalObject(), "setInterval")(monitor(callback), delay);
}
function clearInterval(timeoutId) {
  getZoneJsOriginalValue(getGlobalObject(), "clearInterval")(timeoutId);
}

// ../../node_modules/@datadog/browser-core/esm/tools/utils/numberUtils.js
function performDraw(threshold) {
  return threshold !== 0 && Math.random() * 100 <= threshold;
}
function round(num, decimals) {
  return +num.toFixed(decimals);
}
function isPercentage(value) {
  return isNumber(value) && value >= 0 && value <= 100;
}
function isNumber(value) {
  return typeof value === "number";
}

// ../../node_modules/@datadog/browser-core/esm/tools/utils/timeUtils.js
var ONE_SECOND = 1e3;
var ONE_MINUTE = 60 * ONE_SECOND;
var ONE_HOUR = 60 * ONE_MINUTE;
var ONE_DAY = 24 * ONE_HOUR;
var ONE_YEAR = 365 * ONE_DAY;
function relativeToClocks(relative) {
  return { relative, timeStamp: getCorrectedTimeStamp(relative) };
}
function timeStampToClocks(timeStamp) {
  return { relative: getRelativeTime(timeStamp), timeStamp };
}
function getCorrectedTimeStamp(relativeTime) {
  const correctedOrigin = dateNow() - performance.now();
  if (correctedOrigin > getNavigationStart()) {
    return Math.round(addDuration(correctedOrigin, relativeTime));
  }
  return getTimeStamp(relativeTime);
}
function currentDrift() {
  return Math.round(dateNow() - addDuration(getNavigationStart(), performance.now()));
}
function toServerDuration(duration) {
  if (!isNumber(duration)) {
    return duration;
  }
  return round(duration * 1e6, 0);
}
function dateNow() {
  return (/* @__PURE__ */ new Date()).getTime();
}
function timeStampNow() {
  return dateNow();
}
function relativeNow() {
  return performance.now();
}
function clocksNow() {
  return { relative: relativeNow(), timeStamp: timeStampNow() };
}
function clocksOrigin() {
  return { relative: 0, timeStamp: getNavigationStart() };
}
function elapsed(start, end) {
  return end - start;
}
function addDuration(a, b) {
  return a + b;
}
function getRelativeTime(timestamp) {
  return timestamp - getNavigationStart();
}
function getTimeStamp(relativeTime) {
  return Math.round(addDuration(getNavigationStart(), relativeTime));
}
function looksLikeRelativeTime(time) {
  return time < ONE_YEAR;
}
var navigationStart;
function getNavigationStart() {
  var _a, _b;
  if (navigationStart === void 0) {
    navigationStart = (_b = (_a = performance.timing) === null || _a === void 0 ? void 0 : _a.navigationStart) !== null && _b !== void 0 ? _b : performance.timeOrigin;
  }
  return navigationStart;
}

// ../../node_modules/@datadog/browser-core/esm/tools/utils/functionUtils.js
function throttle(fn, wait, options) {
  const needLeadingExecution = options && options.leading !== void 0 ? options.leading : true;
  const needTrailingExecution = options && options.trailing !== void 0 ? options.trailing : true;
  let inWaitPeriod = false;
  let pendingExecutionWithParameters;
  let pendingTimeoutId;
  return {
    throttled: (...parameters) => {
      if (inWaitPeriod) {
        pendingExecutionWithParameters = parameters;
        return;
      }
      if (needLeadingExecution) {
        fn(...parameters);
      } else {
        pendingExecutionWithParameters = parameters;
      }
      inWaitPeriod = true;
      pendingTimeoutId = setTimeout(() => {
        if (needTrailingExecution && pendingExecutionWithParameters) {
          fn(...pendingExecutionWithParameters);
        }
        inWaitPeriod = false;
        pendingExecutionWithParameters = void 0;
      }, wait);
    },
    cancel: () => {
      clearTimeout(pendingTimeoutId);
      inWaitPeriod = false;
      pendingExecutionWithParameters = void 0;
    }
  };
}
function noop() {
}

// ../../node_modules/@datadog/browser-core/esm/tools/mockable.js
function mockable(value) {
  if (false) {
    return mockableReplacements.get(value);
  }
  return value;
}

// ../../node_modules/@datadog/browser-core/esm/tools/catchUserErrors.js
function catchUserErrors(fn, errorMsg) {
  return (...args) => {
    try {
      return fn(...args);
    } catch (err) {
      display.error(errorMsg, err);
    }
  };
}

// ../../node_modules/@datadog/browser-core/esm/tools/utils/objectUtils.js
function tryJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (_a) {
  }
}
function shallowClone(object) {
  return { ...object };
}
function objectHasValue(object, value) {
  return Object.keys(object).some((key) => object[key] === value);
}
function isEmptyObject(object) {
  return Object.keys(object).length === 0;
}
function mapValues(object, fn) {
  const newObject = {};
  for (const key of Object.keys(object)) {
    newObject[key] = fn(object[key]);
  }
  return newObject;
}

// ../../node_modules/@datadog/browser-core/esm/tools/queueMicrotask.js
function queueMicrotask(callback) {
  const nativeImplementation = globalObject.queueMicrotask;
  if (typeof nativeImplementation === "function") {
    nativeImplementation(monitor(callback));
  } else {
    Promise.resolve().then(monitor(callback));
  }
}

// ../../node_modules/@datadog/browser-core/esm/tools/observable.js
var Observable = class {
  constructor(onFirstSubscribe) {
    this.onFirstSubscribe = onFirstSubscribe;
    this.observers = [];
  }
  subscribe(observer) {
    this.addObserver(observer);
    return {
      unsubscribe: () => this.removeObserver(observer)
    };
  }
  notify(data) {
    this.observers.forEach((observer) => observer(data));
  }
  addObserver(observer) {
    this.observers.push(observer);
    if (this.observers.length === 1 && this.onFirstSubscribe) {
      this.onLastUnsubscribe = this.onFirstSubscribe(this) || void 0;
    }
  }
  removeObserver(observer) {
    this.observers = this.observers.filter((other) => observer !== other);
    if (!this.observers.length && this.onLastUnsubscribe) {
      this.onLastUnsubscribe();
    }
  }
};
function mergeObservables(...observables) {
  return new Observable((globalObservable) => {
    const subscriptions = observables.map((observable) => observable.subscribe((data) => globalObservable.notify(data)));
    return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
  });
}
var BufferedObservable = class extends Observable {
  constructor(maxBufferSize) {
    super();
    this.maxBufferSize = maxBufferSize;
    this.buffer = [];
  }
  notify(data) {
    this.buffer.push(data);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
    super.notify(data);
  }
  subscribe(observer) {
    let closed = false;
    const subscription = {
      unsubscribe: () => {
        closed = true;
        this.removeObserver(observer);
      }
    };
    queueMicrotask(() => {
      for (const data of this.buffer) {
        if (closed) {
          return;
        }
        observer(data);
      }
      if (!closed) {
        this.addObserver(observer);
      }
    });
    return subscription;
  }
  /**
   * Drop buffered data and don't buffer future data. This is to avoid leaking memory when it's not
   * needed anymore. This can be seen as a performance optimization, and things will work probably
   * even if this method isn't called, but still useful to clarify our intent and lowering our
   * memory impact.
   */
  unbuffer() {
    queueMicrotask(() => {
      this.maxBufferSize = this.buffer.length = 0;
    });
  }
};

// ../../node_modules/@datadog/browser-core/esm/tools/utils/stringUtils.js
function generateUUID(placeholder) {
  return placeholder ? (
    // eslint-disable-next-line  no-bitwise
    (parseInt(placeholder, 10) ^ Math.random() * 16 >> parseInt(placeholder, 10) / 4).toString(16)
  ) : `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, generateUUID);
}
var COMMA_SEPARATED_KEY_VALUE = /(\S+?)\s*=\s*(.+?)(?:;|$)/g;
function findCommaSeparatedValue(rawString, name) {
  COMMA_SEPARATED_KEY_VALUE.lastIndex = 0;
  while (true) {
    const match = COMMA_SEPARATED_KEY_VALUE.exec(rawString);
    if (match) {
      if (match[1] === name) {
        return match[2];
      }
    } else {
      break;
    }
  }
}
function findAllCommaSeparatedValues(rawString) {
  const result = /* @__PURE__ */ new Map();
  COMMA_SEPARATED_KEY_VALUE.lastIndex = 0;
  while (true) {
    const match = COMMA_SEPARATED_KEY_VALUE.exec(rawString);
    if (match) {
      const key = match[1];
      const value = match[2];
      if (result.has(key)) {
        result.get(key).push(value);
      } else {
        result.set(key, [value]);
      }
    } else {
      break;
    }
  }
  return result;
}
function findCommaSeparatedValues(rawString) {
  const result = /* @__PURE__ */ new Map();
  COMMA_SEPARATED_KEY_VALUE.lastIndex = 0;
  while (true) {
    const match = COMMA_SEPARATED_KEY_VALUE.exec(rawString);
    if (match) {
      result.set(match[1], match[2]);
    } else {
      break;
    }
  }
  return result;
}
function safeTruncate(candidate, length, suffix = "") {
  const lastChar = candidate.charCodeAt(length - 1);
  const isLastCharSurrogatePair = lastChar >= 55296 && lastChar <= 56319;
  const correctedLength = isLastCharSurrogatePair ? length + 1 : length;
  if (candidate.length <= correctedLength) {
    return candidate;
  }
  return `${candidate.slice(0, correctedLength)}${suffix}`;
}

// ../../node_modules/@datadog/browser-core/esm/tools/utils/browserDetection.js
function isChromium() {
  return detectBrowserCached() === 0;
}
function isSafari() {
  return detectBrowserCached() === 1;
}
var browserCache;
function detectBrowserCached() {
  return browserCache !== null && browserCache !== void 0 ? browserCache : browserCache = detectBrowser();
}
function detectBrowser(browserWindow = window) {
  var _a;
  const userAgent = browserWindow.navigator.userAgent;
  if (browserWindow.chrome || /HeadlessChrome/.test(userAgent)) {
    return 0;
  }
  if (
    // navigator.vendor is deprecated, but it is the most resilient way we found to detect
    // "Apple maintained browsers" (AKA Safari). If one day it gets removed, we still have the
    // useragent test as a semi-working fallback.
    ((_a = browserWindow.navigator.vendor) === null || _a === void 0 ? void 0 : _a.indexOf("Apple")) === 0 || /safari/i.test(userAgent) && !/chrome|android/i.test(userAgent)
  ) {
    return 1;
  }
  return 2;
}

// ../../node_modules/@datadog/browser-core/esm/tools/utils/urlPolyfill.js
function normalizeUrl(url) {
  return buildUrl(url, location.href).href;
}
function isValidUrl(url) {
  try {
    return !!buildUrl(url);
  } catch (_a) {
    return false;
  }
}
function getPathName(url) {
  const pathname = buildUrl(url).pathname;
  return pathname[0] === "/" ? pathname : `/${pathname}`;
}
function buildUrl(url, base) {
  const { URL } = getPristineWindow();
  try {
    return base !== void 0 ? new URL(url, base) : new URL(url);
  } catch (error) {
    throw new Error(`Failed to construct URL: ${String(error)}`);
  }
}
var getPristineGlobalObjectCache;
function getPristineWindow() {
  var _a;
  if (!getPristineGlobalObjectCache) {
    let iframe;
    let pristineWindow;
    try {
      iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      pristineWindow = (_a = iframe.contentWindow) !== null && _a !== void 0 ? _a : globalObject;
    } catch (_b) {
      pristineWindow = globalObject;
    }
    getPristineGlobalObjectCache = {
      URL: pristineWindow.URL
    };
    iframe === null || iframe === void 0 ? void 0 : iframe.remove();
  }
  return getPristineGlobalObjectCache;
}

// ../../node_modules/@datadog/browser-core/esm/browser/cookie.js
function setCookie(name, value, expireDelay = 0, options) {
  const date = /* @__PURE__ */ new Date();
  date.setTime(date.getTime() + expireDelay);
  const expires = `expires=${date.toUTCString()}`;
  const sameSite = options && options.crossSite ? "none" : "strict";
  const domain = options && options.domain ? `;domain=${options.domain}` : "";
  const secure = options && options.secure ? ";secure" : "";
  const partitioned = options && options.partitioned ? ";partitioned" : "";
  document.cookie = `${name}=${value};${expires};path=/;samesite=${sameSite}${domain}${secure}${partitioned}`;
}
function getCookie(name) {
  return findCommaSeparatedValue(document.cookie, name);
}
function getCookies(name) {
  return findAllCommaSeparatedValues(document.cookie).get(name) || [];
}
var initCookieParsed;
function getInitCookie(name) {
  if (!initCookieParsed) {
    initCookieParsed = findCommaSeparatedValues(document.cookie);
  }
  return initCookieParsed.get(name);
}
function deleteCookie(name, options) {
  setCookie(name, "", 0, options);
}
function areCookiesAuthorized(options) {
  if (document.cookie === void 0 || document.cookie === null) {
    return false;
  }
  try {
    const testCookieName = `dd_cookie_test_${generateUUID()}`;
    const testCookieValue = "test";
    setCookie(testCookieName, testCookieValue, ONE_MINUTE, options);
    const isCookieCorrectlySet = getCookie(testCookieName) === testCookieValue;
    deleteCookie(testCookieName, options);
    return isCookieCorrectlySet;
  } catch (error) {
    display.error(error);
    return false;
  }
}
var getCurrentSiteCache;
function getCurrentSite(hostname = location.hostname, referrer = document.referrer) {
  if (getCurrentSiteCache === void 0) {
    const defaultHostName = getCookieDefaultHostName(hostname, referrer);
    if (defaultHostName) {
      const testCookieName = `dd_site_test_${generateUUID()}`;
      const testCookieValue = "test";
      const domainLevels = defaultHostName.split(".");
      let candidateDomain = domainLevels.pop();
      while (domainLevels.length && !getCookie(testCookieName)) {
        candidateDomain = `${domainLevels.pop()}.${candidateDomain}`;
        setCookie(testCookieName, testCookieValue, ONE_SECOND, { domain: candidateDomain });
      }
      deleteCookie(testCookieName, { domain: candidateDomain });
      getCurrentSiteCache = candidateDomain;
    }
  }
  return getCurrentSiteCache;
}
function getCookieDefaultHostName(hostname, referrer) {
  try {
    return hostname || buildUrl(referrer).hostname;
  } catch (_a) {
  }
}

// ../../node_modules/@datadog/browser-core/esm/domain/session/storeStrategies/sessionStoreStrategy.js
var SESSION_STORE_KEY = "_dd_s";

// ../../node_modules/@datadog/browser-core/esm/tools/utils/polyfills.js
function findLast(array, predicate) {
  for (let i = array.length - 1; i >= 0; i -= 1) {
    const item = array[i];
    if (predicate(item, i, array)) {
      return item;
    }
  }
  return void 0;
}
function objectValues(object) {
  return Object.values(object);
}
function objectEntries(object) {
  return Object.entries(object);
}

// ../../node_modules/@datadog/browser-core/esm/domain/session/sessionConstants.js
var SESSION_TIME_OUT_DELAY = 4 * ONE_HOUR;
var SESSION_EXPIRATION_DELAY = 15 * ONE_MINUTE;
var SESSION_COOKIE_EXPIRATION_DELAY = ONE_YEAR;
var SESSION_NOT_TRACKED = "0";
var SessionPersistence = {
  COOKIE: "cookie",
  MEMORY: "memory",
  LOCAL_STORAGE: "local-storage"
};

// ../../node_modules/@datadog/browser-core/esm/domain/session/sessionStateValidation.js
var SESSION_ENTRY_REGEXP = /^([a-zA-Z]+)=([a-z0-9-]+)$/;
var SESSION_ENTRY_SEPARATOR = "&";
function isValidSessionString(sessionString) {
  return !!sessionString && (sessionString.indexOf(SESSION_ENTRY_SEPARATOR) !== -1 || SESSION_ENTRY_REGEXP.test(sessionString));
}

// ../../node_modules/@datadog/browser-core/esm/domain/session/sessionState.js
var EXPIRED = "1";
function getExpiredSessionState(previousSessionState, configuration) {
  const expiredSessionState = {
    isExpired: EXPIRED
  };
  if (configuration.trackAnonymousUser && (previousSessionState === null || previousSessionState === void 0 ? void 0 : previousSessionState.anonymousId)) {
    expiredSessionState.anonymousId = previousSessionState === null || previousSessionState === void 0 ? void 0 : previousSessionState.anonymousId;
  }
  return expiredSessionState;
}
function isSessionInNotStartedState(session) {
  return isEmptyObject(session);
}
function isSessionStarted(session) {
  return !isSessionInNotStartedState(session);
}
function isSessionInExpiredState(session) {
  return session.isExpired !== void 0 || !isActiveSession(session);
}
function isActiveSession(sessionState) {
  return (sessionState.created === void 0 || dateNow() - Number(sessionState.created) < SESSION_TIME_OUT_DELAY) && (sessionState.expire === void 0 || dateNow() < Number(sessionState.expire));
}
function expandSessionState(session) {
  session.expire = String(dateNow() + SESSION_EXPIRATION_DELAY);
}
function toSessionString(session) {
  return objectEntries(session).map(([key, value]) => key === "anonymousId" ? `aid=${value}` : `${key}=${value}`).join(SESSION_ENTRY_SEPARATOR);
}
function toSessionState(sessionString) {
  const session = {};
  if (isValidSessionString(sessionString)) {
    sessionString.split(SESSION_ENTRY_SEPARATOR).forEach((entry) => {
      const matches = SESSION_ENTRY_REGEXP.exec(entry);
      if (matches !== null) {
        const [, key, value] = matches;
        if (key === "aid") {
          session.anonymousId = value;
        } else {
          session[key] = value;
        }
      }
    });
  }
  return session;
}

// ../../node_modules/@datadog/browser-core/esm/domain/session/oldCookiesMigration.js
var OLD_SESSION_COOKIE_NAME = "_dd";
var OLD_RUM_COOKIE_NAME = "_dd_r";
var OLD_LOGS_COOKIE_NAME = "_dd_l";
var RUM_SESSION_KEY = "rum";
var LOGS_SESSION_KEY = "logs";
function tryOldCookiesMigration(cookieStoreStrategy) {
  const sessionString = getInitCookie(SESSION_STORE_KEY);
  if (!sessionString) {
    const oldSessionId = getInitCookie(OLD_SESSION_COOKIE_NAME);
    const oldRumType = getInitCookie(OLD_RUM_COOKIE_NAME);
    const oldLogsType = getInitCookie(OLD_LOGS_COOKIE_NAME);
    const session = {};
    if (oldSessionId) {
      session.id = oldSessionId;
    }
    if (oldLogsType && /^[01]$/.test(oldLogsType)) {
      session[LOGS_SESSION_KEY] = oldLogsType;
    }
    if (oldRumType && /^[012]$/.test(oldRumType)) {
      session[RUM_SESSION_KEY] = oldRumType;
    }
    if (isSessionStarted(session)) {
      expandSessionState(session);
      cookieStoreStrategy.persistSession(session);
    }
  }
}

// ../../node_modules/@datadog/browser-core/esm/domain/session/storeStrategies/sessionInCookie.js
var SESSION_COOKIE_VERSION = 0;
function selectCookieStrategy(initConfiguration) {
  const cookieOptions = buildCookieOptions(initConfiguration);
  return cookieOptions && areCookiesAuthorized(cookieOptions) ? { type: SessionPersistence.COOKIE, cookieOptions } : void 0;
}
function initCookieStrategy(configuration, cookieOptions) {
  const cookieStore2 = {
    /**
     * Lock strategy allows mitigating issues due to concurrent access to cookie.
     * This issue concerns only chromium browsers and enabling this on firefox increases cookie write failures.
     */
    isLockEnabled: isChromium(),
    persistSession: (sessionState) => storeSessionCookie(cookieOptions, configuration, sessionState, SESSION_EXPIRATION_DELAY),
    retrieveSession: () => retrieveSessionCookie(cookieOptions, configuration),
    expireSession: (sessionState) => storeSessionCookie(cookieOptions, configuration, getExpiredSessionState(sessionState, configuration), SESSION_TIME_OUT_DELAY)
  };
  tryOldCookiesMigration(cookieStore2);
  return cookieStore2;
}
function storeSessionCookie(options, configuration, sessionState, defaultTimeout) {
  let sessionStateString = toSessionString(sessionState);
  if (configuration.betaEncodeCookieOptions) {
    sessionStateString = toSessionString({
      ...sessionState,
      // deleting a cookie is writing a new cookie with an empty value
      // we don't want to store the cookie options in this case otherwise the cookie will not be deleted
      ...!isEmptyObject(sessionState) ? { c: encodeCookieOptions(options) } : {}
    });
  }
  setCookie(SESSION_STORE_KEY, sessionStateString, configuration.trackAnonymousUser ? SESSION_COOKIE_EXPIRATION_DELAY : defaultTimeout, options);
}
function retrieveSessionCookie(cookieOptions, configuration) {
  if (configuration.betaEncodeCookieOptions) {
    return retrieveSessionCookieFromEncodedCookie(cookieOptions);
  }
  const sessionString = getCookie(SESSION_STORE_KEY);
  const sessionState = toSessionState(sessionString);
  return sessionState;
}
function buildCookieOptions(initConfiguration) {
  const cookieOptions = {};
  cookieOptions.secure = !!initConfiguration.useSecureSessionCookie || !!initConfiguration.usePartitionedCrossSiteSessionCookie;
  cookieOptions.crossSite = !!initConfiguration.usePartitionedCrossSiteSessionCookie;
  cookieOptions.partitioned = !!initConfiguration.usePartitionedCrossSiteSessionCookie;
  if (initConfiguration.trackSessionAcrossSubdomains) {
    const currentSite = getCurrentSite();
    if (!currentSite) {
      return;
    }
    cookieOptions.domain = currentSite;
  }
  return cookieOptions;
}
function encodeCookieOptions(cookieOptions) {
  const domainCount = cookieOptions.domain ? cookieOptions.domain.split(".").length - 1 : 0;
  let byte = 0;
  byte |= SESSION_COOKIE_VERSION << 5;
  byte |= domainCount << 1;
  byte |= cookieOptions.crossSite ? 1 : 0;
  return byte.toString(16);
}
function retrieveSessionCookieFromEncodedCookie(cookieOptions) {
  const cookies = getCookies(SESSION_STORE_KEY);
  const opts = encodeCookieOptions(cookieOptions);
  let sessionState;
  for (const cookie of cookies.reverse()) {
    sessionState = toSessionState(cookie);
    if (sessionState.c === opts) {
      break;
    }
  }
  sessionState === null || sessionState === void 0 ? true : delete sessionState.c;
  return sessionState !== null && sessionState !== void 0 ? sessionState : {};
}

// ../../node_modules/@datadog/browser-core/esm/domain/session/storeStrategies/sessionInLocalStorage.js
var LOCAL_STORAGE_TEST_KEY = "_dd_test_";
function selectLocalStorageStrategy() {
  try {
    const id = generateUUID();
    const testKey = `${LOCAL_STORAGE_TEST_KEY}${id}`;
    localStorage.setItem(testKey, id);
    const retrievedId = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return id === retrievedId ? { type: SessionPersistence.LOCAL_STORAGE } : void 0;
  } catch (_a) {
    return void 0;
  }
}
function initLocalStorageStrategy(configuration) {
  return {
    isLockEnabled: false,
    persistSession: persistInLocalStorage,
    retrieveSession: retrieveSessionFromLocalStorage,
    expireSession: (sessionState) => expireSessionFromLocalStorage(sessionState, configuration)
  };
}
function persistInLocalStorage(sessionState) {
  localStorage.setItem(SESSION_STORE_KEY, toSessionString(sessionState));
}
function retrieveSessionFromLocalStorage() {
  const sessionString = localStorage.getItem(SESSION_STORE_KEY);
  return toSessionState(sessionString);
}
function expireSessionFromLocalStorage(previousSessionState, configuration) {
  persistInLocalStorage(getExpiredSessionState(previousSessionState, configuration));
}

// ../../node_modules/@datadog/browser-core/esm/domain/session/sessionStoreOperations.js
var LOCK_RETRY_DELAY = 10;
var LOCK_MAX_TRIES = 100;
var LOCK_EXPIRATION_DELAY = ONE_SECOND;
var LOCK_SEPARATOR = "--";
var bufferedOperations = [];
var ongoingOperations;
function processSessionStoreOperations(operations, sessionStoreStrategy, numberOfRetries = 0) {
  var _a;
  const { isLockEnabled, persistSession, expireSession } = sessionStoreStrategy;
  const persistWithLock = (session) => persistSession({ ...session, lock: currentLock });
  const retrieveStore = () => {
    const { lock, ...session } = sessionStoreStrategy.retrieveSession();
    return {
      session,
      lock: lock && !isLockExpired(lock) ? lock : void 0
    };
  };
  if (!ongoingOperations) {
    ongoingOperations = operations;
  }
  if (operations !== ongoingOperations) {
    bufferedOperations.push(operations);
    return;
  }
  if (isLockEnabled && numberOfRetries >= LOCK_MAX_TRIES) {
    next(sessionStoreStrategy);
    return;
  }
  let currentLock;
  let currentStore = retrieveStore();
  if (isLockEnabled) {
    if (currentStore.lock) {
      retryLater(operations, sessionStoreStrategy, numberOfRetries);
      return;
    }
    currentLock = createLock();
    persistWithLock(currentStore.session);
    currentStore = retrieveStore();
    if (currentStore.lock !== currentLock) {
      retryLater(operations, sessionStoreStrategy, numberOfRetries);
      return;
    }
  }
  let processedSession = operations.process(currentStore.session);
  if (isLockEnabled) {
    currentStore = retrieveStore();
    if (currentStore.lock !== currentLock) {
      retryLater(operations, sessionStoreStrategy, numberOfRetries);
      return;
    }
  }
  if (processedSession) {
    if (isSessionInExpiredState(processedSession)) {
      expireSession(processedSession);
    } else {
      expandSessionState(processedSession);
      if (isLockEnabled) {
        persistWithLock(processedSession);
      } else {
        persistSession(processedSession);
      }
    }
  }
  if (isLockEnabled) {
    if (!(processedSession && isSessionInExpiredState(processedSession))) {
      currentStore = retrieveStore();
      if (currentStore.lock !== currentLock) {
        retryLater(operations, sessionStoreStrategy, numberOfRetries);
        return;
      }
      persistSession(currentStore.session);
      processedSession = currentStore.session;
    }
  }
  (_a = operations.after) === null || _a === void 0 ? void 0 : _a.call(operations, processedSession || currentStore.session);
  next(sessionStoreStrategy);
}
function retryLater(operations, sessionStore, currentNumberOfRetries) {
  setTimeout(() => {
    processSessionStoreOperations(operations, sessionStore, currentNumberOfRetries + 1);
  }, LOCK_RETRY_DELAY);
}
function next(sessionStore) {
  ongoingOperations = void 0;
  const nextOperations = bufferedOperations.shift();
  if (nextOperations) {
    processSessionStoreOperations(nextOperations, sessionStore);
  }
}
function createLock() {
  return generateUUID() + LOCK_SEPARATOR + timeStampNow();
}
function isLockExpired(lock) {
  const [, timeStamp] = lock.split(LOCK_SEPARATOR);
  return !timeStamp || elapsed(Number(timeStamp), timeStampNow()) > LOCK_EXPIRATION_DELAY;
}

// ../../node_modules/@datadog/browser-core/esm/domain/session/storeStrategies/sessionInMemory.js
var MEMORY_SESSION_STORE_KEY = "_DD_SESSION";
function selectMemorySessionStoreStrategy() {
  return { type: SessionPersistence.MEMORY };
}
function initMemorySessionStoreStrategy(configuration) {
  return {
    expireSession: (sessionState) => expireSessionFromMemory(sessionState, configuration),
    isLockEnabled: false,
    persistSession: persistInMemory,
    retrieveSession: retrieveFromMemory
  };
}
function retrieveFromMemory() {
  const globalObject2 = getGlobalObject();
  if (!globalObject2[MEMORY_SESSION_STORE_KEY]) {
    globalObject2[MEMORY_SESSION_STORE_KEY] = {};
  }
  return shallowClone(globalObject2[MEMORY_SESSION_STORE_KEY]);
}
function persistInMemory(state) {
  const globalObject2 = getGlobalObject();
  globalObject2[MEMORY_SESSION_STORE_KEY] = shallowClone(state);
}
function expireSessionFromMemory(previousSessionState, configuration) {
  persistInMemory(getExpiredSessionState(previousSessionState, configuration));
}

// ../../node_modules/@datadog/browser-core/esm/domain/session/sessionStore.js
var STORAGE_POLL_DELAY = ONE_SECOND;
function selectSessionStoreStrategyType(initConfiguration) {
  const { sessionPersistence } = initConfiguration;
  const persistenceList = normalizePersistenceList(sessionPersistence, initConfiguration);
  for (const persistence of persistenceList) {
    const strategyType = selectStrategyForPersistence(persistence, initConfiguration);
    if (strategyType !== void 0) {
      return strategyType;
    }
  }
  return void 0;
}
function normalizePersistenceList(sessionPersistence, initConfiguration) {
  if (Array.isArray(sessionPersistence)) {
    return sessionPersistence;
  }
  if (sessionPersistence !== void 0) {
    return [sessionPersistence];
  }
  return initConfiguration.allowFallbackToLocalStorage ? [SessionPersistence.COOKIE, SessionPersistence.LOCAL_STORAGE] : [SessionPersistence.COOKIE];
}
function selectStrategyForPersistence(persistence, initConfiguration) {
  switch (persistence) {
    case SessionPersistence.COOKIE:
      return selectCookieStrategy(initConfiguration);
    case SessionPersistence.LOCAL_STORAGE:
      return selectLocalStorageStrategy();
    case SessionPersistence.MEMORY:
      return selectMemorySessionStoreStrategy();
    default:
      display.error(`Invalid session persistence '${String(persistence)}'`);
      return void 0;
  }
}
function getSessionStoreStrategy(sessionStoreStrategyType, configuration) {
  return sessionStoreStrategyType.type === SessionPersistence.COOKIE ? initCookieStrategy(configuration, sessionStoreStrategyType.cookieOptions) : sessionStoreStrategyType.type === SessionPersistence.LOCAL_STORAGE ? initLocalStorageStrategy(configuration) : initMemorySessionStoreStrategy(configuration);
}
function startSessionStore(sessionStoreStrategyType, configuration, productKey, computeTrackingType, sessionStoreStrategy = getSessionStoreStrategy(sessionStoreStrategyType, configuration)) {
  const renewObservable = new Observable();
  const expireObservable = new Observable();
  const sessionStateUpdateObservable = new Observable();
  const watchSessionTimeoutId = setInterval(watchSession, STORAGE_POLL_DELAY);
  let sessionCache;
  startSession();
  const { throttled: throttledExpandOrRenewSession, cancel: cancelExpandOrRenewSession } = throttle(() => {
    processSessionStoreOperations({
      process: (sessionState) => {
        if (isSessionInNotStartedState(sessionState)) {
          return;
        }
        const synchronizedSession = synchronizeSession(sessionState);
        expandOrRenewSessionState(synchronizedSession);
        return synchronizedSession;
      },
      after: (sessionState) => {
        if (isSessionStarted(sessionState) && !hasSessionInCache()) {
          renewSessionInCache(sessionState);
        }
        sessionCache = sessionState;
      }
    }, sessionStoreStrategy);
  }, STORAGE_POLL_DELAY);
  function expandSession() {
    processSessionStoreOperations({
      process: (sessionState) => hasSessionInCache() ? synchronizeSession(sessionState) : void 0
    }, sessionStoreStrategy);
  }
  function watchSession() {
    const sessionState = sessionStoreStrategy.retrieveSession();
    if (isSessionInExpiredState(sessionState)) {
      processSessionStoreOperations({
        process: (sessionState2) => isSessionInExpiredState(sessionState2) ? getExpiredSessionState(sessionState2, configuration) : void 0,
        after: synchronizeSession
      }, sessionStoreStrategy);
    } else {
      synchronizeSession(sessionState);
    }
  }
  function synchronizeSession(sessionState) {
    if (isSessionInExpiredState(sessionState)) {
      sessionState = getExpiredSessionState(sessionState, configuration);
    }
    if (hasSessionInCache()) {
      if (isSessionInCacheOutdated(sessionState)) {
        expireSessionInCache();
      } else {
        sessionStateUpdateObservable.notify({ previousState: sessionCache, newState: sessionState });
        sessionCache = sessionState;
      }
    }
    return sessionState;
  }
  function startSession() {
    processSessionStoreOperations({
      process: (sessionState) => {
        if (isSessionInNotStartedState(sessionState)) {
          sessionState.anonymousId = generateUUID();
          return getExpiredSessionState(sessionState, configuration);
        }
      },
      after: (sessionState) => {
        sessionCache = sessionState;
      }
    }, sessionStoreStrategy);
  }
  function expandOrRenewSessionState(sessionState) {
    if (isSessionInNotStartedState(sessionState)) {
      return false;
    }
    const trackingType = computeTrackingType(sessionState[productKey]);
    sessionState[productKey] = trackingType;
    delete sessionState.isExpired;
    if (trackingType !== SESSION_NOT_TRACKED && !sessionState.id) {
      sessionState.id = generateUUID();
      sessionState.created = String(dateNow());
    }
    if (configuration.trackAnonymousUser && !sessionState.anonymousId) {
      sessionState.anonymousId = generateUUID();
    }
  }
  function hasSessionInCache() {
    return (sessionCache === null || sessionCache === void 0 ? void 0 : sessionCache[productKey]) !== void 0;
  }
  function isSessionInCacheOutdated(sessionState) {
    return sessionCache.id !== sessionState.id || sessionCache[productKey] !== sessionState[productKey];
  }
  function expireSessionInCache() {
    sessionCache = getExpiredSessionState(sessionCache, configuration);
    expireObservable.notify();
  }
  function renewSessionInCache(sessionState) {
    sessionCache = sessionState;
    renewObservable.notify();
  }
  function updateSessionState(partialSessionState) {
    processSessionStoreOperations({
      process: (sessionState) => ({ ...sessionState, ...partialSessionState }),
      after: synchronizeSession
    }, sessionStoreStrategy);
  }
  return {
    expandOrRenewSession: throttledExpandOrRenewSession,
    expandSession,
    getSession: () => sessionCache,
    renewObservable,
    expireObservable,
    sessionStateUpdateObservable,
    restartSession: startSession,
    expire: (hasConsent) => {
      cancelExpandOrRenewSession();
      if (hasConsent === false && sessionCache) {
        delete sessionCache.anonymousId;
      }
      sessionStoreStrategy.expireSession(sessionCache);
      synchronizeSession(getExpiredSessionState(sessionCache, configuration));
    },
    stop: () => {
      clearInterval(watchSessionTimeoutId);
    },
    updateSessionState
  };
}

// ../../node_modules/@datadog/browser-core/esm/domain/trackingConsent.js
var TrackingConsent = {
  GRANTED: "granted",
  NOT_GRANTED: "not-granted"
};
function createTrackingConsentState(currentConsent) {
  const observable = new Observable();
  return {
    tryToInit(trackingConsent) {
      if (!currentConsent) {
        currentConsent = trackingConsent;
      }
    },
    update(trackingConsent) {
      currentConsent = trackingConsent;
      observable.notify();
    },
    isGranted() {
      return currentConsent === TrackingConsent.GRANTED;
    },
    observable
  };
}

// ../../node_modules/@datadog/browser-core/esm/tools/utils/typeUtils.js
function getType(value) {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  return typeof value;
}
function isIndexableObject(value) {
  return getType(value) === "object";
}

// ../../node_modules/@datadog/browser-core/esm/tools/matchOption.js
function isMatchOption(item) {
  const itemType = getType(item);
  return itemType === "string" || itemType === "function" || item instanceof RegExp;
}
function matchList(list, value, useStartsWith = false) {
  return list.some((item) => {
    try {
      if (typeof item === "function") {
        return item(value);
      } else if (item instanceof RegExp) {
        return item.test(value);
      } else if (typeof item === "string") {
        return useStartsWith ? value.startsWith(item) : item === value;
      }
    } catch (e) {
      display.error(e);
    }
    return false;
  });
}

// ../../node_modules/@datadog/browser-core/esm/domain/extension/extensionUtils.js
var EXTENSION_PREFIXES = ["chrome-extension://", "moz-extension://"];
function containsExtensionUrl(str) {
  return EXTENSION_PREFIXES.some((prefix) => str.includes(prefix));
}
function isUnsupportedExtensionEnvironment(windowLocation, stack = "") {
  if (containsExtensionUrl(windowLocation)) {
    return false;
  }
  const frameLines = stack.split("\n").filter((line) => {
    const trimmedLine = line.trim();
    return trimmedLine.length && /^at\s+|@/.test(trimmedLine);
  });
  const target = frameLines[1] || "";
  return containsExtensionUrl(target);
}

// ../../node_modules/@datadog/browser-core/esm/domain/allowedTrackingOrigins.js
var ERROR_DOES_NOT_HAVE_ALLOWED_TRACKING_ORIGIN = "Running the Browser SDK in a Web extension content script is forbidden unless the `allowedTrackingOrigins` option is provided.";
var ERROR_NOT_ALLOWED_TRACKING_ORIGIN = "SDK initialized on a non-allowed domain.";
function isAllowedTrackingOrigins(configuration, errorStack) {
  const location2 = mockable(getGlobalObject().location);
  const windowOrigin = location2 ? location2.origin : "";
  const allowedTrackingOrigins = configuration.allowedTrackingOrigins;
  if (!allowedTrackingOrigins) {
    if (isUnsupportedExtensionEnvironment(windowOrigin, errorStack)) {
      display.error(ERROR_DOES_NOT_HAVE_ALLOWED_TRACKING_ORIGIN);
      return false;
    }
    return true;
  }
  const isAllowed = matchList(allowedTrackingOrigins, windowOrigin);
  if (!isAllowed) {
    display.error(ERROR_NOT_ALLOWED_TRACKING_ORIGIN);
  }
  return isAllowed;
}

// ../../node_modules/@datadog/browser-core/esm/domain/intakeSites.js
var INTAKE_SITE_STAGING = "datad0g.com";
var INTAKE_SITE_FED_STAGING = "dd0g-gov.com";
var INTAKE_SITE_US1 = "datadoghq.com";
var INTAKE_SITE_EU1 = "datadoghq.eu";
var INTAKE_SITE_US1_FED = "ddog-gov.com";
var PCI_INTAKE_HOST_US1 = "pci.browser-intake-datadoghq.com";
var INTAKE_URL_PARAMETERS = ["ddsource", "dd-api-key", "dd-request-id"];

// ../../node_modules/@datadog/browser-core/esm/domain/configuration/endpointBuilder.js
function createEndpointBuilder(initConfiguration, trackType, extraParameters) {
  const buildUrlWithParameters = createEndpointUrlWithParametersBuilder(initConfiguration, trackType);
  return {
    build(api, payload) {
      const parameters = buildEndpointParameters(initConfiguration, trackType, api, payload, extraParameters);
      return buildUrlWithParameters(parameters);
    },
    trackType
  };
}
function createEndpointUrlWithParametersBuilder(initConfiguration, trackType) {
  const path = `/api/v2/${trackType}`;
  const proxy = initConfiguration.proxy;
  if (typeof proxy === "string") {
    const normalizedProxyUrl = normalizeUrl(proxy);
    return (parameters) => `${normalizedProxyUrl}?ddforward=${encodeURIComponent(`${path}?${parameters}`)}`;
  }
  if (typeof proxy === "function") {
    return (parameters) => proxy({ path, parameters });
  }
  const host = buildEndpointHost(trackType, initConfiguration);
  return (parameters) => `https://${host}${path}?${parameters}`;
}
function buildEndpointHost(trackType, initConfiguration) {
  const { site = INTAKE_SITE_US1, internalAnalyticsSubdomain } = initConfiguration;
  if (trackType === "logs" && initConfiguration.usePciIntake && site === INTAKE_SITE_US1) {
    return PCI_INTAKE_HOST_US1;
  }
  if (internalAnalyticsSubdomain && site === INTAKE_SITE_US1) {
    return `${internalAnalyticsSubdomain}.${INTAKE_SITE_US1}`;
  }
  if (site === INTAKE_SITE_FED_STAGING) {
    return `http-intake.logs.${site}`;
  }
  const domainParts = site.split(".");
  const extension = domainParts.pop();
  return `browser-intake-${domainParts.join("-")}.${extension}`;
}
function buildEndpointParameters({ clientToken, internalAnalyticsSubdomain, source = "browser" }, trackType, api, { retry, encoding }, extraParameters = []) {
  const parameters = [
    `ddsource=${source}`,
    `dd-api-key=${clientToken}`,
    `dd-evp-origin-version=${encodeURIComponent("6.32.0")}`,
    "dd-evp-origin=browser",
    `dd-request-id=${generateUUID()}`
  ].concat(extraParameters);
  if (encoding) {
    parameters.push(`dd-evp-encoding=${encoding}`);
  }
  if (trackType === "rum") {
    parameters.push(`batch_time=${timeStampNow()}`, `_dd.api=${api}`);
    if (retry) {
      parameters.push(`_dd.retry_count=${retry.count}`, `_dd.retry_after=${retry.lastFailureStatus}`);
    }
  }
  if (internalAnalyticsSubdomain) {
    parameters.reverse();
  }
  return parameters.join("&");
}

// ../../node_modules/@datadog/browser-core/esm/domain/configuration/transportConfiguration.js
function computeTransportConfiguration(initConfiguration) {
  const site = initConfiguration.site || INTAKE_SITE_US1;
  const source = validateSource(initConfiguration.source);
  const endpointBuilders = computeEndpointBuilders({ ...initConfiguration, site, source });
  const replicaConfiguration = computeReplicaConfiguration({ ...initConfiguration, site, source });
  return {
    replica: replicaConfiguration,
    site,
    source,
    ...endpointBuilders
  };
}
function validateSource(source) {
  if (source === "flutter" || source === "unity") {
    return source;
  }
  return "browser";
}
function computeEndpointBuilders(initConfiguration) {
  return {
    logsEndpointBuilder: createEndpointBuilder(initConfiguration, "logs"),
    rumEndpointBuilder: createEndpointBuilder(initConfiguration, "rum"),
    profilingEndpointBuilder: createEndpointBuilder(initConfiguration, "profile"),
    sessionReplayEndpointBuilder: createEndpointBuilder(initConfiguration, "replay"),
    exposuresEndpointBuilder: createEndpointBuilder(initConfiguration, "exposures"),
    flagEvaluationEndpointBuilder: createEndpointBuilder(initConfiguration, "flagevaluation")
  };
}
function computeReplicaConfiguration(initConfiguration) {
  if (!initConfiguration.replica) {
    return;
  }
  const replicaConfiguration = {
    ...initConfiguration,
    site: INTAKE_SITE_US1,
    clientToken: initConfiguration.replica.clientToken
  };
  return {
    logsEndpointBuilder: createEndpointBuilder(replicaConfiguration, "logs"),
    rumEndpointBuilder: createEndpointBuilder(replicaConfiguration, "rum", [
      `application.id=${initConfiguration.replica.applicationId}`
    ])
  };
}
function isIntakeUrl(url) {
  return INTAKE_URL_PARAMETERS.every((param) => url.includes(param));
}

// ../../node_modules/@datadog/browser-core/esm/domain/configuration/configuration.js
var DefaultPrivacyLevel = {
  ALLOW: "allow",
  MASK: "mask",
  MASK_USER_INPUT: "mask-user-input",
  MASK_UNLESS_ALLOWLISTED: "mask-unless-allowlisted"
};
var TraceContextInjection = {
  ALL: "all",
  SAMPLED: "sampled"
};
function isString(tag, tagName) {
  if (tag !== void 0 && tag !== null && typeof tag !== "string") {
    display.error(`${tagName} must be defined as a string`);
    return false;
  }
  return true;
}
function isDatadogSite(site) {
  if (site && typeof site === "string" && !/(datadog|ddog|datad0g|dd0g)/.test(site)) {
    display.error(`Site should be a valid Datadog site. ${MORE_DETAILS} ${DOCS_ORIGIN}/getting_started/site/.`);
    return false;
  }
  return true;
}
function isSampleRate(sampleRate, name) {
  if (sampleRate !== void 0 && !isPercentage(sampleRate)) {
    display.error(`${name} Sample Rate should be a number between 0 and 100`);
    return false;
  }
  return true;
}
function validateAndBuildConfiguration(initConfiguration, errorStack) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
  if (!initConfiguration || !initConfiguration.clientToken) {
    display.error("Client Token is not configured, we will not send any data.");
    return;
  }
  if (initConfiguration.allowedTrackingOrigins !== void 0 && !Array.isArray(initConfiguration.allowedTrackingOrigins)) {
    display.error("Allowed Tracking Origins must be an array");
    return;
  }
  if (!isDatadogSite(initConfiguration.site) || !isSampleRate(initConfiguration.sessionSampleRate, "Session") || !isSampleRate(initConfiguration.telemetrySampleRate, "Telemetry") || !isSampleRate(initConfiguration.telemetryConfigurationSampleRate, "Telemetry Configuration") || !isSampleRate(initConfiguration.telemetryUsageSampleRate, "Telemetry Usage") || !isString(initConfiguration.version, "Version") || !isString(initConfiguration.env, "Env") || !isString(initConfiguration.service, "Service") || !isAllowedTrackingOrigins(initConfiguration, errorStack !== null && errorStack !== void 0 ? errorStack : "")) {
    return;
  }
  if (initConfiguration.trackingConsent !== void 0 && !objectHasValue(TrackingConsent, initConfiguration.trackingConsent)) {
    display.error('Tracking Consent should be either "granted" or "not-granted"');
    return;
  }
  return {
    beforeSend: initConfiguration.beforeSend && catchUserErrors(initConfiguration.beforeSend, "beforeSend threw an error:"),
    sessionStoreStrategyType: isWorkerEnvironment ? void 0 : selectSessionStoreStrategyType(initConfiguration),
    sessionSampleRate: (_a = initConfiguration.sessionSampleRate) !== null && _a !== void 0 ? _a : 100,
    telemetrySampleRate: (_b = initConfiguration.telemetrySampleRate) !== null && _b !== void 0 ? _b : 20,
    telemetryConfigurationSampleRate: (_c = initConfiguration.telemetryConfigurationSampleRate) !== null && _c !== void 0 ? _c : 5,
    telemetryUsageSampleRate: (_d = initConfiguration.telemetryUsageSampleRate) !== null && _d !== void 0 ? _d : 5,
    service: (_e = initConfiguration.service) !== null && _e !== void 0 ? _e : void 0,
    env: (_f = initConfiguration.env) !== null && _f !== void 0 ? _f : void 0,
    version: (_g = initConfiguration.version) !== null && _g !== void 0 ? _g : void 0,
    datacenter: (_h = initConfiguration.datacenter) !== null && _h !== void 0 ? _h : void 0,
    silentMultipleInit: !!initConfiguration.silentMultipleInit,
    allowUntrustedEvents: !!initConfiguration.allowUntrustedEvents,
    trackingConsent: (_j = initConfiguration.trackingConsent) !== null && _j !== void 0 ? _j : TrackingConsent.GRANTED,
    trackAnonymousUser: (_k = initConfiguration.trackAnonymousUser) !== null && _k !== void 0 ? _k : true,
    storeContextsAcrossPages: !!initConfiguration.storeContextsAcrossPages,
    betaEncodeCookieOptions: !!initConfiguration.betaEncodeCookieOptions,
    /**
     * The source of the SDK, used for support plugins purposes.
     */
    variant: initConfiguration.variant,
    sdkVersion: initConfiguration.sdkVersion,
    ...computeTransportConfiguration(initConfiguration)
  };
}
function serializeConfiguration(initConfiguration) {
  return {
    session_sample_rate: initConfiguration.sessionSampleRate,
    telemetry_sample_rate: initConfiguration.telemetrySampleRate,
    telemetry_configuration_sample_rate: initConfiguration.telemetryConfigurationSampleRate,
    telemetry_usage_sample_rate: initConfiguration.telemetryUsageSampleRate,
    use_before_send: !!initConfiguration.beforeSend,
    use_partitioned_cross_site_session_cookie: initConfiguration.usePartitionedCrossSiteSessionCookie,
    use_secure_session_cookie: initConfiguration.useSecureSessionCookie,
    use_proxy: !!initConfiguration.proxy,
    silent_multiple_init: initConfiguration.silentMultipleInit,
    track_session_across_subdomains: initConfiguration.trackSessionAcrossSubdomains,
    track_anonymous_user: initConfiguration.trackAnonymousUser,
    session_persistence: Array.isArray(initConfiguration.sessionPersistence) ? initConfiguration.sessionPersistence[0] : initConfiguration.sessionPersistence,
    allow_fallback_to_local_storage: !!initConfiguration.allowFallbackToLocalStorage,
    store_contexts_across_pages: !!initConfiguration.storeContextsAcrossPages,
    allow_untrusted_events: !!initConfiguration.allowUntrustedEvents,
    tracking_consent: initConfiguration.trackingConsent,
    use_allowed_tracking_origins: Array.isArray(initConfiguration.allowedTrackingOrigins),
    beta_encode_cookie_options: initConfiguration.betaEncodeCookieOptions,
    source: initConfiguration.source,
    sdk_version: initConfiguration.sdkVersion,
    variant: initConfiguration.variant
  };
}

// ../../node_modules/@datadog/browser-core/esm/boot/init.js
function makePublicApi(stub) {
  const publicApi = {
    version: "6.32.0",
    // This API method is intentionally not monitored, since the only thing executed is the
    // user-provided 'callback'.  All SDK usages executed in the callback should be monitored, and
    // we don't want to interfere with the user uncaught exceptions.
    onReady(callback) {
      callback();
    },
    ...stub
  };
  Object.defineProperty(publicApi, "_setDebug", {
    get() {
      return setDebugMode;
    },
    enumerable: false
  });
  return publicApi;
}
function defineGlobal(global, name, api) {
  const existingGlobalVariable = global[name];
  if (existingGlobalVariable && !existingGlobalVariable.q && existingGlobalVariable.version) {
    display.warn("SDK is loaded more than once. This is unsupported and might have unexpected behavior.");
  }
  global[name] = api;
  if (existingGlobalVariable && existingGlobalVariable.q) {
    existingGlobalVariable.q.forEach((fn) => catchUserErrors(fn, "onReady callback threw an error:")());
  }
}

// ../../node_modules/@datadog/browser-core/esm/browser/addEventListener.js
function addEventListener(configuration, eventTarget, eventName, listener, options) {
  return addEventListeners(configuration, eventTarget, [eventName], listener, options);
}
function addEventListeners(configuration, eventTarget, eventNames, listener, { once, capture, passive } = {}) {
  const listenerWithMonitor = monitor((event) => {
    if (!event.isTrusted && !event.__ddIsTrusted && !configuration.allowUntrustedEvents) {
      return;
    }
    if (once) {
      stop();
    }
    listener(event);
  });
  const options = passive ? { capture, passive } : capture;
  const listenerTarget = window.EventTarget && eventTarget instanceof EventTarget ? window.EventTarget.prototype : eventTarget;
  const add = getZoneJsOriginalValue(listenerTarget, "addEventListener");
  eventNames.forEach((eventName) => add.call(eventTarget, eventName, listenerWithMonitor, options));
  function stop() {
    const remove = getZoneJsOriginalValue(listenerTarget, "removeEventListener");
    eventNames.forEach((eventName) => remove.call(eventTarget, eventName, listenerWithMonitor, options));
  }
  return {
    stop
  };
}

// ../../node_modules/@datadog/browser-core/esm/browser/fetch.js
function fetch(input, init) {
  return getZoneJsOriginalValue(getGlobalObject(), "fetch")(input, init);
}

// ../../node_modules/@datadog/browser-core/esm/tools/utils/byteUtils.js
var ONE_KIBI_BYTE = 1024;
var ONE_MEBI_BYTE = 1024 * ONE_KIBI_BYTE;
var HAS_MULTI_BYTES_CHARACTERS = /[^\u0000-\u007F]/;
function computeBytesCount(candidate) {
  if (!HAS_MULTI_BYTES_CHARACTERS.test(candidate)) {
    return candidate.length;
  }
  if (window.TextEncoder !== void 0) {
    return new TextEncoder().encode(candidate).length;
  }
  return new Blob([candidate]).size;
}
function concatBuffers(buffers) {
  if (buffers.length === 1) {
    return buffers[0];
  }
  const length = buffers.reduce((total, buffer) => total + buffer.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
}

// ../../node_modules/@datadog/browser-core/esm/tools/utils/responseUtils.js
function isServerError(status) {
  return status >= 500;
}
function tryToClone(response) {
  try {
    return response.clone();
  } catch (_a) {
    return;
  }
}

// ../../node_modules/@datadog/browser-core/esm/domain/error/error.types.js
var ErrorSource = {
  AGENT: "agent",
  CONSOLE: "console",
  CUSTOM: "custom",
  LOGGER: "logger",
  NETWORK: "network",
  SOURCE: "source",
  REPORT: "report"
};

// ../../node_modules/@datadog/browser-core/esm/transport/sendWithRetryStrategy.js
var MAX_ONGOING_BYTES_COUNT = 80 * ONE_KIBI_BYTE;
var MAX_ONGOING_REQUESTS = 32;
var MAX_QUEUE_BYTES_COUNT = 20 * ONE_MEBI_BYTE;
var MAX_BACKOFF_TIME = ONE_MINUTE;
var INITIAL_BACKOFF_TIME = ONE_SECOND;
function sendWithRetryStrategy(payload, state, sendStrategy, trackType, reportError, requestObservable) {
  if (state.transportStatus === 0 && state.queuedPayloads.size() === 0 && state.bandwidthMonitor.canHandle(payload)) {
    send(payload, state, sendStrategy, requestObservable, {
      onSuccess: () => retryQueuedPayloads(0, state, sendStrategy, trackType, reportError, requestObservable),
      onFailure: () => {
        if (!state.queuedPayloads.enqueue(payload)) {
          requestObservable.notify({ type: "queue-full", bandwidth: state.bandwidthMonitor.stats(), payload });
        }
        scheduleRetry(state, sendStrategy, trackType, reportError, requestObservable);
      }
    });
  } else {
    if (!state.queuedPayloads.enqueue(payload)) {
      requestObservable.notify({ type: "queue-full", bandwidth: state.bandwidthMonitor.stats(), payload });
    }
  }
}
function scheduleRetry(state, sendStrategy, trackType, reportError, requestObservable) {
  if (state.transportStatus !== 2) {
    return;
  }
  setTimeout(() => {
    const payload = state.queuedPayloads.first();
    send(payload, state, sendStrategy, requestObservable, {
      onSuccess: () => {
        state.queuedPayloads.dequeue();
        state.currentBackoffTime = INITIAL_BACKOFF_TIME;
        retryQueuedPayloads(1, state, sendStrategy, trackType, reportError, requestObservable);
      },
      onFailure: () => {
        state.currentBackoffTime = Math.min(MAX_BACKOFF_TIME, state.currentBackoffTime * 2);
        scheduleRetry(state, sendStrategy, trackType, reportError, requestObservable);
      }
    });
  }, state.currentBackoffTime);
}
function send(payload, state, sendStrategy, requestObservable, { onSuccess, onFailure }) {
  state.bandwidthMonitor.add(payload);
  sendStrategy(payload, (response) => {
    state.bandwidthMonitor.remove(payload);
    if (!shouldRetryRequest(response)) {
      state.transportStatus = 0;
      requestObservable.notify({ type: "success", bandwidth: state.bandwidthMonitor.stats(), payload });
      onSuccess();
    } else {
      state.transportStatus = state.bandwidthMonitor.ongoingRequestCount > 0 ? 1 : 2;
      payload.retry = {
        count: payload.retry ? payload.retry.count + 1 : 1,
        lastFailureStatus: response.status
      };
      requestObservable.notify({ type: "failure", bandwidth: state.bandwidthMonitor.stats(), payload });
      onFailure();
    }
  });
}
function retryQueuedPayloads(reason, state, sendStrategy, trackType, reportError, requestObservable) {
  if (reason === 0 && state.queuedPayloads.isFull() && !state.queueFullReported) {
    reportError({
      message: `Reached max ${trackType} events size queued for upload: ${MAX_QUEUE_BYTES_COUNT / ONE_MEBI_BYTE}MiB`,
      source: ErrorSource.AGENT,
      startClocks: clocksNow()
    });
    state.queueFullReported = true;
  }
  const previousQueue = state.queuedPayloads;
  state.queuedPayloads = newPayloadQueue();
  while (previousQueue.size() > 0) {
    sendWithRetryStrategy(previousQueue.dequeue(), state, sendStrategy, trackType, reportError, requestObservable);
  }
}
function shouldRetryRequest(response) {
  return response.type !== "opaque" && (response.status === 0 && !navigator.onLine || response.status === 408 || response.status === 429 || isServerError(response.status));
}
function newRetryState() {
  return {
    transportStatus: 0,
    currentBackoffTime: INITIAL_BACKOFF_TIME,
    bandwidthMonitor: newBandwidthMonitor(),
    queuedPayloads: newPayloadQueue(),
    queueFullReported: false
  };
}
function newPayloadQueue() {
  const queue = [];
  return {
    bytesCount: 0,
    enqueue(payload) {
      if (this.isFull()) {
        return false;
      }
      queue.push(payload);
      this.bytesCount += payload.bytesCount;
      return true;
    },
    first() {
      return queue[0];
    },
    dequeue() {
      const payload = queue.shift();
      if (payload) {
        this.bytesCount -= payload.bytesCount;
      }
      return payload;
    },
    size() {
      return queue.length;
    },
    isFull() {
      return this.bytesCount >= MAX_QUEUE_BYTES_COUNT;
    }
  };
}
function newBandwidthMonitor() {
  return {
    ongoingRequestCount: 0,
    ongoingByteCount: 0,
    canHandle(payload) {
      return this.ongoingRequestCount === 0 || this.ongoingByteCount + payload.bytesCount <= MAX_ONGOING_BYTES_COUNT && this.ongoingRequestCount < MAX_ONGOING_REQUESTS;
    },
    add(payload) {
      this.ongoingRequestCount += 1;
      this.ongoingByteCount += payload.bytesCount;
    },
    remove(payload) {
      this.ongoingRequestCount -= 1;
      this.ongoingByteCount -= payload.bytesCount;
    },
    stats() {
      return {
        ongoingByteCount: this.ongoingByteCount,
        ongoingRequestCount: this.ongoingRequestCount
      };
    }
  };
}

// ../../node_modules/@datadog/browser-core/esm/transport/httpRequest.js
var RECOMMENDED_REQUEST_BYTES_LIMIT = 16 * ONE_KIBI_BYTE;
function createHttpRequest(endpointBuilders, reportError, bytesLimit = RECOMMENDED_REQUEST_BYTES_LIMIT) {
  const observable = new Observable();
  const retryState = newRetryState();
  return {
    observable,
    send: (payload) => {
      for (const endpointBuilder of endpointBuilders) {
        sendWithRetryStrategy(payload, retryState, (payload2, onResponse) => {
          fetchStrategy(endpointBuilder, payload2, onResponse);
        }, endpointBuilder.trackType, reportError, observable);
      }
    },
    /**
     * Since fetch keepalive behaves like regular fetch on Firefox,
     * keep using sendBeaconStrategy on exit
     */
    sendOnExit: (payload) => {
      for (const endpointBuilder of endpointBuilders) {
        sendBeaconStrategy(endpointBuilder, bytesLimit, payload);
      }
    }
  };
}
function sendBeaconStrategy(endpointBuilder, bytesLimit, payload) {
  const canUseBeacon = !!navigator.sendBeacon && payload.bytesCount < bytesLimit;
  if (canUseBeacon) {
    try {
      const beaconUrl = endpointBuilder.build("beacon", payload);
      const isQueued = navigator.sendBeacon(beaconUrl, payload.data);
      if (isQueued) {
        return;
      }
    } catch (e) {
      reportBeaconError(e);
    }
  }
  fetchStrategy(endpointBuilder, payload);
}
var hasReportedBeaconError = false;
function reportBeaconError(e) {
  if (!hasReportedBeaconError) {
    hasReportedBeaconError = true;
    monitorError(e);
  }
}
function fetchStrategy(endpointBuilder, payload, onResponse) {
  const fetchUrl = endpointBuilder.build("fetch", payload);
  fetch(fetchUrl, { method: "POST", body: payload.data, mode: "cors" }).then(monitor((response) => onResponse === null || onResponse === void 0 ? void 0 : onResponse({ status: response.status, type: response.type }))).catch(monitor(() => onResponse === null || onResponse === void 0 ? void 0 : onResponse({ status: 0 })));
}

// ../../node_modules/@datadog/browser-core/esm/transport/eventBridge.js
function getEventBridge() {
  const eventBridgeGlobal = getEventBridgeGlobal();
  if (!eventBridgeGlobal) {
    return;
  }
  return {
    getCapabilities() {
      var _a;
      return JSON.parse(((_a = eventBridgeGlobal.getCapabilities) === null || _a === void 0 ? void 0 : _a.call(eventBridgeGlobal)) || "[]");
    },
    getPrivacyLevel() {
      var _a;
      return (_a = eventBridgeGlobal.getPrivacyLevel) === null || _a === void 0 ? void 0 : _a.call(eventBridgeGlobal);
    },
    getAllowedWebViewHosts() {
      return JSON.parse(eventBridgeGlobal.getAllowedWebViewHosts());
    },
    send(eventType, event, viewId) {
      const view = viewId ? { id: viewId } : void 0;
      eventBridgeGlobal.send(JSON.stringify({ eventType, event, view }));
    }
  };
}
function bridgeSupports(capability) {
  const bridge = getEventBridge();
  return !!bridge && bridge.getCapabilities().includes(capability);
}
function canUseEventBridge(currentHost) {
  var _a;
  if (currentHost === void 0) {
    currentHost = (_a = getGlobalObject().location) === null || _a === void 0 ? void 0 : _a.hostname;
  }
  const bridge = getEventBridge();
  return !!bridge && bridge.getAllowedWebViewHosts().some((allowedHost) => currentHost === allowedHost || currentHost.endsWith(`.${allowedHost}`));
}
function getEventBridgeGlobal() {
  return getGlobalObject().DatadogEventBridge;
}

// ../../node_modules/@datadog/browser-core/esm/browser/pageMayExitObservable.js
var PageExitReason = {
  HIDDEN: "visibility_hidden",
  UNLOADING: "before_unload",
  PAGEHIDE: "page_hide",
  FROZEN: "page_frozen"
};
function createPageMayExitObservable(configuration) {
  return new Observable((observable) => {
    if (isWorkerEnvironment) {
      return;
    }
    const { stop: stopListeners } = addEventListeners(configuration, window, [
      "visibilitychange",
      "freeze"
      /* DOM_EVENT.FREEZE */
    ], (event) => {
      if (event.type === "visibilitychange" && document.visibilityState === "hidden") {
        observable.notify({ reason: PageExitReason.HIDDEN });
      } else if (event.type === "freeze") {
        observable.notify({ reason: PageExitReason.FROZEN });
      }
    }, { capture: true });
    const stopBeforeUnloadListener = addEventListener(configuration, window, "beforeunload", () => {
      observable.notify({ reason: PageExitReason.UNLOADING });
    }).stop;
    return () => {
      stopListeners();
      stopBeforeUnloadListener();
    };
  });
}
function isPageExitReason(reason) {
  return objectValues(PageExitReason).includes(reason);
}

// ../../node_modules/@datadog/browser-core/esm/tools/serialisation/jsonStringify.js
function jsonStringify(value, replacer, space) {
  if (typeof value !== "object" || value === null) {
    return JSON.stringify(value);
  }
  const restoreObjectPrototypeToJson = detachToJsonMethod(Object.prototype);
  const restoreArrayPrototypeToJson = detachToJsonMethod(Array.prototype);
  const restoreValuePrototypeToJson = detachToJsonMethod(Object.getPrototypeOf(value));
  const restoreValueToJson = detachToJsonMethod(value);
  try {
    return JSON.stringify(value, replacer, space);
  } catch (_a) {
    return "<error: unable to serialize object>";
  } finally {
    restoreObjectPrototypeToJson();
    restoreArrayPrototypeToJson();
    restoreValuePrototypeToJson();
    restoreValueToJson();
  }
}
function detachToJsonMethod(value) {
  const object = value;
  const objectToJson = object.toJSON;
  if (objectToJson) {
    delete object.toJSON;
    return () => {
      object.toJSON = objectToJson;
    };
  }
  return noop;
}

// ../../node_modules/@datadog/browser-core/esm/transport/batch.js
var MESSAGE_BYTES_LIMIT = 256 * ONE_KIBI_BYTE;
function createBatch({ encoder, request, flushController }) {
  let upsertBuffer = {};
  const flushSubscription = flushController.flushObservable.subscribe((event) => flush(event));
  function push(serializedMessage, estimatedMessageBytesCount, key) {
    flushController.notifyBeforeAddMessage(estimatedMessageBytesCount);
    if (key !== void 0) {
      upsertBuffer[key] = serializedMessage;
      flushController.notifyAfterAddMessage();
    } else {
      encoder.write(encoder.isEmpty ? serializedMessage : `
${serializedMessage}`, (realMessageBytesCount) => {
        flushController.notifyAfterAddMessage(realMessageBytesCount - estimatedMessageBytesCount);
      });
    }
  }
  function hasMessageFor(key) {
    return key !== void 0 && upsertBuffer[key] !== void 0;
  }
  function remove(key) {
    const removedMessage = upsertBuffer[key];
    delete upsertBuffer[key];
    const messageBytesCount = encoder.estimateEncodedBytesCount(removedMessage);
    flushController.notifyAfterRemoveMessage(messageBytesCount);
  }
  function addOrUpdate(message, key) {
    const serializedMessage = jsonStringify(message);
    const estimatedMessageBytesCount = encoder.estimateEncodedBytesCount(serializedMessage);
    if (estimatedMessageBytesCount >= MESSAGE_BYTES_LIMIT) {
      display.warn(`Discarded a message whose size was bigger than the maximum allowed size ${MESSAGE_BYTES_LIMIT / ONE_KIBI_BYTE}KiB. ${MORE_DETAILS} ${DOCS_TROUBLESHOOTING}/#technical-limitations`);
      return;
    }
    if (hasMessageFor(key)) {
      remove(key);
    }
    push(serializedMessage, estimatedMessageBytesCount, key);
  }
  function flush(event) {
    const upsertMessages = objectValues(upsertBuffer).join("\n");
    upsertBuffer = {};
    const pageMightExit = isPageExitReason(event.reason);
    const send2 = pageMightExit ? request.sendOnExit : request.send;
    if (pageMightExit && // Note: checking that the encoder is async is not strictly needed, but it's an optimization:
    // if the encoder is async we need to send two requests in some cases (one for encoded data
    // and the other for non-encoded data). But if it's not async, we don't have to worry about
    // it and always send a single request.
    encoder.isAsync) {
      const encoderResult = encoder.finishSync();
      if (encoderResult.outputBytesCount) {
        send2(formatPayloadFromEncoder(encoderResult));
      }
      const pendingMessages = [encoderResult.pendingData, upsertMessages].filter(Boolean).join("\n");
      if (pendingMessages) {
        send2({
          data: pendingMessages,
          bytesCount: computeBytesCount(pendingMessages)
        });
      }
    } else {
      if (upsertMessages) {
        encoder.write(encoder.isEmpty ? upsertMessages : `
${upsertMessages}`);
      }
      encoder.finish((encoderResult) => {
        send2(formatPayloadFromEncoder(encoderResult));
      });
    }
  }
  return {
    flushController,
    add: addOrUpdate,
    upsert: addOrUpdate,
    stop: flushSubscription.unsubscribe
  };
}
function formatPayloadFromEncoder(encoderResult) {
  let data;
  if (typeof encoderResult.output === "string") {
    data = encoderResult.output;
  } else {
    data = new Blob([encoderResult.output], {
      // This will set the 'Content-Type: text/plain' header. Reasoning:
      // * The intake rejects the request if there is no content type.
      // * The browser will issue CORS preflight requests if we set it to 'application/json', which
      // could induce higher intake load (and maybe has other impacts).
      // * Also it's not quite JSON, since we are concatenating multiple JSON objects separated by
      // new lines.
      type: "text/plain"
    });
  }
  return {
    data,
    bytesCount: encoderResult.outputBytesCount,
    encoding: encoderResult.encoding
  };
}

// ../../node_modules/@datadog/browser-core/esm/transport/flushController.js
var FLUSH_DURATION_LIMIT = 30 * ONE_SECOND;
var MESSAGES_LIMIT = isWorkerEnvironment ? 1 : 50;
function createFlushController({ pageMayExitObservable, sessionExpireObservable }) {
  const pageMayExitSubscription = pageMayExitObservable.subscribe((event) => flush(event.reason));
  const sessionExpireSubscription = sessionExpireObservable.subscribe(() => flush("session_expire"));
  const flushObservable = new Observable(() => () => {
    pageMayExitSubscription.unsubscribe();
    sessionExpireSubscription.unsubscribe();
  });
  let currentBytesCount = 0;
  let currentMessagesCount = 0;
  function flush(flushReason) {
    if (currentMessagesCount === 0) {
      return;
    }
    const messagesCount = currentMessagesCount;
    const bytesCount = currentBytesCount;
    currentMessagesCount = 0;
    currentBytesCount = 0;
    cancelDurationLimitTimeout();
    flushObservable.notify({
      reason: flushReason,
      messagesCount,
      bytesCount
    });
  }
  let durationLimitTimeoutId;
  function scheduleDurationLimitTimeout() {
    if (durationLimitTimeoutId === void 0) {
      durationLimitTimeoutId = setTimeout(() => {
        flush("duration_limit");
      }, FLUSH_DURATION_LIMIT);
    }
  }
  function cancelDurationLimitTimeout() {
    clearTimeout(durationLimitTimeoutId);
    durationLimitTimeoutId = void 0;
  }
  return {
    flushObservable,
    get messagesCount() {
      return currentMessagesCount;
    },
    /**
     * Notifies that a message will be added to a pool of pending messages waiting to be flushed.
     *
     * This function needs to be called synchronously, right before adding the message, so no flush
     * event can happen after `notifyBeforeAddMessage` and before adding the message.
     *
     * @param estimatedMessageBytesCount - an estimation of the message bytes count once it is
     * actually added.
     */
    notifyBeforeAddMessage(estimatedMessageBytesCount) {
      if (currentBytesCount + estimatedMessageBytesCount >= RECOMMENDED_REQUEST_BYTES_LIMIT) {
        flush("bytes_limit");
      }
      currentMessagesCount += 1;
      currentBytesCount += estimatedMessageBytesCount;
      scheduleDurationLimitTimeout();
    },
    /**
     * Notifies that a message *was* added to a pool of pending messages waiting to be flushed.
     *
     * This function can be called asynchronously after the message was added, but in this case it
     * should not be called if a flush event occurred in between.
     *
     * @param messageBytesCountDiff - the difference between the estimated message bytes count and
     * its actual bytes count once added to the pool.
     */
    notifyAfterAddMessage(messageBytesCountDiff = 0) {
      currentBytesCount += messageBytesCountDiff;
      if (currentMessagesCount >= MESSAGES_LIMIT) {
        flush("messages_limit");
      } else if (currentBytesCount >= RECOMMENDED_REQUEST_BYTES_LIMIT) {
        flush("bytes_limit");
      }
    },
    /**
     * Notifies that a message was removed from a pool of pending messages waiting to be flushed.
     *
     * This function needs to be called synchronously, right after removing the message, so no flush
     * event can happen after removing the message and before `notifyAfterRemoveMessage`.
     *
     * @param messageBytesCount - the message bytes count that was added to the pool. Should
     * correspond to the sum of bytes counts passed to `notifyBeforeAddMessage` and
     * `notifyAfterAddMessage`.
     */
    notifyAfterRemoveMessage(messageBytesCount) {
      currentBytesCount -= messageBytesCount;
      currentMessagesCount -= 1;
      if (currentMessagesCount === 0) {
        cancelDurationLimitTimeout();
      }
    }
  };
}

// ../../node_modules/@datadog/browser-core/esm/tools/serialisation/sanitize.js
var SANITIZE_DEFAULT_MAX_CHARACTER_COUNT = 220 * ONE_KIBI_BYTE;
var JSON_PATH_ROOT_ELEMENT = "$";
var KEY_DECORATION_LENGTH = 3;
function sanitize(source, maxCharacterCount = SANITIZE_DEFAULT_MAX_CHARACTER_COUNT) {
  const restoreObjectPrototypeToJson = detachToJsonMethod(Object.prototype);
  const restoreArrayPrototypeToJson = detachToJsonMethod(Array.prototype);
  const containerQueue = [];
  const visitedObjectsWithPath = /* @__PURE__ */ new WeakMap();
  const sanitizedData = sanitizeProcessor(source, JSON_PATH_ROOT_ELEMENT, void 0, containerQueue, visitedObjectsWithPath);
  const serializedSanitizedData = JSON.stringify(sanitizedData);
  let accumulatedCharacterCount = serializedSanitizedData ? serializedSanitizedData.length : 0;
  if (accumulatedCharacterCount > maxCharacterCount) {
    warnOverCharacterLimit(maxCharacterCount, "discarded", source);
    return void 0;
  }
  while (containerQueue.length > 0 && accumulatedCharacterCount < maxCharacterCount) {
    const containerToProcess = containerQueue.shift();
    let separatorLength = 0;
    if (Array.isArray(containerToProcess.source)) {
      for (let key = 0; key < containerToProcess.source.length; key++) {
        const targetData = sanitizeProcessor(containerToProcess.source[key], containerToProcess.path, key, containerQueue, visitedObjectsWithPath);
        if (targetData !== void 0) {
          accumulatedCharacterCount += JSON.stringify(targetData).length;
        } else {
          accumulatedCharacterCount += 4;
        }
        accumulatedCharacterCount += separatorLength;
        separatorLength = 1;
        if (accumulatedCharacterCount > maxCharacterCount) {
          warnOverCharacterLimit(maxCharacterCount, "truncated", source);
          break;
        }
        ;
        containerToProcess.target[key] = targetData;
      }
    } else {
      for (const key in containerToProcess.source) {
        if (Object.prototype.hasOwnProperty.call(containerToProcess.source, key)) {
          const targetData = sanitizeProcessor(containerToProcess.source[key], containerToProcess.path, key, containerQueue, visitedObjectsWithPath);
          if (targetData !== void 0) {
            accumulatedCharacterCount += JSON.stringify(targetData).length + separatorLength + key.length + KEY_DECORATION_LENGTH;
            separatorLength = 1;
          }
          if (accumulatedCharacterCount > maxCharacterCount) {
            warnOverCharacterLimit(maxCharacterCount, "truncated", source);
            break;
          }
          ;
          containerToProcess.target[key] = targetData;
        }
      }
    }
  }
  restoreObjectPrototypeToJson();
  restoreArrayPrototypeToJson();
  return sanitizedData;
}
function sanitizeProcessor(source, parentPath, key, queue, visitedObjectsWithPath) {
  const sourceToSanitize = tryToApplyToJSON(source);
  if (!sourceToSanitize || typeof sourceToSanitize !== "object") {
    return sanitizePrimitivesAndFunctions(sourceToSanitize);
  }
  const sanitizedSource = sanitizeObjects(sourceToSanitize);
  if (sanitizedSource !== "[Object]" && sanitizedSource !== "[Array]" && sanitizedSource !== "[Error]") {
    return sanitizedSource;
  }
  const sourceAsObject = source;
  if (visitedObjectsWithPath.has(sourceAsObject)) {
    return `[Reference seen at ${visitedObjectsWithPath.get(sourceAsObject)}]`;
  }
  const currentPath = key !== void 0 ? `${parentPath}.${key}` : parentPath;
  const target = Array.isArray(sourceToSanitize) ? [] : {};
  visitedObjectsWithPath.set(sourceAsObject, currentPath);
  queue.push({ source: sourceToSanitize, target, path: currentPath });
  return target;
}
function sanitizePrimitivesAndFunctions(value) {
  if (typeof value === "bigint") {
    return `[BigInt] ${value.toString()}`;
  }
  if (typeof value === "function") {
    return `[Function] ${value.name || "unknown"}`;
  }
  if (typeof value === "symbol") {
    return `[Symbol] ${value.description || value.toString()}`;
  }
  return value;
}
function sanitizeObjects(value) {
  try {
    if (value instanceof Event) {
      return sanitizeEvent(value);
    }
    if (value instanceof RegExp) {
      return `[RegExp] ${value.toString()}`;
    }
    const result = Object.prototype.toString.call(value);
    const match = result.match(/\[object (.*)\]/);
    if (match && match[1]) {
      return `[${match[1]}]`;
    }
  } catch (_a) {
  }
  return "[Unserializable]";
}
function sanitizeEvent(event) {
  return {
    type: event.type,
    isTrusted: event.isTrusted,
    currentTarget: event.currentTarget ? sanitizeObjects(event.currentTarget) : null,
    target: event.target ? sanitizeObjects(event.target) : null
  };
}
function tryToApplyToJSON(value) {
  const object = value;
  if (object && typeof object.toJSON === "function") {
    try {
      return object.toJSON();
    } catch (_a) {
    }
  }
  return value;
}
function warnOverCharacterLimit(maxCharacterCount, changeType, source) {
  display.warn(`The data provided has been ${changeType} as it is over the limit of ${maxCharacterCount} characters:`, source);
}

// ../../node_modules/@datadog/browser-core/esm/tools/stackTrace/computeStackTrace.js
var UNKNOWN_FUNCTION = "?";
function computeStackTrace(ex) {
  var _a, _b;
  const stack = [];
  let stackProperty = tryToGetString(ex, "stack");
  const exString = String(ex);
  if (stackProperty && stackProperty.startsWith(exString)) {
    stackProperty = stackProperty.slice(exString.length);
  }
  if (stackProperty) {
    stackProperty.split("\n").forEach((line) => {
      const stackFrame = parseChromeLine(line) || parseChromeAnonymousLine(line) || parseWinLine(line) || parseGeckoLine(line);
      if (stackFrame) {
        if (!stackFrame.func && stackFrame.line) {
          stackFrame.func = UNKNOWN_FUNCTION;
        }
        stack.push(stackFrame);
      }
    });
  }
  if (stack.length > 0 && isWronglyReportingCustomErrors() && ex instanceof Error) {
    const constructors = [];
    let currentPrototype = ex;
    while ((currentPrototype = Object.getPrototypeOf(currentPrototype)) && isNonNativeClassPrototype(currentPrototype)) {
      const constructorName = ((_a = currentPrototype.constructor) === null || _a === void 0 ? void 0 : _a.name) || UNKNOWN_FUNCTION;
      constructors.push(constructorName);
    }
    for (let i = constructors.length - 1; i >= 0 && ((_b = stack[0]) === null || _b === void 0 ? void 0 : _b.func) === constructors[i]; i--) {
      stack.shift();
    }
  }
  return {
    message: tryToGetString(ex, "message"),
    name: tryToGetString(ex, "name"),
    stack
  };
}
var fileUrl = "((?:file|https?|blob|chrome-extension|electron|native|eval|webpack|snippet|<anonymous>|\\w+\\.|\\/).*?)";
var filePosition = "(?::(\\d+))";
var CHROME_LINE_RE = new RegExp(`^\\s*at (.*?) ?\\(${fileUrl}${filePosition}?${filePosition}?\\)?\\s*$`, "i");
var CHROME_EVAL_RE = new RegExp(`\\((\\S*)${filePosition}${filePosition}\\)`);
function parseChromeLine(line) {
  const parts = CHROME_LINE_RE.exec(line);
  if (!parts) {
    return;
  }
  const isNative = parts[2] && parts[2].indexOf("native") === 0;
  const isEval = parts[2] && parts[2].indexOf("eval") === 0;
  const submatch = CHROME_EVAL_RE.exec(parts[2]);
  if (isEval && submatch) {
    parts[2] = submatch[1];
    parts[3] = submatch[2];
    parts[4] = submatch[3];
  }
  return {
    args: isNative ? [parts[2]] : [],
    column: parts[4] ? +parts[4] : void 0,
    func: parts[1] || UNKNOWN_FUNCTION,
    line: parts[3] ? +parts[3] : void 0,
    url: !isNative ? parts[2] : void 0
  };
}
var htmlAnonymousPart = "(?:(.*)?(?: @))";
var CHROME_ANONYMOUS_FUNCTION_RE = new RegExp(`^\\s*at\\s*${htmlAnonymousPart}?\\s*${fileUrl}${filePosition}?${filePosition}??\\s*$`, "i");
function parseChromeAnonymousLine(line) {
  const parts = CHROME_ANONYMOUS_FUNCTION_RE.exec(line);
  if (!parts) {
    return;
  }
  return {
    args: [],
    column: parts[4] ? +parts[4] : void 0,
    func: parts[1] || UNKNOWN_FUNCTION,
    line: parts[3] ? +parts[3] : void 0,
    url: parts[2]
  };
}
var WINJS_LINE_RE = /^\s*at (?:((?:\[object object\])?.+) )?\(?((?:file|ms-appx|https?|webpack|blob):.*?):(\d+)(?::(\d+))?\)?\s*$/i;
function parseWinLine(line) {
  const parts = WINJS_LINE_RE.exec(line);
  if (!parts) {
    return;
  }
  return {
    args: [],
    column: parts[4] ? +parts[4] : void 0,
    func: parts[1] || UNKNOWN_FUNCTION,
    line: +parts[3],
    url: parts[2]
  };
}
var GECKO_LINE_RE = /^\s*(.*?)(?:\((.*?)\))?(?:(?:(?:^|@)((?:file|https?|blob|chrome|webpack|resource|capacitor|\[native).*?|[^@]*bundle|\[wasm code\])(?::(\d+))?(?::(\d+))?)|@)\s*$/i;
var GECKO_EVAL_RE = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
function parseGeckoLine(line) {
  const parts = GECKO_LINE_RE.exec(line);
  if (!parts) {
    return;
  }
  const isEval = parts[3] && parts[3].indexOf(" > eval") > -1;
  const submatch = GECKO_EVAL_RE.exec(parts[3]);
  if (isEval && submatch) {
    parts[3] = submatch[1];
    parts[4] = submatch[2];
    parts[5] = void 0;
  }
  return {
    args: parts[2] ? parts[2].split(",") : [],
    column: parts[5] ? +parts[5] : void 0,
    func: parts[1] || UNKNOWN_FUNCTION,
    line: parts[4] ? +parts[4] : void 0,
    url: parts[3]
  };
}
function tryToGetString(candidate, property) {
  return isIndexableObject(candidate) && typeof candidate[property] === "string" ? candidate[property] : void 0;
}
function computeStackTraceFromOnErrorMessage(messageObj, url, line, column) {
  if (url === void 0) {
    return;
  }
  const { name, message } = tryToParseMessage(messageObj);
  return {
    name,
    message,
    stack: [{ url, column, line }]
  };
}
var ERROR_TYPES_RE = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?([\s\S]*)$/;
function tryToParseMessage(messageObj) {
  let name;
  let message;
  if ({}.toString.call(messageObj) === "[object String]") {
    ;
    [, name, message] = ERROR_TYPES_RE.exec(messageObj);
  }
  return { name, message };
}
function isNonNativeClassPrototype(prototype) {
  return String(prototype.constructor).startsWith("class ");
}
var isWronglyReportingCustomErrorsCache;
function isWronglyReportingCustomErrors() {
  if (isWronglyReportingCustomErrorsCache !== void 0) {
    return isWronglyReportingCustomErrorsCache;
  }
  class DatadogTestCustomError extends Error {
    constructor() {
      super();
      this.name = "Error";
    }
  }
  const [customError, nativeError] = [DatadogTestCustomError, Error].map((errConstructor) => new errConstructor());
  isWronglyReportingCustomErrorsCache = // If customError is not a class, it means that this was built with ES5 as target, converting the class to a normal object.
  // Thus, error constructors will be reported on all browsers, which is the expected behavior.
  isNonNativeClassPrototype(Object.getPrototypeOf(customError)) && // If the browser is correctly reporting the stacktrace, the normal error stacktrace should be the same as the custom error stacktrace
  nativeError.stack !== customError.stack;
  return isWronglyReportingCustomErrorsCache;
}

// ../../node_modules/@datadog/browser-core/esm/tools/stackTrace/handlingStack.js
function createHandlingStack(type) {
  const internalFramesToSkip = 2;
  const error = new Error(type);
  error.name = "HandlingStack";
  let formattedStack;
  callMonitored(() => {
    const stackTrace = computeStackTrace(error);
    stackTrace.stack = stackTrace.stack.slice(internalFramesToSkip);
    formattedStack = toStackTraceString(stackTrace);
  });
  return formattedStack;
}
function toStackTraceString(stack) {
  let result = formatErrorMessage(stack);
  stack.stack.forEach((frame) => {
    const func = frame.func === "?" ? "<anonymous>" : frame.func;
    const args = frame.args && frame.args.length > 0 ? `(${frame.args.join(", ")})` : "";
    const line = frame.line ? `:${frame.line}` : "";
    const column = frame.line && frame.column ? `:${frame.column}` : "";
    result += `
  at ${func}${args} @ ${frame.url}${line}${column}`;
  });
  return result;
}
function formatErrorMessage(stack) {
  return `${stack.name || "Error"}: ${stack.message}`;
}

// ../../node_modules/@datadog/browser-core/esm/domain/error/error.js
var NO_ERROR_STACK_PRESENT_MESSAGE = "No stack, consider using an instance of Error";
function computeErrorBase({ originalError, stackTrace, source, useFallbackStack = true, nonErrorPrefix }) {
  const isErrorInstance = isError(originalError);
  if (!stackTrace && isErrorInstance) {
    stackTrace = computeStackTrace(originalError);
  }
  return {
    source,
    type: stackTrace ? stackTrace.name : void 0,
    message: computeMessage(stackTrace, isErrorInstance, nonErrorPrefix, originalError),
    stack: stackTrace ? toStackTraceString(stackTrace) : useFallbackStack ? NO_ERROR_STACK_PRESENT_MESSAGE : void 0
  };
}
function computeRawError({ stackTrace, originalError, handlingStack, componentStack, startClocks, nonErrorPrefix, useFallbackStack = true, source, handling }) {
  const errorBase = computeErrorBase({ originalError, stackTrace, source, useFallbackStack, nonErrorPrefix });
  return {
    startClocks,
    handling,
    handlingStack,
    componentStack,
    originalError,
    ...errorBase,
    causes: isError(originalError) ? flattenErrorCauses(originalError, source) : void 0,
    fingerprint: tryToGetFingerprint(originalError),
    context: tryToGetErrorContext(originalError)
  };
}
function computeMessage(stackTrace, isErrorInstance, nonErrorPrefix, originalError) {
  return (stackTrace === null || stackTrace === void 0 ? void 0 : stackTrace.message) && (stackTrace === null || stackTrace === void 0 ? void 0 : stackTrace.name) ? stackTrace.message : !isErrorInstance ? nonErrorPrefix ? `${nonErrorPrefix} ${jsonStringify(sanitize(originalError))}` : jsonStringify(sanitize(originalError)) : "Empty message";
}
function tryToGetFingerprint(originalError) {
  return isError(originalError) && "dd_fingerprint" in originalError ? String(originalError.dd_fingerprint) : void 0;
}
function tryToGetErrorContext(originalError) {
  if (isIndexableObject(originalError)) {
    return originalError.dd_context;
  }
}
function isError(error) {
  return error instanceof Error || Object.prototype.toString.call(error) === "[object Error]";
}
function flattenErrorCauses(error, parentSource) {
  const causes = [];
  let currentCause = error.cause;
  while (currentCause !== void 0 && currentCause !== null && causes.length < 10) {
    const causeBase = computeErrorBase({
      originalError: currentCause,
      source: parentSource,
      useFallbackStack: false
    });
    causes.push(causeBase);
    currentCause = isError(currentCause) ? currentCause.cause : void 0;
  }
  return causes.length ? causes : void 0;
}

// ../../node_modules/@datadog/browser-core/esm/tools/experimentalFeatures.js
var ExperimentalFeature;
(function(ExperimentalFeature2) {
  ExperimentalFeature2["TRACK_INTAKE_REQUESTS"] = "track_intake_requests";
  ExperimentalFeature2["USE_TREE_WALKER_FOR_ACTION_NAME"] = "use_tree_walker_for_action_name";
  ExperimentalFeature2["FEATURE_OPERATION_VITAL"] = "feature_operation_vital";
  ExperimentalFeature2["SHORT_SESSION_INVESTIGATION"] = "short_session_investigation";
  ExperimentalFeature2["START_STOP_ACTION"] = "start_stop_action";
  ExperimentalFeature2["START_STOP_RESOURCE"] = "start_stop_resource";
  ExperimentalFeature2["USE_CHANGE_RECORDS"] = "use_change_records";
  ExperimentalFeature2["USE_INCREMENTAL_CHANGE_RECORDS"] = "use_incremental_change_records";
  ExperimentalFeature2["INP_SUBPARTS"] = "inp_subparts";
  ExperimentalFeature2["TOO_MANY_REQUESTS_INVESTIGATION"] = "too_many_requests_investigation";
  ExperimentalFeature2["COMPOSED_PATH_SELECTOR"] = "composed_path_selector";
})(ExperimentalFeature || (ExperimentalFeature = {}));
var enabledExperimentalFeatures = /* @__PURE__ */ new Set();
function initFeatureFlags(enableExperimentalFeatures) {
  if (Array.isArray(enableExperimentalFeatures)) {
    addExperimentalFeatures(enableExperimentalFeatures.filter((flag) => objectHasValue(ExperimentalFeature, flag)));
  }
}
function addExperimentalFeatures(enabledFeatures) {
  enabledFeatures.forEach((flag) => {
    enabledExperimentalFeatures.add(flag);
  });
}
function isExperimentalFeatureEnabled(featureName) {
  return enabledExperimentalFeatures.has(featureName);
}
function getExperimentalFeatures() {
  return enabledExperimentalFeatures;
}

// ../../node_modules/@datadog/browser-core/esm/domain/tags.js
var TAG_SIZE_LIMIT = 200;
function buildTags(configuration) {
  const { env, service, version, datacenter, sdkVersion, variant } = configuration;
  const tags = [buildTag("sdk_version", sdkVersion !== null && sdkVersion !== void 0 ? sdkVersion : "6.32.0")];
  if (env) {
    tags.push(buildTag("env", env));
  }
  if (service) {
    tags.push(buildTag("service", service));
  }
  if (version) {
    tags.push(buildTag("version", version));
  }
  if (datacenter) {
    tags.push(buildTag("datacenter", datacenter));
  }
  if (variant) {
    tags.push(buildTag("variant", variant));
  }
  return tags;
}
function buildTag(key, rawValue) {
  const tag = rawValue ? `${key}:${rawValue}` : key;
  if (tag.length > TAG_SIZE_LIMIT || hasForbiddenCharacters(tag)) {
    display.warn(`Tag ${tag} doesn't meet tag requirements and will be sanitized. ${MORE_DETAILS} ${DOCS_ORIGIN}/getting_started/tagging/#defining-tags`);
  }
  return sanitizeTag(tag);
}
function sanitizeTag(tag) {
  return tag.replace(/,/g, "_");
}
function hasForbiddenCharacters(rawValue) {
  if (!supportUnicodePropertyEscapes()) {
    return false;
  }
  return new RegExp("[^\\p{Ll}\\p{Lo}0-9_:./-]", "u").test(rawValue);
}
function supportUnicodePropertyEscapes() {
  try {
    new RegExp("[\\p{Ll}]", "u");
    return true;
  } catch (_a) {
    return false;
  }
}

// ../../node_modules/@datadog/browser-core/esm/tools/sendToExtension.js
function sendToExtension(type, payload) {
  const callback = globalObject.__ddBrowserSdkExtensionCallback;
  if (callback) {
    callback({ type, payload });
  }
}

// ../../node_modules/@datadog/browser-core/esm/tools/mergeInto.js
function mergeInto(destination, source, circularReferenceChecker = createCircularReferenceChecker()) {
  if (source === void 0) {
    return destination;
  }
  if (typeof source !== "object" || source === null) {
    return source;
  } else if (source instanceof Date) {
    return new Date(source.getTime());
  } else if (source instanceof RegExp) {
    const flags = source.flags || // old browsers compatibility
    [
      source.global ? "g" : "",
      source.ignoreCase ? "i" : "",
      source.multiline ? "m" : "",
      source.sticky ? "y" : "",
      source.unicode ? "u" : ""
    ].join("");
    return new RegExp(source.source, flags);
  }
  if (circularReferenceChecker.hasAlreadyBeenSeen(source)) {
    return void 0;
  } else if (Array.isArray(source)) {
    const merged2 = Array.isArray(destination) ? destination : [];
    for (let i = 0; i < source.length; ++i) {
      merged2[i] = mergeInto(merged2[i], source[i], circularReferenceChecker);
    }
    return merged2;
  }
  const merged = getType(destination) === "object" ? destination : {};
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      merged[key] = mergeInto(merged[key], source[key], circularReferenceChecker);
    }
  }
  return merged;
}
function deepClone(value) {
  return mergeInto(void 0, value);
}
function combine(...sources) {
  let destination;
  for (const source of sources) {
    if (source === void 0 || source === null) {
      continue;
    }
    destination = mergeInto(destination, source);
  }
  return destination;
}
function createCircularReferenceChecker() {
  if (typeof WeakSet !== "undefined") {
    const set = /* @__PURE__ */ new WeakSet();
    return {
      hasAlreadyBeenSeen(value) {
        const has = set.has(value);
        if (!has) {
          set.add(value);
        }
        return has;
      }
    };
  }
  const array = [];
  return {
    hasAlreadyBeenSeen(value) {
      const has = array.indexOf(value) >= 0;
      if (!has) {
        array.push(value);
      }
      return has;
    }
  };
}

// ../../node_modules/@datadog/browser-core/esm/domain/connectivity/connectivity.js
function getConnectivity() {
  var _a;
  const navigator2 = globalObject.navigator;
  return {
    status: navigator2.onLine ? "connected" : "not_connected",
    interfaces: navigator2.connection && navigator2.connection.type ? [navigator2.connection.type] : void 0,
    effective_type: (_a = navigator2.connection) === null || _a === void 0 ? void 0 : _a.effectiveType
  };
}

// ../../node_modules/@datadog/browser-core/esm/tools/encoder.js
function createIdentityEncoder() {
  let output = "";
  let outputBytesCount = 0;
  return {
    isAsync: false,
    get isEmpty() {
      return !output;
    },
    write(data, callback) {
      const additionalEncodedBytesCount = computeBytesCount(data);
      outputBytesCount += additionalEncodedBytesCount;
      output += data;
      if (callback) {
        callback(additionalEncodedBytesCount);
      }
    },
    finish(callback) {
      callback(this.finishSync());
    },
    finishSync() {
      const result = {
        output,
        outputBytesCount,
        rawBytesCount: outputBytesCount,
        pendingData: ""
      };
      output = "";
      outputBytesCount = 0;
      return result;
    },
    estimateEncodedBytesCount(data) {
      return data.length;
    }
  };
}

// ../../node_modules/@datadog/browser-core/esm/tools/abstractHooks.js
var DISCARDED = "DISCARDED";
var SKIPPED = "SKIPPED";
function abstractHooks() {
  const callbacks = {};
  return {
    register(hookName, callback) {
      if (!callbacks[hookName]) {
        callbacks[hookName] = [];
      }
      callbacks[hookName].push(callback);
      return {
        unregister: () => {
          callbacks[hookName] = callbacks[hookName].filter((cb) => cb !== callback);
        }
      };
    },
    triggerHook(hookName, param) {
      const hookCallbacks = callbacks[hookName] || [];
      const results = [];
      for (const callback of hookCallbacks) {
        const result = callback(param);
        if (result === DISCARDED) {
          return DISCARDED;
        }
        if (result === SKIPPED) {
          continue;
        }
        results.push(result);
      }
      return combine(...results);
    }
  };
}

// ../../node_modules/@datadog/browser-core/esm/domain/telemetry/rawTelemetryEvent.types.js
var TelemetryType = {
  LOG: "log",
  CONFIGURATION: "configuration",
  USAGE: "usage"
};

// ../../node_modules/@datadog/browser-core/esm/domain/telemetry/telemetry.js
var ALLOWED_FRAME_URLS = [
  "https://www.datadoghq-browser-agent.com",
  "https://www.datad0g-browser-agent.com",
  "https://d3uc069fcn7uxw.cloudfront.net",
  "https://d20xtzwzcl0ceb.cloudfront.net",
  "http://localhost",
  "<anonymous>"
];
var METRIC_SAMPLE_RATE = 1;
var TELEMETRY_EXCLUDED_SITES = [INTAKE_SITE_US1_FED];
var MAX_TELEMETRY_EVENTS_PER_PAGE = 15;
var telemetryObservable;
function getTelemetryObservable() {
  if (!telemetryObservable) {
    telemetryObservable = new BufferedObservable(100);
  }
  return telemetryObservable;
}
function startTelemetry(telemetryService, configuration, hooks) {
  const observable = new Observable();
  const { enabled, metricsEnabled } = startTelemetryCollection(telemetryService, configuration, hooks, observable);
  const { stop } = startTelemetryTransport(configuration, observable);
  return {
    stop,
    enabled,
    metricsEnabled
  };
}
function startTelemetryCollection(telemetryService, configuration, hooks, observable, metricSampleRate = METRIC_SAMPLE_RATE, maxTelemetryEventsPerPage = MAX_TELEMETRY_EVENTS_PER_PAGE) {
  const alreadySentEventsByKind = {};
  const telemetryEnabled = !TELEMETRY_EXCLUDED_SITES.includes(configuration.site) && performDraw(configuration.telemetrySampleRate);
  const telemetryEnabledPerType = {
    [TelemetryType.LOG]: telemetryEnabled,
    [TelemetryType.CONFIGURATION]: telemetryEnabled && performDraw(configuration.telemetryConfigurationSampleRate),
    [TelemetryType.USAGE]: telemetryEnabled && performDraw(configuration.telemetryUsageSampleRate),
    // not an actual "type" but using a single draw for all metrics
    metric: telemetryEnabled && performDraw(metricSampleRate)
  };
  const runtimeEnvInfo = getRuntimeEnvInfo();
  const telemetryObservable2 = getTelemetryObservable();
  telemetryObservable2.subscribe(({ rawEvent, metricName }) => {
    if (metricName && !telemetryEnabledPerType["metric"] || !telemetryEnabledPerType[rawEvent.type]) {
      return;
    }
    const kind = metricName || rawEvent.status || rawEvent.type;
    let alreadySentEvents = alreadySentEventsByKind[kind];
    if (!alreadySentEvents) {
      alreadySentEvents = alreadySentEventsByKind[kind] = /* @__PURE__ */ new Set();
    }
    if (alreadySentEvents.size >= maxTelemetryEventsPerPage) {
      return;
    }
    const stringifiedEvent = jsonStringify(rawEvent);
    if (alreadySentEvents.has(stringifiedEvent)) {
      return;
    }
    const defaultTelemetryEventAttributes = hooks.triggerHook(1, {
      startTime: clocksNow().relative
    });
    if (defaultTelemetryEventAttributes === DISCARDED) {
      return;
    }
    const event = toTelemetryEvent(defaultTelemetryEventAttributes, telemetryService, rawEvent, runtimeEnvInfo);
    observable.notify(event);
    sendToExtension("telemetry", event);
    alreadySentEvents.add(stringifiedEvent);
  });
  telemetryObservable2.unbuffer();
  startMonitorErrorCollection(addTelemetryError);
  return {
    enabled: telemetryEnabled,
    metricsEnabled: telemetryEnabledPerType["metric"]
  };
  function toTelemetryEvent(defaultTelemetryEventAttributes, telemetryService2, rawEvent, runtimeEnvInfo2) {
    const clockNow = clocksNow();
    const event = {
      type: "telemetry",
      date: clockNow.timeStamp,
      service: telemetryService2,
      version: "6.32.0",
      source: "browser",
      _dd: {
        format_version: 2
      },
      telemetry: combine(rawEvent, {
        runtime_env: runtimeEnvInfo2,
        connectivity: getConnectivity(),
        sdk_setup: "npm"
      }),
      ddtags: buildTags(configuration).join(","),
      experimental_features: Array.from(getExperimentalFeatures())
    };
    return combine(event, defaultTelemetryEventAttributes);
  }
}
function startTelemetryTransport(configuration, telemetryObservable2) {
  const cleanupTasks2 = [];
  if (canUseEventBridge()) {
    const bridge = getEventBridge();
    const telemetrySubscription = telemetryObservable2.subscribe((event) => bridge.send("internal_telemetry", event));
    cleanupTasks2.push(telemetrySubscription.unsubscribe);
  } else {
    const endpoints = [configuration.rumEndpointBuilder];
    if (configuration.replica && isTelemetryReplicationAllowed(configuration)) {
      endpoints.push(configuration.replica.rumEndpointBuilder);
    }
    const telemetryBatch = createBatch({
      encoder: createIdentityEncoder(),
      request: createHttpRequest(
        endpoints,
        // Ignore transport errors for telemetry
        noop
      ),
      flushController: createFlushController({
        pageMayExitObservable: createPageMayExitObservable(configuration),
        // We don't use an actual session expire observable here, to make telemetry collection
        // independent of the session. This allows to start and send telemetry events earlier.
        sessionExpireObservable: new Observable()
      })
    });
    cleanupTasks2.push(telemetryBatch.stop);
    const telemetrySubscription = telemetryObservable2.subscribe(telemetryBatch.add);
    cleanupTasks2.push(telemetrySubscription.unsubscribe);
  }
  return {
    stop: () => cleanupTasks2.forEach((task) => task())
  };
}
function getRuntimeEnvInfo() {
  var _a;
  return {
    is_local_file: ((_a = globalObject.location) === null || _a === void 0 ? void 0 : _a.protocol) === "file:",
    is_worker: isWorkerEnvironment
  };
}
function isTelemetryReplicationAllowed(configuration) {
  return configuration.site === INTAKE_SITE_STAGING;
}
function addTelemetryDebug(message, context) {
  displayIfDebugEnabled(ConsoleApiName.debug, message, context);
  getTelemetryObservable().notify({
    rawEvent: {
      type: TelemetryType.LOG,
      message,
      status: "debug",
      ...context
    }
  });
}
function addTelemetryError(e, context) {
  getTelemetryObservable().notify({
    rawEvent: {
      type: TelemetryType.LOG,
      status: "error",
      ...formatError(e),
      ...context
    }
  });
}
function addTelemetryConfiguration(configuration) {
  getTelemetryObservable().notify({
    rawEvent: {
      type: TelemetryType.CONFIGURATION,
      configuration
    }
  });
}
function addTelemetryMetrics(metricName, context) {
  getTelemetryObservable().notify({
    rawEvent: {
      type: TelemetryType.LOG,
      message: metricName,
      status: "debug",
      ...context
    },
    metricName
  });
}
function addTelemetryUsage(usage) {
  getTelemetryObservable().notify({
    rawEvent: {
      type: TelemetryType.USAGE,
      usage
    }
  });
}
function formatError(e) {
  if (isError(e)) {
    const stackTrace = computeStackTrace(e);
    return {
      error: {
        kind: stackTrace.name,
        stack: toStackTraceString(scrubCustomerFrames(stackTrace))
      },
      message: stackTrace.message
    };
  }
  return {
    error: {
      stack: NO_ERROR_STACK_PRESENT_MESSAGE
    },
    message: `${"Uncaught"} ${jsonStringify(e)}`
  };
}
function scrubCustomerFrames(stackTrace) {
  stackTrace.stack = stackTrace.stack.filter((frame) => !frame.url || ALLOWED_FRAME_URLS.some((allowedFrameUrl) => frame.url.startsWith(allowedFrameUrl)));
  return stackTrace;
}

// ../../node_modules/@datadog/browser-core/esm/tools/instrumentMethod.js
function instrumentMethod(targetPrototype, method, onPreCall, { computeHandlingStack } = {}) {
  let original = targetPrototype[method];
  if (typeof original !== "function") {
    if (method in targetPrototype && typeof method === "string" && method.startsWith("on")) {
      original = noop;
    } else {
      return { stop: noop };
    }
  }
  let stopped = false;
  const instrumentation = function() {
    if (stopped) {
      return original.apply(this, arguments);
    }
    const parameters = Array.from(arguments);
    let postCallCallback;
    callMonitored(onPreCall, null, [
      {
        target: this,
        parameters,
        onPostCall: (callback) => {
          postCallCallback = callback;
        },
        handlingStack: computeHandlingStack ? createHandlingStack("instrumented method") : void 0
      }
    ]);
    const result = original.apply(this, parameters);
    if (postCallCallback) {
      callMonitored(postCallCallback, null, [result]);
    }
    return result;
  };
  targetPrototype[method] = instrumentation;
  return {
    stop: () => {
      stopped = true;
      if (targetPrototype[method] === instrumentation) {
        targetPrototype[method] = original;
      }
    }
  };
}
function instrumentSetter(targetPrototype, property, after) {
  const originalDescriptor = Object.getOwnPropertyDescriptor(targetPrototype, property);
  if (!originalDescriptor || !originalDescriptor.set || !originalDescriptor.configurable) {
    return { stop: noop };
  }
  const stoppedInstrumentation = noop;
  let instrumentation = (target, value) => {
    setTimeout(() => {
      if (instrumentation !== stoppedInstrumentation) {
        after(target, value);
      }
    }, 0);
  };
  const instrumentationWrapper = function(value) {
    originalDescriptor.set.call(this, value);
    instrumentation(this, value);
  };
  Object.defineProperty(targetPrototype, property, {
    set: instrumentationWrapper
  });
  return {
    stop: () => {
      var _a;
      if (((_a = Object.getOwnPropertyDescriptor(targetPrototype, property)) === null || _a === void 0 ? void 0 : _a.set) === instrumentationWrapper) {
        Object.defineProperty(targetPrototype, property, originalDescriptor);
      }
      instrumentation = stoppedInstrumentation;
    }
  };
}

// ../../node_modules/@datadog/browser-core/esm/domain/error/trackRuntimeError.js
function trackRuntimeError() {
  return new Observable((observer) => {
    const handleRuntimeError = (originalError, stackTrace) => {
      const rawError = computeRawError({
        stackTrace,
        originalError,
        startClocks: clocksNow(),
        nonErrorPrefix: "Uncaught",
        source: ErrorSource.SOURCE,
        handling: "unhandled"
      });
      observer.notify(rawError);
    };
    const { stop: stopInstrumentingOnError } = instrumentOnError(handleRuntimeError);
    const { stop: stopInstrumentingOnUnhandledRejection } = instrumentUnhandledRejection(handleRuntimeError);
    return () => {
      stopInstrumentingOnError();
      stopInstrumentingOnUnhandledRejection();
    };
  });
}
function instrumentOnError(callback) {
  return instrumentMethod(getGlobalObject(), "onerror", ({ parameters: [messageObj, url, line, column, errorObj] }) => {
    let stackTrace;
    if (!isError(errorObj)) {
      stackTrace = computeStackTraceFromOnErrorMessage(messageObj, url, line, column);
    }
    callback(errorObj !== null && errorObj !== void 0 ? errorObj : messageObj, stackTrace);
  });
}
function instrumentUnhandledRejection(callback) {
  return instrumentMethod(getGlobalObject(), "onunhandledrejection", ({ parameters: [e] }) => {
    callback(e.reason || "Empty reason");
  });
}

// ../../node_modules/@datadog/browser-core/esm/boot/displayAlreadyInitializedError.js
function displayAlreadyInitializedError(sdkName, initConfiguration) {
  if (!initConfiguration.silentMultipleInit) {
    display.error(`${sdkName} is already initialized.`);
  }
}

// ../../node_modules/@datadog/browser-core/esm/domain/report/reportObservable.js
var RawReportType = {
  intervention: "intervention",
  deprecation: "deprecation",
  cspViolation: "csp_violation"
};
function initReportObservable(configuration, apis) {
  const observables = [];
  if (apis.includes(RawReportType.cspViolation)) {
    observables.push(createCspViolationReportObservable(configuration));
  }
  const reportTypes = apis.filter((api) => api !== RawReportType.cspViolation);
  if (reportTypes.length) {
    observables.push(createReportObservable(reportTypes));
  }
  return mergeObservables(...observables);
}
function createReportObservable(reportTypes) {
  return new Observable((observable) => {
    if (!window.ReportingObserver) {
      return;
    }
    const handleReports = monitor((reports, _) => reports.forEach((report) => observable.notify(buildRawReportErrorFromReport(report))));
    const observer = new window.ReportingObserver(handleReports, {
      types: reportTypes,
      buffered: true
    });
    observer.observe();
    return () => {
      observer.disconnect();
    };
  });
}
function createCspViolationReportObservable(configuration) {
  return new Observable((observable) => {
    const { stop } = addEventListener(configuration, document, "securitypolicyviolation", (event) => {
      observable.notify(buildRawReportErrorFromCspViolation(event));
    });
    return stop;
  });
}
function buildRawReportErrorFromReport(report) {
  const { type, body } = report;
  return buildRawReportError({
    type: body.id,
    message: `${type}: ${body.message}`,
    originalError: report,
    stack: buildStack(body.id, body.message, body.sourceFile, body.lineNumber, body.columnNumber)
  });
}
function buildRawReportErrorFromCspViolation(event) {
  const message = `'${event.blockedURI}' blocked by '${event.effectiveDirective}' directive`;
  return buildRawReportError({
    type: event.effectiveDirective,
    message: `${RawReportType.cspViolation}: ${message}`,
    originalError: event,
    csp: {
      disposition: event.disposition
    },
    stack: buildStack(event.effectiveDirective, event.originalPolicy ? `${message} of the policy "${safeTruncate(event.originalPolicy, 100, "...")}"` : "no policy", event.sourceFile, event.lineNumber, event.columnNumber)
  });
}
function buildRawReportError(partial) {
  return {
    startClocks: clocksNow(),
    source: ErrorSource.REPORT,
    handling: "unhandled",
    ...partial
  };
}
function buildStack(name, message, sourceFile, lineNumber, columnNumber) {
  return sourceFile ? toStackTraceString({
    name,
    message,
    stack: [
      {
        func: "?",
        url: sourceFile,
        line: lineNumber !== null && lineNumber !== void 0 ? lineNumber : void 0,
        column: columnNumber !== null && columnNumber !== void 0 ? columnNumber : void 0
      }
    ]
  }) : void 0;
}

// ../../node_modules/@datadog/browser-core/esm/tools/utils/arrayUtils.js
function removeItem(array, item) {
  const index = array.indexOf(item);
  if (index >= 0) {
    array.splice(index, 1);
  }
}
function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

// ../../node_modules/@datadog/browser-core/esm/tools/valueHistory.js
var END_OF_TIMES = Infinity;
var CLEAR_OLD_VALUES_INTERVAL = ONE_MINUTE;
var cleanupHistoriesInterval;
var cleanupTasks = /* @__PURE__ */ new Set();
function cleanupHistories() {
  cleanupTasks.forEach((task) => task());
}
function createValueHistory({ expireDelay, maxEntries }) {
  let entries = [];
  if (!cleanupHistoriesInterval) {
    cleanupHistoriesInterval = setInterval(() => cleanupHistories(), CLEAR_OLD_VALUES_INTERVAL);
  }
  const clearExpiredValues = () => {
    const oldTimeThreshold = relativeNow() - expireDelay;
    while (entries.length > 0 && entries[entries.length - 1].endTime < oldTimeThreshold) {
      entries.pop();
    }
  };
  cleanupTasks.add(clearExpiredValues);
  function add(value, startTime) {
    const entry = {
      value,
      startTime,
      endTime: END_OF_TIMES,
      remove: () => {
        removeItem(entries, entry);
      },
      close: (endTime) => {
        entry.endTime = endTime;
      }
    };
    if (maxEntries && entries.length >= maxEntries) {
      entries.pop();
    }
    entries.unshift(entry);
    return entry;
  }
  function find(startTime = END_OF_TIMES, options = { returnInactive: false }) {
    for (const entry of entries) {
      if (entry.startTime <= startTime) {
        if (options.returnInactive || startTime <= entry.endTime) {
          return entry.value;
        }
        break;
      }
    }
  }
  function closeActive(endTime) {
    const latestEntry = entries[0];
    if (latestEntry && latestEntry.endTime === END_OF_TIMES) {
      latestEntry.close(endTime);
    }
  }
  function findAll(startTime = END_OF_TIMES, duration = 0) {
    const endTime = addDuration(startTime, duration);
    return entries.filter((entry) => entry.startTime <= endTime && startTime <= entry.endTime).map((entry) => entry.value);
  }
  function getEntries(startTime) {
    return entries.filter((entry) => entry.startTime === startTime);
  }
  function reset() {
    entries = [];
  }
  function stop() {
    cleanupTasks.delete(clearExpiredValues);
    if (cleanupTasks.size === 0 && cleanupHistoriesInterval) {
      clearInterval(cleanupHistoriesInterval);
      cleanupHistoriesInterval = void 0;
    }
  }
  return { add, find, closeActive, findAll, getEntries, reset, stop };
}

// ../../node_modules/@datadog/browser-core/esm/domain/synthetics/syntheticsWorkerValues.js
var cookieNamePrefix = "datadog-synthetics-";
var SYNTHETICS_TEST_ID_COOKIE_NAME = `${cookieNamePrefix}public-id`;
var SYNTHETICS_RESULT_ID_COOKIE_NAME = `${cookieNamePrefix}result-id`;
var SYNTHETICS_INJECTS_RUM_COOKIE_NAME = `${cookieNamePrefix}injects-rum`;
var SYNTHETICS_CONTEXT_COOKIE_NAME = `${cookieNamePrefix}rum-context`;
function willSyntheticsInjectRum() {
  if (isWorkerEnvironment) {
    return false;
  }
  return Boolean(globalObject._DATADOG_SYNTHETICS_INJECTS_RUM || getInitCookie(SYNTHETICS_INJECTS_RUM_COOKIE_NAME));
}
function getSyntheticsContext() {
  const raw = getRawSyntheticsContext();
  return isValidSyntheticsContext(raw) ? raw : void 0;
}
function isSyntheticsTest() {
  return Boolean(getSyntheticsContext());
}
function getRawSyntheticsContext() {
  const rawGlobal = globalObject._DATADOG_SYNTHETICS_RUM_CONTEXT;
  if (rawGlobal) {
    return rawGlobal;
  }
  const rawCookie = getInitCookie(SYNTHETICS_CONTEXT_COOKIE_NAME);
  if (rawCookie) {
    return tryJsonParse(decodeURIComponent(rawCookie));
  }
  return {
    test_id: window._DATADOG_SYNTHETICS_PUBLIC_ID || getInitCookie(SYNTHETICS_TEST_ID_COOKIE_NAME),
    result_id: window._DATADOG_SYNTHETICS_RESULT_ID || getInitCookie(SYNTHETICS_RESULT_ID_COOKIE_NAME)
  };
}
function isValidSyntheticsContext(value) {
  return typeof value === "object" && value !== null && typeof value.test_id === "string" && typeof value.result_id === "string";
}

// ../../node_modules/@datadog/browser-core/esm/domain/session/sessionManager.js
var VISIBILITY_CHECK_DELAY = ONE_MINUTE;
var SESSION_CONTEXT_TIMEOUT_DELAY = SESSION_TIME_OUT_DELAY;
var stopCallbacks = [];
function startSessionManager(configuration, productKey, computeTrackingType, trackingConsentState) {
  const renewObservable = new Observable();
  const expireObservable = new Observable();
  const sessionStore = startSessionStore(configuration.sessionStoreStrategyType, configuration, productKey, computeTrackingType);
  stopCallbacks.push(() => sessionStore.stop());
  const sessionContextHistory = createValueHistory({
    expireDelay: SESSION_CONTEXT_TIMEOUT_DELAY
  });
  stopCallbacks.push(() => sessionContextHistory.stop());
  sessionStore.renewObservable.subscribe(() => {
    sessionContextHistory.add(buildSessionContext(), relativeNow());
    renewObservable.notify();
  });
  sessionStore.expireObservable.subscribe(() => {
    expireObservable.notify();
    sessionContextHistory.closeActive(relativeNow());
  });
  sessionStore.expandOrRenewSession();
  sessionContextHistory.add(buildSessionContext(), clocksOrigin().relative);
  if (isExperimentalFeatureEnabled(ExperimentalFeature.SHORT_SESSION_INVESTIGATION)) {
    const session = sessionStore.getSession();
    if (session) {
      detectSessionIdChange(configuration, session);
    }
  }
  trackingConsentState.observable.subscribe(() => {
    if (trackingConsentState.isGranted()) {
      sessionStore.expandOrRenewSession();
    } else {
      sessionStore.expire(false);
    }
  });
  trackActivity(configuration, () => {
    if (trackingConsentState.isGranted()) {
      sessionStore.expandOrRenewSession();
    }
  });
  trackVisibility(configuration, () => sessionStore.expandSession());
  trackResume(configuration, () => sessionStore.restartSession());
  function buildSessionContext() {
    const session = sessionStore.getSession();
    if (!session) {
      reportUnexpectedSessionState(configuration).catch(() => void 0);
      return {
        id: "invalid",
        trackingType: SESSION_NOT_TRACKED,
        isReplayForced: false,
        anonymousId: void 0
      };
    }
    return {
      id: session.id,
      trackingType: session[productKey],
      isReplayForced: !!session.forcedReplay,
      anonymousId: session.anonymousId
    };
  }
  return {
    findSession: (startTime, options) => sessionContextHistory.find(startTime, options),
    renewObservable,
    expireObservable,
    sessionStateUpdateObservable: sessionStore.sessionStateUpdateObservable,
    expire: sessionStore.expire,
    updateSessionState: sessionStore.updateSessionState
  };
}
function trackActivity(configuration, expandOrRenewSession) {
  const { stop } = addEventListeners(configuration, window, [
    "click",
    "touchstart",
    "keydown",
    "scroll"
    /* DOM_EVENT.SCROLL */
  ], expandOrRenewSession, { capture: true, passive: true });
  stopCallbacks.push(stop);
}
function trackVisibility(configuration, expandSession) {
  const expandSessionWhenVisible = () => {
    if (document.visibilityState === "visible") {
      expandSession();
    }
  };
  const { stop } = addEventListener(configuration, document, "visibilitychange", expandSessionWhenVisible);
  stopCallbacks.push(stop);
  const visibilityCheckInterval = setInterval(expandSessionWhenVisible, VISIBILITY_CHECK_DELAY);
  stopCallbacks.push(() => {
    clearInterval(visibilityCheckInterval);
  });
}
function trackResume(configuration, cb) {
  const { stop } = addEventListener(configuration, window, "resume", cb, { capture: true });
  stopCallbacks.push(stop);
}
async function reportUnexpectedSessionState(configuration) {
  const sessionStoreStrategyType = configuration.sessionStoreStrategyType;
  if (!sessionStoreStrategyType) {
    return;
  }
  let rawSession;
  let cookieContext;
  if (sessionStoreStrategyType.type === SessionPersistence.COOKIE) {
    rawSession = retrieveSessionCookie(sessionStoreStrategyType.cookieOptions, configuration);
    cookieContext = {
      cookie: await getSessionCookies(),
      currentDomain: `${window.location.protocol}//${window.location.hostname}`
    };
  } else {
    rawSession = retrieveSessionFromLocalStorage();
  }
  addTelemetryDebug("Unexpected session state", {
    sessionStoreStrategyType: sessionStoreStrategyType.type,
    session: rawSession,
    isSyntheticsTest: isSyntheticsTest(),
    createdTimestamp: rawSession === null || rawSession === void 0 ? void 0 : rawSession.created,
    expireTimestamp: rawSession === null || rawSession === void 0 ? void 0 : rawSession.expire,
    ...cookieContext
  });
}
function detectSessionIdChange(configuration, initialSessionState) {
  if (!window.cookieStore || !initialSessionState.created) {
    return;
  }
  const sessionCreatedTime = Number(initialSessionState.created);
  const sdkInitTime = dateNow();
  const { stop } = addEventListener(configuration, cookieStore, "change", listener);
  stopCallbacks.push(stop);
  function listener(event) {
    const changed = findLast(event.changed, (change) => change.name === SESSION_STORE_KEY);
    if (!changed) {
      return;
    }
    const sessionAge = dateNow() - sessionCreatedTime;
    if (sessionAge > 14 * ONE_MINUTE) {
      stop();
    } else {
      const newSessionState = toSessionState(changed.value);
      if (newSessionState.id && newSessionState.id !== initialSessionState.id) {
        stop();
        const time = dateNow() - sdkInitTime;
        getSessionCookies().then((cookie) => {
          addTelemetryDebug("Session cookie changed", {
            time,
            session_age: sessionAge,
            old: initialSessionState,
            new: newSessionState,
            cookie
          });
        }).catch(monitorError);
      }
    }
  }
}
async function getSessionCookies() {
  let sessionCookies;
  if ("cookieStore" in window) {
    sessionCookies = await window.cookieStore.getAll(SESSION_STORE_KEY);
  } else {
    sessionCookies = document.cookie.split(/\s*;\s*/).filter((cookie) => cookie.startsWith(SESSION_STORE_KEY));
  }
  return {
    count: sessionCookies.length,
    domain: getCurrentSite() || "undefined",
    ...sessionCookies
  };
}

// ../../node_modules/@datadog/browser-core/esm/tools/abstractLifeCycle.js
var AbstractLifeCycle = class {
  constructor() {
    this.callbacks = {};
  }
  notify(eventType, data) {
    const eventCallbacks = this.callbacks[eventType];
    if (eventCallbacks) {
      eventCallbacks.forEach((callback) => callback(data));
    }
  }
  subscribe(eventType, callback) {
    if (!this.callbacks[eventType]) {
      this.callbacks[eventType] = [];
    }
    this.callbacks[eventType].push(callback);
    return {
      unsubscribe: () => {
        this.callbacks[eventType] = this.callbacks[eventType].filter((other) => callback !== other);
      }
    };
  }
};

// ../../node_modules/@datadog/browser-core/esm/domain/eventRateLimiter/createEventRateLimiter.js
var EVENT_RATE_LIMIT = 3e3;
function createEventRateLimiter(eventType, onLimitReached, limit = EVENT_RATE_LIMIT) {
  let eventCount = 0;
  let allowNextEvent = false;
  return {
    isLimitReached() {
      if (eventCount === 0) {
        setTimeout(() => {
          eventCount = 0;
        }, ONE_MINUTE);
      }
      eventCount += 1;
      if (eventCount <= limit || allowNextEvent) {
        allowNextEvent = false;
        return false;
      }
      if (eventCount === limit + 1) {
        allowNextEvent = true;
        try {
          onLimitReached({
            message: `Reached max number of ${eventType}s by minute: ${limit}`,
            source: ErrorSource.AGENT,
            startClocks: clocksNow()
          });
        } finally {
          allowNextEvent = false;
        }
      }
      return true;
    }
  };
}

// ../../node_modules/@datadog/browser-core/esm/browser/runOnReadyState.js
function runOnReadyState(configuration, expectedReadyState, callback) {
  if (document.readyState === expectedReadyState || document.readyState === "complete") {
    callback();
    return { stop: noop };
  }
  const eventName = expectedReadyState === "complete" ? "load" : "DOMContentLoaded";
  return addEventListener(configuration, window, eventName, callback, { once: true });
}
function asyncRunOnReadyState(configuration, expectedReadyState) {
  return new Promise((resolve) => {
    runOnReadyState(configuration, expectedReadyState, resolve);
  });
}

// ../../node_modules/@datadog/browser-core/esm/browser/xhrObservable.js
var xhrObservable;
var xhrContexts = /* @__PURE__ */ new WeakMap();
function initXhrObservable(configuration) {
  if (!xhrObservable) {
    xhrObservable = createXhrObservable(configuration);
  }
  return xhrObservable;
}
function createXhrObservable(configuration) {
  return new Observable((observable) => {
    const { stop: stopInstrumentingStart } = instrumentMethod(XMLHttpRequest.prototype, "open", openXhr);
    const { stop: stopInstrumentingSend } = instrumentMethod(XMLHttpRequest.prototype, "send", (call) => {
      sendXhr(call, configuration, observable);
    }, { computeHandlingStack: true });
    const { stop: stopInstrumentingAbort } = instrumentMethod(XMLHttpRequest.prototype, "abort", abortXhr);
    return () => {
      stopInstrumentingStart();
      stopInstrumentingSend();
      stopInstrumentingAbort();
    };
  });
}
function openXhr({ target: xhr, parameters: [method, url] }) {
  xhrContexts.set(xhr, {
    state: "open",
    method: String(method).toUpperCase(),
    url: normalizeUrl(String(url))
  });
}
function sendXhr({ target: xhr, parameters: [body], handlingStack }, configuration, observable) {
  const context = xhrContexts.get(xhr);
  if (!context) {
    return;
  }
  const startContext = context;
  startContext.state = "start";
  startContext.startClocks = clocksNow();
  startContext.isAborted = false;
  startContext.xhr = xhr;
  startContext.handlingStack = handlingStack;
  startContext.requestBody = body;
  let hasBeenReported = false;
  const { stop: stopInstrumentingOnReadyStateChange } = instrumentMethod(xhr, "onreadystatechange", () => {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      onEnd();
    }
  });
  const onEnd = () => {
    unsubscribeLoadEndListener();
    stopInstrumentingOnReadyStateChange();
    if (hasBeenReported) {
      return;
    }
    hasBeenReported = true;
    const completeContext = context;
    completeContext.state = "complete";
    completeContext.duration = elapsed(startContext.startClocks.timeStamp, timeStampNow());
    completeContext.status = xhr.status;
    if (typeof xhr.response === "string") {
      completeContext.responseBody = xhr.response;
    }
    observable.notify(shallowClone(completeContext));
  };
  const { stop: unsubscribeLoadEndListener } = addEventListener(configuration, xhr, "loadend", onEnd);
  observable.notify(startContext);
}
function abortXhr({ target: xhr }) {
  const context = xhrContexts.get(xhr);
  if (context) {
    context.isAborted = true;
  }
}

// ../../node_modules/@datadog/browser-core/esm/tools/readBytesFromStream.js
async function readBytesFromStream(stream, options) {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const result = await reader.read();
    if (result.done) {
      break;
    }
    if (options.collectStreamBody) {
      chunks.push(result.value);
    }
  }
  reader.cancel().catch(
    // we don't care if cancel fails, but we still need to catch the error to avoid reporting it
    // as an unhandled rejection
    noop
  );
  return options.collectStreamBody ? concatBuffers(chunks) : void 0;
}

// ../../node_modules/@datadog/browser-core/esm/browser/fetchObservable.js
var fetchObservable;
var responseBodyActionGetters = [];
function initFetchObservable({ responseBodyAction } = {}) {
  if (responseBodyAction) {
    responseBodyActionGetters.push(responseBodyAction);
  }
  if (!fetchObservable) {
    fetchObservable = createFetchObservable();
  }
  return fetchObservable;
}
function createFetchObservable() {
  return new Observable((observable) => {
    if (!globalObject.fetch) {
      return;
    }
    const { stop } = instrumentMethod(globalObject, "fetch", (call) => beforeSend(call, observable), {
      computeHandlingStack: true
    });
    return stop;
  });
}
function beforeSend({ parameters, onPostCall, handlingStack }, observable) {
  var _a, _b;
  const [input, init] = parameters;
  let methodFromParams = init && init.method;
  if (methodFromParams === void 0 && input instanceof Request) {
    methodFromParams = input.method;
  }
  const method = methodFromParams !== void 0 ? String(methodFromParams).toUpperCase() : "GET";
  const url = input instanceof Request ? input.url : normalizeUrl(String(input));
  const startClocks = clocksNow();
  const context = {
    state: "start",
    init,
    input,
    method,
    startClocks,
    url,
    handlingStack,
    isAbortedOnStart: input instanceof Request && ((_a = input.signal) === null || _a === void 0 ? void 0 : _a.aborted) || ((_b = init === null || init === void 0 ? void 0 : init.signal) === null || _b === void 0 ? void 0 : _b.aborted) || false
  };
  observable.notify(context);
  parameters[0] = context.input;
  parameters[1] = context.init;
  onPostCall((responsePromise) => {
    afterSend(observable, responsePromise, context).catch(monitorError);
  });
}
async function afterSend(observable, responsePromise, startContext) {
  var _a, _b;
  const context = startContext;
  context.state = "resolve";
  let response;
  try {
    response = await responsePromise;
  } catch (error) {
    context.status = 0;
    context.isAborted = ((_b = (_a = context.init) === null || _a === void 0 ? void 0 : _a.signal) === null || _b === void 0 ? void 0 : _b.aborted) || error instanceof DOMException && error.code === DOMException.ABORT_ERR;
    context.error = error;
    observable.notify(context);
    return;
  }
  context.response = response;
  context.status = response.status;
  context.responseType = response.type;
  context.isAborted = false;
  const responseBodyCondition = responseBodyActionGetters.reduce(
    (action, getter) => Math.max(action, getter(context)),
    0
    /* ResponseBodyAction.IGNORE */
  );
  if (responseBodyCondition !== 0) {
    const clonedResponse = tryToClone(response);
    if (clonedResponse && clonedResponse.body) {
      try {
        const bytes = await readBytesFromStream(clonedResponse.body, {
          collectStreamBody: responseBodyCondition === 2
        });
        context.responseBody = bytes && new TextDecoder().decode(bytes);
      } catch (_c) {
      }
    }
  }
  observable.notify(context);
}

// ../../node_modules/@datadog/browser-core/esm/tools/requestIdleCallback.js
function requestIdleCallback(callback, opts) {
  if (window.requestIdleCallback && window.cancelIdleCallback) {
    const id = window.requestIdleCallback(monitor(callback), opts);
    return () => window.cancelIdleCallback(id);
  }
  return requestIdleCallbackShim(callback);
}
var MAX_TASK_TIME = 50;
function requestIdleCallbackShim(callback) {
  const start = dateNow();
  const timeoutId = setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, MAX_TASK_TIME - (dateNow() - start))
    });
  }, 0);
  return () => clearTimeout(timeoutId);
}

// ../../node_modules/@datadog/browser-core/esm/tools/taskQueue.js
var IDLE_CALLBACK_TIMEOUT = ONE_SECOND;
var MAX_EXECUTION_TIME_ON_TIMEOUT = 30;
function createTaskQueue() {
  const pendingTasks = [];
  function run(deadline) {
    let executionTimeRemaining;
    if (deadline.didTimeout) {
      const start = performance.now();
      executionTimeRemaining = () => MAX_EXECUTION_TIME_ON_TIMEOUT - (performance.now() - start);
    } else {
      executionTimeRemaining = deadline.timeRemaining.bind(deadline);
    }
    while (executionTimeRemaining() > 0 && pendingTasks.length) {
      pendingTasks.shift()();
    }
    if (pendingTasks.length) {
      scheduleNextRun();
    }
  }
  function scheduleNextRun() {
    requestIdleCallback(run, { timeout: IDLE_CALLBACK_TIMEOUT });
  }
  return {
    push(task) {
      if (pendingTasks.push(task) === 1) {
        scheduleNextRun();
      }
    },
    stop() {
      pendingTasks.length = 0;
    }
  };
}

// ../../node_modules/@datadog/browser-core/esm/domain/console/consoleObservable.js
var consoleObservablesByApi = {};
function initConsoleObservable(apis) {
  const consoleObservables = apis.map((api) => {
    if (!consoleObservablesByApi[api]) {
      consoleObservablesByApi[api] = createConsoleObservable(api);
    }
    return consoleObservablesByApi[api];
  });
  return mergeObservables(...consoleObservables);
}
function createConsoleObservable(api) {
  return new Observable((observable) => {
    const originalConsoleApi = globalConsole[api];
    globalConsole[api] = (...params) => {
      originalConsoleApi.apply(console, params);
      const handlingStack = createHandlingStack("console error");
      callMonitored(() => {
        observable.notify(buildConsoleLog(params, api, handlingStack));
      });
    };
    return () => {
      globalConsole[api] = originalConsoleApi;
    };
  });
}
function buildConsoleLog(params, api, handlingStack) {
  const message = params.map((param) => formatConsoleParameters(param)).join(" ");
  if (api === ConsoleApiName.error) {
    const firstErrorParam = params.find(isError);
    const rawError = computeRawError({
      originalError: firstErrorParam,
      handlingStack,
      startClocks: clocksNow(),
      source: ErrorSource.CONSOLE,
      handling: "handled",
      nonErrorPrefix: "Provided",
      // if no good stack is computed from the error, let's not use the fallback stack message
      // advising the user to use an instance of Error, as console.error is commonly used without an
      // Error instance.
      useFallbackStack: false
    });
    rawError.message = message;
    return {
      api,
      message,
      handlingStack,
      error: rawError
    };
  }
  return {
    api,
    message,
    error: void 0,
    handlingStack
  };
}
function formatConsoleParameters(param) {
  if (typeof param === "string") {
    return sanitize(param);
  }
  if (isError(param)) {
    return formatErrorMessage(computeStackTrace(param));
  }
  return jsonStringify(sanitize(param), void 0, 2);
}

// ../../node_modules/@datadog/browser-core/esm/tools/boundedBuffer.js
var BUFFER_LIMIT = 500;
function createBoundedBuffer() {
  const buffer = [];
  const add = (callback) => {
    const length = buffer.push(callback);
    if (length > BUFFER_LIMIT) {
      buffer.splice(0, 1);
    }
  };
  const remove = (callback) => {
    removeItem(buffer, callback);
  };
  const drain = (arg) => {
    buffer.forEach((callback) => callback(arg));
    buffer.length = 0;
  };
  return {
    add,
    remove,
    drain
  };
}

// ../../node_modules/@datadog/browser-core/esm/domain/context/contextUtils.js
function checkContext(maybeContext) {
  const isValid = getType(maybeContext) === "object";
  if (!isValid) {
    display.error("Unsupported context:", maybeContext);
  }
  return isValid;
}

// ../../node_modules/@datadog/browser-core/esm/domain/context/contextManager.js
function ensureProperties(context, propertiesConfig, name) {
  const newContext = { ...context };
  for (const [key, { required, type }] of Object.entries(propertiesConfig)) {
    if (type === "string" && !isDefined(newContext[key])) {
      newContext[key] = String(newContext[key]);
    }
    if (required && isDefined(newContext[key])) {
      display.warn(`The property ${key} of ${name} is required; context will not be sent to the intake.`);
    }
  }
  return newContext;
}
function isDefined(value) {
  return value === void 0 || value === null || value === "";
}
function createContextManager(name = "", { propertiesConfig = {} } = {}) {
  let context = {};
  const changeObservable = new Observable();
  const contextManager = {
    getContext: () => deepClone(context),
    setContext: (newContext) => {
      if (checkContext(newContext)) {
        context = sanitize(ensureProperties(newContext, propertiesConfig, name));
      } else {
        contextManager.clearContext();
      }
      changeObservable.notify();
    },
    setContextProperty: (key, property) => {
      context = sanitize(ensureProperties({ ...context, [key]: property }, propertiesConfig, name));
      changeObservable.notify();
    },
    removeContextProperty: (key) => {
      delete context[key];
      ensureProperties(context, propertiesConfig, name);
      changeObservable.notify();
    },
    clearContext: () => {
      context = {};
      changeObservable.notify();
    },
    changeObservable
  };
  return contextManager;
}

// ../../node_modules/@datadog/browser-core/esm/domain/context/defineContextMethod.js
function defineContextMethod(getStrategy, contextName, methodName, usage) {
  return monitor((...args) => {
    if (usage) {
      addTelemetryUsage({ feature: usage });
    }
    return getStrategy()[contextName][methodName](...args);
  });
}

// ../../node_modules/@datadog/browser-core/esm/domain/context/storeContextManager.js
var CONTEXT_STORE_KEY_PREFIX = "_dd_c";
var storageListeners = [];
function storeContextManager(configuration, contextManager, productKey, customerDataType) {
  const storageKey = buildStorageKey(productKey, customerDataType);
  storageListeners.push(addEventListener(configuration, window, "storage", ({ key }) => {
    if (storageKey === key) {
      synchronizeWithStorage();
    }
  }));
  contextManager.changeObservable.subscribe(dumpToStorage);
  const contextFromStorage = combine(getFromStorage(), contextManager.getContext());
  if (!isEmptyObject(contextFromStorage)) {
    contextManager.setContext(contextFromStorage);
  }
  function synchronizeWithStorage() {
    contextManager.setContext(getFromStorage());
  }
  function dumpToStorage() {
    localStorage.setItem(storageKey, JSON.stringify(contextManager.getContext()));
  }
  function getFromStorage() {
    const rawContext = localStorage.getItem(storageKey);
    return rawContext ? JSON.parse(rawContext) : {};
  }
}
function buildStorageKey(productKey, customerDataType) {
  return `${CONTEXT_STORE_KEY_PREFIX}_${productKey}_${customerDataType}`;
}

// ../../node_modules/@datadog/browser-core/esm/domain/contexts/accountContext.js
function startAccountContext(hooks, configuration, productKey) {
  const accountContextManager = buildAccountContextManager();
  if (configuration.storeContextsAcrossPages) {
    storeContextManager(
      configuration,
      accountContextManager,
      productKey,
      4
      /* CustomerDataType.Account */
    );
  }
  hooks.register(0, () => {
    const account = accountContextManager.getContext();
    if (isEmptyObject(account) || !account.id) {
      return SKIPPED;
    }
    return {
      account
    };
  });
  return accountContextManager;
}
function buildAccountContextManager() {
  return createContextManager("account", {
    propertiesConfig: {
      id: { type: "string", required: true },
      name: { type: "string" }
    }
  });
}

// ../../node_modules/@datadog/browser-core/esm/domain/contexts/globalContext.js
function startGlobalContext(hooks, configuration, productKey, useContextNamespace) {
  const globalContextManager = buildGlobalContextManager();
  if (configuration.storeContextsAcrossPages) {
    storeContextManager(
      configuration,
      globalContextManager,
      productKey,
      2
      /* CustomerDataType.GlobalContext */
    );
  }
  hooks.register(0, () => {
    const context = globalContextManager.getContext();
    return useContextNamespace ? { context } : context;
  });
  return globalContextManager;
}
function buildGlobalContextManager() {
  return createContextManager("global context");
}

// ../../node_modules/@datadog/browser-core/esm/domain/contexts/userContext.js
function startUserContext(hooks, configuration, sessionManager, productKey) {
  const userContextManager = buildUserContextManager();
  if (configuration.storeContextsAcrossPages) {
    storeContextManager(
      configuration,
      userContextManager,
      productKey,
      1
      /* CustomerDataType.User */
    );
  }
  hooks.register(0, ({ eventType, startTime }) => {
    const user = userContextManager.getContext();
    const session = sessionManager.findTrackedSession(startTime);
    if (session && session.anonymousId && !user.anonymous_id && !!configuration.trackAnonymousUser) {
      user.anonymous_id = session.anonymousId;
    }
    if (isEmptyObject(user)) {
      return SKIPPED;
    }
    return {
      type: eventType,
      usr: user
    };
  });
  hooks.register(1, ({ startTime }) => {
    var _a;
    return {
      anonymous_id: (_a = sessionManager.findTrackedSession(startTime)) === null || _a === void 0 ? void 0 : _a.anonymousId
    };
  });
  return userContextManager;
}
function buildUserContextManager() {
  return createContextManager("user", {
    propertiesConfig: {
      id: { type: "string" },
      name: { type: "string" },
      email: { type: "string" }
    }
  });
}

// ../../node_modules/@datadog/browser-core/esm/domain/context/contextConstants.js
var CustomerContextKey = {
  userContext: "userContext",
  globalContext: "globalContext",
  accountContext: "accountContext"
};
var ContextManagerMethod = {
  getContext: "getContext",
  setContext: "setContext",
  setContextProperty: "setContextProperty",
  removeContextProperty: "removeContextProperty",
  clearContext: "clearContext"
};

// ../../node_modules/@datadog/browser-core/esm/domain/resourceUtils.js
var ResourceType = {
  DOCUMENT: "document",
  XHR: "xhr",
  BEACON: "beacon",
  FETCH: "fetch",
  CSS: "css",
  JS: "js",
  IMAGE: "image",
  FONT: "font",
  MEDIA: "media",
  OTHER: "other"
};
var RequestType = {
  FETCH: ResourceType.FETCH,
  XHR: ResourceType.XHR
};

// ../../node_modules/@datadog/browser-core/esm/domain/bufferedData.js
var BUFFER_LIMIT2 = 500;
function startBufferingData() {
  const observable = new BufferedObservable(BUFFER_LIMIT2);
  const runtimeErrorSubscription = mockable(trackRuntimeError)().subscribe((error) => {
    observable.notify({
      type: 0,
      error
    });
  });
  return {
    observable,
    stop: () => {
      runtimeErrorSubscription.unsubscribe();
    }
  };
}

// ../../node_modules/@datadog/browser-core/esm/tools/utils/timezone.js
function getTimeZone() {
  try {
    const intl = new Intl.DateTimeFormat();
    return intl.resolvedOptions().timeZone;
  } catch (_a) {
    return void 0;
  }
}

export {
  ConsoleApiName,
  display,
  DOCS_ORIGIN,
  performDraw,
  round,
  isNumber,
  tryJsonParse,
  shallowClone,
  objectHasValue,
  isEmptyObject,
  mapValues,
  getGlobalObject,
  getZoneJsOriginalValue,
  monitor,
  callMonitored,
  monitorError,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Observable,
  ONE_SECOND,
  ONE_MINUTE,
  relativeToClocks,
  timeStampToClocks,
  currentDrift,
  toServerDuration,
  dateNow,
  timeStampNow,
  relativeNow,
  clocksNow,
  clocksOrigin,
  elapsed,
  addDuration,
  getRelativeTime,
  looksLikeRelativeTime,
  throttle,
  noop,
  generateUUID,
  findCommaSeparatedValue,
  safeTruncate,
  isSafari,
  isValidUrl,
  getPathName,
  buildUrl,
  getCookie,
  getInitCookie,
  findLast,
  objectEntries,
  SESSION_TIME_OUT_DELAY,
  createTrackingConsentState,
  getType,
  isIndexableObject,
  isMatchOption,
  matchList,
  mockable,
  INTAKE_SITE_STAGING,
  INTAKE_SITE_US1,
  INTAKE_SITE_EU1,
  buildEndpointHost,
  isIntakeUrl,
  DefaultPrivacyLevel,
  TraceContextInjection,
  isSampleRate,
  validateAndBuildConfiguration,
  serializeConfiguration,
  ExperimentalFeature,
  initFeatureFlags,
  isExperimentalFeatureEnabled,
  computeStackTrace,
  createHandlingStack,
  instrumentMethod,
  instrumentSetter,
  ONE_KIBI_BYTE,
  concatBuffers,
  jsonStringify,
  sanitize,
  computeRawError,
  ErrorSource,
  makePublicApi,
  defineGlobal,
  displayAlreadyInitializedError,
  addEventListener,
  addEventListeners,
  RawReportType,
  initReportObservable,
  buildTags,
  sendToExtension,
  deepClone,
  combine,
  getConnectivity,
  fetch,
  createHttpRequest,
  getEventBridge,
  bridgeSupports,
  canUseEventBridge,
  PageExitReason,
  createPageMayExitObservable,
  isPageExitReason,
  createBatch,
  createFlushController,
  createIdentityEncoder,
  DISCARDED,
  SKIPPED,
  abstractHooks,
  startTelemetry,
  addTelemetryDebug,
  addTelemetryError,
  addTelemetryConfiguration,
  addTelemetryMetrics,
  addTelemetryUsage,
  isNonEmptyArray,
  createValueHistory,
  willSyntheticsInjectRum,
  getSyntheticsContext,
  isSyntheticsTest,
  startSessionManager,
  AbstractLifeCycle,
  createEventRateLimiter,
  runOnReadyState,
  asyncRunOnReadyState,
  initXhrObservable,
  initFetchObservable,
  requestIdleCallback,
  createTaskQueue,
  initConsoleObservable,
  createBoundedBuffer,
  createContextManager,
  defineContextMethod,
  startAccountContext,
  buildAccountContextManager,
  startGlobalContext,
  buildGlobalContextManager,
  startUserContext,
  buildUserContextManager,
  CustomerContextKey,
  ContextManagerMethod,
  ResourceType,
  RequestType,
  startBufferingData,
  getTimeZone
};
//# sourceMappingURL=chunk-4TAEVATQ.js.map
