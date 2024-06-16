let map;
let customOverlay = null;
let currentPolyline = null;
let first_Polyline = null;

function initializeMap() {
    const xmlDataUrl = 'https://apis.data.go.kr/6260000/BusanAedsService/getAedsList?serviceKey=X8s%2BvuX0%2F3WxkVikH1ZCFuWcowECbvxJ%2FTUSmNA3uHCkErHNm15tHPUXOyd7gxmDw1wIJEBisOCb%2B2XaNsAOCg%3D%3D&pageNo=1&numOfRows=1079';

    const container = document.getElementById('map');
    const options = {
        center: new kakao.maps.LatLng(35.179816, 129.075075),
        level: 3
    };
    map = new kakao.maps.Map(container, options);

    currentLocation()
        .then(userPosition => {
            userPosition = new kakao.maps.LatLng(userPosition.lat, userPosition.lng);
            map.setCenter(userPosition);
            var userMarker = new kakao.maps.Marker({ position: userPosition });
            userMarker.setMap(map);

            fetch(xmlDataUrl)
                .then(response => response.text())
                .then(data => {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(data, 'text/xml');
                    const items = xmlDoc.getElementsByTagName('item');

                    const radius = 800;
                    let closestAEDs = [];

                    for (let i = 0; i < items.length; i++) {
                        const addrs = items[i].getElementsByTagName('addrs')[0].textContent;
                        const geom = items[i].getElementsByTagName('geom')[0].textContent;
                        const [longitude, latitude] = geom.replace('POINT(', '').replace(')', '').split(' ');
                        const tel = items[i].getElementsByTagName('biz_tel')[0].textContent;

                        const markerPosition = new kakao.maps.LatLng(parseFloat(latitude), parseFloat(longitude));
                        const distance = getDistance(userPosition, markerPosition);

                        if (distance <= radius) {
                            closestAEDs.push({
                                position: markerPosition,
                                address: addrs,
                                distance: distance,
                                tel: tel
                            })
                        }
                    }
                    if(closestAEDs.length == 0){
                        alert("주변에 AED가 없습니다.");
                    }
                    else{
                        closestAEDs.sort((a, b) => a.distance - b.distance);
                        closestAEDs = closestAEDs.slice(0, 3);

                        closestAEDs.forEach(aed => {
                            var imageSrc = "../media/AEDimage.png",
                                imageSize = new kakao.maps.Size(74, 62),
                                imageOption = { offset: new kakao.maps.Point(27, 69) };
                            const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

                            const aedMarker = new kakao.maps.Marker({
                                position: aed.position,
                                image: markerImage
                            });
                            aedMarker.setMap(map);

                            kakao.maps.event.addListener(aedMarker, 'click', function () {
                                map.panTo(aedMarker.getPosition());
                                if (customOverlay) {
                                    customOverlay.setMap(null);
                                }
                                const content = `
                                    <div class="customoverlay">
                                        <button class="closebtn" onclick="closeOverlay()">×</button>
                                        <span class="title">
                                            ${aed.address}<br> Tel: ${aed.tel}
                                        </span>
                                        <button onclick="toggleWalkingRoute(${userPosition.getLng()}, ${userPosition.getLat()}, ${aed.position.getLng()}, ${aed.position.getLat()})">길찾기</button>
                                    </div>
                                `;

                                customOverlay = new kakao.maps.CustomOverlay({
                                    content: content,
                                    map: map,
                                    position: aedMarker.getPosition(),
                                    yAnchor: 1.15
                                });
                                customOverlay.setMap(map);
                            });
                        });
                    }
                })
                .catch(error => {
                    console.error('XML 데이터 가져오는 중 오류 발생:', error);
                });
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error);
        });
}

window.onload = initializeMap;

function closeOverlay() {
    if (customOverlay) {
        customOverlay.setMap(null);
    }
}

//거리 계산
function getDistance(latlng1, latlng2) {
    const R = 6371e3;
    const lat1 = latlng1.getLat() * Math.PI / 180;
    const lat2 = latlng2.getLat() * Math.PI / 180;
    const deltaLat = (latlng2.getLat() - latlng1.getLat()) * Math.PI / 180;
    const deltaLng = (latlng2.getLng() - latlng1.getLng()) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance;
}
//길찾기 api 실행
function drawWalkingRoute(startX, startY, endX, endY) {
    $.ajax({
        method: "POST",
        headers: {
            "appKey": "WiHftSul0k9KQuIGsY2qy34zYq3d2pkB7UXEAGF0"
        },
        url: "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json",
        data: {
            "startX": startX,
            "startY": startY,
            "endX": endX,
            "endY": endY,
            "reqCoordType": "WGS84GEO",
            "resCoordType": "EPSG3857",
            "startName": "출발지",
            "endName": "도착지",
            "searchOption": 10

        },
        success: function (response) {
            var resultData = response.features;
            var points = [];
            var totalDistance = 0;
            var totalTimeInSeconds = 0;

            for (var i in resultData) {
                var geometry = resultData[i].geometry;
                var properties = resultData[i].properties;

                if (geometry.type == "LineString") {
                    for (var j in geometry.coordinates) {
                        var point = new Tmapv2.Point(geometry.coordinates[j][0], geometry.coordinates[j][1]);
                        var convertPoint = Tmapv2.Projection.convertEPSG3857ToWGS84GEO(point);
                        var latLng = new kakao.maps.LatLng(convertPoint._lat, convertPoint._lng);
                        points.push(latLng);
                    }
                }

                if(properties){
                    totalDistance += properties.totalDistance ? properties.totalDistance : 0;
                    totalTimeInSeconds += properties.totalTime ? properties.totalTime : 0;
                }
            }
            drawLineOnMap(points);
            closeOverlay();
            totalDistance *= 2;
            totalTimeInSeconds *= 2;

            var minutes = Math.floor(totalTimeInSeconds / 60);
            var seconds = totalTimeInSeconds % 60;
            var totalTimeText = `${minutes}분 ${seconds}초`;

            document.getElementById('routeInfo').innerHTML = `왕복 거리: ${(totalDistance / 1000).toFixed(2)} km<br>왕복 소요 시간: ${totalTimeText}`;
        },
        error: function (request, status, error) {
            console.log("Error:", error);
        }
    });
}
//지도에 경로 있는 경우엔 버튼 다시 누르면 삭제. 없는 경우엔 그리기
function drawLineOnMap(points) {
    currentPolyline = new kakao.maps.Polyline({
        path: points,
        strokeWeight: 5,
        strokeColor: '#FF0000',
        strokeOpacity: 0.7,
        strokeStyle: 'solid'
    });
    currentPolyline.setMap(map);
}
//
function toggleWalkingRoute(startX, startY, endX, endY) {
    var avgX = (startX + endX) / 2;
    var avgY = (startY + endY) / 2;
    const avgPosition = new kakao.maps.LatLng(avgY, avgX);
    map.panTo(avgPosition);
    if (currentPolyline) {
        currentPolyline.setMap(null);
        currentPolyline = null;
        drawWalkingRoute(startX, startY, endX, endY);
    }
    else{
        drawWalkingRoute(startX, startY, endX, endY);
    }
}
