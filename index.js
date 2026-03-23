// JSON読み込み
async function loadJSONFiles() {
  const resp_airport = await fetch("./public/airportsData.json");
  const resp_adj = await fetch("./public/adjList.json");
  console.log(resp_adj);

  const airportData = await resp_airport.json();
  const adjList = await resp_adj.json();

  return [airportData, adjList];
}

let airportData, adjList;
let itinerary = [];
let isFinalized = false;
let map, polylineGroup, markerGroup;

async function initApp() {
  const [data, list] = await loadJSONFiles();
  airportData = data;
  adjList = list;

  initMap();
  updateApp();
}

window.onload = initApp;

function initMap() {
  map = L.map("map").setView([37.5, 137.5], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  polylineGroup = L.layerGroup().addTo(map);
  markerGroup = L.layerGroup().addTo(map);
}

function renderOptions(currentAirport) {
  const container = document.getElementById("options-container");
  const hubcontainer = document.getElementById("options-container-hubairports");
  const title = document.getElementById("options-title");
  container.innerHTML = "";
  hubcontainer.innerHTML = "";

  const hubairports = [
    "HND",
    "NRT",
    "CTS",
    "FUK",
    "OKA",
    "ITM",
    "KIX",
    "NGO",
    "SDJ",
  ];

  let possibleDestinations = [];
  if (itinerary.length === 0) {
    title.innerText = "出発空港を選択してください";
    possibleDestinations = Object.keys(airportData).sort();
  } else {
    title.innerText = `${airportData[currentAirport].name} (${currentAirport}) から行ける場所`;
    possibleDestinations = adjList[currentAirport] || [];
  }

  if (possibleDestinations.length === 0) {
    container.innerHTML =
      '<p class="text-slate-400 col-span-full italic p-4 text-center">これ以上の接続便はありません</p>';
  }

  possibleDestinations.forEach((code) => {
    const btn = document.createElement("button");
    const isSelected = itinerary.includes(code);
    btn.className = `p-3 bg-white border-2 ${isSelected ? "border-red-500 bg-red-50" : "border-slate-200"} hover:border-red-500 hover:bg-red-50 rounded-xl transition-all text-center group`;
    btn.onclick = () => addToItinerary(code);
    btn.innerHTML = `
                <div class="text-lg font-bold text-slate-800 group-hover:text-red-600">${code}</div>
                <div class="text-[10px] text-slate-500 truncate">${airportData[code].name}</div>
            `;
    const hubFlag = hubairports.includes(code);
    if (hubFlag) {
      hubcontainer.appendChild(btn);
    } else {
      container.appendChild(btn);
    }
  });
}

function updateItineraryDisplay() {
  const display = document.getElementById("itinerary-display");
  if (itinerary.length === 0) {
    display.innerHTML =
      '<p class="text-slate-400 italic">空港を選択して旅を開始してください</p>';
    return;
  }

  display.innerHTML = itinerary
    .map((code, index) => {
      const isFinal = isFinalized;
      const itemColor = isFinal
        ? index === 0 || index === itinerary.length - 1
          ? "bg-slate-900 text-white"
          : "bg-white border-slate-300"
        : index === itinerary.length - 1
          ? "bg-red-50 border-red-200"
          : "bg-slate-50 border-slate-100";
      const circleColor = isFinal
        ? "bg-red-600 text-white"
        : "bg-red-600 text-white";

      return `
                <div class="flex items-center gap-3 p-3 ${itemColor} border rounded-xl transition-colors duration-300">
                    <div class="w-6 h-6 rounded-full ${circleColor} text-[10px] flex items-center justify-center font-bold">
                        ${index + 1}
                    </div>
                    <div>
                        <div class="font-bold text-sm">${airportData[code].name} (${code})</div>
                        ${index === 0 ? `<span class="text-[10px] ${isFinal ? "text-red-400" : "text-red-600"} font-bold uppercase tracking-tighter">Departure</span>` : ""}
                        ${isFinal && index === itinerary.length - 1 ? '<span class="text-[10px] text-red-400 font-bold uppercase tracking-tighter">Final Arrival</span>' : ""}
                    </div>
                </div>
                ${index < itinerary.length - 1 ? `<div class="ml-6 border-l-2 border-dashed ${isFinal ? "border-slate-400" : "border-slate-300"} h-4"></div>` : ""}
            `;
    })
    .join("");
}

function addToItinerary(code) {
  if (isFinalized) return;
  if (itinerary.length > 0 && itinerary[itinerary.length - 1] === code) return;
  itinerary.push(code);
  updateApp();
}

function popItinerary() {
  if (isFinalized) return;
  if (itinerary.length > 0) {
    itinerary.pop();
    updateApp();
  }
}

function resetItinerary() {
  itinerary = [];
  isFinalized = false;
  updateApp();
}

function finalizeItinerary() {
  if (itinerary.length < 2) return;
  isFinalized = true;
  updateApp();
}

function editItinerary() {
  isFinalized = false;
  updateApp();
}

function updateApp() {
  updateItineraryDisplay();

  const lastAirport =
    itinerary.length > 0 ? itinerary[itinerary.length - 1] : null;
  const optionsSection = document.getElementById("options-section");
  const finalActions = document.getElementById("final-actions");
  const itineraryTitle = document.getElementById("itinerary-title");
  const finalBadge = document.getElementById("final-badge");
  const finishBtn = document.getElementById("finish-btn");
  const headerControls = document.getElementById("back-step-btn");
  const resetBtn = document.getElementById("reset-btn");

  if (isFinalized) {
    optionsSection.classList.add("hidden");
    finalActions.classList.remove("hidden");
    itineraryTitle.innerText = "📅 確定した旅程";
    finalBadge.classList.remove("hidden");
    finishBtn.classList.add("hidden");
    headerControls.classList.add("hidden");
    resetBtn.classList.add("hidden"); // 確定時はサイドバーのリセットを使う
  } else {
    optionsSection.classList.remove("hidden");
    finalActions.classList.add("hidden");
    itineraryTitle.innerText = "📍 現在の旅程";
    finalBadge.classList.add("hidden");
    headerControls.classList.remove("hidden");
    resetBtn.classList.remove("hidden");

    renderOptions(lastAirport);

    if (itinerary.length >= 2) {
      finishBtn.classList.remove("hidden");
    } else {
      finishBtn.classList.add("hidden");
    }
  }

  drawMap();
}

function drawMap() {
  polylineGroup.clearLayers();
  markerGroup.clearLayers();

  Object.keys(airportData).forEach((code) => {
    const isSelected = itinerary.includes(code);
    const isLast =
      itinerary.length > 0 && itinerary[itinerary.length - 1] === code;

    const marker = L.circleMarker(
      [airportData[code].lat, airportData[code].lng],
      {
        radius: isLast ? 8 : isSelected ? 6 : 4,
        fillColor: isLast ? "#d1121c" : isSelected ? "#f87171" : "#cbd5e1",
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
      },
    ).addTo(markerGroup);

    marker.bindTooltip(airportData[code].name, {
      permanent: isSelected,
      direction: "top",
      className: "airport-label",
    });
  });

  if (itinerary.length > 1) {
    const pathPoints = itinerary.map((code) => [
      airportData[code].lat,
      airportData[code].lng,
    ]);
    L.polyline(pathPoints, {
      color: isFinalized ? "#0f172a" : "#d1121c",
      weight: 4,
      opacity: 0.8,
      dashArray: isFinalized ? "" : "10, 10",
      lineJoin: "round",
    }).addTo(polylineGroup);
    map.fitBounds(L.polyline(pathPoints).getBounds(), {
      padding: [50, 50],
    });
  } else if (itinerary.length === 1) {
    map.setView(
      [airportData[itinerary[0]].lat, airportData[itinerary[0]].lng],
      6,
    );
  } else {
    map.setView([37.5, 137.5], 5);
  }
}
