let map;
let customOverlay = null;
let currentPolyline = null;
let first_Polyline = null;
let closestAEDs = [];

function initializeMap() {
    const xmlDataUrl = 'https://apis.data.go.kr/6260000/BusanAedsService/getAedsList?serviceKey=X8s%2BvuX0%2F3WxkVikH1ZCFuWcowECbvxJ%2FTUSmNA3uHCkErHNm15tHPUXOyd7gxmDw1wIJEBisOCb%2B2XaNsAOCg%3D%3D&pageNo=1&numOfRows=1079';

    const container = document.getElementById('map');
    const options = {
        center: new kakao.maps.LatLng(35.179816, 129.075075),
        level: 3
    };
    map = new kakao.maps.Map(container, options); //카카오맵 출력

    currentLocation() // get__current_location.js파일의 currentLocation()함수 가져오기
        .then(userPosition => {
            userPosition = new kakao.maps.LatLng(userPosition.lat, userPosition.lng); // 카카오 api 전역변수 설정
            map.setCenter(userPosition); // 중심점 userPosition으로 이동
            var imageSrc = "../media/myLocaMarker.png",
                imageSize = new kakao.maps.Size(55, 46),
                imageOption = { offset: new kakao.maps.Point(27.5, 46) };//이미지 속성 정의
            const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
            var userMarker = new kakao.maps.Marker({ position: userPosition, image: markerImage }); // 이미지 속성을 지닌 지역변수            userMarker.setMap(map); //
            userMarker.setMap(map);

            fetch(xmlDataUrl)
                .then(response => response.text())
                .then(data => {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(data, 'text/xml');
                    const items = xmlDoc.getElementsByTagName('item');

                    const radius = 300; //반경 300m이내로 찾기

                    for (let i = 0; i < items.length; i++) {
                        const addrs = items[i].getElementsByTagName('addrs')[0].textContent;
                        const geom = items[i].getElementsByTagName('geom')[0].textContent;
                        const [longitude, latitude] = geom.replace('POINT(', '').replace(')', '').split(' ');
                        const tel = items[i].getElementsByTagName('biz_tel')[0].textContent;
                        //공공데이터 api의 데이터 불러오기
                        const markerPosition = new kakao.maps.LatLng(parseFloat(latitude), parseFloat(longitude));
                        //내 위치와 AED 마커까지의 거리 계산
                        const distance = getDistance(userPosition, markerPosition);
                        
                        if (distance <= radius) { // 반경이내에 있는 AED 마커들을 closetAEDs 배열에 넣기
                            closestAEDs.push({
                                position: markerPosition,
                                address: addrs,
                                distance: distance,
                                tel: tel
                            })
                        }
                    }
                    if(closestAEDs.length == 0){ // 만약 반경에 AED없을 때, Modal창 띄우기
                        openModal();
                    }
                    else{
                        // 거리 순으로 정렬 한 후, 3개 이외에는 자르기
                        closestAEDs.sort((a, b) => a.distance - b.distance);
                        closestAEDs = closestAEDs.slice(0, 3);
                        
                        closestAEDs.forEach(aed => {
                            var imageSrc = "../media/AEDimage.png",
                                imageSize = new kakao.maps.Size(74, 62),
                                imageOption = { offset: new kakao.maps.Point(37, 62) };
                            const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
                            //마커 이미지 설정
                            const aedMarker = new kakao.maps.Marker({
                                position: aed.position,
                                image: markerImage
                            });
                            aedMarker.setMap(map); // 지도에 마커 띄우기

                            //AED마커 클릭 시, 이벤트 설정
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
                                //커스텀 오버레이 속성 설정
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

//커스텀 오버레이 닫기 버튼
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
            //Tmap API를 활용해 도보 길찾기 기능 가져오기
            var resultData = response.features;
            var points = [];
            var totalDistance = 0;
            var totalTimeInSeconds = 0;
            var address = '';
            var tel = '';

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
            // 주소와 전화번호는 해당 함수 밖에 있기에 closetAEDs.find()를 통해 가져옴
            var aedInfo = closestAEDs.find(aed => aed.position.getLng() === endX && aed.position.getLat() === endY);
            if (aedInfo) {
                address = aedInfo.address;
                tel = aedInfo.tel;
            }
            drawLineOnMap(points);
            closeOverlay();
            totalDistance *= 2;
            totalTimeInSeconds *= 2;

            var minutes = Math.floor(totalTimeInSeconds / 60);
            var seconds = totalTimeInSeconds % 60;
            var totalTimeText = `${minutes}분 ${seconds}초`;

            updateRouteInfo(address, tel, totalDistance, totalTimeText);
        },
        error: function (request, status, error) {
            console.log("Error:", error);
        }
    });
}
//지도에 경로 그리기
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
    const avgPosition = new kakao.maps.LatLng(avgY, avgX); // 내 위치와 AED마커 위치의 중심으로 지도를 옮기기
    map.panTo(avgPosition);
    if (currentPolyline) {
        currentPolyline.setMap(null);
        currentPolyline = null;
        setRouteInfoPosition();
        drawWalkingRoute(startX, startY, endX, endY);
        
    }
    else{
        setRouteInfoPosition();
        drawWalkingRoute(startX, startY, endX, endY);
    }
}

// 길찾기 버튼을 눌렀을 경우, 밑에 창으로 해당 정보들을 전달
function updateRouteInfo(address, tel, distance, time) {
    const routeInfo = document.getElementById('routeInfo');
    routeInfo.innerHTML = `
        <button onclick="closeRouteInfoPosition()" style="position: relative; left : 90%; top: 5%; width : 50px; height : 30px; border-radius: 5px;">닫기</button>
        <p>주소: ${address}</p>
        <p>전화번호: ${tel}</p>
        <p>왕복 거리: ${(distance / 1000).toFixed(2)} km</p>
        <p>왕복 소요 시간: ${time}</p>
    `;
}


// 주변 AED 마커가 없을 때, 뒤로가기 버튼이 포함된 모달 생성하는 함수
function openModal() {
    document.getElementById('myModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('myModal').style.display = 'none';
}

function setRouteInfoPosition() {
    const routeInfo = document.getElementById('routeInfo');
    routeInfo.style.left = `0px`;
    routeInfo.style.bottom = `5%`;
    routeInfo.style.zIndex = '1000';
    routeInfo.style.display = 'block';
}

function closeRouteInfoPosition(){
    routeInfo.style.display = 'none';
}