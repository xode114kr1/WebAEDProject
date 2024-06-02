// 사용자의 현재 위치를 저장할 전역 변수
let userLocation = null;

// 위치 정보를 받아오고 처리하는 함수
function handleUserLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            // 위치 정보 동의를 요청
            navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
                if (permissionStatus.state === 'granted') {
                    // 위치 정보를 가져옴
                    navigator.geolocation.getCurrentPosition(function(position) {
                        const lat = position.coords.latitude; // 위도
                        const lng = position.coords.longitude; // 경도
                        
                        // 사용자의 현재 위치를 전역 변수에 저장
                        userLocation = {
                            lat: lat,
                            lng: lng
                        };
                        
                        resolve(userLocation);
                    }, function(error) {
                        console.error('Error:', error);
                        reject('위치 정보를 가져오는 데 실패했습니다.');
                    }, {
                        enableHighAccuracy: true,
                        maximumAge: 0,
                        timeout: Infinity
                    });
                } else if (permissionStatus.state === 'prompt') {
                    // 위치 정보 동의가 필요한 경우 사용자에게 요청
                    navigator.geolocation.getCurrentPosition(function(position) {
                        // 사용자가 위치 정보 동의를 하면 위치 정보를 가져옴
                        const lat = position.coords.latitude; // 위도
                        const lng = position.coords.longitude; // 경도
                        
                        // 사용자의 현재 위치를 전역 변수에 저장
                        userLocation = {
                            lat: lat,
                            lng: lng
                        };
                        
                        resolve(userLocation);
                    }, function(error) {
                        console.error('Error:', error);
                        reject('위치 정보를 가져오는 데 실패했습니다.');
                    }, {
                        enableHighAccuracy: true,
                        maximumAge: 0,
                        timeout: Infinity
                    });
                } else {
                    // 위치 정보 동의가 거부된 경우
                    reject('위치 정보를 사용할 수 없습니다.');
                }
            });
        } else {
            reject('현재 브라우저에서는 내 위치 찾기를 지원하지 않습니다');
        }
    });
}

// 페이지 로드 시 사용자 위치 정보를 가져와서 처리
handleUserLocation()
    .then(userLocation => {
        console.log('사용자의 현재 위치:', userLocation);
        getAddr(userLocation.lat, userLocation.lng);
    })
    .catch(error => {
        console.error('Error:', error);
        alert(error);
    });
