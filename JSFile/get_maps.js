// 사용자의 현재 위치를 가져와 지도에 표시하는 함수

function getCurrentLocation() {
    handleUserLocation()
        .then(userLocation => {
            const lat = userLocation.lat; // get_current_location.js에서 받은 위도
            const lng = userLocation.lng; // get_current_location.js에서 받은 경도
            var moveLatLon = new kakao.maps.LatLng(lat, lng);
        
            // 지도 중심을 이동 시킵니다
            map.setCenter(moveLatLon);
        })
        .catch(error => {
            alert(error);
        });
}

