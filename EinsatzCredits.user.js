// ==UserScript==
// @name         EinsatzCredits
// @namespace    http://havenith.nrw/
// @version      3.1.2
// @description  Dieses Script zeigt zu jedem Einsatz an, wie viele Credits man im Durchschnitt bekommt
// @author       SvenS (Orignal by ViperAC (Original by itsDreyter))
// @match        https://www.leitstellenspiel.de/
// @updateURL    https://github.com/SvenSchirmer/LSS-Tampermonkey/blob/main/EinsatzCredits.user.js
// @downloadURL  https://github.com/SvenSchirmer/LSS-Tampermonkey/blob/main/EinsatzCredits.user.js
// @grant        none
// ==/UserScript==
(function () {
        'use strict';
        var requirements;
        function getResponseText(credits) {
            if (credits === null) {
                return 'Credits im Durchschnitt: <span style="font-weight:bold;">Vergütung durch Rettungsdienst</span>';
            } else {
                return `Credits im Durchschnitt: <span style="font-weight:bold;">${credits}</span>`;
            }
        }
        var originalFunc = missionMarkerAdd;
        missionMarkerAdd = function (e) {
            originalFunc.apply(this, arguments);
            update(e);
        }
        async function update(e) {
            if (!window.sessionStorage.hasOwnProperty('aMissions') || JSON.parse(window.sessionStorage.aMissions).lastUpdate < (new Date().getTime() - 24 * 1000 * 60)) {
                await fetch('/einsaetze.json')
                    .then(res => res.json())
                    .then(data => window.sessionStorage.setItem('aMissions', JSON.stringify({
                        lastUpdate: new Date().getTime(),
                        value: data,
                        user_id: window.user_id
                    })));
            }
            requirements = JSON.parse(window.sessionStorage.getItem("aMissions"));
            let missionList = $('.missionSideBarEntry');
            for (let i = 0; i < missionList.length; i++) {
                let childList = missionList[i].firstElementChild.firstElementChild.children;
                let isExist = false;
                if (e.id !== parseInt(missionList[i].getAttribute('mission_id'))) continue;
                for (let ic = 0; ic < childList.length; ic++) {
                    if (childList[ic].className === 'missionCredits') {
                        isExist = true;
                        break;
                    }
                }
                if (isExist === true && e.mtid !== null) {
                    for (let j = 0; j < childList.length; j++) {
                        if (childList[j].className !== 'missionCredits') continue;
                        let credits = requirements.value.filter(r => r.id === parseInt(e.mtid))[0]['average_credits'];
                        let child = childList[j];
                        missionList[i].firstElementChild.firstElementChild.removeChild(child);
                        child.innerHTML = getResponseText(credits);
                        missionList[i].firstElementChild.firstElementChild.appendChild(child);
                    }
                } else {
                    let missionTypeID = missionList[i].getAttribute('mission_type_id');
                    if (missionTypeID === "null") continue;
                    let credits = requirements.value.filter(e => e.id === missionTypeID)[0]['average_credits'];
                    let missionRow = document.createElement('div');
                    missionRow.innerHTML = getResponseText(credits);
                    missionRow.setAttribute("class", "missionCredits");
                    missionRow.setAttribute("id", "missionCredits_" + missionList[i].getAttribute('mission_id'));
                    missionList[i].firstElementChild.firstElementChild.appendChild(missionRow);
                }
            }
        }
        async function init() {
            if (!window.sessionStorage.hasOwnProperty('aMissions') || JSON.parse(window.sessionStorage.aMissions).lastUpdate < (new Date().getTime() - 24 * 1000 * 60)) {
                await fetch('/einsaetze.json')
                    .then(res => res.json())
                    .then(data => window.sessionStorage.setItem('aMissions', JSON.stringify({
                        lastUpdate: new Date().getTime(),
                        value: data,
                        user_id: window.user_id
                    })));
            }
            requirements = JSON.parse(window.sessionStorage.getItem("aMissions"));
            let missionList = $('.missionSideBarEntry');
            $('.missionCredits').remove();
            for (let i = 0; i < missionList.length; i++) {
                let missionTypeID = missionList[i].getAttribute('mission_type_id');
                if (missionTypeID === "null") continue;
                let credits = requirements.value.filter(e => e.id === missionTypeID)[0]['average_credits'];
                if (credits === undefined) {
                    requirements = await getMissionListByAPI();
                    credits = requirements.value.filter(e => e.id === missionTypeID)[0]['average_credits'];
                }
                let missionRow = document.createElement('div');
                missionRow.innerHTML = getResponseText(credits);
                missionRow.setAttribute("class", "missionCredits");
                missionRow.setAttribute("id", "missionCredits_" + missionList[i].getAttribute('mission_id'));
                missionList[i].firstElementChild.firstElementChild.appendChild(missionRow);
            }
        }
        init();
    }
)();
