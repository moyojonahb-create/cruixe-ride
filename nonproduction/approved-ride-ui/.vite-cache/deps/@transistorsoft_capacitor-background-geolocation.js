import {
  __awaiter,
  __generator
} from "./chunk-S2OR4F2T.js";
import {
  registerPlugin
} from "./chunk-ZWH2WJAO.js";
import {
  __commonJS,
  __toESM
} from "./chunk-WOOG5QLI.js";

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/AuthorizationStatus.js
var require_AuthorizationStatus = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/AuthorizationStatus.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthorizationStatus = void 0;
    exports.AuthorizationStatus = {
      NotDetermined: 0,
      Restricted: 1,
      Denied: 2,
      Always: 3,
      WhenInUse: 4,
      DeniedAlways: 5
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/Permission.js
var require_Permission = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/Permission.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Permission = void 0;
    exports.Permission = {
      Location: "location",
      Motion: "motion"
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/LogLevel.js
var require_LogLevel = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/LogLevel.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LogLevel = void 0;
    exports.LogLevel = {
      Off: 0,
      Error: 1,
      Warning: 2,
      Info: 3,
      Debug: 4,
      Verbose: 5
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/DesiredAccuracy.js
var require_DesiredAccuracy = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/DesiredAccuracy.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DesiredAccuracy = void 0;
    exports.DesiredAccuracy = {
      Navigation: -2,
      High: -1,
      Medium: 10,
      Low: 100,
      VeryLow: 1e3,
      Lowest: 3e3
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/PersistMode.js
var require_PersistMode = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/PersistMode.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PersistMode = void 0;
    exports.PersistMode = {
      All: 2,
      Location: 1,
      Geofence: -1,
      None: 0
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/AuthorizationStrategy.js
var require_AuthorizationStrategy = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/AuthorizationStrategy.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthorizationStrategy = void 0;
    exports.AuthorizationStrategy = {
      Jwt: "jwt",
      Sas: "sas"
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/LocationRequest.js
var require_LocationRequest = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/LocationRequest.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocationRequest = void 0;
    exports.LocationRequest = {
      Always: "Always",
      WhenInUse: "WhenInUse",
      Any: "Any"
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/LocationFilterPolicy.js
var require_LocationFilterPolicy = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/LocationFilterPolicy.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocationFilterPolicy = void 0;
    exports.LocationFilterPolicy = {
      PassThrough: 0,
      Adjust: 1,
      Conservative: 2
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/KalmanProfile.js
var require_KalmanProfile = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/KalmanProfile.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KalmanProfile = void 0;
    exports.KalmanProfile = {
      Default: 0,
      Aggressive: 1,
      Conservative: 2
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/HttpMethod.js
var require_HttpMethod = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/HttpMethod.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HttpMethod = void 0;
    exports.HttpMethod = {
      Post: "POST",
      Put: "PUT",
      Patch: "PATCH"
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/TriggerActivity.js
var require_TriggerActivity = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/TriggerActivity.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TriggerActivity = void 0;
    exports.TriggerActivity = {
      Walking: "walking",
      OnFoot: "on_foot",
      Running: "running",
      OnBicycle: "on_bicycle",
      InVehicle: "in_vehicle"
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/NotificationPriority.js
var require_NotificationPriority = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/NotificationPriority.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationPriority = void 0;
    exports.NotificationPriority = {
      Default: 0,
      High: 1,
      Low: -1,
      Max: 2,
      Min: -2
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/MotionActivityType.js
var require_MotionActivityType = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/MotionActivityType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MotionActivityType = void 0;
    exports.MotionActivityType = {
      Still: "still",
      Walking: "walking",
      OnFoot: "on_foot",
      Running: "running",
      OnBicycle: "on_bicycle",
      InVehicle: "in_vehicle",
      Unknown: "unknown"
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/TrackingMode.js
var require_TrackingMode = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/TrackingMode.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TrackingMode = void 0;
    exports.TrackingMode = {
      Geofences: 0,
      Location: 1
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/AccuracyAuthorization.js
var require_AccuracyAuthorization = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/AccuracyAuthorization.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccuracyAuthorization = void 0;
    exports.AccuracyAuthorization = {
      Full: 0,
      Reduced: 1
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/LogLevelName.js
var require_LogLevelName = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/LogLevelName.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LogLevelName = void 0;
    exports.LogLevelName = {
      Debug: "debug",
      Notice: "notice",
      Info: "info",
      Warn: "warn",
      Error: "error"
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/GeofenceAction.js
var require_GeofenceAction = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/GeofenceAction.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GeofenceAction = void 0;
    exports.GeofenceAction = {
      Enter: "ENTER",
      Exit: "EXIT",
      Dwell: "DWELL"
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/Event.js
var require_Event = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/Event.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Event = void 0;
    exports.Event = {
      Boot: "boot",
      Terminate: "terminate",
      Location: "location",
      MotionChange: "motionchange",
      ActivityChange: "activitychange",
      LocationFilter: "locationfilter",
      Geofence: "geofence",
      GeofencesChange: "geofenceschange",
      Http: "http",
      Heartbeat: "heartbeat",
      ProviderChange: "providerchange",
      Schedule: "schedule",
      Notification: "notification",
      Authorization: "authorization",
      ConnectivityChange: "connectivitychange",
      EnabledChange: "enabledchange",
      PowerSaveChange: "powersavechange"
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/ActivityType.js
var require_ActivityType = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/ActivityType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActivityType = void 0;
    exports.ActivityType = {
      Other: 1,
      AutomotiveNavigation: 2,
      Fitness: 3,
      OtherNavigation: 4,
      Airborne: 5
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/LocationError.js
var require_LocationError = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/LocationError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocationError = void 0;
    exports.LocationError = {
      LocationUnknown: 0,
      PermissionDenied: 1,
      NetworkError: 2,
      BackgroundWhenInUse: 3,
      Timeout: 408,
      Cancelled: 499
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/LocationFilterReason.js
var require_LocationFilterReason = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/LocationFilterReason.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocationFilterReason = void 0;
    exports.LocationFilterReason = {
      LowAccuracy: "low-accuracy",
      ImpliedSpeed: "implied-speed",
      OutlierCapped: "outlier-capped",
      GeofenceSpuriousExit: "geofence-spurious-exit",
      GeofenceDuplicateEnter: "geofence-duplicate-enter"
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/SQLQueryOrder.js
var require_SQLQueryOrder = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/enums/SQLQueryOrder.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SQLQueryOrder = void 0;
    exports.SQLQueryOrder = {
      Asc: 1,
      Desc: -1
    };
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/data/Location.js
var require_Location = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/data/Location.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/data/Geofence.js
var require_Geofence = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/data/Geofence.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/data/DeviceInfo.js
var require_DeviceInfo = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/data/DeviceInfo.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/data/Sensors.js
var require_Sensors = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/data/Sensors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/Subscription.js
var require_Subscription = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/Subscription.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/GeofenceEvent.js
var require_GeofenceEvent = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/GeofenceEvent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/AuthorizationEvent.js
var require_AuthorizationEvent = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/AuthorizationEvent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/MotionActivityEvent.js
var require_MotionActivityEvent = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/MotionActivityEvent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/HeadlessEvent.js
var require_HeadlessEvent = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/HeadlessEvent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/HeartbeatEvent.js
var require_HeartbeatEvent = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/HeartbeatEvent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/GeofencesChangeEvent.js
var require_GeofencesChangeEvent = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/GeofencesChangeEvent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/ConnectivityChangeEvent.js
var require_ConnectivityChangeEvent = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/ConnectivityChangeEvent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/MotionChangeEvent.js
var require_MotionChangeEvent = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/MotionChangeEvent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/LocationFilterEvent.js
var require_LocationFilterEvent = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/LocationFilterEvent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/ProviderChangeEvent.js
var require_ProviderChangeEvent = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/ProviderChangeEvent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/HttpEvent.js
var require_HttpEvent = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/events/HttpEvent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/Config.js
var require_Config = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/Config.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/GeoConfig.js
var require_GeoConfig = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/GeoConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/HttpConfig.js
var require_HttpConfig = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/HttpConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/PersistenceConfig.js
var require_PersistenceConfig = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/PersistenceConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/ActivityConfig.js
var require_ActivityConfig = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/ActivityConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/AppConfig.js
var require_AppConfig = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/AppConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/LoggerConfig.js
var require_LoggerConfig = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/LoggerConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/AuthorizationConfig.js
var require_AuthorizationConfig = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/AuthorizationConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/NotificationConfig.js
var require_NotificationConfig = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/NotificationConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/LocationFilter.js
var require_LocationFilter = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/config/LocationFilter.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/BackgroundGeolocation.js
var require_BackgroundGeolocation = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/BackgroundGeolocation.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/State.js
var require_State = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/State.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/Logger.js
var require_Logger = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/Logger.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/DeviceSettings.js
var require_DeviceSettings = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/DeviceSettings.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/CurrentPositionRequest.js
var require_CurrentPositionRequest = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/CurrentPositionRequest.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/WatchPositionRequest.js
var require_WatchPositionRequest = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/WatchPositionRequest.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/LocationQuery.js
var require_LocationQuery = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/LocationQuery.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/TransistorAuthorizationService.js
var require_TransistorAuthorizationService = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/core/api/TransistorAuthorizationService.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../node_modules/@transistorsoft/background-geolocation-types/dist/index.js
var require_dist = __commonJS({
  "../../node_modules/@transistorsoft/background-geolocation-types/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_AuthorizationStatus(), exports);
    __exportStar(require_Permission(), exports);
    __exportStar(require_LogLevel(), exports);
    __exportStar(require_DesiredAccuracy(), exports);
    __exportStar(require_PersistMode(), exports);
    __exportStar(require_AuthorizationStrategy(), exports);
    __exportStar(require_LocationRequest(), exports);
    __exportStar(require_LocationFilterPolicy(), exports);
    __exportStar(require_KalmanProfile(), exports);
    __exportStar(require_HttpMethod(), exports);
    __exportStar(require_TriggerActivity(), exports);
    __exportStar(require_NotificationPriority(), exports);
    __exportStar(require_MotionActivityType(), exports);
    __exportStar(require_TrackingMode(), exports);
    __exportStar(require_AccuracyAuthorization(), exports);
    __exportStar(require_LogLevelName(), exports);
    __exportStar(require_GeofenceAction(), exports);
    __exportStar(require_Event(), exports);
    __exportStar(require_ActivityType(), exports);
    __exportStar(require_LocationError(), exports);
    __exportStar(require_LocationFilterReason(), exports);
    __exportStar(require_SQLQueryOrder(), exports);
    __exportStar(require_Location(), exports);
    __exportStar(require_Geofence(), exports);
    __exportStar(require_DeviceInfo(), exports);
    __exportStar(require_Sensors(), exports);
    __exportStar(require_Subscription(), exports);
    __exportStar(require_GeofenceEvent(), exports);
    __exportStar(require_AuthorizationEvent(), exports);
    __exportStar(require_MotionActivityEvent(), exports);
    __exportStar(require_HeadlessEvent(), exports);
    __exportStar(require_HeartbeatEvent(), exports);
    __exportStar(require_GeofencesChangeEvent(), exports);
    __exportStar(require_ConnectivityChangeEvent(), exports);
    __exportStar(require_MotionChangeEvent(), exports);
    __exportStar(require_LocationFilterEvent(), exports);
    __exportStar(require_ProviderChangeEvent(), exports);
    __exportStar(require_HttpEvent(), exports);
    __exportStar(require_Config(), exports);
    __exportStar(require_GeoConfig(), exports);
    __exportStar(require_HttpConfig(), exports);
    __exportStar(require_PersistenceConfig(), exports);
    __exportStar(require_ActivityConfig(), exports);
    __exportStar(require_AppConfig(), exports);
    __exportStar(require_LoggerConfig(), exports);
    __exportStar(require_AuthorizationConfig(), exports);
    __exportStar(require_NotificationConfig(), exports);
    __exportStar(require_LocationFilter(), exports);
    __exportStar(require_BackgroundGeolocation(), exports);
    __exportStar(require_State(), exports);
    __exportStar(require_Logger(), exports);
    __exportStar(require_DeviceSettings(), exports);
    __exportStar(require_CurrentPositionRequest(), exports);
    __exportStar(require_WatchPositionRequest(), exports);
    __exportStar(require_LocationQuery(), exports);
    __exportStar(require_TransistorAuthorizationService(), exports);
  }
});

// ../../node_modules/@transistorsoft/capacitor-background-geolocation/dist/index.js
var import_background_geolocation_types = __toESM(require_dist());
var NativeModule = registerPlugin("BackgroundGeolocation");
var LOGGER_LOG_LEVEL_DEBUG = "debug";
var LOGGER_LOG_LEVEL_NOTICE = "notice";
var LOGGER_LOG_LEVEL_INFO = "info";
var LOGGER_LOG_LEVEL_WARN = "warn";
var LOGGER_LOG_LEVEL_ERROR = "error";
var ORDER_ASC = 1;
var ORDER_DESC = -1;
function log(level, msg) {
  return NativeModule.log({
    level,
    message: msg
  });
}
function validateQuery(query) {
  if (typeof query !== "object")
    return {};
  if (query.hasOwnProperty("start") && isNaN(query.start)) {
    throw new Error("Invalid SQLQuery.start.  Expected unix timestamp but received: " + query.start);
  }
  if (query.hasOwnProperty("end") && isNaN(query.end)) {
    throw new Error("Invalid SQLQuery.end.  Expected unix timestamp but received: " + query.end);
  }
  return query;
}
var Logger = (
  /** @class */
  function() {
    function Logger2() {
    }
    Object.defineProperty(Logger2, "ORDER_ASC", {
      get: function() {
        return ORDER_ASC;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Logger2, "ORDER_DESC", {
      get: function() {
        return ORDER_DESC;
      },
      enumerable: false,
      configurable: true
    });
    Logger2.debug = function(msg) {
      return log(LOGGER_LOG_LEVEL_DEBUG, msg);
    };
    Logger2.error = function(msg) {
      return log(LOGGER_LOG_LEVEL_ERROR, msg);
    };
    Logger2.warn = function(msg) {
      return log(LOGGER_LOG_LEVEL_WARN, msg);
    };
    Logger2.info = function(msg) {
      return log(LOGGER_LOG_LEVEL_INFO, msg);
    };
    Logger2.notice = function(msg) {
      return log(LOGGER_LOG_LEVEL_NOTICE, msg);
    };
    Logger2.getLog = function(query) {
      query = validateQuery(query);
      return new Promise(function(resolve, reject) {
        NativeModule.getLog({ options: query }).then(function(result) {
          resolve(result.log);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    Logger2.destroyLog = function() {
      return new Promise(function(resolve, reject) {
        NativeModule.destroyLog().then(function() {
          resolve();
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    Logger2.emailLog = function(email, query) {
      query = validateQuery(query);
      return new Promise(function(resolve, reject) {
        NativeModule.emailLog({ email, query }).then(function(result) {
          resolve(result);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    Logger2.uploadLog = function(url, query) {
      query = validateQuery(query);
      return new Promise(function(resolve, reject) {
        NativeModule.uploadLog({ url, query }).then(function() {
          resolve();
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    return Logger2;
  }()
);
var DEFAULT_URL = "http://tracker.transistorsoft.com";
var DUMMY_TOKEN = "DUMMY_TOKEN";
var REFRESH_PAYLOAD = {
  refresh_token: "{refreshToken}"
};
var LOCATIONS_PATH = "/api/locations";
var REFRESH_TOKEN_PATH = "/api/refresh_token";
var TransistorAuthorizationToken = (
  /** @class */
  function() {
    function TransistorAuthorizationToken2() {
    }
    TransistorAuthorizationToken2.findOrCreate = function(orgname, username, url) {
      if (url === void 0) {
        url = DEFAULT_URL;
      }
      return new Promise(function(resolve, reject) {
        NativeModule.getTransistorToken({
          org: orgname,
          username,
          url
        }).then(function(result) {
          if (result.success) {
            var token = result.token;
            token.url = url;
            resolve(token);
          } else {
            console.warn("[TransistorAuthorizationToken findOrCreate] ERROR: ", result);
            if (result.status == "403") {
              reject(result);
              return;
            }
            resolve({
              accessToken: DUMMY_TOKEN,
              refreshToken: DUMMY_TOKEN,
              expires: -1,
              url
            });
          }
        }).catch(function(error) {
          reject(error);
        });
      });
    };
    TransistorAuthorizationToken2.destroy = function(url) {
      if (url === void 0) {
        url = DEFAULT_URL;
      }
      return new Promise(function(resolve, reject) {
        NativeModule.destroyTransistorToken({ url }).then(function() {
          resolve();
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    TransistorAuthorizationToken2.applyIf = function(config) {
      if (!config.transistorAuthorizationToken)
        return config;
      var token = config.transistorAuthorizationToken;
      delete config.transistorAuthorizationToken;
      if (!config.http) {
        config.http = {};
      }
      config.http.url = token.url + LOCATIONS_PATH;
      config.authorization = {
        strategy: "JWT",
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        refreshUrl: token.url + REFRESH_TOKEN_PATH,
        refreshPayload: REFRESH_PAYLOAD,
        expires: token.expires
      };
      return config;
    };
    return TransistorAuthorizationToken2;
  }()
);
var IGNORE_BATTERY_OPTIMIZATIONS = "IGNORE_BATTERY_OPTIMIZATIONS";
var POWER_MANAGER = "POWER_MANAGER";
var resolveSettingsRequest = function(resolve, request) {
  var lastSeenAt = request.lastSeenAt;
  if (lastSeenAt > 0) {
    request.lastSeenAt = new Date(lastSeenAt);
  }
  resolve(request);
};
var DeviceSettings = (
  /** @class */
  function() {
    function DeviceSettings2() {
    }
    DeviceSettings2.isIgnoringBatteryOptimizations = function() {
      return new Promise(function(resolve, reject) {
        NativeModule.isIgnoringBatteryOptimizations().then(function(result) {
          resolve(result.isIgnoringBatteryOptimizations);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    DeviceSettings2.showIgnoreBatteryOptimizations = function() {
      return new Promise(function(resolve, reject) {
        var args = { action: IGNORE_BATTERY_OPTIMIZATIONS };
        NativeModule.requestSettings(args).then(function(result) {
          resolveSettingsRequest(resolve, result);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    DeviceSettings2.showPowerManager = function() {
      return new Promise(function(resolve, reject) {
        var args = { action: POWER_MANAGER };
        NativeModule.requestSettings(args).then(function(result) {
          resolveSettingsRequest(resolve, result);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    DeviceSettings2.show = function(request) {
      return new Promise(function(resolve, reject) {
        var args = { action: request.action };
        NativeModule.showSettings(args).then(function() {
          resolve();
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    return DeviceSettings2;
  }()
);
var TAG = "TSLocationManager";
var EVENT_SUBSCRIPTIONS = [];
var WATCH_POSITION_SUBSCRIPTIONS = /* @__PURE__ */ new Map();
var Subscription = (
  /** @class */
  /* @__PURE__ */ function() {
    function Subscription2(event, subscription, callback) {
      this.event = event;
      this.subscription = subscription;
      this.callback = callback;
    }
    return Subscription2;
  }()
);
var LOG_LEVEL_OFF = import_background_geolocation_types.LogLevel.Off;
var LOG_LEVEL_ERROR = import_background_geolocation_types.LogLevel.Error;
var LOG_LEVEL_WARNING = import_background_geolocation_types.LogLevel.Warning;
var LOG_LEVEL_INFO = import_background_geolocation_types.LogLevel.Info;
var LOG_LEVEL_DEBUG = import_background_geolocation_types.LogLevel.Debug;
var LOG_LEVEL_VERBOSE = import_background_geolocation_types.LogLevel.Verbose;
var DESIRED_ACCURACY_NAVIGATION = import_background_geolocation_types.DesiredAccuracy.Navigation;
var DESIRED_ACCURACY_HIGH = import_background_geolocation_types.DesiredAccuracy.High;
var DESIRED_ACCURACY_MEDIUM = import_background_geolocation_types.DesiredAccuracy.Medium;
var DESIRED_ACCURACY_LOW = import_background_geolocation_types.DesiredAccuracy.Low;
var DESIRED_ACCURACY_VERY_LOW = import_background_geolocation_types.DesiredAccuracy.VeryLow;
var DESIRED_ACCURACY_LOWEST = import_background_geolocation_types.DesiredAccuracy.Lowest;
var AUTHORIZATION_STATUS_NOT_DETERMINED = import_background_geolocation_types.AuthorizationStatus.NotDetermined;
var AUTHORIZATION_STATUS_RESTRICTED = import_background_geolocation_types.AuthorizationStatus.Restricted;
var AUTHORIZATION_STATUS_DENIED = import_background_geolocation_types.AuthorizationStatus.Denied;
var AUTHORIZATION_STATUS_ALWAYS = import_background_geolocation_types.AuthorizationStatus.Always;
var AUTHORIZATION_STATUS_WHEN_IN_USE = import_background_geolocation_types.AuthorizationStatus.WhenInUse;
var NOTIFICATION_PRIORITY_DEFAULT = import_background_geolocation_types.NotificationPriority.Default;
var NOTIFICATION_PRIORITY_HIGH = import_background_geolocation_types.NotificationPriority.High;
var NOTIFICATION_PRIORITY_LOW = import_background_geolocation_types.NotificationPriority.Low;
var NOTIFICATION_PRIORITY_MAX = import_background_geolocation_types.NotificationPriority.Max;
var NOTIFICATION_PRIORITY_MIN = import_background_geolocation_types.NotificationPriority.Min;
var ACTIVITY_TYPE_OTHER = import_background_geolocation_types.ActivityType.Other;
var ACTIVITY_TYPE_AUTOMOTIVE_NAVIGATION = import_background_geolocation_types.ActivityType.AutomotiveNavigation;
var ACTIVITY_TYPE_FITNESS = import_background_geolocation_types.ActivityType.Fitness;
var ACTIVITY_TYPE_OTHER_NAVIGATION = import_background_geolocation_types.ActivityType.OtherNavigation;
var ACTIVITY_TYPE_AIRBORNE = import_background_geolocation_types.ActivityType.Airborne;
var LOCATION_AUTHORIZATION_ALWAYS = import_background_geolocation_types.LocationRequest.Always;
var LOCATION_AUTHORIZATION_WHEN_IN_USE = import_background_geolocation_types.LocationRequest.WhenInUse;
var LOCATION_AUTHORIZATION_ANY = import_background_geolocation_types.LocationRequest.Any;
var PERSIST_MODE_ALL = import_background_geolocation_types.PersistMode.All;
var PERSIST_MODE_LOCATION = import_background_geolocation_types.PersistMode.Location;
var PERSIST_MODE_GEOFENCE = import_background_geolocation_types.PersistMode.Geofence;
var PERSIST_MODE_NONE = import_background_geolocation_types.PersistMode.None;
var ACCURACY_AUTHORIZATION_FULL = import_background_geolocation_types.AccuracyAuthorization.Full;
var ACCURACY_AUTHORIZATION_REDUCED = import_background_geolocation_types.AccuracyAuthorization.Reduced;
var BackgroundGeolocation = (
  /** @class */
  function() {
    function BackgroundGeolocation2() {
    }
    Object.defineProperty(BackgroundGeolocation2, "LogLevel", {
      get: function() {
        return import_background_geolocation_types.LogLevel;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "DesiredAccuracy", {
      get: function() {
        return import_background_geolocation_types.DesiredAccuracy;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "PersistMode", {
      get: function() {
        return import_background_geolocation_types.PersistMode;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "AuthorizationStatus", {
      get: function() {
        return import_background_geolocation_types.AuthorizationStatus;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "Permission", {
      get: function() {
        return import_background_geolocation_types.Permission;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "AccuracyAuthorization", {
      get: function() {
        return import_background_geolocation_types.AccuracyAuthorization;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "AuthorizationStrategy", {
      get: function() {
        return import_background_geolocation_types.AuthorizationStrategy;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "LocationFilterPolicy", {
      get: function() {
        return import_background_geolocation_types.LocationFilterPolicy;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "KalmanProfile", {
      get: function() {
        return import_background_geolocation_types.KalmanProfile;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "HttpMethod", {
      get: function() {
        return import_background_geolocation_types.HttpMethod;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "TriggerActivity", {
      get: function() {
        return import_background_geolocation_types.TriggerActivity;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_BOOT", {
      /// Events
      get: function() {
        return import_background_geolocation_types.Event.Boot;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_TERMINATE", {
      get: function() {
        return import_background_geolocation_types.Event.Terminate;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_LOCATION", {
      get: function() {
        return import_background_geolocation_types.Event.Location;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_MOTIONCHANGE", {
      get: function() {
        return import_background_geolocation_types.Event.MotionChange;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_HTTP", {
      get: function() {
        return import_background_geolocation_types.Event.Http;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_HEARTBEAT", {
      get: function() {
        return import_background_geolocation_types.Event.Heartbeat;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_PROVIDERCHANGE", {
      get: function() {
        return import_background_geolocation_types.Event.ProviderChange;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_ACTIVITYCHANGE", {
      get: function() {
        return import_background_geolocation_types.Event.ActivityChange;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_LOCATIONFILTER", {
      get: function() {
        return import_background_geolocation_types.Event.LocationFilter;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_GEOFENCE", {
      get: function() {
        return import_background_geolocation_types.Event.Geofence;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_GEOFENCESCHANGE", {
      get: function() {
        return import_background_geolocation_types.Event.GeofencesChange;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_ENABLEDCHANGE", {
      get: function() {
        return import_background_geolocation_types.Event.EnabledChange;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_CONNECTIVITYCHANGE", {
      get: function() {
        return import_background_geolocation_types.Event.ConnectivityChange;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_SCHEDULE", {
      get: function() {
        return import_background_geolocation_types.Event.Schedule;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_POWERSAVECHANGE", {
      get: function() {
        return import_background_geolocation_types.Event.PowerSaveChange;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_NOTIFICATIONACTION", {
      get: function() {
        return "notificationaction";
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "EVENT_AUTHORIZATION", {
      get: function() {
        return import_background_geolocation_types.Event.Authorization;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "LOG_LEVEL_OFF", {
      get: function() {
        return LOG_LEVEL_OFF;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "LOG_LEVEL_ERROR", {
      get: function() {
        return LOG_LEVEL_ERROR;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "LOG_LEVEL_WARNING", {
      get: function() {
        return LOG_LEVEL_WARNING;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "LOG_LEVEL_INFO", {
      get: function() {
        return LOG_LEVEL_INFO;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "LOG_LEVEL_DEBUG", {
      get: function() {
        return LOG_LEVEL_DEBUG;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "LOG_LEVEL_VERBOSE", {
      get: function() {
        return LOG_LEVEL_VERBOSE;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "ACTIVITY_TYPE_OTHER", {
      get: function() {
        return ACTIVITY_TYPE_OTHER;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "ACTIVITY_TYPE_AUTOMOTIVE_NAVIGATION", {
      get: function() {
        return ACTIVITY_TYPE_AUTOMOTIVE_NAVIGATION;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "ACTIVITY_TYPE_FITNESS", {
      get: function() {
        return ACTIVITY_TYPE_FITNESS;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "ACTIVITY_TYPE_OTHER_NAVIGATION", {
      get: function() {
        return ACTIVITY_TYPE_OTHER_NAVIGATION;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "ACTIVITY_TYPE_AIRBORNE", {
      get: function() {
        return ACTIVITY_TYPE_AIRBORNE;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "DESIRED_ACCURACY_NAVIGATION", {
      get: function() {
        return DESIRED_ACCURACY_NAVIGATION;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "DESIRED_ACCURACY_HIGH", {
      get: function() {
        return DESIRED_ACCURACY_HIGH;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "DESIRED_ACCURACY_MEDIUM", {
      get: function() {
        return DESIRED_ACCURACY_MEDIUM;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "DESIRED_ACCURACY_LOW", {
      get: function() {
        return DESIRED_ACCURACY_LOW;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "DESIRED_ACCURACY_VERY_LOW", {
      get: function() {
        return DESIRED_ACCURACY_VERY_LOW;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "DESIRED_ACCURACY_LOWEST", {
      get: function() {
        return DESIRED_ACCURACY_LOWEST;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "AUTHORIZATION_STATUS_NOT_DETERMINED", {
      get: function() {
        return AUTHORIZATION_STATUS_NOT_DETERMINED;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "AUTHORIZATION_STATUS_RESTRICTED", {
      get: function() {
        return AUTHORIZATION_STATUS_RESTRICTED;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "AUTHORIZATION_STATUS_DENIED", {
      get: function() {
        return AUTHORIZATION_STATUS_DENIED;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "AUTHORIZATION_STATUS_ALWAYS", {
      get: function() {
        return AUTHORIZATION_STATUS_ALWAYS;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "AUTHORIZATION_STATUS_WHEN_IN_USE", {
      get: function() {
        return AUTHORIZATION_STATUS_WHEN_IN_USE;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "NOTIFICATION_PRIORITY_DEFAULT", {
      get: function() {
        return NOTIFICATION_PRIORITY_DEFAULT;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "NOTIFICATION_PRIORITY_HIGH", {
      get: function() {
        return NOTIFICATION_PRIORITY_HIGH;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "NOTIFICATION_PRIORITY_LOW", {
      get: function() {
        return NOTIFICATION_PRIORITY_LOW;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "NOTIFICATION_PRIORITY_MAX", {
      get: function() {
        return NOTIFICATION_PRIORITY_MAX;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "NOTIFICATION_PRIORITY_MIN", {
      get: function() {
        return NOTIFICATION_PRIORITY_MIN;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "LOCATION_AUTHORIZATION_ALWAYS", {
      get: function() {
        return LOCATION_AUTHORIZATION_ALWAYS;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "LOCATION_AUTHORIZATION_WHEN_IN_USE", {
      get: function() {
        return LOCATION_AUTHORIZATION_WHEN_IN_USE;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "LOCATION_AUTHORIZATION_ANY", {
      get: function() {
        return LOCATION_AUTHORIZATION_ANY;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "PERSIST_MODE_ALL", {
      get: function() {
        return PERSIST_MODE_ALL;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "PERSIST_MODE_LOCATION", {
      get: function() {
        return PERSIST_MODE_LOCATION;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "PERSIST_MODE_GEOFENCE", {
      get: function() {
        return PERSIST_MODE_GEOFENCE;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "PERSIST_MODE_NONE", {
      get: function() {
        return PERSIST_MODE_NONE;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "ACCURACY_AUTHORIZATION_FULL", {
      get: function() {
        return ACCURACY_AUTHORIZATION_FULL;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "ACCURACY_AUTHORIZATION_REDUCED", {
      get: function() {
        return ACCURACY_AUTHORIZATION_REDUCED;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "logger", {
      get: function() {
        return Logger;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BackgroundGeolocation2, "deviceSettings", {
      get: function() {
        return DeviceSettings;
      },
      enumerable: false,
      configurable: true
    });
    BackgroundGeolocation2.ready = function(config) {
      return NativeModule.ready({ options: config });
    };
    BackgroundGeolocation2.reset = function(config) {
      return NativeModule.reset({ options: config });
    };
    BackgroundGeolocation2.start = function() {
      return NativeModule.start();
    };
    BackgroundGeolocation2.stop = function() {
      return NativeModule.stop();
    };
    BackgroundGeolocation2.startSchedule = function() {
      return NativeModule.startSchedule();
    };
    BackgroundGeolocation2.stopSchedule = function() {
      return NativeModule.stopSchedule();
    };
    BackgroundGeolocation2.startGeofences = function() {
      return NativeModule.startGeofences();
    };
    BackgroundGeolocation2.setConfig = function(config) {
      return NativeModule.setConfig({ options: config });
    };
    BackgroundGeolocation2.getState = function() {
      return NativeModule.getState();
    };
    BackgroundGeolocation2.changePace = function(isMoving) {
      return new Promise(function(resolve, reject) {
        NativeModule.changePace({ isMoving }).then(function() {
          resolve();
        }).catch(function(error) {
          reject(error.errorMessage);
        });
      });
    };
    BackgroundGeolocation2.getCurrentPosition = function(options) {
      options = options || {};
      return new Promise(function(resolve, reject) {
        NativeModule.getCurrentPosition({ options }).then(function(result) {
          resolve(result);
        }).catch(function(error) {
          reject(error.code);
        });
      });
    };
    BackgroundGeolocation2.watchPosition = function(options, onLocation, onError) {
      options = options || {};
      var isRemoved = false;
      var nativeWatchId = null;
      var subscriptionProxy = {
        remove: function() {
          isRemoved = true;
          if (nativeWatchId !== null) {
            var listener = WATCH_POSITION_SUBSCRIPTIONS.get(nativeWatchId);
            if (listener) {
              listener.remove();
              WATCH_POSITION_SUBSCRIPTIONS.delete(nativeWatchId);
            }
            NativeModule.stopWatchPosition({ watchId: nativeWatchId });
            nativeWatchId = null;
          }
        }
      };
      var handler = function(response) {
        if (response.hasOwnProperty("error") && response.error != null) {
          if (typeof onError === "function") {
            onError(response.error.code);
          } else {
            console.warn("[BackgroundGeolocation watchPosition] DEFAULT ERROR HANDLER.  Provide an onError callback to watchPosition to receive this message: ", response.error);
          }
        } else {
          onLocation(response);
        }
      };
      NativeModule.addListener("watchposition", handler).then(function(listener) {
        NativeModule.watchPosition({ options }).then(function(result) {
          nativeWatchId = result.watchId;
          if (isRemoved) {
            listener.remove();
            NativeModule.stopWatchPosition({ watchId: nativeWatchId });
          } else {
            WATCH_POSITION_SUBSCRIPTIONS.set(nativeWatchId, listener);
          }
        }).catch(function() {
          listener.remove();
        });
      });
      return subscriptionProxy;
    };
    BackgroundGeolocation2.stopWatchPosition = function(watchId) {
      if (watchId !== void 0) {
        var listener = WATCH_POSITION_SUBSCRIPTIONS.get(watchId);
        if (listener) {
          listener.remove();
          WATCH_POSITION_SUBSCRIPTIONS.delete(watchId);
        }
        NativeModule.stopWatchPosition({ watchId });
      }
    };
    BackgroundGeolocation2.requestPermission = function(permission) {
      return new Promise(function(resolve, reject) {
        NativeModule.requestPermission({ permission: permission !== null && permission !== void 0 ? permission : null }).then(function(result) {
          if (result.success) {
            resolve(result.status);
          } else {
            reject(result.status);
          }
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.requestTemporaryFullAccuracy = function(purpose) {
      return new Promise(function(resolve, reject) {
        NativeModule.requestTemporaryFullAccuracy({ purpose }).then(function(result) {
          resolve(result.accuracyAuthorization);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.getProviderState = function() {
      return NativeModule.getProviderState();
    };
    BackgroundGeolocation2.getLocations = function(query) {
      return new Promise(function(resolve, reject) {
        NativeModule.getLocations({ options: query }).then(function(result) {
          resolve(result.locations);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.insertLocation = function(params) {
      return new Promise(function(resolve, reject) {
        NativeModule.insertLocation({ options: params }).then(function(result) {
          resolve(result.uuid);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.destroyLocations = function() {
      return new Promise(function(resolve, reject) {
        NativeModule.destroyLocations().then(function() {
          resolve();
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.destroyLocation = function(uuid) {
      return new Promise(function(resolve, reject) {
        NativeModule.destroyLocation({ uuid }).then(function() {
          resolve();
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.getCount = function() {
      return new Promise(function(resolve, reject) {
        NativeModule.getCount().then(function(result) {
          resolve(result.count);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.sync = function() {
      return new Promise(function(resolve, reject) {
        NativeModule.sync().then(function(result) {
          resolve(result.locations);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.addGeofence = function(params) {
      return new Promise(function(resolve, reject) {
        NativeModule.addGeofence({ options: params }).then(function() {
          resolve();
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.addGeofences = function(params) {
      return new Promise(function(resolve, reject) {
        NativeModule.addGeofences({ options: params }).then(function() {
          resolve();
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.getGeofences = function() {
      return new Promise(function(resolve, reject) {
        NativeModule.getGeofences().then(function(result) {
          resolve(result.geofences);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.getGeofence = function(identifier) {
      return new Promise(function(resolve, reject) {
        if (identifier === null) {
          reject("identifier is null");
          return;
        }
        NativeModule.getGeofence({ identifier }).then(function(result) {
          resolve(result);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.geofenceExists = function(identifier) {
      return new Promise(function(resolve, reject) {
        if (identifier === null) {
          reject("identifier is null");
          return;
        }
        NativeModule.geofenceExists({ identifier }).then(function(result) {
          resolve(result.exists);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.removeGeofence = function(identifier) {
      return new Promise(function(resolve, reject) {
        if (identifier === null) {
          reject("identifier is null");
          return;
        }
        NativeModule.removeGeofence({ identifier }).then(function() {
          resolve();
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.removeGeofences = function(identifiers) {
      identifiers = identifiers || [];
      return new Promise(function(resolve, reject) {
        NativeModule.removeGeofences({ identifiers }).then(function() {
          resolve();
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.getOdometer = function() {
      return new Promise(function(resolve, reject) {
        NativeModule.getOdometer().then(function(result) {
          resolve(result.odometer);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.setOdometer = function(value) {
      return new Promise(function(resolve, reject) {
        NativeModule.setOdometer({ "odometer": value }).then(function(result) {
          resolve(result);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.resetOdometer = function() {
      return BackgroundGeolocation2.setOdometer(0);
    };
    BackgroundGeolocation2.startBackgroundTask = function() {
      return new Promise(function(resolve, reject) {
        NativeModule.startBackgroundTask().then(function(result) {
          resolve(result.taskId);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.stopBackgroundTask = function(taskId) {
      return new Promise(function(resolve, reject) {
        NativeModule.stopBackgroundTask({ taskId }).then(function() {
          resolve();
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.finish = function(taskId) {
      return BackgroundGeolocation2.stopBackgroundTask(taskId);
    };
    BackgroundGeolocation2.getDeviceInfo = function() {
      return NativeModule.getDeviceInfo();
    };
    BackgroundGeolocation2.playSound = function(soundId) {
      return NativeModule.playSound({ soundId });
    };
    BackgroundGeolocation2.isPowerSaveMode = function() {
      return new Promise(function(resolve, reject) {
        NativeModule.isPowerSaveMode().then(function(result) {
          resolve(result.isPowerSaveMode);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    };
    BackgroundGeolocation2.getSensors = function() {
      return NativeModule.getSensors();
    };
    BackgroundGeolocation2.findOrCreateTransistorAuthorizationToken = function(orgname, username, url) {
      return TransistorAuthorizationToken.findOrCreate(orgname, username, url);
    };
    BackgroundGeolocation2.destroyTransistorAuthorizationToken = function(url) {
      return TransistorAuthorizationToken.destroy(url);
    };
    BackgroundGeolocation2.onLocation = function(cb, onError) {
      return BackgroundGeolocation2.addListener(import_background_geolocation_types.Event.Location, cb, onError);
    };
    BackgroundGeolocation2.onMotionChange = function(cb) {
      return BackgroundGeolocation2.addListener(import_background_geolocation_types.Event.MotionChange, cb);
    };
    BackgroundGeolocation2.onHttp = function(cb) {
      return BackgroundGeolocation2.addListener(import_background_geolocation_types.Event.Http, cb);
    };
    BackgroundGeolocation2.onHeartbeat = function(cb) {
      return BackgroundGeolocation2.addListener(import_background_geolocation_types.Event.Heartbeat, cb);
    };
    BackgroundGeolocation2.onProviderChange = function(cb) {
      return BackgroundGeolocation2.addListener(import_background_geolocation_types.Event.ProviderChange, cb);
    };
    BackgroundGeolocation2.onActivityChange = function(cb) {
      return BackgroundGeolocation2.addListener(import_background_geolocation_types.Event.ActivityChange, cb);
    };
    BackgroundGeolocation2.onLocationFilter = function(cb) {
      return BackgroundGeolocation2.addListener(import_background_geolocation_types.Event.LocationFilter, cb);
    };
    BackgroundGeolocation2.onGeofence = function(cb) {
      return BackgroundGeolocation2.addListener(import_background_geolocation_types.Event.Geofence, cb);
    };
    BackgroundGeolocation2.onGeofencesChange = function(cb) {
      return BackgroundGeolocation2.addListener(import_background_geolocation_types.Event.GeofencesChange, cb);
    };
    BackgroundGeolocation2.onSchedule = function(cb) {
      return BackgroundGeolocation2.addListener(import_background_geolocation_types.Event.Schedule, cb);
    };
    BackgroundGeolocation2.onEnabledChange = function(cb) {
      return BackgroundGeolocation2.addListener(import_background_geolocation_types.Event.EnabledChange, cb);
    };
    BackgroundGeolocation2.onConnectivityChange = function(cb) {
      return BackgroundGeolocation2.addListener(import_background_geolocation_types.Event.ConnectivityChange, cb);
    };
    BackgroundGeolocation2.onPowerSaveChange = function(cb) {
      return BackgroundGeolocation2.addListener(import_background_geolocation_types.Event.PowerSaveChange, cb);
    };
    BackgroundGeolocation2.onNotificationAction = function(cb) {
      return BackgroundGeolocation2.addListener("notificationaction", cb);
    };
    BackgroundGeolocation2.onAuthorization = function(cb) {
      return BackgroundGeolocation2.addListener(import_background_geolocation_types.Event.Authorization, cb);
    };
    BackgroundGeolocation2.addListener = function(event, success, failure) {
      var handler = function(response) {
        if (response.hasOwnProperty("value")) {
          response = response.value;
        }
        if (response.hasOwnProperty("error") && response.error != null) {
          if (typeof failure === "function") {
            failure(response.error);
          } else {
            success(response);
          }
        } else {
          success(response);
        }
      };
      var isRemoved = false;
      var subscriptionProxy = {
        remove: function() {
          isRemoved = true;
          console.warn("[BackgroundGeolocation.addListener] Unexpected call to subscription.remove() on subscriptionProxy.  Waiting for NativeModule.addListener to resolve.");
        }
      };
      NativeModule.addListener(event, handler).then(function(listener) {
        var subscription = new Subscription(event, listener, success);
        EVENT_SUBSCRIPTIONS.push(subscription);
        subscriptionProxy.remove = function() {
          listener.remove();
          if (EVENT_SUBSCRIPTIONS.indexOf(subscription) >= 0) {
            EVENT_SUBSCRIPTIONS.splice(EVENT_SUBSCRIPTIONS.indexOf(subscription), 1);
          }
        };
        if (isRemoved) {
          subscriptionProxy.remove();
        }
      });
      return subscriptionProxy;
    };
    BackgroundGeolocation2.removeListener = function(event, callback) {
      console.warn("BackgroundGeolocation.removeListener is deprecated.  Event-listener methods (eg: onLocation) now return a Subscription instance.  Call subscription.remove() on the returned subscription instead.  Eg:\nconst subscription = BackgroundGeolocation.onLocation(myLocationHandler)\n...\nsubscription.remove()");
      return new Promise(function(resolve, reject) {
        var found = null;
        for (var n = 0, len = EVENT_SUBSCRIPTIONS.length; n < len; n++) {
          var sub = EVENT_SUBSCRIPTIONS[n];
          if (sub.event === event && sub.callback === callback) {
            found = sub;
            break;
          }
        }
        if (found !== null) {
          EVENT_SUBSCRIPTIONS.splice(EVENT_SUBSCRIPTIONS.indexOf(found), 1);
          found.subscription.remove();
          resolve();
        } else {
          console.warn(TAG + " Failed to find listener for event " + event);
          reject();
        }
      });
    };
    BackgroundGeolocation2.removeListeners = function() {
      var _this = this;
      return new Promise(function(resolve) {
        return __awaiter(_this, void 0, void 0, function() {
          return __generator(this, function(_a) {
            switch (_a.label) {
              case 0:
                EVENT_SUBSCRIPTIONS = [];
                return [4, NativeModule.removeAllEventListeners()];
              case 1:
                _a.sent();
                resolve();
                return [
                  2
                  /*return*/
                ];
            }
          });
        });
      });
    };
    return BackgroundGeolocation2;
  }()
);
var dist_default = BackgroundGeolocation;
var export_AccuracyAuthorization = import_background_geolocation_types.AccuracyAuthorization;
var export_ActivityType = import_background_geolocation_types.ActivityType;
var export_AuthorizationStatus = import_background_geolocation_types.AuthorizationStatus;
var export_AuthorizationStrategy = import_background_geolocation_types.AuthorizationStrategy;
var export_DesiredAccuracy = import_background_geolocation_types.DesiredAccuracy;
var export_Event = import_background_geolocation_types.Event;
var export_HttpMethod = import_background_geolocation_types.HttpMethod;
var export_KalmanProfile = import_background_geolocation_types.KalmanProfile;
var export_LocationFilterPolicy = import_background_geolocation_types.LocationFilterPolicy;
var export_LocationRequest = import_background_geolocation_types.LocationRequest;
var export_LogLevel = import_background_geolocation_types.LogLevel;
var export_NotificationPriority = import_background_geolocation_types.NotificationPriority;
var export_Permission = import_background_geolocation_types.Permission;
var export_PersistMode = import_background_geolocation_types.PersistMode;
var export_TriggerActivity = import_background_geolocation_types.TriggerActivity;
export {
  export_AccuracyAuthorization as AccuracyAuthorization,
  export_ActivityType as ActivityType,
  export_AuthorizationStatus as AuthorizationStatus,
  export_AuthorizationStrategy as AuthorizationStrategy,
  export_DesiredAccuracy as DesiredAccuracy,
  export_Event as Event,
  export_HttpMethod as HttpMethod,
  export_KalmanProfile as KalmanProfile,
  export_LocationFilterPolicy as LocationFilterPolicy,
  export_LocationRequest as LocationRequest,
  export_LogLevel as LogLevel,
  export_NotificationPriority as NotificationPriority,
  export_Permission as Permission,
  export_PersistMode as PersistMode,
  export_TriggerActivity as TriggerActivity,
  dist_default as default
};
//# sourceMappingURL=@transistorsoft_capacitor-background-geolocation.js.map
