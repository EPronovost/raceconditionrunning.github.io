import {formatLegDescription} from "./common.js";
import {ElevationProfile} from "./ElevationProfile.js";
import { Protocol } from 'https://cdn.jsdelivr.net/npm/pmtiles@3.0.7/+esm';

const mapboxKey = 'pk.eyJ1Ijoibmlja3N3YWxrZXIiLCJhIjoiY2t0ZjgyenE4MDR1YjJ1cno0N3hxYzI4YSJ9.ivPdsoEtV9TaLGbOOfFXKA'
import pmtiles from 'https://cdn.jsdelivr.net/npm/pmtiles@3.0.7/+esm'
const transformRequest = (url, resourceType) => {
    if (isMapboxURL(url)) {
        return transformMapboxUrl(url, resourceType, mapboxKey)
    }
    return {url}
}

class HomeControl {
    onAdd(map){
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        this.container.textContent = 'Home';

        this.container.innerHTML =
            '<div class="tools-box">' +
            '<button>' +
            '<span class="maplibregl-ctrl-icon" aria-hidden="true" title="Home"></span>' +
            '</button>' +
            '</div>';
        this.container.querySelector("span").style.backgroundImage = "url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDEzNiAxMjkuNiI+CiAgPGRlZnM+CiAgICA8c3R5bGU+CiAgICAgIC5jbHMtMSB7CiAgICAgICAgZmlsbDogIzMzMzsKICAgICAgICBmaWxsLXJ1bGU6IGV2ZW5vZGQ7CiAgICAgICAgc3Ryb2tlLXdpZHRoOiAwcHg7CiAgICAgIH0KICAgIDwvc3R5bGU+CiAgPC9kZWZzPgogIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTcwLDIxLjlsNDMuNCw0Mi4xYzEuOSwxLjguNiw1LTIsNWgtMTB2NDAuOWgtMjMuOHYtMjZoLTE5LjN2MjZoLTIzLjh2LTQwLjloLTEwYy0yLjYsMC0zLjktMy4yLTItNWw0My40LTQyLjFjMS4xLTEuMSwyLjktMS4xLDQsMFoiLz4KPC9zdmc+)"
        this.container.onclick = () => {
            map.fitBounds(map.homeBounds, {
                padding: 32
            });
        }
        return this.container;
    }
    onRemove(){
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
}



import { isMapboxURL, transformMapboxUrl } from "https://cdn.jsdelivr.net/npm/maplibregl-mapbox-request-transformer@0.0.2/src/index.min.js"
export class RelayMap extends HTMLElement {

    constructor() {
        super();

        let protocol = new Protocol();
        maplibregl.addProtocol("pmtiles",protocol.tile);
        this.mapInitialized = false;

        this.mapReady = new Promise((resolve) => {
            this._resolveMapReady = resolve;
        });
    }

    highlightLeg(legId) {
        this.mapReady.then(() => {
            // Pass -1 to clear all highlights
            if (legId >= 0) {
                console.log("Highlighting", legId)
                this.map.setFeatureState(
                    {source: 'legs', id: legId},
                    {selected: true}
                );
            }
            this.map.queryRenderedFeatures({ layers: ['legs'] }).forEach((feature) => {
                if (feature.id !== legId) {
                    console.log("Clearing", feature.id)
                    this.map.setFeatureState(
                        { source: 'legs', id: feature.id },
                        { selected: false }
                    );
                }
            });
            // Make sure the line gets redrawn
            this.map.redraw()
        })
    }

    addPoints(name, collection, style={}) {
        this.mapReady.then(() => {
            // If the source already exists, we'll just update the data
            if (this.map.getSource(name)) {
                this.map.getSource(name).setData(collection)
                return
            }
            this.map.addSource(name, {
                'type': 'geojson',
                'data': collection
            });
            this.map.addLayer({
                'id': name,
                'source': name,
                ...style
            });
        })
    }
    addTrains(trains) {
        this.mapReady.then(() => {
            this.map.getSource("trains").setData(trains)
        })
    }

    addLines(railLines, zIndex=0) {
        this.mapReady.then(() => {
            this.map.getSource("rail-lines").setData(railLines)
        })

    }
    addRelayLine(legs, exchanges, exchangeNames, useStationCodes=false, lineColors={}, imgBasePath="") {

        this.mapReady.then(async () => {
            let map = this.map
            let legsData = legs.features

            if (useStationCodes) {
                const line1StationCode = await map.loadImage(`${imgBasePath}1_station_code.png`);

                map.addImage('1stationcode', line1StationCode.data, {
                    stretchX: [[76, 77]],
                    // This part of the image that can contain text ([x1, y1, x2, y2]):
                    content: [76, 2, 96, 77],
                    pixelRatio: 4
                });
                const train = await map.loadImage(`${imgBasePath}train_icon.png`);

                map.addImage('train', train.data, {
                    content: [0, 0, 1, 1],
                    pixelRatio: 2
                });
            }

            const relayBounds = legsData.reduce((bounds, leg) => leg.geometry.coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, bounds), new maplibregl.LngLatBounds(legsData[0].geometry.coordinates[0], legsData[0].geometry.coordinates[0]));

            map.homeBounds = relayBounds
            if (map.getZoom() < 10) {
            map.fitBounds(relayBounds, {
                padding: 32
            });
            }

            let hideAttribution =()=> {
                let attribution = this.querySelector(".maplibregl-compact-show")
                if (attribution) {
                    attribution.classList.remove("maplibregl-compact-show")
                    attribution.classList.remove("mapboxgl-compact-show")
                }
            }

            window.addEventListener("resize", function () {
                if (window.innerWidth < 768) {
                    hideAttribution()
                }
            })
            if (window.innerWidth < 768) {
                hideAttribution()
            }
            // Add line color to each leg
            legsData.forEach((leg) => {
                leg.properties.lineColor = lineColors[0]
            })
            map.getSource('legs').setData(legs)

            // For each leg, we find the midpoint and create a label
            let labels = legsData.map((leg) => {
                let coordinates = leg.geometry.coordinates
                let midPoint = coordinates[Math.floor(coordinates.length / 2)]
                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: midPoint
                    },
                    properties: {
                        id: leg.properties.id,
                        sequence: leg.properties.sequence
                    }
                }
            })

            map.getSource('leg-labels').setData({
                type: 'FeatureCollection',
                features: labels
            })

            map.getSource('exchanges').setData(exchanges);

            map.setLayerZoomRange("exchange-circle", 0, useStationCodes ? 12 : 24)
            if (useStationCodes) {
                map.setLayoutProperty("exchange-id", 'visibility', 'none');
            } else {
                // Hide exchange station code
                map.setLayoutProperty('exchange-station-code', 'visibility', 'none');
                map.setLayoutProperty("exchange-id", 'visibility', 'visible');
            }

            let currentActiveLeg = null
            let currentLegPopup = null
            map.on('click', 'legs', (e) => {
                const coordinates = e.features[0].geometry.coordinates;
                const leg = e.features[0]
                const bounds = coordinates.reduce((bounds, coord) => {
                    return bounds.extend(coord);
                }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
                currentLegPopup = new maplibregl.Popup({
                    anchor: "bottom-left",
                    offset: [16, 0],
                    className: "leg-popup",
                    focusAfterOpen: true
                })
                    .setLngLat([bounds.getEast(), bounds.getCenter().lat])
                    .setMaxWidth("300px")
                    .setHTML(formatLegDescription(exchangeNames[leg.properties.start_exchange], exchangeNames[leg.properties.end_exchange], leg.properties, false, false, coordinates))
                    .on("close", () => {
                        this.highlightLeg(-1)
                        currentActiveLeg = null
                        this.focus()
                    })
                    .addTo(map);
                let profile = currentLegPopup._content.querySelector("elevation-profile")
                profile.style.width = "100%"
                profile.style.height = "64px"
                // Maplibre strips out elevation (and any further data) per point. Get data straight from legs
                profile.elevationData = legs.features.filter(l => l.properties.id === leg.id)[0].geometry.coordinates
                map.fitBounds(bounds, {
                    padding: 32
                });
                this.highlightLeg(leg.id)
            })

            map.on('mouseenter', 'legs', () => {
                map.getCanvas().style.cursor = 'pointer';

            });
            map.on('mouseleave', 'legs', () => {
                map.getCanvas().style.cursor = '';
            });
        })
    }

                            connectedCallback() {
        this.innerHTML = `
<style>
relay-map {
    display: block;
    width: 100%;
    height: 100%;
}
`
        // Make the map focusable
        this.tabIndex = 0
        let centerValue = this.attributes.getNamedItem("center").value
        let boundaryValue = this.attributes.getNamedItem("max-bounds").value
        this.style.display = "block"
        Promise.all([JSON.parse(centerValue), JSON.parse(boundaryValue)]).then(([center, boundary]) => {
            let map = new maplibregl.Map({
                container: this,
                attributionControl: false,
                style: this.attributes.getNamedItem("style-href").value,
                center: center,
                zoom: 9,
                minZoom: 8,
                maxBounds: boundary,
                hash: true,
                transformRequest: transformRequest,
            });
            // Don't break basic page scrolling until the map is focused
            map.scrollZoom.disable()
            let container = map.getContainer();
            // container needs to have tabindex=0 to be focusable
            map.on("click", () => container.focus())
            map.on("pitchstart", () => container.focus())
            map.on("drag", () => container.focus())
            map.on("load", () => this._resolveMapReady())
            container.addEventListener('focus', () => map.scrollZoom.enable());
            container.addEventListener('blur', () => map.scrollZoom.disable());
            let nav = new maplibregl.NavigationControl();
            map.addControl(nav, 'top-left');
            map.addControl(new maplibregl.FullscreenControl({container: map.getContainer()}), 'top-left');
            map.addControl(new maplibregl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true
            }), 'top-left');
            let scale = new maplibregl.ScaleControl({
                maxWidth: 80,
                unit: 'imperial'
            });
            map.addControl(new HomeControl(), 'top-left');

            map.addControl(scale);
            map.addControl(new maplibregl.AttributionControl({
                compact: true
            }));
            this.map = map
        })
    }
}

customElements.define('relay-map', RelayMap);