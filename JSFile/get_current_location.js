// 사용자의 현재 위치를 저장할 전역 변수
let userPosition = null;

// 위치 정보를 받아오고 처리하는 함수
function currentLocation(callback) {
    return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            userPosition={
                lat: userLat,
                lng: userLng
            }
            resolve(userPosition);
            if(callback)    callback(userPosition);
        }, error => {
            console.error('Error fetching user location:', error);
            reject('위치 정보를 가져오는 데 실패했습니다.')
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
        reject('위치 정보를 가져오는 데 실패했습니다.')
    }
    });
}
