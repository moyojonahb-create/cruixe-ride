import {
  addRecord,
  addSegment,
  addWroteData,
  getSegmentsCount
} from "./chunk-XDWVSTTV.js";
import {
  CENSORED_IMG_MARK,
  CENSORED_STRING_MARK,
  NodePrivacyLevel,
  PRIVACY_ATTR_NAME,
  PRIVACY_ATTR_VALUE_HIDDEN,
  forEachChildNodes,
  getMutationObserverConstructor,
  getNodePrivacyLevel,
  getNodeSelfPrivacyLevel,
  getParentNode,
  getScrollX,
  getScrollY,
  getTextContent,
  getViewportDimension,
  hasChildNodes,
  initViewportObservable,
  isElementNode,
  isNodeShadowHost,
  isNodeShadowRoot,
  reducePrivacyLevel,
  sanitizeIfLongDataUrl,
  shouldMaskAttribute,
  shouldMaskNode
} from "./chunk-6LMWSHFG.js";
import {
  ExperimentalFeature,
  ONE_SECOND,
  Observable,
  addEventListener,
  addEventListeners,
  addTelemetryDebug,
  addTelemetryMetrics,
  buildUrl,
  canUseEventBridge,
  clearTimeout,
  createHttpRequest,
  elapsed,
  getEventBridge,
  instrumentMethod,
  instrumentSetter,
  isExperimentalFeatureEnabled,
  isPageExitReason,
  isSafari,
  monitor,
  noop,
  requestIdleCallback,
  sendToExtension,
  setTimeout,
  throttle,
  timeStampNow
} from "./chunk-4TAEVATQ.js";
import "./chunk-WOOG5QLI.js";

// ../../node_modules/@datadog/browser-rum/esm/types/sessionReplayConstants.js
var RecordType = {
  FullSnapshot: 2,
  IncrementalSnapshot: 3,
  Meta: 4,
  Focus: 6,
  ViewEnd: 7,
  VisualViewport: 8,
  FrustrationRecord: 9,
  Change: 12
};
var NodeType = {
  Document: 0,
  DocumentType: 1,
  Element: 2,
  Text: 3,
  CDATA: 4,
  DocumentFragment: 11
};
var ChangeType = {
  AddString: 0,
  AddNode: 1,
  RemoveNode: 2,
  Attribute: 3,
  Text: 4,
  Size: 5,
  ScrollPosition: 6,
  AddStyleSheet: 7,
  AttachedStyleSheets: 8,
  MediaPlaybackState: 9,
  VisualViewport: 10
};
var IncrementalSource = {
  Mutation: 0,
  MouseMove: 1,
  MouseInteraction: 2,
  Scroll: 3,
  ViewportResize: 4,
  Input: 5,
  TouchMove: 6,
  MediaInteraction: 7,
  StyleSheetRule: 8
  // CanvasMutation : 9,
  // Font : 10,
};
var MouseInteractionType = {
  MouseUp: 0,
  MouseDown: 1,
  Click: 2,
  ContextMenu: 3,
  DblClick: 4,
  Focus: 5,
  Blur: 6,
  TouchStart: 7,
  TouchEnd: 9
};
var MediaInteractionType = {
  Play: 0,
  Pause: 1
};

// ../../node_modules/@datadog/browser-rum/esm/domain/record/itemIds.js
function createEventIds() {
  return createWeakIdMap(
    1
    /* EventIdConstants.FIRST_ID */
  );
}
function createNodeIds() {
  return createWeakIdMap(
    0
    /* NodeIdConstants.FIRST_ID */
  );
}
function createStringIds() {
  return createIdMap(
    0
    /* StringIdConstants.FIRST_ID */
  );
}
function createStyleSheetIds() {
  return createWeakIdMap(
    0
    /* StyleSheetIdConstants.FIRST_ID */
  );
}
function createIdMap(firstId) {
  return createItemIds(() => /* @__PURE__ */ new Map(), firstId);
}
function createWeakIdMap(firstId) {
  return createItemIds(() => /* @__PURE__ */ new WeakMap(), firstId);
}
function createItemIds(createMap, firstId) {
  let map = createMap();
  let nextId = firstId;
  const get = (object) => map.get(object);
  return {
    clear() {
      if (nextId === firstId) {
        return;
      }
      map = createMap();
      nextId = firstId;
    },
    delete(object) {
      map.delete(object);
    },
    get,
    getOrInsert(object) {
      let id = get(object);
      if (id === void 0) {
        id = nextId++;
        map.set(object, id);
      }
      return id;
    },
    get nextId() {
      return nextId;
    },
    get size() {
      return nextId - firstId;
    }
  };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/experimentalFeatures.js
function isFullSnapshotChangeRecordsEnabled() {
  return isExperimentalFeatureEnabled(ExperimentalFeature.USE_CHANGE_RECORDS) || isExperimentalFeatureEnabled(ExperimentalFeature.USE_INCREMENTAL_CHANGE_RECORDS);
}
function isIncrementalSnapshotChangeRecordsEnabled() {
  return isExperimentalFeatureEnabled(ExperimentalFeature.USE_INCREMENTAL_CHANGE_RECORDS);
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/insertionCursor.js
function createRootInsertionCursor(nodeIds) {
  return createInsertionCursor(void 0, void 0, nodeIds);
}
function createChildInsertionCursor(parentId, nextSiblingId, nodeIds) {
  return createInsertionCursor(parentId, nextSiblingId, nodeIds);
}
function createInsertionCursor(parentId, nextSiblingId, nodeIds) {
  let cursor = {
    container: void 0,
    parentId,
    previousSiblingId: void 0,
    nextSiblingId
  };
  const computeInsertionPoint = (nodeId) => {
    if (cursor.previousSiblingId === nodeId - 1) {
      return 0;
    }
    if (cursor.nextSiblingId !== void 0) {
      return cursor.nextSiblingId - nodeId;
    }
    if (cursor.parentId !== void 0) {
      return nodeId - cursor.parentId;
    }
    return null;
  };
  return {
    advance(node) {
      const nodeId = nodeIds.getOrInsert(node);
      const insertionPoint = computeInsertionPoint(nodeId);
      cursor.previousSiblingId = nodeId;
      return { nodeId, insertionPoint };
    },
    ascend() {
      if (cursor.container) {
        cursor = cursor.container;
      }
    },
    descend() {
      if (cursor.previousSiblingId !== void 0) {
        cursor = {
          container: cursor,
          parentId: cursor.previousSiblingId,
          previousSiblingId: void 0,
          nextSiblingId: void 0
        };
      }
    }
  };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/serializationUtils.js
function getElementInputValue(element, nodePrivacyLevel) {
  const tagName = element.tagName;
  const value = element.value;
  if (shouldMaskNode(element, nodePrivacyLevel)) {
    const type = element.type;
    if (tagName === "INPUT" && (type === "button" || type === "submit" || type === "reset")) {
      return value;
    } else if (!value || tagName === "OPTION") {
      return;
    }
    return CENSORED_STRING_MARK;
  }
  if (tagName === "OPTION" || tagName === "SELECT") {
    return element.value;
  }
  if (tagName !== "INPUT" && tagName !== "TEXTAREA") {
    return;
  }
  return value;
}
var URL_IN_CSS_REF = /url\((?:(')([^']*)'|(")([^"]*)"|([^)]*))\)/gm;
var ABSOLUTE_URL = /^[A-Za-z]+:|^\/\//;
var DATA_URI = /^["']?data:.*,/i;
function switchToAbsoluteUrl(cssText, cssHref) {
  return cssText.replace(URL_IN_CSS_REF, (matchingSubstring, singleQuote, urlWrappedInSingleQuotes, doubleQuote, urlWrappedInDoubleQuotes, urlNotWrappedInQuotes) => {
    const url = urlWrappedInSingleQuotes || urlWrappedInDoubleQuotes || urlNotWrappedInQuotes;
    if (!cssHref || !url || ABSOLUTE_URL.test(url) || DATA_URI.test(url)) {
      return matchingSubstring;
    }
    const quote = singleQuote || doubleQuote || "";
    return `url(${quote}${makeUrlAbsolute(url, cssHref)}${quote})`;
  });
}
function makeUrlAbsolute(url, baseUrl) {
  try {
    return buildUrl(url, baseUrl).href;
  } catch (_a) {
    return url;
  }
}
var TAG_NAME_REGEX = /[^a-z1-6-_]/;
function getValidTagName(tagName) {
  const processedTagName = tagName.toLowerCase().trim();
  if (TAG_NAME_REGEX.test(processedTagName)) {
    return "div";
  }
  return processedTagName;
}
function normalizedTagName(element) {
  return element.tagName.toLowerCase();
}
function censoredImageForSize(width, height) {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' style='background-color:silver'%3E%3C/svg%3E`;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/serializeStyleSheets.js
function serializeStyleSheets(cssStyleSheets, transaction) {
  if (cssStyleSheets === void 0 || cssStyleSheets.length === 0) {
    return void 0;
  }
  const serializeStylesheet = (cssStyleSheet) => {
    const rules = cssStyleSheet.cssRules || cssStyleSheet.rules;
    const cssRules = Array.from(rules, (cssRule) => cssRule.cssText);
    transaction.addMetric("cssText", cssRules.reduce((totalLength, rule) => totalLength + rule.length, 0));
    const styleSheet = {
      cssRules,
      disabled: cssStyleSheet.disabled || void 0,
      media: cssStyleSheet.media.length > 0 ? Array.from(cssStyleSheet.media) : void 0
    };
    return styleSheet;
  };
  const styleSheets = [];
  for (let index = 0; index < cssStyleSheets.length; index++) {
    styleSheets.push(serializeStylesheet(cssStyleSheets[index]));
  }
  return styleSheets;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/serializeAttribute.js
var MAX_ATTRIBUTE_VALUE_CHAR_LENGTH = 1e6;
function serializeAttribute(element, nodePrivacyLevel, attributeName, configuration) {
  if (nodePrivacyLevel === NodePrivacyLevel.HIDDEN) {
    return null;
  }
  const attributeValue = element.getAttribute(attributeName);
  const tagName = element.tagName;
  if (shouldMaskAttribute(tagName, attributeName, attributeValue, nodePrivacyLevel, configuration)) {
    if (tagName === "IMG") {
      const image = element;
      if (image.naturalWidth > 0) {
        return censoredImageForSize(image.naturalWidth, image.naturalHeight);
      }
      const { width, height } = element.getBoundingClientRect();
      if (width > 0 || height > 0) {
        return censoredImageForSize(width, height);
      }
      return CENSORED_IMG_MARK;
    }
    if (tagName === "SOURCE") {
      return CENSORED_IMG_MARK;
    }
    return CENSORED_STRING_MARK;
  }
  if (!attributeValue) {
    return attributeValue;
  }
  return sanitizeIfLongDataUrl(attributeValue, MAX_ATTRIBUTE_VALUE_CHAR_LENGTH);
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/serializeAttributes.js
function serializeAttributes(element, nodePrivacyLevel, transaction) {
  return {
    ...serializeDOMAttributes(element, nodePrivacyLevel, transaction),
    ...serializeVirtualAttributes(element, nodePrivacyLevel, transaction)
  };
}
function serializeDOMAttributes(element, nodePrivacyLevel, transaction) {
  if (nodePrivacyLevel === NodePrivacyLevel.HIDDEN) {
    return {};
  }
  const attrs = {};
  const tagName = normalizedTagName(element);
  for (let i = 0; i < element.attributes.length; i += 1) {
    const attribute = element.attributes.item(i);
    const attributeName = attribute.name;
    const attributeValue = serializeAttribute(element, nodePrivacyLevel, attributeName, transaction.scope.configuration);
    if (attributeValue !== null) {
      attrs[attributeName] = attributeValue;
    }
  }
  if (element.value && (tagName === "textarea" || tagName === "select" || tagName === "option" || tagName === "input")) {
    const formValue = getElementInputValue(element, nodePrivacyLevel);
    if (formValue !== void 0) {
      attrs.value = formValue;
    }
  }
  if (tagName === "option") {
    const optionElement = element;
    if (optionElement.selected && !shouldMaskNode(optionElement, nodePrivacyLevel)) {
      attrs.selected = "";
    } else {
      delete attrs.selected;
    }
  }
  const inputElement = element;
  if (tagName === "input" && (inputElement.type === "radio" || inputElement.type === "checkbox")) {
    if (inputElement.checked && !shouldMaskNode(inputElement, nodePrivacyLevel)) {
      attrs.checked = "";
    } else {
      delete attrs.checked;
    }
  }
  return attrs;
}
function serializeVirtualAttributes(element, nodePrivacyLevel, transaction) {
  if (nodePrivacyLevel === NodePrivacyLevel.HIDDEN) {
    return {};
  }
  const attrs = {};
  const doc = element.ownerDocument;
  const tagName = normalizedTagName(element);
  if (tagName === "link") {
    const stylesheet = Array.from(doc.styleSheets).find((s) => s.href === element.href);
    const cssText = getCssRulesString(stylesheet);
    if (cssText && stylesheet) {
      transaction.addMetric("cssText", cssText.length);
      attrs._cssText = cssText;
    }
  }
  if (tagName === "style" && element.sheet) {
    const cssText = getCssRulesString(element.sheet);
    if (cssText) {
      transaction.addMetric("cssText", cssText.length);
      attrs._cssText = cssText;
    }
  }
  if (tagName === "audio" || tagName === "video") {
    const mediaElement = element;
    attrs.rr_mediaState = mediaElement.paused ? "paused" : "played";
  }
  let scrollTop;
  let scrollLeft;
  switch (transaction.kind) {
    case 0:
      scrollTop = Math.round(element.scrollTop);
      scrollLeft = Math.round(element.scrollLeft);
      if (scrollTop || scrollLeft) {
        transaction.scope.elementsScrollPositions.set(element, { scrollTop, scrollLeft });
      }
      break;
    case 1:
      if (transaction.scope.elementsScrollPositions.has(element)) {
        ;
        ({ scrollTop, scrollLeft } = transaction.scope.elementsScrollPositions.get(element));
      }
      break;
  }
  if (scrollLeft) {
    attrs.rr_scrollLeft = scrollLeft;
  }
  if (scrollTop) {
    attrs.rr_scrollTop = scrollTop;
  }
  return attrs;
}
function getCssRulesString(cssStyleSheet) {
  if (!cssStyleSheet) {
    return null;
  }
  let rules;
  try {
    rules = cssStyleSheet.rules || cssStyleSheet.cssRules;
  } catch (_a) {
  }
  if (!rules) {
    return null;
  }
  const styleSheetCssText = Array.from(rules, isSafari() ? getCssRuleStringForSafari : getCssRuleString).join("");
  return switchToAbsoluteUrl(styleSheetCssText, cssStyleSheet.href);
}
function getCssRuleStringForSafari(rule) {
  if (isCSSStyleRule(rule) && rule.selectorText.includes(":")) {
    const escapeColon = /(\[[\w-]+[^\\])(:[^\]]+\])/g;
    return rule.cssText.replace(escapeColon, "$1\\$2");
  }
  return getCssRuleString(rule);
}
function getCssRuleString(rule) {
  return isCSSImportRule(rule) && getCssRulesString(rule.styleSheet) || rule.cssText;
}
function isCSSImportRule(rule) {
  return "styleSheet" in rule;
}
function isCSSStyleRule(rule) {
  return "selectorText" in rule;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/serializeNode.js
function serializeNode(node, parentNodePrivacyLevel, transaction) {
  switch (node.nodeType) {
    case node.DOCUMENT_NODE:
      return serializeDocumentNode(node, parentNodePrivacyLevel, transaction);
    case node.DOCUMENT_FRAGMENT_NODE:
      return serializeDocumentFragmentNode(node, parentNodePrivacyLevel, transaction);
    case node.DOCUMENT_TYPE_NODE:
      return serializeDocumentTypeNode(node, transaction);
    case node.ELEMENT_NODE:
      return serializeElementNode(node, parentNodePrivacyLevel, transaction);
    case node.TEXT_NODE:
      return serializeTextNode(node, parentNodePrivacyLevel, transaction);
    case node.CDATA_SECTION_NODE:
      return serializeCDataNode(node, transaction);
    default:
      return null;
  }
}
function serializeChildNodes(node, parentNodePrivacyLevel, transaction) {
  const result = [];
  forEachChildNodes(node, (childNode) => {
    const serializedChildNode = serializeNode(childNode, parentNodePrivacyLevel, transaction);
    if (serializedChildNode) {
      result.push(serializedChildNode);
    }
  });
  return result;
}
function serializeDocumentNode(document2, parentNodePrivacyLevel, transaction) {
  return {
    type: NodeType.Document,
    id: transaction.assignId(document2),
    childNodes: serializeChildNodes(document2, parentNodePrivacyLevel, transaction),
    adoptedStyleSheets: serializeStyleSheets(document2.adoptedStyleSheets, transaction)
  };
}
function serializeDocumentFragmentNode(element, parentNodePrivacyLevel, transaction) {
  const isShadowRoot = isNodeShadowRoot(element);
  if (isShadowRoot) {
    transaction.scope.shadowRootsController.addShadowRoot(element, transaction.scope);
  }
  return {
    type: NodeType.DocumentFragment,
    id: transaction.assignId(element),
    childNodes: serializeChildNodes(element, parentNodePrivacyLevel, transaction),
    isShadowRoot,
    adoptedStyleSheets: isShadowRoot ? serializeStyleSheets(element.adoptedStyleSheets, transaction) : void 0
  };
}
function serializeDocumentTypeNode(documentType, transaction) {
  return {
    type: NodeType.DocumentType,
    id: transaction.assignId(documentType),
    name: documentType.name,
    publicId: documentType.publicId,
    systemId: documentType.systemId
  };
}
function serializeElementNode(element, parentNodePrivacyLevel, transaction) {
  const tagName = getValidTagName(element.tagName);
  const isSVG = isSVGElement(element) || void 0;
  const nodePrivacyLevel = reducePrivacyLevel(getNodeSelfPrivacyLevel(element), parentNodePrivacyLevel);
  if (nodePrivacyLevel === NodePrivacyLevel.HIDDEN) {
    const { width, height } = element.getBoundingClientRect();
    return {
      type: NodeType.Element,
      id: transaction.assignId(element),
      tagName,
      attributes: {
        rr_width: `${width}px`,
        rr_height: `${height}px`,
        [PRIVACY_ATTR_NAME]: PRIVACY_ATTR_VALUE_HIDDEN
      },
      childNodes: [],
      isSVG
    };
  }
  if (nodePrivacyLevel === NodePrivacyLevel.IGNORE) {
    return null;
  }
  const id = transaction.assignId(element);
  const attributes = serializeAttributes(element, nodePrivacyLevel, transaction);
  let childNodes = [];
  if (hasChildNodes(element) && // Do not serialize style children as the css rules are already in the _cssText attribute
  tagName !== "style") {
    childNodes = serializeChildNodes(element, nodePrivacyLevel, transaction);
  }
  return {
    type: NodeType.Element,
    id,
    tagName,
    attributes,
    childNodes,
    isSVG
  };
}
function isSVGElement(el) {
  return el.tagName === "svg" || el instanceof SVGElement;
}
function serializeTextNode(textNode, parentNodePrivacyLevel, transaction) {
  const textContent = getTextContent(textNode, parentNodePrivacyLevel);
  if (textContent === void 0) {
    return null;
  }
  return {
    type: NodeType.Text,
    id: transaction.assignId(textNode),
    textContent
  };
}
function serializeCDataNode(node, transaction) {
  return {
    type: NodeType.CDATA,
    id: transaction.assignId(node),
    textContent: ""
  };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/serializationStats.js
function createSerializationStats() {
  return {
    cssText: {
      count: 0,
      max: 0,
      sum: 0
    },
    serializationDuration: {
      count: 0,
      max: 0,
      sum: 0
    }
  };
}
function updateSerializationStats(stats, metric, value) {
  stats[metric].count += 1;
  stats[metric].max = Math.max(stats[metric].max, value);
  stats[metric].sum += value;
}
function aggregateSerializationStats(aggregateStats, stats) {
  for (const metric of ["cssText", "serializationDuration"]) {
    aggregateStats[metric].count += stats[metric].count;
    aggregateStats[metric].max = Math.max(aggregateStats[metric].max, stats[metric].max);
    aggregateStats[metric].sum += stats[metric].sum;
  }
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/changeEncoder.js
function createChangeEncoder(stringIds) {
  let pendingChanges = {};
  const convertStringsToStringReferences = (array) => {
    for (let index = 0, length = array.length; index < length; index++) {
      const item = array[index];
      if (typeof item === "string") {
        const previousSize = stringIds.size;
        array[index] = stringIds.getOrInsert(item);
        if (stringIds.size > previousSize) {
          add(ChangeType.AddString, item);
        }
      } else if (Array.isArray(item)) {
        convertStringsToStringReferences(item);
      }
    }
  };
  const add = (type, data) => {
    if (!(type in pendingChanges)) {
      pendingChanges[type] = [type];
    }
    if (type !== ChangeType.AddString && Array.isArray(data)) {
      convertStringsToStringReferences(data);
    }
    pendingChanges[type].push(data);
  };
  const flush = () => {
    const changes = [];
    [
      ChangeType.AddString,
      ChangeType.AddNode,
      ChangeType.RemoveNode,
      ChangeType.Attribute,
      ChangeType.Text,
      ChangeType.Size,
      ChangeType.ScrollPosition,
      ChangeType.AddStyleSheet,
      ChangeType.AttachedStyleSheets,
      ChangeType.MediaPlaybackState,
      ChangeType.VisualViewport
    ].forEach((changeType) => {
      const change = pendingChanges[changeType];
      if (change) {
        changes.push(change);
      }
    });
    pendingChanges = {};
    return changes;
  };
  return { add, flush };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/serializationTransaction.js
function serializeInTransaction(kind, emitRecord, emitStats, scope, serialize) {
  const records = [];
  const stats = createSerializationStats();
  const transaction = {
    add(record2) {
      records.push(record2);
    },
    addMetric(metric, value) {
      updateSerializationStats(stats, metric, value);
    },
    assignId(node) {
      const id = scope.nodeIds.getOrInsert(node);
      if (transaction.serializedNodeIds) {
        transaction.serializedNodeIds.add(id);
      }
      return id;
    },
    kind,
    scope
  };
  const start = timeStampNow();
  serialize(transaction);
  updateSerializationStats(stats, "serializationDuration", elapsed(start, timeStampNow()));
  for (const record2 of records) {
    emitRecord(record2);
  }
  emitStats(stats);
}
function serializeChangesInTransaction(kind, emitRecord, emitStats, scope, timestamp, serialize) {
  const encoder = createChangeEncoder(scope.stringIds);
  const stats = createSerializationStats();
  const transaction = {
    addMetric(metric, value) {
      updateSerializationStats(stats, metric, value);
    },
    addNode(...change) {
      encoder.add(ChangeType.AddNode, change);
    },
    addStyleSheet(rules, mediaList, disabled) {
      if (disabled) {
        encoder.add(ChangeType.AddStyleSheet, [rules, mediaList || [], disabled]);
      } else if (mediaList) {
        encoder.add(ChangeType.AddStyleSheet, [rules, mediaList]);
      } else {
        encoder.add(ChangeType.AddStyleSheet, [rules]);
      }
    },
    attachStyleSheets(nodeId, sheetIds) {
      const change = [nodeId];
      for (const sheetId of sheetIds) {
        change.push(sheetId);
      }
      encoder.add(ChangeType.AttachedStyleSheets, change);
    },
    removeNode(nodeId) {
      encoder.add(ChangeType.RemoveNode, nodeId);
    },
    setAttributes(change) {
      encoder.add(ChangeType.Attribute, change);
    },
    setMediaPlaybackState(nodeId, state) {
      encoder.add(ChangeType.MediaPlaybackState, [nodeId, state]);
    },
    setScrollPosition(nodeId, x, y) {
      encoder.add(ChangeType.ScrollPosition, [nodeId, x, y]);
    },
    setSize(nodeId, width, height) {
      encoder.add(ChangeType.Size, [nodeId, width, height]);
    },
    setText(nodeId, content) {
      encoder.add(ChangeType.Text, [nodeId, content]);
    },
    kind,
    scope
  };
  const start = timeStampNow();
  serialize(transaction);
  updateSerializationStats(stats, "serializationDuration", elapsed(start, timeStampNow()));
  const changes = encoder.flush();
  if (changes.length > 0) {
    emitRecord({
      data: changes,
      type: RecordType.Change,
      timestamp
    });
  }
  emitStats(stats);
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/serializeFullSnapshot.js
function serializeFullSnapshot(timestamp, kind, document2, emitRecord, emitStats, scope) {
  serializeInTransaction(kind, emitRecord, emitStats, scope, (transaction) => {
    const defaultPrivacyLevel = transaction.scope.configuration.defaultPrivacyLevel;
    const node = serializeNode(document2, defaultPrivacyLevel, transaction);
    const record2 = {
      data: {
        node,
        initialOffset: {
          left: getScrollX(),
          top: getScrollY()
        }
      },
      type: RecordType.FullSnapshot,
      timestamp
    };
    transaction.add(record2);
    scope.serializeObservable.notify({
      type: "full",
      kind,
      target: document2,
      timestamp,
      v1: record2
    });
  });
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/serializeNodeAsChange.js
function serializeNodeAsChange(cursor, node, parentPrivacyLevel, transaction) {
  var _a;
  if (((_a = node.parentNode) === null || _a === void 0 ? void 0 : _a.nodeName) === "STYLE") {
    return;
  }
  let privacyLevel;
  const selfPrivacyLevel = getNodeSelfPrivacyLevel(node);
  if (selfPrivacyLevel) {
    privacyLevel = reducePrivacyLevel(selfPrivacyLevel, parentPrivacyLevel);
  } else {
    privacyLevel = parentPrivacyLevel;
  }
  if (privacyLevel === NodePrivacyLevel.HIDDEN) {
    serializeHiddenNodePlaceholder(cursor, node, transaction);
    return;
  }
  if (privacyLevel === NodePrivacyLevel.IGNORE) {
    return;
  }
  switch (node.nodeType) {
    case node.CDATA_SECTION_NODE:
      serializeCDataNodeAsChange(cursor, node, transaction);
      break;
    case node.DOCUMENT_NODE:
      serializeDocumentNodeAsChange(cursor, node, transaction);
      break;
    case node.DOCUMENT_FRAGMENT_NODE:
      serializeDocumentFragmentNodeAsChange(cursor, node, transaction);
      break;
    case node.DOCUMENT_TYPE_NODE:
      serializeDocumentTypeNodeAsChange(cursor, node, transaction);
      break;
    case node.ELEMENT_NODE:
      serializeElementNodeAsChange(cursor, node, privacyLevel, transaction);
      break;
    case node.TEXT_NODE:
      serializeTextNodeAsChange(cursor, node, privacyLevel, transaction);
      break;
    default:
      return;
  }
  switch (node.nodeType) {
    case node.CDATA_SECTION_NODE:
    case node.DOCUMENT_TYPE_NODE:
    case node.TEXT_NODE:
      return;
  }
  cursor.descend();
  forEachChildNodes(node, (childNode) => {
    serializeNodeAsChange(cursor, childNode, privacyLevel, transaction);
  });
  cursor.ascend();
}
function serializeDocumentNodeAsChange(cursor, document2, transaction) {
  const { nodeId, insertionPoint } = cursor.advance(document2);
  transaction.addNode(insertionPoint, "#document");
  transaction.setScrollPosition(nodeId, getScrollX(), getScrollY());
  serializeStyleSheetsAsChange(document2.adoptedStyleSheets, nodeId, transaction);
}
function serializeDocumentFragmentNodeAsChange(cursor, documentFragment, transaction) {
  const { nodeId, insertionPoint } = cursor.advance(documentFragment);
  const isShadowRoot = isNodeShadowRoot(documentFragment);
  if (!isShadowRoot) {
    transaction.addNode(insertionPoint, "#document-fragment");
    return;
  }
  transaction.addNode(insertionPoint, "#shadow-root");
  transaction.scope.shadowRootsController.addShadowRoot(documentFragment, transaction.scope);
  serializeStyleSheetsAsChange(documentFragment.adoptedStyleSheets, nodeId, transaction);
}
function serializeDocumentTypeNodeAsChange(cursor, documentType, transaction) {
  const { insertionPoint } = cursor.advance(documentType);
  transaction.addNode(insertionPoint, "#doctype", documentType.name, documentType.publicId, documentType.systemId);
}
function serializeElementNodeAsChange(cursor, element, privacyLevel, transaction) {
  const { nodeId, insertionPoint } = cursor.advance(element);
  const domAttributes = Object.entries(serializeDOMAttributes(element, privacyLevel, transaction));
  transaction.addNode(insertionPoint, encodedElementName(element), ...domAttributes);
  const { _cssText: cssText, rr_mediaState: mediaState, rr_scrollLeft: scrollLeft, rr_scrollTop: scrollTop } = serializeVirtualAttributes(element, privacyLevel, transaction);
  const linkOrStyle = element;
  if (cssText !== void 0 && linkOrStyle.sheet) {
    const sheetId = transaction.scope.styleSheetIds.getOrInsert(linkOrStyle.sheet);
    transaction.addStyleSheet(cssText);
    transaction.attachStyleSheets(nodeId, [sheetId]);
  }
  if (mediaState === "played") {
    transaction.setMediaPlaybackState(nodeId, MediaInteractionType.Play);
  } else if (mediaState === "paused") {
    transaction.setMediaPlaybackState(nodeId, MediaInteractionType.Pause);
  }
  if (scrollLeft !== void 0 || scrollTop !== void 0) {
    transaction.setScrollPosition(nodeId, scrollLeft || 0, scrollTop || 0);
  }
}
function serializeTextNodeAsChange(cursor, textNode, privacyLevel, transaction) {
  const textContent = getTextContent(textNode, privacyLevel);
  if (textContent === void 0) {
    return;
  }
  const { insertionPoint } = cursor.advance(textNode);
  transaction.addNode(insertionPoint, "#text", textContent);
}
function serializeCDataNodeAsChange(cursor, cdataNode, transaction) {
  const { insertionPoint } = cursor.advance(cdataNode);
  transaction.addNode(insertionPoint, "#cdata-section");
}
function serializeHiddenNodePlaceholder(cursor, node, transaction) {
  if (!isElementNode(node)) {
    return;
  }
  const { nodeId, insertionPoint } = cursor.advance(node);
  transaction.addNode(insertionPoint, encodedElementName(node), [PRIVACY_ATTR_NAME, PRIVACY_ATTR_VALUE_HIDDEN]);
  const { width, height } = node.getBoundingClientRect();
  transaction.setSize(nodeId, width, height);
}
function serializeStyleSheetsAsChange(sheets, nodeId, transaction) {
  if (!sheets || sheets.length === 0) {
    return void 0;
  }
  transaction.attachStyleSheets(nodeId, sheets.map((sheet) => serializeStyleSheetAsChange(sheet, transaction)));
}
function serializeStyleSheetAsChange(sheet, transaction) {
  const rules = Array.from(sheet.cssRules || sheet.rules, (rule) => rule.cssText);
  const mediaList = sheet.media.length > 0 ? Array.from(sheet.media) : void 0;
  transaction.addMetric("cssText", rules.reduce((totalLength, rule) => totalLength + rule.length, 0));
  transaction.addStyleSheet(rules, mediaList, sheet.disabled);
  return transaction.scope.styleSheetIds.getOrInsert(sheet);
}
function encodedElementName(element) {
  const nodeName = element.nodeName;
  if (isSVGElement2(element)) {
    return `svg>${nodeName}`;
  }
  return nodeName;
}
function isSVGElement2(element) {
  return element.namespaceURI === "http://www.w3.org/2000/svg";
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/serializeFullSnapshotAsChange.js
function serializeFullSnapshotAsChange(timestamp, kind, document2, emitRecord, emitStats, scope) {
  scope.resetIds();
  serializeChangesInTransaction(kind, emitRecord, emitStats, scope, timestamp, (transaction) => {
    serializeNodeAsChange(createRootInsertionCursor(scope.nodeIds), document2, scope.configuration.defaultPrivacyLevel, transaction);
  });
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/assembly.js
function assembleIncrementalSnapshot(source, data, timestamp = timeStampNow()) {
  return {
    data: {
      source,
      ...data
    },
    type: RecordType.IncrementalSnapshot,
    timestamp
  };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/serializeMutations.js
function serializeMutations(timestamp, mutations, emitRecord, emitStats, scope) {
  serializeInTransaction(2, emitRecord, emitStats, scope, (transaction) => processMutations(timestamp, mutations, transaction));
}
function processMutations(timestamp, mutations, transaction) {
  const nodePrivacyLevelCache = /* @__PURE__ */ new Map();
  mutations.filter((mutation) => mutation.type === "childList").forEach((mutation) => {
    mutation.removedNodes.forEach((removedNode) => {
      traverseRemovedShadowDom(removedNode, transaction.scope.shadowRootsController.removeShadowRoot);
    });
  });
  const filteredMutations = mutations.filter((mutation) => mutation.target.isConnected && idsAreAssignedForNodeAndAncestors(mutation.target, transaction.scope.nodeIds) && getNodePrivacyLevel(mutation.target, transaction.scope.configuration.defaultPrivacyLevel, nodePrivacyLevelCache) !== NodePrivacyLevel.HIDDEN);
  const { adds, removes, hasBeenSerialized } = processChildListMutations(filteredMutations.filter((mutation) => mutation.type === "childList"), nodePrivacyLevelCache, transaction);
  const texts = processCharacterDataMutations(filteredMutations.filter((mutation) => mutation.type === "characterData" && !hasBeenSerialized(mutation.target)), nodePrivacyLevelCache, transaction);
  const attributes = processAttributesMutations(filteredMutations.filter((mutation) => mutation.type === "attributes" && !hasBeenSerialized(mutation.target)), nodePrivacyLevelCache, transaction);
  if (!texts.length && !attributes.length && !removes.length && !adds.length) {
    return;
  }
  const record2 = assembleIncrementalSnapshot(IncrementalSource.Mutation, {
    adds,
    removes,
    texts,
    attributes
  }, timestamp);
  transaction.add(record2);
  transaction.scope.serializeObservable.notify({
    type: "incremental",
    target: mutations,
    timestamp,
    v1: record2
  });
}
function processChildListMutations(mutations, nodePrivacyLevelCache, transaction) {
  const addedAndMovedNodes = /* @__PURE__ */ new Set();
  const removedNodes = /* @__PURE__ */ new Map();
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      addedAndMovedNodes.add(node);
    });
    mutation.removedNodes.forEach((node) => {
      if (!addedAndMovedNodes.has(node)) {
        removedNodes.set(node, mutation.target);
      }
      addedAndMovedNodes.delete(node);
    });
  }
  const sortedAddedAndMovedNodes = Array.from(addedAndMovedNodes);
  sortAddedAndMovedNodes(sortedAddedAndMovedNodes);
  transaction.serializedNodeIds = /* @__PURE__ */ new Set();
  const addedNodeMutations = [];
  for (const node of sortedAddedAndMovedNodes) {
    if (hasBeenSerialized(node)) {
      continue;
    }
    const parentNodePrivacyLevel = getNodePrivacyLevel(node.parentNode, transaction.scope.configuration.defaultPrivacyLevel, nodePrivacyLevelCache);
    if (parentNodePrivacyLevel === NodePrivacyLevel.HIDDEN || parentNodePrivacyLevel === NodePrivacyLevel.IGNORE) {
      continue;
    }
    const serializedNode = serializeNode(node, parentNodePrivacyLevel, transaction);
    if (!serializedNode) {
      continue;
    }
    const parentNode = getParentNode(node);
    addedNodeMutations.push({
      nextId: getNextSibling(node),
      parentId: transaction.scope.nodeIds.get(parentNode),
      node: serializedNode
    });
  }
  const removedNodeMutations = [];
  removedNodes.forEach((parent, node) => {
    const parentId = transaction.scope.nodeIds.get(parent);
    const id = transaction.scope.nodeIds.get(node);
    if (parentId !== void 0 && id !== void 0) {
      removedNodeMutations.push({ parentId, id });
    }
  });
  return { adds: addedNodeMutations, removes: removedNodeMutations, hasBeenSerialized };
  function hasBeenSerialized(node) {
    var _a;
    const id = transaction.scope.nodeIds.get(node);
    return id !== void 0 && ((_a = transaction.serializedNodeIds) === null || _a === void 0 ? void 0 : _a.has(id));
  }
  function getNextSibling(node) {
    let nextSibling = node.nextSibling;
    while (nextSibling) {
      const id = transaction.scope.nodeIds.get(nextSibling);
      if (id !== void 0) {
        return id;
      }
      nextSibling = nextSibling.nextSibling;
    }
    return null;
  }
}
function processCharacterDataMutations(mutations, nodePrivacyLevelCache, transaction) {
  var _a;
  const textMutations = [];
  const handledNodes = /* @__PURE__ */ new Set();
  const filteredMutations = mutations.filter((mutation) => {
    if (handledNodes.has(mutation.target)) {
      return false;
    }
    handledNodes.add(mutation.target);
    return true;
  });
  for (const mutation of filteredMutations) {
    const value = mutation.target.textContent;
    if (value === mutation.oldValue) {
      continue;
    }
    const id = transaction.scope.nodeIds.get(mutation.target);
    if (id === void 0) {
      continue;
    }
    const parentNodePrivacyLevel = getNodePrivacyLevel(getParentNode(mutation.target), transaction.scope.configuration.defaultPrivacyLevel, nodePrivacyLevelCache);
    if (parentNodePrivacyLevel === NodePrivacyLevel.HIDDEN || parentNodePrivacyLevel === NodePrivacyLevel.IGNORE) {
      continue;
    }
    textMutations.push({
      id,
      value: (_a = getTextContent(mutation.target, parentNodePrivacyLevel)) !== null && _a !== void 0 ? _a : null
    });
  }
  return textMutations;
}
function processAttributesMutations(mutations, nodePrivacyLevelCache, transaction) {
  const attributeMutations = [];
  const handledElements = /* @__PURE__ */ new Map();
  const filteredMutations = mutations.filter((mutation) => {
    const handledAttributes = handledElements.get(mutation.target);
    if (handledAttributes && handledAttributes.has(mutation.attributeName)) {
      return false;
    }
    if (!handledAttributes) {
      handledElements.set(mutation.target, /* @__PURE__ */ new Set([mutation.attributeName]));
    } else {
      handledAttributes.add(mutation.attributeName);
    }
    return true;
  });
  const emittedMutations = /* @__PURE__ */ new Map();
  for (const mutation of filteredMutations) {
    const uncensoredValue = mutation.target.getAttribute(mutation.attributeName);
    if (uncensoredValue === mutation.oldValue) {
      continue;
    }
    const id = transaction.scope.nodeIds.get(mutation.target);
    if (id === void 0) {
      continue;
    }
    const privacyLevel = getNodePrivacyLevel(mutation.target, transaction.scope.configuration.defaultPrivacyLevel, nodePrivacyLevelCache);
    const attributeValue = serializeAttribute(mutation.target, privacyLevel, mutation.attributeName, transaction.scope.configuration);
    let transformedValue;
    if (mutation.attributeName === "value") {
      const inputValue = getElementInputValue(mutation.target, privacyLevel);
      if (inputValue === void 0) {
        continue;
      }
      transformedValue = inputValue;
    } else if (typeof attributeValue === "string") {
      transformedValue = attributeValue;
    } else {
      transformedValue = null;
    }
    let emittedMutation = emittedMutations.get(mutation.target);
    if (!emittedMutation) {
      emittedMutation = { id, attributes: {} };
      attributeMutations.push(emittedMutation);
      emittedMutations.set(mutation.target, emittedMutation);
    }
    emittedMutation.attributes[mutation.attributeName] = transformedValue;
  }
  return attributeMutations;
}
function sortAddedAndMovedNodes(nodes) {
  nodes.sort((a, b) => {
    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_CONTAINED_BY) {
      return -1;
    } else if (position & Node.DOCUMENT_POSITION_CONTAINS) {
      return 1;
    } else if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
      return 1;
    } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
      return -1;
    }
    return 0;
  });
}
function traverseRemovedShadowDom(removedNode, shadowDomRemovedCallback) {
  if (isNodeShadowHost(removedNode)) {
    shadowDomRemovedCallback(removedNode.shadowRoot);
  }
  forEachChildNodes(removedNode, (childNode) => traverseRemovedShadowDom(childNode, shadowDomRemovedCallback));
}
function idsAreAssignedForNodeAndAncestors(node, nodeIds) {
  let current = node;
  while (current) {
    if (nodeIds.get(current) === void 0 && !isNodeShadowRoot(current)) {
      return false;
    }
    current = getParentNode(current);
  }
  return true;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/serialization/serializeMutationsAsChange.js
function serializeMutationsAsChange(timestamp, mutations, emitRecord, emitStats, scope) {
  serializeChangesInTransaction(2, emitRecord, emitStats, scope, timestamp, (transaction) => processMutations2(mutations, transaction));
}
function processMutations2(mutations, transaction) {
  const addedNodes = /* @__PURE__ */ new Set();
  const attributeMutations = /* @__PURE__ */ new Map();
  const characterDataMutations = /* @__PURE__ */ new Map();
  const removedNodes = /* @__PURE__ */ new Set();
  for (const mutation of mutations) {
    switch (mutation.type) {
      case "attributes": {
        const node = mutation.target;
        let attributes = attributeMutations.get(node);
        if (!attributes) {
          attributes = /* @__PURE__ */ new Map();
          attributeMutations.set(node, attributes);
        }
        const attributeName = mutation.attributeName;
        if (!attributes.has(attributeName)) {
          attributes.set(attributeName, mutation.oldValue);
        }
        break;
      }
      case "characterData":
        if (!characterDataMutations.has(mutation.target)) {
          characterDataMutations.set(mutation.target, mutation.oldValue);
        }
        break;
      case "childList":
        for (let index = 0; index < mutation.addedNodes.length; index++) {
          addedNodes.add(mutation.addedNodes[index]);
        }
        for (let index = 0; index < mutation.removedNodes.length; index++) {
          removedNodes.add(mutation.removedNodes[index]);
        }
        break;
    }
  }
  const firstNewNodeId = transaction.scope.nodeIds.nextId;
  const nodePrivacyLevelCache = /* @__PURE__ */ new Map();
  processRemovedNodes(removedNodes, transaction);
  processAddedNodes(addedNodes, nodePrivacyLevelCache, transaction);
  processCharacterDataMutations2(characterDataMutations, firstNewNodeId, nodePrivacyLevelCache, transaction);
  processAttributeMutations(attributeMutations, firstNewNodeId, nodePrivacyLevelCache, transaction);
}
function processRemovedNodes(nodes, transaction) {
  const nodeIds = transaction.scope.nodeIds;
  for (const node of nodes) {
    const nodeId = nodeIds.get(node);
    if (nodeId === void 0) {
      continue;
    }
    forNodeAndDescendants(node, (node2) => {
      if (isNodeShadowHost(node2)) {
        transaction.scope.shadowRootsController.removeShadowRoot(node2.shadowRoot);
      }
      nodeIds.delete(node2);
    });
    transaction.removeNode(nodeId);
  }
}
function processAddedNodes(nodes, nodePrivacyLevelCache, transaction) {
  const nodeIds = transaction.scope.nodeIds;
  for (const node of nodes) {
    if (!node.isConnected) {
      continue;
    }
    const existingNodeId = nodeIds.get(node);
    if (existingNodeId !== void 0) {
      continue;
    }
    const parentNode = getParentNode(node);
    if (!parentNode) {
      continue;
    }
    const parentId = nodeIds.get(parentNode);
    if (parentId === void 0) {
      continue;
    }
    const parentNodePrivacyLevel = getNodePrivacyLevel(parentNode, transaction.scope.configuration.defaultPrivacyLevel, nodePrivacyLevelCache);
    const nextSiblingId = getNextSiblingId(node, nodeIds);
    serializeNodeAsChange(createChildInsertionCursor(parentId, nextSiblingId, nodeIds), node, parentNodePrivacyLevel, transaction);
  }
}
function processCharacterDataMutations2(mutations, firstNewNodeId, nodePrivacyLevelCache, transaction) {
  var _a;
  const nodeIds = transaction.scope.nodeIds;
  for (const [node, oldValue] of mutations) {
    if (node.textContent === oldValue) {
      continue;
    }
    if (!node.isConnected) {
      continue;
    }
    const nodeId = nodeIds.get(node);
    if (nodeId === void 0) {
      continue;
    }
    if (nodeId >= firstNewNodeId) {
      continue;
    }
    const parentNode = getParentNode(node);
    if (!parentNode) {
      continue;
    }
    const parentNodePrivacyLevel = getNodePrivacyLevel(parentNode, transaction.scope.configuration.defaultPrivacyLevel, nodePrivacyLevelCache);
    if (parentNodePrivacyLevel === NodePrivacyLevel.HIDDEN || parentNodePrivacyLevel === NodePrivacyLevel.IGNORE) {
      continue;
    }
    const content = (_a = getTextContent(node, parentNodePrivacyLevel)) !== null && _a !== void 0 ? _a : "";
    transaction.setText(nodeId, content);
  }
}
function processAttributeMutations(mutations, firstNewNodeId, nodePrivacyLevelCache, transaction) {
  const nodeIds = transaction.scope.nodeIds;
  for (const [node, attributeNames] of mutations) {
    if (!node.isConnected) {
      continue;
    }
    const nodeId = nodeIds.get(node);
    if (nodeId === void 0) {
      continue;
    }
    if (nodeId >= firstNewNodeId) {
      continue;
    }
    const privacyLevel = getNodePrivacyLevel(node, transaction.scope.configuration.defaultPrivacyLevel, nodePrivacyLevelCache);
    if (privacyLevel === NodePrivacyLevel.HIDDEN || privacyLevel === NodePrivacyLevel.IGNORE) {
      continue;
    }
    const change = [nodeId];
    for (const [attributeName, oldValue] of attributeNames) {
      if (node.getAttribute(attributeName) === oldValue) {
        continue;
      }
      if (attributeName === "value") {
        const attributeValue2 = getElementInputValue(node, privacyLevel);
        if (attributeValue2 !== void 0) {
          change.push([attributeName, attributeValue2]);
        }
        continue;
      }
      const attributeValue = serializeAttribute(node, privacyLevel, attributeName, transaction.scope.configuration);
      if (attributeValue === null) {
        change.push([attributeName]);
      } else {
        change.push([attributeName, attributeValue]);
      }
    }
    if (change.length > 1) {
      transaction.setAttributes(change);
    }
  }
}
function getNextSiblingId(node, nodeIds) {
  let nextSibling = node.nextSibling;
  while (nextSibling) {
    const id = nodeIds.get(nextSibling);
    if (id !== void 0) {
      return id;
    }
    nextSibling = nextSibling.nextSibling;
  }
  return void 0;
}
function forNodeAndDescendants(node, action) {
  action(node);
  forEachChildNodes(node, (childNode) => forNodeAndDescendants(childNode, action));
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/viewports.js
var TOLERANCE = 25;
function isVisualViewportFactoredIn(visualViewport) {
  return Math.abs(visualViewport.pageTop - visualViewport.offsetTop - window.scrollY) > TOLERANCE || Math.abs(visualViewport.pageLeft - visualViewport.offsetLeft - window.scrollX) > TOLERANCE;
}
var convertMouseEventToLayoutCoordinates = (clientX, clientY) => {
  const visualViewport = window.visualViewport;
  const normalized = {
    layoutViewportX: clientX,
    layoutViewportY: clientY,
    visualViewportX: clientX,
    visualViewportY: clientY
  };
  if (!visualViewport) {
    return normalized;
  } else if (isVisualViewportFactoredIn(visualViewport)) {
    normalized.layoutViewportX = Math.round(clientX + visualViewport.offsetLeft);
    normalized.layoutViewportY = Math.round(clientY + visualViewport.offsetTop);
  } else {
    normalized.visualViewportX = Math.round(clientX - visualViewport.offsetLeft);
    normalized.visualViewportY = Math.round(clientY - visualViewport.offsetTop);
  }
  return normalized;
};
var getVisualViewport = (visualViewport) => ({
  scale: visualViewport.scale,
  offsetLeft: visualViewport.offsetLeft,
  offsetTop: visualViewport.offsetTop,
  pageLeft: visualViewport.pageLeft,
  pageTop: visualViewport.pageTop,
  height: visualViewport.height,
  width: visualViewport.width
});

// ../../node_modules/@datadog/browser-rum/esm/domain/record/startFullSnapshots.js
function startFullSnapshots(lifeCycle, emitRecord, emitStats, flushMutations, scope, serialize = defaultSerializeFullSnapshotCallback()) {
  takeFullSnapshot(timeStampNow(), 0, emitRecord, emitStats, scope, serialize);
  const { unsubscribe } = lifeCycle.subscribe(2, (view) => {
    flushMutations();
    takeFullSnapshot(view.startClocks.timeStamp, 1, emitRecord, emitStats, scope, serialize);
  });
  return {
    stop: unsubscribe
  };
}
function takeFullSnapshot(timestamp, kind, emitRecord, emitStats, scope, serialize = defaultSerializeFullSnapshotCallback()) {
  const { width, height } = getViewportDimension();
  emitRecord({
    data: {
      height,
      href: window.location.href,
      width
    },
    type: RecordType.Meta,
    timestamp
  });
  emitRecord({
    data: {
      has_focus: document.hasFocus()
    },
    type: RecordType.Focus,
    timestamp
  });
  serialize(timestamp, kind, document, emitRecord, emitStats, scope);
  if (window.visualViewport) {
    emitRecord({
      data: getVisualViewport(window.visualViewport),
      type: RecordType.VisualViewport,
      timestamp
    });
  }
}
function defaultSerializeFullSnapshotCallback() {
  return isFullSnapshotChangeRecordsEnabled() ? serializeFullSnapshotAsChange : serializeFullSnapshot;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/recordingScope.js
function createRecordingScope(configuration, elementsScrollPositions, shadowRootsController) {
  const eventIds = createEventIds();
  const nodeIds = createNodeIds();
  const stringIds = createStringIds();
  const styleSheetIds = createStyleSheetIds();
  const scope = {
    resetIds() {
      scope.eventIds.clear();
      scope.nodeIds.clear();
      scope.stringIds.clear();
      scope.styleSheetIds.clear();
    },
    configuration,
    elementsScrollPositions,
    eventIds,
    nodeIds,
    serializeObservable: new Observable(),
    shadowRootsController,
    stringIds,
    styleSheetIds
  };
  return scope;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/elementsScrollPositions.js
function createElementsScrollPositions() {
  const scrollPositionsByElement = /* @__PURE__ */ new WeakMap();
  return {
    set(element, scrollPositions) {
      if (element === document && !document.scrollingElement) {
        return;
      }
      scrollPositionsByElement.set(element === document ? document.scrollingElement : element, scrollPositions);
    },
    get(element) {
      return scrollPositionsByElement.get(element);
    },
    has(element) {
      return scrollPositionsByElement.has(element);
    }
  };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/eventsUtils.js
function isTouchEvent(event) {
  return Boolean(event.changedTouches);
}
function getEventTarget(event) {
  if (event.composed === true && isNodeShadowHost(event.target)) {
    return event.composedPath()[0];
  }
  return event.target;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/trackers/trackMove.js
var MOUSE_MOVE_OBSERVER_THRESHOLD = 50;
function trackMove(emitRecord, scope) {
  const { throttled: updatePosition, cancel: cancelThrottle } = throttle((event) => {
    const target = getEventTarget(event);
    const id = scope.nodeIds.get(target);
    if (id === void 0) {
      return;
    }
    const coordinates = tryToComputeCoordinates(event);
    if (!coordinates) {
      return;
    }
    const position = {
      id,
      timeOffset: 0,
      x: coordinates.x,
      y: coordinates.y
    };
    emitRecord(assembleIncrementalSnapshot(isTouchEvent(event) ? IncrementalSource.TouchMove : IncrementalSource.MouseMove, { positions: [position] }));
  }, MOUSE_MOVE_OBSERVER_THRESHOLD, {
    trailing: false
  });
  const { stop: removeListener } = addEventListeners(scope.configuration, document, [
    "mousemove",
    "touchmove"
    /* DOM_EVENT.TOUCH_MOVE */
  ], updatePosition, {
    capture: true,
    passive: true
  });
  return {
    stop: () => {
      removeListener();
      cancelThrottle();
    }
  };
}
function tryToComputeCoordinates(event) {
  let { clientX: x, clientY: y } = isTouchEvent(event) ? event.changedTouches[0] : event;
  if (window.visualViewport) {
    const { visualViewportX, visualViewportY } = convertMouseEventToLayoutCoordinates(x, y);
    x = visualViewportX;
    y = visualViewportY;
  }
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return void 0;
  }
  return { x, y };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/trackers/trackMouseInteraction.js
var eventTypeToMouseInteraction = {
  // Listen for pointerup DOM events instead of mouseup for MouseInteraction/MouseUp records. This
  // allows to reference such records from Frustration records.
  //
  // In the context of supporting Mobile Session Replay, we introduced `PointerInteraction` records
  // used by the Mobile SDKs in place of `MouseInteraction`. In the future, we should replace
  // `MouseInteraction` by `PointerInteraction` in the Browser SDK so we have an uniform way to
  // convey such interaction. This would cleanly solve the issue since we would have
  // `PointerInteraction/Up` records that we could reference from `Frustration` records.
  [
    "pointerup"
    /* DOM_EVENT.POINTER_UP */
  ]: MouseInteractionType.MouseUp,
  [
    "mousedown"
    /* DOM_EVENT.MOUSE_DOWN */
  ]: MouseInteractionType.MouseDown,
  [
    "click"
    /* DOM_EVENT.CLICK */
  ]: MouseInteractionType.Click,
  [
    "contextmenu"
    /* DOM_EVENT.CONTEXT_MENU */
  ]: MouseInteractionType.ContextMenu,
  [
    "dblclick"
    /* DOM_EVENT.DBL_CLICK */
  ]: MouseInteractionType.DblClick,
  [
    "focus"
    /* DOM_EVENT.FOCUS */
  ]: MouseInteractionType.Focus,
  [
    "blur"
    /* DOM_EVENT.BLUR */
  ]: MouseInteractionType.Blur,
  [
    "touchstart"
    /* DOM_EVENT.TOUCH_START */
  ]: MouseInteractionType.TouchStart,
  [
    "touchend"
    /* DOM_EVENT.TOUCH_END */
  ]: MouseInteractionType.TouchEnd
};
function trackMouseInteraction(emitRecord, scope) {
  const handler = (event) => {
    const target = getEventTarget(event);
    const id = scope.nodeIds.get(target);
    if (id === void 0 || getNodePrivacyLevel(target, scope.configuration.defaultPrivacyLevel) === NodePrivacyLevel.HIDDEN) {
      return;
    }
    const type = eventTypeToMouseInteraction[event.type];
    let interaction;
    if (type !== MouseInteractionType.Blur && type !== MouseInteractionType.Focus) {
      const coordinates = tryToComputeCoordinates(event);
      if (!coordinates) {
        return;
      }
      interaction = { id, type, x: coordinates.x, y: coordinates.y };
    } else {
      interaction = { id, type };
    }
    emitRecord({
      id: scope.eventIds.getOrInsert(event),
      ...assembleIncrementalSnapshot(IncrementalSource.MouseInteraction, interaction)
    });
  };
  return addEventListeners(scope.configuration, document, Object.keys(eventTypeToMouseInteraction), handler, {
    capture: true,
    passive: true
  });
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/trackers/trackScroll.js
var SCROLL_OBSERVER_THRESHOLD = 100;
function trackScroll(target, emitRecord, scope) {
  const { throttled: updatePosition, cancel: cancelThrottle } = throttle((event) => {
    const target2 = getEventTarget(event);
    if (!target2) {
      return;
    }
    const id = scope.nodeIds.get(target2);
    if (id === void 0 || getNodePrivacyLevel(target2, scope.configuration.defaultPrivacyLevel) === NodePrivacyLevel.HIDDEN) {
      return;
    }
    const scrollPositions = target2 === document ? {
      scrollTop: getScrollY(),
      scrollLeft: getScrollX()
    } : {
      scrollTop: Math.round(target2.scrollTop),
      scrollLeft: Math.round(target2.scrollLeft)
    };
    scope.elementsScrollPositions.set(target2, scrollPositions);
    emitRecord(assembleIncrementalSnapshot(IncrementalSource.Scroll, {
      id,
      x: scrollPositions.scrollLeft,
      y: scrollPositions.scrollTop
    }));
  }, SCROLL_OBSERVER_THRESHOLD);
  const { stop: removeListener } = addEventListener(scope.configuration, target, "scroll", updatePosition, {
    capture: true,
    passive: true
  });
  return {
    stop: () => {
      removeListener();
      cancelThrottle();
    }
  };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/trackers/trackViewportResize.js
var VISUAL_VIEWPORT_OBSERVER_THRESHOLD = 200;
function trackViewportResize(emitRecord, scope) {
  const viewportResizeSubscription = initViewportObservable(scope.configuration).subscribe((data) => {
    emitRecord(assembleIncrementalSnapshot(IncrementalSource.ViewportResize, data));
  });
  return {
    stop: () => {
      viewportResizeSubscription.unsubscribe();
    }
  };
}
function trackVisualViewportResize(emitRecord, scope) {
  const visualViewport = window.visualViewport;
  if (!visualViewport) {
    return { stop: noop };
  }
  const { throttled: updateDimension, cancel: cancelThrottle } = throttle(() => {
    emitRecord({
      data: getVisualViewport(visualViewport),
      type: RecordType.VisualViewport,
      timestamp: timeStampNow()
    });
  }, VISUAL_VIEWPORT_OBSERVER_THRESHOLD, {
    trailing: false
  });
  const { stop: removeListener } = addEventListeners(scope.configuration, visualViewport, [
    "resize",
    "scroll"
    /* DOM_EVENT.SCROLL */
  ], updateDimension, {
    capture: true,
    passive: true
  });
  return {
    stop: () => {
      removeListener();
      cancelThrottle();
    }
  };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/trackers/trackMediaInteraction.js
function trackMediaInteraction(emitRecord, scope) {
  return addEventListeners(scope.configuration, document, [
    "play",
    "pause"
    /* DOM_EVENT.PAUSE */
  ], (event) => {
    const target = getEventTarget(event);
    if (!target) {
      return;
    }
    const id = scope.nodeIds.get(target);
    if (id === void 0 || getNodePrivacyLevel(target, scope.configuration.defaultPrivacyLevel) === NodePrivacyLevel.HIDDEN) {
      return;
    }
    emitRecord(assembleIncrementalSnapshot(IncrementalSource.MediaInteraction, {
      id,
      type: event.type === "play" ? MediaInteractionType.Play : MediaInteractionType.Pause
    }));
  }, {
    capture: true,
    passive: true
  });
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/trackers/trackStyleSheet.js
function trackStyleSheet(emitRecord, scope) {
  function checkStyleSheetAndCallback(styleSheet, callback) {
    if (!styleSheet || !styleSheet.ownerNode) {
      return;
    }
    const id = scope.nodeIds.get(styleSheet.ownerNode);
    if (id === void 0) {
      return;
    }
    callback(id);
  }
  const instrumentationStoppers = [
    instrumentMethod(CSSStyleSheet.prototype, "insertRule", ({ target: styleSheet, parameters: [rule, index] }) => {
      checkStyleSheetAndCallback(styleSheet, (id) => emitRecord(assembleIncrementalSnapshot(IncrementalSource.StyleSheetRule, {
        id,
        adds: [{ rule, index }]
      })));
    }),
    instrumentMethod(CSSStyleSheet.prototype, "deleteRule", ({ target: styleSheet, parameters: [index] }) => {
      checkStyleSheetAndCallback(styleSheet, (id) => emitRecord(assembleIncrementalSnapshot(IncrementalSource.StyleSheetRule, {
        id,
        removes: [{ index }]
      })));
    })
  ];
  if (typeof CSSGroupingRule !== "undefined") {
    instrumentGroupingCSSRuleClass(CSSGroupingRule);
  } else {
    instrumentGroupingCSSRuleClass(CSSMediaRule);
    instrumentGroupingCSSRuleClass(CSSSupportsRule);
  }
  function instrumentGroupingCSSRuleClass(cls) {
    instrumentationStoppers.push(instrumentMethod(cls.prototype, "insertRule", ({ target: styleSheet, parameters: [rule, index] }) => {
      checkStyleSheetAndCallback(styleSheet.parentStyleSheet, (id) => {
        const path = getPathToNestedCSSRule(styleSheet);
        if (path) {
          path.push(index || 0);
          emitRecord(assembleIncrementalSnapshot(IncrementalSource.StyleSheetRule, {
            id,
            adds: [{ rule, index: path }]
          }));
        }
      });
    }), instrumentMethod(cls.prototype, "deleteRule", ({ target: styleSheet, parameters: [index] }) => {
      checkStyleSheetAndCallback(styleSheet.parentStyleSheet, (id) => {
        const path = getPathToNestedCSSRule(styleSheet);
        if (path) {
          path.push(index);
          emitRecord(assembleIncrementalSnapshot(IncrementalSource.StyleSheetRule, {
            id,
            removes: [{ index: path }]
          }));
        }
      });
    }));
  }
  return {
    stop: () => {
      instrumentationStoppers.forEach((stopper) => stopper.stop());
    }
  };
}
function getPathToNestedCSSRule(rule) {
  const path = [];
  let currentRule = rule;
  while (currentRule.parentRule) {
    const rules2 = Array.from(currentRule.parentRule.cssRules);
    const index2 = rules2.indexOf(currentRule);
    path.unshift(index2);
    currentRule = currentRule.parentRule;
  }
  if (!currentRule.parentStyleSheet) {
    return;
  }
  const rules = Array.from(currentRule.parentStyleSheet.cssRules);
  const index = rules.indexOf(currentRule);
  path.unshift(index);
  return path;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/trackers/trackFocus.js
function trackFocus(emitRecord, scope) {
  return addEventListeners(scope.configuration, window, [
    "focus",
    "blur"
    /* DOM_EVENT.BLUR */
  ], () => {
    emitRecord({
      data: { has_focus: document.hasFocus() },
      type: RecordType.Focus,
      timestamp: timeStampNow()
    });
  });
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/trackers/trackViewEnd.js
function trackViewEnd(lifeCycle, emitRecord, flushMutations) {
  const viewEndSubscription = lifeCycle.subscribe(5, () => {
    flushMutations();
    emitRecord({
      timestamp: timeStampNow(),
      type: RecordType.ViewEnd
    });
  });
  return {
    stop: () => {
      viewEndSubscription.unsubscribe();
    }
  };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/trackers/trackInput.js
function trackInput(target, emitRecord, scope) {
  const defaultPrivacyLevel = scope.configuration.defaultPrivacyLevel;
  const lastInputStateMap = /* @__PURE__ */ new WeakMap();
  const isShadowRoot = target !== document;
  const { stop: stopEventListeners } = addEventListeners(
    scope.configuration,
    target,
    // The 'input' event bubbles across shadow roots, so we don't have to listen for it on shadow
    // roots since it will be handled by the event listener that we did add to the document. Only
    // the 'change' event is blocked and needs to be handled on shadow roots.
    isShadowRoot ? [
      "change"
      /* DOM_EVENT.CHANGE */
    ] : [
      "input",
      "change"
      /* DOM_EVENT.CHANGE */
    ],
    (event) => {
      const target2 = getEventTarget(event);
      if (target2 instanceof HTMLInputElement || target2 instanceof HTMLTextAreaElement || target2 instanceof HTMLSelectElement) {
        onElementChange(target2);
      }
    },
    {
      capture: true,
      passive: true
    }
  );
  let stopPropertySetterInstrumentation;
  if (!isShadowRoot) {
    const instrumentationStoppers = [
      instrumentSetter(HTMLInputElement.prototype, "value", onElementChange),
      instrumentSetter(HTMLInputElement.prototype, "checked", onElementChange),
      instrumentSetter(HTMLSelectElement.prototype, "value", onElementChange),
      instrumentSetter(HTMLTextAreaElement.prototype, "value", onElementChange),
      instrumentSetter(HTMLSelectElement.prototype, "selectedIndex", onElementChange)
    ];
    stopPropertySetterInstrumentation = () => {
      instrumentationStoppers.forEach((stopper) => stopper.stop());
    };
  } else {
    stopPropertySetterInstrumentation = noop;
  }
  return {
    stop: () => {
      stopPropertySetterInstrumentation();
      stopEventListeners();
    }
  };
  function onElementChange(target2) {
    const nodePrivacyLevel = getNodePrivacyLevel(target2, defaultPrivacyLevel);
    if (nodePrivacyLevel === NodePrivacyLevel.HIDDEN) {
      return;
    }
    const type = target2.type;
    let inputState;
    if (type === "radio" || type === "checkbox") {
      if (shouldMaskNode(target2, nodePrivacyLevel)) {
        return;
      }
      inputState = { isChecked: target2.checked };
    } else {
      const value = getElementInputValue(target2, nodePrivacyLevel);
      if (value === void 0) {
        return;
      }
      inputState = { text: value };
    }
    createRecordIfStateChanged(target2, inputState);
    const name = target2.name;
    if (type === "radio" && name && target2.checked) {
      document.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`).forEach((el) => {
        if (el !== target2) {
          createRecordIfStateChanged(el, { isChecked: false });
        }
      });
    }
  }
  function createRecordIfStateChanged(target2, inputState) {
    const id = scope.nodeIds.get(target2);
    if (id === void 0) {
      return;
    }
    const lastInputState = lastInputStateMap.get(target2);
    if (!lastInputState || lastInputState.text !== inputState.text || lastInputState.isChecked !== inputState.isChecked) {
      lastInputStateMap.set(target2, inputState);
      emitRecord(assembleIncrementalSnapshot(IncrementalSource.Input, {
        id,
        ...inputState
      }));
    }
  }
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/mutationBatch.js
var MUTATION_PROCESS_MAX_DELAY = 100;
var MUTATION_PROCESS_MIN_DELAY = 16;
function createMutationBatch(processMutationBatch) {
  let cancelScheduledFlush = noop;
  let pendingMutations = [];
  function flush() {
    cancelScheduledFlush();
    processMutationBatch(pendingMutations);
    pendingMutations = [];
  }
  const { throttled: throttledFlush, cancel: cancelThrottle } = throttle(flush, MUTATION_PROCESS_MIN_DELAY, {
    leading: false
  });
  return {
    addMutations: (mutations) => {
      if (pendingMutations.length === 0) {
        cancelScheduledFlush = requestIdleCallback(throttledFlush, { timeout: MUTATION_PROCESS_MAX_DELAY });
      }
      pendingMutations.push(...mutations);
    },
    flush,
    stop: () => {
      cancelScheduledFlush();
      cancelThrottle();
    }
  };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/trackers/trackMutation.js
function trackMutation(target, emitRecord, emitStats, scope, serialize = defaultSerializeMutationsCallback()) {
  const MutationObserver = getMutationObserverConstructor();
  if (!MutationObserver) {
    return { stop: noop, flush: noop };
  }
  const mutationBatch = createMutationBatch((mutations) => {
    serialize(timeStampNow(), mutations.concat(observer.takeRecords()), emitRecord, emitStats, scope);
  });
  const observer = new MutationObserver(monitor(mutationBatch.addMutations));
  observer.observe(target, {
    attributeOldValue: true,
    attributes: true,
    characterData: true,
    characterDataOldValue: true,
    childList: true,
    subtree: true
  });
  return {
    stop: () => {
      observer.disconnect();
      mutationBatch.stop();
    },
    flush: () => {
      mutationBatch.flush();
    }
  };
}
function defaultSerializeMutationsCallback() {
  return isIncrementalSnapshotChangeRecordsEnabled() ? serializeMutationsAsChange : serializeMutations;
}

// ../../node_modules/@datadog/browser-rum/esm/domain/record/shadowRootsController.js
var initShadowRootsController = (emitRecord, emitStats) => {
  const controllerByShadowRoot = /* @__PURE__ */ new Map();
  const shadowRootsController = {
    addShadowRoot: (shadowRoot, scope) => {
      if (controllerByShadowRoot.has(shadowRoot)) {
        return;
      }
      const mutationTracker = trackMutation(shadowRoot, emitRecord, emitStats, scope);
      const inputTracker = trackInput(shadowRoot, emitRecord, scope);
      const scrollTracker = trackScroll(shadowRoot, emitRecord, scope);
      controllerByShadowRoot.set(shadowRoot, {
        flush: () => mutationTracker.flush(),
        stop: () => {
          mutationTracker.stop();
          inputTracker.stop();
          scrollTracker.stop();
        }
      });
    },
    removeShadowRoot: (shadowRoot) => {
      const entry = controllerByShadowRoot.get(shadowRoot);
      if (!entry) {
        return;
      }
      entry.stop();
      controllerByShadowRoot.delete(shadowRoot);
    },
    stop: () => {
      controllerByShadowRoot.forEach(({ stop }) => stop());
    },
    flush: () => {
      controllerByShadowRoot.forEach(({ flush }) => flush());
    }
  };
  return shadowRootsController;
};

// ../../node_modules/@datadog/browser-rum/esm/domain/record/record.js
function record(options) {
  const { emitRecord, emitStats, configuration, lifeCycle } = options;
  if (!emitRecord || !emitStats) {
    throw new Error("emit functions are required");
  }
  const processRecord = (record2) => {
    emitRecord(record2);
    sendToExtension("record", { record: record2 });
    const view = options.viewHistory.findView();
    addRecord(view.id);
  };
  const shadowRootsController = initShadowRootsController(processRecord, emitStats);
  const scope = createRecordingScope(configuration, createElementsScrollPositions(), shadowRootsController);
  const { stop: stopFullSnapshots } = startFullSnapshots(lifeCycle, processRecord, emitStats, flushMutations, scope);
  function flushMutations() {
    shadowRootsController.flush();
    mutationTracker.flush();
  }
  const mutationTracker = trackMutation(document, processRecord, emitStats, scope);
  const trackers = [
    mutationTracker,
    trackMove(processRecord, scope),
    trackMouseInteraction(processRecord, scope),
    trackScroll(document, processRecord, scope),
    trackViewportResize(processRecord, scope),
    trackInput(document, processRecord, scope),
    trackMediaInteraction(processRecord, scope),
    trackStyleSheet(processRecord, scope),
    trackFocus(processRecord, scope),
    trackVisualViewportResize(processRecord, scope),
    trackViewEnd(lifeCycle, processRecord, flushMutations)
  ];
  return {
    stop: () => {
      shadowRootsController.stop();
      trackers.forEach((tracker) => tracker.stop());
      stopFullSnapshots();
    },
    flushMutations,
    shadowRootsController
  };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/segmentCollection/buildReplayPayload.js
function buildReplayPayload(data, metadata, stats, rawSegmentBytesCount) {
  const formData = new FormData();
  formData.append("segment", new Blob([data], {
    type: "application/octet-stream"
  }), `${metadata.session.id}-${metadata.start}`);
  const metadataAndSegmentSizes = {
    raw_segment_size: rawSegmentBytesCount,
    compressed_segment_size: data.byteLength,
    ...metadata
  };
  const serializedMetadataAndSegmentSizes = JSON.stringify(metadataAndSegmentSizes);
  formData.append("event", new Blob([serializedMetadataAndSegmentSizes], { type: "application/json" }));
  return {
    data: formData,
    bytesCount: data.byteLength,
    cssText: stats.cssText,
    isFullSnapshot: metadata.index_in_view === 0,
    rawSize: rawSegmentBytesCount,
    recordCount: metadata.records_count,
    serializationDuration: stats.serializationDuration
  };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/segmentCollection/segment.js
function createSegment({ context, creationReason, encoder }) {
  let encodedBytesCount = 0;
  const viewId = context.view.id;
  const indexInView = getSegmentsCount(viewId);
  const metadata = {
    start: Infinity,
    end: -Infinity,
    creation_reason: creationReason,
    records_count: 0,
    has_full_snapshot: false,
    index_in_view: indexInView,
    source: "browser",
    ...context
  };
  const serializationStats = createSerializationStats();
  addSegment(viewId);
  function addRecord2(record2, callback) {
    metadata.start = Math.min(metadata.start, record2.timestamp);
    metadata.end = Math.max(metadata.end, record2.timestamp);
    metadata.records_count += 1;
    metadata.has_full_snapshot || (metadata.has_full_snapshot = record2.type === RecordType.FullSnapshot || record2.type === RecordType.Change && metadata.index_in_view === 0);
    const prefix = encoder.isEmpty ? '{"records":[' : ",";
    encoder.write(prefix + JSON.stringify(record2), (additionalEncodedBytesCount) => {
      encodedBytesCount += additionalEncodedBytesCount;
      callback(encodedBytesCount);
    });
  }
  function addStats(stats) {
    aggregateSerializationStats(serializationStats, stats);
  }
  function flush(callback) {
    if (encoder.isEmpty) {
      throw new Error("Empty segment flushed");
    }
    encoder.write(`],${JSON.stringify(metadata).slice(1)}
`);
    encoder.finish((encoderResult) => {
      addWroteData(metadata.view.id, encoderResult.rawBytesCount);
      callback(metadata, serializationStats, encoderResult);
    });
  }
  return { addRecord: addRecord2, addStats, flush };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/segmentCollection/segmentCollection.js
var SEGMENT_DURATION_LIMIT = 5 * ONE_SECOND;
var SEGMENT_BYTES_LIMIT = 6e4;
function startSegmentCollection(lifeCycle, configuration, sessionManager, viewHistory, httpRequest, encoder) {
  return doStartSegmentCollection(lifeCycle, () => computeSegmentContext(configuration.applicationId, sessionManager, viewHistory), httpRequest, encoder);
}
function doStartSegmentCollection(lifeCycle, getSegmentContext, httpRequest, encoder) {
  let state = {
    status: 0,
    nextSegmentCreationReason: "init"
  };
  const { unsubscribe: unsubscribeViewCreated } = lifeCycle.subscribe(2, () => {
    flushSegment("view_change");
  });
  const { unsubscribe: unsubscribePageMayExit } = lifeCycle.subscribe(11, (pageMayExitEvent) => {
    flushSegment(pageMayExitEvent.reason);
  });
  function flushSegment(flushReason) {
    if (state.status === 1) {
      state.segment.flush((metadata, stats, encoderResult) => {
        const payload = buildReplayPayload(encoderResult.output, metadata, stats, encoderResult.rawBytesCount);
        if (isPageExitReason(flushReason)) {
          httpRequest.sendOnExit(payload);
        } else {
          httpRequest.send(payload);
        }
      });
      clearTimeout(state.expirationTimeoutId);
    }
    if (flushReason !== "stop") {
      state = {
        status: 0,
        nextSegmentCreationReason: flushReason
      };
    } else {
      state = {
        status: 2
      };
    }
  }
  return {
    addRecord: (record2) => {
      if (state.status === 2) {
        return;
      }
      if (state.status === 0) {
        const context = getSegmentContext();
        if (!context) {
          return;
        }
        state = {
          status: 1,
          segment: createSegment({ encoder, context, creationReason: state.nextSegmentCreationReason }),
          expirationTimeoutId: setTimeout(() => {
            flushSegment("segment_duration_limit");
          }, SEGMENT_DURATION_LIMIT)
        };
      }
      state.segment.addRecord(record2, (encodedBytesCount) => {
        if (encodedBytesCount > SEGMENT_BYTES_LIMIT) {
          flushSegment("segment_bytes_limit");
        }
      });
    },
    addStats: (stats) => {
      if (state.status === 1) {
        state.segment.addStats(stats);
      }
    },
    stop: () => {
      flushSegment("stop");
      unsubscribeViewCreated();
      unsubscribePageMayExit();
    }
  };
}
function computeSegmentContext(applicationId, sessionManager, viewHistory) {
  const session = sessionManager.findTrackedSession();
  const viewContext = viewHistory.findView();
  if (!session || !viewContext) {
    return void 0;
  }
  return {
    application: {
      id: applicationId
    },
    session: {
      id: session.id
    },
    view: {
      id: viewContext.id
    }
  };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/segmentCollection/startSegmentTelemetry.js
function startSegmentTelemetry(telemetry, requestObservable) {
  if (!telemetry.metricsEnabled) {
    return { stop: noop };
  }
  const { unsubscribe } = requestObservable.subscribe((requestEvent) => {
    if (requestEvent.type === "failure" || requestEvent.type === "queue-full" || requestEvent.type === "success" && requestEvent.payload.isFullSnapshot) {
      const metrics = createSegmentMetrics(requestEvent.type, requestEvent.bandwidth, requestEvent.payload);
      addTelemetryMetrics("Segment network request metrics", { metrics });
    }
  });
  return {
    stop: unsubscribe
  };
}
function createSegmentMetrics(result, bandwidthStats, payload) {
  return {
    cssText: {
      count: payload.cssText.count,
      max: payload.cssText.max,
      sum: payload.cssText.sum
    },
    encoding: {
      fullSnapshot: isFullSnapshotChangeRecordsEnabled() ? "change" : "v1",
      incrementalSnapshot: isIncrementalSnapshotChangeRecordsEnabled() ? "change" : "v1"
    },
    isFullSnapshot: payload.isFullSnapshot,
    ongoingRequests: {
      count: bandwidthStats.ongoingRequestCount,
      totalSize: bandwidthStats.ongoingByteCount
    },
    recordCount: payload.recordCount,
    result,
    serializationDuration: {
      count: payload.serializationDuration.count,
      max: payload.serializationDuration.max,
      sum: payload.serializationDuration.sum
    },
    size: {
      compressed: payload.bytesCount,
      raw: payload.rawSize
    }
  };
}

// ../../node_modules/@datadog/browser-rum/esm/domain/startRecordBridge.js
function startRecordBridge(viewHistory) {
  const bridge = getEventBridge();
  return {
    addRecord: (record2) => {
      const view = viewHistory.findView();
      bridge.send("record", record2, view.id);
    }
  };
}

// ../../node_modules/@datadog/browser-rum/esm/boot/startRecording.js
function startRecording(lifeCycle, configuration, sessionManager, viewHistory, encoder, telemetry, httpRequest) {
  const cleanupTasks = [];
  const reportError = (error) => {
    lifeCycle.notify(14, { error });
    addTelemetryDebug("Error reported to customer", { "error.message": error.message });
  };
  const replayRequest = httpRequest || createHttpRequest([configuration.sessionReplayEndpointBuilder], reportError, SEGMENT_BYTES_LIMIT);
  let addRecord2;
  let addStats;
  if (!canUseEventBridge()) {
    const segmentCollection = startSegmentCollection(lifeCycle, configuration, sessionManager, viewHistory, replayRequest, encoder);
    addRecord2 = segmentCollection.addRecord;
    addStats = segmentCollection.addStats;
    cleanupTasks.push(segmentCollection.stop);
    const segmentTelemetry = startSegmentTelemetry(telemetry, replayRequest.observable);
    cleanupTasks.push(segmentTelemetry.stop);
  } else {
    ;
    ({ addRecord: addRecord2 } = startRecordBridge(viewHistory));
    addStats = noop;
  }
  const { stop: stopRecording } = record({
    emitRecord: addRecord2,
    emitStats: addStats,
    configuration,
    lifeCycle,
    viewHistory
  });
  cleanupTasks.push(stopRecording);
  return {
    stop: () => {
      cleanupTasks.forEach((task) => task());
    }
  };
}
export {
  startRecording
};
//# sourceMappingURL=startRecording-5PMBBHDD.js.map
