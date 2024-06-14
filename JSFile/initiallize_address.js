document.addEventListener('DOMContentLoaded', function () {
    currentLocation()
        .then(userPosition => {
            console.log('사용자의 현재 위치:', userPosition);
            getAddr(userPosition.lat, userPosition.lng);
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error);
        });
});