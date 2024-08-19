const transportConfig = {
    ptBusCity: { name: 'Bus', backgroundColor: '#13285A', darkBackgroundColor: '#1E3C8A' },
    ptBusNight: { name: 'Night Bus', backgroundColor: '#1A1460', darkBackgroundColor: '#2A2170', textColor: '#FCF250' },
    ptRufBus: { name: 'Rufbus', backgroundColor: '#1A1460', darkBackgroundColor: '#2A2170', textColor: '#FCF250' },
    ptTrainS: { name: 'S-Bahn', backgroundColor: '#4295D3', darkBackgroundColor: '#52A5E3' },
    ptTram: { name: 'Tram', backgroundColor: '#CF2E26', darkBackgroundColor: '#DF3E36' },
    ptTramWLB: { name: 'Badner Bahn', backgroundColor: '#245894', darkBackgroundColor: '#3468A4' },
    ptMetro: { 
        name: 'Metro', 
        backgroundColor: '#CF2E26',
        darkBackgroundColor: '#DF3E36',
        lineColors: {
            U1: { light: '#CF2E26', dark: '#DF3E36' },
            U2: { light: '#9E659F', dark: '#AE75AF' },
            U3: { light: '#DF8330', dark: '#EF9340' },
            U4: { light: '#41934A', dark: '#51A35A' },
            U6: { light: '#956B3A', dark: '#A57B4A' }
        }
    }
}

// Global variables
let updateTimer
let lastUpdateTime = null
let stationsList = []
let updateInterval

// DOM elements
const stationNameContainer = document.querySelector('.station-name-container')
const stationModal = document.getElementById('station-modal')
const stationList = document.getElementById('station-list')
const stationSearch = document.getElementById('station-search')
const clearSearchButton = document.getElementById('clear-search')
const stationNameElement = document.getElementById('station-name')
const stationDistanceElement = document.getElementById('station-distance')
const departuresGrid = document.getElementById('departures-grid')
const lastUpdateElement = document.getElementById('last-update')

// Event listeners
document.addEventListener('DOMContentLoaded', () => updateStationInfo())
stationNameContainer.addEventListener('click', showModal)
stationModal.addEventListener('click', handleModalClick)
stationSearch.addEventListener('input', handleStationSearch)
clearSearchButton.addEventListener('click', clearSearchInput)
stationList.addEventListener('click', handleStationSelection)

function isDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function startUpdateTimer() {
    if (updateTimer) {
        clearInterval(updateTimer)
    }
    lastUpdateTime = new Date()
    updateTimer = setInterval(updateLastUpdatedText, 1000)
    updateLastUpdatedText()
}

function showModal() {
    stationModal.style.display = 'flex'
}

function hideModal() {
    stationModal.style.display = 'none'
    clearSearchInput()
}

function handleModalClick(e) {
    if (e.target === stationModal) {
        hideModal()
    }
}

function handleStationSearch() {
    const query = stationSearch.value.toLowerCase()
    const filteredStations = stationsList.filter(station =>
        station.name.toLowerCase().includes(query)
    )
    renderStationList(filteredStations)
    clearSearchButton.style.display = query.length > 0 ? 'block' : 'none'
}

function clearSearchInput() {
    stationSearch.value = ''
    clearSearchButton.style.display = 'none'
    renderStationList(stationsList)
}

function handleStationSelection(e) {
    const stationItem = e.target.closest('.station-item')
    if (stationItem) {
        const stationName = stationItem.querySelector('span').innerText
        const stationDiva = stationItem.getAttribute('data-station-diva')
        const stationDistance = parseFloat(stationItem.getAttribute('data-station-distance'))

        stationNameElement.innerText = stationName
        stationDistanceElement.innerText = formatDistance(stationDistance)

        hideModal()

        departuresGrid.innerHTML = ''

        if (updateInterval) {
            clearInterval(updateInterval)
        }
        updateDepartures(stationDiva)
        updateInterval = setInterval(() => updateDepartures(stationDiva), 30000)
    }
}

// Haversine function to calculate distance between two coordinates
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c; // Distance in kilometers
    return distance * 1000; // Convert to meters
}

// Function to parse CSV data
function parseCSV(csv) {
    const lines = csv.split('\r\n')
    const headers = lines[0].split(';')
    return lines.slice(1).map(line => {
        const values = line.split(';')
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index]
            return obj
        }, {})
    })
}

// Function to fetch and process station data
async function fetchAndProcessStations(latitude, longitude) {
    try {
        // Netlify CORS proxy for https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-haltepunkte.csv
        const response = await fetch('/api/csv')
        const csvData = await response.text()
        const stops = parseCSV(csvData)

        const uniqueStations = {}

        stops
            .filter(stop => stop.DIVA && stop.StopText && stop.Latitude && stop.Longitude)
            .forEach(stop => {
                const distance = haversine(latitude, longitude, parseFloat(stop.Latitude.trim()), parseFloat(stop.Longitude.trim()))
                
                if (!uniqueStations[stop.DIVA] || distance < uniqueStations[stop.DIVA].distance) {
                    uniqueStations[stop.DIVA] = {
                        name: stop.StopText,
                        diva: stop.DIVA,
                        distance: distance
                    }
                }
            })

        // Convert the object back to an array
        stationsList = Object.values(uniqueStations)

        return stationsList.sort((a, b) => a.distance - b.distance)
    } catch (error) {
        console.error('Error fetching or processing station data:', error)
        return []
    }
}

function updateStationInfo() {
    getCoordinates()
        .then(({ latitude, longitude }) => fetchAndProcessStations(latitude, longitude))
        .then(stationsList => {
            renderStationList(stationsList)

            const nearestStation = stationsList[0]
            stationNameElement.innerText = nearestStation.name
            stationDistanceElement.innerText = formatDistance(nearestStation.distance)
            updateDepartures(nearestStation.diva)
            updateInterval = setInterval(() => updateDepartures(nearestStation.diva), 30000)
        })
        .catch(error => console.error('Error updating station info:', error))
}

function getCoordinates() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }),
                error => reject(error)
            )
        } else {
            reject(new Error('Geolocation not supported'))
        }
    })
}

function updateDepartures(diva) {
    lastUpdateElement.textContent = 'Updating...'

    // Netlify CORS proxy for https://www.wienerlinien.at/ogd_realtime/monitor
    fetch(`/api/monitor?diva=${diva}`)
        .then(response => response.json())
        .then(data => {
            if (!data.data || !data.data.monitors) {
                throw new Error('Invalid response from Wiener Linien API')
            }

            const departures_info = []
            data.data.monitors.forEach(monitor => {
                monitor.lines.forEach(line => {
                    const departures = line.departures.departure
                        .slice(0, 3)
                        .map(departure => {
                            const displayTime = departure.departureTime.timeReal || departure.departureTime.timePlanned
                            return {
                                time: displayTime,
                                minutes: departure.departureTime.countdown
                            }
                        })

                    departures_info.push({
                        line: line.name,
                        type: line.type,
                        destination: title(line.towards),
                        departures: departures
                    })
                })
            })

            renderDepartures(departures_info)
            startUpdateTimer()
        })
        .catch(error => {
            console.error('Error fetching departures:', error)
            lastUpdateElement.textContent = 'Update failed. Please try again.'
        })
}

function renderDepartures(data) {
    departuresGrid.innerHTML = ''
    data.forEach(transport => {
        const tile = createTransportTile(transport)
        departuresGrid.appendChild(tile)
    })
    startUpdateTimer()
}

function createTransportTile(transport) {
    const transportInfo = transportConfig[transport.type]
    const textColor = transportInfo.textColor || '#FFFFFF'
    let backgroundColor = isDarkMode() ? transportInfo.darkBackgroundColor : transportInfo.backgroundColor

    if (transport.type === 'ptMetro' && transportInfo.lineColors[transport.line]) {
        backgroundColor = isDarkMode() 
            ? transportInfo.lineColors[transport.line].dark 
            : transportInfo.lineColors[transport.line].light;
    }

    const tile = document.createElement('div')
    tile.className = 'tile'

    const header = document.createElement('div')
    header.className = 'header transport-info'
    header.innerHTML = `
        <span class="transport-number" style="background-color: ${backgroundColor}; color: ${textColor};">${transport.line || 'N/A'}</span>
        <span class="transport-type">${transportInfo.name}</span>
    `

    const destination = document.createElement('div')
    destination.className = 'destination'
    destination.innerText = `to ${transport.destination}`

    const departures = document.createElement('div')
    departures.className = 'departures'

    transport.departures.forEach(departure => {
        const departureDiv = document.createElement('div')
        departureDiv.className = 'departure'
        departureDiv.innerHTML = `
            <span class="time">${formatTime(departure.time)}</span>
            <span class="minutes">${formatPlural(departure.minutes, 'min')}</span>
        `
        departures.appendChild(departureDiv)
    })

    tile.appendChild(header)
    tile.appendChild(destination)
    tile.appendChild(departures)
    return tile
}

function updateLastUpdatedText() {
    if (lastUpdateTime) {
        const now = new Date()
        const diff = Math.floor((now - lastUpdateTime) / 1000)
        const minutes = Math.floor(diff / 60)
        const seconds = diff % 60
        let timeString = ''
        if (minutes > 0) {
            timeString += `${formatPlural(minutes, 'minute')} `
        }
        timeString += `${formatPlural(seconds, 'second')}`
        lastUpdateElement.textContent = `Last updated: ${timeString} ago`
    }
}

// Modify your existing renderStationList function
function renderStationList(stations) {
    stationList.innerHTML = stations.map(station => `
        <div class="station-item" data-station-diva='${station.diva}' data-station-distance='${station.distance}'>
            <span class="modal-station">${station.name}</span>
            <span class="station-distance">${formatDistance(station.distance)}</span>
        </div>`
    ).join('')
}

function formatDistance(distance) {
    return distance < 1000 ? `${distance.toFixed(1)} m` : `${(distance / 1000).toFixed(2)} km`
}

function formatTime(timeString) {
    const parsedTime = new Date(timeString)
    return parsedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatPlural(count, baseString) {
    const pluralString = count === 1 ? baseString : baseString + 's'
    return `${count} ${pluralString}`
}

function title(str) {
      return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}