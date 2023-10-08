
export function formatPace(seconds, unit = " /mi") {
    let date = new Date(0);
    date.setSeconds(seconds);
    let start = 14
    if (seconds > 3600) {
        start = 12
    }
    let pace = date.toISOString().substring(start, 19).replace(/^0+/, '')
    return pace + unit
}

export function formatDuration(seconds, includeHours = true, includeMilliseconds = false, trimLeadingZeros = false) {
    if (!Number.isFinite(seconds)) {
        // Don't render Infinity, NaN, etc.
        return "";
    }

    let date = new Date(0);

    let milliseconds = (seconds % 1.0) * 1000
    if (milliseconds > 0 && !includeMilliseconds) {
        // If we're not showing the milliseconds, have to round up
        // World Athletics Technical Rules, 19.24.5
        // For all races, all times not ending in zero shall be converted and recorded
        // to the next longer whole second, e.g. 2:09:44.3 shall be recorded as
        // 2:09:45.
        date.setSeconds(seconds + 1);
    } else {
        date.setSeconds(seconds)
        date.setMilliseconds(milliseconds)
    }
    let start = 14
    let end = 19

    if (includeHours) {
        start -= 2
    }
    if (includeMilliseconds) {
        end += 2
    }
    let result = date.toISOString().substring(start, end)
    if (trimLeadingZeros) {
        result = result.replace(/^0+/, '')
    }
    return result
}

export function formatLegDescription(startStation, endStation, leg, includeLegNumber=false, linkStations=false){
    let legNumber = ""
    if (includeLegNumber) legNumber = `<span class="leg-number">${leg.id}:</span> `
    return `<h5 class="mb-1">${legNumber}${startStation} to ${endStation}</h5><h6>${leg.distance_mi.toFixed(2)}mi ↑${leg.ascent_ft.toFixed(0)}ft ↓${leg.descent_ft.toFixed(0)}ft</h6><p class="mb-0">${leg.notes}</p>`
}

export function download(content, mimeType, filename) {
    const a = document.createElement('a') // Create "a" element
    const blob = new Blob([content], {type: mimeType}) // Create a blob (file-like object)
    const url = URL.createObjectURL(blob) // Create an object URL from blob
    a.setAttribute('href', url) // Set "a" element link
    a.setAttribute('download', filename) // Set download filename
    a.click() // Start downloading
}

export function relayToGPX(eventName, trackName, legs, exchanges, year=new Date().getFullYear()) {
    let points = ""
    for (let leg of legs) {
        let coords = leg.geometry.coordinates
        for (let coord of coords) {
            if (coord.length === 3) {
                points += `    <trkpt lat="${coord[1]}" lon="${coord[0]}"><ele>${coord[2]}</ele></trkpt>\n`
            } else {
                points += `    <trkpt lat="${coord[1]}" lon="${coord[0]}"/>\n`
            }

        }
    }
    let waypoints = ""
    for (let exchange of exchanges) {
        let coords = exchange.geometry.coordinates
        waypoints += `    <wpt lat="${coords[1]}" lon="${coords[0]}"><name>${exchange.properties.name}</name></wpt>\n`
    }
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<gpx version="1.1" creator="https://raceconditionrunning.com" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${trackName}</name>
    <link href="{{url}}/{{permalink}}">
      <text>${eventName}</text>
    </link>
    <time>${new Date().toISOString()}</time>
    <copyright author="OpenStreetMap Contributors">
      <year>${year}</year>
    </copyright>
  </metadata>
  ${waypoints}
  <trk>
    <name>${trackName}</name>
    <trkseg>
    ${points}
    </trkseg>
  </trk>
</gpx>`
}

export function legToGPX(coords, eventName, trackName) {
    let points = ""
    for (let coord of coords) {
        points += `    <rtept lat="${coord[1]}" lon="${coord[0]}"/>\n`
    }
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<gpx version="1.1" creator="https://raceconditionrunning.com" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${trackName}</name>
    <link href="{{url}}/{{permalink}}">
      <text>${eventName}</text>
    </link>
    <time>${new Date().toISOString()}</time>
    <copyright author="OpenStreetMap Contributors">
      <year>${year}</year>
    </copyright>
  </metadata>
  <rte>
    <name>${trackName}</name>
    ${points}
  </rte>
</gpx>`
}

export function createCountdown(countDownDate, unhideOnCompletion) {
    addEventListener("DOMContentLoaded", (event) => {
        const daysEl = document.getElementById("days")
        const hoursEl = document.getElementById("hours")
        const minutesEl = document.getElementById("minutes")
        const secondsEl = document.getElementById("seconds")

        const secondPluralEl = document.getElementById("second-plural")
        const minutePluralEl = document.getElementById("minute-plural")
        const hourPluralEl = document.getElementById("hour-plural")
        const dayPluralEl = document.getElementById("day-plural")
        const flashingEls = document.querySelectorAll(".flashing")
        let countdownInterval

        function updateCountdown(includeSeconds) {
            document.getElementById("static-count").style.display = "none";
            document.getElementById("dynamic-count").style.display = "";
            let now = new Date().getTime();
            let timeleft = countDownDate - now;

            let days = Math.floor(timeleft / (1000 * 60 * 60 * 24));
            let hours = Math.floor((timeleft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            let minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));
            let seconds = Math.floor((timeleft % (1000 * 60)) / 1000);
            if (daysEl) daysEl.innerHTML = days
            if (hoursEl) hoursEl.innerHTML = hours
            if (minutesEl) minutesEl.innerHTML = minutes
            if (secondsEl) secondsEl.innerHTML = seconds

            if (secondPluralEl) {
                if (seconds === 1) {
                    secondPluralEl.style.display = "none"
                } else {
                    secondPluralEl.style.display = ""
                }
            }
            if (minutePluralEl) {
                if (minutes === 1) {
                    minutePluralEl.style.display = "none"
                } else {
                    minutePluralEl.style.display = ""
                }
            }
            if (hourPluralEl) {
                if (hours === 1) {
                    hourPluralEl.style.display = "none"
                } else {
                    hourPluralEl.style.display = ""
                }
            }
            if (dayPluralEl) {
                if (days === 1) {
                    dayPluralEl.style.display = "none"
                } else {
                    dayPluralEl.style.display = ""
                }
            }
            flashingEls.forEach(el => {
                if (seconds % 2 === 0) {
                    el.style.visibility = "visible"
                } else {
                    el.style.visibility = "hidden"
                }
            })
            if (timeleft < 0) {
                clearInterval(countdownInterval);
                document.getElementById("countdown").style.display = "none";
                let toShow = document.getElementById(unhideOnCompletion)
                if (toShow) {
                    toShow.style.display = "";
                }
            }
        }

        updateCountdown()
        countdownInterval = setInterval(updateCountdown, 1000)
    });
}

export function processRelayGeoJSON(relay) {
    let legs = []
    let exchanges = []
    for (let feature of relay.features) {
        if (feature.geometry.type === "LineString") {
            legs.push(feature)
        } else if (feature.geometry.type === "Point") {
            exchanges.push(feature)
        }
    }

    let orderedLegs = legs.sort(function(a, b) {
        let keyA = a.properties.start_exchange
        let keyB = b.properties.start_exchange
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    });
    let orderedExchanges = exchanges.sort(function(a, b) {
        let keyA = a.properties.id
        let keyB = b.properties.id
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    });

    legs = {
        type: "FeatureCollection",
        features: orderedLegs
    }
    exchanges = {
        type: "FeatureCollection",
        features: orderedExchanges
    }

    return [legs, exchanges]
}

export function createScheduleTable(container, schedule, startTime) {
    let firstLeg = {}
    let legs = new Array(schedule.length)
    for (let leg of schedule) {
        for (let runner of leg.runners) {
            firstLeg[runner] = Math.min(firstLeg[runner] ?? Number.MAX_VALUE, leg.leg)
        }
        legs[leg.leg] = leg
    }
    legs[0].start_time = new Date(startTime.getTime())
    for (let i = 1; i < legs.length; i++) {
        legs[i].start_time = new Date((legs[i - 1].start_time.getTime() + legs[i].pace_mi * legs[i].distance_mi * 1000 + 4 * 60 * 1000))
    }
    let finishTimeCalc = function(values, data, calcParams){
        if (data.length === 0) return;
        let lastLeg = data[data.length - 1]
        let endDate = new Date((lastLeg.start_time.getTime() + lastLeg.pace_mi * lastLeg.distance_mi * 1000 + 4 * 60 * 1000));
        return endDate.toTimeString().split(" ")[0].substring(0, 5)
    }

    let scheduleTable = new Tabulator(container, {
        data: schedule,
        layout: "fitDataFill",
        responsiveLayout: "collapse",
        selectable: false,
        columns: [
            {title: "Leg", field: "leg", headerSort:false, resizable: false, bottomCalc: ()=> "Finish"},
            {title: "Time", field: "start_time", formatter: cell => cell.getValue().toTimeString().split(" ")[0].substring(0, 5), bottomCalc: finishTimeCalc, headerSort:false, resizable: false},
            {title: "Start", field: "start_exchange", headerSort:false, resizable: false},
            {title: "Miles", field: "distance_mi", bottomCalc: "sum", bottomCalcParams: {precision: 2}, headerSort:false, resizable: false},
            {
                title: "Pace (/mi)", field: "pace_mi",  formatter: cell => formatPace(cell.getValue(), ""), headerSort:false, resizable: false
            },
            {
                title: "Elev. Gain (ft)", field: "ascent_ft", bottomCalc: "sum", headerSort:false, resizable: false
            },
            {title: "Runners", field: "runners", formatter: cell => {
                    let row = cell.getRow().getData()
                    let out = []
                    for (let runner of cell.getValue()) {
                        let classes = ""
                        if (runner === row.leader) {
                            classes += "leg-leader "
                        }
                        if (firstLeg[runner] === row.leg) {
                            classes += "first-leg "
                        }
                        out.push(`<span class="schedule-runner ${classes}">${runner}</span>`)
                    }
                    return out.join(", ")
                }, headerSort:false, resizable: false},
        ]
    })
    // Bottom calcs will truncate unless we redraw manually
    scheduleTable.on("dataProcessed", () => scheduleTable.redraw())
}

export function createLegDetailsTable(container, legsGeojson, exchangesGeoJson) {
    let data = []
    let legDescriptions = ""

    function formatLegDescription(startExchange, endExchange, leg){
        let legNumber = `<span class="leg-number">${leg.id}:</span> `
        let legName = `${legNumber}<a href="${startExchange.stationInfo}" target="_new">${startExchange.name}</a> to <a href="${endExchange.stationInfo}" target="_new">${endExchange.name}</a>`

        return `<div class="d-flex flex-column flex-lg-row justify-content-between align-items-baseline"><h5>${legName}</h5><h6>${leg.distance_mi.toFixed(2)}mi ↑${leg.ascent_ft.toFixed(0)}ft ↓${leg.descent_ft.toFixed(0)}ft</h6></div><i>Landmark: ${startExchange.landmark}</i><p class="mb-0">${leg.notes}</p>`
    }
    for (let leg of legsGeojson) {
        let legData = leg.properties
        legData.id = legData.start_exchange + 1
        data.push(legData)
        legDescriptions += `<div class="mb-4">${formatLegDescription(exchangesGeoJson[legData.start_exchange].properties, exchangesGeoJson[legData.end_exchange].properties, legData)}</div>`
    }
    container.innerHTML = legDescriptions

}
