// 사용자의 현재 위치를 가져와 지도에 표시하는 함수

function getCurrentLocation() {
    handleUserLocation()
        .then(userLocation => {
            const lat = userLocation.lat; // get_current_location.js에서 받은 위도
            const lng = userLocation.lng; // get_current_location.js에서 받은 경도

            // 사용자의 현재 위치를 중심으로 지도를 생성
            const container = document.getElementById('map');
            const options = {
                center: new kakao.maps.LatLng(lat, lng), // 현재 위치를 중심으로 설정
                level: 3 // 확대 수준 설정
            };
            const map = new kakao.maps.Map(container, options); //지도 생성 
        })
        .catch(error => {
            alert(error);
        });

}
