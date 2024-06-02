// 사용자의 현재 위치를 이용하여 주소를 가져오는 함수
function getAddr(lat, lng) {
    // 카카오 REST API 주소로 변환 요청
    const apiKey = 'f4d2a59470f17886675a8920005af295';
    const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`;
    const headers = {
        'Authorization': `KakaoAK ${apiKey}`
    };

    fetch(url, { headers })
        .then(response => response.json())
        .then(data => {
            console.log('사용자의 현재 주소:', data.documents[0].address.address_name);
            const address = data.documents[0].address.address_name;
            document.getElementById("locationSectionLocation").innerText = address;
            // 여기에 주소를 출력하는 등의 필요한 처리를 추가할 수 있습니다.
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById("locationSectionLocation").innerText = "주소를 가져오지 못했습니다.";
        });
}
