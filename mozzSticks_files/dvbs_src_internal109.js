
function dv_rolloutManager(handlersDefsArray, baseHandler) {
    this.handle = function () {
        var errorsArr = [];

        var handler = chooseEvaluationHandler(handlersDefsArray);
        if (handler) {
            var errorObj = handleSpecificHandler(handler);
            if (errorObj === null) {
                return errorsArr;
            }
            else {
                var debugInfo = handler.onFailure();
                if (debugInfo) {
                    for (var key in debugInfo) {
                        if (debugInfo.hasOwnProperty(key)) {
                            if (debugInfo[key] !== undefined || debugInfo[key] !== null) {
                                errorObj[key] = encodeURIComponent(debugInfo[key]);
                            }
                        }
                    }
                }
                errorsArr.push(errorObj);
            }
        }

        var errorObjHandler = handleSpecificHandler(baseHandler);
        if (errorObjHandler) {
            errorObjHandler['dvp_isLostImp'] = 1;
            errorsArr.push(errorObjHandler);
        }
        return errorsArr;
    };

    function handleSpecificHandler(handler) {
        var request;
        var errorObj = null;

        try {
            request = handler.createRequest();
            if (request && !request.isSev1) {
                var url = request.url || request;
                if (url) {
                    if (!handler.sendRequest(url)) {
                        errorObj = createAndGetError('sendRequest failed.',
                            url,
                            handler.getVersion(),
                            handler.getVersionParamName(),
                            handler.dv_script);
                    }
                } else {
                    errorObj = createAndGetError('createRequest failed.',
                        url,
                        handler.getVersion(),
                        handler.getVersionParamName(),
                        handler.dv_script,
                        handler.dvScripts,
                        handler.dvStep,
                        handler.dvOther
                    );
                }
            }
        }
        catch (e) {
            errorObj = createAndGetError(e.name + ': ' + e.message, request ? (request.url || request) : null, handler.getVersion(), handler.getVersionParamName(), (handler ? handler.dv_script : null));
        }

        return errorObj;
    }

    function createAndGetError(error, url, ver, versionParamName, dv_script, dvScripts, dvStep, dvOther) {
        var errorObj = {};
        errorObj[versionParamName] = ver;
        errorObj['dvp_jsErrMsg'] = encodeURIComponent(error);
        if (dv_script && dv_script.parentElement && dv_script.parentElement.tagName && dv_script.parentElement.tagName == 'HEAD') {
            errorObj['dvp_isOnHead'] = '1';
        }
        if (url) {
            errorObj['dvp_jsErrUrl'] = url;
        }
        if (dvScripts) {
            var dvScriptsResult = '';
            for (var id in dvScripts) {
                if (dvScripts[id] && dvScripts[id].src) {
                    dvScriptsResult += encodeURIComponent(dvScripts[id].src) + ":" + dvScripts[id].isContain + ",";
                }
            }
            
            
            
        }
        return errorObj;
    }

    function chooseEvaluationHandler(handlersArray) {
        var config = window._dv_win.dv_config;
        var index = 0;
        var isEvaluationVersionChosen = false;
        if (config.handlerVersionSpecific) {
            for (var i = 0; i < handlersArray.length; i++) {
                if (handlersArray[i].handler.getVersion() == config.handlerVersionSpecific) {
                    isEvaluationVersionChosen = true;
                    index = i;
                    break;
                }
            }
        }
        else if (config.handlerVersionByTimeIntervalMinutes) {
            var date = config.handlerVersionByTimeInputDate || new Date();
            var hour = date.getUTCHours();
            var minutes = date.getUTCMinutes();
            index = Math.floor(((hour * 60) + minutes) / config.handlerVersionByTimeIntervalMinutes) % (handlersArray.length + 1);
            if (index != handlersArray.length) { 
                isEvaluationVersionChosen = true;
            }
        }
        else {
            var rand = config.handlerVersionRandom || (Math.random() * 100);
            for (var i = 0; i < handlersArray.length; i++) {
                if (rand >= handlersArray[i].minRate && rand < handlersArray[i].maxRate) {
                    isEvaluationVersionChosen = true;
                    index = i;
                    break;
                }
            }
        }

        if (isEvaluationVersionChosen == true && handlersArray[index].handler.isApplicable()) {
            return handlersArray[index].handler;
        }
        else {
            return null;
        }
    }
}

function doesBrowserSupportHTML5Push() {
    "use strict";
    return typeof window.parent.postMessage === 'function' && window.JSON;
}

function dv_GetParam(url, name, checkFromStart) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = (checkFromStart ? "(?:\\?|&|^)" : "[\\?&]") + name + "=([^&#]*)";
    var regex = new RegExp(regexS, 'i');
    var results = regex.exec(url);
    if (results == null)
        return null;
    else
        return results[1];
}

function dv_Contains(array, obj) {
    var i = array.length;
    while (i--) {
        if (array[i] === obj) {
            return true;
        }
    }
    return false;
}

function dv_GetDynamicParams(url, prefix) {
    try {
        prefix = (prefix != undefined && prefix != null) ? prefix : 'dvp';
        var regex = new RegExp("[\\?&](" + prefix + "_[^&]*=[^&#]*)", "gi");
        var dvParams = regex.exec(url);

        var results = [];
        while (dvParams != null) {
            results.push(dvParams[1]);
            dvParams = regex.exec(url);
        }
        return results;
    }
    catch (e) {
        return [];
    }
}

function dv_createIframe() {
    var iframe;
    if (document.createElement && (iframe = document.createElement('iframe'))) {
        iframe.name = iframe.id = 'iframe_' + Math.floor((Math.random() + "") * 1000000000000);
        iframe.width = 0;
        iframe.height = 0;
        iframe.style.display = 'none';
        iframe.src = 'about:blank';
    }

    return iframe;
}

function dv_GetRnd() {
    return ((new Date()).getTime() + "" + Math.floor(Math.random() * 1000000)).substr(0, 16);
}

function dv_SendErrorImp(serverUrl, errorsArr) {

    for (var j = 0; j < errorsArr.length; j++) {
        var errorObj = errorsArr[j];
        var errorImp =   dv_CreateAndGetErrorImp(serverUrl, errorObj);
        dv_sendImgImp(errorImp);
    }
}

function dv_CreateAndGetErrorImp(serverUrl, errorObj) {
    var errorQueryString = '';
    for (key in errorObj) {
        if (errorObj.hasOwnProperty(key)) {
            if (key.indexOf('dvp_jsErrUrl') == -1) {
                errorQueryString += '&' + key + '=' + errorObj[key];
            }
            else {
                var params = ['ctx', 'cmp', 'plc', 'sid'];
                for (var i = 0; i < params.length; i++) {
                    var pvalue = dv_GetParam(errorObj[key], params[i]);
                    if (pvalue) {
                        errorQueryString += '&dvp_js' + params[i] + '=' + pvalue;
                    }
                }
            }
        }
    }

    var sslFlag = '&ssl=1';
    var errorImp = 'https://' + serverUrl + sslFlag + errorQueryString;

    return errorImp;
}

function dv_getDVUniqueKey(elm) {
    return elm && elm.getAttribute('data-uk');
}

function dv_getDVErrorGlobalScope(elm) {
    var uniqueKey = dv_getDVUniqueKey(elm);
    return uniqueKey && window._dv_win && window._dv_win[uniqueKey] && window._dv_win[uniqueKey].globalScopeVerifyErrorHandler || {};
}

function dv_onLoad(evt) {
    var elm = evt && evt.target || {};
    var globalScope = dv_getDVErrorGlobalScope(elm);
    if (globalScope) {
        var scriptSRC = dv_getScriptSRC(elm);
        if (!globalScope.isJSONPCalled) {
            setTimeout(function onTimeout(){
                globalScope.onTimeout(scriptSRC);
            }, globalScope.msTillJSONPCalled);
        }
    }
}

function dv_onResponse(evt) {
    var elm = evt && evt.target || {};
    var globalScope = dv_getDVErrorGlobalScope(elm);
    if (globalScope) {
        var scriptSRC = dv_getScriptSRC(elm);
        if (!globalScope.isJSONPCalled) {
            globalScope.onResponse(scriptSRC);
        }
    }
}

function dv_getScriptSRC(elm) {
    return elm && elm.src || '';
}
var IQPAParams = [
    "auprice", "ppid", "audeal", "auevent", "auadv", "aucmp", "aucrtv", "auorder", "ausite", "auplc", "auxch", "audvc", "aulitem",
    "auadid", "pltfrm", "aufilter1", "aufilter2", "autt", "auip", "aubndl", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9",
    "c10", "c11", "c12", "c13", "c14", "c15"
];

function dv_AppendIQPAParams(src) {
    var qs = [];
    var paramVal;
    IQPAParams.forEach(function forEachParam(paramName){
        paramVal = dv_GetParam(src, paramName);
        if (paramVal !== '' && paramVal !== null) {
            qs.push([paramName, paramVal].join('='));
        }
    });
    return qs.length && '&' + qs.join('&') || '';
}

function dv_onError(evt) {
    var elm = evt && evt.target || {};
    var globalScope = dv_getDVErrorGlobalScope(elm);
    if (globalScope) {
        globalScope.onError(dv_getScriptSRC(elm));
    }
}

function dv_getDVBSErrAddress(config) {
    return config && config.bsErrAddress || 'rtb0.doubleverify.com';
}

function dv_sendImgImp(url) {
    (new Image()).src = url;
}

function dv_sendScriptRequest(url, onLoad, onError, uniqueKey) {
    var emptyFunction = function(){};
    onLoad = onLoad || emptyFunction;
    onError = onError || emptyFunction;
    document.write('<scr' + 'ipt data-uk="' + uniqueKey + '" onerror="(' + onError + ')({target:this});" onload="(' + onLoad + ')({target:this});" type="text/javascript" src="' + url + '"></scr' + 'ipt>');
}

function dv_getPropSafe(obj, propName) {
    try {
        if (obj)
            return obj[propName];
    } catch (e) {
    }
}

function dvBsType() {
    var that = this;
    var eventsForDispatch = {};

    this.getEventsForDispatch = function getEventsForDispatch () {
        return eventsForDispatch;
    };

    var messageEventListener = function (event) {
        try {
            var timeCalled = getCurrentTime();
            var data = window.JSON.parse(event.data);
            if (!data.action) {
                data = window.JSON.parse(data);
            }
            if (data.timeStampCollection) {
                data.timeStampCollection.push({messageEventListenerCalled: timeCalled});
            }
            var myUID;
            var visitJSHasBeenCalledForThisTag = false;
            if ($dvbs.tags) {
                for (var uid in $dvbs.tags) {
                    if ($dvbs.tags.hasOwnProperty(uid) && $dvbs.tags[uid] && $dvbs.tags[uid].t2tIframeId === data.iFrameId) {
                        myUID = uid;
                        visitJSHasBeenCalledForThisTag = true;
                        break;
                    }
                }
            }

        } catch (e) {
            try {
                dv_SendErrorImp(window._dv_win.dv_config.tpsErrAddress + '/visit.jpg?flvr=0&ctx=818052&cmp=1619415&dvtagver=6.1.src&jsver=0&dvp_ist2tListener=1', {dvp_jsErrMsg: encodeURIComponent(e)});
            } catch (ex) {
            }
        }
    };

    if (window.addEventListener)
        addEventListener("message", messageEventListener, false);
    else
        attachEvent("onmessage", messageEventListener);

    this.pubSub = new function () {

        var subscribers = [];

        this.subscribe = function (eventName, uid, actionName, func) {
            if (!subscribers[eventName + uid])
                subscribers[eventName + uid] = [];
            subscribers[eventName + uid].push({Func: func, ActionName: actionName});
        };

        this.publish = function (eventName, uid) {
            var actionsResults = [];
            if (eventName && uid && subscribers[eventName + uid] instanceof Array)
                for (var i = 0; i < subscribers[eventName + uid].length; i++) {
                    var funcObject = subscribers[eventName + uid][i];
                    if (funcObject && funcObject.Func && typeof funcObject.Func == "function" && funcObject.ActionName) {
                        var isSucceeded = runSafely(function () {
                            return funcObject.Func(uid);
                        });
                        actionsResults.push(encodeURIComponent(funcObject.ActionName) + '=' + (isSucceeded ? '1' : '0'));
                    }
                }
            return actionsResults.join('&');
        };
    };

    this.domUtilities = new function () {

        this.addImage = function (url, parentElement, trackingPixelCompleteCallbackName) {
            url = appendCacheBuster(url);
            if (typeof(navigator.sendBeacon) === 'function') {
                var isSuccessfullyQueuedDataForTransfer = navigator.sendBeacon(url);
                if (isSuccessfullyQueuedDataForTransfer && typeof(window[trackingPixelCompleteCallbackName]) === 'function') {
                    window[trackingPixelCompleteCallbackName]();
                }
                return;
            }

            var image = new Image();
            if (typeof(window[trackingPixelCompleteCallbackName]) === 'function') {
                image.addEventListener('load', window[trackingPixelCompleteCallbackName]);
            }
            image.src = url;
        };

        this.addScriptResource = function (url, parentElement, onLoad, onError, uniqueKey) {
            var emptyFunction = function(){};
            onLoad = onLoad || emptyFunction;
            onError = onError || emptyFunction;
            uniqueKey = uniqueKey || '';
            if (parentElement) {
                var scriptElem = parentElement.ownerDocument.createElement("script");
                scriptElem.onerror = onError;
                scriptElem.onload = onLoad;
                if (scriptElem && typeof(scriptElem.setAttribute) === 'function') {
                    scriptElem.setAttribute('data-uk', uniqueKey);
                }
                scriptElem.type = 'text/javascript';
                scriptElem.src = appendCacheBuster(url);
                parentElement.insertBefore(scriptElem, parentElement.firstChild);
            }
            else {
                addScriptResourceFallBack(url, onLoad, onError, uniqueKey);
            }
        };

        function addScriptResourceFallBack(url, onLoad, onError, uniqueKey) {
            var emptyFunction = function(){};
            onLoad = onLoad || emptyFunction;
            onError = onError || emptyFunction;
            uniqueKey = uniqueKey || '';
            var scriptElem = document.createElement('script');
            scriptElem.onerror = onError;
            scriptElem.onload = onLoad;
            if (scriptElem && typeof(scriptElem.setAttribute) === 'function') {
                scriptElem.setAttribute('data-uk', uniqueKey);
            }
            scriptElem.type = "text/javascript";
            scriptElem.src = appendCacheBuster(url);
            var firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode.insertBefore(scriptElem, firstScript);
        }

        this.addScriptCode = function (srcCode, parentElement) {
            var scriptElem = parentElement.ownerDocument.createElement("script");
            scriptElem.type = 'text/javascript';
            scriptElem.innerHTML = srcCode;
            parentElement.insertBefore(scriptElem, parentElement.firstChild);
        };

        this.addHtml = function (srcHtml, parentElement) {
            var divElem = parentElement.ownerDocument.createElement("div");
            divElem.style = "display: inline";
            divElem.innerHTML = srcHtml;
            parentElement.insertBefore(divElem, parentElement.firstChild);
        };
    };

    this.resolveMacros = function (str, tag) {
        var viewabilityData = tag.getViewabilityData();
        var viewabilityBuckets = viewabilityData && viewabilityData.buckets ? viewabilityData.buckets : {};
        var upperCaseObj = objectsToUpperCase(tag, viewabilityData, viewabilityBuckets);
        var newStr = str.replace('[DV_PROTOCOL]', upperCaseObj.DV_PROTOCOL);
        newStr = newStr.replace('[PROTOCOL]', upperCaseObj.PROTOCOL);
        newStr = newStr.replace(/\[(.*?)\]/g, function (match, p1) {
            var value = upperCaseObj[p1];
            if (value === undefined || value === null)
                value = '[' + p1 + ']';
            return encodeURIComponent(value);
        });
        return newStr;
    };

    this.settings = new function () {
    };

    this.tagsType = function () {
    };

    this.tagsPrototype = function () {
        this.add = function (tagKey, obj) {
            if (!that.tags[tagKey])
                that.tags[tagKey] = new that.tag();
            for (var key in obj)
                that.tags[tagKey][key] = obj[key];
        };
    };

    this.tagsType.prototype = new this.tagsPrototype();
    this.tagsType.prototype.constructor = this.tags;
    this.tags = new this.tagsType();

    this.tag = function () {
    };
    this.tagPrototype = function () {
        this.set = function (obj) {
            for (var key in obj)
                this[key] = obj[key];
        };

        this.getViewabilityData = function () {
        };
    };

    this.tag.prototype = new this.tagPrototype();
    this.tag.prototype.constructor = this.tag;

    this.getTagObjectByService = function (serviceName) {

        for (var impressionId in this.tags) {
            if (typeof this.tags[impressionId] === 'object'
                && this.tags[impressionId].services
                && this.tags[impressionId].services[serviceName]
                && !this.tags[impressionId].services[serviceName].isProcessed) {
                this.tags[impressionId].services[serviceName].isProcessed = true;
                return this.tags[impressionId];
            }
        }


        return null;
    };

    this.addService = function (impressionId, serviceName, paramsObject) {

        if (!impressionId || !serviceName)
            return;

        if (!this.tags[impressionId])
            return;
        else {
            if (!this.tags[impressionId].services)
                this.tags[impressionId].services = {};

            this.tags[impressionId].services[serviceName] = {
                params: paramsObject,
                isProcessed: false
            };
        }
    };

    this.Enums = {
        BrowserId: {Others: 0, IE: 1, Firefox: 2, Chrome: 3, Opera: 4, Safari: 5},
        TrafficScenario: {OnPage: 1, SameDomain: 2, CrossDomain: 128}
    };

    this.CommonData = {};

    var runSafely = function (action) {
        try {
            var ret = action();
            return ret !== undefined ? ret : true;
        } catch (e) {
            return false;
        }
    };

    var objectsToUpperCase = function () {
        var upperCaseObj = {};
        for (var i = 0; i < arguments.length; i++) {
            var obj = arguments[i];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    upperCaseObj[key.toUpperCase()] = obj[key];
                }
            }
        }
        return upperCaseObj;
    };

    var appendCacheBuster = function (url) {
        if (url !== undefined && url !== null && url.match("^http") == "http") {
            if (url.indexOf('?') !== -1) {
                if (url.slice(-1) == '&')
                    url += 'cbust=' + dv_GetRnd();
                else
                    url += '&cbust=' + dv_GetRnd();
            }
            else
                url += '?cbust=' + dv_GetRnd();
        }
        return url;
    };

    
    var messagesClass = function () {
        var waitingMessages = [];

        this.registerMsg = function(dvFrame, data) {
            if (!waitingMessages[dvFrame.$frmId]) {
                waitingMessages[dvFrame.$frmId] = [];
            }

            waitingMessages[dvFrame.$frmId].push(data);

            if (dvFrame.$uid) {
                sendWaitingEventsForFrame(dvFrame, dvFrame.$uid);
            }
        };

        this.startSendingEvents = function(dvFrame, impID) {
            sendWaitingEventsForFrame(dvFrame, impID);
            
        };

        function sendWaitingEventsForFrame(dvFrame, impID) {
            if (waitingMessages[dvFrame.$frmId]) {
                var eventObject = {};
                for (var i = 0; i < waitingMessages[dvFrame.$frmId].length; i++) {
                    var obj = waitingMessages[dvFrame.$frmId].pop();
                    for (var key in obj) {
                        if (typeof obj[key] !== 'function' && obj.hasOwnProperty(key)) {
                            eventObject[key] = obj[key];
                        }
                    }
                }
                that.registerEventCall(impID, eventObject);
            }
        }

        function startMessageManager() {
            for (var frm in waitingMessages) {
                if (frm && frm.$uid) {
                    sendWaitingEventsForFrame(frm, frm.$uid);
                }
            }
            setTimeout(startMessageManager, 10);
        }
    };
    this.messages = new messagesClass();

    this.dispatchRegisteredEventsFromAllTags = function () {
        for (var impressionId in this.tags) {
            if (typeof this.tags[impressionId] !== 'function' && typeof this.tags[impressionId] !== 'undefined')
                dispatchEventCalls(impressionId, this);
        }
    };

    var dispatchEventCalls = function (impressionId, dvObj) {
        var tag = dvObj.tags[impressionId];
        var eventObj = eventsForDispatch[impressionId];
        if (typeof eventObj !== 'undefined' && eventObj != null) {
            var url = 'https://' + tag.ServerPublicDns + "/bsevent.gif?flvr=0&impid=" + impressionId + '&' + createQueryStringParams(eventObj);
            dvObj.domUtilities.addImage(url, tag.tagElement.parentElement);
            eventsForDispatch[impressionId] = null;
        }
    };

    this.registerEventCall = function (impressionId, eventObject, timeoutMs) {
        addEventCallForDispatch(impressionId, eventObject);

        if (typeof timeoutMs === 'undefined' || timeoutMs == 0 || isNaN(timeoutMs))
            dispatchEventCallsNow(this, impressionId, eventObject);
        else {
            if (timeoutMs > 2000)
                timeoutMs = 2000;

            var dvObj = this;
            setTimeout(function () {
                dispatchEventCalls(impressionId, dvObj);
            }, timeoutMs);
        }
    };

    this.createEventCallUrl = function(impId, eventObject) {
        var tag = this.tags && this.tags[impId];
        if (tag && typeof eventObject !== 'undefined' && eventObject !== null) {
            return ['https://', tag.ServerPublicDns, '/bsevent.gif?flvr=0&impid=', impId, '&', createQueryStringParams(eventObject)].join('');
        }
    }

    var dispatchEventCallsNow = function (dvObj, impressionId, eventObject) {
        addEventCallForDispatch(impressionId, eventObject);
        dispatchEventCalls(impressionId, dvObj);
    };

    var addEventCallForDispatch = function (impressionId, eventObject) {
        for (var key in eventObject) {
            if (typeof eventObject[key] !== 'function' && eventObject.hasOwnProperty(key)) {
                if (!eventsForDispatch[impressionId])
                    eventsForDispatch[impressionId] = {};
                eventsForDispatch[impressionId][key] = eventObject[key];
            }
        }
    };

    if (window.addEventListener) {
        window.addEventListener('unload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
        window.addEventListener('beforeunload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
    }
    else if (window.attachEvent) {
        window.attachEvent('onunload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
        window.attachEvent('onbeforeunload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
    }
    else {
        window.document.body.onunload = function () {
            that.dispatchRegisteredEventsFromAllTags();
        };
        window.document.body.onbeforeunload = function () {
            that.dispatchRegisteredEventsFromAllTags();
        };
    }

    var createQueryStringParams = function (values) {
        var params = '';
        for (var key in values) {
            if (typeof values[key] !== 'function') {
                var value = encodeURIComponent(values[key]);
                if (params === '')
                    params += key + '=' + value;
                else
                    params += '&' + key + '=' + value;
            }
        }

        return params;
    };
}


function dv_baseHandler(){function M(b){var d=window._dv_win,f=0;try{for(;10>f;){if(d[b]&&"object"===typeof d[b])return!0;if(d==d.parent)break;f++;d=d.parent}}catch(c){}return!1}function G(b,d,f){f=f||150;var c=window._dv_win||window;if(c.document&&c.document.body)return d&&d.parentNode?d.parentNode.insertBefore(b,d):c.document.body.insertBefore(b,c.document.body.firstChild),!0;if(0<f)setTimeout(function(){G(b,d,--f)},20);else return!1}function N(b){var d=window._dv_win.dv_config=window._dv_win.dv_config||
{};d.cdnAddress=d.cdnAddress||"cdn.doubleverify.com";return'<html><head><script type="text/javascript">('+function(){try{window.$dv=window.$dvbs||parent.$dvbs,window.$dv.dvObjType="dvbs"}catch(f){}}.toString()+')();\x3c/script></head><body><script type="text/javascript">('+(b||"function() {}")+')("'+d.cdnAddress+'");\x3c/script><script type="text/javascript">setTimeout(function() {document.close();}, 0);\x3c/script></body></html>'}function H(b){var d=0,f;for(f in b)b.hasOwnProperty(f)&&++d;return d}
function O(b,d){a:{var f={};try{if(b&&b.performance&&b.performance.getEntries){var c=b.performance.getEntries();for(b=0;b<c.length;b++){var e=c[b],p=e.name.match(/.*\/(.+?)\./);if(p&&p[1]){var g=p[1].replace(/\d+$/,""),k=d[g];if(k){for(var h=0;h<k.stats.length;h++){var r=k.stats[h];f[k.prefix+r.prefix]=Math.round(e[r.name])}delete d[g];if(!H(d))break}}}}var m=f;break a}catch(w){}m=void 0}if(m&&H(m))return m}function P(b,d){function f(b){var c=r,e;for(e in b)b.hasOwnProperty(e)&&(c+=["&"+e,"="+b[e]].join(""));
return c}function c(){return Date.now?Date.now():(new Date).getTime()}function e(){if(!A){A=!0;var e=f({dvp_injd:1});$dvbs.domUtilities.addImage(e,document.body);e="https://cdn.doubleverify.com/dvtp_src.js#tagtype=video";var d="ctx cmp plc sid adsrv adid crt advid prr dup turl iframe ad vssd apifw vstvr tvcp ppid auip pltfrm gdpr gdpr_consent adu invs litm ord sadv scrt vidreg seltag splc spos sup unit dvtagver msrapi vfwctx auprice audeal auevent auadv aucmp aucrtv auorder ausite auplc auxch audvc aulitem auadid autt c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 c11 c12 c13 c14 c15 aufilter1 aufilter2 ppid".split(" ");
for(i=0;i<d.length;i++){var p=d[i],g=k(b,p);void 0!==g&&(e+=["&",p,"=",encodeURIComponent(g)].join(""))}e+="&gmnpo="+("1"==b.gmnpo?"1":"0");e+="&dvp_dvtpts="+c();e+="&bsimpid="+h;void 0!==b.dvp_aubndl&&(e+="&aubndl="+encodeURIComponent(b.dvp_aubndl));for(var m in b)b.hasOwnProperty(m)&&m.match(/^dvpx?_/i)&&b[m]&&(e+=["&",m.toLocaleLowerCase(),"=",encodeURIComponent(b[m])].join(""));$dvbs.domUtilities.addScriptResource(e,document.body)}}function p(b){var e={};e[b]=c();b=f(e);$dvbs.domUtilities.addImage(b,
document.body)}function g(b,e){-1<t.indexOf(b)?p(e):z.subscribe(function(){p(e)},b)}function k(b,e){e=e.toLowerCase();for(tmpKey in b)if(tmpKey.toLowerCase()===e)return b[tmpKey];return null}var h=b.impressionId,r=window._dv_win.dv_config.bsEventJSURL?window._dv_win.dv_config.bsEventJSURL:"https://"+b.ServerPublicDns+"/bsevent.gif";r+="?flvr=0&impid="+encodeURIComponent(h);var m=f({dvp_innovidImp:1}),w="responseReceived_"+h,u=b.DVP_DCB||b.DVP_DECISION_CALLBACK,n=k(b,"adid"),q=function(b){var e=b;
switch(b){case 5:e=1;break;case 6:e=2}return e}(d.ResultID),A=!1;$dvbs.domUtilities.addImage(m,document.body);if("function"===typeof window[u]){var v=!1;setTimeout(function(){var b=f({dvp_wasCallbackCalled:v});$dvbs.domUtilities.addImage(b,document.body)},1E3);window[w]=function(b,d,p,g,m,k,n){v=!0;try{if(n){var l=f({dvp_stat:n});$dvbs.domUtilities.addImage(l,document.body)}else{l=f({dvp_r9:c()});$dvbs.domUtilities.addImage(l,document.body);p="&dvp_cStartTS="+p+"&dvp_cEndTS="+g+"&dvp_dReceivedTS="+
m+"&dvp_wasAdPlayed="+b;g=q;if(!d)switch(g=2,q){case 1:var h=21;break;case 2:h=20;break;case 3:h=22;break;case 4:h=23}l=f({bres:g,breason:h,dvp_blkDecUsed:d?"1":"0"})+p;$dvbs.domUtilities.addImage(l,document.body,k);b&&!checkIsOvv()&&e()}}catch(Q){b=f({dvp_innovidCallbackEx:1,dvp_innovidCallbackExMsg:Q}),$dvbs.domUtilities.addImage(b,document.body)}};try{var x=f({dvp_r8:c()});$dvbs.domUtilities.addImage(x,document.body);window[u](q,w)}catch(y){d=f({dvp_innovidEx:1,dvp_innovidExMsg:y}),$dvbs.domUtilities.addImage(d,
document.body)}}else d=f({dvp_innovidNoCallback:1}),$dvbs.domUtilities.addImage(d,document.body);try{var z=window[n]();if(z.getPreviousEvents&&"function"===typeof z.getPreviousEvents){x=f({dvp_r10:c()});$dvbs.domUtilities.addImage(x,document.body);var t=z.getPreviousEvents(),l=0;-1<t.indexOf("AdStarted")?(l=1,e()):z.subscribe(e,"AdStarted");x=f({dvp_innovidAdStarted:l,dvp_innovidPrevEvents:t});$dvbs.domUtilities.addImage(x,document.body);g("AdError","dvp_ader");g("AdStopped","dvp_adst");g("AdVideoStart",
"dvp_avse");g("AdImpression","dvp_aie")}else l=f({dvp_innovidCallbackEx:3,dvp_innovidCallbackExMsg:"vpaidWrapper.getPreviousEvents not a function"}),$dvbs.domUtilities.addImage(l,document.body)}catch(y){l=f({dvp_innovidCallbackEx:2,dvp_innovidCallbackExMsg:y,dvp_adid:n}),$dvbs.domUtilities.addImage(l,document.body)}}function R(b){var d,f=window._dv_win.document.visibilityState;window[b.tagObjectCallbackName]=function(c){var e=window._dv_win.$dvbs;e&&(d=c.ImpressionID,e.tags.add(c.ImpressionID,b),
e.tags[c.ImpressionID].set({tagElement:b.script,impressionId:c.ImpressionID,dv_protocol:b.protocol,protocol:"https:",uid:b.uid,serverPublicDns:c.ServerPublicDns,ServerPublicDns:c.ServerPublicDns}),b.script&&b.script.dvFrmWin&&(b.script.dvFrmWin.$uid=c.ImpressionID,e.messages&&e.messages.startSendingEvents&&e.messages.startSendingEvents(b.script.dvFrmWin,c.ImpressionID)),function(){function b(){var d=window._dv_win.document.visibilityState;"prerender"===f&&"prerender"!==d&&"unloaded"!==d&&(f=d,window._dv_win.$dvbs.registerEventCall(c.ImpressionID,
{prndr:0}),window._dv_win.document.removeEventListener(e,b))}if("prerender"===f)if("prerender"!==window._dv_win.document.visibilityState&&"unloaded"!==visibilityStateLocal)window._dv_win.$dvbs.registerEventCall(c.ImpressionID,{prndr:0});else{var e;"undefined"!==typeof window._dv_win.document.hidden?e="visibilitychange":"undefined"!==typeof window._dv_win.document.mozHidden?e="mozvisibilitychange":"undefined"!==typeof window._dv_win.document.msHidden?e="msvisibilitychange":"undefined"!==typeof window._dv_win.document.webkitHidden&&
(e="webkitvisibilitychange");window._dv_win.document.addEventListener(e,b,!1)}}());if("1"!=b.foie)try{var p=O(window,{verify:{prefix:"vf",stats:[{name:"duration",prefix:"dur"}]}});p&&window._dv_win.$dvbs.registerEventCall(c.ImpressionID,p)}catch(g){}};window[b.callbackName]=function(c){B.setIsJSONPCalled(!0);var e=window._dv_win.$dvbs&&"object"==typeof window._dv_win.$dvbs.tags[d]?window._dv_win.$dvbs.tags[d]:b;var f=window._dv_win.dv_config.bs_renderingMethod||function(b){document.write(b)};"2"!=
e.tagformat||void 0===e.DVP_DCB&&void 0===e.DVP_DECISION_CALLBACK||setTimeout(function(){P(e,c)},0);switch(c.ResultID){case 1:e.tagPassback?f(e.tagPassback):c.Passback?f(decodeURIComponent(c.Passback)):c.AdWidth&&c.AdHeight&&f(decodeURIComponent("%3Cdiv%20style%3D%22display%3A%20flex%3B%20align-items%3A%20center%3B%20justify-content%3A%20center%3B%20width%3A%20"+c.AdWidth+"px%3B%20height%3A%20"+c.AdHeight+"px%3B%20outline-offset%3A%20-1px%3B%20background%3A%20url('data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAYAAAGWvHq%2BAAAABmJLR0QA%2FwD%2FAP%2BgvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AQBECEbFuFN7gAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAFBklEQVRo3uUby3arOEzxAbxIyKLt%2F%2F9gIQtIF4aFZ5ERVxhJyIbcnjmjTZLast4vQ%2BG762OMMX53fQzTFIfxGenfKvgXvj4%2FoOsfy3eECgBgmmcYhnFZ6PoHeO%2F%2FbBiGEQAAxufPghlC%2BLOBYqa%2FHezAJcYYOUz87QAA7vd2g4lMAsrLfQJ%2BQeUM43PZsMJEwN8L58gMfgIAAMVKv6syX4bxGVF9qTiuvV2Byouf7e0Kl%2B%2Buj6kJU8aktV07aFClTkThfm9hGMbNGu53dCNd%2FPr8gBCm5TsnAivz%2BPwBqkHvPaDiVvpAW6Nh0FBhmpagSdfQV0Q7oVySPrz3LyO3t%2BvCKrJIHTtdG58%2FvLycZk%2Bzr1uFkgFWuYHKZHHNEMIr4lMb0pO5v7e3qyyj983KATYydv1jswFZneZ5wzaKVaEMVnNgjsw2B8pcbMdLmKbY1PVG5dTl0rVpnsGlSDReOcfo%2Bgc0df3SagrTPC8m4aDrH1ClaR4AgHKRmgN%2FL9HBbeI4wdKVitXUtYpLGXPSgpUg1lBaPzWCWW6wJ4lkB9aFUL1pQkXOvW9WBDltULNM8wwhTEtIcQn88t31kdpEU7FmOwsemqiiqtPsQvufXMCmCulUSKy9XaG9XYGrLhbv1iSlWU0NGdyQqlPKBHQfh0vxVkQ1abSQybX3oQ7nUPWUpEQ1oaokLVAnSfG4cy8xxpjrEFyVtuCJNt3rETDgu%2F6xiT9zRqKSci0DxzHdZ5E0zXabjGTtwSxr9FyqjazSJkmTi%2Bckb01BS5HaGnems%2BZWzdb62qQTfQdwDDl2Wj0RuKnYpX1sDrJljcvHTqow4%2FNn5SBNXYuzPD0Y8agDsRlpr3NIg1vyYGnSS%2BPUURVIcRhC2A0ZyYPxTKqNyuo8IYRlpMSGLYRJDRdOYyEEqEpDIIfY5qYhhLBrL0s%2BLS7imqq995tijYVdCxlx0EMnaW9XlvD93m4aZ0s4cZ3gqspYOjppRKcMcXipGZyU7Ju63iXIhVOKx53trCWqtMpwZzor8n%2BqynBnnlJlNGa5M51VSmlksBSDlOHlKk%2FzUq0KcVVEYgidytz3coS19lPrFh1y2fUP1Xu1HKsRxHWakao9hLNglZHeESaal3vvocKx3zKP7BXnLJtaxgNkjKY1Wp1y7inYUVG7Akg79vSeKefKwHJ1kEtTikBxJrYkmpIBr1TgPdgbrZ1WkPbuz84UEiNZG1ZLhdydE0sqeqlytGG2pEt4%2B0Ccc9H8zs4kS1Br0542F0fqR0lesOCwyehoIioZq86gqcWq6XbZwrTGqMSAhmOhKWVpjp74PObIsLt3R3g0g1oETs8R32woFbLEHUuEs9CiZa6SslZJmpcuf%2F4GcNc0tDf9lYcxvwGVrI3mkDVeY0NjbumOui9XCtkYlZJIbjt3pF8tzQ0czZTvTXnJSdlHSstRXAlPUpQ4vRy1TK4nnNEwaDTd2ZNE6fQSQiieevBiprjXLamjpco5Mv1YSuH%2Fpry4o%2BMPN70cgZI4tYyG7h3J4evzI1tJ%2BIynBLTHMdnlpXQKsTQCkoAaPakZEctL%2BpbK0Y7FMkloCnrXHMsKileMpS0ZR3zvveez2kDJG6szRiSuJqaulfbOaQJ5KfcYH5wnLK82v2uMCmHaPDz%2BDVj%2BfSNNBGdZmIu9v6EIKWbVZHTmVYrl9clSRVsS0urOKDdlW1J%2B6SubFoH3SiF13X8A3uobUgsAG3MAAAAASUVORK5CYII%3D')%20repeat%3B%20outline%3A%20solid%201px%20%23969696%3B%22%3E%3C%2Fdiv%3E"));
break;case 2:case 3:e.tagAdtag&&f(e.tagAdtag);break;case 4:c.AdWidth&&c.AdHeight&&f(decodeURIComponent("%3Cstyle%3E%0A.dvbs_container%20%7B%0A%09border%3A%201px%20solid%20%233b599e%3B%0A%09overflow%3A%20hidden%3B%0A%09filter%3A%20progid%3ADXImageTransform.Microsoft.gradient(startColorstr%3D%27%23315d8c%27%2C%20endColorstr%3D%27%2384aace%27)%3B%0A%7D%0A%3C%2Fstyle%3E%0A%3Cdiv%20class%3D%22dvbs_container%22%20style%3D%22width%3A%20"+c.AdWidth+"px%3B%20height%3A%20"+c.AdHeight+"px%3B%22%3E%09%0A%3C%2Fdiv%3E"))}}}
function S(b){var d=null,f=null,c=function(b){var e=dv_GetParam(b,"cmp");b=dv_GetParam(b,"ctx");return"919838"==b&&"7951767"==e||"919839"==b&&"7939985"==e||"971108"==b&&"7900229"==e||"971108"==b&&"7951940"==e?"</scr'+'ipt>":/<\/scr\+ipt>/g}(b.src);"function"!==typeof String.prototype.trim&&(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")});var e=function(b){!(b=b.previousSibling)||"#text"!=b.nodeName||null!=b.nodeValue&&void 0!=b.nodeValue&&0!=b.nodeValue.trim().length||(b=b.previousSibling);
if(b&&"SCRIPT"==b.tagName&&b.getAttribute("type")&&("text/adtag"==b.getAttribute("type").toLowerCase()||"text/passback"==b.getAttribute("type").toLowerCase())&&""!=b.innerHTML.trim()){if("text/adtag"==b.getAttribute("type").toLowerCase())return d=b.innerHTML.replace(c,"\x3c/script>"),{isBadImp:!1,hasPassback:!1,tagAdTag:d,tagPassback:f};if(null!=f)return{isBadImp:!0,hasPassback:!1,tagAdTag:d,tagPassback:f};f=b.innerHTML.replace(c,"\x3c/script>");b=e(b);b.hasPassback=!0;return b}return{isBadImp:!0,
hasPassback:!1,tagAdTag:d,tagPassback:f}};return e(b)}function J(b,d,f,c,e,p,g,k,h,r,m,w){d.dvregion=0;var u=dv_GetParam(l,"useragent");l=window._dv_win.$dvbs.CommonData;if(void 0!=l.BrowserId&&void 0!=l.BrowserVersion&&void 0!=l.BrowserIdFromUserAgent)var n={ID:l.BrowserId,version:l.BrowserVersion,ID_UA:l.BrowserIdFromUserAgent};else n=T(u?decodeURIComponent(u):navigator.userAgent),l.BrowserId=n.ID,l.BrowserVersion=n.version,l.BrowserIdFromUserAgent=n.ID_UA;var q="";void 0!=d.aUrl&&(q="&aUrl="+d.aUrl);
var A="";try{c.depth=U(c);var v=V(c,f,n);if(v&&v.duration){var x="&dvp_strhd="+v.duration;x+="&dvpx_strhd="+v.duration}v&&v.url||(v=W(c));v&&v.url&&(q="&aUrl="+encodeURIComponent(v.url),A="&aUrlD="+v.depth);var z=c.depth+e;p&&c.depth--}catch(I){x=A=q=z=c.depth=""}a:{try{if("object"==typeof window.$ovv||"object"==typeof window.parent.$ovv){var t=1;break a}}catch(I){}t=0}e=function(){function b(e){c++;var d=e.parent==e;return e.mraid||d?e.mraid:20>=c&&b(e.parent)}var e=window._dv_win||window,c=0;try{return b(e)}catch(fa){}}();
var l=d.script.src;t="&ctx="+(dv_GetParam(l,"ctx")||"")+"&cmp="+(dv_GetParam(l,"cmp")||"")+"&plc="+(dv_GetParam(l,"plc")||"")+"&sid="+(dv_GetParam(l,"sid")||"")+"&advid="+(dv_GetParam(l,"advid")||"")+"&adsrv="+(dv_GetParam(l,"adsrv")||"")+"&unit="+(dv_GetParam(l,"unit")||"")+"&isdvvid="+(dv_GetParam(l,"isdvvid")||"")+"&uid="+d.uid+"&tagtype="+(dv_GetParam(l,"tagtype")||"")+"&adID="+(dv_GetParam(l,"adID")||"")+"&app="+(dv_GetParam(l,"app")||"")+"&sup="+(dv_GetParam(l,"sup")||"")+"&isovv="+t+"&gmnpo="+
(dv_GetParam(l,"gmnpo")||"")+"&crt="+(dv_GetParam(l,"crt")||"");"1"==dv_GetParam(l,"foie")&&(t+="&foie=1");e&&(t+="&ismraid=1");(e=dv_GetParam(l,"xff"))&&(t+="&xff="+e);(e=dv_GetParam(l,"vssd"))&&(t+="&vssd="+e);(e=dv_GetParam(l,"apifw"))&&(t+="&apifw="+e);(e=dv_GetParam(l,"vstvr"))&&(t+="&vstvr="+e);(e=dv_GetParam(l,"tvcp"))&&(t+="&tvcp="+e);m&&(t+="&urlsrc=sf");w&&(t+="&sfe=1");navigator&&navigator.maxTouchPoints&&5==navigator.maxTouchPoints&&(t+="&touch=1");navigator&&navigator.platform&&(t+="&nav_pltfrm="+
navigator.platform);x&&(t+=x);u&&(t+="&useragent="+u);n&&(t+="&brid="+n.ID+"&brver="+n.version+"&bridua="+n.ID_UA);t+="&dup="+dv_GetParam(l,"dup");try{t+=dv_AppendIQPAParams(l)}catch(I){}(m=dv_GetParam(l,"turl"))&&(t+="&turl="+m);(m=dv_GetParam(l,"tagformat"))&&(t+="&tagformat="+m);"video"===dv_GetParam(l,"tagtype")&&(t+="&DVP_BYPASS219=1");t+=X();r=r?"&dvf=0":"";m=M("maple")?"&dvf=1":"";c=(window._dv_win.dv_config.verifyJSURL||"https://"+(window._dv_win.dv_config.bsAddress||"rtb"+d.dvregion+".doubleverify.com")+
"/verify.js")+"?flvr=0&jsCallback="+d.callbackName+"&jsTagObjCallback="+d.tagObjectCallbackName+"&num=6"+t+"&srcurlD="+c.depth+"&ssl="+d.ssl+r+m+"&refD="+z+d.tagIntegrityFlag+d.tagHasPassbackFlag+"&htmlmsging="+(g?"1":"0");(g=dv_GetDynamicParams(l,"dvp").join("&"))&&(c+="&"+g);(g=dv_GetDynamicParams(l,"dvpx").join("&"))&&(c+="&"+g);if(!1===k||h)c=c+("&dvp_isBodyExistOnLoad="+(k?"1":"0"))+("&dvp_isOnHead="+(h?"1":"0"));f="srcurl="+encodeURIComponent(f);(k=Y())&&(f+="&ancChain="+encodeURIComponent(k));
k=4E3;/MSIE (\d+\.\d+);/.test(navigator.userAgent)&&7>=new Number(RegExp.$1)&&(k=2E3);if(h=dv_GetParam(l,"referrer"))h="&referrer="+h,c.length+h.length<=k&&(c+=h);(h=dv_GetParam(l,"prr"))&&(c+="&prr="+h);(h=dv_GetParam(l,"iframe"))&&(c+="&iframe="+h);(h=dv_GetParam(l,"gdpr"))&&(c+="&gdpr="+h);(h=dv_GetParam(l,"gdpr_consent"))&&(c+="&gdpr_consent="+h);q.length+A.length+c.length<=k&&(c+=A,f+=q);(q=Z())&&(c+="&m1="+q);(q=aa())&&0<q.f&&(c+="&bsig="+q.f,c+="&usig="+q.s);q=ba();0<q&&(c+="&hdsig="+q);navigator&&
navigator.hardwareConcurrency&&(c+="&noc="+navigator.hardwareConcurrency);c+=ca();q=da();c+="&vavbkt="+q.vdcd;c+="&lvvn="+q.vdcv;""!=q.err&&(c+="&dvp_idcerr="+encodeURIComponent(q.err));"prerender"===window._dv_win.document.visibilityState&&(c+="&prndr=1");(l=dv_GetParam(l,"wrapperurl"))&&1E3>=l.length&&c.length+l.length<=k&&(c+="&wrapperurl="+l);c+="&"+b.getVersionParamName()+"="+b.getVersion();b="&eparams="+encodeURIComponent(E(f));c=c.length+b.length<=k?c+b:c+"&dvf=3";window.performance&&window.performance.mark&&
window.performance.measure&&window.performance.getEntriesByName&&(window.performance.mark("dv_create_req_end"),window.performance.measure("dv_creqte_req","dv_create_req_start","dv_create_req_end"),(b=window.performance.getEntriesByName("dv_creqte_req"))&&0<b.length&&(c+="&dvp_exetime="+b[0].duration.toFixed(2)));for(var y in d)d.hasOwnProperty(y)&&void 0!==d[y]&&-1<["number","string"].indexOf(typeof d[y])&&-1===["protocol","callbackName","dvregion"].indexOf(y.toLowerCase())&&!y.match(/^tag[A-Z]/)&&
!(new RegExp("(\\?|&)"+y+"=","gi")).test(c)&&(c+=["&",y,"=",encodeURIComponent(d[y])].join(""));return{isSev1:!1,url:c}}function X(){var b="";try{var d=window._dv_win.parent;b+="&chro="+(void 0===d.chrome?"0":"1");b+="&hist="+(d.history?d.history.length:"");b+="&winh="+d.innerHeight;b+="&winw="+d.innerWidth;b+="&wouh="+d.outerHeight;b+="&wouw="+d.outerWidth;d.screen&&(b+="&scah="+d.screen.availHeight,b+="&scaw="+d.screen.availWidth)}catch(f){}return b}function da(){var b=[],d=function(b){c(b,null!=
b.AZSD,9);c(b,b.location.hostname!=b.encodeURIComponent(b.location.hostname),10);c(b,null!=b.cascadeWindowInfo,11);c(b,null!=b._rvz,32);c(b,null!=b.FO_DOMAIN,34);c(b,null!=b.va_subid,36);c(b,b._GPL&&b._GPL.baseCDN,40);c(b,f(b,"__twb__")&&f(b,"__twb_cb_"),43);c(b,null!=b.landingUrl&&null!=b.seList&&null!=b.parkingPPCTitleElements&&null!=b.allocation,45);c(b,f(b,"_rvz",function(b){return null!=b.publisher_subid}),46);c(b,null!=b.cacildsFunc&&null!=b.n_storesFromFs,47);c(b,b._pcg&&b._pcg.GN_UniqueId,
54);c(b,f(b,"__ad_rns_")&&f(b,"_$_"),64);c(b,null!=b.APP_LABEL_NAME_FULL_UC,71);c(b,null!=b._priam_adblock,81);c(b,b.supp_ads_host&&b.supp_ads_host_overridden,82);c(b,b.uti_xdmsg_manager&&b.uti_xdmsg_manager.cb,87);c(b,b.LogBundleData&&b.addIframe,91);c(b,b.xAdsXMLHelperId||b.xYKAffSubIdTag,95);c(b,b.__pmetag&&b.__pmetag.uid,98);c(b,b.CustomWLAdServer&&/(n\d{1,4}adserv)|(1ads|cccpmo|epommarket|epmads|adshost1)/.test(b.supp_ads_host_overridden),100)},f=function(b,c,d){for(var e in b)if(-1<e.indexOf(c)&&
(!d||d(b[e])))return!0;return!1},c=function(c,d,f){d&&-1==b.indexOf(f)&&b.push((c==window.top?-1:1)*f)};try{return function(){for(var b=window,c=0;10>c&&(d(b),b!=window.top);c++)try{b.parent.document&&(b=b.parent)}catch(g){break}}(),{vdcv:28,vdcd:b.join(","),err:void 0}}catch(e){return{vdcv:28,vdcd:"-999",err:e.message||"unknown"}}}function U(b){for(var d=0;10>d&&b!=window._dv_win.top;)d++,b=b.parent;return d}function V(b,d,f){try{var c;if(!(c=f.ID==$dvbs.Enums.BrowserId.IE)){if(b==window._dv_win.top)var e=
$dvbs.Enums.TrafficScenario.OnPage;else{f=b;try{for(var p=0;window._dv_win.top!=f&&10>=p;){var g=f.parent;if(!g.document)break;f=g;p++}}catch(z){}e=f==window._dv_win.top?$dvbs.Enums.TrafficScenario.SameDomain:$dvbs.Enums.TrafficScenario.CrossDomain}c=e!=$dvbs.Enums.TrafficScenario.CrossDomain}if(c)return null;b.performance&&b.performance.mark&&b.performance.mark("dv_str_html_start");if(d){var k=d.toString().match(/^(?:https?:\/\/)?[\w\-\.]+\/[a-zA-Z0-9]/gi);if(k&&0<k.length)return null}var h=b.document;
if(h&&h.referrer){var r=h.referrer.replace(/\//g,"\\/").replace(/\./g,"\\."),m=new RegExp('(?:w{0,4}=")?'+r+"[^&\"; %,'\\$\\\\\\|]+","gi");d=/banner|adprefs|safeframe|sandbox|sf\.html/gi;c=/^\w{0,4}="/gi;var w=K(h,"script","src",m,d,c);if(!w){var u=h.referrer;e="";var n=h.getElementsByTagName("script");if(n)for(g=0;!e&&g<n.length;){var q=n[g].innerHTML;if(q&&-1!=q.indexOf(u)){var A=q.match(m);e=L(A,d,c)}g++}(w=e)||(w=K(h,"a","href",m,d,c))}h=htmlUrl=w;a:{if(b.performance&&b.performance.mark&&b.performance.measure&&
b.performance.getEntriesByName){b.performance.mark("dv_str_html_end");b.performance.measure("dv_str_html","dv_str_html_start","dv_str_html_end");var v=b.performance.getEntriesByName("dv_str_html");if(v&&0<v.length){var x=v[0].duration.toFixed(2);break a}}x=null}return{url:h,depth:-1,duration:x}}}catch(z){}return null}function L(b,d,f){var c="";if(b&&0<b.length)for(var e=0;e<b.length;e++){var p=b[e];p.length>c.length&&null==p.match(d)&&0!=p.indexOf('src="')&&0!=p.indexOf('turl="')&&(c=p.replace(f,
""))}return c}function K(b,d,f,c,e,p){b=b.querySelectorAll(d+"["+f+'*="'+b.referrer+'"]');var g="";if(b)for(d=0;!g&&d<b.length;)g=b[d][f].match(c),g=L(g,e,p),d++;return g}function W(b){try{if(1>=b.depth)return{url:"",depth:""};var d=[];d.push({win:window._dv_win.top,depth:0});for(var f,c=1,e=0;0<c&&100>e;){try{if(e++,f=d.shift(),c--,0<f.win.location.toString().length&&f.win!=b)return 0==f.win.document.referrer.length||0==f.depth?{url:f.win.location,depth:f.depth}:{url:f.win.document.referrer,depth:f.depth-
1}}catch(k){}var p=f.win.frames.length;for(var g=0;g<p;g++)d.push({win:f.win.frames[g],depth:f.depth+1}),c++}return{url:"",depth:""}}catch(k){return{url:"",depth:""}}}function Y(){var b=window._dv_win[E("=@42E:@?")][E("2?46DE@C~C:8:?D")];if(b&&0<b.length){var d=[];d[0]=window._dv_win.location.protocol+"//"+window._dv_win.location.hostname;for(var f=0;f<b.length;f++)d[f+1]=b[f];return d.reverse().join(",")}return null}function E(b){new String;var d=new String,f;for(f=0;f<b.length;f++){var c=b.charAt(f);
var e="!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".indexOf(c);0<=e&&(c="!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".charAt((e+47)%94));d+=c}return d}function D(){return Math.floor(1E12*(Math.random()+""))}function T(b){for(var d=[{id:4,brRegex:"OPR|Opera",verRegex:"(OPR/|Version/)"},{id:1,brRegex:"MSIE|Trident/7.*rv:11|rv:11.*Trident/7|Edge/|Edg/",verRegex:"(MSIE |rv:| Edge/|Edg/)"},{id:2,brRegex:"Firefox",
verRegex:"Firefox/"},{id:0,brRegex:"Mozilla.*Android.*AppleWebKit(?!.*Chrome.*)|Linux.*Android.*AppleWebKit.* Version/.*Chrome",verRegex:null},{id:0,brRegex:"AOL/.*AOLBuild/|AOLBuild/.*AOL/|Puffin|Maxthon|Valve|Silk|PLAYSTATION|PlayStation|Nintendo|wOSBrowser",verRegex:null},{id:3,brRegex:"Chrome",verRegex:"Chrome/"},{id:5,brRegex:"Safari|(OS |OS X )[0-9].*AppleWebKit",verRegex:"Version/"}],f=0,c="",e=0;e<d.length;e++)if(null!=b.match(new RegExp(d[e].brRegex))){f=d[e].id;if(null==d[e].verRegex)break;
b=b.match(new RegExp(d[e].verRegex+"[0-9]*"));null!=b&&(c=b[0].match(new RegExp(d[e].verRegex)),c=b[0].replace(c[0],""));break}d=ea();4==f&&(d=f);return{ID:d,version:d===f?c:"",ID_UA:f}}function ea(){try{if(null!=window._phantom||null!=window.callPhantom)return 99;if(document.documentElement.hasAttribute&&document.documentElement.hasAttribute("webdriver")||null!=window.domAutomation||null!=window.domAutomationController||null!=window._WEBDRIVER_ELEM_CACHE)return 98;if(void 0!=window.opera&&void 0!=
window.history.navigationMode||void 0!=window.opr&&void 0!=window.opr.addons&&"function"==typeof window.opr.addons.installExtension)return 4;if(void 0!=document.uniqueID&&"string"==typeof document.uniqueID&&(void 0!=document.documentMode&&0<=document.documentMode||void 0!=document.all&&"object"==typeof document.all||void 0!=window.ActiveXObject&&"function"==typeof window.ActiveXObject)||window.document&&window.document.updateSettings&&"function"==typeof window.document.updateSettings||Object.values&&
navigator&&Object.values(navigator.plugins).some(function(b){return-1!=b.name.indexOf("Edge PDF")}))return 1;if(void 0!=window.chrome&&"function"==typeof window.chrome.csi&&"function"==typeof window.chrome.loadTimes&&void 0!=document.webkitHidden&&(1==document.webkitHidden||0==document.webkitHidden))return 3;if(void 0!=window.mozInnerScreenY&&"number"==typeof window.mozInnerScreenY&&void 0!=window.mozPaintCount&&0<=window.mozPaintCount&&void 0!=window.InstallTrigger&&void 0!=window.InstallTrigger.install)return 2;
var b=!1;try{var d=document.createElement("p");d.innerText=".";d.style="text-shadow: rgb(99, 116, 171) 20px -12px 2px";b=void 0!=d.style.textShadow}catch(f){}return(0<Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor")||window.webkitAudioPannerNode&&window.webkitConvertPointFromNodeToPage)&&b&&void 0!=window.innerWidth&&void 0!=window.innerHeight?5:0}catch(f){return 0}}function Z(){try{var b=0,d=function(c,d){d&&32>c&&(b=(b|1<<c)>>>0)},f=function(b,c){return function(){return b.apply(c,
arguments)}},c="svg"===document.documentElement.nodeName.toLowerCase(),e=function(){return"function"!==typeof document.createElement?document.createElement(arguments[0]):c?document.createElementNS.call(document,"http://www.w3.org/2000/svg",arguments[0]):document.createElement.apply(document,arguments)},p=["Moz","O","ms","Webkit"],g=["moz","o","ms","webkit"],k={style:e("modernizr").style},h=function(b,c){function d(){g&&(delete k.style,delete k.modElem)}var f;for(f=["modernizr","tspan","samp"];!k.style&&
f.length;){var g=!0;k.modElem=e(f.shift());k.style=k.modElem.style}var m=b.length;for(f=0;f<m;f++){var h=b[f];~(""+h).indexOf("-")&&(h=cssToDOM(h));if(void 0!==k.style[h])return d(),"pfx"==c?h:!0}d();return!1},r=function(b,c,d){var e=b.charAt(0).toUpperCase()+b.slice(1),m=(b+" "+p.join(e+" ")+e).split(" ");if("string"===typeof c||"undefined"===typeof c)return h(m,c);m=(b+" "+g.join(e+" ")+e).split(" ");for(var k in m)if(m[k]in c){if(!1===d)return m[k];b=c[m[k]];return"function"===typeof b?f(b,d||
c):b}return!1};d(0,!0);d(1,r("requestFileSystem",window));d(2,window.CSS?"function"==typeof window.CSS.escape:!1);d(3,r("shapeOutside","content-box",!0));return b}catch(m){return 0}}function F(){var b=window,d=0;try{for(;b.parent&&b!=b.parent&&b.parent.document&&!(b=b.parent,10<d++););}catch(f){}return b}function aa(){try{var b=F(),d=0,f=0,c=function(b,c,e){e&&(d+=Math.pow(2,b),f+=Math.pow(2,c))},e=b.document;c(14,0,b.playerInstance&&e.querySelector('script[src*="ads-player.com"]'));c(14,1,(b.CustomWLAdServer||
b.DbcbdConfig)&&(a=e.querySelector('p[class="footerCopyright"]'),a&&a.textContent.match(/ MangaLife 2016/)));c(15,2,b.zpz&&b.zpz.createPlayer);c(15,3,b.vdApp&&b.vdApp.createPlayer);c(15,4,e.querySelector('body>div[class="z-z-z"]'));c(16,5,b.xy_checksum&&b.place_player&&(b.logjwonready&&b.logContentPauseRequested||b.jwplayer));c(17,6,b==b.top&&""==e.title?(a=e.querySelector('body>object[id="player"]'),a&&a.data&&1<a.data.indexOf("jwplayer")&&"visibility: visible;"==a.getAttribute("style")):!1);c(17,
7,e.querySelector('script[src*="sitewebvideo.com"]'));c(17,8,b.InitPage&&b.cef&&b.InitAd);c(17,9,b==b.top&&""==e.title?(a=e.querySelector("body>#player"),null!=a&&null!=(null!=a.querySelector('div[id*="opti-ad"]')||a.querySelector('iframe[src="about:blank"]'))):!1);c(17,10,b==b.top&&""==e.title&&b.InitAdPlayer?(a=e.querySelector('body>div[id="kt_player"]'),null!=a&&null!=a.querySelector('div[class="flash-blocker"]')):!1);c(17,11,null!=b.clickplayer&&null!=b.checkRdy2);c(19,12,b.instance&&b.inject&&
e.querySelector('path[id="cp-search-0"]'));c(20,13,function(){try{if(b.top==b&&0<b.document.getElementsByClassName("asu").length)for(var c=b.document.styleSheets,d=0;d<c.length;d++)for(var e=b.document.styleSheets[d].cssRules,f=0;f<e.length;f++)if("div.kk"==e[f].selectorText||"div.asu"==e[f].selectorText)return!0}catch(q){}}());a:{try{var p=null!=e.querySelector('div[id="kt_player"][hiegth]');break a}catch(m){}p=void 0}c(21,14,p);a:{try{var g=b.top==b&&null!=b.document.querySelector('div[id="asu"][class="kk"]');
break a}catch(m){}g=void 0}c(22,15,g);a:{try{var k=e.querySelector('object[data*="/VPAIDFlash.swf"]')&&e.querySelector('object[id*="vpaid_video_flash_tester_el"]')&&e.querySelector('div[id*="desktopSubModal"]');break a}catch(m){}k=void 0}c(25,16,k);var h=navigator.userAgent;if(h&&-1<h.indexOf("Android")&&-1<h.indexOf(" wv)")&&b==window.top){var r=e.querySelector('img[src*="dealsneartome.com"]')||(b.__cads__?!0:!1)||0<e.querySelectorAll('img[src*="/tracker?tag="]').length;c(28,17,r||!1)}return{f:d,
s:f}}catch(m){return null}}function ba(){try{var b=F(),d=0,f=b.document;b==window.top&&""==f.title&&!f.querySelector("meta[charset]")&&f.querySelector('div[style*="background-image: url("]')&&(f.querySelector('script[src*="j.pubcdn.net"]')||f.querySelector('span[class="ad-close"]'))&&(d+=Math.pow(2,6));return d}catch(c){return null}}function ca(){try{var b="&fcifrms="+window.top.length;window.history&&(b+="&brh="+window.history.length);var d=F(),f=d.document;if(d==window.top){b+="&fwc="+((d.FB?1:
0)+(d.twttr?2:0)+(d.outbrain?4:0)+(d._taboola?8:0));try{f.cookie&&(b+="&fcl="+f.cookie.length)}catch(c){}d.performance&&d.performance.timing&&0<d.performance.timing.domainLookupStart&&0<d.performance.timing.domainLookupEnd&&(b+="&flt="+(d.performance.timing.domainLookupEnd-d.performance.timing.domainLookupStart));f.querySelectorAll&&(b+="&fec="+f.querySelectorAll("*").length)}return b}catch(c){return""}}var C=this,B=function(){function b(b,d){var f=[];d&&p.forEach(function(b){var c=dv_GetParam(d,
b);""!==c&&null!==c&&f.push(["dvp_"+b,c].join("="))});var g=window&&window._dv_win||{};g=g.dv_config=g.dv_config||{};g=dv_getDVBSErrAddress(g);var h=[e,c].join("="),m=["dvp_cert",k[b]].join("=");b=["dvp_jsErrMsg",b].join("=");g+=["/verify.js?flvr=0&ctx=818052&cmp=1619415&dvp_isLostImp=1&ssl=1",h,m,b,f.join("&")].join("&");(new Image(1,1)).src="https://"+g}function d(c,d){var e=window._dv_win.dv_config.bs_renderingMethod||function(b){document.write(b)};d="AdRenderedUponVerifyFailure__"+(d||"");if(C&&
C.tagParamsObj&&C.tagParamsObj.tagAdtag)try{e(C.tagParamsObj.tagAdtag)}catch(u){d+="__RenderingMethodFailed"}else C?C.tagParamsObj?C.tagParamsObj.tagAdtag||(d+="__HandlerTagParamsObjTagAdtag__Undefined"):d+="__HandlerTagParamsObj__Undefined":d+="__Handler__Undefined";b(d,c)}var f=!1,c,e,p=["ctx","cmp","plc","sid"],g=[C.constructor&&C.constructor.name||"UKDV","__",D()].join(""),k={VerifyLoadJSONPCallbackFailed:1,VerifyFailedToLoad:2},h={onResponse:function(c){f||(b("VerifyCallbackFailed",c),d(c,"VCF"))},
onError:function(c){b("VerifyFailedToLoad",c);d(c,"VFTL")}};h.reportError=b;h.isJSONPCalled=f;window._dv_win[g]={globalScopeVerifyErrorHandler:h};return{setVersionData:function(b,d){e=b;c=d},setIsJSONPCalled:function(b){f=b},getIsJSONPCalled:function(){return f},onLoad:dv_onResponse,onError:dv_onError,uniqueKey:g}}();this.createRequest=function(){window.performance&&window.performance.mark&&window.performance.mark("dv_create_req_start");var b=!1,d=window._dv_win,f=0,c=!1,e;try{for(e=0;10>=e;e++)if(null!=
d.parent&&d.parent!=d)if(0<d.parent.location.toString().length)d=d.parent,f++,b=!0;else{b=!1;break}else{0==e&&(b=!0);break}}catch(q){b=!1}a:{try{var p=d.$sf;break a}catch(q){}p=void 0}var g=(e=d.location&&d.location.ancestorOrigins)&&e[e.length-1];if(0==d.document.referrer.length)b=d.location;else if(b)b=d.location;else{b=d.document.referrer;a:{try{var k=d.$sf&&d.$sf.ext&&d.$sf.ext.hostURL&&d.$sf.ext.hostURL();break a}catch(q){}k=void 0}if(k&&(!e||0==k.indexOf(g))){b=k;var h=!0}c=!0}if(!window._dv_win.dvbsScriptsInternal||
!window._dv_win.dvbsProcessed||0==window._dv_win.dvbsScriptsInternal.length)return{isSev1:!1,url:null};e=window._dv_win.dv_config&&window._dv_win.dv_config.isUT?window._dv_win.dvbsScriptsInternal[window._dv_win.dvbsScriptsInternal.length-1]:window._dv_win.dvbsScriptsInternal.pop();k=e.script;this.dv_script_obj=e;this.dv_script=k;window._dv_win.dvbsProcessed.push(e);window._dv_win._dvScripts.push(k);g=k.src;this.dvOther=0;this.dvStep=1;var r=window._dv_win.dv_config?window._dv_win.dv_config.dv_GetRnd?
window._dv_win.dv_config.dv_GetRnd():D():D();e=window.parent.postMessage&&window.JSON;var m={};try{for(var w=/[\?&]([^&]*)=([^&#]*)/gi,u=w.exec(g);null!=u;)"eparams"!==u[1]&&(m[u[1]]=u[2]),u=w.exec(g);var n=m}catch(q){n=m}this.tagParamsObj=n;n.perf=this.perf;n.uid=r;n.script=this.dv_script;n.callbackName="__verify_callback_"+n.uid;n.tagObjectCallbackName="__tagObject_callback_"+n.uid;n.tagAdtag=null;n.tagPassback=null;n.tagIntegrityFlag="";n.tagHasPassbackFlag="";0==(null!=n.tagformat&&"2"==n.tagformat)&&
(u=S(n.script),n.tagAdtag=u.tagAdTag,n.tagPassback=u.tagPassback,u.isBadImp?n.tagIntegrityFlag="&isbadimp=1":u.hasPassback&&(n.tagHasPassbackFlag="&tagpb=1"));u=(/iPhone|iPad|iPod|\(Apple TV|iOS|Coremedia|CFNetwork\/.*Darwin/i.test(navigator.userAgent)||navigator.vendor&&"apple, inc."===navigator.vendor.toLowerCase())&&!window.MSStream;n.protocol="https:";n.ssl="1";g=n;(r=window._dv_win.dvRecoveryObj)?("2"!=g.tagformat&&(r=r[g.ctx]?r[g.ctx].RecoveryTagID:r._fallback_?r._fallback_.RecoveryTagID:1,
1===r&&g.tagAdtag?document.write(g.tagAdtag):2===r&&g.tagPassback&&document.write(g.tagPassback)),g=!0):g=!1;if(g)return{isSev1:!0};this.dvStep=2;R(n);k=k&&k.parentElement&&k.parentElement.tagName&&"HEAD"===k.parentElement.tagName;this.dvStep=3;return J(this,n,b,d,f,c,e,!0,k,u,h,p)};this.sendRequest=function(b){var d=dv_GetParam(b,"tagformat");if(B)try{B.setVersionData(this.getVersionParamName(),this.getVersion()),d&&"2"==d?$dvbs.domUtilities.addScriptResource(b,document.body,B.onLoad,B.onError,B.uniqueKey):
dv_sendScriptRequest(b,B.onLoad,B.onError,B.uniqueKey)}catch(m){d&&"2"==d?$dvbs.domUtilities.addScriptResource(b,document.body):dv_sendScriptRequest(b)}else d&&"2"==d?$dvbs.domUtilities.addScriptResource(b,document.body):dv_sendScriptRequest(b);try{if("1"!=dv_GetParam(b,"foie")){var f=N(this.dv_script_obj&&this.dv_script_obj.injScripts),c=document.createElement("iframe");c.name=window._dv_win.dv_config.emptyIframeID||"iframe_"+D();c.width=0;c.height=0;c.id=void 0;c.style.display="none";c.src="about:blank";
c.id=c.name;var e=c.id.replace("iframe_","");c&&"function"===typeof c.setAttribute&&c.setAttribute("data-dv-frm",e);G(c,this.dv_script);if(this.dv_script){var p=this.dv_script;a:{b=null;try{if(b=c.contentWindow){var g=b;break a}}catch(m){}try{if(b=window._dv_win.frames&&window._dv_win.frames[c.name]){g=b;break a}}catch(m){}g=null}p.dvFrmWin=g}a:{var k;if(c&&(k=c.contentDocument||c.contentWindow&&c.contentWindow.document)){var h=k;break a}h=(k=window._dv_win.frames&&window._dv_win.frames[c.name]&&
window._dv_win.frames[c.name].document)?k:null}if(h)h.open(),h.write(f);else{try{document.domain=document.domain}catch(m){}var r=encodeURIComponent(f.replace(/'/g,"\\'").replace(/\n|\r\n|\r/g,""));c.src='javascript: (function(){document.open();document.domain="'+window.document.domain+"\";document.write('"+r+"');})()"}}}catch(m){f=window._dv_win.dv_config=window._dv_win.dv_config||{},f=dv_getDVBSErrAddress(f),c=[this.getVersionParamName(),this.getVersion()].join("="),f+=["/verify.js?flvr=0&ctx=818052&cmp=1619415&dvp_cert=3&num=6",
c].join("&"),dv_SendErrorImp(f,[{dvp_jsErrMsg:"DvFrame: "+encodeURIComponent(m)}])}return!0};this.isApplicable=function(){return!0};this.onFailure=function(){};window.debugScript&&(window.CreateUrl=J);this.getVersionParamName=function(){return"ver"};this.getVersion=function(){return"157"}};


function dvbs_src_main(dvbs_baseHandlerIns, dvbs_handlersDefs) {

    this.bs_baseHandlerIns = dvbs_baseHandlerIns;
    this.bs_handlersDefs = dvbs_handlersDefs;

    this.exec = function () {
        try {
            window._dv_win = (window._dv_win || window);
            window._dv_win.$dvbs = (window._dv_win.$dvbs || new dvBsType());

            window._dv_win.dv_config = window._dv_win.dv_config || {};
            window._dv_win.dv_config.bsErrAddress = window._dv_win.dv_config.bsAddress || 'rtb0.doubleverify.com';

            var errorsArr = (new dv_rolloutManager(this.bs_handlersDefs, this.bs_baseHandlerIns)).handle();
            if (errorsArr && errorsArr.length > 0)
                dv_SendErrorImp(window._dv_win.dv_config.bsErrAddress + '/verify.js?flvr=0&ctx=818052&cmp=1619415&num=6', errorsArr);
        }
        catch (e) {
            try {
                dv_SendErrorImp(window._dv_win.dv_config.bsErrAddress + '/verify.js?flvr=0&ctx=818052&cmp=1619415&num=6&dvp_isLostImp=1', {dvp_jsErrMsg: encodeURIComponent(e)});
            } catch (e) {
            }
        }
    };
};


try {
    window._dv_win = window._dv_win || window;
    var dv_baseHandlerIns = new dv_baseHandler();
	

    var dv_handlersDefs = [];
    (new dvbs_src_main(dv_baseHandlerIns, dv_handlersDefs)).exec();
} catch (e) { }