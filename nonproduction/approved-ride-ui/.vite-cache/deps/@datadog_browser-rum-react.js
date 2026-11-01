import {
  callMonitored,
  clocksNow,
  createHandlingStack,
  elapsed,
  relativeNow,
  timeStampNow
} from "./chunk-4TAEVATQ.js";
import {
  require_react
} from "./chunk-2G53SATI.js";
import {
  __toESM
} from "./chunk-WOOG5QLI.js";

// ../../node_modules/@datadog/browser-rum-react/esm/domain/error/errorBoundary.js
var import_react = __toESM(require_react());

// ../../node_modules/@datadog/browser-rum-react/esm/domain/reactPlugin.js
var globalPublicApi;
var globalConfiguration;
var globalAddError;
var onRumInitSubscribers = [];
var onRumStartSubscribers = [];
function reactPlugin(configuration = {}) {
  return {
    name: "react",
    onInit({ publicApi, initConfiguration }) {
      globalPublicApi = publicApi;
      globalConfiguration = configuration;
      for (const subscriber of onRumInitSubscribers) {
        subscriber(globalConfiguration, globalPublicApi);
      }
      if (configuration.router) {
        initConfiguration.trackViewsManually = true;
      }
    },
    onRumStart({ addError }) {
      globalAddError = addError;
      for (const subscriber of onRumStartSubscribers) {
        if (addError) {
          subscriber(addError);
        }
      }
    },
    getConfigurationTelemetry() {
      return { router: !!configuration.router };
    }
  };
}
function onRumInit(callback) {
  if (globalConfiguration && globalPublicApi) {
    callback(globalConfiguration, globalPublicApi);
  } else {
    onRumInitSubscribers.push(callback);
  }
}
function onRumStart(callback) {
  if (globalAddError) {
    callback(globalAddError);
  } else {
    onRumStartSubscribers.push(callback);
  }
}

// ../../node_modules/@datadog/browser-rum-react/esm/domain/error/addReactError.js
function addReactError(error, info) {
  const handlingStack = createHandlingStack("react error");
  const startClocks = clocksNow();
  onRumStart((addError) => {
    callMonitored(() => {
      var _a;
      addError({
        error,
        handlingStack,
        componentStack: (_a = info.componentStack) !== null && _a !== void 0 ? _a : void 0,
        startClocks,
        context: { ...error.dd_context, framework: "react" }
      });
    });
  });
}

// ../../node_modules/@datadog/browser-rum-react/esm/domain/error/errorBoundary.js
var INITIAL_STATE = { didCatch: false, error: null };
function createErrorBoundary(reportError, displayName = "ErrorBoundary") {
  const DatadogErrorBoundary = class DatadogErrorBoundary extends import_react.default.Component {
    constructor(props) {
      super(props);
      this.resetError = () => {
        this.setState(INITIAL_STATE);
      };
      this.state = INITIAL_STATE;
    }
    static getDerivedStateFromError(error) {
      return { didCatch: true, error };
    }
    componentDidCatch(error, errorInfo) {
      reportError(error, errorInfo);
    }
    render() {
      if (this.state.didCatch) {
        return import_react.default.createElement(this.props.fallback, {
          error: this.state.error,
          resetError: this.resetError
        });
      }
      return this.props.children;
    }
  };
  DatadogErrorBoundary.displayName = displayName;
  return DatadogErrorBoundary;
}
var ErrorBoundary = createErrorBoundary(addReactError);

// ../../node_modules/@datadog/browser-rum-react/esm/domain/performance/reactComponentTracker.js
var React2 = __toESM(require_react());

// ../../node_modules/@datadog/browser-rum-react/esm/domain/performance/timer.js
function createTimer() {
  let duration;
  let startTime;
  let highPrecisionStartTime;
  return {
    startTimer() {
      startTime = timeStampNow();
      highPrecisionStartTime = relativeNow();
    },
    stopTimer() {
      duration = elapsed(highPrecisionStartTime, relativeNow());
    },
    getDuration() {
      return duration;
    },
    getStartTime() {
      return startTime;
    }
  };
}

// ../../node_modules/@datadog/browser-rum-react/esm/domain/performance/addDurationVital.js
var addDurationVital = (name, options) => {
  onRumInit((_, rumPublicApi) => {
    rumPublicApi.addDurationVital(name, options);
  });
};

// ../../node_modules/@datadog/browser-rum-react/esm/domain/performance/reactComponentTracker.js
var UNSTABLE_ReactComponentTracker = ({ name: componentName, children }) => {
  const isFirstRender = React2.useRef(true);
  const renderTimer = createTimer();
  const effectTimer = createTimer();
  const layoutEffectTimer = createTimer();
  const onEffectEnd = () => {
    var _a, _b, _c;
    const renderDuration = (_a = renderTimer.getDuration()) !== null && _a !== void 0 ? _a : 0;
    const effectDuration = (_b = effectTimer.getDuration()) !== null && _b !== void 0 ? _b : 0;
    const layoutEffectDuration = (_c = layoutEffectTimer.getDuration()) !== null && _c !== void 0 ? _c : 0;
    const totalRenderTime = renderDuration + effectDuration + layoutEffectDuration;
    addDurationVital("reactComponentRender", {
      description: componentName,
      startTime: renderTimer.getStartTime(),
      // note: renderTimer should have been started at this point, so getStartTime should not return undefined
      duration: totalRenderTime,
      context: {
        is_first_render: isFirstRender.current,
        render_phase_duration: renderDuration,
        effect_phase_duration: effectDuration,
        layout_effect_phase_duration: layoutEffectDuration,
        framework: "react"
      }
    });
    isFirstRender.current = false;
  };
  return React2.createElement(
    React2.Fragment,
    null,
    React2.createElement(LifeCycle, { onRender: renderTimer.startTimer, onLayoutEffect: layoutEffectTimer.startTimer, onEffect: effectTimer.startTimer }),
    children,
    React2.createElement(LifeCycle, { onRender: renderTimer.stopTimer, onLayoutEffect: layoutEffectTimer.stopTimer, onEffect: () => {
      effectTimer.stopTimer();
      onEffectEnd();
    } })
  );
};
function LifeCycle({ onRender, onLayoutEffect, onEffect }) {
  onRender();
  React2.useLayoutEffect(onLayoutEffect);
  React2.useEffect(onEffect);
  return null;
}
export {
  ErrorBoundary,
  UNSTABLE_ReactComponentTracker,
  addReactError,
  reactPlugin
};
//# sourceMappingURL=@datadog_browser-rum-react.js.map
