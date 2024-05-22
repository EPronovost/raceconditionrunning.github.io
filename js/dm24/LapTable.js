import {LapPaceChart} from "../LapPaceChart.js";
import {formatDuration, formatPace} from "../common.js";
import {Tabulator, ColumnCalcsModule, GroupRowsModule, FormatModule, InteractionModule, ResizeColumnsModule, ResizeTableModule, ResponsiveLayoutModule, SortModule, SelectRowModule, ReactiveDataModule, FilterModule} from 'tabulator-tables';

Tabulator.registerModule([ColumnCalcsModule, FormatModule, GroupRowsModule, InteractionModule, ResizeColumnsModule, ResizeTableModule, ResponsiveLayoutModule, SortModule, SelectRowModule, ReactiveDataModule, FilterModule]);



export class LapTable extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
       <style>
            .laps-table{
            padding: 1rem;
            font-size: .75rem;
            }
  
        </style>
        <div class="laps-graph"></div>
        <div class="laps-table"></div>
        `;
    }

    addResultsDetails(data, lapTarget) {
        let lapObjects = []
        let timeElapsed = 0
        let distanceElapsed = 0
        let lapsRun = data.lapTime.length - 1
        for (let i = 0; i < data.lapTime.length; i++) {
            const lapDistance = data.lapLength[i]
            let pace = lapDistance / data.lapTime[i]
            timeElapsed += data.lapTime[i]
            distanceElapsed += lapDistance
            let direction = data.lapClockwise[i] ? "CCW" : "CW"
            if (i === 0) {
                // 0th lap is entrance from upper vista
                direction = null
            }
            lapObjects.push({
                "n": i + 1,
                "time": data.lapTime[i],
                "distance": lapDistance,
                "distanceElapsed": distanceElapsed,
                "timeElapsed": timeElapsed,
                "pace": pace,
                "paceMi": 1609.34 / pace,
                "paceKm": 1000 / pace,
                "extra": i > lapTarget,
                "direction": direction
            })
        }

        /*this.shadowRoot.querySelector(".laps-graph").appendChild(new LapPaceChart().draw(lapObjects, lapTarget, (barNumber)=> {
            view.scrollToRow(barNumber)
        }))*/

        let view
        let lapsTable = new Promise((resolve, reject) => {
            view = new Tabulator(this.querySelector(".laps-table"), {
                data: lapObjects,
                selectable: false,
                index: "n",
                groupBy: "extra",
                height: 300,
                responsiveLayout: "collapse",
                // Most recent lap on the top since that's what live trackers want to see
                initialSort: [{column: "n", dir: "desc"}],
                columns: [
                    {title: "N", field: "n", sorter: "number", responsive: 0},
                    {
                        title: "Time",
                        field: "time",
                        formatter: cell => formatDuration(cell.getValue(), false, true),
                        bottomCalc: (values, data, calcParams) => {
                            if (values.length === 0) {
                                return ""
                            }
                            let averagePace = values.reduce((a, b) => a + b, 0) / values.length
                            return formatDuration(averagePace, false, true)
                        }
                    },
                    {
                        title: "min/mi",
                        field: "paceMi",
                        formatter: (cell) => formatDuration(cell.getValue(), false, false, true),
                        bottomCalc: (values, data, calcParams) => {
                            if (values.length === 0) {
                                return ""
                            }
                            let averagePace = values.reduce((a, b) => a + b, 0) / values.length
                            return formatPace(averagePace, "")
                        }
                    },
                    {
                        title: "Elapsed", field: "timeElapsed", formatter: (cell) => {
                            const videoLink = cell.getRow().getData().videoLink
                            if (videoLink) {
                                return `<a href='${videoLink}${Math.floor(cell.getValue())}'>${formatDuration(cell.getValue(), true, false)}</a>`
                            } else {
                                return formatDuration(cell.getValue(), true, false)
                            }
                        }

                        , headerSort: false
                    },
                    {title: "Meters", field: "distanceElapsed", responsive: 4, headerSort: false, formatter: cell => cell.getValue().toFixed(1)},
                    {
                        title: "Direction",
                        field: "direction",
                        responsive: 5,
                        headerSort: false,
                        bottomCalc: (values, data, calcParams) => {
                            if (values.length === 0) {
                                return []
                            }
                            let counts = values.filter(a => a).reduce((a, b) => b === "CCW" ? [a[0] + 1, a[1]] : [a[0], a[1] + 1], [0, 0])
                            return counts
                        },
                        bottomCalcFormatter: (cell, data, params) => {
                            let counts = cell.getValue()
                            return `${counts[0]}<span class='direction-symbol mx-1'>↺</span> ${counts[1]}<span class='direction-symbol mx-1'>↻</span>`
                        }
                    }
                ]
            })
            view.on("tableBuilt", () => view.setGroupHeader(function (value, count, data, group) {
                if (value) {
                    return "Extra Laps (" + count + ")";
                } else {
                    return ""
                }

            }));
            view.on("renderComplete", resolve)

        })
        return Promise.all([lapsTable])
    }

}

window.customElements.define('lap-table', LapTable);

