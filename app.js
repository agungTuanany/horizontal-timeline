/// =====================================
/// =====================================
/// at the end - run the code
function ready(callback) {
    if (document.readystate != "loading") callback();
    else document.addEventListener("DOMContentLoaded", callback());
};

/// global variables
const { ['log']: cl } = console;
const timelines = document.querySelectorAll('.cd-horizontal-timeline');
const eventsMinDistance = 60;

ready(() => {
    /// this boolean check is to ensure 'timelines' and initTimelines is true; I do not
    /// need to check if it's valid, it should always be valid.
    timelines.length > 0 && initTimeline(timelines);

    function initTimeline(timelines) {

        timelines.forEach(timeline => {
            ///cache timeline components
            const timelineComponents = {};
            timelineComponents['timelineWrapper'] = timeline.querySelector('.events-wrapper');
            timelineComponents['eventsWrapper'] = timelineComponents['timelineWrapper'].querySelector('.events');
            timelineComponents['fillingLine'] = timelineComponents['eventsWrapper'].querySelector('.filling-line');
            timelineComponents['timelineEvents'] = timelineComponents['eventsWrapper'].querySelectorAll('a');
            timelineComponents['timelineDates'] = parseDate(timelineComponents['timelineEvents']);
            timelineComponents['eventsMinLapse'] = minLapse(timelineComponents['timelineDates']);
            timelineComponents['timelineNavigation'] = timeline.querySelector('.cd-timeline-navigation');
            timelineComponents['eventsContent'] = timeline.querySelector('.events-content');

            /// assign a left position to the single events along the timeline;
            setDatePosition(timelineComponents, eventsMinDistance);

            /// assign a width to the timeline
            const timelineTotWidth = setTimelineWidth(timelineComponents, eventsMinDistance);

            /// The timeline has been initialize - show it
            timeline.classList.add('loaded');

            /// detect click on the next arrow
            const nextClick = timelineComponents['timelineNavigation'].querySelector('.next');
            nextClick.addEventListener('click', event => {
                event.preventDefault();
                updateSlide(timelineComponents, timelineTotWidth, 'next');
            });

            /// detect click on the prev arrow
            const prevClick = timelineComponents['timelineNavigation'].querySelector('.prev');
            prevClick.addEventListener('click', event => {
                event.preventDefault();
                updateSlide(timelineComponents, timelineTotWidth, 'prev');
            });

            /// detect click on the a single event - show new event content
            const eventsWrapper = timelineComponents['eventsWrapper'];
            eventsWrapper.addEventListener('click', event => {
                event.preventDefault();
                const timelineEvents = timelineComponents['timelineEvents'];

                /// I just need to remove 'selected' class
                for (let i = 0; i < timelineEvents.length; i++) {
                    if (timelineEvents[i].classList.contains('selected')) {
                        timelineEvents[i].classList.remove('selected');
                    };
                };

                event.target.classList.add('selected');
                updateOlderEvents(event);
                const fillingLine = timelineComponents['fillingLine'];
                updateFilling(event, fillingLine, timelineTotWidth)
                const eventsContent = timelineComponents['eventsContent'];
                updateVisibleContent(event, eventsContent)
            });
        });
    };
});


function setDatePosition(timelineComponents, min) {
    for (let i = 0; i < timelineComponents['timelineDates'].length; i++) {
        const distance = daydiff(timelineComponents['timelineDates'][0], timelineComponents['timelineDates'][i]);
        const distanceNorm = Math.round(distance / timelineComponents['eventsMinLapse']) + 2;
        const realDistance = distanceNorm * min;
        const timelineEvents = timelineComponents['timelineEvents'][i];
        timelineEvents.style.left = realDistance + 'px';
    };
};

function setTimelineWidth(timelineComponents, width) {
    let timeSpan = daydiff(timelineComponents['timelineDates'][0], timelineComponents['timelineDates'][timelineComponents['timelineDates'].length - 1]);
    let timeSpanNorm = timeSpan / timelineComponents['eventsMinLapse'];
    timeSpanNorm = Math.round(timeSpanNorm) + 4;
    let totalWidth = timeSpanNorm * width;

    timelineComponents['eventsWrapper'].style.width = `${totalWidth}px`;
    return totalWidth;
};

function updateSlide(timelineComponents, timelineTotWidth, string) {
    /// retrieve translateX value of timelineComponents['eventsWrapper']
    const translateValue = getTranslateValue(timelineComponents['eventsWrapper']);
    const _wrapperWidthInit = timelineComponents['timelineWrapper'];
    const _wrapperWidthEl = _wrapperWidthInit.ownerDocument.defaultView;
    const _wrapperWidthVal = _wrapperWidthEl.getComputedStyle(_wrapperWidthInit, null).width;
    const wrapperWidth = Number(_wrapperWidthVal.replace('px', ''));

    // translate the timeline to the lef('next') or right('prev')
    (string === 'next')
        ? translateTimeline(timelineComponents, translateValue - wrapperWidth + eventsMinDistance, wrapperWidth - timelineTotWidth)
        : translateTimeline(timelineComponents, translateValue + wrapperWidth - eventsMinDistance);
};

function getTranslateValue(timeline) {
    let timelineStyle = window.getComputedStyle(timeline, null);
    let timelineTranslate = timelineStyle.getPropertyValue("-webkit-transform") ||
        timeline.getPropertyValue("-moz-transform") ||
        timeline.getPropertyValue("-ms-transform") ||
        timeline.getPropertyValue("-o-transform") ||
        timeline.getPropertyValue("transform");
    let translateValue;

    if (timelineTranslate.indexOf('(') >= 0) {
        timelineTranslate = timelineTranslate.split('(')[1];
        timelineTranslate = timelineTranslate.split(')')[0];
        timelineTranslate = timelineTranslate.split(',');
        translateValue = timelineTranslate[4];
    }
    else {
        translateValue = 0;
    }

    return Number(translateValue);
};

function translateTimeline(timelineComponents, value, totWidth) {
    let eventsWrapper = timelineComponents['eventsWrapper'];

    value = (value > 0) ? 0 : value; //only negative translate value
    value = (!(typeof totWidth === 'undefined') && value < totWidth) ? totWidth : value; //do not translate more than timeline width
    setTransformValue(eventsWrapper, 'translateX', value + 'px');

    const timelineNavigation = timelineComponents['timelineNavigation'];
    const prev = timelineNavigation.querySelector('.prev');
    const next = timelineNavigation.querySelector('.next');

    //update navigation arrows visibility
    value === 0 ? prev.classList.add('inactive') : prev.classList.remove('inactive');
    value === totWidth ? next.classList.add('inactive') : next.classList.remove('inactive');
};

function updateOlderEvents(event) {
    const parentEvent = event.target.parentNode;
    const prevArrs = prevAll(parentEvent);

    prevArrs.forEach(arr => {
        let prevChilds = arr.children[0];
        prevChilds.classList.add('older-event');
    })
};

function updateFilling(selectedEvent, filling, totWidth) {
    /// change '.filling-line' length according to the selected event
    const eventStyle = window.getComputedStyle(selectedEvent.target, null);
    let eventLeft = eventStyle.getPropertyValue('left');
    let eventWidth = eventStyle.getPropertyValue('width');

    eventLeft = Number(eventLeft.replace('px', '')) + Number(eventWidth.replace('px', '')) / 2;

    let scaleValue = eventLeft / totWidth;
    setTransformValue(filling, 'scaleX', scaleValue);
}

function updateVisibleContent(event, eventsContent) {
    const eventDate = event.target.getAttribute('data-date');
    let listContent = eventsContent.children[0];
    let listedContents = listContent.children;

    let visibleContent;
    let selectedContent;

    [].forEach.call(listedContents, list => {
        if (list.classList.contains('selected')) {
            visibleContent = list;
            return visibleContent;
        };

        if (list.dataset.date === eventDate) {
            selectedContent = list;
            return selectedContent;
        };
    });

    let classEnetering;
    let classLeaving;

    if (index(selectedContent) > index(visibleContent)) {
        classEnetering = 'selected enter-right';
        classLeaving = 'leave-left';
        selectedContent.setAttribute('class', classEnetering);
        visibleContent.setAttribute('class', classLeaving);

        visibleContent.addEventListener('animationend', () => {
            visibleContent.classList.remove('leave-left');
            selectedContent.classList.remove('enter-right');
        });
    }
    else {
        classEnetering = 'selected enter-left';
        classLeaving = 'leave-right';
        selectedContent.setAttribute('class', classEnetering);
        visibleContent.setAttribute('class', classLeaving);

        visibleContent.addEventListener('animationend', () => {
            visibleContent.classList.remove('leave-right');
            selectedContent.classList.remove('enter-left');
        });
    }

    let selectedContentHeight = selectedContent.clientHeight;
    eventsContent.style.height = selectedContentHeight + 'px';
}


/// =====================================
/// HELPER FUNCTION
///  TODO: REMOVE THIS SMALLS FUNCTION INTO utils.js
/// =====================================

function minLapse(dates) {
    /// determines the minimum distance among events
    let dateDistances = [];
    for (let i = 1; i < dates.length; i++) {
        let distance = daydiff(dates[i - 1], dates[i]);
        dateDistances.push(distance);
    };

    const roundedDateDistances = Math.min.apply(null, dateDistances);
    return roundedDateDistances;
};

function parseDate(events) {
    let dateArrays = [];
    events.forEach(event => {
        let dateComp = event.dataset.date.split('/');
        let newDate = new Date(dateComp[2], dateComp[1] - 1, dateComp[0]);
        dateArrays.push(newDate);
    });

    return dateArrays;
};

function setTransformValue(element, property, value) {
    element.style["-webkit-transform"] = property + "(" + value + ")";
    element.style["-moz-transform"] = property + "(" + value + ")";
    element.style["-ms-transform"] = property + "(" + value + ")";
    element.style["-o-transform"] = property + "(" + value + ")";
    element.style["transform"] = property + "(" + value + ")";
}

function daydiff(first, second) {
    return Math.round((second - first));
};

function getPreviousSibling(elem, filter) {
    cl(elem);
    let sibs = [];
    while (elem = elem.previousSibling) {
        if (elem.nodeType === 3) continue; // ignore text nodes
        if (!filter || filter(elem)) sibs.push(elem)
    }
    return sibs;
};

function prevAll(elem) {
    const prevElements = [];

    let prevElement = elem.parentNode.firstElementChild;

    while (prevElement !== elem) {
        prevElements.push(prevElement);
        prevElement = prevElement.nextElementSibling;
    }

    return prevElements;
}

function nextAll(elem) {
    const nextElements = [];
    let nextElement = elem;

    while (nextElement.nextElementSibling) {
        nextElements.push(nextElement.nextElementSibling)
        nextElement = nextElement.nextElementSibling;
    }

    return nextElements;
}

function index(elem) {
    if (!elem) return -1;
    let i = 0;
    while (elem = elem.previousElementSibling) {
        i++;
    }
    return i;
};
