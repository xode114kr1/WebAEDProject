function getAddr(lat, lng) {
    // 카카오 REST API 주소로 변환 요청
    const apiKey = 'f982d41c978d73cab40023930f60992f';
    const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`;
    const headers = {
        'Authorization': `KakaoAK ${apiKey}`
    };

    fetch(url, { headers })
        .then(response => response.json())
        .then(data => {
            console.log('data', data); // 응답 데이터를 콘솔에 출력하여 확인
            const address = data.documents[0].address.address_name;
            document.getElementById("locationSectionLocation").innerText = address;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById("locationSectionLocation").innerText = "주소를 가져오지 못했습니다.";
        });
}

function getLocation() {
    if (navigator.geolocation) { 
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            getAddr(lat, lng);
        }, function(error) {
            console.error('Error:', error);
            alert('위치 정보를 가져오는 데 실패했습니다.');
        }, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: Infinity
        });
    } else {
        alert('현재 브라우저에서는 내 위치 찾기를 지원하지 않습니다');
    }
}

getLocation();